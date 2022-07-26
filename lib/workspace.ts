import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { TaskContract } from './types';
import { F_OK } from 'constants';

export interface Workspace {
	inputDir: string;
	inputArtifactDir: string;
	outputDir: string;
}

export async function prepareWorkspace(task: TaskContract): Promise<Workspace> {
	const basePath = path.join(os.tmpdir(), path.sep);
	const inputDir = await emptyDir(
		path.join(basePath, 'input', `task-${task.id}`),
	);
	const inputArtifactDir = await emptyDir(path.join(inputDir, 'artifact'));
	const outputDir = await emptyDir(
		path.join(basePath, 'output', `task-${task.id}`),
	);
	return {
		inputDir,
		inputArtifactDir,
		outputDir,
	};
}

export async function pathExists(p: string) {
	try {
		await fs.promises.access(p, F_OK);
		return true;
	} catch {
		return false;
	}
}

export async function emptyDir(p: string) {
	if (await pathExists(p)) {
		await fs.promises.rm(p, { recursive: true, force: true });
	}
	await fs.promises.mkdir(p, { recursive: true });
	return p;
}
