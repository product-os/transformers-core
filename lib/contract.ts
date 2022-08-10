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
	requires?:
		| Array<{
				[k: string]: unknown;
		  }>
		| string[];
	/**
	 * A list of capabilities for this contract.
	 */
	capabilities?:
		| Array<{
				[k: string]: unknown;
		  }>
		| string[];
}

/**
 * Contract must be fully qualified. All fields are required.
 */
export interface Contract<TData = ContractData> extends ContractSource<TData> {
	name: string;
	type: string;
	loop: string;
	slug: string;
	typeVersion: string;
	version: string;
	data: TData;
	requires: Array<{
		[k: string]: unknown;
	}>;
	provides: Array<{
		[k: string]: unknown;
	}>;
}

type MakeOptional<Type, Key extends keyof Type> = Omit<Type, Key> &
	Partial<Pick<Type, Key>>;

// TODO: remove any
export function contractFactory(
	fields: MakeOptional<Contract, 'slug' | 'requires' | 'provides'>,
): Contract<any> {
	return {
		slug: fields.slug || createSlug(fields),
		requires: fields.requires || [],
		provides: fields.provides || [],
		...fields,
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
