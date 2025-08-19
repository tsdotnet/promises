"use strict";
/*!
 * @author electricessence / https://github.com/electricessence/
 * Licensing: MIT
 */
Object.defineProperty(exports, "__esModule", { value: true });
const exceptions_1 = require("@tsdotnet/exceptions");
const threading_1 = require("@tsdotnet/threading");
const Promise_1 = require("./Promise");
const VOID0 = void 0;
class LazyPromise extends Promise_1.TSDNPromise {
    constructor(_resolver) {
        super();
        this._resolver = _resolver;
        if (!_resolver)
            throw new exceptions_1.ArgumentNullException('resolver');
        this._resolvedCalled = true;
    }
    thenSynchronous(onFulfilled, onRejected) {
        this._onThen();
        return super.thenSynchronous(onFulfilled, onRejected);
    }
    doneNow(onFulfilled, onRejected) {
        this._onThen();
        super.doneNow(onFulfilled, onRejected);
    }
    delayFromNow(milliseconds = 0) {
        this.throwIfDisposed();
        if (!this._resolver || this.isSettled)
            return super.delayFromNow(milliseconds);
        let pass;
        let timedOut = false;
        let timeout = (0, threading_1.defer)(() => {
            timedOut = true;
            if (pass)
                pass();
        }, milliseconds);
        return new LazyPromise((resolve, reject) => {
            pass = () => {
                this.doneNow(v => resolve(v), e => reject(e));
                timeout.dispose();
                timeout = VOID0;
                pass = VOID0;
            };
            if (timedOut)
                pass();
        });
    }
    delayAfterResolve(milliseconds = 0) {
        this.throwIfDisposed();
        if (!this._resolver || this.isSettled)
            return super.delayAfterResolve(milliseconds);
        let pass;
        let timeout;
        let finalize = () => {
            if (timeout) {
                timeout.dispose();
                timeout = VOID0;
            }
            if (pass)
                pass();
            finalize = VOID0;
        };
        {
            let detector = () => {
                if (finalize)
                    timeout = (0, threading_1.defer)(finalize, milliseconds);
            };
            super.doneNow(detector, detector);
            detector = null;
        }
        return new LazyPromise((resolve, reject) => {
            if (this.isPending) {
                this.doneNow(v => (0, threading_1.defer)(() => resolve(v), milliseconds), e => (0, threading_1.defer)(() => reject(e), milliseconds));
                finalize();
            }
            else {
                pass = () => {
                    this.doneNow(v => resolve(v), e => reject(e));
                };
                if (!finalize)
                    pass();
            }
        });
    }
    _onDispose() {
        super._onDispose();
        this._resolver = VOID0;
    }
    _onThen() {
        const r = this._resolver;
        if (r) {
            this._resolver = VOID0;
            this._resolvedCalled = false;
            this.resolveUsing(r);
        }
    }
}
exports.default = LazyPromise;
//# sourceMappingURL=LazyPromise.js.map