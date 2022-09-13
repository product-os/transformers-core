import { Contract, ContractSource, ContractType } from './contract';

export type TransformerSet = TransformerContract[];

export interface TransformerType extends ContractType {
	type: 'transformer';
	typeVersion: '1.0.0';
	data: {
		creates?: string[];
		transforms: string[];
	};
}

export type TransformerSource = ContractSource<TransformerType>;
export type TransformerContract = Contract<TransformerType>;
