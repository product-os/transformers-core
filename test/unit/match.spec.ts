import { randomUUID } from 'crypto';
import { createContract, matchTransformers, TransformerType } from '../../lib';

describe('Transformers', function () {
	describe('matchTransformers()', function () {
		const matchTransformer = createContract<TransformerType>({
			type: 'transformer',
			name: 'match-me',
			loop: 'test',
			version: randomUUID(),
			typeVersion: '1.0.0',
			data: {
				finalize: false,
				transforms: {
					type: ['enum', 'source'],
				},
			},
		});
		const matchValueTransformer = createContract<TransformerType>({
			type: 'transformer',
			name: 'match-me',
			loop: 'test',
			version: randomUUID(),
			typeVersion: '1.0.0',
			data: {
				finalize: false,
				transforms: {
					type: ['enum', 'source'],
					data: {
						value: ['enum', 'test'],
					},
				},
			},
		});
		const notMatchTransformer = createContract<TransformerType>({
			type: 'transformer',
			name: 'match-me-not',
			loop: 'test',
			version: randomUUID(),
			typeVersion: '1.0.0',
			data: {
				finalize: false,
				transforms: {
					type: ['enum', 'else'],
				},
			},
		});
		const input = createContract({
			type: 'source',
			name: 'test',
			loop: 'test',
			version: randomUUID(),
			typeVersion: '1.0.0',
			data: {
				value: 'test',
			},
		});

		it('should match only one transformer', function () {
			const transformers = [matchTransformer, notMatchTransformer];
			const matched = [matchTransformer];
			expect(matchTransformers(transformers, input)).toEqual(matched);
		});

		it('should match data value', function () {
			const transformers = [notMatchTransformer, matchValueTransformer];
			const matched = [matchValueTransformer];
			expect(matchTransformers(transformers, input)).toEqual(matched);
		});
	});
});
