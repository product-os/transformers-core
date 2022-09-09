import { Contract } from './contract';
import { TransformerSet } from './transformer';
import { matchesSchema } from 'spartan-schema';

export function matchTransformers(
	transformers: TransformerSet,
	contract: Contract<any>,
) {
	return transformers.filter((transformer) => {
		if (!transformer?.data?.transforms) {
			return false;
		}
		const isMatch = matchesSchema({ schema: transformer.data.transforms });
		return isMatch(contract);
	});
}
