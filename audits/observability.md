# audits/observability.md

The kit's flagship differentiator: rule observability via telemetry hooks → doctor → report.

## Components

- **`log-rule-event.sh`** — emits JSONL events to `.aikit/events.jsonl` on rule load/citation
- **`check-pattern-violations.sh`** — post-write regex-based violation scan
- **`judge-rule-compliance.sh`** — optional LLM judge for soft adherence scoring (off by default)
- **`aikit doctor --rules`** — bucketed report (cited/loaded/violated/dead)
- **`aikit report --format=markdown|json`** — summary for PR comments / CI

## Cross-tool wiring

- **Claude Code** — hooks in `.claude/hooks/hooks.json`. Fires on every tool call.
- **Cursor** — hooks in `.cursor/hooks.json` (10 events wired in 0.12)
- **Other tools** — no native hook surface; observability is Claude/Cursor-only

## Audit checklist

- [x] Hooks always echo `{"decision":"approve"}` and exit 0 — preserved per AGENTS.md gotcha (never block parent tool)
- [x] JSON-output goes through `json.dumps` not `printf` interpolation — preserved per AGENTS.md gotcha
- [x] Rule IDs follow `topic.slug` regex — `rule-ids.test.ts` (10 tests pass)
- [x] `adherence_score` may be `null` with `basis: "no-evidence"` — preserved per AGENTS.md gotcha
- [x] `aikit doctor` checks all expected paths (`.claude/aikit-rules.json`, `.claude/rules/example.md`, telemetry hook presence)
- [x] `aikit report` tests verify markdown + json formats
- [ ] Document Cursor observability loop in `docs/observability.md` — currently Claude-focused

## Status

🟢 — well-tested. Documentation could note Cursor parity.
