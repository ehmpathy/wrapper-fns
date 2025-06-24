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

### `withWrappers`

applies wrappers chosen in a list, to avoid nested indentations

```ts
const wrapped = withWrappers(doGreatThing, [
  setWrapper({
    wrapper: withLogTrail,
    options: { name: 'doGreatThing' },
  }),
  setWrapper({
    wrapper: withTimeout,
    options: { threshold: 100 },
  }),
]);
```

*note, we use `setWrapper` to allow typescript to enforce the relationship between `options` and the `wrapper`*


### `withRetry`

retries the wrapped logic execution in case of failure

for example
```ts
const result = await withRetry(doSomethingFlakey)()
```


### `withBottleneck`

executes the wrapped logic execution within a bottleneck

for example
```ts
// use the global bottleneck by default
const result = await withBottleneck(doSomethingRatelimited)()
```
or
```ts
// use a dedicated bottleneck instead
const options = { bottleneck: new Bottleneck({ maxConcurrent: 3 }) }
const result = await withBottleneck(doSomethingRatelimited, options)()
```

### `withTimeout`

throws a timeout error if the wrapped logic takes longer than the threshold

- if your async fn takes longer than timeout ms, then an error will be thrown
- if your async fn executes faster than timeout ms, you'll get the normal response of the fn


for example
or
```ts
const options = { threshold: { seconds: 3 } }
const result = await withTimeout(doSomethingAsync, options)(...args);
```
