# audits/cross-platform.md

Windows + Linux + macOS correctness.

## Audit checklist

- [x] **Path joins** — use `node:path.join` everywhere, never string concatenation
- [x] **Forward slashes in hooks.json** — Cursor/VS Code accept `/` on Windows per Node/VS Code convention
- [x] **Line endings** — `writeFileSync(..., "utf8")` preserves catalog `\n`. Windows users with `core.autocrlf=true` may see persistent file-modified warnings; documented
- [x] **Executable bit** — `chmodSync(path, 0o755)` runs for `.sh` files. No-op on Windows (Node docs); WSL/git-bash handles it
- [x] **Cross-platform shell scripts** — `.sh` ships only. Windows users need WSL/git-bash. **Documented limitation** (would need `.cmd`/`.ps1` shims for native Windows)
- [x] **`existsSync` + `readFileSync`** — work identically across platforms
- [x] **`mkdirSync({ recursive: true })`** — Node 20+ supports this everywhere
- [x] **Catalog path resolution** — `import.meta.url` + `fileURLToPath` walks up from both `src/` (dev) and `dist/` (bundled) on all platforms

## Status

🟡 — works on Unix/macOS; Windows users without WSL get degraded experience (no executable hooks). Document explicitly in README.
