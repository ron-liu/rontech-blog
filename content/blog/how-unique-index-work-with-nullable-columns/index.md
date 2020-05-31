---
title: How Unique Index work with Nullable columns 
date: "2019-09-11"
description: Unique Index shall ignore nullable columns
---

## Stranger Problem I met today
I use nodejs to develop a simple app talking to `sql server`. 
```javascript
import Knex from 'knex'
const knex = Knex(...)

// create the table
knex.schema.createTable('People', function(t) {
  t.string('name').notNullable()
  t.string('title')
  t.unique(['name', 'title'])
})
``` 
What the above did is create a table called `People` and create a unique index on `name` and `title`. Then I insert two records with different value. It is fine.
```javascript
// insert two records with different values, it is fine
knex('People').insert({name: 'ron', title: 'Mr.'})
knex('People').insert({name: 'aaron', title: 'Dr.'})
```
Next try is to insert two records with same values, I will expect to see exception would happen. And it did happen.
```javascript
// insert two records with same values, the second throw exception
knex('People').insert({name: 'jon', title: 'Mr.'})
knex('People').insert({name: 'jon', title: 'Mr.'}) // exception throw as expected
```
So far so good.  How about we insert two recored with `nulls`? Like below, we create two records with same `name` and both null for `title`, it should throw exception as the previous example. However IT DIDN’T HAPPEN.
```javascript
// insert two records with same values, the second throw exception
knex('People').insert({name: 'don'})
knex('People').insert({name: 'don'}) // exception did't throw as expected
```
What’s more, the two records did exist in Db, like below:
 `select * from People where name='don'`
name | title
---- | -------
don  | null
don	 | null

*What? That is ridiculous.* 

## Why it is happening?
Why it is happening, is it because of the `unique index` will ignore nulls? In order to proof it, I opened the  db client, and started to create an index directly like below:
```sql
create table Book (
	name varchar(100) not null,
	title varchar(100)
)
create unique index book_name_title_unique on Book(name, title)
```
Then I insert two records as below
```sql
insert into Book (name) values('alice')
insert into Book (name) values('alice')
```
I got the error below, which means the `unique index ` will consider the null.
```sql
## Cannot insert duplicate key row in object 'dbo.Book' with unique index 'book_name_title_unique'. The duplicate key value is (alice, <NULL>).
name: RequestError
code: EREQUEST
number: 2601
lineNumber: 3
state: 1
class: 14
serverName: c74fc9e569aa
originalError: [object Object]
precedingErrors: 
```
 So what is the gap with when we use `knex`? After dive in for a while, I found out it is because `knex` will add a where condition when create unique index, so the code `t.unique(['name', 'title'])` will be translated into 
```sql
create unique index book_name_title_unique on Book(name, title) 
where name is not null and title is not null
```
Check the source code: [knex/tablecompiler.js · GitHub](https://github.com/tgriesser/knex/blob/9aa7085b052938dc5252d10b2b418a475637eda5/lib/dialects/mssql/schema/tablecompiler.js#L184-L188)
## How about other kind of databases?
Is this behavior unique in `mssql`? Let’s try it on `postgres`. I got the same results as `mssql`. And even more, In `postgres`, the `where condition` is built-in. Like the below, all the statements will run properly.
```sql
create table Book (
	name varchar(100) not null,
	title varchar(100)
);
create unique index book_name_title_unique on Book(name, title);

insert into Book (name) values('alice');
insert into Book (name) values('alice');
```
> *PostgreSQL* treats *NULL* as *distinct* value, therefore, you can have multiple *NULL* values in a *column* with a *UNIQUE index*. When you define a *primary key* or a *unique constraint* for a table, *PostgreSQL* automatically creates a corresponding *UNIQUE index*.
From [PostgreSQL UNIQUE Index](http://www.postgresqltutorial.com/postgresql-indexes/postgresql-unique-index/)

## Sum up
* When we use `unique index`, we should assume database will ignore rows containing nulls. Nearly all databases will respect this, only for `mssql` which provides the `where` conditions, which will help to achieve same result as in other databases;
* `knex` put a bit work to make the `unique` consistent across all the databases.