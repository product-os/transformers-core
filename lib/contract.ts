import * as fs from 'fs';
import * as yaml from 'js-yaml';

export type ContractType = {
	/**
	 * Optional human descriptors, not used as keys
	 */
	title?: string;
	description?: string;
	/**
	 * If contract is defined in a source repo: when the contract is imported the `name` and `loop` will be set to the
	 * org and repo value respectively.
	 */
	name?: string;
	loop?: string;
	/**
	 * If contract is defined in a source repo: users must define the `type`, `typeVersion` and `version`. The `version`
	 * may be set by versioning tools on behalf of the user.
	 */
	version?: string;
	type?: string;
	typeVersion?: string;
	/**
	 * The data associated with this contract.
	 */
	// data?: Data;
	/**
	 * A list of providers/interfaces for this contract.
	 */
	// provides?: Provides;

	// states?: States;

	slug?: string;
	/**
	 * A list of requirements/dependencies for this contract.
	 */
	// requires?: Requires;
	requires?: Array<{ [k: string]: unknown }> | string[];
	provides?: Array<{ [k: string]: unknown }> | string[];
	data?: {
		[key: string]: any;
	};
};

export type ContractSource<TContractType extends ContractType> = TContractType &
	Required<Pick<ContractType, 'type' | 'version' | 'data'>>;

export type Contract<TContractType extends ContractType> = TContractType &
	Required<
		Pick<
			ContractType,
			| 'type'
			| 'version'
			| 'requires'
			| 'name'
			| 'loop'
			| 'slug'
			| 'provides'
			| 'data'
		>
	>;

export function createContract<ContactType extends ContractType>(
	from: ContractSource<ContactType> &
		Required<Pick<ContractType, 'name' | 'loop'>>,
): Contract<ContactType> {
	return {
		...from,
		slug: createSlug(from),
		requires: from.requires || [],
		provides: from.provides || [],
	};
}

export function createSlug({
	loop,
	name,
	type,
}: {
	loop: string;
	name: string;
	type: string;
}) {
	return `${loop}/${name}/${type}`;
}

export async function readContractSource<TContractType extends ContractType>(
	sourcePath: string,
) {
	return yaml.load(
		fs.readFileSync(sourcePath).toString(),
	) as ContractSource<TContractType>;
}
