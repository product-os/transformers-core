import { randomUUID } from 'crypto';
import {
	createContract,
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
		const matchTransformer: TransformerContract = createContract({
			type: 'transformer',
			name: 'match-me',
			loop: 'test',
			version: randomUUID(),
			typeVersion: '1.0.0',
			data: { filter: filterEqualsInput },
		});
		const notMatchTransformer: TransformerContract = createContract({
			type: 'transformer',
			name: 'match-me-not',
			loop: 'test',
			version: randomUUID(),
			typeVersion: '1.0.0',
			data: { filter: filterNotEqualsInput },
		});
		const input = createContract({
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
