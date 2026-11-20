![@tsdotnet/promises: Promises, your way. Synchronous-capable and lazy options.](https://cdn.jsdelivr.net/gh/tsdotnet/promises@master/assets/banner.svg)

[![npm version](https://img.shields.io/npm/v/@tsdotnet/promises.svg?style=flat-square)](https://www.npmjs.com/package/@tsdotnet/promises)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://github.com/tsdotnet/promises/blob/master/LICENSE)

Promise implementations that can resolve synchronously or lazily: `TSDNPromise`, `LazyPromise` and promise collections.

## Install

```sh
npm install @tsdotnet/promises
```

## Usage

```ts
import { TSDNPromise } from '@tsdotnet/promises';

const total = TSDNPromise
	.all(TSDNPromise.resolve(1), TSDNPromise.resolve(2))
	.thenSynchronous(([a, b]) => a + b); // a promise of 3
```

`thenSynchronous` skips the extra tick when the value is ready. `LazyPromise` defers its work until something asks for the result.

## Use it from

ESM (`import { TSDNPromise, LazyPromise } from '@tsdotnet/promises';`) or CommonJS (`const { TSDNPromise, LazyPromise } = require('@tsdotnet/promises');`). No `<script>` (UMD) build: use it with a bundler or Node.js.

## Docs

[tsdotnet.github.io/promises](https://tsdotnet.github.io/promises/)
