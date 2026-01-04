import type { Procedure } from 'as-procedure';
import type { ContextLogTrail } from 'simple-log-methods';
import { given, then } from 'test-fns';

import { withRetry } from './withRetry';

/**
 * .what = unit tests for withRetry wrapper
 * .why = prove type safety and runtime behavior
 *
 * design: withRetry has flexible overloads
 * - nullary procedure `() => T` - compiles, retries silently
 * - unary procedure `(input) => T` - compiles, retries silently
 * - contexted procedure `Procedure<I, C, O>` - requires C extends ContextLogTrail
 *
 * approach:
 * - positive cases: code that SHOULD compile (no @ts-expect-error)
 * - negative cases: code that should NOT compile (with @ts-expect-error)
 */

/**
 * .what = mock log methods for testing
 */
const createMockLog = () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
});

describe('withRetry', () => {
  describe('devtime behavior', () => {
    given('a nullary procedure', () => {
      then('it should compile', () => {
        const nullaryProcedure = async () => 42;
        const wrapped = withRetry(nullaryProcedure);
        expect(wrapped).toBeDefined();
      });
    });

    given('a unary procedure', () => {
      then('it should compile', () => {
        const unaryProcedure = async (input: { value: number }) =>
          input.value * 2;
        const wrapped = withRetry(unaryProcedure);
        expect(wrapped).toBeDefined();
      });
    });

    given('a contexted procedure with valid context', () => {
      then('it should compile', () => {
        const contextedProcedure: Procedure<
          { value: number },
          ContextLogTrail,
          Promise<number>
        > = async (input, context) => {
          context.log.debug('processing', { value: input.value });
          return input.value * 2;
        };
        const wrapped = withRetry(contextedProcedure);
        expect(wrapped).toBeDefined();
      });
    });

    given('a contexted procedure with invalid context', () => {
      then(
        'it should throw compile-time error',
        {
          because:
            'contexted procedure overload requires TContext extends ContextLogTrail',
        },
        () => {
          const contextedProcedure: Procedure<
            { value: number },
            { userId: string }, // no log!
            Promise<number>
          > = async (input, _context) => {
            return input.value * 2;
          };

          // @ts-expect-error: context { userId: string } does not extend ContextLogTrail
          const wrapped = withRetry(contextedProcedure);
          expect(wrapped).toBeDefined();
        },
      );
    });

    given('a nullary procedure from withTimeout composition', () => {
      then('it should compile', () => {
        const nullaryProcedure = async () => 'some value';
        const wrapped = withRetry(nullaryProcedure);
        expect(wrapped).toBeDefined();
      });
    });
  });

  describe('runtime behavior', () => {
    given('a contexted procedure that succeeds', () => {
      then('it should return result without logging', async () => {
        const mockLog = createMockLog();
        const contextedProcedure: Procedure<
          { value: number },
          ContextLogTrail,
          Promise<number>
        > = async (input, _context) => input.value * 2;

        const wrapped = withRetry(contextedProcedure);
        const result = await wrapped({ value: 21 }, { log: mockLog });

        expect(result).toEqual(42);
        expect(mockLog.warn).not.toHaveBeenCalled();
      });
    });

    given('a contexted procedure that fails once then succeeds', () => {
      then('it should log warning and return result', async () => {
        const mockLog = createMockLog();
        let callCount = 0;

        const contextedProcedure: Procedure<
          { value: number },
          ContextLogTrail,
          Promise<number>
        > = async (input, _context) => {
          callCount++;
          if (callCount === 1) {
            throw new Error('transient failure');
          }
          return input.value * 2;
        };

        const wrapped = withRetry(contextedProcedure);
        const result = await wrapped({ value: 21 }, { log: mockLog });

        expect(result).toEqual(42);
        expect(callCount).toEqual(2);
        expect(mockLog.warn).toHaveBeenCalledWith(
          'withRetry.progress: caught an error, will retry',
          expect.objectContaining({
            error: expect.objectContaining({
              message: 'transient failure',
            }),
          }),
        );
      });
    });

    given('a contexted procedure that fails twice', () => {
      then('it should throw the second error', async () => {
        const mockLog = createMockLog();
        let callCount = 0;

        const contextedProcedure: Procedure<
          { value: number },
          ContextLogTrail,
          Promise<number>
        > = async (_input, _context) => {
          callCount++;
          throw new Error(`failure attempt ${callCount}`);
        };

        const wrapped = withRetry(contextedProcedure);

        await expect(wrapped({ value: 21 }, { log: mockLog })).rejects.toThrow(
          'failure attempt 2',
        );

        expect(callCount).toEqual(2);
        expect(mockLog.warn).toHaveBeenCalledTimes(1);
      });
    });

    given('a nullary procedure that fails once then succeeds', () => {
      then('it should retry silently', async () => {
        let callCount = 0;

        const nullaryProcedure = async () => {
          callCount++;
          if (callCount === 1) {
            throw new Error('transient failure');
          }
          return 42;
        };

        const wrapped = withRetry(nullaryProcedure);
        const result = await wrapped();

        expect(result).toEqual(42);
        expect(callCount).toEqual(2);
      });
    });

    given('a nullary procedure from withTimeout composition', () => {
      then('it should retry silently on failure', async () => {
        let callCount = 0;
        const nullaryProcedure = async () => {
          callCount++;
          if (callCount === 1) throw new Error('timeout');
          return 'success';
        };

        const wrapped = withRetry(nullaryProcedure);
        const result = await wrapped();

        expect(result).toEqual('success');
        expect(callCount).toEqual(2);
      });
    });
  });
});
