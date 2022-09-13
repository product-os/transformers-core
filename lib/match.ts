// import * as skhema from 'skhema';
import { Contract } from './contract';
import { TransformerSet } from './transformer';

export function matchTransformers(
	transformers: TransformerSet,
	previousContract: Contract<any> | null,
	currentContract: Contract<any>,
) {
	return transformers.filter((transformer) => {
		if (!transformer.data.transforms) {
			return false;
		}
		const matchesCurrent = transformer.data.transforms.includes(
			currentContract.type,
		);
		const matchesPrevious = previousContract
			? transformer.data.transforms.includes(previousContract.type)
			: false;
		return matchesCurrent && !matchesPrevious;
	});
}
