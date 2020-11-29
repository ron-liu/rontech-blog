---
tags: ["gatsby"]
---

- [gatsbyjs] How to do tags in gatsby

Check this [gatsby official site](https://www.gatsbyjs.com/docs/adding-tags-and-categories-to-blog-posts/)

- In the `frontmatter`, create a new item called `tags`, then put it as a string array like below:

  ```gatsby
  ---
  tags: ["gatsbyjs", "react"]
  ---
  ```

- Group tags

  ```graphql
  query() {
    allMarkdownRemark {
      group(field: frontmatter___tags) {
        tags: fieldValue
        totalCount
      }
    }
  }
  ```

- Make a tag page

  ```graphql
  query($tags: String) {
    allMarkdownRemark(
      limit: 2000
      sort: { fields: [frontmatter___date], order: DESC }
      filter: { frontmatter: { tags: { in: [$tag] } } }
    ) {
      totalCount
      edges {
        node {
          fields {
            slug
          }
          frontmatter {
            title
          }
        }
      }
    }
  }
  ```
