import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { randomUUID } from 'crypto';
import { emptyDir } from './util';
import { Registry } from './registry';
import { InputManifest } from './input';

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
	registry: Registry,
	manifest: InputManifest<any>,
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
		// TODO: test if contract has artifact
		const pullResult = await registry.pull(
			manifest.transformer.slug,
			manifest.transformer.version,
		);
		if (pullResult.type === 'filesystem') {
			inputArtifactPath = pullResult.path;
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
