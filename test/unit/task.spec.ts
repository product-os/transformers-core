import { createTaskDefinition } from '../../lib';
import { contractFactory } from '../helpers/contract-factory';

describe('Tasks', function () {
	describe('create task', function () {
		const loop = 'test';
		const transformer = contractFactory(loop, {
			handle: 'some-transformer',
			version: '1.0.0',
			type: 'transformer@1.0.0',
			data: { inputFilter: {}, backflowMapping: [] },
		});
		const inputContract = contractFactory(loop, {
			handle: 'some-source',
			version: '1.0.0',
			type: 'source@1.0.0',
			data: {},
		});
		const actorId = 'foobar';
		it('should create task contract', function () {
			const taskContract = createTaskDefinition(
				actorId,
				inputContract,
				transformer,
			);
			expect(taskContract.data.input).toEqual(inputContract);
			expect(taskContract.data.transformer).toEqual(transformer);
			expect(taskContract.data.actor).toEqual(actorId);
			expect(taskContract.data.status).toEqual('pending');
		});
	});
});
