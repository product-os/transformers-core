import { Contract, ContractSource } from './contract';
import { MatchesSchema, matchesSchema } from 'spartan-schema';
import { EnumValue, Type } from './schema';

export type TransformerSet = TransformerContract[];

const TransformerSchema = {
	let: {
		Type,
		EnumValue,
	},
	schema: {
		type: ['enum', 'transformer'],
		typeVersion: ['enum', '1.0.0'],
		data: {
			transforms: ['ref', 'Type'],
			creates: ['optional', ['ref', 'Type']],
			finalize: 'boolean',
		},
	},
} as const;

export type TransformerType = MatchesSchema<typeof TransformerSchema>;

export const isTransformer: (value: unknown) => value is TransformerType =
	matchesSchema(TransformerSchema);

export type TransformerSource = ContractSource<TransformerType>;
export type TransformerContract = Contract<TransformerType>;
