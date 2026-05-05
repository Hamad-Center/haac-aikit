---
name: incident-response
description: Use when production is broken and service needs to be restored urgently. Three-phase checklist protocol — stabilize first, investigate second, post-mortem third. Explicit-only; do not use for non-production debugging.
version: "1.0.0"
source: haac-aikit
license: MIT
---

## When to use

Explicit invocation only: "run incident response", "production is down", "start incident protocol"

Do not use for non-urgent debugging — use `systematic-debugging` instead.

## Phase 1 — Stabilize

Restore service before anything else. Do not investigate until service is confirmed restored.

```
□ Identify blast radius — what is broken, how many users are affected
□ Check recent deploys, config changes, or infra events in the last 2 hours
□ Attempt fastest known mitigation: rollback, feature flag off, process restart
□ Confirm service is restored before moving to Phase 2
□ Note what action restored service — this becomes the root cause lead
```

## Phase 2 — Investigate

Root cause only — not symptoms.

```
□ Read the code path that failed — trace from entry point to failure
□ Identify the specific line or condition that caused the failure
□ Reproduce the failure locally or in staging if possible
□ Confirm the fix addresses root cause, not just the symptom
□ Write and run tests that would have caught this before production
```

## Phase 3 — Post-mortem

Document before closing. No incident is closed without a committed post-mortem.

```
□ Write post-mortem to docs/incidents/YYYY-MM-DD-<topic>.md
□ Use the template below
□ Commit the post-mortem and the fix together in the same commit
```

### Post-mortem template

```markdown
# Incident: <topic>

## Timeline
[Chronological: when detected, when mitigated, when resolved]

## Root Cause
[The specific code/config/infra condition that caused the failure]

## Impact
[What broke, for how long, estimated users affected]

## Fix Applied
[What was changed and why it resolves the root cause]

## Tests Added
[Test names and what regression they prevent]

## Prevention
[What would have caught this before production: monitoring, test, review]
```

## Anti-patterns to avoid

- Jumping to Phase 2 before service is restored
- Writing a post-mortem that attributes cause to "human error" without a systemic fix
- Closing the incident without a committed test covering the regression
- Using `systematic-debugging` protocol during an active incident — that protocol is too slow
