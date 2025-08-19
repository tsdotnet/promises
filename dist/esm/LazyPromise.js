import { ArgumentNullException } from '@tsdotnet/exceptions';
import { defer } from '@tsdotnet/threading';
import { TSDNPromise } from './Promise.js';

/*!
 * @author electricessence / https://github.com/electricessence/
 * Licensing: MIT
 */
const VOID0 = void 0;
class LazyPromise extends TSDNPromise {
    _resolver;
    constructor(_resolver) {
        super();
        this._resolver = _resolver;
        if (!_resolver)
            throw new ArgumentNullException('resolver');
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
        let timeout = defer(() => {
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
                    timeout = defer(finalize, milliseconds);
            };
            super.doneNow(detector, detector);
            detector = null;
        }
        return new LazyPromise((resolve, reject) => {
            if (this.isPending) {
                this.doneNow(v => defer(() => resolve(v), milliseconds), e => defer(() => reject(e), milliseconds));
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

export { LazyPromise as default };
//# sourceMappingURL=LazyPromise.js.map
