// import type { JSONSchema6 } from 'json-schema';
// import { ContractData, Contract, ContractDefinition } from './contract';

// export interface ErrorContractDefinition
// 	extends ContractDefinition<ErrorData> {}

export interface ActorCredentials {
	slug: string;
	sessionToken: string;
}

//
// export interface ErrorData extends ArtifactData {
// 	message: string;
// 	code: string;
// }

// export interface ArtifactContract extends Contract<ArtifactData> {}
//
// export interface ArtifactData extends ContractData {
// 	$transformer?: {
// 		artifactReady: boolean;
// 		baseSlug?: string;
// 		parentVersion?: string;
// 		slugSuffix?: string; // used to allow transformers customization of generated slugs. needed when creating multiple instances of same type
// 		encryptedSecrets?: any;
// 		backflow?: ArtifactContract[];
// 		repoData?: {
// 			org: string;
// 			repo: string;
// 			branch: string;
// 			commit: string;
// 		};
// 	};
// }
//
// export interface ArtifactContract extends Contract<ArtifactData> {}
