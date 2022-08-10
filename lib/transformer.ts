import { JSONSchema6 } from 'json-schema';
import { Contract, ContractData, ContractSource } from './contract';

export type TransformerSet = TransformerContract[];

export interface TransformerData extends ContractData {
	filter: JSONSchema6;
	autoFinalize: boolean;
	encryptedSecrets?: any;
}

export interface TransformerDefinition
	extends ContractSource<TransformerData> {}

export interface TransformerContract extends Contract<TransformerData> {}
