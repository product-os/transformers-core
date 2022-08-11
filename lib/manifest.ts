import { TaskContract } from './task';
import { Contract, ContractSource } from './contract';
import { TransformerContract } from './transformer';

export interface InputManifest {
	input: Contract<any>;
	transformer: TransformerContract;
	artifactPath?: string;
	decryptedSecrets?: any;
	decryptedTransformerSecrets?: any;
}

export interface Result<TData> {
	contract: ContractSource<TData>;
	artifactPath?: string;
	imagePath?: string;
	manifestList?: string[];
}

export type Results = Array<Result<any>>;

export interface OutputManifest {
	results: Array<Result<any>>;
}

export function createInputManifest(task: TaskContract): InputManifest {
	return {
		input: task.data.input,
		transformer: task.data.transformer,
	};
}
