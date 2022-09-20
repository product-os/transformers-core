import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createHash, randomUUID } from 'crypto';
import { PassThrough, Readable } from 'stream';
import { pipeline } from 'stream/promises';
import * as tar from 'tar';
import * as Logger from 'bunyan';
import * as Docker from 'dockerode';
import {
	Manifest,
	ManifestOCI,
	MEDIATYPE_MANIFEST_V2,
	MEDIATYPE_OCI_MANIFEST_V1,
	parseIndex,
	parseRepo,
	parseRepoAndTag,
	RegistryClientV2,
	RegistryIndex,
} from 'oci-registry-client';
import { isDir, pathExists, streamToString } from './util';
import { ActorCredentials } from './actor';
import { isLocalhost } from 'oci-registry-client/build/common';
import { ExtendableError } from './util/error';
import { match } from 'ts-pattern';

const MEDIATYPE_OCI_CONFIG_FILE = 'vnd.balena.transformers.file.v1';
const MEDIATYPE_OCI_CONFIG_OBJECT = 'vnd.balena.transformers.object.v1';
const MEDIATYPE_OCI_CONFIG_DIRECTORY = 'vnd.balena.transformers.directory.v1';

class NoLayersError extends ExtendableError {}
class ImageLoadError extends ExtendableError {}
class UnexpectedArtifactTypeError extends ExtendableError {
	artifactType: string;
	constructor(artifactType: string) {
		super(`Artifact type "${artifactType}" not supported`);
		this.artifactType = artifactType;
	}
}
class ArtifactTypeUnsupportedError extends ExtendableError {
	artifactType: string;
	constructor(artifactType: string) {
		super(`Artifact type "${artifactType}" not supported`);
		this.artifactType = artifactType;
	}
}

export enum ArtifactType {
	image = 'image',
	filesystem = 'filesystem',
	object = 'object',
	unsupported = 'unsupported',
}

export type ImageReference = { type: ArtifactType.image; name: string };
export type FilesystemReference = {
	type: ArtifactType.filesystem;
	path: string;
};
export type ObjectReference = { type: ArtifactType.object; value: any };
export type ArtifactReference =
	| ImageReference
	| FilesystemReference
	| ObjectReference;

// helper function to load an image tar from path to local docker before push
export async function loadImage(imagePath: string) {
	if (!(await pathExists(imagePath))) {
		throw Error(`Image path does not exist: ${imagePath}`);
	}
	const stdout = await new Docker().loadImage(fs.createReadStream(imagePath));
	const result = await streamToString(stdout);
	// docker.load example output:
	// Loaded image: myApp/myImage
	// Loaded image ID: sha256:1247839245789327489102473
	const images = result.match(/Loaded image.*?: (\S+)\\n/i);
	if (!images) {
		throw new ImageLoadError(`failed to load image ${imagePath}: ${result}`);
	}
	return images[1];
}

/**
 * Registry implements public push, pull methods for handling image, filesystem and json objects.
 *
 * Uses docker cli via `dockerode` package to push and pull images, to benefit from dockers layer
 * caching and stable implementation.
 *
 * Use RegistryClientV2 from `oci-registry-client` package for push and pull filesystem and json.
 */
export class Registry {
	public readonly index: RegistryIndex;
	private readonly logger: Logger;
	private readonly credentials: ActorCredentials;
	private readonly docker: Docker;
	private client: RegistryClientV2 | null;

	static DEFAULT_PORT = '5000';

	constructor(
		logger: Logger,
		credentials: ActorCredentials,
		host: string,
		port?: string,
		scheme?: 'https' | 'http' | 'ssh',
	) {
		this.credentials = credentials;
		this.logger = logger;
		if (!scheme) {
			scheme = isLocalhost(host) ? 'http' : 'https';
		}
		this.index = parseIndex(`${scheme}://${host}${port ? ':' + port : ''}`);
		this.docker = new Docker();
		this.client = null;
	}

	/**
	 * Public methods
	 */

	async pull(
		repo: string,
		tag: string,
		assertType: ArtifactType.filesystem,
	): Promise<FilesystemReference>;
	async pull(
		repo: string,
		tag: string,
		assertType: ArtifactType.image,
	): Promise<ImageReference>;
	async pull(
		repo: string,
		tag: string,
		assertType: ArtifactType.object,
	): Promise<ObjectReference>;
	async pull(
		repo: string,
		tag: string,
		assertType?: ArtifactType,
	): Promise<ArtifactReference>;
	async pull(
		repo: string,
		tag: string,
		assertType: ArtifactType,
	): Promise<ArtifactReference> {
		const client = this.getRegistryClient(repo);
		const { manifest } = await client.getManifest({
			ref: tag,
			acceptManifestLists: true,
			acceptOCIManifests: true,
		});
		const type = this.getArtifactType(manifest);
		if (assertType && type !== assertType) {
			throw new UnexpectedArtifactTypeError(type);
		}
		if (type === ArtifactType.image) {
			return await this.pullImage(`${client.repo.canonicalName}:${tag}`);
		} else if (
			type === ArtifactType.filesystem ||
			type === ArtifactType.object
		) {
			return await this.pullArtifact(repo, tag, manifest as ManifestOCI, type);
		} else {
			throw new ArtifactTypeUnsupportedError(manifest.mediaType || 'undefined');
		}
	}

	async push(repo: string, tag: string, reference: ArtifactReference) {
		if (reference.type === 'image') {
			return await this.pushImage(repo, tag, reference);
		} else if (reference.type === 'object' || reference.type === 'filesystem') {
			return await this.pushArtifact(repo, tag, reference);
		} else {
			throw new ArtifactTypeUnsupportedError(
				(reference as any).type || 'undefined',
			);
		}
	}

	/**
	 * Private methods
	 */

	private getArtifactType(manifest: Manifest): ArtifactType {
		return match(manifest)
			.with({ mediaType: MEDIATYPE_MANIFEST_V2 }, () => ArtifactType.image)
			.with(
				{
					mediaType: MEDIATYPE_OCI_MANIFEST_V1,
					config: { mediaType: MEDIATYPE_OCI_CONFIG_FILE },
				},
				() => ArtifactType.filesystem,
			)
			.with(
				{
					mediaType: MEDIATYPE_OCI_MANIFEST_V1,
					config: { mediaType: MEDIATYPE_OCI_CONFIG_DIRECTORY },
				},
				() => ArtifactType.filesystem,
			)
			.with(
				{
					mediaType: MEDIATYPE_OCI_MANIFEST_V1,
					config: { mediaType: MEDIATYPE_OCI_CONFIG_OBJECT },
				},
				() => ArtifactType.object,
			)
			.otherwise(() => ArtifactType.unsupported);
	}

	private async pullArtifact(
		repo: string,
		tag: string,
		manifest: ManifestOCI,
		type: ArtifactType,
	): Promise<ObjectReference | FilesystemReference> {
		const client = this.getRegistryClient(repo);
		if (manifest.layers.length === 0) {
			throw new NoLayersError(
				`No layers found for ${client.repo.canonicalName}:${tag}`,
			);
		}
		const { mediaType, digest, annotations } = manifest.layers[0];
		const { stream } = await client.createBlobReadStream({ digest });
		if (type === ArtifactType.object) {
			return {
				type: ArtifactType.object,
				value: JSON.parse(await streamToString(stream)),
			};
		} else if (mediaType === 'application/gzip') {
			const extractPath = await fs.promises.mkdtemp(
				path.join(os.tmpdir(), path.sep),
			);
			await pipeline(stream, tar.extract({ cwd: extractPath }));
			// if file then return path to file using title
			const title =
				annotations?.['org.opencontainers.image.title'] || 'undefined';
			if (manifest.config.mediaType === MEDIATYPE_OCI_CONFIG_FILE) {
				return {
					type: ArtifactType.filesystem,
					path: path.join(extractPath, title),
				};
			} else {
				return { type: ArtifactType.filesystem, path: extractPath };
			}
		} else {
			throw new ArtifactTypeUnsupportedError(type);
		}
	}

	private async pullImage(canonicalRef: string): Promise<ImageReference> {
		this.logger.info({ canonicalRef }, 'pulling image');
		const authconfig = this.getDockerAuthConfig();
		const progressStream = await this.docker.pull(canonicalRef, { authconfig });
		await this.followDockerProgress(progressStream);
		return { type: ArtifactType.image, name: canonicalRef };
	}

	private async pushImage(repo: string, tag: string, source: ImageReference) {
		const { index, canonicalName, canonicalRef } = parseRepoAndTag(
			`${repo}:${tag}`,
			this.index,
		);
		let image = await this.docker.getImage(source.name);
		if (source.name !== `${canonicalName}:${tag}`) {
			await image.tag({ repo: canonicalName, tag, force: true });
			image = await this.docker.getImage(canonicalRef);
		}
		const authconfig = this.getDockerAuthConfig();
		const pushOpts = { registry: index.name, authconfig };
		const progressStream = await image.push(pushOpts);
		this.logger.info({ image: image.id }, 'pushed image');
		await this.followDockerProgress(progressStream);
	}

	private async pushArtifact(
		repo: string,
		tag: string,
		reference: ArtifactReference,
	) {
		// const emptyConfigDigest = createHash('sha256').setEncoding('hex').read();
		const { title, stream, artifactMediaType, layerMediaType } =
			await this.readArtifact(reference);
		// push artifact blob
		const { digest, size } = await this.pushBlob(repo, stream);
		// build manifest and push
		const manifest: ManifestOCI = {
			schemaVersion: 2,
			mediaType: 'application/vnd.oci.image.manifest.v1+json',
			config: {
				mediaType: artifactMediaType,
				digest,
				size,
			},
			layers: [
				{
					mediaType: layerMediaType,
					digest,
					size,
					...(title
						? { annotations: { 'org.opencontainers.image.title': title } }
						: undefined),
				},
			],
		};
		const client = this.getRegistryClient(repo);
		return await client.putManifest({
			manifestData: Buffer.from(JSON.stringify(manifest)),
			ref: tag,
			mediaType: manifest.mediaType,
		});
	}

	private async readArtifact(reference: ArtifactReference) {
		if (reference.type === ArtifactType.filesystem) {
			if (!(await pathExists(reference.path))) {
				throw Error(`Artifact path does not exist: ${reference.path}`);
			}
			if (await isDir(reference.path)) {
				return {
					title: path.basename(reference.path),
					stream: tar.create({ cwd: reference.path, gzip: true }, ['.']),
					artifactMediaType: MEDIATYPE_OCI_CONFIG_DIRECTORY,
					layerMediaType: 'application/gzip',
				};
			} else {
				// await tar.create({ cwd: path.dirname(reference.path), gzip: true, file: '/tmp/something.tar.gzip'}, [path.basename(reference.path)])
				return {
					title: path.basename(reference.path),
					stream: tar.create(
						{ cwd: path.dirname(reference.path), gzip: true },
						[path.basename(reference.path)],
					),
					artifactMediaType: MEDIATYPE_OCI_CONFIG_FILE,
					layerMediaType: 'application/gzip',
				};
			}
		} else if (reference.type === ArtifactType.object) {
			const stream = new Readable();
			stream.push(JSON.stringify(reference.value));
			stream.push(null);
			return {
				title: undefined,
				stream,
				artifactMediaType: MEDIATYPE_OCI_CONFIG_OBJECT,
				layerMediaType: 'application/json',
			};
		} else {
			throw new ArtifactTypeUnsupportedError(reference.type);
		}
	}

	private async pushBlob(
		repo: string,
		stream: NodeJS.ReadableStream,
		contentType?: string,
	) {
		const hash = createHash('sha256');
		hash.setEncoding('hex');
		const cachePath = path.join(os.tmpdir(), path.sep, randomUUID());
		const hashPipe = new PassThrough();
		const writePipe = new PassThrough();
		stream.pipe(hashPipe);
		stream.pipe(writePipe);
		await pipeline(hashPipe, hash);
		await pipeline(writePipe, fs.createWriteStream(cachePath));
		const digest = 'sha256:' + hash.read();
		const size = (await fs.promises.stat(cachePath)).size;
		const client = this.getRegistryClient(repo);
		await client.blobUpload({
			digest,
			stream: fs.createReadStream(cachePath),
			contentLength: size,
			contentType,
		});
		return {
			digest,
			size,
		};
	}

	private getRegistryClient(repo: string) {
		// new repo if not initialized
		if (!this.client) {
			this.client = new RegistryClientV2({
				repo: parseRepo(repo, this.index),
				username: this.credentials.username,
				password: this.credentials.token,
				scheme: this.index.scheme,
			});
		}
		// update repo if changed
		if (this.client.repo.remoteName !== repo) {
			this.client.repo = parseRepo(repo, this.index);
		}
		return this.client;
	}

	private getDockerAuthConfig() {
		return {
			username: this.credentials.username,
			password: this.credentials.token,
			serveraddress: `${this.index.scheme}://${this.index.name}`,
		};
	}

	private async followDockerProgress(progressStream: NodeJS.ReadableStream) {
		return new Promise((resolve, reject) =>
			this.docker.modem.followProgress(
				progressStream,
				(err: Error | null) => (err ? reject(err) : resolve(null)),
				(line: any) => {
					if (line.progress || line.progressDetail) {
						// Progress bar's just spam the logs
						return;
					}
					this.logger.info({ line }, 'docker');
					if (line.error) {
						// For some reason not all errors appear in the error callback above
						reject(line);
					}
				},
			),
		);
	}
}
