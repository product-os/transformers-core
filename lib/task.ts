// import {Contract, ContractSource, ContractType, createContract, ContractImported} from './contract';
import { randomUUID } from 'crypto';
import { TransformerContract } from './transformer';
import {
	Contract,
	ContractType,
	ContractSource,
	createContract,
} from './contract';
import { InputManifest } from './input';

export enum TaskStatus {
	Pending = 'pending',
	Complete = 'compete',
}

export interface TaskType extends ContractType {
	data: {
		input: Contract<any>;
		previousOutput?: Array<Contract<any>>;
		transformer: TransformerContract;
		status: TaskStatus;
	};
	type: 'task';
	typeVersion: '1.0.0';
}

export type TaskSource = ContractSource<TaskType>;
export type TaskContract = Contract<TaskType>;

export function createTaskContract(
	input: Contract<any>,
	transformer: TransformerContract,
	previousOutput?: Array<Contract<any>>,
): TaskContract {
	return createContract<TaskType>({
		title: `Transform "${input.name}" using transformer "${transformer.name}"`,
		type: 'task',
		name: transformer.name,
		loop: transformer.loop,
		version: randomUUID(),
		typeVersion: '1.0.0',
		data: {
			status: TaskStatus.Pending,
			input,
			previousOutput,
			transformer,
		},
	});
}

export function createInputManifestFromTask<Type extends ContractType>(
	task: TaskContract,
): InputManifest<Type> {
	return {
		input: task.data.input,
		transformer: task.data.transformer,
	};
}
