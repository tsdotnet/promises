/*!
 * @author electricessence / https://github.com/electricessence/
 * Licensing: MIT
 */
import { PromiseBase, TSDNPromise } from './Promise';
export default class LazyPromise<T> extends TSDNPromise<T> {
    private _resolver;
    constructor(_resolver: TSDNPromise.Executor<T>);
    thenSynchronous<TFulfilled = T, TRejected = never>(onFulfilled: TSDNPromise.Fulfill<T, TFulfilled> | undefined | null, onRejected?: TSDNPromise.Reject<TRejected> | null): PromiseBase<TFulfilled | TRejected>;
    doneNow(onFulfilled: (v?: T) => unknown, onRejected?: (v?: unknown) => unknown): void;
    delayFromNow(milliseconds?: number): PromiseBase<T>;
    delayAfterResolve(milliseconds?: number): PromiseBase<T>;
    protected _onDispose(): void;
    private _onThen;
}
