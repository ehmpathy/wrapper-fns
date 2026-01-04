import type { Procedure } from 'as-procedure';

import type { WrapperChoice } from '@src/domain.objects/Wrapper';

/**
 * .what = a helper procedure to ensure that the choice.options matches the wrapper.options
 */
export const setWrapper = <TProc extends Procedure, TOptions>(
  input: WrapperChoice<TProc, TOptions>,
): WrapperChoice<TProc, TOptions> & { _safe: true } => {
  return Object.assign(input, { _safe: true as const }); // add the safe flag to compile-time warn if setter was not used; // todo: use a symbol instead
};

/**
 * .what = a wrapper of wrappers
 * .why =
 *   - eliminates nested indentation when multiple wrappers are used
 */
export function withWrappers<
  TProcedure extends Procedure,
  TChoices extends ReadonlyArray<
    WrapperChoice<TProcedure, any> & { _safe: true }
  >,
>(logic: TProcedure, wrappers: TChoices): TProcedure {
  return wrappers.reduce(
    (wrapped, { wrapper, options }) => wrapper(wrapped, options),
    logic,
  );
}
