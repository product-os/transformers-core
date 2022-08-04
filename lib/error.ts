import { Contract } from './contract';
import { TransformerContract } from './transformer';
import { OutputManifest } from './manifest';

export interface ErrorContract extends Contract {
	data: {
		message: string;
		code: string;
		transformer: TransformerContract;
		input: Contract<any>;
		outTail: string;
		errTail: string;
		outputManifest?: OutputManifest;
	};
}
