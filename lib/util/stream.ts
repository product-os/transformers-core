export function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
	return new Promise((resolve, reject) => {
		let buf = '';
		stream.on('data', (d) => (buf += d.toString()));
		stream.on('end', () => resolve(buf));
		stream.on('error', reject);
	});
}

export function waitForExit(stream: NodeJS.ReadableStream): Promise<void> {
	return new Promise((resolve) => {
		stream.on('close', resolve);
	});
}
