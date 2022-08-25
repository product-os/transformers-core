import { Workspace } from '../workspace';
import { InputManifest } from '../input';
import { OutputManifest } from '../output';
export * from './container-runtime';

export interface TransformerRuntime {
	// runtimes that support input contract and artifact
	runTransformer(
		input: InputManifest<any>,
		workspace: Workspace,
		imageRef: string,
		privileged: boolean,
		labels?: { [key: string]: string },
		logMeta?: object,
	): Promise<OutputManifest>;

	// runtimes that only support input contract
	runTransformer(
		input: InputManifest<any>,
		logMeta?: object,
	): Promise<OutputManifest>;
}
