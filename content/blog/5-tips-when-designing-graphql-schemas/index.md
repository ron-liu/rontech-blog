---
title: 5 Tips when designing Graphql Schemas
date: "2020-05-20"
---
Graphql becomes more and more mainstream, and `Graphql schemas first` is becoming the recommended practice when starting a new project. And it’s critical important to design a solid Graphql Schema which can be stable when facing future changes. 
When I saw there is an egghead course called [Designing Graphql Schemas](https://egghead.io/courses/designing-graphql-schemas-99db?rc=36f039), I joined. After watching all course in an afternoon, I learned a lot how to design robust schema. Thanks Nik Graf. 
In this article I share what I learned, but I still encourage you to watch the whole cause by yourself. 
## Tip #1: Mock resolvers before implementations
Supposing we are using Apollo Server, it has built-in mock feature which is surprising handy to use. 
Let’s have a example of the following hello world schema:
```graphql
const typeDefs = gql`
  type Query {
    hello: String
  }
`;
```
Before any implementations, we can just pass `mocks: true`, and apollo server will mock the resolvers for you like below:
```javascript
const { ApolloServer, gql } = require(“apollo-server”);
const server = new ApolloServer({
  typeDefs,
  mocks: true
});
server.listen(4001).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
```
That is good, but how about if we want to customise the mocks? That’s easy, we just replace the `mocks` with a customised mocks object like below:
```
const mocks = {
  String: () => 'Hello world',
};
```    
But I don’t want mock all the schemas, I just want to mock the new types and I want to keep the existing resolvers working as before, can we do that? Yes, we just need to set `mockEntireSchema: false`, like below:
```
const server = new ApolloServer({
  typeDefs,
  mocks: true,
  mockEntireSchema: false
});
```
## Tip #2: Carefully decide nullable or non-nullable
Firstly, we need to keep in mind, the whole query will be failed if one non-nullable field return null. To avoid this happening try to define it nullable if one of the following is true:
* Assuming there is one field is resolved async from other services, and it might going unwell. If that happens we still want to respond to the consumer;
* If the filed might deprecated
* If the field might hide due to permission required
## Tip #3: Evolve Graphql schemas carefully
Graphql schema is the contract between backend and frontend. When it needs to be changed, please pay extra cautions. For example, when if we want to change the type of the certain field, say:

```graphql
# This is the design at very beginning
type Book {
	coverImage: url
}

# Because we want to give more meta information to the image, we evolved as below
type Book {
	converImage: Image
}
type Image {
	url: String
  Description: String
 	height: Int
  width: Int
}
```

We cannot just directly make the changes, because it will break the contract and break the frontend apps. So How to do that? We shall take the following steps:
1. Add another temporary filed and mark the original one `deprecated`
```graphql
type Book {
	converImage: String @deprecated(reason “use coverImageObject instead”)
  coverImageObject: Image
}
```
2. Change the frontend app to switch to use `coverImageObject`
3. Once all the clients switched to new field, change the original field type and mark the temporary field `deprecated`
```graphql
type Book {
	coverImage: Image 
  coverImageObject: Image @deprecated(reason “use coverImage instead”)
}
```
4. Change the frontend app  to switch to use `coverImage` back
5. Once all the clients switched to `coverImage`, delete the temporary field 
```graphql
type Book {
	coverImage: Image 
  # coverImageObject: Image @deprecated(reason “use coverImage instead”)
}
```
See how much cost we need to pay when change the schema, that’s why we need to pay extra attention when design the schema at very beginning. 
## Tip #4: Embrace Facebook edge connections
When handle pagination, we always using `offset/limit` strategy. Given how many records need to skip and how many records want, then return the records. 
While facebook edge connection is a `cursor based` pagination strategy. All the records need to have a sequential string to be a cursor. When ask for records, it gives a cursor it start with and how many want to retrieve, and it returns. 
Both have pros and cons as below:

* How hard to implement
	* `offset limit`: Very easy, in SQL, just add `limit` and `skip` keywords
	* `cursor based`: Looks easy too, just add a `where` condition, but sometimes it is very difficult to find a way to serialise a cursor string
* Pagination bar
	* `offset limit`: It is very easy to have rich-featured pagination bar like below
[image:1422EC5B-20F1-41D5-BFBF-5A28C8A2656B-24791-0002EC1807D63160/C9EBE559-E1D8-4AEE-A1CD-E54A06335DD8.png]
	* `cursor based`:Normally, it can only have Prev/Next feature
* Server-side dataset changes
	* `offset limit`: If server side dataset changes, the page on next page will be either missing or duplicated. 
	* `cursor based`: works very well on the dynamic dataset
At first sight, the Facebook edge connection looks unnecessary verbose, like below:
```javascript
{
	edges: [
		{
			node: {
				id: ‘123’,
				name: ‘iPhone 7’
			},
			cursor: ‘123’
		}
	],
	pageInfo: {
		after: ’234’,
		hasNextPage: true,
     hasPreviousPage: true
	}
}
```
However, the complexity go with high flexibility. 
## Tip #5: Mutation naming conventions

* The mutation name should be verb, like:  `createQuote`, `placeOrder`
* Always have one input parameter, and named as ${mutationName}Input, like: `CreateQuoteInput`, `PlaceOrderInput` 
* The return type should be a separate object called ${mutationName}Payload, like: `CreateQuotePayload`, `PlaceOrderPayload`

#idea/article_egghead-designing-graphql-schemas