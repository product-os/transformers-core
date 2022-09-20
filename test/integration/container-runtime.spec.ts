import * as fs from 'fs';
import * as path from 'path';
import {
	logger,
	ContainerRuntime,
	prepareWorkspace,
	createTaskContract,
	Registry,
	ActorCredentials,
	readContractSource,
	TransformerType,
	createContract,
} from '../../lib/';
import { spawn } from '../../lib/util';
import { createInputManifestFromTask } from '../../lib';

describe('ContainerRuntime', function () {
	jest.setTimeout(5 * 60 * 1000);

	async function setup() {
		const runtime = new ContainerRuntime(
			logger,
			`-----BEGIN RSA PRIVATE KEY-----
		MIIBOgIBAAJBAJxYRmueLGNBHjcrJk+8sIVdmkDrA3VWXrAQIMty3e9De+pFKPp/
		p5ikvmhfPAiIOfTZ2vraMLJqicOmEAa/N4kCAwEAAQJAMng8o1j4M0I+IskHIQ5k
		XWkN9o7nGuW6w1MxgvudsTKu+/+k9cvT3v+/GtpPpFjlPj2cZzHzU6ovkVXgxIX8
		AQIhAP0ALhNqzLoD7rSWu8p68XyW1VABi5PlCaWWF3xhObthAiEAnjLCOSsDNRXa
		aVVrwCy6rvQs+akHCxd20621d37pVSkCIGe4zyr+uff47L/0nACi7qXZYJJwT7zO
		RWoxYmeHpJeBAiA7/B8tMiQLMvgYTK2Itu0qfae4GuFy0TjbVtiiMNsk0QIhAL2a
		cA6N5gOEukVpnD/plpDmI5NmPSXZaxevCoZyIxoZ
		-----END RSA PRIVATE KEY-----`,
		);

		const fixturesPath = path.join(__dirname, '../fixtures');
		const inputContractSource = await readContractSource(
			path.join(fixturesPath, './dummy-input/balena.yml'),
		);
		const inputContract = createContract({
			...inputContractSource,
			name: 'dummy-input',
			loop: 'test',
		});

		const transformerPath = path.join(fixturesPath, './dummy-transformer/');
		const transformerContractSource = await readContractSource<TransformerType>(
			path.join(transformerPath, './balena.yml'),
		);
		const transformerContract = createContract({
			...transformerContractSource,
			name: 'dummy-transformer',
			loop: 'test',
		});
		const transformerImageRef = `dummy-transformer:latest`;
		const buildResult = await spawn('docker', [
			'build',
			transformerPath,
			'-t',
			transformerImageRef,
		]);
		if (!buildResult.ok) {
			throw buildResult.err;
		}

		const task = createTaskContract(inputContract, transformerContract);

		const credentials: ActorCredentials = {
			username: 'test',
			token: 'pass',
		};
		const host = process.env.REGISTRY_HOST || 'localhost';
		const port = process.env.REGISTRY_PORT || '5000';
		const scheme = process.env.REGISTRY_SCHEME || 'http';
		const registry = new Registry(logger, credentials, host, port, scheme as 'http' | 'https');
		const manifest = createInputManifestFromTask(task);
		const workspace = await prepareWorkspace(registry, manifest, {
			cachedArtifactPath: path.join(fixturesPath, 'artifact/hello-world.txt'),
		});

		return { runtime, workspace, manifest, transformerImageRef };
	}

	it('should successfully run dummy-transformer', async () => {
		logger.info('Running integration test...');
		const { runtime, workspace, manifest, transformerImageRef } = await setup();
		const outputManifest = await runtime.runTransformer(
			manifest,
			workspace,
			transformerImageRef,
			false,
		);

		expect(outputManifest.results.length).toEqual(1);
		let outputContent = '';
		if (outputManifest.results[0].artifactPath) {
			outputContent = (
				await fs.promises.readFile(outputManifest.results[0].artifactPath)
			).toString();
		}
		if (outputContent.toString() === 'Nice to meet you!') {
			logger.info('Passed test with test transformer!');
		} else {
			logger.error('Failed test, input and output not matching');
			logger.error('Output content:', outputContent);
		}
		// TODO: clean up workspace
	});

	// TODO: test invalid imageRef
});
