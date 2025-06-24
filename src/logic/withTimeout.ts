import { toMilliseconds, UniDuration } from '@ehmpathy/uni-time';
import {
  Procedure,
  ProcedureContext,
  ProcedureInput,
  ProcedureOutput,
} from 'visualogic';

export function withTimeout<TInput, TContext, TOutput>(
  logic: () => TOutput, // empty inputs override
  options: { threshold: UniDuration },
): typeof logic;
export function withTimeout<TInput, TContext, TOutput>(
  logic: Procedure<TInput, TContext, TOutput>,
  options: { threshold: UniDuration },
): typeof logic;

/**
 * returns a new function which calls the input function and "races" the result against a promise that throws an error on timeout.
 *
 * the result is:
 * - if your async fn takes longer than timeout ms, then an error will be thrown
 * - if your async fn executes faster than timeout ms, you'll get the normal response of the fn
 *
 * ### usage
 * ```ts
 * const result = await withTimeout(() => doSomethingAsync(...args), 3000);
 * ```
 * or
 * ```ts
 * const result = await withTimeout(doSomethingAsync, 3000)(...args);
 * ```
 * or even
 * ```ts
 * const doSomethingAsyncWithTimeout = withTimeout(doSomethingAsync, 3000);
 * const result = await doSomethingAsyncWithTimeout(...args);
 * ```
 */
export function withTimeout<TInput, TContext, TOutput>(
  logic: Procedure<TInput, TContext, TOutput>,
  options: { threshold: UniDuration },
): typeof logic {
  const thresholdMs = toMilliseconds(options.threshold);
  return (
    input: ProcedureInput<typeof logic>,
    context: ProcedureContext<typeof logic>,
  ): ProcedureOutput<typeof logic> => {
    // create a promise that rejects in <ms> milliseconds; https://italonascimento.github.io/applying-a-timeout-to-your-promises/
    const timeout = new Promise((resolve, reject) => {
      const id = setTimeout(() => {
        clearTimeout(id);
        reject(
          new Error(
            `promise was timed out in ${thresholdMs} ms, by withTimeout`,
          ),
        );
      }, thresholdMs); // tslint:disable-line align
    });

    // returns a "race" between our timeout and the function executed with the input params
    return Promise.race([
      logic(input, context), // the wrapped fn, executed w/ the input params
      timeout, // the timeout
    ]) as ProcedureOutput<typeof logic>;
  };
}
