---
name: claude-md-improver
description: Use when CLAUDE.md (or AGENTS.md) has grown stale, too long, or needs reorganisation. Audits the file against the ≤200 line budget, removes noise, promotes high-signal rules, and restructures to put critical rules at the front and back (primacy + recency bias).
version: "1.0.0"
source: anthropics/skills
license: Apache-2.0
---

## When to use
- CLAUDE.md is over 150 lines and growing
- Rules are being ignored by the agent despite being written down
- After a significant architectural change makes old rules stale
- When the human says "clean up CLAUDE.md" or "update AGENTS.md"

## Audit checklist

### Size gate (≤200 lines per Anthropic guidance)
- Count lines: `wc -l CLAUDE.md`
- If over 200: identify candidates for removal or migration to skills

### Content that should be removed
- [ ] Rules the agent never violates (no-ops — remove them)
- [ ] Rules duplicating linter/formatter enforcement (let tooling own it)
- [ ] Historical context that belongs in the PR description, not here
- [ ] Vague rules like "write good code" — if it can't be violated, it's not a rule
- [ ] Stack-specific details that belong in a skill, not global context

### Content that should stay
- [ ] Non-negotiable project-specific rules (things the agent gets wrong repeatedly)
- [ ] Security constraints that must fire every session
- [ ] Domain vocabulary the agent needs to understand

### Structure
Reorder rules so:
1. **First 5 lines**: the single most critical constraint
2. **Middle**: supporting rules
3. **Last 5 lines**: the second most critical constraint (recency bias)

## After editing
- Confirm: `wc -l CLAUDE.md` ≤200
- Run a test session to confirm critical rules are still followed
- Commit with `docs(claude): trim CLAUDE.md to [N] lines`
