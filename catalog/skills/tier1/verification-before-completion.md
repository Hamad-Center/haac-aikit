---
name: verification-before-completion
description: Use before reporting any task as complete. Ensures claims of success are backed by evidence, not assumption. Prevents marking work done when it compiles but doesn't actually do what was asked.
version: "1.0.0"
source: obra/superpowers
license: MIT
---

## When to use
- Before saying "done", "complete", "implemented", "fixed"
- After any code change that was meant to achieve a specific outcome
- Before handing off to the human for review

## Verification checklist

Before claiming completion, provide evidence for each applicable item:

**1. The change does what was requested**
- Run the affected test(s) — paste the output
- Or run the specific command / endpoint that demonstrates the behaviour
- Do not assert "this should work" — show that it does

**2. Nothing else broke**
- Run the full test suite (or the relevant subset) — paste the pass/fail count
- If tests are slow, run at minimum: the directly affected tests + integration tests

**3. Type safety is maintained**
- `tsc --noEmit` passes without error
- No `@ts-ignore` was added without a documented justification

**4. The code is in the right shape**
- Dead code removed from the path you modified
- No debug logging (`console.log`) left in
- No TODO comments introduced without a corresponding issue

## Reporting completion

Structure:
```
Done. Evidence:
- [test name]: PASS (output: ...)
- Full suite: X passed, 0 failed
- TypeScript: clean
```

Do not say "this should work" or "I believe this is correct." Show the output.
