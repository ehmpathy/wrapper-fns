# wrapper-fns

![test](https://github.com/ehmpathy/wrapper-fns/workflows/test/badge.svg)
![publish](https://github.com/ehmpathy/wrapper-fns/workflows/publish/badge.svg)

use wrappers for simpler, safer, and more readable code.

wrap your procedures with before and after effects to abstract away common lifecycle tasks. this library makes it simple to compose wrappers and includes a standard set of primitives.

# install

```sh
npm install wrapper-fns
```

# use

## `withRetry`

retries the wrapped procedure once on error, providing resilience against transient failures.

```ts
import { withRetry } from 'wrapper-fns';

const doSomethingFlakey = async () => { /* ... */ };

// wrap and invoke
const result = await withRetry(doSomethingFlakey)();
```

logs retry attempts when `context.log` is available:

```ts
const doSomethingFlakey = async (
  input: { id: string },
  context: { log: LogMethods },
) => { /* ... */ };

// retry will log a warning before the second attempt
const result = await withRetry(doSomethingFlakey)({ id: '123' }, { log: console });
```

## `withTimeout`

throws a timeout error if the wrapped procedure exceeds the threshold duration.

```ts
import { withTimeout } from 'wrapper-fns';

const doSomethingSlow = async () => { /* ... */ };

// throws if execution takes longer than 3 seconds
const result = await withTimeout(doSomethingSlow, { threshold: { seconds: 3 } })();
```

supports multiple duration formats via [uni-time](https://github.com/ehmpathy/uni-time):

```ts
// milliseconds
await withTimeout(logic, { threshold: { milliseconds: 500 } })();

// minutes
await withTimeout(logic, { threshold: { minutes: 2 } })();
```

## `withBottleneck`

executes the wrapped procedure within a [bottleneck](https://github.com/SGrondin/bottleneck) for rate limiting and concurrency control.

```ts
import Bottleneck from 'bottleneck';
import { withBottleneck } from 'wrapper-fns';

const callExternalApi = async () => { /* ... */ };

// use the global bottleneck (maxConcurrent: 1)
const result = await withBottleneck(callExternalApi)();

// use a custom bottleneck
const limiter = new Bottleneck({ maxConcurrent: 3, minTime: 100 });
const result = await withBottleneck(callExternalApi, { bottleneck: limiter })();
```

## `withWrappers`

composes multiple wrappers without nested indentation.

```ts
import { withWrappers, setWrapper, withRetry, withTimeout } from 'wrapper-fns';

const doGreatThing = async (input: { id: string }) => { /* ... */ };

const wrapped = withWrappers(doGreatThing, [
  setWrapper({
    wrapper: withTimeout,
    options: { threshold: { seconds: 5 } },
  }),
  setWrapper({
    wrapper: withRetry,
    options: undefined, // withRetry has no options
  }),
]);

// equivalent to: withRetry(withTimeout(doGreatThing, { threshold: { seconds: 5 } }))
const result = await wrapped({ id: '123' });
```

use `setWrapper` to get type-safe enforcement of the relationship between `wrapper` and `options`.

# types

## `Wrapper`

the type signature for a wrapper function:

```ts
type Wrapper<TProcedure extends Procedure, TOptions> = (
  logic: TProcedure,
  options: TOptions,
) => TProcedure;
```

## `WrapperChoice`

the type for configuring a wrapper with its options:

```ts
type WrapperChoice<TProcedure extends Procedure, TOptions> = {
  wrapper: Wrapper<TProcedure, TOptions>;
  options: TOptions;
};
```

# custom wrappers

create your own wrappers following the same pattern:

```ts
import type { Wrapper } from 'wrapper-fns';
import type { Procedure } from 'as-procedure';

const withLogging: Wrapper<Procedure, { name: string }> = (logic, options) => {
  return async (input, context) => {
    console.log(`${options.name}: started`);
    const result = await logic(input, context);
    console.log(`${options.name}: completed`);
    return result;
  };
};

// use it
const wrapped = withLogging(myProcedure, { name: 'myProcedure' });
```
