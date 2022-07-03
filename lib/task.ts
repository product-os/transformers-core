import {
	ArtifactContract,
	Contract,
	TaskContract,
	TaskContractDefinition,
	TransformerContract,
} from './types';
import { slugify } from './slugify';
import type TransformerRuntime from '@balena/transformer-runtime';

export interface TaskWorkspace {
	artifactDir: string;
	inputDir: string;
	outputDir: string;
	secondaryInput:
		| Array<{ contract: ArtifactContract; artifactDirectory: string }>
		| undefined;
}

export function createTaskContract(
	inputContract: Contract<any>,
	transformer: TransformerContract,
	actorId: string,
): TaskContractDefinition {
	const name = `Transform "${inputContract.name}" using transformer "${transformer.name}"`;
	return {
		name,
		handle: slugify(name),
		type: 'task@1.0.0',
		data: {
			status: 'pending',
			input: inputContract,
			transformer,
			actor: actorId,
			workerFilter: {
				schema: transformer.data.workerFilter,
			},
		},
	};
}

export async function runTask(
	task: TaskContract,
	workspace: TaskWorkspace,
	runtime: TransformerRuntime,
	imageRef: string,
	labels: { [label: string]: string },
	privileged: boolean,
	logMeta: any,
) {
	return await runtime.runTransformer(
		workspace.artifactDir,
		task.data.input,
		task.data.transformer,
		imageRef,
		workspace.inputDir,
		workspace.outputDir,
		privileged,
		labels,
		workspace.secondaryInput,
		logMeta,
	);
}
