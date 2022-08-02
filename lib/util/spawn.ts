import * as child_process from 'child_process';

type SpawnResult =
	| {
			ok: true;
			stderr: Buffer;
			stdout: Buffer;
			code: number | null;
	  }
	| {
			ok: false;
			err: Error;
	  };

export async function spawn(
	command: string,
	args: string[],
	opts?: any,
): Promise<SpawnResult> {
	const child = child_process.spawn(command, args, opts);
	const stdout: Buffer[] = [];
	const stderr: Buffer[] = [];

	for await (const chunk of child.stdout) {
		stdout.push(chunk);
	}

	for await (const chunk of child.stderr) {
		stderr.push(chunk);
	}

	return new Promise((resolve) => {
		child.on('error', (err) => {
			resolve({ ok: false, err });
		});
		child.on('exit', (code) => {
			resolve({
				ok: true,
				stdout: Buffer.concat(stdout),
				stderr: Buffer.concat(stderr),
				code,
			});
		});
	});
}
