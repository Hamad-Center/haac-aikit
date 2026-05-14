# audits/codex.md

What we install when `codex` is selected, and whether it matches OpenAI Codex CLI's expectations (per <https://developers.openai.com/codex/subagents>, <https://developers.openai.com/codex/hooks>, <https://developers.openai.com/codex/config-advanced>, <https://developers.openai.com/codex/mcp>).

## What we ship to a Codex-only install

- `AGENTS.md` (canonical — Codex reads this natively)
- `.codex/agents/<name>.toml` × 5 (parsed from catalog/agents/{tier1,tier2}/*.md)
- `.codex/config.toml` — `[features] codex_hooks = true`, `[agents]` concurrency caps, `[mcp_servers.*]` translated from .mcp.json
- **Post-sync warning**: "trust this project to enable .codex/" (silently dropped otherwise)

## Audit checklist

### Format correctness
- [ ] TOML output is parseable by a strict TOML parser (verify with `toml` npm package or `taplo`)
- [ ] `developer_instructions = """..."""` multi-line strings — confirm Codex parses TOML "basic strings" multi-line (the `"""` form). If it needs literal strings `'''`, switch.
- [ ] Embedded `"""` in a skill body would terminate the TOML string early — verify escaping (we replace `"""` → `\"\"\"`)
- [ ] `[features] codex_hooks = true` — confirm this enables our hooks fully (no further setup)
- [ ] `[agents] max_threads/max_depth/job_max_runtime_seconds` field names match Codex docs exactly

### Trust model
- [x] Post-sync warning fires when `codex` is in selected tools — confirmed in smoke test
- [ ] Document the trust requirement on the landing page (currently only in CLI output)
- [ ] Add a check in `aikit doctor` that detects whether the current project is Codex-trusted (if there's a way to query)

### Subagent fields we're not using
- [ ] `model` and `model_reasoning_effort` — our agents.md files have `model: claude-sonnet-4-6` which Codex won't recognize. Should we strip the model field for the Codex translation? Or leave it as a no-op?
- [ ] `sandbox_mode` (read-only / workspace-write) — could ship `read-only` by default for safety
- [ ] `nickname_candidates` — array of alternative names for the agent. Useful?
- [ ] `[[skills.config]]` per-agent skill enable/disable — currently unused

### Hooks
- [ ] Codex hooks via `[hooks]` in config.toml — verify whether our shipped `.claude/hooks/*.sh` could be referenced from a `[hooks]` block, or if we'd need to copy them to `.codex/hooks/`
- [ ] Six events available (SessionStart, PreToolUse, PermissionRequest, PostToolUse, UserPromptSubmit, Stop). We wire none today. Add at least PreToolUse + PostToolUse for telemetry parity?

### Edge cases
- [ ] What if the user has a pre-existing `.codex/config.toml` with their own settings — do we conflict? Currently we overwrite via `safeWrite` (with conflict prompt on second sync)
- [ ] What if `.mcp.json` parsing fails (malformed JSON) — `buildCodexConfigToml` returns just the [features]+[agents] block. Verify this gracefully degrades.

### Tests
- [ ] Test that `buildCodexConfigToml` output parses as valid TOML
- [ ] Test that each generated `.codex/agents/<name>.toml` parses as valid TOML
- [ ] Test against Codex's actual parser if available (or use a strict TOML validator)

## Status

🟡 — generates plausible TOML and warns about trust gate, but TOML validity isn't automatically tested and we're missing Codex-side hooks wiring.

## Decision: what to fix before publish

(Filled in after research result arrives)
