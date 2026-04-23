---
name: test-driven-development
description: Use when implementing new behaviour, fixing a confirmed bug, or when the human asks for TDD. Enforces the red-green-refactor loop to ensure every behaviour is tested before implementation, preventing untested code from entering the codebase.
version: "1.0.0"
source: obra/superpowers
license: MIT
---

## When to use
- Any new function, method, or module
- Bug fixes (write the failing regression test first)
- When "add tests" would be harder after implementation

## The loop

```
RED   → Write a failing test that describes the exact behaviour needed
GREEN → Write the minimal implementation to make the test pass
CHECK → Run the test; confirm it passes and only it (no new breakage)
REFACTOR → Clean up without changing behaviour; re-run tests after each change
```

## RED — writing a good failing test

- Name it: `it('should [verb] [noun] when [condition]', ...)`
- Assert on the observable output, not the internal implementation
- One behaviour per test — if you're using "and" in the name, split it
- Run it: confirm it fails for the right reason (not a compile error or import failure)

## GREEN — minimal implementation

- Write only enough code to pass the test — no extra features
- It's OK if the code is ugly; refactor comes next
- Do not modify the test to make it pass

## REFACTOR

- Remove duplication
- Improve naming
- Extract helpers only when the abstraction is obvious
- Each refactor step: change → run tests → if green, continue; if red, revert

## Definition of done
All tests pass. No test has been modified to accommodate implementation. No production code exists without a covering test.
