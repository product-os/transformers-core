import * as fs from 'fs';
import { F_OK } from 'constants';

export async function isDir(path: string) {
	const stat = await fs.promises.lstat(path);
	return stat.isDirectory();
}

export async function pathExists(path: string) {
	try {
		await fs.promises.access(path, F_OK);
		return true;
	} catch {
		return false;
	}
}

export async function emptyDir(path: string) {
	if (await pathExists(path)) {
		await fs.promises.rmdir(path);
	}
	await fs.promises.mkdir(path, { recursive: true });
	return path;
}
