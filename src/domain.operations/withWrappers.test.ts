import { given, then } from 'test-fns';
import type { Procedure } from 'visualogic';

import type { Wrapper } from '@src/domain.objects/Wrapper';

import { setWrapper, withWrappers } from './withWrappers';

describe('withWrappers', () => {
  given('a simple procedure to wrap', () => {
    const withTimeoutCallInputs: any[] = [];
    const withTimeout: Wrapper<Procedure, { threshold: number }> = (
      logic,
      { threshold },
    ) => {
      return async (input, context) => {
        withTimeoutCallInputs.push(input);
        const start = Date.now();
        const result = await logic(input, context);
        const duration = Date.now() - start;
        if (duration > threshold) console.warn(`Took too long: ${duration}ms`);
        return result;
      };
    };

    const withLogTrailCallInputs: any[] = [];
    const withLogTrail: Wrapper<Procedure, { name: string }> = (
      logic,
      { name },
    ) => {
      return async (input, context) => {
        withLogTrailCallInputs.push(input);
        console.log(`[${name}] Input:`, input);
        const result = await logic(input, context);
        console.log(`[${name}] Output:`, result);
        return result;
      };
    };

    const logic: Procedure<
      { payload: string },
      { userUuid: string },
      Promise<string>
    > = async (input, context) => {
      return `Processed ${input.payload} for ${context.userUuid}`;
    };

    then('it should successfully execute the wrappers', async () => {
      const wrapped = withWrappers(logic, [
        setWrapper({
          wrapper: withLogTrail,
          options: { name: 'wrapped-procedure' },
        }),
        setWrapper({
          wrapper: withTimeout,
          options: { threshold: 100 },
        }),
      ]);

      await wrapped({ payload: 'yellow' }, { userUuid: 'beefbeef...' });
      expect(withLogTrailCallInputs.length).toEqual(1);
      expect(withTimeoutCallInputs.length).toEqual(1);

      await wrapped({ payload: 'blue' }, { userUuid: 'beefbeef...' });
      expect(withLogTrailCallInputs.length).toEqual(2);
      expect(withTimeoutCallInputs.length).toEqual(2);
    });

    then(
      'it should typethrow if setWrapper was not used',
      {
        because: 'this guarantees the options are typechecked',
      },
      () => {
        withWrappers(logic, [
          // @ts-expect-error: Property '_safe' is missing in type '{ wrapper: Wrapper<Procedure, { name: string; }>; options: { name: string; }; }' but required in type '{ _safe: true; }'.
          {
            wrapper: withLogTrail,
            options: { name: 'wrapped-procedure' },
          },
        ]);
      },
    );
  });
});
