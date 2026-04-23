Review recent changes using the requesting-code-review skill.

1. Gather context:
```bash
git diff main...HEAD --stat
git log main...HEAD --oneline
```
2. Dispatch the reviewer agent with:
   - Files changed (list)
   - What the change does (1-2 sentences)
   - Intentional tradeoffs (things the reviewer might question)
   - Focus areas or "general review"
3. For each finding:
   - CRITICAL / MAJOR: fix before proceeding
   - MINOR: note and consider
4. Implement all agreed-upon changes. Verify fixes with tests.
5. Report: "Review addressed — N changes made, M findings declined (reason)."
