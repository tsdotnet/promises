# ![alt text](https://avatars1.githubusercontent.com/u/64487547?s=30 "tsdotnet") tsdotnet / promises

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://github.com/tsdotnet/promises/blob/master/LICENSE)
![npm-publish](https://github.com/tsdotnet/promises/workflows/npm-publish/badge.svg)
[![npm version](https://img.shields.io/npm/v/@tsdotnet/promises.svg?style=flat-square)](https://www.npmjs.com/package/@tsdotnet/promises)

An extended A+ promise library with lazy and synchronous promises.

## Docs

[tsdotnet.github.io/promises](https://tsdotnet.github.io/promises/)

## Enter the LazyPromise<T>.

Ever wanted to have a factory the produces promises but doesn't automatically resolve?  What if the consumer never calls `.then(...)`?  Wasted processes!  Yuk!

This LazyPromise<T> not only waits for a `.then(...)` call before resolving but also allows for adding delays that appropriately back propagate the `.then(...)` requests.

## Useful synchronous methods

(From the underlying `Promise<T>`.)

- `.thenSynchronous(...)`: simply fulfills immediately if possible.
- `.thenThis(...)` instead of creating a new promise to return with, it simply returns the current promise and calls the respected `onFullfill` and `onReject` synchronously if possible.

You can force `.thenThis(...)` to be deferred by calling either of the delay methods:

`.delayFromNow(ms: number = 0)`  
or  
`.delayAfterResolve(ms: number = 0)`

### Note About Performance
The original intentions behind building the underlying `Promise<T>` class was to:

- Have a usable Promise class that could be used in place of the ES6 version and still stay in ES5 and would follow the default expected/standard Promise behavior for the consumer.  (Not blocking, etc.)

- Avoid over abuse of generating promises and delays in order to resolve more promises.  By smartly allowing for some synchronous processing as long as it wasn't blocking the caller.  In some Promise examples, there just seemed to be too much 'deferring' for no reason.

- Expose other useful methods which could be used by the consumer that allowed for synchronous processing as long as it was explicitly desired.  In some cases, it simply made more sense to create a synchronous pipeline instead repeating unnecessary defer/delays.

## Compatibility

This was originally written for ES5 but is now targeting ES2015.
