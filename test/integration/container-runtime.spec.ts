import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import {
	logger,
	ContainerRuntime,
	prepareWorkspace,
	createTask,
	Registry,
	ActorCredentials,
} from '../../lib/';
import type { Contract, TransformerContract } from '../../lib/';
import { spawn } from '../../lib/util';
import { createInputManifest } from '../../lib/manifest';

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
		const inputContract = yaml.load(
			fs
				.readFileSync(path.join(fixturesPath, './dummy-input/balena.yml'))
				.toString(),
		) as Contract;

		const transformerPath = path.join(fixturesPath, './dummy-transformer/');
		const transformerContract = yaml.load(
			fs.readFileSync(path.join(transformerPath, './balena.yml')).toString(),
		) as TransformerContract;
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

		const task = createTask('test', inputContract, transformerContract);

		const credentials: ActorCredentials = {
			slug: 'test',
			sessionToken: 'pass',
		};
		const registryUri = process.env.REGISTRY_URI
			? process.env.REGISTRY_URI
			: 'localhost:5000';

		const registry = new Registry(logger, registryUri);
		const manifest = createInputManifest(task);
		const workspace = await prepareWorkspace(credentials, registry, manifest, {
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
