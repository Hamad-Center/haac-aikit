---
name: verification-before-completion
description: Use before saying "done", "complete", "finished", "implemented", "fixed", or "ready" — and before handing back to the user for review. Forces evidence (test output, command output, typecheck pass/fail count) instead of "I believe this works", so compiled-but-broken code can't slip through.
version: "1.0.0"
source: obra/superpowers
license: MIT
allowed-tools:
  - Read
  - Bash
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
- Project typechecker passes (e.g. `tsc --noEmit`, `mypy`, `cargo check`) — adapt to the project's language
- No `@ts-ignore` / `# type: ignore` / equivalent was added without a documented justification

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
- Typechecker (tsc / mypy / cargo check / ...): clean
```

Do not say "this should work" or "I believe this is correct." Show the output.

## Anti-patterns
- **"This should work" / "I believe this is correct" / "looks good to me".** All three are evidence-substitutes; replace with actual command output.
- **Reporting "tests pass" without naming which tests or showing the pass count.** Vague claims are unverifiable claims.
- **Skipping verification because "the change is small".** Small changes break full suites more often than large ones precisely because they bypass scrutiny.
- **Marking done while a test is still red and "unrelated".** Unrelated failures often aren't — confirm before dismissing.

After verification passes, use `writing-commits` then `requesting-code-review` (or open the PR).
