import * as skhema from 'skhema';
import { Contract } from './contract';
import { TransformerSet } from './transformer';

export function matchTransformers(
	transformers: TransformerSet,
	previousContract: Contract<any> | null,
	currentContract: Contract<any>,
) {
	return transformers.filter((transformer) => {
		if (!transformer.data.filter) {
			return false;
		}
		const matchesCurrent = skhema.isValid(
			transformer.data.filter,
			currentContract,
		);
		const matchesPrevious = skhema.isValid(
			transformer.data.filter,
			previousContract || {},
		);
		return matchesCurrent && !matchesPrevious;
	});
}
