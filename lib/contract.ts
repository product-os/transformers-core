export interface ContractData {
	[k: string]: unknown;
}

/**
 * ContractSource is a contract as defined in source code authored by users. Since users must define it, the
 * requirements should be as minimal as possible only `type`, `version`, and `typeVersion` are required.
 *
 * The `name` and `loop` field are not required, they are inferred from the repo origin `owner` and `name` respectively.
 *
 * Versioning tools may be used to add and maintain the version fields.
 */
export interface ContractSource<TData = ContractData> {
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
	version: string;
	type: string;
	typeVersion: string;
	/**
	 * The data associated with this contract.
	 */
	data?: TData;
	/**
	 * A list of requirements/dependencies for this contract.
	 */
	requires?: Array<{ [k: string]: unknown }> | string[];
	/**
	 * A list of providers/interfaces for this contract.
	 */
	provides?: Array<{ [k: string]: unknown }> | string[];
}

/**
 * Represents a contract that has been imported from source, requires identity fields inferred from source are set.
 */
export interface ContractImported<TData = ContractData>
	extends ContractSource<TData> {
	name: string;
	loop: string;
	data: TData;
}

/**
 * Contract must be fully qualified. All functional fields are required. Decorator fields title and description are not
 * required.
 */
export interface Contract<TData = ContractData>
	extends ContractImported<TData> {
	slug: string;
	requires: Array<{ [k: string]: unknown }> | string[];
	provides: Array<{ [k: string]: unknown }> | string[];
}

// TODO: allow for type parameters to remove `any`
export function createContractImported(
	loop: string,
	name: string,
	source: ContractSource<any>,
): ContractImported<any> {
	return {
		name,
		loop,
		data: source.data || {},
		...source,
	};
}

// TODO: allow for type parameters to remove `any`
export function createContract(imported: ContractImported<any>): Contract<any> {
	return {
		slug: createSlug(imported),
		requires: imported.requires || [],
		provides: imported.provides || [],
		...imported,
	};
}

function createSlug({
	loop,
	name,
	type,
	version,
}: {
	loop: string;
	name: string;
	type: string;
	version: string;
}) {
	return `${loop}/${name}/${type}:${version}`;
}
