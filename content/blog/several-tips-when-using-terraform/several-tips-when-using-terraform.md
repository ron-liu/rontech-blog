---
title: Several tips when using Terraform
date: "2022-02-17"
---

Terraform is a Switzerland knife in the DevOps world, and super friendly for the developers. I am a developer for a long time and recently I challenged myself to adopt "Infrastructure As Code" practice with Terraform, and after this bumpy journey I didn't fear Cloud configuration any more. Terraform enabled me so much power which I couldn't imagine before. The main benefits I get from using Terraform are:

- It can provision resources to anything not just AWS. I tried to provision on else like AliCloud, Github, DNS Server, etc.

- With `Plan` before `Apply`, I know what resources are going to change, so I always felt confident to execute the command

- Easy to integrate with Github Actions, so it is quite easy to build a CI/CD without cost

- There are so many materials in the internet, and usually it is easy to find an answer when I stuck.

In this article, I also want to share with you some experience.

## What is the building blocks of Terraform?

The building blocks for Terraform are:

- Provider
- Resource
- Data

Provider is the plugin to connect with the specific cloud. Some typical providers are `AWS`, `Github`, `Alicloud`, etc. Usually we just need to talk with one instance from each cloud, for example, we just talk to one region from `AWS`, but if you do need to talk to multiple instances, we can use `alias` to separate.
In the following example, we defined two instances of the `aws` providers.

```
provider "aws" {
  region = "us-east-1"
}

provider "aws" {
  alias = east2
  region = "us-east-2"
}
```

Resource is to create resource in cloud. It will have input and output. the output can be used in other resource. Resource is like `mutation` in graphql or `POST` in http.

In the following example, we created a s3 bucket

```
resource "aws_s3_bucket" "www_bucket" {
  force_destroy = true
  bucket        = "www.youdomain.com"
  #...
}
```

Data is to get the information from the resources in cloud. Data is like `query` in graphql or `GET` in http.
In the following example, we query a existing elastic IP by its id. By doing that, we can refer `data.aws_eip.www.public_ip` to get the public IP address.

```
data "aws_eip" "www" {
  id = "eipalloc-08fea14bdd6eef034"
}
```

## Where to save the state?

`Terraform state` stores all the provisioned resources state. It allow us to just give the final state, and terraform will work out how to get there based on the saved state.

More official definition:

> Terraform must store state about your managed infrastructure and configuration. This state is used by Terraform to map real world resources to your configuration, keep track of metadata, and to improve performance for large infrastructures.

`Terraform state` can be stored in the following places:

1. By default, it can be store in a local file called `terraform.tfstate`
2. Or we can use `terraform cloud`, and save state there
3. Or if we can in the cloud storage
   - Like in AWS, we can setup to save in S3 and dynamoDb, check [here](https://www.terraform.io/language/settings/backends/s3)
   - Like in AliCloud, we save in OSS Bucket and OTS Table

We don't want to save the state in our hard disk and lost easily, so the #1 one is not an option. We have to save the state in somewhere in the cloud too. For the #2 way, It is easy to setup if we are using `terraform cloud`, but it was slow because we have to talk to `terraform cloud`, and let them delegate us to the real cloud. While #3 way, it is a bit difficult to setup upfront, but run quite quick. And that way I prefer to save the state in could storage.

**How to organize the Terraform code?**
We use module to organize Terraform code by feature.
Terraform module is a bunch of files with `variables.tf` (defining inputs) and `output.tf` (defining outputs).
e.g., in one project, I need to have a static website, so I will create a module called `static_site` which is basically a folder called `static_site`, and the below is the files structure. You can see the `variables.tf` clearly defines the input of the module, `output.tf` clearly defines the output of this module, and `s3.tf` `dns.tf` `cloudfront.tf` define the resources needed for the static website.

```terraform
main.tf
+ static-site
  |- variables.tf
  |- output.tf
  |- s3.tf
  |- cloudfront.tf
  |- dns.tf
```

In `main.tf`, we use the module like below:

```terraform
module "static_site" {
  source         = "./static_site"
  domain         = mydomain.com
  site_subdomain = www
}
```

By using the `module by features` approach. In `main.tf` it will only have statements calling modules. It is like a index when we write a book. Each module is like chapter contains the details.

## How to pass the parameters to CI/CD

`Terraform` is just provision the resources, and we shall have another CI/CD tool to upload the contents. In the case of static website, we use `Terraform` to provision a s3 bucket, a cloudfront site, and DNS mappings, while we for the web site contents we shall depends on the CI/CD, e.g., Github actions.

However, there is issue, how to pass the necessary parameters (like s3 bucket id, cloudfront id, etc.) to CI/CD, e.g., Github actions? We use terraform github provider to do this job, like below:

```terraform
provider "github" {
  organization = your-organisation
}

resource "github_actions_secret" "bucket_id" {
  repository      = "my-github-repo"
  secret_name     = "BUCKET_ID"
  plaintext_value = aws_s3_bucket.www_bucket.id
}
```

In the above example, we use the `github` provider, and create a github secret entry by referring created s3 bucket id.

Terraform is a great tool to achieve `Infrastructure as Code` practice. With CI/CD tool, we can automate the deployment process entirely.
