// Gatsby supports TypeScript natively!
import React from "react"
import { PageProps, Link, graphql } from "gatsby"

import Bio from "../components/bio"
import Layout from "../components/layout"
import SEO from "../components/seo"
import { rhythm } from "../utils/typography"
import { LearnedTodayPageQueryQuery } from "../../graphql-types"
import {parse, format} from 'date-fns'

const BlogIndex = ({
  data,
  location,
}: PageProps<LearnedTodayPageQueryQuery>) => {
  const siteTitle = data.site.siteMetadata.title
  const posts = data.allMarkdownRemark.edges

  return (
    <Layout location={location} title={siteTitle}>
      <SEO title="All posts" />
      <Bio />
      <Link to="/">Blog</Link>
      {posts.map(({ node }) => {
        const title = node.frontmatter.title || node.frontmatter.date
        const group = node.fileAbsolutePath.match(/\d{4}-\d{2}-\d{2}/)
        const today = group ? format(parse(group[0], 'yyyy-MM-dd', new Date()), 'd MMM, yyyy') : 'today'
        return (
          <article key={node.fields.slug}>
            <header>
              <h3
                style={{
                  marginBottom: rhythm(1 / 4),
                }}
              >
                <Link style={{ boxShadow: `none` }} to={node.fields.slug}>
                  {today}
                </Link>
              </h3>
              <small>{node.frontmatter.date}</small>
            </header>
            <section>
              <p
                dangerouslySetInnerHTML={{
                  __html: node.frontmatter.description || node.excerpt,
                }}
              />
            </section>
          </article>
        )
      })}
    </Layout>
  )
}

export default BlogIndex

export const pageQuery = graphql`
  query LearnedTodayPageQuery {
    site {
      siteMetadata {
        title
      }
    }
    allMarkdownRemark(
        sort: { fields: [fileAbsolutePath], order: DESC }
        filter: {fileAbsolutePath: {regex: "/content\/learned-today/.*\\.md$/"}}
       ) {
      edges {
        node {
          fileAbsolutePath
          excerpt
          fields {
            slug
          }
          frontmatter {
            date(formatString: "MMMM DD, YYYY")
            title
            description
          }
        }
      }
    }
  }
`
