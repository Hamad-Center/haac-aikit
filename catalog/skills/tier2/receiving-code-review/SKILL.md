---
name: receiving-code-review
description: Use when the user pastes PR review comments, says "address this feedback", "process the review", or returns from `requesting-code-review`. Triages each finding (Must-fix / Should-fix / Consider), addresses or declines with stated reasoning, and reports back in a structured summary.
version: "1.0.0"
source: obra/superpowers
license: MIT
allowed-tools:
  - Read
  - Edit
  - Bash
---

## When to use
- After receiving review comments on a PR
- After the orchestrator or a review subagent returns findings
- When the human gives feedback on code you wrote (paired with `requesting-code-review`, which produces the findings this skill consumes)

## Processing protocol

### 1. Triage each finding

For each finding, classify:
- **Must fix**: correctness issue, security vulnerability, broken contract
- **Should fix**: code quality, maintainability, convention violation
- **Consider**: style preference, subjective tradeoff, nice-to-have

### 2. For each finding you're addressing

1. Understand *why* the reviewer flagged it (not just what they said)
2. Make the change
3. Verify: run the affected tests, confirm the finding is resolved
4. Note what you changed in a brief summary

### 3. For each finding you're declining

1. State your reasoning clearly (one sentence)
2. If you disagree with a Must fix, defer to the human — do not override
3. If it's a style preference and you have a documented reason, explain once

### 4. Report back

```
Review addressed:
✓ [finding 1]: [what changed]
✓ [finding 2]: [what changed]
→ [finding 3]: declined — [reason]
```

## Anti-patterns to avoid
- "Good catch, fixed!" without showing the fix
- Addressing the symptom the reviewer mentioned without fixing the underlying issue
- Defensive explanations that don't lead to a resolution
- Marking all findings as acknowledged without changing anything
