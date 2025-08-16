/*!
 * @author electricessence / https://github.com/electricessence/
 * Licensing: MIT
 */
import { PromiseBase, TSDNPromise } from './Promise';
/**
 * A promise that waits for the first then to trigger the resolver.
 */
export default class LazyPromise<T> extends TSDNPromise<T> {
    private _resolver;
    constructor(_resolver: TSDNPromise.Executor<T>);
    thenSynchronous<TFulfilled = T, TRejected = never>(onFulfilled: TSDNPromise.Fulfill<T, TFulfilled> | undefined | null, onRejected?: TSDNPromise.Reject<TRejected> | null): PromiseBase<TFulfilled | TRejected>;
    doneNow(onFulfilled: (v?: T) => unknown, onRejected?: (v?: unknown) => unknown): void;
    /**
     * Will yield for a number of milliseconds from the time called before continuing.
     * @param milliseconds
     * @returns A promise that yields to the current execution and executes after a minimum delay.
     */
    delayFromNow(milliseconds?: number): PromiseBase<T>;
    /**
     * Will yield for a number of milliseconds from after this promise resolves.
     * If the promise is already resolved, the delay will start from now.
     * @param milliseconds
     * @returns A promise that yields to the current execution and executes after a delay.
     */
    delayAfterResolve(milliseconds?: number): PromiseBase<T>;
    protected _onDispose(): void;
    private _onThen;
}
