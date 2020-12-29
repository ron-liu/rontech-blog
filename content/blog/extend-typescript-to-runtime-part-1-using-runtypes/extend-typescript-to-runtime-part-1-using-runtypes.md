---
title: Extend typescript to runtime - Part 1 using runtypes
date: "2020-12-20"
description: typescript types will be wiped when compiling, but how to use these types in runtime?
--- 

Typescript introduced type system into javascript, but it is only existed till compiled into javascript.
When we run those compiled code in runtime, all the types are disappeared.

This might not be a big issue, because in most case we can verify all the data type statically.

But how about the inputs from outside? A typically example is we need to fetch data from some REST APIs. 
We definitely cannot verify the inputs statically.

## Happy path

Let's give a example, check the following example:

```typescript
type Person = {
  name: string;
  films: string[];
};

const fetchPerson = async (id: string): Promise<Person> => {
  return await fetch(`https://swapi.dev/api/people/${id}/`).then((res) =>
    res.json()
  );
};

const main = async () => {
  const person = await fetchPerson("1");
  console.log(`${person.name} has been in ${person.films.length} films.`);
};

main();
```

When we run it in [code sandbox](https://codesandbox.io/s/fetch-person-3nlee), it will output: `Luke Skywalker has been in 4 films.`.

You might be happy with the code, as it looks strong typed, and typescript engine didn't complain anything.

But there is a huge flaws. Let imaging we didn't get that lucky at very beginning.

## Sad path

Imaging we made a small typo, we typed `movies` instead of `films` like below:

```typescript
type Person = {
  name: string;
  movies: string[]; // <--- should be films, but we typed movies
};

const fetchPerson = async (id: string): Promise<Person> => {
  return await fetch(`https://swapi.dev/api/people/${id}/`).then((res) =>
    res.json()
  );
};

const main = async () => {
  const person = await fetchPerson("1");
  console.log(`${person.name} has been in ${person.movies.length} films.`); // <--- same here, and the unexpected error actually generated from here
};

main();
```

When we run it, it will report an uncaught error: `Cannot read property 'length' of undefined`.
Check [code sandbox](https://codesandbox.io/s/fetch-person-with-wrong-type-kjx03) for details.

It is sad, it's hard to tell where it is coming from if it is big code base.

## Add some validation code

The first instinct to solve the issue is to add validation after fetch data, like the below:

```typescript
type Person = {
  name: string;
  movies: string[];
};

const fetchPerson = async (id: string): Promise<Person> => {
  const person = await fetch(`https://swapi.dev/api/people/${id}/`).then((res) =>
    res.json()
  );
  if (typeof person.name !== 'string' || !Array.isArray(person.movies) || person.movies.any(movie=>typeof movie !== string)) {
    throw new Error(`the fetched person is not aligned with our type`)
  }
  return person
};

const main = async () => {
  const person = await fetchPerson("1");
  console.log(`${person.name} has been in ${person.movies.length} films.`);
};

main();
```

Check [code sandbox](https://codesandbox.io/s/fetch-person-with-wrong-type-validation-2el7q) for details.

The problem is solved, but you might not happy.

Why?

Because the validation logic didn't take any advantage of the `Person` type we defined earlier.
In another word, the type logic is duplicated in two places, one in static typescript code, another one in dynamic javascript code.
If we change the `Person` definition, we have to change in both places. This is an obvious breach to the DRY (Don't Repeat Yourself) rule.

How to solve it?

How to put the type definition logic in one place?

## Introduce `runtypes`

```typescript
import * as Runtypes from "runtypes";

// Define the type in runtypes
const PersonRunType = Runtypes.Record({
  name: Runtypes.String,
  movies: Runtypes.Array(Runtypes.String)
}); 

// Generate the typescript based on the above runtypes
type Person = Runtypes.Static<typeof PersonRunType>;

const fetchPerson = async (id: string): Promise<Person> => {
  const person = await fetch(
    `https://swapi.dev/api/people/${id}/`
  ).then((res) => res.json());

  // the runtypes go with a validation function, and if it doesn't match the types, it will throw an exception
  return PersonRunType.check(person);
};

const main = async () => {
  const person = await fetchPerson("1");
  console.log(`${person.name} has been in ${person.movies.length} films.`);
};

main();
```

When we run this code block, it will output: `Expected array, but was undefined in movies`.
It is because of `PersonRunType.check(person)`, which gave us some information about what's going on. Also the biggest benefit is the typescript and the validation logic share the same logic.
We don't repeat the logic.

Now, we can just change `movies` to `films` in one place to solve the issue like below:

```typescript
const PersonRunType = Runtypes.Record({
  name: Runtypes.String,
  films: Runtypes.Array(Runtypes.String) // <-- Change here
}); 

const main = async () => {
  const person = await fetchPerson("1");
  console.log(`${person.name} has been in ${person.films.length} films.`); // <-- Change here 
};
```

Please check the details in [code sandbox](https://codesandbox.io/s/fetch-person-wrong-type-with-runtypes-7ie21).

## Sum up

Typescript can only verify the types in static, we need extra code to verify if the data is coming from outside dynamically. This will end up with duplicated code for the type validation and hard to maintain.

`runtypes` use its own way to define the type, and can generate the typescript type and the validation function. By doing that, the dynamic validation and the typescript type stay in one place.
