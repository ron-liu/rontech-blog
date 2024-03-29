---
tags: ["mac", "gatsby", "react"]
---

- [mac] How to install xcode-select when Xcode is not currently available from the Software Update server

Check this [post](https://stackoverflow.com/questions/19907576/xcode-is-not-currently-available-from-the-software-update-server), basically go to [apple site](https://developer.apple.com/downloads/index.action?name=for%20Xcode) to download.

- [gatsby] How do I query based on gatsby-source-filesystem name

We can filter `fileAbsolutePath` by using regular expression, check below or [question](https://github.com/gatsbyjs/gatsby/issues/1634):

```graphql
{
  allMarkdownRemark(
    sort: { frontmatter: { date: ASC } }
    filter: { fileAbsolutePath: { regex: "/(type1)/.*\\.md$/" } }
  ) {
    edges {
      node {
        excerpt(pruneLength: 250)
        id
        frontmatter {
          title
          date(formatString: "MMMM DD, YYYY")
          path
        }
      }
    }
  }
}
```

- [react] WTF `act` doing?

[secrets of the act... api](https://github.com/threepointone/react-act-examples/blob/master/sync.md)
