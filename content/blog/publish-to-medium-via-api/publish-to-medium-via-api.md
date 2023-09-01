---
title: Publish to medium via API 
date: "2021-03-08"
description: Publish to medium via API with markdown 
---

I usually wrote blog using markdown in my own gatsby site, it is a very smooth process.
However, when I want to my blog sync to medium, it becomes a pain point.
Medium is a html based content format. And I have to manually copy my markdown format to there, and manually modify all the format.
For every 5-minute article, it will take me around 10-minute to finish.
But after that the two articles become detached, which means if one of the side changed, the other side will not be changed. I have to manually sync them, it is a totally pain.

I am trying to fix the issue, but so far it is only half done, I can sync when creation but I cannot sync when updating.
the approach I am using is through the [official API](https://github.com/Medium/medium-api-docs/blob/master/README.md).

In this article, I am going to walk through the API, and hopefully sync this article to medium to be the first one I sync automatically.

## 1st step: Get the token

To do the job, we have to get a security token, which can be achieved by two ways as below:

1. From Medium settings web page, and get the integration token

2. OAuth2 workflow but only for existing medium app

Obviously, I will choose the 1st way. it is very easy to do that just copy the integration token.

## 2nd step: Get My own information

The main purpose of this task is to get the user id, which will be used later.

```bash
curl --oauth2-bearer {token} https://api.medium.com/v1/me 
```

and it will return the following stuff:

```json
{
   "data":{
      "id":"12xxx222222", // <-- this is the userId will be used later
      "username":"ron-liu",
      "name":"Ron Liu",
      "url":"https://medium.com/@ron-liu",
      "imageUrl":"https://cdn-images-1.medium.com/fit/c/400/400/1*p7d2zeD6NBSADK36SmLkyw@2x.jpeg"
   }
}
```

## Step 3: Create a Post

```bash
curl --oauth2-bearer {token}  --data '{ 
 "title": "Test post via api", \
 "contentFormat": "markdown", \
 "content": "## Hello World \r I am posting 1st blog using api" \
}' \
-X POST https://api.medium.com/v1/users/{userId}/posts
```

So far so good, but the official blog didn't provide a update endpoint. So currently I don't know hwo to update a post programmability.
