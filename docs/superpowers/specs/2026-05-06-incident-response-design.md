# Design: Incident Response Skill

**Date:** 2026-05-06
**Status:** Approved
**Outcome:** Adds a tier1 skill with a three-phase checklist protocol for production incidents.

---

## Problem Statement

`systematic-debugging` is a careful, methodical protocol — designed for non-urgent bug investigation. Production incidents require a different protocol: restore service first, understand why second, document third. No existing skill covers this urgency-driven, phase-gated approach.

---

## Pipeline Position

```
[explicit invocation] → incident-response skill → [fix committed + post-mortem doc]
```

Explicit-only. No agent pair needed — the AI follows the protocol directly using its existing tools.

---

## Deliverable

| Artifact | Path |
|----------|------|
| Skill | `catalog/skills/tier1/incident-response.md` |
| Post-mortem output | `docs/incidents/YYYY-MM-DD-<topic>.md` |

---

## Skill: `incident-response`

**Tier:** 1 (always-on)
**Trigger:** Explicit only — "run incident response", "production is down", "start incident protocol"
**Structure:** Three phases, each with an explicit checklist

---

## Three-Phase Protocol

### Phase 1 — Stabilize
- Identify blast radius (what's broken, how many users affected)
- Check recent deploys, config changes, infra events in the last 2 hours
- Attempt fastest known mitigation: rollback, feature flag off, restart
- Confirm service is restored before moving to Phase 2
- Note what action restored service (becomes root cause lead)

### Phase 2 — Investigate
- Read the code path that failed — trace from entry point to failure
- Identify the specific line/condition that caused the failure
- Reproduce the failure locally or in staging if possible
- Confirm fix addresses root cause, not just symptom
- Write and run tests that would have caught this

### Phase 3 — Post-mortem
- Write post-mortem to `docs/incidents/YYYY-MM-DD-<topic>.md`
- Template: Timeline | Root Cause | Impact | Fix Applied | Tests Added | Prevention
- Commit the post-mortem and the fix together

---

## Post-Mortem Template

```
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

---

## Hard Constraints

- Never skip Phase 1 to investigate — service first, understanding second
- Never close without a committed post-mortem
- Never mark Phase 2 done without a test covering the regression
- Never write a post-mortem that says "human error" without a systemic fix

---

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Type | Skill only (no agent) | Protocol the AI follows directly; no specialist dispatch needed |
| Trigger | Explicit only | Incidents need deliberate invocation; false auto-triggers during debugging would be disruptive |
| Communication | Excluded | Purely technical scope; communication is handled outside the AI workflow |
| Structure | Checklist per phase | Under pressure, explicit checklists prevent step-skipping — exactly when mistakes happen |
| Post-mortem | Always required | Incidents without post-mortems repeat; the committed doc is the quality gate |
