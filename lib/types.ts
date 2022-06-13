import {
	Contract as RawContract,
	ContractData,
} from '@balena/jellyfish-types/build/core';
import type { JSONSchema6 } from 'json-schema';

export { ContractData };

// TODO: rename to manifest and remove nested input prop
export interface InputManifest<InputContract extends Contract = Contract> {
	input: {
		contract: InputContract;
		transformerContract: TransformerContract;
		artifactPath: string; // relative to the input file
		decryptedSecrets?: {
			[key: string]: string;
		};
		decryptedTransformerSecrets?: {
			[key: string]: string;
		};
	};
}

// TODO: remove when handle is upstream
export interface ContractDefinition<TData = ContractData> {
	handle: string;
	type: string;
	data: TData;
	name?: string;
}

// TODO: remove when handle is upstream
export interface Contract<TData = ContractData> extends RawContract<TData> {
	handle?: string;
}

// TODO: rename to Output
export interface Results {
	results: Result[];
}

export interface Result<
	ResultContract extends ContractDefinition = ContractDefinition,
> {
	contract: ResultContract;
	artifactPath?: string; // relative to the results file
	imagePath?: string; // relative to the results file
}

export interface TransformerData {
	data: {
		requirements?: {
			os?: string;
			architecture?: string;
		};
		inputFilter?: JSONSchema6;
		workerFilter?: JSONSchema6;
	};
}

export interface TransformerContractDefinition
	extends Omit<ContractDefinition, 'data'>,
		TransformerData {}

export interface TransformerContract
	extends Omit<Contract, 'data'>,
		TransformerData {}
