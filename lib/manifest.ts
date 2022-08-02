import { ArtifactContract, TransformerContract } from './types';
import { TaskContract } from './task';

export type InputManifest = {
	contract: ArtifactContract;
	transformer: TransformerContract;
	artifactPath?: string;
	decryptedSecrets?: any;
	decryptedTransformerSecrets?: any;
};

export function createInputManifest(task: TaskContract): InputManifest {
	return {
		contract: task.data.input,
		transformer: task.data.transformer,
	};
}
