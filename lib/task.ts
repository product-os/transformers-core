import { Contract, createSlug } from './contract';
import { randomUUID } from 'crypto';
import { TransformerContract } from './transformer';

export interface TaskData {
	actor: string;
	input: Contract<any>;
	previousOutput?: Contract<any>;
	transformer: TransformerContract;
	status: 'pending' | 'complete';
}

export interface TaskContract extends Contract<TaskData> {
	type: 'task';
}

export function createTask(
	actor: string,
	input: Contract<any>,
	transformer: TransformerContract,
	previousOutput?: Contract<any>,
): TaskContract {
	// TODO: generic solution for inbuilt/null loop
	const loop = 'product-os';
	const repo = input.repo;
	const type = 'task';
	const version = randomUUID();

	return {
		slug: createSlug({ loop, repo, type, version }),
		name: `Transform "${input.name}" using transformer "${transformer.name}"`,
		repo,
		loop,
		version,
		type,
		typeVersion: '^1.0.0',
		data: {
			status: 'pending',
			input,
			previousOutput,
			transformer,
			actor,
		},
		provides: [],
		requires: [],
	};
}
