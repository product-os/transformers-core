import type { Contract, ContractDefinition } from '../../lib';
import { createSlug } from '../../lib';

export function contractFactory(
	loop: string,
	def: ContractDefinition<any> & { handle: string },
): Contract<any> {
	if (!def.handle) {
		throw Error('This contract factory requires definition with handle.');
	} else {
		return {
			id: '0',
			slug: createSlug(loop, def),
			tags: [],
			markers: [],
			created_at: '',
			active: true,
			requires: [],
			capabilities: [],
			...def,
		};
	}
}
