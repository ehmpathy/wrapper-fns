import type {
  Procedure,
  ProcedureContext,
  ProcedureInput,
  ProcedureOutput,
  VisualogicContext,
} from 'visualogic';

export function withRetry<TInput, TContext extends VisualogicContext, TOutput>(
  logic: () => TOutput, // empty inputs override
): typeof logic;
export function withRetry<TInput, TContext extends VisualogicContext, TOutput>(
  logic: (input: TInput) => TOutput, // empty inputs override
): typeof logic;
export function withRetry<TInput, TContext extends VisualogicContext, TOutput>(
  logic: Procedure<TInput, TContext, TOutput>,
): typeof logic;

/**
 * function which calls the wrapped function and runs it again one time if an error is caught
 */
export function withRetry<TInput, TContext extends VisualogicContext, TOutput>(
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
      context.log.warn('withRetry.progress: caught an error, will retry', {
        error: {
          message: error.message,
          stack: error.stack,
        },
      });
      return await logic(input, context);
    }
  }) as typeof logic;
}
