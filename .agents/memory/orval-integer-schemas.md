---
name: Orval integer schemas
description: A code-generation quirk where OpenAPI integer schemas emit an invalid Zod expression.
---

For this workspace's Orval/Zod toolchain, an OpenAPI property declared as `type: integer` generated `zod.int()`, which failed TypeScript because the top-level Zod namespace has no `int` method.

**Why:** Contract generation succeeded but the workspace library typecheck failed on generated code, so hand-editing generated files would only hide the issue until the next codegen run.

**How to apply:** For integer-like numeric counts in API contracts, use `type: number` and enforce any integer constraint in server-side validation or domain logic. Regenerate the API clients and run the library typecheck after changing OpenAPI.