export interface ContractData {
	[k: string]: unknown;
}

/**
 * ContractDefinition is the bare minimum contract that humans work with, contextual and optional fields may be omitted
 */
export interface ContractDefinition<TData = ContractData> {
	/**
	 * Optional human descriptors, not used as keys
	 */
	name?: string;
	description?: string;
	/**
	 * Human's must set the `type`, `typeVersion` and `version`, versioning tools may set the `version` on behalf of the human.
	 */
	version: string;
	type: string;
	/**
	 * Semver range
	 */
	typeVersion: string;
	repo?: string;
	loop?: string;
	/**
	 * The data associated with this contract.
	 */
	data?: TData & { hasArtifact?: boolean };
	/**
	 * A list of requirements/dependencies for this contract.
	 */
	requires?: Array<{
		[k: string]: unknown;
	}>;
	/**
	 * A list of capabilities for this contract.
	 */
	capabilities?: Array<{
		[k: string]: unknown;
	}>;
}

/**
 * Contract makes ContractDefinition optional fields requires.
 */
export interface Contract<TData = ContractData>
	extends ContractDefinition<TData> {
	type: string;
	repo: string;
	loop: string;
	slug: string;
	typeVersion: string;
	version: string;
	data: TData & { hasArtifact?: boolean };
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

export function createSlug({
	loop,
	repo,
	type,
	version,
}: {
	loop: string;
	repo: string;
	type: string;
	version: string;
}) {
	return `${loop}/${repo}/${type}:${version}`;
}
