import { ContractSource, ContractType } from './contract';

export interface Result<Type extends ContractType> {
	contract: ContractSource<Type>;
	artifactPath?: string;
	imagePath?: string;
	manifestList?: string[];
}

export type Results = Array<Result<any>>;

export interface OutputManifest {
	results: Array<Result<any>>;
}
