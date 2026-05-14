# audits/tests.md

Test coverage + quality.

## Current status

- **18 test files**, **149 tests passing**
- Test files mirror src layout under `test/`
- Vitest one-shot run via `npm test`

## Audit checklist

### Coverage by area
- [x] Marker engine — `markers.test.ts`, `markers-section.test.ts`, `idempotency.test.ts` (round-trip + idempotency)
- [x] Cursor MDC dialect — `dialects.test.ts`
- [x] Cross-tool translators — `translators.test.ts` (28 tests covering all 7 tools)
- [x] Add command — `add.test.ts` (10 tests including --html bundle + path-traversal guard)
- [x] Sync — `sync-claude.test.ts`, `sync-agents.test.ts`, `sync-conflict-*.test.ts`
- [x] Config — `readConfig.test.ts`
- [x] Doctor — `doctor-rules.test.ts`
- [x] Report — `report.test.ts`
- [x] Rule IDs — `rule-ids.test.ts`
- [x] Safe-write atomic semantics — `safeWrite.test.ts`
- [x] Copy-action conflicts — `copy-action-conflict.test.ts`
- [x] Diff format — `diff-format.test.ts`
- [x] Resolve-conflict — `resolve-conflict.test.ts`

### Missing tests
- [ ] End-to-end smoke test for `--tools=cursor,codex,gemini` install → verify expected file set produced
- [ ] Migration test — write a 0.11-shape config, run sync, verify warning emitted + sync succeeds
- [ ] Aider skills index append — verify the index appears in the marker region
- [ ] Codex post-sync trust warning — verify `p.log.info` is called when codex selected

### Test quality
- [x] Tests use temp dirs + chdir for isolation
- [x] No test pollution between cases (beforeEach/afterEach proper)
- [x] Spies are restored after tests
- [x] No flaky-test patterns (sleeps, random ordering dependencies)

## Status

🟢 — solid coverage on critical paths. Missing end-to-end multi-tool test is a follow-up.
