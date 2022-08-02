import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { Registry } from '../../lib';
import { logger } from '../../lib';

describe('Registry', function () {
	const registryUri = process.env.REGISTRY_URI
		? process.env.REGISTRY_URI
		: 'localhost:5000';
	const imageRef = `${registryUri}/image:latest`;
	const imagePath = path.join(__dirname, '../fixtures/image.tar');
	const artifactRef = `${registryUri}/artifact:latest`;
	const artifactPath = path.join(__dirname, '../fixtures/artifact');
	const authOpts = { username: 'test', password: 'pass' };

	it('should push image', async function () {
		const registry = new Registry(logger, registryUri);
		const result = await registry.pushImage(imageRef, imagePath, authOpts);
		expect(result).toEqual(undefined);
	});

	it('should pull image', async function () {
		const registry = new Registry(logger, registryUri);
		const result = await registry.pullImage(imageRef, authOpts);
		expect(result).toEqual(imageRef);
	});

	it('should push artifact', async function () {
		const registry = new Registry(logger, registryUri);
		const result = await registry.pushArtifact(
			artifactRef,
			artifactPath,
			authOpts,
		);
		expect(result).toEqual(undefined);
	});

	it('should pull artifact', async function () {
		const registry = new Registry(logger, registryUri);
		const destPath = fs.mkdtempSync(path.join(os.tmpdir(), path.sep));
		const result = await registry.pullArtifact(artifactRef, destPath, authOpts);
		expect(result).toEqual('hello-world.txt');
	});

	it('should push manifest list', async function () {
		// TODO: once manifest list is used again
	});
});
