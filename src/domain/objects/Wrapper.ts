import { Procedure } from 'domain-glossary-procedure';

export type Wrapper<TProcedure extends Procedure, TOptions> = (
  logic: TProcedure,
  options: TOptions,
) => TProcedure;

export type WrapperChoice<TProcedure extends Procedure, TOptions> = {
  wrapper: Wrapper<TProcedure, TOptions>;
  options: TOptions;
};
