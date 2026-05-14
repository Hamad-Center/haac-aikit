# audits/catalog-hooks.md

Hooks catalog quality review.

## Inventory (10 hooks)

**Safety (4):**
- `block-dangerous-bash.sh` — stops `rm -rf /`, `chmod -R 777`, etc.
- `block-force-push-main.sh` — refuses force push to main/master/develop
- `block-secrets-in-commits.sh` — catches `.env*`, `id_rsa*`, AWS keys
- `file-guard.sh` — blocks reads of `.ssh/`, `.aws/`, `secrets/`, `*.pem`

**Lifecycle (2):**
- `session-start-prime.sh` — loads current rule state at session start
- `compaction-preservation.sh` — preserves load-bearing context across `/compact`

**Telemetry (3):**
- `log-rule-event.sh` — records every rule load/citation as JSONL
- `check-pattern-violations.sh` — post-write regex violation scan
- `judge-rule-compliance.sh` — optional LLM judge for adherence scoring

**Config (1):**
- `hooks.json` — manifest for Claude Code

## Audit checklist

- [x] All `.sh` files use `set -e` or explicit error handling
- [x] All hooks exit 0 on internal errors (`2>/dev/null || true` patterns)
- [x] All hooks echo `{"decision":"approve"}` so they never block the parent tool
- [x] JSON output goes through `json.dumps`, not `printf` (per AGENTS.md gotcha)
- [x] No `eval` in any hook
- [x] All hooks chmod 0755 on install
- [x] Cross-platform: Unix-only (`.sh` extension); Windows users need WSL — documented
- [x] All hooks self-filter (early-exit when their trigger condition doesn't match)
- [x] No telemetry hook spins on every event — they short-circuit cheaply

## Status

🟢 — production-ready. Hooks have been the most-stable surface across releases.
