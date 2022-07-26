/***
 * Adapted from https://github.com/ahmadnassri/node-spawn-promise
 *
 * Consider replacing with an idiomatic spawn promise package
 */

import { spawn } from 'child_process';

class ExtendableError extends Error {
	constructor(input: any) {
		const isError =
			Object.prototype.toString.call(input) === '[object Error]' ||
			input instanceof Error;

		const message = (isError ? input.message : input) || '';

		super(message);
		this.message = message;
		this.name = this.constructor.name;

		// inherit properties
		if (isError) {
			Object.assign(this, input);
		}

		if (typeof Error.captureStackTrace === 'function') {
			Error.captureStackTrace(this, this.constructor);
		} else {
			this.stack = new Error(message).stack;
		}
	}
}

class SpawnError extends ExtendableError {
	code: number;
	stdout: Buffer | string;
	stderr: Buffer | string;
	path: string | undefined;
	syscall: string | undefined;
	spawnargs: string[] | undefined;

	constructor(
		code: number,
		message: string,
		stdout?: Buffer | string,
		stderr?: Buffer | string,
	) {
		super(message);

		this.code = code || 1;
		this.stdout = stdout || Buffer.from('');
		this.stderr = stderr || Buffer.from('');
	}
}

export default function (
	cmd: string,
	args: string[],
	opts: { [key: string]: any },
	input?: string,
): Promise<{ stdout: Buffer | string; stderr: Buffer | string }> {
	return new Promise((resolve, reject) => {
		const outchunks: Uint8Array[] = [];
		const errchunks: Uint8Array[] = [];
		const options = Object.assign({}, opts);

		// ensure no override
		if (options.stdio) {
			delete options.stdio;
		}

		const child = spawn(cmd, args, options);

		child.on('error', (err: any) => reject(new SpawnError(1, err)));
		child.stdout.on('error', (err: any) => reject(new SpawnError(1, err)));
		child.stderr.on('error', (err: any) => reject(new SpawnError(1, err)));
		child.stdin.on('error', (err: any) => reject(new SpawnError(1, err)));

		child.stdout.on('data', (data: Buffer) => outchunks.push(data));
		child.stderr.on('data', (data: Buffer) => errchunks.push(data));

		child.stdin.end(input);

		child.on('close', (code: number) => {
			let stdout: Buffer | string;
			let stderr: Buffer | string;
			if ([undefined, 'buffer'].indexOf(options.encoding) > -1) {
				stdout = Buffer.concat(outchunks);
				stderr = Buffer.concat(errchunks);
			} else {
				stdout = outchunks.join('').trim();
				stderr = errchunks.join('').trim();
			}

			if (code === 0) {
				return resolve({ stdout, stderr });
			}

			const error = new SpawnError(
				code,
				`command exited with code: ${code}`,
				stdout,
				stderr,
			);

			// emulate actual Child Process Errors
			error.path = cmd;
			error.syscall = 'spawn ' + cmd;
			error.spawnargs = args;

			return reject(error);
		});
	});
}
