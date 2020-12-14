---
title: 3 ways to debug npm package 
date: "2020-12-14"
description: 3 ways to debug npm package 
---

Quite often, when we develop npm packages, we want to test them as a consumer. In order to test, if you think you have to publish it, you are out. There are at least three ways to make your life a lot easier.

## Test scenarios

Before we jump into the three method, let's image the below scenarios we want to test:

- Test locally: We want to test the package locally, because we can simulate the consumer locally.

- Test within our team: My college want to test the package, as he/she is developing the consumer.

- Test out of our team: Other team or our customers want to test the package.

## Method 1 yarn link

**Used scenarios: `Test locally`**

Imaging I want to develop a react router called `awesome-router`, and I have a local project called `try-router` to test the usage of the `awesome-router`:

1. In the folder of `~/awesome-router`, run `yarn link`
It actually tells `yarn`, if others want to `link` me, I am here.

2. In the folder of `~/try-router`, run `yarn link awesome-router`
This will create a `symlink` folder under `node_modules/awesome-router` that links to your local copy of the source package.

By setting up the above, when we modify `awesome-router` project, `try-router` test project will immediately get the new updated code.

However, due to the limitation of `symlink`, this approach only works for the case when consumer and source package stay in the same computer.

## Method 2 yarn pack

**Used scenarios: `Test within our team`**

Let's continue the above example. I worked very hard, and I finished the development of `awesome-router`, and verified it works perfectly locally. And my college want introduce this package into his/her project called `tiger-shopping`.

Yes, we might still can use the above approach. But it is tedious, which means my college has to download my source code, and set them up in his/her computer.

Is there some easy way, like some simulated local npm package center?

Yes, `yarn pack` comes to rescue:

1. In my computer, under folder of `~/awesome-router`, run `yarn pack`
It creates a compressed gzip archive of package dependencies, something like: `awesome-router-v0.1.0.tgz`. It is the package that upload to npm package center.

2. Copy the generated gzip file to my college computer, might directly under `~/tiger-shopping`.

3. In my college computer, under folder of `~/tiger-shopping`, run `yarn add awesome-router-v0.1.0.tgz`
It added the package into its `node_modules` folder. If in the `package.json` file, we find that the `awesome-router` line has been changed to something like the below:

```json
{
  "dependencies": {
    "awesome-router": "~/tiger-shopping/awesome-router-v0.1.0.tgz"
  }
}
```

If we observed the above, which indicates that `yarn pack` succeed.

Then my college can start testing my awesome package.

If my college find bugs, and I need to modify the code and do the following again:

1. In my computer, under `~/awesome-router` folder, run `yarn pack`

2. Copy the generated gzip file to my college computer, might directly under `~/tiger-shopping`.

3. Because usually the gzip output filename didn't change (The gzip file is named as package name plus version number, the name will be the same as no version bumped), and yarn will cache the package. If we run the `yarn add awesome-router-v0.1.0.tgz`, it will use the cached file, and the package didn't get updated. We need to clean the cache by running `yarn cache clean --pattern awesome-router`.

Until everything goes well, then I can publish the package, and he/she can run `yarn add awesome-router` to update the package.

## Method 3 Release beta

Used scenario: `Test outside our team`

We move things very fast, and now the `awesome-package` is ready to meet more consumers. But I am still afraid we didn't cover all the cases, we want to test it with more users before we publish it to the whole world.

The idea way is to publish a beta package, and send it to some brave customers, let them try, and make the decision based on their feedbacks. The beta package should be looks like `awesome-router@5.0.0-beta.1`. And the customers can install them by running `yarn add awesome-router@5.0.0-beta.1`.

But how to publish a beta version? Is it difficult?

Hmm..., here we take some tricks, and assume we are using [`semantic-release`](https://github.com/semantic-release/semantic-release) to manage our release process.
`semantic-release` is an awesome package publishing tool, it follows the [`Angular Commit Message Conventions`](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines), automatically watch all the messages after last release, calculate the version it should bump to, and manage the workflow without hassles.

I use the following steps to publish a beta version, assume that our new version code stays in the a branch `massive-update`.

1. Create a branch from master called `beta`

2. Create a PR based on the branch `massive-update`, and choose the base branch to merge to be `beta`

3. Click `Merge` button

If your CI process has been setup with `semantic-release`, it should be done after a while.

If the feedbacks from your customers are pretty well, we can publish the formal release by create another PR with `massive-update` branch and merge it to `master`.

## Summary

Debug npm package is critical, and there are several ways to debug depending on different scenarios.

| Scenario              | Method                              |
| --------------------- | ----------------------------------- |
| Test locally          | `yarn link`                         |
| Test within team      | `yarn pack`                         |
| Test outside the team | beta release via `semantic-release` |
