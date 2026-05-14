# audits/aider.md

What we install when `aider` is selected, per <https://aider.chat/docs/config/aider_conf.html>, <https://aider.chat/docs/usage/conventions.html>.

## What we ship to an Aider-only install

- `CONVENTIONS.md` — base conventions + appended skills index (one bullet per shipped skill)
- `.aider.conf.yml` — Aider config

## Audit checklist

### Format correctness
- [ ] CONVENTIONS.md is markdown — no frontmatter constraint, but verify our appended `## Available skills` section parses OK alongside existing convention prose
- [ ] `.aider.conf.yml` is valid YAML — check current shipped content

### Coverage gaps
- [ ] Aider has no rule loader, no agents, no hooks — only conventions. The skills index is the best we can do.
- [ ] `lint-cmd` and `test-cmd` config keys — we could pre-populate these in `.aider.conf.yml` so safety hooks (e.g. gitleaks) have an Aider entry point. **Worth doing**.
- [ ] `read:` list — Aider auto-reads files in this list. We could add the HTML skill templates as `read:` entries so they're available context for prompts.

### Edge cases
- [ ] BEGIN/END markers — `CONVENTIONS.md` uses haac-aikit markers, but our skills index gets appended INSIDE the END marker block. Verify the append logic in `sync.ts` doesn't break re-sync idempotency.

### Tests
- [ ] Test that the skills index is included in the marker region (not after it)
- [ ] Test idempotent re-sync doesn't duplicate the index

## Status

🟡 — Aider is the most limited target. Our skills index works but we could add `lint-cmd`/`test-cmd` defaults and `read:` template paths.

## Decision: what to fix before publish

Low priority. Document Aider's limitations honestly in the landing page (already in parity table).
