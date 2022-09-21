import { Contract } from './contract';
import { TransformerSet } from './transformer';

export function matchTransformers(
	transformers: TransformerSet,
	contract: Contract<any>,
) {
	return transformers.filter((transformer) => {
		if (!transformer.data.transforms) {
			return false;
		}
		return equals(transformer.data.transforms, contract);
	});
}
