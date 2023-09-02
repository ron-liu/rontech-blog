---
title: How to switch to use jest instead of mocha in anchor
date: "2022-02-19"
---

By default anchor provides `mocha`, while in most front-end project we use `jest`.

If we can switch anchor to use `jest`, it will bring us the below benefits:

- Stop context switch. Though the grammars for the two test frameworks are very similar, but they are different, esp., for the test matcher. To use the same framework improve our productivity.
- `jest` brings more interesting features, something like: `it.each`, `describe.each`, extendable test matches and many existing extended test matches.

OK, if it is the right way to go, let's proceed.

1. Remove existing `mocha` stuff

```bash
yarn remove chai mocha ts-mocha @types/mocha -D
```

2. Install `jest` stuff

```bash
yarn add @types/jest @types/node jest ts-jest ts-node -D
```

3. Create jest config file named `jest.config.js` in the project root folder, and put the below content into the file:

```ts
/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testTimeout: 200000,
  setupFilesAfterEnv: ["<rootDir>/jestSetup.ts"],
  globals: {
    "ts-jest": {
      tsconfig: "./tsconfig.json",
    },
  },
}
```

4.  Modify `Anchor.toml` file, change the `scripts` section to be the below

```
[scripts]
test = "yarn run jest --detectOpenHandles --forceExit --watch"
```

5.  Modify `tsconfig.json`, update types to only have `jest`

```json
{
  "compilerOptions": {
    "types": ["jest"]
    //...
  }
}
```
