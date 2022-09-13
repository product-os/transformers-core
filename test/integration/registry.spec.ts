import * as fs from 'fs';
import * as path from 'path';
import { ArtifactType, loadImage, logger, Registry } from '../../lib';

jest.setTimeout(60 * 60 * 1000);

describe('Registry', function () {
	const host = process.env.REGISTRY_HOST
		? process.env.REGISTRY_HOST
		: 'localhost';
	const port = '5000';
	const scheme = 'http';
	const imagePath = path.join(__dirname, '../fixtures/image.tar');
	const artifactDir = path.join(__dirname, '../fixtures/artifact');
	const artifactFileName = 'hello-world.txt';
	const artifactFilePath = path.join(artifactDir, 'hello-world.txt');
	const credentials = { username: 'test', token: 'pass' };

	it('should push image', async function () {
		const registry = new Registry(logger, credentials, host, port, scheme);
		const name = await loadImage(imagePath);
		await registry.push('test-image', 'latest', {
			type: ArtifactType.image,
			name,
		});
	});

	it('should pull image', async function () {
		const registry = new Registry(logger, credentials, host, port, scheme);
		const result = await registry.pull('test-image', 'latest');
		expect(result.type).toEqual('image');
		if (result.type === 'image') {
			expect(result.name).toEqual(
				`${host}:${Registry.DEFAULT_PORT}/test-image:latest`,
			);
		}
	});

	it('should push directory', async function () {
		const registry = new Registry(logger, credentials, host, port, scheme);
		await registry.push('test-dir', 'latest', {
			type: ArtifactType.filesystem,
			path: artifactDir,
		});
	});

	it('should pull directory', async function () {
		const registry = new Registry(logger, credentials, host, port, scheme);
		const result = await registry.pull('test-dir', 'latest');
		expect(result.type).toEqual('filesystem');
		if (result.type === 'filesystem') {
			const pulledContents = await fs.promises.readFile(
				path.join(result.path, artifactFileName),
			);
			const fixtureContents = await fs.promises.readFile(artifactFilePath);
			expect(pulledContents).toEqual(fixtureContents);
		}
	});

	it('should push file', async function () {
		const registry = new Registry(logger, credentials, host, port, scheme);
		await registry.push('test-file', 'latest', {
			type: ArtifactType.filesystem,
			path: artifactFilePath,
		});
	});

	it('should pull file', async function () {
		const registry = new Registry(logger, credentials, host, port, scheme);
		const result = await registry.pull('test-file', 'latest');
		expect(result.type).toEqual('filesystem');
		if (result.type === 'filesystem') {
			const pulledContents = await fs.promises.readFile(result.path);
			const fixtureContents = await fs.promises.readFile(artifactFilePath);
			expect(pulledContents).toEqual(fixtureContents);
		}
	});

	it('should push object', async function () {
		const registry = new Registry(logger, credentials, host, port, scheme);
		await registry.push('test-object', 'latest', {
			type: ArtifactType.object,
			value: { hello: 'world', deep: { num: 1 } },
		});
	});

	it('should pull object', async function () {
		const registry = new Registry(logger, credentials, host, port, scheme);
		const result = await registry.pull('test-object', 'latest');
		expect(result.type).toEqual('object');
		if (result.type === 'object') {
			expect(result.value).toEqual({ hello: 'world', deep: { num: 1 } });
		}
	});

	it('should throw if pull unknown', async function () {
		const registry = new Registry(logger, credentials, host, port, scheme);
		try {
			await registry.pull('test-404', 'latest');
		} catch (err: any) {
			expect(err?.name).toEqual('NotFoundError');
		}
	});
});
