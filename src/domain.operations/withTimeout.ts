import type {
  Procedure,
  ProcedureContext,
  ProcedureInput,
  ProcedureOutput,
} from 'as-procedure';
import { type IsoDuration, toMilliseconds } from 'iso-time';

export function withTimeout<TInput, TContext, TOutput>(
  logic: () => TOutput, // empty inputs override
  options: { threshold: IsoDuration },
): typeof logic;
export function withTimeout<TInput, TContext, TOutput>(
  logic: Procedure<TInput, TContext, TOutput>,
  options: { threshold: IsoDuration },
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
  options: { threshold: IsoDuration },
): typeof logic {
  const thresholdMs = toMilliseconds(options.threshold);
  return (
    input: ProcedureInput<typeof logic>,
    context: ProcedureContext<typeof logic>,
  ): ProcedureOutput<typeof logic> => {
    // track the timeout handle so we can clear it when the race completes
    let timeoutId: ReturnType<typeof setTimeout>;

    // create a promise that rejects in <ms> milliseconds; https://italonascimento.github.io/applying-a-timeout-to-your-promises/
    const timeout = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(
          new Error(
            `promise was timed out in ${thresholdMs} ms, by withTimeout`,
          ),
        );
      }, thresholdMs);
    });

    // returns a "race" between our timeout and the function executed with the input params
    return Promise.race([
      logic(input, context), // the wrapped fn, executed w/ the input params
      timeout, // the timeout
    ]).finally(() => {
      // clear the timeout to prevent open handles (e.g., Jest warnings)
      clearTimeout(timeoutId);
    }) as ProcedureOutput<typeof logic>;
  };
}
