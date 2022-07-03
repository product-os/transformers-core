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

export interface Formula {
	$$formula: string;
}

export interface BackflowMapping {
	downstreamValue?: Formula | any;
	upstreamPath: Formula | string;
}

export interface TransformerData extends ContractData {
	inputFilter: JSONSchema6;
	inputType?: 'contract-only' | 'full';
	workerFilter?: JSONSchema6;
	requirements?: {
		os?: string;
		architecture?: string;
	};
	backflowMapping: [BackflowMapping];
	encryptedSecrets?: any;
	expectedOutputTypes?: string[];
}

export interface TransformerContractDefinition
	extends ContractDefinition<TransformerData> {}

export interface TransformerContract extends Contract<TransformerData> {}

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

interface TaskData extends ContractData {
	actor: string;
	input: ArtifactContract;
	transformer: TransformerContract;
}

export interface TaskContract extends Contract<TaskData> {}

export interface TaskContractDefinition
	extends ContractDefinition<TaskDefinitionData> {}

interface ArtifactData extends ContractData {
	$transformer?: {
		artifactReady: boolean;
		baseSlug?: string;
		parentVersion?: string;
		slugSuffix?: string; // used to allow transformers customization of generated slugs. needed when creating multiple instances of same type
		encryptedSecrets?: any;
		backflow?: ArtifactContract[];
		repoData?: {
			org: string;
			repo: string;
			branch: string;
			commit: string;
		};
	};
}
export interface ArtifactContract extends Contract<ArtifactData> {}
