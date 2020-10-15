---
tags: ["nodejs"]
---

# `nodejs`: How peerDependencies works?

Imagine there is `app` project depends on `lib` project, and both depends on `graphql` repo, and in `lib`, it marks as `dependencies`, like below

app project package.json file:

```json
{
  "dependencies": {
    "graphql": "^15.0.0",
    "lib": "^1.0.0"
  }
}
```

lib project package.json file:

```json
{
  "dependencies": {
    "graphql": "^15.0.0"
  }
}
```

If we run `yarn`, after that we run `yarn list graphql`, I am expecting seeing there will be two copies of graphql, but there is only one.

_So how to make two copies happening?_
However, if we remove `lib` first by running `yarn remove lib`, then install a old version of graphql like `yarn add graphql@15.0.0`.
After that, we install `lib` by running `yarn add lib`. After we check the installed graphql package by running `yarn list graphql`. Interestingly, there will be two versions.

The takeaway is when the parent package and the child package both depend on the same version of a 3rd party of package, it will just have one copy in the node_modules. Only when the versions are different, there will be two copies.

So how to prevent there is two copies of the same package that parent package and child package both depend on, the answer is `peerDependencies`. Given the above example, in this case we change the package.json file in `lib` project as below:

```json
{
  "peerDependencies": {
    "graphql": "^15.0.0"
  },
  "devDependencies": {
    "graphql": "^15.0.0"
  }
}
```

Then we repeat the above steps, we will still result one copy of `graphql` package.
