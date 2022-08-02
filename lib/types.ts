import type { JSONSchema6 } from 'json-schema';
import { ContractData, Contract, ContractDefinition } from './contract';

export interface ArtifactContract extends Contract<ArtifactData> {}
export interface TransformerContract extends Contract<TransformerData> {}

export interface BackflowMapping {
	downstreamValue?: Formula | any;
	upstreamPath: Formula | string;
}

export interface Formula {
	$$formula: string;
}

export type OutputManifest = {
	results: [
		{
			contract: ContractDefinition<ArtifactData>;
			artifactPath?: string;
			imagePath?: string;
			manifestList?: string[];
		},
	];
};

export interface ErrorData extends ArtifactData {
	message: string;
	code: string;
}

export interface ErrorContractDefinition
	extends ContractDefinition<ErrorData> {}

export interface ActorCredentials {
	slug: string;
	sessionToken: string;
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

export interface ArtifactData extends ContractData {
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
