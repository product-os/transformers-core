import { randomUUID } from 'crypto';
import { createContract, matchTransformers, TransformerType } from '../../lib';
import { JSONSchema6 } from 'json-schema';

describe('Transformers', function () {
	describe('matchTransformers()', function () {
		// TODO: semver match version
		const filterEqualsInput: JSONSchema6 = {
			type: 'object',
			required: ['type'],
			properties: {
				type: { const: 'source' },
			},
		};
		const filterNotEqualsInput: JSONSchema6 = {
			type: 'object',
			required: ['type'],
			properties: {
				type: { const: 'else' },
			},
		};
		const matchTransformer = createContract<TransformerType>({
			type: 'transformer',
			name: 'match-me',
			loop: 'test',
			version: randomUUID(),
			typeVersion: '1.0.0',
			data: {
				autoFinalize: false,
				filter: filterEqualsInput,
			},
		});
		const notMatchTransformer = createContract<TransformerType>({
			type: 'transformer',
			name: 'match-me-not',
			loop: 'test',
			version: randomUUID(),
			typeVersion: '1.0.0',
			data: {
				autoFinalize: false,
				filter: filterNotEqualsInput,
			},
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
