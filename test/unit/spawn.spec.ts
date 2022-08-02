import { spawn } from '../../lib/util';

describe('async spawn()', function () {
	it('should receive stdout', async function () {
		const result = await spawn('echo', ['hello world']);
		if (result.ok) {
			expect(result.stdout.toString()).toEqual('hello world\n');
		} else {
			throw result.err;
		}
	});
});
