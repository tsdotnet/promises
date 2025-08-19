"use strict";
/*!
 * @author electricessence / https://github.com/electricessence/
 * Licensing: MIT
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LazyPromise = exports.Fulfilled = exports.PromiseCollection = exports.PromiseBase = exports.Promise = exports.TSDNPromise = void 0;
const tslib_1 = require("tslib");
var Promise_1 = require("./Promise");
Object.defineProperty(exports, "TSDNPromise", { enumerable: true, get: function () { return tslib_1.__importDefault(Promise_1).default; } });
Object.defineProperty(exports, "Promise", { enumerable: true, get: function () { return tslib_1.__importDefault(Promise_1).default; } });
Object.defineProperty(exports, "PromiseBase", { enumerable: true, get: function () { return Promise_1.PromiseBase; } });
Object.defineProperty(exports, "PromiseCollection", { enumerable: true, get: function () { return Promise_1.PromiseCollection; } });
Object.defineProperty(exports, "Fulfilled", { enumerable: true, get: function () { return Promise_1.Fulfilled; } });
var LazyPromise_1 = require("./LazyPromise");
Object.defineProperty(exports, "LazyPromise", { enumerable: true, get: function () { return tslib_1.__importDefault(LazyPromise_1).default; } });
//# sourceMappingURL=index.js.map