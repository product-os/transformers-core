import { Contract, ContractType } from './contract';
import { TransformerContract } from './transformer';

export interface InputManifest<Type extends ContractType> {
	input: Contract<Type>;
	transformer: TransformerContract;
	artifactPath?: string;
	decryptedSecrets?: any;
	decryptedTransformerSecrets?: any;
}
