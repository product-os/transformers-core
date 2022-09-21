import { createContract, createTaskContract, TransformerType } from '../../lib';

describe('Tasks', function () {
	describe('create task', function () {
		const transformer = createContract<TransformerType>({
			type: 'transformer',
			name: 'some-transformer',
			loop: 'test',
			version: '1.0.0',
			typeVersion: '1.0.0',
			data: {
				transforms: [],
			},
		});
		const input = createContract({
			type: 'source',
			name: 'some-source',
			loop: 'test',
			version: '1.0.0',
			typeVersion: '1.0.0',
			data: {},
		});
		it('should create task contract', function () {
			const taskContract = createTaskContract(input, transformer);
			expect(taskContract.data.input).toEqual(input);
			expect(taskContract.data.transformer).toEqual(transformer);
			expect(taskContract.data.status).toEqual('pending');
		});
	});
});
