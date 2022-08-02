import * as fs from 'fs';
import * as path from 'path';
import * as stream from 'stream';
import { promisify } from 'util';
import * as Docker from 'dockerode';
import fetch from 'node-fetch';
import { ActorCredentials } from './types';
import { TaskContract } from './task';
import { Contract } from './contract';
import { spawn, streamToString } from './util';

export const mimeType = {
	dockerManifest: 'application/vnd.docker.distribution.manifest.v2+json',
	ociManifest: 'application/vnd.oci.image.manifest.v1+json',
};

const pump = promisify(stream.pipeline); // Node 16 gives native pipeline promise... This is needed to properly handle stream errors

export interface RegistryAuthOptions {
	username: string;
	password: string;
}

export function createArtifactUri(registryUri: string, contract: Contract) {
	return `${registryUri}/${contract.slug}:${contract.version}`;
}

export async function pullTransformerImage(
	registry: Registry,
	credentials: ActorCredentials,
	task: TaskContract,
) {
	const imageURI = createArtifactUri(
		registry.registryUri,
		task.data.transformer,
	);
	return await registry.pullImage(imageURI, {
		username: credentials.slug,
		password: credentials.sessionToken,
	});
}

export class Registry {
	public readonly registryUri: string;
	public readonly docker: Docker;
	private readonly logger: any;
	// login cache to prevent unnecessary logins for the same user
	private dockerLogins = new Set<string>();

	constructor(logger: any, registryUri: string) {
		this.logger = logger;
		this.registryUri = registryUri;
		this.docker = new Docker();
	}

	public async pullImage(imageRef: string, authOpts: RegistryAuthOptions) {
		this.logger.info({ imageRef }, 'pulling image');
		const authconfig = this.getDockerAuthConfig(authOpts);
		const progressStream = await this.docker.pull(imageRef, { authconfig });
		await this.followDockerProgress(progressStream);
		return imageRef;
	}

	public async pushImage(
		imageRef: string,
		imagePath: string,
		authOpts: RegistryAuthOptions,
	) {
		this.logger.info({ imageRef }, 'pushing image');
		const image = await this.loadImage(imagePath);
		const { registry, repo, tag } = this.parseRef(imageRef);
		await image.tag({ repo: `${registry}/${repo}`, tag, force: true });
		const taggedImage = await this.docker.getImage(imageRef);
		const authconfig = this.getDockerAuthConfig(authOpts);
		const pushOpts = { registry, authconfig };
		this.logger.info({ image: taggedImage.id }, 'pushing image');
		const progressStream = await taggedImage.push(pushOpts);
		await this.followDockerProgress(progressStream);
	}

	private getDockerAuthConfig(authOpts: RegistryAuthOptions) {
		return {
			username: authOpts.username,
			password: authOpts.password,
			serveraddress: this.registryUri,
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

	public async pullArtifact(
		artifactReference: string,
		destDir: string,
		authOpts: RegistryAuthOptions,
	) {
		this.logger.info({ artifactReference }, 'pulling artifact');
		await fs.promises.mkdir(destDir, { recursive: true });
		try {
			const imageType = await this.getRefType(artifactReference, authOpts);
			// Check if the artifact is an image or a file (oras or docker)
			switch (imageType) {
				case mimeType.dockerManifest:
					// Pull image
					await this.pullImage(artifactReference, {
						username: authOpts.username,
						password: authOpts.password,
					});
					// Save to tar
					const destinationStream = fs.createWriteStream(
						path.join(destDir, 'artifact.tar'),
					);
					const imageStream = await this.docker
						.getImage(artifactReference)
						.get();
					await pump(imageStream, destinationStream);
					this.logger.info({ destDir }, 'wrote docker image');
					break;

				case mimeType.ociManifest:
					// Pull artifact
					const output = await this.runOrasCommand(
						['pull', artifactReference],
						authOpts,
						{ cwd: destDir },
					);

					const m = output.match(/Downloaded .* (.*)/);
					if (m?.[1]) {
						return m[1];
					} else {
						throw new Error(
							'[ERROR] Could not determine what was pulled from the registry',
						);
					}

				default:
					throw new Error(
						'unknown media type found for artifact ' +
							artifactReference +
							' : ' +
							imageType,
					);
			}
		} catch (e) {
			this.logErrorAndThrow(e);
		}
	}

	public async pushArtifact(
		artifactReference: string,
		artifactPath: string,
		authOpts: RegistryAuthOptions,
	) {
		this.logger.info({ artifactReference }, 'pushing artifact');
		try {
			const artifacts = await fs.promises.readdir(artifactPath);
			const orasCmd = ['push', artifactReference, ...artifacts];
			await this.runOrasCommand(orasCmd, authOpts, { cwd: artifactPath });
		} catch (e) {
			this.logErrorAndThrow(e);
		}
	}

	public async pushManifestList(
		artifactReference: string,
		manifestList: string[],
		authOpts: RegistryAuthOptions,
	) {
		const cmdOpts = this.isLocal() ? ['--insecure'] : [];
		const fqManifestList = manifestList.map(
			(img) => `${this.registryUri}/${img}`,
		);

		let fqArtifactReference = artifactReference;
		if (this.isLocal()) {
			const [_, repo] = artifactReference.split('/', 2);
			fqArtifactReference = `${this.registryUri}/${repo}`;
		}

		this.logger.info({ fqArtifactReference }, 'creating manifest list');
		await this.runDockerCliCommand(
			[
				'manifest',
				'create',
				...cmdOpts,
				fqArtifactReference,
				...fqManifestList,
			],
			authOpts,
		);

		this.logger.info({ fqArtifactReference }, 'pushing manifest list');
		await this.runDockerCliCommand(
			['manifest', 'push', ...cmdOpts, fqArtifactReference],
			authOpts,
		);
	}

	private async runDockerCliCommand(
		dockerArgs: string[],
		authOpts: RegistryAuthOptions,
		spawnOpts: any = {},
	) {
		this.logger.info({ dockerArgs }, 'running docker-CLI command');
		const run = async (args: string[], opts: any = {}) => {
			const result = await spawn('docker', args, opts);
			if (result.ok) {
				return {
					stdout: result.stdout.toString(),
					stderr: result.stderr.toString(),
				};
			} else {
				throw result.err;
			}
		};
		if (!this.dockerLogins.has(authOpts.username)) {
			const loginCmd = [
				'login',
				'--username',
				authOpts.username,
				'--password',
				authOpts.password,
				this.registryUri,
			];
			this.dockerLogins.add(authOpts.username);
			const { stdout, stderr } = await run(loginCmd, spawnOpts);
			this.logger.info({ stdout, stderr }, 'docker login');
		}
		return await run(dockerArgs, spawnOpts);
	}

	private async runOrasCommand(
		args: string[],
		authOpts: RegistryAuthOptions,
		spawnOptions: any = {},
	) {
		if (this.isLocal()) {
			// this is a local name. therefore we allow http
			args.push('--plain-http');
		}
		this.logger.info({ args: args.join(' ') }, 'running oras command');
		if (authOpts.username) {
			args.push(
				'--username',
				authOpts.username,
				'--password',
				authOpts.password,
			);
		}
		const result = await spawn('oras', args, spawnOptions);
		if (result.ok) {
			const output = result.stdout.toString();
			this.logger.info({ output }, 'oras finished');
			return output;
		} else {
			throw result.err;
		}
	}

	private logErrorAndThrow = (e: any) => {
		if (e.spawnargs) {
			this.logger.error(
				{ args: e.spawnargs, stderr: e.stderr.toString('utf8') },
				'error',
			);
		} else {
			this.logger.error(e, 'error');
		}
		throw e;
	};

	private async loadImage(imageFilePath: string) {
		const resultStream = await this.docker.loadImage(
			fs.createReadStream(imageFilePath),
		);
		const result = await streamToString(resultStream);

		// docker.load example output:
		// Loaded image: myApp/myImage
		// Loaded image ID: sha256:1247839245789327489102473
		const successfulLoadRegex = /Loaded image.*?: (\S+)\\n/i;
		const loadResultMatch = successfulLoadRegex.exec(result);
		if (!loadResultMatch) {
			throw new Error(`failed to load image : ${imageFilePath} .  ${result}`);
		}
		return this.docker.getImage(loadResultMatch[1]);
	}

	private async getRefType(
		ref: string,
		authOpts: RegistryAuthOptions,
	): Promise<string | null> {
		this.logger.info({ ref }, 'getting reference type');
		const { host, repo, tag } = this.parseRef(ref);
		const manifestURL = `${this.getProtocol()}://${host}/v2/${repo}/manifests/${tag}`;
		const authHeader = await this.checkForAuth(ref);
		const headers: { [key: string]: string } = {
			Accept: Object.values(mimeType).join(','),
		};
		if (authHeader) {
			const token = this.login(authHeader, authOpts);
			headers.Authorization = `Bearer ${token}`;
		}
		const manifestResp = await fetch(manifestURL, { headers });
		return manifestResp.headers.get('content-type');
	}

	private async checkForAuth(ref: string) {
		const protocol = this.isLocal() ? 'http' : 'https';
		const { host, repo, tag } = this.parseRef(ref);
		const manifestURL = `${protocol}://${host}/v2/${repo}/manifests/${tag}`;
		const tryResponse = await fetch(manifestURL);
		const authHeader = tryResponse.headers.get('www-authenticate');
		if (tryResponse.status !== 401 || !authHeader) {
			return false;
		} else {
			return authHeader;
		}
	}

	private async login(authHeader: string, authOpts: RegistryAuthOptions) {
		const { realm, service, scope } = this.parseAuthHeader(authHeader);
		const authUrl = new URL(realm);
		authUrl.searchParams.set('service', service);
		authUrl.searchParams.set('scope', scope);
		this.logger.info('got wwwAuthenticate for getting access token');
		// login with session user
		const loginResp = await fetch(authUrl.href, {
			headers: {
				Authorization:
					'Basic ' +
					Buffer.from(authOpts.username + ':' + authOpts.password).toString(
						'base64',
					), // basic auth
			},
		});
		const loginBody = await loginResp.json();
		if (!loginBody.token) {
			throw new Error(
				`couldn't log in for registry (status code ${loginResp.status})`,
			);
		}
		return loginBody.token;
	}

	private parseRef(ref: string) {
		return /^(?<host>[^/]+)\/(?<repo>.*):(?<tag>[^:]+)$/.exec(ref)?.groups!;
	}

	private isLocal() {
		return (
			!this.registryUri.includes('.') || this.registryUri.includes('.local')
		);
	}

	private getProtocol() {
		return this.isLocal() ? 'http' : 'https';
	}

	private parseAuthHeader(wwwAuthenticate: string) {
		return {
			realm: (/realm="([^"]+)/.exec(wwwAuthenticate) || [])[1],
			service: (/service="([^"]+)/.exec(wwwAuthenticate) || [])[1],
			scope: (/scope="([^"]+)/.exec(wwwAuthenticate) || [])[1],
		};
	}
}
