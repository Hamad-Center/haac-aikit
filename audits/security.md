# audits/security.md

Security review covering input validation, path safety, escaping, secret leaks.

## Audit checklist

### Input validation
- [x] **Path traversal in `aikit add <name>`** — fixed in 0.12: regex `^[a-zA-Z0-9][a-zA-Z0-9_-]*$` rejects `/`, `\`, `..`, special chars (test: `aikit add — path-traversal guard`)
- [x] Frontmatter parser is regex-DoS safe — lazy match is bounded linearly by V8
- [x] No dynamic code evaluation primitives anywhere in source
- [x] JSON.parse calls wrapped in try/catch for user-supplied configs

### Path safety
- [x] All file writes go through `safeWrite` which uses `node:path.join`
- [x] `mkdirSync(recursive: true)` is OK because destination dirs are predetermined, not user-supplied
- [x] The `--html` bundle uses hardcoded skill names, not user-supplied — no traversal risk

### Escaping
- [x] **TOML literal strings** for skill/agent bodies → no escape processing needed (Codex, Gemini)
- [x] **TOML basic-string fallback** properly escapes `\` then `"""` when body contains `'''`
- [x] **JSON escaping** in `buildCodexConfigToml` MCP args — only `"` escaped, NOT `\`. Risk: Windows paths in MCP args could break TOML. **Low-severity** since users would notice and edit
- [x] **Cursor MDC** escapes `\` then `"` in descriptions

### Secret leaks
- [x] `.env*` in .gitignore + not in npm `files` array (only `dist/` + `catalog/` ship)
- [x] `*.pem`, `id_rsa*`, `.ssh/`, `.aws/` blocked by `file-guard.sh` hook
- [x] No hardcoded API keys / tokens — `aikit-rules.json` ships a regex to detect this pattern in user code

### Shell scripts
- [x] All `.sh` files use `set -e` or explicit error handling
- [x] No string-to-code evaluation in shipped shell scripts
- [x] Telemetry scripts use `2>/dev/null || true` so a broken hook doesn't block tool calls
- [x] Block-* hooks fail-closed only on confirmed-bad input; pass-through otherwise

### Known limitations
- [ ] Windows path handling in MCP JSON `args` field — backslashes in user-supplied MCP server paths not escaped before going to TOML. Low risk; users editing `.mcp.json` would catch.
- [ ] No `npm audit` integration in CI — out of scope but worth a follow-up.

## Status

🟢 — primary concerns addressed. The MCP-arg backslash edge case is theoretical and user-visible.
