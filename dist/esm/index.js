import { DisposableBase, ObjectDisposedException } from '@tsdotnet/disposable';
import { ArgumentNullException, ArgumentException, InvalidOperationException } from '@tsdotnet/exceptions';
import ObjectPool from '@tsdotnet/object-pool';
import { deferImmediate, defer } from '@tsdotnet/threading';

/*!
 * @author electricessence / https://github.com/electricessence/
 * Licensing: MIT
 * Although most of the following code is written from scratch, it is
 * heavily influenced by Q (https://github.com/kriskowal/q) and uses some of Q's spec.
 */
const VOID0$1 = void 0, NULL = null, THEN = 'then', TARGET = 'target';
function isPromise(value) {
    return value != null && typeof value[THEN] === 'function';
}
function resolve(value, resolver, promiseFactory) {
    const nextValue = resolver
        ? resolver(value)
        : value;
    return nextValue && isPromise(nextValue)
        ? TSDNPromise.wrap(nextValue)
        : promiseFactory(nextValue);
}
function handleResolution(p, value, resolver) {
    try {
        const v = resolver ? resolver(value) : value;
        if (p) {
            p.resolve(v);
        }
        return null;
    }
    catch (ex) {
        if (p) {
            p.reject(ex);
        }
        return ex;
    }
}
function handleResolutionMethods(targetFulfill, targetReject, value, resolver) {
    try {
        const v = resolver ? resolver(value) : value;
        if (targetFulfill)
            targetFulfill(v);
    }
    catch (ex) {
        if (targetReject)
            targetReject(ex);
    }
}
function handleDispatch(p, onFulfilled, onRejected) {
    if (p instanceof PromiseBase) {
        p.doneNow(onFulfilled, onRejected);
    }
    else {
        p.then(onFulfilled, onRejected);
    }
}
function handleSyncIfPossible(p, onFulfilled, onRejected) {
    if (p instanceof PromiseBase)
        return p.thenSynchronous(onFulfilled, onRejected);
    else
        return p.then(onFulfilled, onRejected);
}
function newODE() {
    return new ObjectDisposedException('TSDNPromise', 'An underlying promise-result was disposed.');
}
class PromiseState extends DisposableBase {
    _state;
    _result;
    _error;
    constructor(_state, _result, _error) {
        super();
        this._state = _state;
        this._result = _result;
        this._error = _error;
    }
    get state() {
        return this._state;
    }
    get isPending() {
        return this.getState() === TSDNPromise.State.Pending;
    }
    get isSettled() {
        return this.getState() != TSDNPromise.State.Pending;
    }
    get isFulfilled() {
        return this.getState() === TSDNPromise.State.Fulfilled;
    }
    get isRejected() {
        return this.getState() === TSDNPromise.State.Rejected;
    }
    get result() {
        this.assertIsAlive(true);
        return this.getResult();
    }
    get error() {
        this.assertIsAlive(true);
        return this.getError();
    }
    _onDispose() {
        this._state = VOID0$1;
        this._result = VOID0$1;
        this._error = VOID0$1;
    }
    getState() {
        return this._state;
    }
    getResult() {
        return this._result;
    }
    getError() {
        return this._error;
    }
}
class PromiseBase extends PromiseState {
    constructor() {
        super(TSDNPromise.State.Pending);
    }
    thenThis(onFulfilled, onRejected) {
        this.doneNow(onFulfilled, onRejected);
        return this;
    }
    then(onFulfilled, onRejected) {
        this.assertIsAlive(true);
        return new TSDNPromise((resolve, reject) => {
            this.doneNow(result => handleResolutionMethods(resolve, reject, result, onFulfilled), error => onRejected
                ? handleResolutionMethods(resolve, reject, error, onRejected)
                : reject(error));
        });
    }
    thenAllowFatal(onFulfilled, onRejected) {
        this.assertIsAlive(true);
        return new TSDNPromise((resolve, reject) => {
            this.doneNow(result => resolve((onFulfilled ? onFulfilled(result) : result)), error => reject(onRejected ? onRejected(error) : error));
        });
    }
    done(onFulfilled, onRejected) {
        defer(() => this.doneNow(onFulfilled, onRejected));
    }
    delayFromNow(milliseconds = 0) {
        this.assertIsAlive(true);
        return new TSDNPromise((resolve, reject) => {
            defer(() => {
                this.doneNow(v => resolve(v), e => reject(e));
            }, milliseconds);
        }, true);
    }
    delayAfterResolve(milliseconds = 0) {
        this.assertIsAlive(true);
        if (this.isSettled)
            return this.delayFromNow(milliseconds);
        return new TSDNPromise((resolve, reject) => {
            this.doneNow(v => defer(() => resolve(v), milliseconds), e => defer(() => reject(e), milliseconds));
        }, true);
    }
    'catch'(onRejected) {
        return this.then(VOID0$1, onRejected);
    }
    catchAllowFatal(onRejected) {
        return this.thenAllowFatal(VOID0$1, onRejected);
    }
    'finally'(fin) {
        return this.then(fin, fin);
    }
    finallyAllowFatal(fin) {
        return this.thenAllowFatal(fin, fin);
    }
    finallyThis(fin, synchronous) {
        const f = synchronous ? fin : () => deferImmediate(fin);
        this.doneNow(f, f);
        return this;
    }
}
class Resolvable extends PromiseBase {
    doneNow(onFulfilled, onRejected) {
        this.assertIsAlive(true);
        switch (this.state) {
            case TSDNPromise.State.Fulfilled:
                if (onFulfilled)
                    onFulfilled(this._result);
                break;
            case TSDNPromise.State.Rejected:
                if (onRejected)
                    onRejected(this._error);
                break;
        }
    }
    thenSynchronous(onFulfilled, onRejected) {
        this.assertIsAlive(true);
        try {
            switch (this.state) {
                case TSDNPromise.State.Fulfilled:
                    return onFulfilled
                        ? resolve(this._result, onFulfilled, TSDNPromise.resolve)
                        : this;
                case TSDNPromise.State.Rejected:
                    return onRejected
                        ? resolve(this._error, onRejected, TSDNPromise.resolve)
                        : this;
            }
        }
        catch (ex) {
            return new Rejected(ex);
        }
        throw new Error('Invalid state for a resolved promise.');
    }
}
class Resolved extends Resolvable {
    constructor(state, result, error) {
        super();
        this._result = result;
        this._error = error;
        this._state = state;
    }
}
class Fulfilled extends Resolved {
    constructor(value) {
        super(TSDNPromise.State.Fulfilled, value);
    }
}
class Rejected extends Resolved {
    constructor(error) {
        super(TSDNPromise.State.Rejected, VOID0$1, error);
    }
}
class PromiseWrapper extends Resolvable {
    _target;
    constructor(_target) {
        super();
        this._target = _target;
        if (!_target)
            throw new ArgumentNullException(TARGET);
        if (!isPromise(_target))
            throw new ArgumentException(TARGET, 'Must be a promise-like object.');
        _target.then((v) => {
            this._state = TSDNPromise.State.Fulfilled;
            this._result = v;
            this._error = VOID0$1;
            this._target = VOID0$1;
        }, e => {
            this._state = TSDNPromise.State.Rejected;
            this._error = e;
            this._target = VOID0$1;
        });
    }
    thenSynchronous(onFulfilled, onRejected) {
        this.assertIsAlive(true);
        const t = this._target;
        if (!t)
            return super.thenSynchronous(onFulfilled, onRejected);
        return new TSDNPromise((resolve, reject) => {
            handleDispatch(t, result => handleResolutionMethods(resolve, reject, result, onFulfilled), error => onRejected
                ? handleResolutionMethods(resolve, null, error, onRejected)
                : reject(error));
        }, true);
    }
    doneNow(onFulfilled, onRejected) {
        this.assertIsAlive(true);
        const t = this._target;
        if (t)
            handleDispatch(t, onFulfilled, onRejected);
        else
            super.doneNow(onFulfilled, onRejected);
    }
    _onDispose() {
        super._onDispose();
        this._target = VOID0$1;
    }
}
class TSDNPromise extends Resolvable {
    _resolvedCalled;
    _waiting;
    constructor(resolver, forceSynchronous = false) {
        super();
        if (resolver)
            this.resolveUsing(resolver, forceSynchronous);
    }
    thenSynchronous(onFulfilled, onRejected) {
        this.assertIsAlive(true);
        if (this._state)
            return super.thenSynchronous(onFulfilled, onRejected);
        const p = new TSDNPromise();
        (this._waiting || (this._waiting = []))
            .push(pools.PromiseCallbacks.init(onFulfilled, onRejected, p));
        return p;
    }
    doneNow(onFulfilled, onRejected) {
        this.assertIsAlive(true);
        if (this._state)
            return super.doneNow(onFulfilled, onRejected);
        (this._waiting || (this._waiting = []))
            .push(pools.PromiseCallbacks.init(onFulfilled, onRejected));
    }
    resolveUsing(resolver, forceSynchronous = false) {
        if (!resolver)
            throw new ArgumentNullException('resolver');
        if (this._resolvedCalled)
            throw new InvalidOperationException('.resolve() already called.');
        if (this.state)
            throw new InvalidOperationException('Already resolved: ' + TSDNPromise.State[this.state]);
        this._resolvedCalled = true;
        let state = 0;
        const rejectHandler = (reason) => {
            if (state) {
                console.warn(state == -1
                    ? 'Rejection called multiple times'
                    : 'Rejection called after fulfilled.');
            }
            else {
                state = -1;
                this._resolvedCalled = false;
                this.reject(reason);
            }
        };
        const fulfillHandler = (v) => {
            if (state) {
                console.warn(state == 1
                    ? 'Fulfill called multiple times'
                    : 'Fulfill called after rejection.');
            }
            else {
                state = 1;
                this._resolvedCalled = false;
                this.resolve(v);
            }
        };
        if (forceSynchronous)
            resolver(fulfillHandler, rejectHandler);
        else
            deferImmediate(() => resolver(fulfillHandler, rejectHandler));
    }
    resolve(result, throwIfSettled = false) {
        this.assertIsAlive(true);
        if (result == this)
            throw new InvalidOperationException('Cannot resolve a promise as itself.');
        if (this._state) {
            if (!throwIfSettled || this._state == TSDNPromise.State.Fulfilled && this._result === result)
                return;
            throw new InvalidOperationException('Changing the fulfilled state/value of a promise is not supported.');
        }
        if (this._resolvedCalled) {
            if (throwIfSettled)
                throw new InvalidOperationException('.resolve() already called.');
            return;
        }
        this._resolveInternal(result);
    }
    reject(error, throwIfSettled = false) {
        this.assertIsAlive(true);
        if (this._state) {
            if (!throwIfSettled || this._state == TSDNPromise.State.Rejected && this._error === error)
                return;
            throw new InvalidOperationException('Changing the rejected state/value of a promise is not supported.');
        }
        if (this._resolvedCalled) {
            if (throwIfSettled)
                throw new InvalidOperationException('.resolve() already called.');
            return;
        }
        this._rejectInternal(error);
    }
    _onDispose() {
        super._onDispose();
        this._resolvedCalled = VOID0$1;
    }
    _emitDisposalRejection(p) {
        const d = p.wasDisposed;
        if (d)
            this._rejectInternal(newODE());
        return d;
    }
    _resolveInternal(result) {
        if (this.wasDisposed)
            return;
        while (result instanceof PromiseBase) {
            const r = result;
            if (this._emitDisposalRejection(r))
                return;
            switch (r.state) {
                case TSDNPromise.State.Pending:
                    r.doneNow(v => this._resolveInternal(v), e => this._rejectInternal(e));
                    return;
                case TSDNPromise.State.Rejected:
                    this._rejectInternal(r.error);
                    return;
                case TSDNPromise.State.Fulfilled:
                    result = r.result;
                    break;
            }
        }
        if (isPromise(result)) {
            result.then(v => this._resolveInternal(v), e => this._rejectInternal(e));
        }
        else {
            this._state = TSDNPromise.State.Fulfilled;
            this._result = result;
            this._error = VOID0$1;
            const o = this._waiting;
            if (o) {
                this._waiting = VOID0$1;
                for (const c of o) {
                    const { onFulfilled, promise } = c;
                    pools.PromiseCallbacks.recycle(c);
                    handleResolution(promise, result, onFulfilled);
                }
                o.length = 0;
            }
        }
    }
    _rejectInternal(error) {
        if (this.wasDisposed)
            return;
        this._state = TSDNPromise.State.Rejected;
        this._error = error;
        const o = this._waiting;
        if (o) {
            this._waiting = null;
            for (const c of o) {
                const { onRejected, promise } = c;
                pools.PromiseCallbacks.recycle(c);
                if (onRejected) {
                    handleResolution(promise, error, onRejected);
                }
                else if (promise) {
                    promise.reject(error);
                }
            }
            o.length = 0;
        }
    }
}
class ArrayPromise extends TSDNPromise {
    static fulfilled(value) {
        return new ArrayPromise(() => value, true);
    }
    map(transform) {
        this.assertIsAlive(true);
        return new ArrayPromise(resolve => {
            this.doneNow(result => resolve(result.map(transform)));
        }, true);
    }
    reduce(reduction, initialValue) {
        return this
            .thenSynchronous(result => result.reduce(reduction, initialValue));
    }
}
class PromiseCollection extends DisposableBase {
    _source;
    constructor(source) {
        super();
        this._source = source && source.slice() || [];
    }
    get promises() {
        this.assertIsAlive(true);
        return this._source.slice();
    }
    all() {
        this.assertIsAlive(true);
        return TSDNPromise.all(this._source);
    }
    race() {
        this.assertIsAlive(true);
        return TSDNPromise.race(this._source);
    }
    waitAll() {
        this.assertIsAlive(true);
        return TSDNPromise.waitAll(this._source);
    }
    map(transform) {
        this.assertIsAlive(true);
        return new ArrayPromise(resolve => {
            this.all()
                .doneNow(result => resolve(result.map(transform)));
        }, true);
    }
    pipe(transform) {
        this.assertIsAlive(true);
        return new PromiseCollection(this._source.map(p => handleSyncIfPossible(p, transform)));
    }
    reduce(reduction, initialValue) {
        this.assertIsAlive(true);
        return TSDNPromise.wrap(this._source.reduce((previous, current, i, array) => handleSyncIfPossible(previous, (p) => handleSyncIfPossible(current, (c) => reduction(p, c, i, array))), isPromise(initialValue)
            ? initialValue
            : new Fulfilled(initialValue)));
    }
    _onDispose() {
        super._onDispose();
        this._source.length = 0;
        this._source = null;
    }
}
var pools;
(function (pools) {
    (function (PromiseCallbacks) {
        let pool;
        function getPool() {
            return pool
                || (pool = new ObjectPool(factory, c => {
                    c.onFulfilled = NULL;
                    c.onRejected = NULL;
                    c.promise = NULL;
                }, 40));
        }
        function factory() {
            return {
                onFulfilled: NULL,
                onRejected: NULL,
                promise: NULL
            };
        }
        function init(onFulfilled, onRejected, promise) {
            const c = getPool().take();
            c.onFulfilled = onFulfilled || undefined;
            c.onRejected = onRejected || undefined;
            c.promise = promise;
            return c;
        }
        PromiseCallbacks.init = init;
        function recycle(c) {
            getPool().give(c);
        }
        PromiseCallbacks.recycle = recycle;
    })(pools.PromiseCallbacks || (pools.PromiseCallbacks = {}));
})(pools || (pools = {}));
(function (TSDNPromise) {
    let State;
    (function (State) {
        State[State["Pending"] = 0] = "Pending";
        State[State["Fulfilled"] = 1] = "Fulfilled";
        State[State["Rejected"] = -1] = "Rejected";
    })(State = TSDNPromise.State || (TSDNPromise.State = {}));
    Object.freeze(State);
    function factory(e) {
        return new TSDNPromise(e);
    }
    TSDNPromise.factory = factory;
    function group(first, ...rest) {
        if (!first && !rest.length)
            throw new ArgumentNullException('promises');
        return new PromiseCollection(((first) instanceof (Array) ? first : [first])
            .concat(rest));
    }
    TSDNPromise.group = group;
    function all(first, ...rest) {
        if (!first && !rest.length)
            throw new ArgumentNullException('promises');
        let promises = ((first) instanceof (Array) ? first : [first]).concat(rest);
        if (!promises.length || promises.every(v => !v))
            return new ArrayPromise(r => r(promises), true);
        return new ArrayPromise((resolve, reject) => {
            const result = [];
            const len = promises.length;
            result.length = len;
            let remaining = new Set(promises.map((v, i) => i));
            const cleanup = () => {
                reject = VOID0$1;
                resolve = VOID0$1;
                promises.length = 0;
                promises = VOID0$1;
                remaining.clear();
                remaining = VOID0$1;
            };
            const checkIfShouldResolve = () => {
                const r = resolve;
                if (r && !remaining.size) {
                    cleanup();
                    r(result);
                }
            };
            const onFulfill = (v, i) => {
                if (resolve != null) {
                    result[i] = v;
                    remaining.delete(i);
                    checkIfShouldResolve();
                }
            };
            const onReject = (e) => {
                const r = reject;
                if (r) {
                    cleanup();
                    r(e);
                }
            };
            for (let i = 0; remaining && i < len; i++) {
                const p = promises[i];
                if (p)
                    p.then(v => onFulfill(v, i), onReject);
                else
                    remaining.delete(i);
                checkIfShouldResolve();
            }
        });
    }
    TSDNPromise.all = all;
    function waitAll(first, ...rest) {
        if (!first && !rest.length)
            throw new ArgumentNullException('promises');
        const promises = ((first) instanceof (Array) ? first : [first]).concat(rest);
        if (!promises.length || promises.every(v => !v))
            return new ArrayPromise(r => r(promises), true);
        return new ArrayPromise(resolve => {
            const len = promises.length;
            let remaining = new Set(promises.map((v, i) => i));
            const cleanup = () => {
                resolve = NULL;
                remaining.clear();
                remaining = NULL;
            };
            const checkIfShouldResolve = () => {
                const r = resolve;
                if (r && !remaining.size) {
                    cleanup();
                    r(promises);
                }
            };
            const onResolved = (i) => {
                if (remaining) {
                    remaining.delete(i);
                    checkIfShouldResolve();
                }
            };
            for (let i = 0; remaining && i < len; i++) {
                const p = promises[i];
                if (p) {
                    p.then(() => onResolved(i), () => onResolved(i));
                }
                else
                    onResolved(i);
            }
        });
    }
    TSDNPromise.waitAll = waitAll;
    function race(first, ...rest) {
        let promises = first && ((first) instanceof (Array) ? first : [first]).concat(rest);
        if (!promises || !promises.length || !(promises = promises.filter(v => v != null)).length)
            throw new ArgumentException('Nothing to wait for.');
        const len = promises.length;
        if (len == 1)
            return wrap(promises[0]);
        for (let i = 0; i < len; i++) {
            const p = promises[i];
            if (p instanceof PromiseBase && p.isSettled)
                return p;
        }
        return new TSDNPromise((resolve, reject) => {
            const cleanup = () => {
                reject = NULL;
                resolve = NULL;
                promises.length = 0;
                promises = NULL;
            };
            const onResolve = (r, v) => {
                if (r) {
                    cleanup();
                    r(v);
                }
            };
            const onFulfill = (v) => onResolve(resolve, v);
            const onReject = (e) => onResolve(reject, e);
            for (const p of promises) {
                if (!resolve)
                    break;
                p.then(onFulfill, onReject);
            }
        });
    }
    TSDNPromise.race = race;
    function resolve(value) {
        return isPromise(value) ? wrap(value) : new Fulfilled(value);
    }
    TSDNPromise.resolve = resolve;
    function using(resolver, forceSynchronous = false) {
        return new TSDNPromise(resolver, forceSynchronous);
    }
    TSDNPromise.using = using;
    function resolveAll(first, ...rest) {
        if (!first && !rest.length)
            throw new ArgumentNullException('resolutions');
        return new PromiseCollection(((first) instanceof (Array) ? first : [first])
            .concat(rest)
            .map((v) => resolve(v)));
    }
    TSDNPromise.resolveAll = resolveAll;
    function map(source, transform) {
        return new PromiseCollection(source.map(d => new TSDNPromise((r, j) => {
            try {
                r(transform(d));
            }
            catch (ex) {
                j(ex);
            }
        })));
    }
    TSDNPromise.map = map;
    function reject(reason) {
        return new Rejected(reason);
    }
    TSDNPromise.reject = reject;
    function wrap(target) {
        if (!target)
            throw new ArgumentNullException(TARGET);
        return isPromise(target)
            ? (target instanceof PromiseBase ? target : new PromiseWrapper(target))
            : new Fulfilled(target);
    }
    TSDNPromise.wrap = wrap;
    function createFrom(then) {
        if (!then)
            throw new ArgumentNullException(THEN);
        return new PromiseWrapper({ then: then });
    }
    TSDNPromise.createFrom = createFrom;
})(TSDNPromise || (TSDNPromise = {}));

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
        this.assertIsAlive(true);
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
        this.assertIsAlive(true);
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

export { ArrayPromise, Fulfilled, LazyPromise, TSDNPromise as Promise, PromiseBase, PromiseCollection, PromiseState, Rejected, Resolvable, Resolved, TSDNPromise };
//# sourceMappingURL=index.js.map
