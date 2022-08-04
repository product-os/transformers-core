/**
 * Copied from transformer-worker
 *
 * TODO: use logger instead of debugnyan, cleanup code
 */
// tslint:disable-next-line:no-var-requires
const debugnyan = require('debugnyan');
import * as NodeRSA from 'node-rsa';

const log = debugnyan('transformer-runtime:secrets', {});

export function createDecryptor(key?: string) {
	const decryptionKey = key
		? new NodeRSA(key, 'pkcs1', {
				encryptionScheme: 'pkcs1',
		  })
		: undefined;
	return (s: any) => decryptSecrets(decryptionKey, s);
}

/**
 * This function takes an object tree with all string values expected to be
 * base64 encoded secrets and returns the same tree with the values decrypted
 * but again base64 encoded.
 * (The latter allows passing binary secrets as well)
 *
 * @param sec object that only contains string values or other encryptedSecrets objects
 */
export function decryptSecrets(
	decryptionKey: NodeRSA | undefined,
	sec: any,
): any {
	if (!sec) {
		return undefined;
	}
	if (!decryptionKey) {
		log.warn(
			`no secrets key provided! Will pass along secrets without decryption. Should not happen in production`,
		);
		return sec;
	}
	const result: any = {};
	for (const key of Object.keys(sec)) {
		const val = sec[key];
		if (typeof val === 'string') {
			result[key] = decryptionKey.decrypt(val, 'base64');
		} else if (typeof val === 'object') {
			result[key] = exports.decryptSecrets(decryptionKey, val);
		} else {
			log.warn({ key }, `unknown type in secrets for key`);
		}
	}
	return result;
}
