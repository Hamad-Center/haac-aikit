# Design: API Design Skill

**Date:** 2026-05-06
**Status:** Approved
**Outcome:** Adds a tier1 skill with a two-phase protocol for designing REST, GraphQL, and event/webhook APIs.

---

## Problem Statement

The `architect` agent decides whether to build an API and where it fits in the system. Nobody guides *how* to design it consistently — naming conventions, error shapes, versioning strategy, pagination patterns. Inconsistent API design creates integration friction and breaking changes. A design-first protocol ensures decisions are documented before specs are written.

---

## Pipeline Position

```
[explicit invocation] → api-design skill → [design doc committed → formal spec committed]
```

Independent — can run after `architect` or standalone. No auto-trigger.

---

## Deliverable

| Artifact | Path |
|----------|------|
| Skill | `catalog/skills/tier1/api-design.md` |
| Design doc output | `docs/api/<topic>-design.md` |
| REST spec output | `docs/api/<topic>.openapi.yaml` |
| GraphQL spec output | `docs/api/<topic>.graphql` |
| Events spec output | `docs/api/<topic>.asyncapi.yaml` |

---

## Skill: `api-design`

**Tier:** 1 (always-on)
**Trigger:** Explicit only — "design this API", "API design for X", "define the contract for Y"
**Coverage:** REST + GraphQL + events/webhooks
**Structure:** Two phases — decisions doc first, formal spec second

---

## Phase 1 — Decisions Doc

Surface and document key design decisions per API style before writing any spec.

### REST decisions
- Resource naming — nouns, plural, nested vs. flat hierarchy
- Verb mapping — operations to HTTP methods
- Error shape — consistent envelope (code, message, details)
- Versioning strategy — URL path (/v1/) vs. header vs. none
- Pagination — cursor vs. offset, response envelope shape

### GraphQL decisions
- Schema-first vs. code-first approach
- Query depth limits and complexity rules
- Mutation naming conventions (verbObject vs. objectVerb)
- Error handling — errors array vs. union types
- Subscription scope — what warrants real-time vs. polling

### Events/webhooks decisions
- Event naming — past tense (user.created, order.shipped)
- Envelope shape — id, type, timestamp, data, version
- Delivery guarantees — at-least-once vs. exactly-once
- Retry and idempotency strategy
- Versioning — how breaking changes are signaled

---

## Phase 2 — Formal Spec

Generate the formal spec from the committed decisions doc.

| Style | Output |
|-------|--------|
| REST | `docs/api/<topic>.openapi.yaml` |
| GraphQL | `docs/api/<topic>.graphql` |
| Events | `docs/api/<topic>.asyncapi.yaml` |

---

## Anti-Patterns

- Writing the spec before the decisions doc
- Mixing API styles without documenting why
- No versioning strategy defined
- Inconsistent error shapes across endpoints
- Skipping pagination design for list endpoints

---

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Coverage | REST + GraphQL + events | Full spectrum; all three share the two-phase discipline |
| Trigger | Explicit only | API design is intentional; auto-trigger would be too noisy |
| Relationship to architect | Independent | Can run standalone or after architect; no hard dependency |
| Output | Design doc + formal spec | Doc captures why; spec captures what — both are needed |
| Structure | Two phases | Decisions before spec prevents spec-driven design (working backwards from format) |
