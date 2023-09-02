---
title: How to cache data fetched remotely properly in Nodejs?
date: "2023-02-26"
---

When developing server-side applications in Node.js, it's often necessary to cache data that is fetched from remote servers. For instance, we may need to cache configuration data obtained from a remote API that rarely changes. In this article, we'll explore how to properly cache remotely fetched data in Node.js and avoid a common mistake.

## The problem

For example, we have a function that fetches configuration data from a remote API and returns it as a promise, let's just call it `fetchConfig()` and give it the following mocked implementation:

```js
function fetchConfig() {
  return Promise.resolve({
    pageSize: 10,
  })
}
```

Now, we want to cache the configuration data in memory so that we don't have to fetch it again and again. We can do this by storing the configuration data in a variable and returning it from the function if it's already set:

```js
let config
async function fetchCachedConfig() {
  if (config) {
    return config
  }
  config = await fetchConfig()
  return config
}
```

Let verify if the cache works as expected:

**Case #1: sequential requests**

```js
it("Should be called only once when several requests fired sequentially", async () => {
  await fetchCachedConfig()
  const conf = await fetchCachedConfig()
  expect(fetchConfigSpiedOn).toHaveBeenCalledTimes(1)
})
```

**Case #2: concurrently requests**

```js
it("Should be called only once when several requests fired concurrently", async () => {
  const conf = await Promise.all([fetchCachedConfig(), fetchCachedConfig()])
  expect(fetchConfigSpiedOn).toHaveBeenCalledTimes(1)
})
```

Test result:

```bash
✓ Should be called only once when several requests fired sequentially (2 ms)
✕ Should be called only once when several requests fired concurrently (1 ms)

● Should be called only once when several requests fired concurrently

  expect(jest.fn()).toHaveBeenCalledTimes(expected)

  Expected number of calls: 1
  Received number of calls: 2
```

The first test passes, but the second one fails. The reason is that when the two requests fired concurrently, the `config` variable is not yet set when the second request is processed. This means that the second request will fetch the configuration data again and hit the remote server, which is not what we want.

Actually, the issue is formally called **Cache Stampede (Breakdown)** and the definition is as follows:

> A cache stampede occurs when a cache is accessed by a large number of clients at the same time, causing a large number of requests to be sent to the origin server. This can happen when a cache is invalidated, or when a cache is not properly populated.

## The solution

The solution is to force all the requests to wait until the configuration data is fetched and cached. We can do this by cache a promise that is resolved when the configuration data is fetched. Let's call it `configPromise` and give it the following implementation:

```js
let configPromise
async function fetchCachedConfig() {
  if (configPromise) {
    return configPromise
  }
  configPromise = fetchConfig()
  return configPromise
}
```

And we run the tests again, all green, Hooray🎉🎉🎉

```bash
 PASS  ./index.test.js
✓ Should be called only once when several requests fired sequentially (2 ms)
✓ Should be called only once when several requests fired concurrently (1 ms)
```

---

## Conclusion

In this article, we've explored how to properly cache remotely fetched data in Node.js to avoid cache stampedes. By caching a promise that is resolved when the data is fetched, we can ensure that all requests wait for the data to be cached before proceeding, preventing multiple requests from hitting the remote server.
