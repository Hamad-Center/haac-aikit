---
name: api-design
description: Use when the user says "design this API", "API design for X", "define the contract for Y", or is introducing a new REST / GraphQL / webhook surface. Documents key design decisions in `docs/api/<topic>-design.md` first, then generates the formal OpenAPI/GraphQL/AsyncAPI spec.
version: "1.0.0"
source: haac-aikit
license: MIT
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

## When to use

Explicit invocation only: "design this API", "API design for X", "define the contract for Y"

Works standalone or after the `software-architect` skill has defined the broader system shape.

## Phase 1 — Decisions Doc

Document key design decisions before writing any spec. Save to `docs/api/<topic>-design.md`.

### REST
```
□ Resource naming — nouns, plural, nested vs. flat hierarchy
□ Verb mapping — which operations map to which HTTP methods
□ Error shape — consistent envelope (code, message, details)
□ Versioning strategy — URL path (/v1/) vs. header vs. none
□ Pagination — cursor vs. offset, response envelope shape
```

### GraphQL
```
□ Schema-first vs. code-first
□ Query depth limits and complexity rules
□ Mutation naming — verbObject (createUser) vs. objectVerb (userCreate)
□ Error handling — errors array vs. union types
□ Subscription scope — what warrants real-time vs. polling
```

### Events / Webhooks
```
□ Event naming — past tense (user.created, order.shipped)
□ Envelope shape — id, type, timestamp, data, version
□ Delivery guarantees — at-least-once vs. exactly-once
□ Retry and idempotency strategy
□ Versioning — how breaking changes are signaled to consumers
```

## Phase 2 — Formal Spec

Generate the formal spec from the committed decisions doc.

| Style | Output file |
|-------|------------|
| REST | `docs/api/<topic>.openapi.yaml` |
| GraphQL | `docs/api/<topic>.graphql` |
| Events | `docs/api/<topic>.asyncapi.yaml` |

Commit the spec file after the decisions doc is committed.

## Anti-patterns to avoid

- Writing the spec before the decisions doc — spec-driven design works backwards from format, not intent
- Mixing API styles in one surface without documenting why
- No versioning strategy — every API will need one eventually; decide now
- Inconsistent error shapes across endpoints — consumers have to handle every variation
- Skipping pagination design for list endpoints — retrofitting pagination is always a breaking change
