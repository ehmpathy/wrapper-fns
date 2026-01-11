import { given, then, when } from 'test-fns';

import { withTimeout } from './withTimeout';

/**
 * .what = unit tests for withTimeout wrapper
 * .why = prove timeout behavior and cleanup of timer handles
 */
describe('withTimeout', () => {
  describe('runtime behavior', () => {
    given('a procedure that completes before timeout', () => {
      when('executed', () => {
        then('it should return the result', async () => {
          const procedure = async () => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            return 42;
          };

          const wrapped = withTimeout(procedure, { threshold: { seconds: 1 } });
          const result = await wrapped();

          expect(result).toEqual(42);
        });

        then(
          'it should clear the timeout handle (no open handles)',
          async () => {
            // use fake timers to verify the timeout is cleared
            jest.useFakeTimers();

            const procedure = async () => 'done';
            const wrapped = withTimeout(procedure, {
              threshold: { seconds: 10 },
            });

            const resultPromise = wrapped();

            // advance past the procedure (which resolves immediately)
            await jest.runAllTimersAsync();

            const result = await resultPromise;
            expect(result).toEqual('done');

            // verify no timers remain pending
            expect(jest.getTimerCount()).toEqual(0);

            jest.useRealTimers();
          },
        );
      });
    });

    given('a procedure that exceeds timeout', () => {
      when('executed', () => {
        then('it should throw timeout error', async () => {
          jest.useFakeTimers();

          const procedure = async () => {
            await new Promise((resolve) => setTimeout(resolve, 5000));
            return 'never reached';
          };

          const wrapped = withTimeout(procedure, { threshold: { seconds: 1 } });
          const resultPromise = wrapped();

          // advance time past the timeout threshold
          jest.advanceTimersByTime(1001);

          await expect(resultPromise).rejects.toThrow(
            'promise was timed out in 1000 ms, by withTimeout',
          );

          jest.useRealTimers();
        });
      });
    });

    given('a procedure with input and context', () => {
      when('executed', () => {
        then('it should pass through input and context', async () => {
          const procedure = async (
            input: { value: number },
            context: { multiplier: number },
          ) => {
            return input.value * context.multiplier;
          };

          const wrapped = withTimeout(procedure, { threshold: { seconds: 1 } });
          const result = await wrapped({ value: 7 }, { multiplier: 6 });

          expect(result).toEqual(42);
        });
      });
    });

    given('a procedure that throws an error', () => {
      when('executed', () => {
        then('it should propagate the error and clear timeout', async () => {
          jest.useFakeTimers();

          const procedure = async () => {
            throw new Error('procedure failed');
          };

          const wrapped = withTimeout(procedure, {
            threshold: { seconds: 10 },
          });

          await expect(wrapped()).rejects.toThrow('procedure failed');

          // verify timeout was cleared despite error
          expect(jest.getTimerCount()).toEqual(0);

          jest.useRealTimers();
        });
      });
    });
  });
});
