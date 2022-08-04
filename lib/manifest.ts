import { TaskContract } from './task';
import { Contract, ContractDefinition } from './contract';
import { TransformerContract } from './transformer';

export interface InputManifest {
	input: Contract<any>;
	transformer: TransformerContract;
	artifactPath?: string;
	decryptedSecrets?: any;
	decryptedTransformerSecrets?: any;
}

export interface Result<TData> {
	contract: ContractDefinition<TData>;
	artifactPath?: string;
	imagePath?: string;
	manifestList?: string[];
}

export interface OutputManifest {
	results: Array<Result<any>>;
}

export function createInputManifest(task: TaskContract): InputManifest {
	return {
		input: task.data.input,
		transformer: task.data.transformer,
	};
}
