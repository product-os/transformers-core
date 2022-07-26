import * as skhema from 'skhema';
import { Contract, TransformerContract } from './types';

type TransformerSet = TransformerContract[];

export function matchTransformers(
	transformers: TransformerSet,
	previousContract: Contract<any> | null,
	currentContract: Contract<any>,
) {
	const isArtifactReady = currentContract.data?.$transformer?.artifactReady;
	const hasArtifactReadyChanged =
		previousContract?.data?.$transformer?.artifactReady !== isArtifactReady;

	return transformers.filter((transformer) => {
		if (!transformer.data.inputFilter) {
			return false;
		}
		const matchesCurrent = skhema.isValid(
			transformer.data.inputFilter,
			currentContract,
		);
		const matchesPrevious = skhema.isValid(
			transformer.data.inputFilter,
			previousContract || {},
		);

		// match transformer if inputFilter MATCHES CURRENT contract AND
		// artifact READY and artifact has CHANGED from previous
		const matchOnceWithArtifact = isArtifactReady && hasArtifactReadyChanged;
		// OR artifact NOT READY and was NOT MATCHED previously
		const matchOnceWithoutArtifact = !isArtifactReady && !matchesPrevious;

		return (
			matchesCurrent && (matchOnceWithArtifact || matchOnceWithoutArtifact)
		);
	});
}
