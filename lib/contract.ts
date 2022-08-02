import {
	ContractData,
	Contract as RawContract,
} from 'autumndb/build/types/contract';

export { ContractData };

/**
 * ContractDefinition is a human writable and readable contract.
 *
 * A human-readable contract must contain the `type` and `version`, versioning tools may set the `version` on behalf of the human.
 *
 * Note: AutumnDB's `ContractDefinition` sets all fields to optional, transformers require that a contract definition
 * has at least `type` and `version`.
 */
export interface ContractDefinition<TData = ContractData> {
	name?: string;
	description?: string;
	handle?: string;
	loop?: string;
	type: string;
	version: string;
	data: TData;
}

export interface Contract<TData = ContractData> extends RawContract<TData> {
	name?: string;
	handle: string;
}

export function createSlug(loop: string, def: ContractDefinition<any>) {
	if (!def.handle) {
		throw Error('`handle` field is required to create a slug.');
	}
	return `${loop}/${def.type}/${def.handle}`;
}

export function hasArtifact(contract: Contract<any>) {
	return contract.data.$transformer?.artifactReady;
}
