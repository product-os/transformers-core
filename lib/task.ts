import {
	Contract,
	TaskContract,
	TaskContractDefinition,
	TransformerContract,
} from './types';
import { slugify } from './slugify';
import type TransformerRuntime from '@balena/transformer-runtime';
import { Workspace } from './workspace';

export function createTaskDefinition(
	actorId: string,
	inputContract: Contract<any>,
	transformer: TransformerContract,
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

export async function runTransformer(
	task: TaskContract,
	workspace: Workspace,
	runtime: TransformerRuntime,
	imageRef: string,
	labels: { [label: string]: string },
	privileged: boolean,
	logMeta: any,
) {
	return await runtime.runTransformer(
		workspace.inputArtifactDir,
		task.data.input,
		task.data.transformer,
		imageRef,
		workspace.inputDir,
		workspace.outputDir,
		privileged,
		labels,
		[],
		logMeta,
	);
}
