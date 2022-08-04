import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { randomUUID } from 'crypto';
import { emptyDir } from './util';
import { createArtifactUri, Registry } from './registry';
import { InputManifest } from './manifest';
import { ActorCredentials } from './actor';

export interface Workspace {
	inputDir: string;
	inputManifestPath: string;
	inputArtifactPath: string;
	outputDir: string;
}

export interface WorkspaceOptions {
	basePath?: string;
	cachedArtifactPath?: string;
}

export async function prepareWorkspace(
	credentials: ActorCredentials,
	registry: Registry,
	manifest: InputManifest,
	opts: WorkspaceOptions,
): Promise<Workspace> {
	const basePath = opts.basePath || os.tmpdir();
	const uuid = randomUUID();
	const inputDir = await emptyDir(path.join(basePath, uuid, 'input'));
	const inputManifestPath = path.join(inputDir, 'manifest.json');
	await fs.promises.writeFile(
		inputManifestPath,
		JSON.stringify(manifest, null, 4),
		'utf8',
	);
	let inputArtifactPath;
	if (opts.cachedArtifactPath) {
		inputArtifactPath = opts.cachedArtifactPath;
	} else {
		inputArtifactPath = await emptyDir(path.join(inputDir, 'artifact'));
		if (manifest.input.data.hasArtifact) {
			const artifactUri = createArtifactUri(
				registry.registryUri,
				manifest.transformer,
			);
			await registry.pullArtifact(artifactUri, inputArtifactPath, {
				username: credentials.slug,
				password: credentials.sessionToken,
			});
		}
	}
	const outputDir = await emptyDir(path.join(basePath, uuid, 'output'));
	return {
		inputDir,
		inputManifestPath,
		inputArtifactPath,
		outputDir,
	};
}
