export const EnumValue = [
	'oneof',
	null,
	'boolean',
	'number',
	'string',
] as const;
export const Type = [
	'oneof',
	[
		'enum',
		null,
		'null',
		'boolean',
		'integer',
		'float',
		'number',
		'string',
		'date',
		'binary',
	],
	['array', ['enum', 'enum'], ['ref', 'EnumValue'], ['ref', 'EnumValue']],
	['array', ['enum', 'oneof'], ['ref', 'Type'], ['ref', 'Type']],
	['array', ['enum', 'tuple'], ['ref', 'Type'], ['ref', 'Type']],
	['array', ['enum', 'array'], ['ref', 'Type'], ['ref', 'Type']],
	['tuple', ['enum', 'dictionary'], ['ref', 'Type']],
	['tuple', ['enum', 'ref'], 'string'],
	[
		'dictionary',
		[
			'oneof',
			['tuple', ['enum', 'optional'], ['ref', 'Type']],
			['ref', 'Type'],
		],
	],
] as const;
