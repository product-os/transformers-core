import { JSONSchema6 } from 'json-schema';
import { Contract, ContractSource, ContractType } from './contract';

export type TransformerSet = TransformerContract[];

export interface TransformerType extends ContractType {
	type: 'transformer';
	typeVersion: '1.0.0';
	data: {
		filter: JSONSchema6;
		autoFinalize: boolean;
		encryptedSecrets?: any;
	};
}

export type TransformerSource = ContractSource<TransformerType>;
export type TransformerContract = Contract<TransformerType>;
