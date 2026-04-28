# Rule observability

The "fitness tracker for your CLAUDE.md" — telemetry hooks that log which rules fire, which get followed, and which are dead weight, plus the commands that surface that data.

This is the flagship feature of haac-aikit and the thing no other AI-coding kit ships.

## The loop in one diagram

```
                     .aikit/events.jsonl
                    (local, gitignored)
                            ▲
              ┌─────────────┼─────────────┐
              │             │             │
   InstructionsLoaded  PostToolUse(W)   Stop / SubagentStop
   log-rule-event     check-pattern-    judge-rule-
                      violations         compliance
                                         (opt-in)
              │             │             │
              └─────────────┼─────────────┘
                            │
                    aikit doctor --rules
                    aikit report
```

Every event has the same shape: `{ ts, event, rule_id, ...extras }`. There are five event types in current use.

| Event | Emitted by | Meaning |
|---|---|---|
| `loaded` | `log-rule-event.sh` | A rule with this ID was visible to Claude this session. |
| `violation` | `check-pattern-violations.sh` | A regex pattern in `aikit-rules.json` matched in a file Claude just wrote. |
| `cited` | `judge-rule-compliance.sh` | The LLM judge said the assistant's last turn followed this rule. |
| `judged_violation` | `judge-rule-compliance.sh` | The LLM judge said the assistant's last turn violated this rule. |
| `rule_compile_error` | `check-pattern-violations.sh` | A regex pattern in `aikit-rules.json` is invalid. The bad rule is skipped; this event surfaces it so you can fix it. |

## Adding rule IDs

A rule ID is a stable HTML comment on the same line as the rule:

```markdown
- <!-- id: code-style.no-any --> Use `unknown` and type guards, not `any`.
```

ID format: `topic.slug`. Must start with a letter. Must contain at least one dot. Allowed characters: `a-zA-Z0-9._-`. Examples: `commit.conventional-commits`, `security.no-sensitive-files`, `code-style.no-default-export`.

The HTML comment is stripped before Claude sees the file — it costs zero context tokens. But the hooks see it, which is how the telemetry stays correlated to specific rules.

### Optional metadata

Append space-separated `key=value` pairs after the ID:

```markdown
- <!-- id: code-style.no-any emphasis=high paths=src/**/*.ts --> Use `unknown` and type guards, not `any`.
```

| Key | Values | Read by |
|---|---|---|
| `emphasis` | `high` / `normal` / `low` | Dialect translators (Cursor wraps high in **bold**) |
| `paths` | comma-separated globs | Dialect translators (Cursor's `globs:`, Claude's `paths:`) |

The metadata is parsed by `src/render/dialects/parser.ts`. The hooks ignore it.

## The pattern config: `aikit-rules.json`

`check-pattern-violations.sh` reads `.claude/aikit-rules.json` to decide what to flag. Shape:

```json
{
  "version": 1,
  "rules": [
    {
      "id": "code-style.no-console-log",
      "title": "No console.log in production code",
      "pattern": "(?<!//\\s)console\\.log\\(",
      "fileGlobs": ["src/**/*.ts", "src/**/*.tsx"],
      "exclude": ["**/*.test.ts"],
      "severity": "warn"
    }
  ]
}
```

| Field | Meaning |
|---|---|
| `id` | Must match the corresponding rule ID in your AGENTS.md / CLAUDE.md. |
| `pattern` | Python regex (re.MULTILINE). One match per file → one violation event. |
| `fileGlobs` | Glob patterns the rule applies to (`**` recursion supported). |
| `exclude` | Glob patterns to skip (e.g. tests). Optional. |
| `severity` | Currently informational only — surfaced in events for future filters. |

If a regex fails to compile, the hook emits a `rule_compile_error` event instead of silently skipping the rule. `aikit doctor --rules` surfaces these in a separate section so a typo in `pattern` is visible.

## Enabling the LLM judge

The judge is **opt-in**. Without it you still get `loaded` and `violation` events; you just don't get a "did Claude actually follow this rule?" signal.

To enable:

```bash
export AIKIT_JUDGE=1
export ANTHROPIC_API_KEY=sk-ant-...
```

Both env vars must be set or the hook returns immediately (≤10ms, zero events).

Cost: roughly $0.001 per `Stop` event with the default model (`claude-haiku-4-5`). For a heavy 50-turn day that's about $0.05. You can swap the model with `AIKIT_JUDGE_MODEL=...`.

The judge:
1. Reads the assistant's last response from the hook input (or skips if absent / shorter than 20 chars).
2. Caps the transcript at 8000 chars.
3. Scans the project's rule files for declared IDs and pulls the surrounding rule text as context.
4. Asks Haiku to verdict each rule as `cited` / `violated` / `irrelevant`.
5. Writes `cited` or `judged_violation` events; `irrelevant` is skipped.

Errors land in `.aikit/judge-errors.log` (HTTP status, URL errors, JSON parse failures) so an opt-in user paying for verdicts can see why a turn produced nothing.

## Reading the data

### `aikit doctor --rules`

Classifies rules into four buckets:

| Bucket | Criteria | Advice |
|---|---|---|
| Hot | Loaded with no violations, OR cited with no violations | Keep |
| Disputed | Negative-rate (violations + judged_violations) > 30% of denominator | Strengthen with IMPORTANT/YOU MUST or move to a hook |
| Dead | Zero events of any kind | Delete or rephrase |
| Unmatched | Pattern violations recorded but rule never loaded | Check that the rule file is being read |

Denominator: `cited` if any cited events exist (more accurate); else `loaded` (proxy).

### `aikit report`

Same data formatted for sharing.

- `--format=markdown` (default) — sticky-PR-comment ready
- `--format=json` — structured for CI dashboards
- `--since=2026-04-01` — restrict to events on/after that timestamp

JSON output includes `adherence_score` (`null` when no `cited` events exist) and `adherence_basis` (`"judge"` or `"no-evidence"`). Pre-fix history: an earlier version counted `loaded` events as positive evidence, which made every rule score 99% regardless of actual compliance — see commit `96844ee`.

## Privacy stance

- `.aikit/events.jsonl` is local. `aikit sync` adds it to `.gitignore` automatically.
- `.aikit/judge-errors.log` is local.
- Nothing is sent anywhere unless you explicitly enable the LLM judge.
- The LLM judge calls only `api.anthropic.com` with your own key. No haac-aikit server, no telemetry endpoint, no analytics.
- You can pull the judge env vars at any time and the loop reverts to local-only.

## Troubleshooting

**Adherence score keeps coming back `null`.**
Expected if `AIKIT_JUDGE=1` isn't set. Without judge data, haac-aikit refuses to fake a score from `loaded` counts.

**A regex isn't matching files I expect.**
Check the `fileGlobs`. We use a custom glob-to-regex translator that supports `**` recursion (Python 3.9 `pathlib.PurePath.match` doesn't). Run `aikit doctor --rules` to see if a `rule_compile_error` event was logged.

**Hooks aren't firing.**
Check `.claude/hooks/hooks.json` is present (it ships at standard scope when `claude` is selected). If you've modified it, verify the JSON is valid and the script paths exist.

**The events log has malformed lines.**
A hook may have crashed mid-write. `aikit doctor --rules` surfaces the count; the parsed lines still produce a valid (but incomplete) report.

**Judge returns no verdicts despite the env vars.**
Check `.aikit/judge-errors.log`. Common causes: HTTP 401 (bad API key), HTTP 429 (rate limited), short assistant transcript (< 20 chars), no rule IDs declared in any rule file.

## Reference

- `catalog/hooks/log-rule-event.sh` — the InstructionsLoaded logger
- `catalog/hooks/check-pattern-violations.sh` — the PostToolUse pattern checker
- `catalog/hooks/judge-rule-compliance.sh` — the opt-in LLM judge
- `catalog/rules/aikit-rules.json` — starter pattern config
- `src/commands/doctor.ts` — `--rules` classifier
- `src/commands/report.ts` — Markdown / JSON formatter
