Run an OWASP-aligned security sweep using the `security-review` skill.

## Usage
`/security-review $ARGUMENTS`

`$ARGUMENTS` is the scope (file path / glob) if provided, otherwise the diff vs the merge base.

## Steps
1. Invoke the `security-review` skill — it owns the OWASP A01/A02/A03/A06/A07 checklist, severity mapping, and ✓/⚠/✗ report format.
2. For supply-chain findings (A06), defer to the `dependency-hygiene` skill rather than duplicating the rule here.
3. Report the ✓/⚠/✗ summary. Any ✗ (critical) is a blocker for `/ship` and `/commit-push-pr`.

## Note
This command is the dispatch shim. The full checklist lives in the skill so the two cannot drift.
