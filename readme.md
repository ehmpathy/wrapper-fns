# wrapper-fns

![test](https://github.com/ehmpathy/wrapper-fns/workflows/test/badge.svg)
![publish](https://github.com/ehmpathy/wrapper-fns/workflows/publish/badge.svg)

Use wrappers for simpler, safer, and more readable code.

Wrap your procedures with before and after effects to abstract away common lifecycle tasks. This library makes it simple to use wrappers and includes a standard set of primitive wrappers.


# install

```sh
npm install wrapper-fns
```

# use

### `withRetry`

retries the wrapped logic execution in case of failure

for example
```ts
const result = await withRetry(doSomethingFlakey)()
```

### `withTimeout(logic, options)`

throws a timeout error if the wrapped logic takes longer than the threshold

- if your async fn takes longer than timeout ms, then an error will be thrown
- if your async fn executes faster than timeout ms, you'll get the normal response of the fn


for example
```ts
const result = await withTimeout(() => doSomethingAsync(...args), { threshold: { seconds: 3 } });
```
or
```ts
const result = await withTimeout(doSomethingAsync, { threshold: { seconds: 3 } })(...args);
```
or even
```ts
const doSomethingAsyncWithTimeout = withTimeout(doSomethingAsync, { threshold: { seconds: 3 } });
const result = await doSomethingAsyncWithTimeout(...args);
```

### `withBottleneck`

executes the wrapped logic execution within a bottleneck

for example
```ts
const result = await withBottleneck(doSomethingFlakey)()
```
