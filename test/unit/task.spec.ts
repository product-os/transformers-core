import { TransformerData, createTaskDefinition } from '../../lib';
import { contractFactory } from './helpers/contract-factory';

describe('Tasks', function () {
	describe('create task', function () {
		const transformer = contractFactory<TransformerData>(
			'some-transformer',
			'1.0.0',
			'transformer@1.0.0',
			{ inputFilter: {}, backflowMapping: [] },
		);
		const inputContract = contractFactory(
			'some-source',
			'1.0.0',
			'source@1.0.0',
			{},
		);
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
