Execute the current implementation plan using the executing-plans skill.

1. Read the full plan before starting.
2. Execute one step at a time:
   - Make the change
   - Verify (run affected test / check output)
   - Report: `Step N done: [what changed]`
3. Pause on blockers: if a step fails or reveals new information, STOP and report before continuing.
4. After the last step:
   - Run `npm test` (or the project's test command)
   - Run `tsc --noEmit`
   - Report: pass/fail count, any regressions
5. Use the verification-before-completion skill before claiming done.
