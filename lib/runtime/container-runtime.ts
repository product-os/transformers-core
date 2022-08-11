import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import * as stream from 'stream';
import * as Dockerode from 'dockerode';
import * as Logger from 'bunyan';
import { randomUUID } from 'crypto';
import { createDecryptor } from '../secrets';
import { Workspace } from '../workspace';
import { InputManifest, OutputManifest } from '../manifest';
import { ErrorContract } from '../error';
import { createContract } from '../contract';

export class ContainerRuntime {
	private logger: Logger;
	private docker: Dockerode;
	private decryptor: (s: any) => any;

	RUN_LABEL = 'io.balena.transformer.run';
	TRANSFORMER_LABEL = 'io.balena.transformer';

	INPUT_BIND_ROOT = '/input';
	OUTPUT_BIND_ROOT = '/output';

	constructor(logger: Logger, decryptionKey?: string) {
		this.logger = logger;
		this.docker = new Dockerode();
		this.decryptor = createDecryptor(decryptionKey);
	}

	async runTransformer(
		inputManifest: InputManifest,
		workspace: Workspace,
		imageRef: string,
		privileged: boolean,
		labels?: { [key: string]: string },
		logMeta?: object,
	): Promise<OutputManifest> {
		// run-globals
		const runId = randomUUID();
		const logger = this.logger.child({
			runId,
			transformer: inputManifest.transformer.slug,
			input: inputManifest.input.slug,
			...logMeta,
		});

		// TODO: reconsider secrets handling, should contracts and transformers really hard code secrets in their contract?
		// TODO: move decryption outside of the runtime, decryption should be generalized not runtime specific
		inputManifest.decryptedSecrets = this.decryptor(
			inputManifest.input.data?.$transformer?.encryptedSecrets,
		);

		inputManifest.decryptedTransformerSecrets = this.decryptor(
			inputManifest.transformer.data?.encryptedSecrets,
		);

		logger.info({ imageRef }, `Running transformer image`);

		const stdOutTail: string[] = [];
		const stdErrTail: string[] = [];

		try {
			const docker = this.docker;

			// docker-in-docker needs its storage to be a compatible fs
			const tmpDockerVolume = `tmp-docker-${runId}`;
			await docker.createVolume({
				Name: tmpDockerVolume,
				Labels: {
					...labels,
					[this.TRANSFORMER_LABEL]: 'true',
					[this.RUN_LABEL]: runId,
				},
			});

			// Use our own streams that hook into stdout and stderr
			const stdoutStream = new stream.PassThrough();
			const stderrStream = new stream.PassThrough();

			const logAndCacheTail =
				(streamId: string, tail: string[]) => (data: Buffer) => {
					const line = data.toString('utf8');
					logger.info({ streamId, type: 'tf-log' }, line);
					tail.push(line);
					if (tail.length > 10) {
						tail.shift();
					}
				};

			stdoutStream.on('data', logAndCacheTail('stdout', stdOutTail));
			stderrStream.on('data', logAndCacheTail('stderr', stdErrTail));

			const inputManifestBind = `${workspace.inputManifestPath}:${this.INPUT_BIND_ROOT}/manifest.json:ro`;
			const inputArtifactBind = `${workspace.inputArtifactPath}:${this.INPUT_BIND_ROOT}/artifact:ro`;
			const outputBind = `${workspace.outputDir}:${this.OUTPUT_BIND_ROOT}`;
			const runResult = await docker.run(
				imageRef,
				[],
				[stdoutStream, stderrStream],
				{
					Tty: false,
					Env: [
						`INPUT=${this.INPUT_BIND_ROOT}/manifest.json`,
						`OUTPUT=${this.OUTPUT_BIND_ROOT}/manifest.json`,
					],
					Volumes: {
						'/var/lib/docker': {}, // if the transformers uses docker-in-docker, this is required
					},
					Labels: {
						...labels,
						[this.TRANSFORMER_LABEL]: 'true',
						[this.RUN_LABEL]: runId,
					},
					HostConfig: {
						Init: true, // should ensure that containers never leave zombie processes
						Privileged: privileged,
						Binds: [
							inputManifestBind,
							inputArtifactBind,
							outputBind,
							`${tmpDockerVolume}:/var/lib/docker`,
						],
					},
					User: `${os.userInfo().uid}:${os.userInfo().gid}`,
				} as Dockerode.ContainerCreateOptions,
			);

			stdoutStream.end();
			stderrStream.end();

			const exitCode = runResult[0].StatusCode;

			logger.info({ exitCode }, 'run result');

			return await this.createOutputManifest(
				exitCode,
				path.resolve(workspace.outputDir),
				logger,
			);
		} catch (error: any) {
			logger.error({ error }, 'ERROR RUNNING TRANSFORMER');
			const errorContract = createContract({
				title: `Error running ${inputManifest.transformer.slug}`,
				name: inputManifest.transformer.name,
				type: 'error',
				loop: inputManifest.transformer.loop,
				version: randomUUID(),
				typeVersion: '1.0.0',
				data: {
					message: error.message,
					code: String(error.code) ?? '1',
					input: inputManifest.input,
					transformer: inputManifest.transformer,
					outTail: stdOutTail.join(''),
					errTail: stdErrTail.join(''),
				},
			}) as ErrorContract;
			// Check if output manifest exists
			try {
				await fs.promises.access(
					path.join(path.resolve(workspace.outputDir), 'manifest.json'),
					fs.constants.F_OK,
				);
				logger.info('Found output manifest');
				// Read in file since we found it
				const outputManifest = await fs.promises.readFile(
					path.join(path.resolve(workspace.outputDir), 'manifest.json'),
				);
				// Stick extra data in the contract body
				errorContract.data.outputManifest = JSON.parse(
					outputManifest.toString(),
				);
			} catch (err: any) {
				if (err.code !== 'ENOENT') {
					throw err;
				}
				logger.info(
					{ path: path.resolve(workspace.outputDir) },
					'Did not find output manifest',
				);
			}
			// Return the output manifest
			return {
				results: [
					{
						contract: errorContract,
					},
				],
			} as OutputManifest;
		} finally {
			logger.info('Cleaning up');
			await this.cleanup(runId, logger);
			logger.info('Cleanup complete');
		}
	}

	async cleanup(runId: string, log: Logger) {
		const docker = new Dockerode();
		const containers = await docker.listContainers({
			all: true,
			filters: {
				label: [`${this.RUN_LABEL}=${runId}`],
			},
		});
		log.info({ len: containers.length }, `Removing containers`);
		await Promise.all(
			containers.map((container) =>
				docker.getContainer(container.Id).remove({ force: true }),
			),
		);
		const volumes = await docker.listVolumes({
			filters: {
				label: [`${this.RUN_LABEL}=${runId}`],
			},
		});
		log.info({ len: volumes.Volumes.length }, `Removing volumes`);
		await Promise.all(
			volumes.Volumes.map((volume) =>
				docker.getVolume(volume.Name).remove({ force: true }),
			),
		);
	}

	async createOutputManifest(
		exitCode: number,
		outputDir: string,
		logger: Logger,
	) {
		logger.info(`Validating transformer output`);

		if (exitCode !== 0) {
			throw new Error(`exit-code ${exitCode}`);
		}

		const outputManifestPath = path.join(outputDir, 'manifest.json');
		logger.info({ outputManifestPath }, 'Reading output from');

		let outputManifest: OutputManifest;
		try {
			outputManifest = {
				exitCode,
				...JSON.parse(await fs.promises.readFile(outputManifestPath, 'utf8')),
			} as OutputManifest;
		} catch (e: any) {
			e.message = `Could not load output manifest: ${e.message}`;
			throw e;
		}

		// result.artifactPath is absolute path of output mount in container
		// convert it to absolute path on host
		for (const result of outputManifest.results) {
			if (result.artifactPath) {
				result.artifactPath = path.join(
					outputDir,
					path.relative(this.OUTPUT_BIND_ROOT, result.artifactPath),
				);
			}
		}

		await this.validateOutputManifest(outputManifest, logger);

		return outputManifest;
	}

	async validateOutputManifest(m: OutputManifest, logger: Logger) {
		// TODO: replace validation with Zod
		const message = 'Output manifest validation error: ';
		if (!Array.isArray(m.results)) {
			throw new Error(`${message} missing results array`);
		}

		if (m.results.length < 1) {
			logger.warn(`empty results array`);
		}

		for (const result of m.results) {
			if (!result.contract || !result.contract.data) {
				throw new Error(`${message} missing result contract`);
			}

			// Note: artifactPath can be empty
			if (result.artifactPath) {
				try {
					await fs.promises.access(result.artifactPath, fs.constants.R_OK);
					logger.info('Successful validation of output');
				} catch (e) {
					throw new Error(
						`${message} artifact path ${result.artifactPath} is not readable`,
					);
				}
			}
		}
	}
}
