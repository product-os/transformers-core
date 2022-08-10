import { randomUUID } from 'crypto';
import {
	contractFactory,
	matchTransformers,
	TransformerContract,
} from '../../lib';

describe('Transformers', function () {
	describe('matchTransformers()', function () {
		// TODO: semver match version

		const filterEqualsInput = {
			type: 'object',
			required: ['type'],
			properties: {
				type: { const: 'source' },
			},
		};
		const filterNotEqualsInput = {
			type: 'object',
			required: ['type'],
			properties: {
				type: { const: 'else' },
			},
		};
		const matchTransformer: TransformerContract = contractFactory({
			type: 'transformer',
			name: 'match-me',
			loop: 'test',
			version: randomUUID(),
			typeVersion: '1.0.0',
			data: { filter: filterEqualsInput },
			requires: [],
			capabilities: [],
		});
		const notMatchTransformer: TransformerContract = contractFactory({
			type: 'transformer',
			name: 'match-me-not',
			loop: 'test',
			version: randomUUID(),
			typeVersion: '1.0.0',
			data: { filter: filterNotEqualsInput },
			requires: [],
			capabilities: [],
		});
		const input = contractFactory({
			type: 'source',
			name: 'test',
			loop: 'test',
			version: randomUUID(),
			typeVersion: '1.0.0',
			data: {},
		});

		it('should match only one transformer', function () {
			const transformers = [matchTransformer, notMatchTransformer];
			const matched = [matchTransformer];
			expect(matchTransformers(transformers, null, input)).toEqual(matched);
		});
	});
});
