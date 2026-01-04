import type {
  Procedure,
  ProcedureContext,
  ProcedureInput,
  ProcedureOutput,
} from 'as-procedure';
import type { ContextLogTrail } from 'simple-log-methods';

export function withRetry<TOutput>(logic: () => TOutput): typeof logic;
export function withRetry<TInput, TOutput>(
  logic: (input: TInput) => TOutput,
): typeof logic;
export function withRetry<TInput, TContext extends ContextLogTrail, TOutput>(
  logic: Procedure<TInput, TContext, TOutput>,
): typeof logic;

/**
 * .what = wraps a procedure to retry once on error
 * .why = provides resilience against transient failures
 * .note = logs retry attempts if context.log is available, otherwise retries silently
 */
export function withRetry<TInput, TContext, TOutput>(
  logic: Procedure<TInput, TContext, TOutput>,
): typeof logic {
  return (async (
    input: ProcedureInput<typeof logic>,
    context: ProcedureContext<typeof logic>,
  ): Promise<ProcedureOutput<typeof logic>> => {
    try {
      return await logic(input, context);
    } catch (error) {
      if (!(error instanceof Error)) throw error;

      // log retry attempt if context.log is available
      const log = (context as { log?: { warn?: (...args: unknown[]) => void } })
        ?.log;
      if (log?.warn) {
        log.warn('withRetry.progress: caught an error, will retry', {
          error: {
            message: error.message,
            stack: error.stack,
          },
        });
      }

      return await logic(input, context);
    }
  }) as typeof logic;
}
