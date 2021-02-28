---
title: react useEffect pattern ref previous
date: "2020-11-28"
description: use ref previous to solve complex effect triggering issue
---

## Problem

When we stated to use useEffect and slowly put more and more logics in the effect, it is very easily end up with a long dependency list because of the [eslint exhaustive-deps rule](https://github.com/facebook/react/issues/14920).

> We provide an `exhaustive-deps` ESLint rule as a part of the `eslint-plugin-react-hooks` package. It warns when dependencies are specified incorrectly and suggests a fix.

For example, the original goal of the effect is to execute it when the `A` prop is changed. However, because we end up with other props in deps list like `func1` prop and `obj1` prop, the effect triggering logic became either `A`, `func1` or `obj1` changed. For example check the following example.

```typescript
type Props = {name: string, onImpression: (event: {name: string} ) =>void;

const Person:React.FC<Props> = ({name, onImpression}) => {
  useEffect(() => {
    onImpression({name})
  }, [onImpression, name])
  return (<div>Person: {name}</div>)
}
```

`Person` is a react component display a person, and need to notify some tracking system like google analysis when the component is shown or the name is changed.

Therefore, we create a effect, it should execute, i.e, call `onImpression` when the first time the component is mount or the name is changed.

However, due to the `exhaustive-deps` rule, we have to put `onImpression` into the useEffect deps array.

It looks good if we assume `onImpression` is a static function.

However, `onImpression` is a passed function, it is out of our control. If for some reason it is varying, the `Person` component effect will be executed more times than what we expected.

For example the following is the consumer side code:

```typescript
const App: React.FC = () => {
  const onImpression = () => {
    // ...
  }

  return <Person name="ron" onImpression={onImpression} />
}
```

Did you see the problem?

Yes, the passed `onImpression` function is varying each time when the consume component re-renders.

You might argue, we can put `useCallback` or move `onImpression` out of the consume component and make it static.

In most cases, we probably can. However, we must keep in mind, it is out of the control of `Person` component.

**In other words, we should NOT assume any passed object or function props are static.**

OK, in the worst case, if the `onImpression` function is varying, how can we achieve the original goal that we should only fire onImpression when the component is mount or name is changed?

We are in dilemma, aren't we? If we don't put `onImpression` in deps array, we break the eslint rule. While if we put `onImpression` in deps array, potentially the component will fire `onImpression` more than once.

How can we solve it?

## Solution

We might miss the old react classic lifecycle `shouldComponentUpdate`, which accept `nextProps` and `nextState` and offer an opportunity to bypass the re-render process or not by comparing the current and the coming `props` and `state`.

The key thing here is `nextProps` and `nextState`, is it possible in the world of react hooks?

The answer is yes by using `ref previous` pattern. Check the following code:

```typescript
import {useRef} from 'react'
const Person:React.FC<{name: string, onImpression: (event: {name: string}) => void> = () => {
  const previousNameRef = useRef<string>()
  useEffect(() => {
    if (previousNameRef.current !== name) {
      onImpression({name})
    }
    previousNameRef.current = name
  }, [onImpression, name])
  return (<div>Person: {name}</div>)
}
```

We use `useRef` to hold the previous name, and initially it is undefined.

When the component is mount, the name and the previousName are different, `onImpression` will be executed and the `previousName` was set to the current name.

For some reason, if the `onImpression` is changed, and the effect will be triggered, but `onImpression` will not be fired because `previousName` is equal to current name.

Yeah, the problem solved.

One thing need to call out here is the `ref` is kinda of singleton, so the eslint rule allow it not listed in the useEffect deps array.

## Recap

If there is a effect and need to be executed when only some of the deps are changed.
In this case, We shall:

- Create previous ref for each props we care

- In the effect, wrap the actual effect code in the condition comparing the previous values and current values
