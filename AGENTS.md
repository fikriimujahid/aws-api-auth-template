# AGENTS.md

This document provides instructions for AI coding assistants (such as OpenCode, Claude Code, Codex, Cursor, GitHub Copilot, Gemini CLI, and similar tools) working on this AWS API Authentication Template.

---

# Repository Purpose

This repository is a reusable template for implementing API authentication using:

- Amazon API Gateway
- AWS Lambda
- Amazon Cognito
- AWS SDK for JavaScript v3
- Node.js
- TypeScript
- Terraform

The purpose of this repository is to provide a production-ready authentication foundation that can be copied or cloned into other projects and integrated into an existing monorepo.

The template should remain:

- reusable
- framework-independent
- simple
- maintainable
- production-oriented
- easy to integrate into existing projects

---

# Repository Structure

The repository contains two primary areas:

```text
apps/
└── auth/
    └── Lambda authentication application

terraform/
└── modules/
    └── auth/
        └── Reusable authentication infrastructure
```

Application code and infrastructure code are intentionally kept in the same repository because they represent one reusable capability.

However, they must remain logically separated.

Application code is responsible for authentication behavior.

Terraform is responsible for provisioning and configuring the required AWS infrastructure.

---

# Architecture

The expected architecture is:

```text
Client
  |
  v
API Gateway
  |
  v
AWS Lambda
  |
  v
Amazon Cognito
```

The Lambda function communicates with Amazon Cognito using the AWS SDK.

Typical authentication operations include:

- sign up
- confirm sign up
- login
- logout
- refresh token
- forgot password
- confirm forgot password
- change password
- get authenticated user
- MFA operations where required

The exact supported operations should follow the requirements of the project.

---

# Technology Guidelines

Use:

- Node.js
- TypeScript
- AWS SDK v3
- AWS Lambda
- API Gateway
- Amazon Cognito
- Terraform
- Zod or the existing project validation solution
- esbuild or the existing project build solution
- Vitest or the existing project testing framework

Do **not** introduce a backend framework such as NestJS unless explicitly requested.

This template is intentionally framework-independent.

Avoid unnecessary framework abstractions for Lambda handlers.

---

# Application Responsibilities

The application layer is responsible for:

- Lambda handlers
- request parsing
- input validation
- authentication workflows
- Cognito SDK integration
- error handling
- response formatting
- authentication-related business logic
- unit tests

The application layer must not provision AWS infrastructure.

Do not put Terraform configuration inside application modules.

---

# Infrastructure Responsibilities

The Terraform layer is responsible for:

- API Gateway
- Lambda
- Cognito User Pool
- Cognito User Pool Client
- IAM roles and policies
- CloudWatch resources
- Lambda permissions
- API Gateway integrations
- API Gateway routes
- environment configuration
- other resources required by the authentication system

Infrastructure should be implemented as reusable Terraform modules wherever practical.

The Terraform module should not assume that it owns the entire project's infrastructure.

It must be possible to integrate the authentication module into an existing Terraform project containing other resources such as:

- VPC
- RDS
- ECS
- S3
- CloudFront
- Route53
- SQS
- other application infrastructure

---

# Lambda Guidelines

Use TypeScript for Lambda functions.

Keep Lambda handlers thin.

Handlers should primarily:

1. receive the API Gateway event
2. validate and parse the request
3. call the appropriate service
4. return a consistent API response

Business logic and AWS SDK operations should not be unnecessarily implemented directly inside handlers.

Prefer a structure similar to:

```text
apps/auth/
├── src/
│   ├── handlers/
│   ├── services/
│   ├── utils/
│   ├── types/
│   └── ...
├── package.json
└── tsconfig.json
```

The exact structure may evolve when there is a clear architectural reason.

---

# Cognito Integration

Amazon Cognito must be accessed from the backend Lambda.

Use the AWS SDK for JavaScript v3.

Do not implement direct Cognito SDK calls in the frontend.

Authentication requests should follow the architecture:

```text
Frontend / Client
       |
       v
API Gateway
       |
       v
Lambda
       |
       v
AWS SDK
       |
       v
Cognito
```

Keep Cognito-specific implementation isolated behind a service layer where practical.

For example, authentication handlers should not need to know the details of individual Cognito SDK commands.

Avoid spreading Cognito SDK calls throughout unrelated modules.

---

# Authentication Security

Security is a primary requirement of this template.

Always:

- validate all external input
- avoid logging passwords
- avoid logging access tokens
- avoid logging refresh tokens
- avoid logging sensitive Cognito responses
- use least-privilege IAM policies
- avoid hardcoding secrets
- use environment variables or AWS-managed configuration where appropriate
- use AWS Secrets Manager when a secret must be stored
- avoid exposing internal AWS errors directly to clients
- return safe and consistent error responses

Never commit:

- AWS credentials
- Cognito client secrets
- API keys
- passwords
- tokens
- private keys
- other sensitive credentials

---

# API Response Guidelines

API responses should use a consistent structure across authentication endpoints.

Successful responses should clearly communicate the result.

Errors should:

- use appropriate HTTP status codes
- provide a useful client-facing error message
- avoid exposing internal implementation details
- avoid exposing sensitive AWS or Cognito information

Do not expose raw AWS SDK exceptions directly to API consumers unless explicitly required.

---

# Validation

Validate all external input at the API boundary.

Examples include:

- email
- password
- confirmation codes
- refresh tokens
- access tokens
- user attributes
- MFA codes

Validation should happen before calling Cognito.

Prefer a single consistent validation approach throughout the application.

Do not duplicate validation logic unnecessarily.

---

# Terraform Guidelines

Terraform must be:

- declarative
- reproducible
- modular
- environment-aware
- maintainable
- safe to integrate into existing infrastructure

Prefer reusable modules over large monolithic Terraform files.

Do not assume this repository owns the complete AWS account or environment.

Avoid:

- hardcoded AWS account IDs
- hardcoded regions
- hardcoded environment-specific values
- hardcoded secrets
- unnecessary global resources
- overly broad IAM permissions

Use:

- variables
- locals
- outputs
- data sources
- reusable modules

where appropriate.

---

# Terraform Module Design

The authentication infrastructure should be consumable as a Terraform module.

The module should encapsulate resources required by the authentication capability, such as:

```text
API Gateway
Cognito
Lambda
IAM
CloudWatch
```

The module should expose useful outputs such as:

- API Gateway endpoint
- Cognito User Pool ID
- Cognito User Pool Client ID
- Lambda function ARN
- other values required by the consuming application

Do not force consuming projects to restructure their entire Terraform configuration to use this module.

The module should integrate cleanly into an existing Terraform root module.

---

# Terraform Validation

Whenever Terraform is modified:

1. Run `terraform fmt -recursive`.
2. Run `terraform init`.
3. Run `terraform validate`.
4. Run `terraform plan`.

Fix all formatting, validation, and plan errors before considering the infrastructure change complete.

If multiple environments exist, validate every affected environment.

Do not apply Terraform infrastructure unless explicitly requested.

Never run:

```text
terraform apply
terraform destroy
```

without explicit approval.

---

# Reuse Before Creation

Before creating a new:

- handler
- service
- utility
- helper
- validator
- type
- middleware
- Terraform module
- Terraform resource abstraction

search the existing project first.

Reuse existing implementations whenever appropriate.

Avoid duplicate functionality.

Do not create abstractions merely for the sake of abstraction.

---

# Architecture Principles

Follow these principles:

- keep modules cohesive
- keep responsibilities clear
- minimise coupling
- prefer composition over inheritance
- keep business logic separate from infrastructure concerns
- keep AWS-specific code isolated where practical
- avoid circular dependencies
- avoid premature abstraction
- avoid premature optimisation

Do not introduce a new architectural pattern unless there is a clear reason.

---

# Dependencies

Prefer existing dependencies.

Do not introduce a new library unless it provides significant value.

Before adding a dependency:

- check whether existing dependencies already provide the required functionality
- ensure the library is actively maintained
- avoid overlapping libraries
- consider bundle size
- consider Lambda cold-start impact
- consider security implications

Keep the dependency footprint small.

---

# Code Quality

Produce production-quality code.

Always:

- use strict TypeScript
- use meaningful names
- keep functions focused
- keep files organised
- handle expected edge cases
- remove unused imports
- remove dead code
- avoid unnecessary nesting
- avoid duplicated logic
- document non-obvious decisions

Do not leave TODO implementations, placeholder logic, or unfinished functionality unless explicitly requested.

---

# Testing

Use the project's existing testing framework.

Authentication logic should have appropriate automated tests.

Where applicable, test:

- successful signup
- successful login
- invalid credentials
- confirmation flows
- token refresh
- logout
- password reset
- invalid input
- Cognito errors
- unexpected errors
- response formatting

Mock AWS SDK calls in unit tests where appropriate.

Do not require access to a real AWS account for ordinary unit tests.

Integration tests may use AWS resources when explicitly configured and requested.

---

# Build and Validation

Before considering a task complete, run the relevant checks.

Application changes should generally include:

- formatting
- linting
- type checking
- build
- unit tests

Infrastructure changes should generally include:

- Terraform formatting
- Terraform validation
- Terraform plan

Fix all errors before considering the task complete.

---

# Planning

Before implementation:

- understand the objective
- identify affected components
- inspect the existing architecture
- identify reusable code
- identify affected Terraform modules
- identify dependencies
- identify security implications
- clarify ambiguous requirements before making assumptions

Do not assume business requirements that have not been specified.

**During plan mode, do NOT generate or include any code in the response.**

Responses during plan mode must contain only:

- the plan
- strategy
- affected files/modules
- reasoning
- risks
- validation approach

Do not include:

- code blocks
- implementation snippets
- file contents
- code edits

Code generation is only permitted after plan mode has ended and explicit approval to proceed has been given.

---

# Git Safety

Never perform Git write operations unless explicitly instructed.

Do not:

- commit
- push
- merge
- rebase
- squash
- cherry-pick
- tag
- create branches
- delete branches
- force push

Read-only Git commands are acceptable, including:

- `git status`
- `git diff`
- `git log`
- `git branch`

Leave all changes uncommitted unless explicitly instructed otherwise.

---

# Do Not

Unless explicitly requested:

- change the overall architecture
- introduce NestJS or another backend framework
- replace major libraries
- introduce unnecessary dependencies
- introduce breaking API changes
- change Cognito authentication strategy
- move large parts of the project
- rename public API endpoints
- restructure Terraform unnecessarily
- create infrastructure outside the authentication module's responsibility
- hardcode secrets
- broaden IAM permissions unnecessarily
- perform large-scale refactoring

Always prefer incremental, maintainable improvements over large disruptive changes.

---

# Template Reusability

This repository is intended to be reused across multiple projects.

When making changes, consider whether the implementation will work when:

- copied into another monorepo
- used with a different frontend
- used with a different backend
- deployed to another AWS account
- deployed to another AWS region
- deployed to multiple environments
- integrated with an existing Terraform root module

Avoid assumptions that only apply to one specific consuming project.

The template should provide a strong foundation without forcing consuming projects to adopt unnecessary architectural conventions.