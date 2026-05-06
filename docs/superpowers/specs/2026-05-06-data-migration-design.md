# Design: Data Migration Agent

**Date:** 2026-05-06
**Status:** Approved
**Outcome:** Adds a tier1 Opus agent that writes safe database migrations with rollback paths and production runbooks.

---

## Problem Statement

Schema migrations are the highest-risk operation in the pipeline — they can cause data loss, table locks, or breaking changes to the running app during deploy. No existing agent specializes in migration safety. `devops` handles CI/CD; `architect` handles system design; nobody enforces rollback paths, zero-downtime compatibility, and production runbooks before a migration ships.

---

## Pipeline Position

```
[explicit invocation] → data-migration agent → [migration file + runbook committed]
```

Explicit-only. Typically invoked after `architect` or `api-design` has defined what schema changes are needed.

---

## Deliverable

| Artifact | Path |
|----------|------|
| Agent | `catalog/agents/tier1/data-migration.md` |
| Migration file | Framework-conventional path (e.g., `migrations/`, `db/migrate/`) |
| Runbook | `docs/migrations/YYYY-MM-DD-<topic>.md` |

---

## Agent: `data-migration`

**Model:** `claude-opus-4-7`
**Rationale:** Wrong migration = data loss or downtime. Hardest judgment call in the pipeline — zero-downtime analysis, lock detection, and rollback safety all require deep reasoning.

**Tools:** `Read, Grep, Glob, Bash, Write`
- `Read/Grep/Glob` — detect DB tech, read existing migrations and schema
- `Bash` — run migration dry-runs, check for locks, verify rollback
- `Write` — produce migration file and runbook

**Trigger:** Explicit only — "write a migration for X", "migrate this schema", "add column Y safely"

---

## Four-Phase Protocol

### Phase 1 — Detect
- Identify DB tech from deps, config files, and existing migration files
- Read 2-3 existing migrations to understand naming, structure, conventions
- Read current schema state — what exists before this migration runs

### Phase 2 — Design
- Write the UP migration (additive changes first: new columns nullable, new tables before constraints)
- Write the DOWN migration (rollback path — must be testable, not just commented out)
- Flag any destructive operations (DROP, column rename, type change) explicitly
- Ensure UP is backwards-compatible with the current app version running during deploy

### Phase 3 — Verify
- **Zero-downtime check:** does this migration acquire a full table lock?
- **Backwards compat check:** will the current app break if migration runs mid-deploy?
- **Rollback check:** does DOWN cleanly reverse UP with no data loss?
- If any check fails — stop and surface the blocker; do not proceed to Phase 4

### Phase 4 — Document
- Write runbook to `docs/migrations/YYYY-MM-DD-<topic>.md`
- Template: Pre-checks | Apply | Verify | Rollback Procedure

---

## Runbook Template

```
# Migration: <topic>

## Pre-checks
[What to verify before running: disk space, replica lag, active connections, backup taken]

## Apply
[Exact command to run the migration]

## Verify
[Queries or checks to confirm migration succeeded]

## Rollback Procedure
[Exact command to run DOWN migration + verification that rollback worked]

## Notes
[Table size, estimated duration, any manual steps required]
```

---

## Hard Constraints

- Never ship a migration without a tested DOWN path
- Never proceed past Phase 3 if any safety check fails
- Flag all destructive operations explicitly — never silently DROP or rename
- Additive changes first — new nullable columns before constraints, new tables before foreign keys

---

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Type | Agent only (no skill) | Safety protocol is tightly coupled to execution; separation adds back-and-forth without benefit |
| Coverage | Auto-detect from repo | Hardcoding DB tech list creates maintenance burden; detection is more robust |
| Model | Opus | Data loss and downtime are unrecoverable; highest judgment call in the pipeline |
| Safety gates | Both rollback + zero-downtime | Either alone is insufficient; both required before runbook is written |
| Output | Migration + runbook | Anyone (or any agent) can execute safely from the runbook without needing context |
| Trigger | Explicit only | Migration is always an intentional act; auto-trigger would be dangerous |
