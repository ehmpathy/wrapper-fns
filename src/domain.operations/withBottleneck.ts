import Bottleneck from 'bottleneck';

const machineWideDefaultBottleneck = new Bottleneck({ maxConcurrent: 1 });

export const withBottleneck = <
  I extends any[],
  O extends Promise<any>,
  T extends (...args: I) => O,
>(
  logic: T,
  options: {
    bottleneck: Bottleneck;
  } = { bottleneck: machineWideDefaultBottleneck },
): T => {
  const wrapped = (...args: I) =>
    options.bottleneck.schedule<O>(() => logic(...args));
  return wrapped as T;
};
