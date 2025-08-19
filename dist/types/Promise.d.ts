/*!
 * @author electricessence / https://github.com/electricessence/
 * Licensing: MIT
 * Although most of the following code is written from scratch, it is
 * heavily influenced by Q (https://github.com/kriskowal/q) and uses some of Q's spec.
 */
import type { Closure, Selector } from '@tsdotnet/common-interfaces';
import { DisposableBase } from '@tsdotnet/disposable';
export type Resolver = Selector<TSDNPromise.Resolution<any>, any> | null | undefined;
export declare class PromiseState<T> extends DisposableBase {
    protected _state: TSDNPromise.State;
    protected _result?: T | undefined;
    protected _error?: unknown | undefined;
    constructor(_state: TSDNPromise.State, _result?: T | undefined, _error?: unknown | undefined);
    get state(): TSDNPromise.State;
    get isPending(): boolean;
    get isSettled(): boolean;
    get isFulfilled(): boolean;
    get isRejected(): boolean;
    get result(): T | undefined;
    get error(): unknown;
    protected _onDispose(): void;
    protected getState(): TSDNPromise.State;
    protected getResult(): T | undefined;
    protected getError(): unknown;
}
export declare abstract class PromiseBase<T> extends PromiseState<T> implements PromiseLike<T> {
    protected constructor();
    abstract doneNow(onFulfilled: TSDNPromise.Fulfill<T, unknown> | undefined | null, onRejected?: TSDNPromise.Reject<unknown> | null): void;
    abstract thenSynchronous<TFulfilled = T, TRejected = never>(onFulfilled: TSDNPromise.Fulfill<T, TFulfilled> | undefined | null, onRejected?: TSDNPromise.Reject<TRejected> | null): PromiseBase<TFulfilled | TRejected>;
    thenThis(onFulfilled: TSDNPromise.Fulfill<T, unknown> | undefined | null, onRejected?: TSDNPromise.Reject<unknown> | null): this;
    then<TFulfilled = T, TRejected = never>(onFulfilled: TSDNPromise.Fulfill<T, TFulfilled> | undefined | null, onRejected?: TSDNPromise.Reject<TRejected> | null): PromiseBase<TFulfilled | TRejected>;
    thenAllowFatal<TFulfilled = T, TRejected = never>(onFulfilled: TSDNPromise.Fulfill<T, TFulfilled> | undefined | null, onRejected?: TSDNPromise.Reject<TRejected> | null): PromiseBase<TFulfilled | TRejected>;
    done(onFulfilled: TSDNPromise.Fulfill<T, unknown> | undefined | null, onRejected?: TSDNPromise.Reject<unknown> | null): void;
    delayFromNow(milliseconds?: number): PromiseBase<T>;
    delayAfterResolve(milliseconds?: number): PromiseBase<T>;
    'catch'<TResult = never>(onRejected: TSDNPromise.Reject<TResult>): PromiseBase<T | TResult>;
    catchAllowFatal<TResult = never>(onRejected: TSDNPromise.Reject<TResult>): PromiseBase<T | TResult>;
    'finally'<TResult = never>(fin: () => TSDNPromise.Resolution<TResult>): PromiseBase<TResult>;
    finallyAllowFatal<TResult = never>(fin: () => TSDNPromise.Resolution<TResult>): PromiseBase<TResult>;
    finallyThis(fin: Closure, synchronous?: boolean): this;
}
export declare abstract class Resolvable<T> extends PromiseBase<T> {
    doneNow(onFulfilled: TSDNPromise.Fulfill<T, unknown> | undefined | null, onRejected?: TSDNPromise.Reject<unknown> | null): void;
    thenSynchronous<TFulfilled = T, TRejected = never>(onFulfilled: TSDNPromise.Fulfill<T, TFulfilled> | undefined | null, onRejected?: TSDNPromise.Reject<TRejected> | null): PromiseBase<TFulfilled | TRejected>;
}
export declare abstract class Resolved<T> extends Resolvable<T> {
    protected constructor(state: TSDNPromise.State, result: T, error?: unknown);
}
export declare class Fulfilled<T> extends Resolved<T> {
    constructor(value: T);
}
export declare class Rejected<T> extends Resolved<T> {
    constructor(error: unknown);
}
export declare class TSDNPromise<T> extends Resolvable<T> {
    protected _resolvedCalled: boolean | undefined;
    private _waiting;
    constructor(resolver?: TSDNPromise.Executor<T>, forceSynchronous?: boolean);
    thenSynchronous<TFulfilled = T, TRejected = never>(onFulfilled: TSDNPromise.Fulfill<T, TFulfilled> | undefined | null, onRejected?: TSDNPromise.Reject<TRejected> | null): PromiseBase<TFulfilled | TRejected>;
    doneNow(onFulfilled: TSDNPromise.Fulfill<T, unknown> | undefined | null, onRejected?: TSDNPromise.Reject<unknown> | null): void;
    resolveUsing(resolver: TSDNPromise.Executor<T>, forceSynchronous?: boolean): void;
    resolve(result?: T | PromiseLike<T>, throwIfSettled?: boolean): void;
    reject(error: unknown, throwIfSettled?: boolean): void;
    protected _onDispose(): void;
    private _emitDisposalRejection;
    private _resolveInternal;
    private _rejectInternal;
}
export declare class ArrayPromise<T> extends TSDNPromise<T[]> {
    static fulfilled<T>(value: T[]): ArrayPromise<T>;
    map<U>(transform: (value: T) => U): ArrayPromise<U>;
    reduce(reduction: (previousValue: T, currentValue: T, i?: number, array?: T[]) => T, initialValue?: T): PromiseBase<T>;
    reduce<U>(reduction: (previousValue: U, currentValue: T, i?: number, array?: T[]) => U, initialValue: U): PromiseBase<U>;
}
export declare class PromiseCollection<T> extends DisposableBase {
    private readonly _source;
    constructor(source: PromiseLike<T>[] | null | undefined);
    get promises(): PromiseLike<T>[];
    all(): ArrayPromise<T>;
    race(): PromiseBase<T>;
    waitAll(): ArrayPromise<PromiseLike<T>>;
    map<U>(transform: (value: T) => U): ArrayPromise<U>;
    pipe<U>(transform: (value: T) => U | PromiseLike<U>): PromiseCollection<U>;
    reduce(reduction: (previousValue: T, currentValue: T, i?: number, array?: PromiseLike<T>[]) => T, initialValue?: T | PromiseLike<T>): PromiseBase<T>;
    reduce<U>(reduction: (previousValue: U, currentValue: T, i?: number, array?: PromiseLike<T>[]) => U, initialValue: U | PromiseLike<U>): PromiseBase<U>;
    protected _onDispose(): void;
}
export declare namespace TSDNPromise {
    enum State {
        Pending = 0,
        Fulfilled = 1,
        Rejected = -1
    }
    type Resolution<TResult> = TResult | PromiseLike<TResult>;
    interface Fulfill<T, TResult> {
        (value: T): Resolution<TResult>;
    }
    interface Reject<TResult> {
        (reason: unknown): Resolution<TResult>;
    }
    interface Then<T, TResult> {
        (onfulfilled?: Fulfill<T, TResult> | null, onrejected?: Reject<TResult> | null): PromiseLike<TResult>;
        (onfulfilled?: Fulfill<T, TResult> | null, onrejected?: Reject<void> | null): PromiseLike<TResult>;
    }
    interface Executor<T> {
        (resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: unknown) => void): void;
    }
    interface Factory {
        <T>(executor: Executor<T>): PromiseLike<T>;
    }
    function factory<T>(e: Executor<T>): TSDNPromise<T>;
    function group<T>(promises: PromiseLike<T>[]): PromiseCollection<T>;
    function group<T>(promise: PromiseLike<T>, ...rest: PromiseLike<T>[]): PromiseCollection<T>;
    function all<T>(promises: PromiseLike<T>[]): ArrayPromise<T>;
    function all<T>(promise: PromiseLike<T>, ...rest: PromiseLike<T>[]): ArrayPromise<T>;
    function waitAll<T>(promises: PromiseLike<T>[]): ArrayPromise<PromiseLike<T>>;
    function waitAll<T>(promise: PromiseLike<T>, ...rest: PromiseLike<T>[]): ArrayPromise<PromiseLike<T>>;
    function race<T>(promises: PromiseLike<T>[]): PromiseBase<T>;
    function race<T>(promise: PromiseLike<T>, ...rest: PromiseLike<T>[]): PromiseBase<T>;
    function resolve(): PromiseBase<void>;
    function resolve<T>(value: T | PromiseLike<T>): PromiseBase<T>;
    function using<T>(resolver: TSDNPromise.Executor<T>, forceSynchronous?: boolean): PromiseBase<T>;
    function resolveAll<T>(resolutions: Array<T | PromiseLike<T>>): PromiseCollection<T>;
    function resolveAll<T>(promise: T | PromiseLike<T>, ...rest: Array<T | PromiseLike<T>>): PromiseCollection<T>;
    function map<T, U>(source: T[], transform: (value: T) => U): PromiseCollection<U>;
    function reject<T>(reason: T): PromiseBase<T>;
    function wrap<T>(target: T | PromiseLike<T>): PromiseBase<T>;
    function createFrom<T>(then: Then<T, any>): PromiseBase<T>;
}
export { TSDNPromise as Promise };
export default TSDNPromise;
