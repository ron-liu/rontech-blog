---
title: Demystify apollo datasource cache
date: "2021-02-28"
description: What apollo datasource cache do and what the problem dataloader cache doesn't solve
---

Apollo data source and dataloader both support cache, but what they are exactly doing and why we need both of them. This article is trying to demystify this question.

When we develop graphql server using apollo server with REST api as the backend, we will use apollo datasource as recommended.
As the document says:

> Data sources are classes that encapsulate fetching data from a particular service, with built-in support for caching, deduplication, and error handling.

Did you notice, data sources built-in support for caching? But how it support cache, the document itself doesn't explain well.
Let's make a example to explain step by step.

## Step 1: Use fetch directly in apollo server

> You can check the code [here](https://github.com/ron-liu/demystify-apollo-datasource-cache/tree/1-use-fetch)

### Firstly, let's create a REST API server using koa

This API Server only has two routers as below:

* `/query?query={...}`, this router accept a query and return all the pets ids whose name contain the query. Be careful it only return ids.

* `/byId/:id`, this router accept an id and return all the properties of the pet

```javascript
const _ = require("koa-route");
const Koa = require("koa");
const app = new Koa();

const db = [
  { id: 1, name: "tobi", species: "ferret" },
  { id: 2, name: "loki", species: "ferret" },
  { id: 3, name: "jane", species: "ferret" },
];

const pets = {
  query: (ctx) => {
    console.log(`Hitting: pets/${ctx.query.query}`);
    ctx.body = db
      .filter((x) => x.name.includes(ctx.query.query))
      .map((x) => x.id);
  },
  byId: (ctx, id) => {
    console.error(`Hitting: byId/${id}`);
    const pet = db.find((x) => x.id == id);
    if (!pet) return ctx.throw("cannot find that pet", 404);
    ctx.body = pet;
  },
};
app.use(_.get("/pets", pets.query));
app.use(_.get("/pet/:id", pets.byId));

app.listen(3000);
console.log("listening on port 3000")
```

### Secondly, let's create a graphql server directly using fetch

Inside the resolvers, the query only return the id by calling `/pets?query=`, and the type filed resolver will pickup and calling `/pets/:id`.

```javascript
const { ApolloServer, gql } = require("apollo-server");
const fetch = require("node-fetch");

const typeDefs = gql`
  type Pet {
    name: String
    species: String
  }

  type Query {
    pets(query: String!): [Pet]
  }
`;

const resolvers = {
  Query: {
    pets: async (_source, { query }, { dataSources }) =>
      fetch(`http://localhost:3000/pets?query=${query}`).then((x) => x.json()),
  },
  Pet: {
    name: async (id, _args, { dataSources }) => {
      const pet = await fetch(`http://localhost:3000/pet/${id}`).then((x) =>
        x.json()
      );
      return pet.name;
    },
    species: async (id, _args, { dataSources }) => {
      const pet = await fetch(`http://localhost:3000/pet/${id}`).then((x) =>
        x.json()
      );
      return pet.species;
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

server.listen(4000).then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
```

if we fire the graphql server by the following query:

```graphql
{
  pets(query: "j") { 
    name
    species
  }
}
```

No surprisingly, It will hit server 3 times as below:

```bash
Hitting: pets/j
Hitting: byId/3
Hitting: byId/3
```

Obviously, without any cache supported, this approach duplicates the REST api calls, i.e. the 2nd and 3rd ones.

## Step 2: Data Source to rescue

Check [here](https://github.com/ron-liu/demystify-apollo-datasource-cache/tree/2-use-datasource) for the codes in this step.

I will keep the REST api code no touched, and change the apollo server code to use apollo-datasource-rest as below.

```javascript
const { ApolloServer, gql } = require("apollo-server");
const { RESTDataSource } = require("apollo-datasource-rest");

const typeDefs = gql`
  type Pet {
    name: String
    species: String
  }

  type Query {
    pets(query: String!): [Pet]
  }
`;

class PetsAPI extends RESTDataSource {
  constructor() {
    super();
    this.baseURL = "http://localhost:3000/";
  }
  async queryPets(query) {
    return this.get(`pets/?query=${query}`);
  }

  async getPetById(id) {
    return this.get(`pet/${id}`);
  }
}

const resolvers = {
  Query: {
    pets: async (_source, { query }, { dataSources }) =>
      dataSources.petsAPI.queryPets(query),
  },
  Pet: {
    name: async (id, _args, { dataSources }) => {
      const pet = await dataSources.petsAPI.getPetById(id);
      return pet.name;
    },
    species: async (id, _args, { dataSources }) => {
      const pet = await dataSources.petsAPI.getPetById(id);
      return pet.species;
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  dataSources: () => {
    return {
      petsAPI: new PetsAPI(),
    };
  },
});

server.listen(4000).then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
```

if we fire the graphql server by the following query again:

```graphql
{
  pets(query: "j") { 
    name
    species
  }
}
```

It decreased hitting server to 2 times as below:

```bash
Hitting: pets/j
Hitting: byId/3
```

Why it decreased the REST API requests?

When we refer to source code, it is very clear, see below or [here](https://github.com/apollographql/apollo-server/blob/main/packages/apollo-datasource-rest/src/RESTDataSource.ts#L268-L279):

```typescript
    if (request.method === 'GET') {
      let promise = this.memoizedResults.get(cacheKey);
      if (promise) return promise;

      promise = performRequest();
      this.memoizedResults.set(cacheKey, promise);
      return promise;
    } else {
      this.memoizedResults.delete(cacheKey);
      return performRequest();
    }
```

It is cached, but where is the cache? It is here in a member of the class as below or [here](https://github.com/apollographql/apollo-server/blob/main/packages/apollo-datasource-rest/src/RESTDataSource.ts#L50)

```typescript
  memoizedResults = new Map<string, Promise<any>>();
```

As the data source will be initialized `per request`, so we can treat it as a cache per request, meaning any same query in one request, it will be cached and reused.

So far, it is good. But I have a question for myself. `dataloader` also supports cache per request, what else data source can do while `dataloader` cannot?

## Step 3: Use Cache-Control in REST API

Please also read the code [here](https://github.com/ron-liu/demystify-apollo-datasource-cache/tree/3-use-cache-control)

One thing `data source` can do is it respect to the `Cache-Control` in the REST API response header.

`Cache-Control` is usually a header instruct browser how long it can stay in the browser cache.
While `data source` takes advantage about it, means it will read the header in the response, and cache the response for what it is instructed.

This time let's put some `Cache-Control` in the REST API response, and say how it goes.

I only added two lines code against the previous version.

```javascript
const _ = require("koa-route");
const Koa = require("koa");
const app = new Koa();

const db = [
  { id: 1, name: "tobi", species: "ferret" },
  { id: 2, name: "loki", species: "ferret" },
  { id: 3, name: "jane", species: "ferret" },
];

const pets = {
  query: (ctx) => {
    console.log(`Hitting: pets/${ctx.query.query}`);
    ctx.set("Cache-Control", "max-age=60");           // added Cache-Control header in response, tell client it can be cached safely for 60s
    ctx.body = db
      .filter((x) => x.name.includes(ctx.query.query))
      .map((x) => x.id);
  },
  byId: (ctx, id) => {
    console.error(`Hitting: byId/${id}`);
    ctx.set("Cache-Control", "max-age=60");           // added Cache-Control header in response, tell client it can be cached safely for 60s
    const pet = db.find((x) => x.id == id);
    if (!pet) return ctx.throw("cannot find that pet", 404);
    ctx.body = pet;
  },
};
app.use(_.get("/pets", pets.query));
app.use(_.get("/pet/:id", pets.byId));

app.listen(3000);
console.log("listening on port 3000");
```

if we fire the graphql server by the following query many many times:

```graphql
{
  pets(query: "j") { 
    name
    species
  }
}
```

It will hit server 2 times no matter how many times we requested graphql in 60s, after 60s it will hit the server:

```bash
Hitting: pets/j
Hitting: byId/3
Hitting: pets/j     # after 60s
Hitting: byId/3
```

## Sum up

What apollo data source cache?

* cache for duplicated requests per graphql request

* cache for by respecting to the Cache-Control header in response across graphql requests