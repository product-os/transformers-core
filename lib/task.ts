import { ArtifactContract, TransformerContract } from './types';
import { slugify } from './slugify';
import { JSONSchema6 } from 'json-schema';
import { Contract, ContractData, ContractDefinition } from './contract';

export interface TaskDefinitionData {
	actor: string;
	input: {
		id: string;
	};
	status: string;
	transformer: {
		id: string;
	};
	workerFilter: {
		schema: JSONSchema6 | undefined;
	};
}

export interface TaskData extends ContractData {
	actor: string;
	input: ArtifactContract;
	transformer: TransformerContract;
}

export interface TaskContract extends Contract<TaskData> {}

export interface TaskDefinition
	extends ContractDefinition<TaskDefinitionData> {}

export function createTaskDefinition(
	actorId: string,
	input: Contract<any>,
	transformer: TransformerContract,
): TaskDefinition & { handle: string } {
	const name = `Transform "${input.name}" using transformer "${transformer.name}"`;
	return {
		name,
		handle: slugify(name),
		version: '1.0.0',
		type: 'task@1.0.0',
		data: {
			status: 'pending',
			input,
			transformer,
			actor: actorId,
			workerFilter: {
				schema: transformer.data?.workerFilter,
			},
		},
	};
}
