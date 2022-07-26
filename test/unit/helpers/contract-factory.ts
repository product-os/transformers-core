import type { Contract } from '../../../lib';

export function contractFactory<Data = any>(
	slug: string,
	version: string,
	type: string,
	data: any,
): Contract<Data> {
	return {
		id: '0',
		slug,
		version,
		type,
		data,
		tags: [],
		markers: [],
		created_at: '',
		active: true,
		requires: [],
		capabilities: [],
	};
}
