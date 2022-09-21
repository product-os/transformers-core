import { randomUUID } from 'crypto';
import { createContract, matchTransformers, TransformerType } from '../../lib';

describe('Transformers', function () {
	describe('matchTransformers()', function () {
		// TODO: semver match version

		const matchTransformer = createContract<TransformerType>({
			type: 'transformer',
			name: 'match-me',
			loop: 'test',
			version: randomUUID(),
			typeVersion: '1.0.0',
			data: {
				transforms: [{
					type: 'source',
					version: '^1.0.0',
					data: {
						platform: 'x86_64',
					}
				}],
			},
		});
		const notMatchTransformer = createContract<TransformerType>({
			type: 'transformer',
			name: 'match-me-not',
			loop: 'test',
			version: randomUUID(),
			typeVersion: '1.0.0',
			data: {
				transforms: [{
					type: 'else'
				}],
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
			expect(matchTransformers(transformers, input)).toEqual(matched);
		});
	});
});
