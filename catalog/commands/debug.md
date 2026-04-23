Investigate and fix a bug using the systematic-debugging skill.

1. Reproduce: confirm you can trigger the problem reliably.
2. Form hypotheses before touching code:
```
HYPOTHESES:
H1: [cause] → evidence needed: [what to check]
H2: [cause] → evidence needed: [what to check]
```
3. Test each hypothesis cheaply (add a temporary log/assertion, run the test).
4. Narrow to root cause — the one thing that explains all symptoms.
5. Fix only the root cause (minimal change).
6. Verify:
   - Original reproduction no longer triggers the problem
   - All existing tests pass
7. Write a regression test that would have caught this bug.
8. Remove any temporary debug output before committing.
