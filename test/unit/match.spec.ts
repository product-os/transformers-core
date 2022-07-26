import { matchTransformers, TransformerContract } from '../../lib';
import { contractFactory } from './helpers/contract-factory';

describe('Transformers', function () {
	describe('matchTransformers()', function () {
		const filterEqualsInput = {
			type: 'object',
			required: ['type'],
			properties: {
				type: { const: 'source@1.0.0' },
			},
		};
		const filterNotEqualsInput = {
			type: 'object',
			required: ['type'],
			properties: {
				type: { const: 'else@1.0.0' },
			},
		};
		const matchTransformer = contractFactory(
			'match-me',
			'1.0.0',
			'transformer@1.0.0',
			{ inputFilter: filterEqualsInput },
		);
		const notMatchTransformer = contractFactory(
			'match-me-not',
			'1.0.0',
			'transformer@1.0.0',
			{ inputFilter: filterNotEqualsInput },
		);
		const contractArtifactNotReady = contractFactory(
			'no-artifact-ready',
			'1.0.0',
			'source@1.0.0',
			{ $transformer: { artifactReady: false } },
		);
		const contractArtifactReady = contractFactory(
			'artifact-ready',
			'1.0.0',
			'source@1.0.0',
			{ $transformer: { artifactReady: true } },
		);

		it('should MATCH transformer if NEW contract and artifact NOT READY', function () {
			const previousContract = null;
			const currentContract = contractArtifactNotReady;
			const transformers = [matchTransformer, notMatchTransformer];
			const matched = [matchTransformer];
			expect(
				matchTransformers(transformers, previousContract, currentContract),
			).toEqual(matched);
		});

		it('should MATCH transformer if NEW contract and artifact READY', function () {
			const previousContract = null;
			const currentContract = contractArtifactReady;
			const transformers = [matchTransformer, notMatchTransformer];
			const matched = [matchTransformer];
			expect(
				matchTransformers(transformers, previousContract, currentContract),
			).toEqual(matched);
		});

		it('should NOT MATCH transformer if NOT NEW contract and artifact NOT READY', function () {
			const previousContract = contractArtifactNotReady;
			const currentContract = contractArtifactNotReady;
			const transformers = [matchTransformer, notMatchTransformer];
			const matched: TransformerContract[] = [];
			expect(
				matchTransformers(transformers, previousContract, currentContract),
			).toEqual(matched);
		});

		it('should NOT MATCH transformer if NOT NEW contract and artifact READY', function () {
			const previousContract = contractArtifactReady;
			const currentContract = contractArtifactReady;
			const transformers = [matchTransformer, notMatchTransformer];
			const matched: TransformerContract[] = [];
			expect(
				matchTransformers(transformers, previousContract, currentContract),
			).toEqual(matched);
		});

		it('should MATCH transformer if NOT NEW contract and artifact CHANGED TO READY', function () {
			const previousContract = contractArtifactNotReady;
			const currentContract = contractArtifactReady;
			const transformers = [matchTransformer, notMatchTransformer];
			const matched = [matchTransformer];
			expect(
				matchTransformers(transformers, previousContract, currentContract),
			).toEqual(matched);
		});
	});
});
