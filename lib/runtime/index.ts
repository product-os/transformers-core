import { Workspace } from '../workspace';
import { InputManifest, OutputManifest } from '../manifest';
export * from './container-runtime';

export interface TransformerRuntime {
	// runtimes that support input contract and artifact
	runTransformer(
		input: InputManifest,
		workspace: Workspace,
		imageRef: string,
		privileged: boolean,
		labels?: { [key: string]: string },
		logMeta?: object,
	): Promise<OutputManifest>;

	// runtimes that only support input contract
	runTransformer(
		input: InputManifest,
		logMeta?: object,
	): Promise<OutputManifest>;
}
