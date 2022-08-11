import { Contract, createContract } from './contract';
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
	return createContract({
		title: `Transform "${input.name}" using transformer "${transformer.name}"`,
		name: transformer.name,
		loop: transformer.loop,
		version: randomUUID(),
		type: 'task',
		typeVersion: '1.0.0',
		data: {
			status: 'pending',
			input,
			previousOutput,
			transformer,
			actor,
		},
	}) as TaskContract;
}
