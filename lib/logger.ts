/**
 * Copied from transformer-worker
 *
 * TODO: cleanup, remove debugnyan
 */

import { AsyncLocalStorage } from 'async_hooks';
import * as Logger from 'bunyan';

// tslint:disable-next-line:no-var-requires
const debugnyan = require('debugnyan');

// this file
// * defines a default logger with a fixed name that can be imported everywhere
// * allows to define a span in which every log line gets enriched with some extra data (like a request ID)
// * exposes a proxy object, so to the consumer it always looks like they're using a static logger object,
//   but they get the contextualized one

const currentLogger = new AsyncLocalStorage<Logger>();
const defaultLogger = debugnyan('transformer-runner', {});

export const logger = new Proxy(defaultLogger, {
	get: (target, prop, _receiver) => {
		const l = currentLogger.getStore() ?? target;
		return (l as any)[prop];
	},
});

/**
 * Runs a function and binds the global logger instance to a custom instance.
 *
 * Example: withLogger( defaultLogger.child({request: reqID}), () => doSomething() )
 *
 * @param l the logger to use within the callback
 * @param cb the method to run within the context
 * @returns the original method's return value
 */
export const withLogger = <R>(l: Logger, cb: (...args: any[]) => R) => {
	// this line is NECESSARY. I'm not sure why, but it seems the binding to the stream needs to happen before
	// entering a async context
	l.debug('entering new log context');
	return currentLogger.run(l, cb);
};
