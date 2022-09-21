import * as fs from 'fs';
import * as path from 'path';
import { ArtifactType, loadImage, logger, Registry } from '../../lib';

jest.setTimeout(60 * 60 * 1000);

const registries: Registry[] = [
	new Registry(
		logger,
		{
			username: 'test',
			token: 'pass',
		},
		process.env.REGISTRY_HOST || 'localhost',
		'5000',
		'http',
	),
];

if (process.env.GHCR_USER && process.env.GHCR_PASS) {
	registries.push(
		new Registry(
			logger,
			{
				username: process.env.GHCR_USER,
				token: process.env.GHCR_PASS,
			},
			'ghcr.io',
		),
	);
}

describe('Registry', function () {
	const imagePath = path.join(__dirname, '../fixtures/image.tar');
	const artifactDir = path.join(__dirname, '../fixtures/artifact');
	const artifactFileName = 'hello-world.txt';
	const artifactFilePath = path.join(artifactDir, 'hello-world.txt');

	for (const registry of registries) {
		describe(`${registry.index.name}`, function () {
			it('should push image', async function () {
				const name = await loadImage(imagePath);
				await registry.push(
					`${registry.index.name}/product-os/transformers-core/test-image`,
					'latest',
					{
						type: ArtifactType.image,
						name,
					},
				);
			});

			it('should pull image', async function () {
				const result = await registry.pull(
					`${registry.index.name}/product-os/transformers-core/test-image`,
					'latest',
				);
				expect(result.type).toEqual('image');
				if (result.type === 'image') {
					expect(result.name).toEqual(
						`${registry.index.name}/product-os/transformers-core/test-image:latest`,
					);
				}
			});

			it('should push directory', async function () {
				await registry.push(
					`${registry.index.name}/product-os/transformers-core/test-dir`,
					'latest',
					{
						type: ArtifactType.filesystem,
						path: artifactDir,
					},
				);
			});

			it('should pull directory', async function () {
				const result = await registry.pull(
					`${registry.index.name}/product-os/transformers-core/test-dir`,
					'latest',
				);
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
				await registry.push(
					`${registry.index.name}/product-os/transformers-core/test-file`,
					'latest',
					{
						type: ArtifactType.filesystem,
						path: artifactFilePath,
					},
				);
			});

			it('should pull file', async function () {
				const result = await registry.pull(
					`${registry.index.name}/product-os/transformers-core/test-file`,
					'latest',
				);
				expect(result.type).toEqual('filesystem');
				if (result.type === 'filesystem') {
					const pulledContents = await fs.promises.readFile(result.path);
					const fixtureContents = await fs.promises.readFile(artifactFilePath);
					expect(pulledContents).toEqual(fixtureContents);
				}
			});

			it('should push object', async function () {
				await registry.push(
					`${registry.index.name}/product-os/transformers-core/test-object`,
					'latest',
					{
						type: ArtifactType.object,
						value: { hello: 'world', deep: { num: 1 } },
					},
				);
			});

			it('should pull object', async function () {
				const result = await registry.pull(
					`${registry.index.name}/product-os/transformers-core/test-object`,
					'latest',
				);
				expect(result.type).toEqual('object');
				if (result.type === 'object') {
					expect(result.value).toEqual({ hello: 'world', deep: { num: 1 } });
				}
			});

			it('should throw if pull unknown', async function () {
				try {
					await registry.pull(
						`${registry.index.name}/product-os/transformers-core/test-404`,
						'latest',
					);
				} catch (err: any) {
					expect(err?.name).toEqual('NotFoundError');
				}
			});
		});
	}
});
