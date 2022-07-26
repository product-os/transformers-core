import { Contract } from './types';

export function hasArtifact(contract: Contract<any>) {
	return contract.data.$transformer?.artifactReady;
}
