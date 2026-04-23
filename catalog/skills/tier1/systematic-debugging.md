---
name: systematic-debugging
description: Use when investigating a bug, unexpected behaviour, test failure, or error message. Prevents shotgun debugging — random code changes hoping something fixes it. Uses hypothesis-driven root cause investigation to find the actual problem before touching code.
version: "1.0.0"
source: obra/superpowers
license: MIT
---

## When to use
- A test is failing and you don't know why
- An error is thrown at runtime
- Behaviour is incorrect but no error is visible
- A previous fix attempt made things worse

## Protocol

### 1. Reproduce first
Before any code change, confirm you can reproduce the problem. If you can't reliably reproduce it, you can't verify a fix.

### 2. Form hypotheses (before reading code)
Write down 2-3 hypotheses:
```
HYPOTHESES:
H1: [cause] → evidence needed to confirm/refute: [specific thing to check]
H2: [cause] → evidence needed to confirm/refute: [specific thing to check]
H3: [cause] → evidence needed to confirm/refute: [specific thing to check]
```

### 3. Test each hypothesis cheaply
Order by ease of testing. For each:
- Add a temporary log / assertion (not a permanent change)
- Run the test / trigger the behaviour
- Record: confirmed / refuted

### 4. Narrow to root cause
A root cause explains all symptoms. Keep eliminating hypotheses until one remains. If no hypothesis explains the full picture, generate new ones.

### 5. Fix only the root cause
Write the minimal change that addresses the root cause. Do not "clean up" adjacent code unless directly related. Do not fix symptoms while the root cause remains.

### 6. Verify the fix
- The original reproduction no longer triggers the problem
- All existing tests pass
- Write a regression test that would have caught this bug originally

## Anti-patterns
- Changing code without a hypothesis
- "Trying things" sequentially until something works
- Fixing the symptom (swallowing an exception) rather than the cause
- Not writing a regression test — the bug will return
