/*!
 * @author electricessence / https://github.com/electricessence/
 * Licensing: MIT
 */
import ArgumentNullException from '@tsdotnet/exceptions/dist/ArgumentNullException';
import defer from '@tsdotnet/threading/dist/defer';
import { TSDNPromise } from './Promise';
const VOID0 = void 0;
/**
 * A promise that waits for the first then to trigger the resolver.
 */
export default class LazyPromise extends TSDNPromise {
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
    /**
     * Will yield for a number of milliseconds from the time called before continuing.
     * @param milliseconds
     * @returns A promise that yields to the current execution and executes after a minimum delay.
     */
    delayFromNow(milliseconds = 0) {
        this.throwIfDisposed();
        // If this is already guaranteed to resolve, the go ahead and pass to the super.
        if (!this._resolver || this.isSettled)
            return super.delayFromNow(milliseconds);
        /*
         * If not triggered yet, then we create a special promise
         * that only requests the resolution from the parent promise
         * if a 'then' is called to ensure the lazy pattern.
         */
        let pass;
        let timedOut = false;
        // Setup the timer.
        let timeout = defer(() => {
            timedOut = true;
            // If the promise was requested already go ahead and pass the request on to the parent.
            if (pass)
                pass();
        }, milliseconds);
        return new LazyPromise((resolve, reject) => {
            // A lazy promise only enters here if something called for a resolution.
            pass = () => {
                this.doneNow(v => resolve(v), e => reject(e));
                timeout.dispose();
                timeout = VOID0;
                pass = VOID0;
            };
            // If the timeout completed already go ahead and pass the request on to the parent.
            if (timedOut)
                pass();
            // Otherwise wait for the timeout to do it.
        });
    }
    /**
     * Will yield for a number of milliseconds from after this promise resolves.
     * If the promise is already resolved, the delay will start from now.
     * @param milliseconds
     * @returns A promise that yields to the current execution and executes after a delay.
     */
    delayAfterResolve(milliseconds = 0) {
        this.throwIfDisposed();
        // If this is already guaranteed to resolve, the go ahead and pass to the super.
        if (!this._resolver || this.isSettled)
            return super.delayAfterResolve(milliseconds);
        /*
         * If not triggered yet, then we create a special promise
         * that only requests the resolution from the parent promise
         * if a 'then' is called to ensure the lazy pattern.
         */
        let pass;
        // Setup the timer.
        let timeout;
        let finalize = () => {
            if (timeout) {
                timeout.dispose();
                timeout = VOID0;
            }
            // If the promise was requested already go ahead and pass the request on to the parent.
            if (pass)
                pass();
            finalize = VOID0;
        };
        {
            let detector = () => {
                if (finalize) // We may already be wrapped up so never mind!
                    timeout = defer(finalize, milliseconds);
            };
            // Calling super.doneNow does not trigger resolution.
            // This simply waits for resolution to happen.
            // Is effectively the timer by when resolution has occurred.
            super.doneNow(detector, detector);
            //noinspection JSUnusedAssignment
            detector = null;
        }
        return new LazyPromise((resolve, reject) => {
            // Because of the lazy nature of this promise, this could enter here at any time.
            if (this.isPending) {
                this.doneNow(v => defer(() => resolve(v), milliseconds), e => defer(() => reject(e), milliseconds));
                finalize();
            }
            else {
                // We don't know when this resolved and could have happened anytime after calling this delay method.
                pass = () => {
                    this.doneNow(v => resolve(v), e => reject(e));
                };
                // Already finalized (aka resolved after a timeout)? Go now!
                if (!finalize)
                    pass();
            }
        });
    }
    // NOTE: For a LazyPromise we need to be careful not to trigger the resolve for delay.
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
//# sourceMappingURL=LazyPromise.js.map