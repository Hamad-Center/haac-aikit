# audits/marker-engine.md

The BEGIN/END marker engine — the safety contract for every file haac-aikit writes.

## Audit checklist

- [x] Round-trip tested for all 4 dialects (markdown, JSON, YAML, shell) — `test/markers.test.ts`
- [x] Idempotent tested — `test/idempotency.test.ts` (running sync twice produces no diff)
- [x] Named section helpers (`readSection`, `writeSection`, `appendSection`) tested — `test/markers-section.test.ts` (19 cases)
- [x] Path-scoped rule at `.claude/rules/markers.md` loads when editing `src/render/**` or `catalog/**.tmpl`
- [x] `upsertMarkerRegion` throws/skips on missing markers (never silently appends)
- [x] Dialect map in `src/render/markers.ts` covers all current file extensions
- [x] Cursor MDC dialect translator (`src/render/dialects/cursor.ts`) — used in sync
- [ ] Claude/Aider/Copilot/Gemini dialect translators are queued but not implemented — currently we use shim files for those
- [ ] No tests for adversarial marker content (e.g. nested BEGIN/END markers in user content)

## Status

🟢 — production-ready, well-tested. Additional dialect translators are a follow-up for richer per-tool output but aren't blocking.
