import * as AU from '@tsdotnet/array-utility';
import {ObjectDisposedException} from '@tsdotnet/disposable';
import Stopwatch from '@tsdotnet/stopwatch';
import {defer} from '@tsdotnet/threading';
import { describe, it, expect, afterEach } from 'vitest';
import LazyPromise from '../src/LazyPromise';
import TSDNPromise, {Fulfilled, PromiseBase, PromiseCollection} from '../src/Promise';

const REASON = 'this is not an error, but it might show up in the console';
const BREAK = 'break', NO = 'NO!';

// In browsers that support strict mode, it'll be `undefined`; otherwise, the global.
// let calledAsFunctionThis = (function() { return this; }());

function testPromiseFlow (p: PromiseBase<boolean>): PromiseBase<void>
{
	return p
		.then(null as any) // ensure pass through
		.then(v => // onFulfilled
		{
			expect(v).toBeTruthy(); // v === true
			return v; // *
		}, () => // onRejected
		{
			expect(false).toBeTruthy();
			return true;
		})
		.then(v => {
			expect(v).toBeTruthy();
			return v; // *
		})
		.then(v => {
			expect(v).toBeTruthy();
			return false; // *
		})
		.then(v => {
			expect(!v).toBeTruthy();
			return true; // *
		})
		.then(v => {
			expect(v).toBeTruthy();
			throw BREAK; // *
		}, () => {
			expect(false).toBeTruthy();
			return NO;
		})
		.then(null as any, null as any) // ensure pass through
		.then(() => {
			// The previous promise threw/rejected so should never go here.
			expect(false).toBeTruthy();
			return NO;
		}, e => {
			expect(e).toBe(BREAK);
			return BREAK; // *
		})
		.then(v => {
			expect(v).toBe(BREAK);
			return true; // *
		}, () => {
			expect(false).toBeTruthy();
			return false;
		})
		.then<boolean>(v => {
			expect(v).toBeTruthy();
			throw BREAK; // *
		})
		.catch(e => {
			expect(e).toBe(BREAK);
			return true; // *
		})
		.then(v => {
			expect(v).toBeTruthy();
			return 10;
		})
		.then(v => {
			expect(v).toBe(10);
			throw 'force catch';
		})
		.catch(() => {
			throw BREAK; // Make sure throws inside reject are captured.
		})
		.catch(e => {
			expect(e).toBe(BREAK);
		});
}

afterEach(function() {
	//Q.onerror = null;
});

describe('computing sum of integers using promises', () => {
	// Use triangular numbers...
	const count = 1000;
	const array = AU.range(1, count);
	const swA = Stopwatch.startNew();
	const answer = array.reduce((currentVal, nextVal) => currentVal + nextVal, 0);
	swA.stop();

	it('should compute correct result without blowing stack (Synchronous) (lambda only)', () => {
		const sw = Stopwatch.startNew();
		return array
			.reduce((promise: PromiseBase<number>, nextVal: number) =>
				promise.thenSynchronous(currentVal => currentVal + nextVal), TSDNPromise.resolve(0))
			.thenSynchronous(value => {
				sw.stop();
				// console.log("");
				// console.log("Synchronous Promise Compute Milliseconds: ", sw.elapsedMilliseconds);
				expect(value).toBe(answer);
			});
	});

	it('should compute correct result without blowing stack (Synchronous) (lambda only)', () => {
		const source = new PromiseCollection(array.map(v => new Fulfilled(v)));
		const sw = Stopwatch.startNew();
		return source
			.reduce((
				previousValue: number,
				currentValue: number) => previousValue + currentValue, 0)
			.then(value => {
				sw.stop();
				// console.log("");
				// console.log("PromiseCollection Compute Milliseconds: ", sw.elapsedMilliseconds);
				expect(value).toBe(answer);
			});
	});

	it('should compute correct result without blowing stack (lambda only)', () => {
		const sw = Stopwatch.startNew();
		return array
			.reduce((promise: PromiseBase<number>, nextVal: number) =>
				promise.then(currentVal => currentVal + nextVal), TSDNPromise.resolve(0))
			.then(value => {
				sw.stop();
				//console.log("");
				//console.log("Deferred Promise Compute Milliseconds: ", sw.elapsedMilliseconds);
				expect(value).toBe(answer);
			});
	});

	// it("should compute correct result without blowing stack (All Deferred) (lambda only)", ()=>
	// {
	// 	let sw = Stopwatch.startNew();
	// 	return array
	// 		.reduce((promise:PromiseBase<number>, nextVal:number) =>
	// 			promise.then(
	// 				currentVal=>currentVal + nextVal).deferAll(), Promise.resolve(0).deferAll())
	// 		.then(value=>
	// 		{
	// 			sw.stop();
	// 			//console.log("");
	// 			//console.log("All Deferred Promise Compute Milliseconds: ", sw.elapsedMilliseconds);
	// 			expect(value).toBe(answer);
	// 		});
	// });

	it('should be deferring fulfillment', () => {

		let wasRun = false;
		const r = TSDNPromise.resolve(true).then(() => {
			wasRun = true;
		});
		expect(!wasRun, 'The promise should have deferred until after closure completed.').toBeTruthy();
		return r;
	});

});


describe('Resolution and Rejection', () => {
	it('should result in a fulfilled promise when given a value', () => {
		const f = TSDNPromise.resolve(5);
		expect(f.result).toBe(5);
		expect(f.isSettled).toBe(true);
		expect(f.isFulfilled).toBe(true);
		expect(f.isRejected).toBe(false);
	});

	it('should result in a rejected promise when requesting rejected', () => {
		const f = TSDNPromise.reject('err');
		expect(f.error).toBe('err');
		expect(f.isSettled).toBe(true);
		expect(f.isFulfilled).toBe(false);
		expect(f.isRejected).toBe(true);
	});

	it('resolves multiple observers', () => {
		return new Promise<void>((done) => {
			let nextTurn = false;

			const resolution = 'Ta-ram pam param!';
			const pending = new TSDNPromise<any>();
			const count = 10;
			let i = 0;

			function resolve (value: any)
			{
				i++;
				expect(value).toBe(resolution);
				expect(nextTurn).toBeTruthy();
				if(!nextTurn) i = count;
				if(i===count)
				{
					done();
				}
			}

			while(++i<=count)
			{
				pending.then(resolve);
			}

			pending.resolve(resolution);
			i = 0;
			nextTurn = true;
		});
	});

	it('observers called even after throw (synchronous)', () => {
		let threw = false;
		const pending = new TSDNPromise();
		pending.thenSynchronous(() => {
			threw = true;
			throw new Error(REASON);
		});

		pending.thenSynchronous(
			value => expect(value).toBe(10),
			() => expect('not').toBe('here')
		);

		pending.resolve(10);
		expect(threw).toBe(true);
		return pending;
	});

	it('observers called even after throw (asynchronous)', () => {
		let threw = false;
		const pending = new TSDNPromise();
		pending.thenSynchronous(() => {
			threw = true;
			throw new Error(REASON);
		});

		pending.thenSynchronous(
			value => expect(value).toBe(10),
			() => expect('not').toBe('here')
		);

		pending.resolve(10);
		expect(threw).toBe(true);
		return pending;
	});

	const BREAK = 'break', NO = 'NO!';

	function testPromiseFlow (p: PromiseBase<boolean>): PromiseBase<void>
	{
		return p
			.then(null as any) // ensure pass through
			.then(v => // onFulfilled
			{
				expect(v).toBeTruthy(); // v === true
				return v; // *
			}, () => // onRejected
			{
				expect(false).toBeTruthy();
				return true;
			})
			.then(v => {
				expect(v).toBeTruthy();
				return v; // *
			})
			.then(v => {
				expect(v).toBeTruthy();
				return false; // *
			})
			.then(v => {
				expect(!v).toBeTruthy();
				return true; // *
			})
			.then(v => {
				expect(v).toBeTruthy();
				throw BREAK; // *
			}, () => {
				expect(false).toBeTruthy();
				return NO;
			})
			.then(null as any, null as any) // ensure pass through
			.then(() => {
				// The previous promise threw/rejected so should never go here.
				expect(false).toBeTruthy();
				return NO;
			}, e => {
				expect(e).toBe(BREAK);
				return BREAK; // *
			})
			.then(v => {
				expect(v).toBe(BREAK);
				return true; // *
			}, () => {
				expect(false).toBeTruthy();
				return false;
			})
			.then<boolean>(v => {
				expect(v).toBeTruthy();
				throw BREAK; // *
			})
			.catch(e => {
				expect(e).toBe(BREAK);
				return true; // *
			})
			.then(v => {
				expect(v).toBeTruthy();
				return 10;
			})
			.then(v => {
				expect(v).toBe(10);
				throw 'force catch';
			})
			.catch(() => {
				throw BREAK; // Make sure throws inside reject are captured.
			})
			.catch(e => {
				expect(e).toBe(BREAK);
			});
	}

	it('should follow expected promise behavior flow for a resolved promise', () => {
		return testPromiseFlow(TSDNPromise.resolve(true));
	});


	it('should follow expected promise behavior flow for a rejected promise', () => {
		return testPromiseFlow(
			TSDNPromise
				.reject(BREAK)
				.then(() => {
					expect(false, 'Fulfilled when it should have been rejected.').toBeTruthy();
				}, v => {
					expect(v).toBe(BREAK);
				})
				.finally(() => true)
		);
	});

	it('should pass through', () => {
		return TSDNPromise.resolve(true)
			.thenAllowFatal<void>(() => {
				// throw "BAM!";
			});
	});

	it('should follow expected promise behavior flow for a pending then resolved promise', () => {
		const p = new TSDNPromise<boolean>();
		expect(p.isPending).toBeTruthy();
		p.resolve(true);
		return testPromiseFlow(p);
	});


	it('should be able to use a then-able', () => {
		const p: any = TSDNPromise.createFrom(
			(r: TSDNPromise.Fulfill<boolean, boolean> | null | undefined) => {
				r!(true);
				return TSDNPromise.resolve(true);
			});
		return testPromiseFlow(p);
	});


	it('should be able to use a lazy', () => {
		new LazyPromise<boolean>(() => {
			expect(false, 'Should not have triggered the resolution.').toBeTruthy();
		}).delayFromNow(1000);

		const elapsed = Stopwatch.startNew();

		return testPromiseFlow(
			new LazyPromise<boolean>(resolve => defer(() => resolve(true), 1000))
				.delayFromNow(1000)
				.thenThis(() => {
					const ms = elapsed.elapsedMilliseconds;
					expect(ms>1000 && ms<2000).toBeTruthy();
				})
			);
		});

		it('.deferFromNow', () => {
			new LazyPromise<boolean>(() => {
				expect(false, 'Should not have triggered the resolution.').toBeTruthy();
			}).delayAfterResolve(1000);

			const elapsed = Stopwatch.startNew();

			return testPromiseFlow(
				new LazyPromise<boolean>(resolve => defer(() => resolve(true), 1000))
					.delayAfterResolve(1000)
					.thenThis(() => {
						const ms = elapsed.elapsedMilliseconds;
						expect(ms>2000 && ms<3000).toBeTruthy();
					})
			);
		});

	});

	it('should be able to use promise as a resolution', () => {
		const s = new TSDNPromise<boolean>();
		const p = new TSDNPromise<boolean>(resolve => {
			defer(() => resolve(s));
		});
		expect(s.isPending).toBeTruthy();
		expect(p.isPending).toBeTruthy();
		s.resolve(true);
		return testPromiseFlow(p);
	});

	it('should be able to wait for all', () => {
		const other = new LazyPromise<number>(resolve => {
			resolve(4);
		});
		return TSDNPromise.waitAll<any>(
			other,
			TSDNPromise.resolve(3),
			TSDNPromise.resolve(2),
			TSDNPromise.reject(BREAK),
			TSDNPromise.resolve(1)
		).thenSynchronous((r: any[]) => {
			expect(r[0].result).toBe(4);
			expect(r[1].result).toBe(3);
			expect(r[2].result).toBe(2);
			expect(r[3].result).toBe(void 0);
			expect(r[3].error).toBe(BREAK);
			expect(r[4].result).toBe(1);
		}, () => expect(false).toBeTruthy());
	});

	it('should be able to resolve all', () => {
		const other = new LazyPromise<number>(resolve => {
			resolve(4);
		});
		return TSDNPromise.all(
			other.delayFromNow(10).delayAfterResolve(10),
			TSDNPromise.resolve(3),
			TSDNPromise.resolve(2),
			TSDNPromise.resolve(1)
		).thenSynchronous(r => {
			expect(r[0]).toBe(4);
			expect(r[1]).toBe(3);
			expect(r[2]).toBe(2);
			expect(r[3]).toBe(1);
		});
	});

	it('should resolve as rejected', () => {
		const other = new LazyPromise<number>(resolve => {
			resolve(4);
		});
		return TSDNPromise.all(
			other,
			TSDNPromise.resolve(3),
			TSDNPromise.resolve(2),
			TSDNPromise.resolve(1),
			TSDNPromise.reject(-1)
		).thenSynchronous(() => {
			expect(false).toBeTruthy();
		}, e => {
			expect(e).toBe(-1);
		});
	});

	it('should be resolve the first to win the race', () => {
		const other = new LazyPromise<number>((resolve, reject) => {
			reject(4);
		});
		return TSDNPromise.race(
			other.delayAfterResolve(40),
			TSDNPromise.resolve(3).delayFromNow(10),
			TSDNPromise.resolve(2).delayFromNow(20),
			TSDNPromise.resolve(1).delayFromNow(30)
		).thenSynchronous(r => {
			expect(r).toBe(3);
		}, () => {
			expect(false).toBeTruthy();
		});
	});

	it('should be resolve the rejection', () => {
		return TSDNPromise.race(
			TSDNPromise.resolve(3).delayFromNow(20),
			TSDNPromise.resolve(2).delayAfterResolve(10),
			TSDNPromise.reject(1)
		).thenSynchronous(() => {
			expect(false).toBeTruthy();
		}, e => {
			expect(e).toBe(1);
		});
	});

	it('should resolve the chain fulfilled promise result.', () =>
		new TSDNPromise((resolve => resolve(new TSDNPromise((resolve => resolve(TSDNPromise.resolve(1)))))))
			.thenSynchronous(
				v => expect(v).toBe(1),
				() => expect(false).toBeTruthy())
	);

	it('should resolve the rejected promise result.', () =>
		new TSDNPromise((resolve => resolve(TSDNPromise.reject(BREAK))))
			.thenSynchronous(
				() => expect(false).toBeTruthy(),
				e => expect(e).toBe(BREAK))
	);

	it('should rejected a disposed promise-result..', () =>
		new TSDNPromise((resolve => {
			const r = TSDNPromise.resolve(1);
			r.dispose();
			resolve(r);
		}))
			.thenSynchronous(
				() => expect(false).toBeTruthy(),
				e => expect(e instanceof ObjectDisposedException).toBeTruthy())
	);
