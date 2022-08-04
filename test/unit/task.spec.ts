import { contractFactory, createTask, TransformerContract } from '../../lib';

describe('Tasks', function () {
	describe('create task', function () {
		const transformer: TransformerContract = contractFactory({
			type: 'transformer',
			repo: 'some-transformer',
			loop: 'test',
			version: '1.0.0',
			typeVersion: '^1.0.0',
			data: { filter: {}, autoFinalize: true },
		});
		const input = contractFactory({
			type: 'source',
			repo: 'some-source',
			loop: 'test',
			version: '1.0.0',
			typeVersion: '^1.0.0',
			data: {},
		});
		const actorId = 'foobar';
		it('should create task contract', function () {
			const taskContract = createTask(actorId, input, transformer);
			expect(taskContract.data.input).toEqual(input);
			expect(taskContract.data.transformer).toEqual(transformer);
			expect(taskContract.data.actor).toEqual(actorId);
			expect(taskContract.data.status).toEqual('pending');
		});
	});
});
