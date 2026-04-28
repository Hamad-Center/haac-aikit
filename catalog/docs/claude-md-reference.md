# CLAUDE.md & Memory Configuration Reference (2026)

> A condensed, citation-backed reference for everything Anthropic's official docs say
> about `CLAUDE.md`, auto memory, `.claude/rules/`, and related settings. Pulled from
> the canonical 2026 sources listed at the bottom. Shipped by `haac-aikit` so your
> contributors have one place to look up how Claude Code reads your project's rules.

---

## 1. The two memory systems

Claude Code has two complementary persistence layers, both loaded at session start:

| | **CLAUDE.md** | **Auto memory** |
|---|---|---|
| Author | You | Claude |
| Content | Instructions, rules, conventions | Learnings, patterns Claude infers |
| Scope | Project / user / organisation | Per working tree (per git repo) |
| Loaded | Every session, in full | Every session, first 200 lines / 25 KB of `MEMORY.md` |
| Use for | Coding standards, workflows, project architecture | Build commands, debugging insights, preferences Claude discovers |

> "Use CLAUDE.md files when you want to guide Claude's behavior. Auto memory lets
> Claude learn from your corrections without manual effort." — *memory docs*

Source: [memory docs §CLAUDE.md vs auto memory](https://code.claude.com/docs/en/memory)

---

## 2. CLAUDE.md scopes (highest specificity first)

| Scope | Location | Shared? | Use for |
|---|---|---|---|
| **Managed policy** | macOS `/Library/Application Support/ClaudeCode/CLAUDE.md` · Linux/WSL `/etc/claude-code/CLAUDE.md` · Windows `C:\Program Files\ClaudeCode\CLAUDE.md` | Org-wide; cannot be excluded | Compliance, security policies |
| **Project** | `./CLAUDE.md` **or** `./.claude/CLAUDE.md` | Team via git | Architecture, code style, workflows |
| **User** | `~/.claude/CLAUDE.md` | You only (every project) | Personal preferences |
| **Local** | `./CLAUDE.local.md` | You only (gitignored) | Sandbox URLs, test data |

All discovered files are **concatenated** (not overridden). Within each directory,
`CLAUDE.local.md` is appended after `CLAUDE.md`, so personal notes win on conflict.

Source: [memory docs §Choose where to put CLAUDE.md files](https://code.claude.com/docs/en/memory)

---

## 3. How files are discovered (the load order)

1. Walk **up** the directory tree from the working dir; load every `CLAUDE.md`
   and `CLAUDE.local.md` along the way **at launch**.
2. Files in **subdirectories** below the working dir are discovered too, but load
   **on demand** when Claude reads a file in that subdir.
3. **Imports** (`@path`) are expanded transitively, max **5 hops** depth. Relative
   paths resolve to the file containing the import, not the cwd.
4. Block-level `<!-- HTML comments -->` are **stripped before injection** — free
   maintainer notes that don't cost tokens. (Comments inside fenced code blocks are kept.)

Source: [memory docs §How CLAUDE.md files load](https://code.claude.com/docs/en/memory#how-claude-md-files-load)

---

## 4. Imports (`@path` syntax)

```markdown
See @README.md for project overview and @package.json for npm commands.

# Additional Instructions
- Git workflow: @docs/git-instructions.md
- Personal overrides: @~/.claude/my-project-instructions.md
```

- Both relative and absolute paths allowed; `~/` expands.
- Recursive imports allowed up to **5 hops**.
- ⚠️ **Imports do NOT reduce context size** — imported files load in full at
  launch. Use imports for *organisation*, not for token savings. For real
  load-on-demand, use `.claude/rules/` with `paths:` frontmatter (§6) or skills.
- First time Claude encounters external imports, an approval dialog appears.

Source: [memory docs §Import additional files](https://code.claude.com/docs/en/memory#import-additional-files)

---

## 5. AGENTS.md interop (cross-tool)

Claude Code reads `CLAUDE.md`, **not** `AGENTS.md`. The official pattern when you
already use `AGENTS.md` for Cursor/Copilot/Codex/etc.:

```markdown
# CLAUDE.md
@AGENTS.md

## Claude Code
Use plan mode for changes under `src/billing/`.
```

This is exactly what `haac-aikit` writes by default: `AGENTS.md` is canonical
(under BEGIN/END markers so re-runs are idempotent), and `CLAUDE.md` is a thin
shim that imports it plus an empty override block for Claude-specific rules.

Source: [memory docs §AGENTS.md](https://code.claude.com/docs/en/memory#agents-md)

---

## 6. `.claude/rules/` — modular, optionally path-scoped

The 2026 successor to monolithic CLAUDE.md for larger projects. Place markdown
files in `.claude/rules/`; each covers one topic.

```text
your-project/
├── .claude/
│   ├── CLAUDE.md
│   └── rules/
│       ├── code-style.md     # always loaded
│       ├── markers.md        # path-scoped — only loads when relevant
│       └── frontend/api.md   # nested dirs supported
```

### Path-scoped rules (the killer feature)

```markdown
---
paths:
  - "src/api/**/*.ts"
  - "test/api/**/*.test.ts"
---

# API rules
- All endpoints must validate input at the boundary...
```

Rules without `paths:` frontmatter load unconditionally. Path-scoped rules load
**only when Claude reads a matching file**, saving context. Glob patterns and
brace expansion supported.

Symlinks work (and circular symlinks are detected) — useful for sharing rules
across multiple repos.

User-level rules in `~/.claude/rules/` apply to all projects on your machine.

`haac-aikit` ships a starter `example.md` at `.claude/rules/example.md` (when
`claude` is selected and scope ≥ standard) — customise or delete it.

Source: [memory docs §Organize rules with .claude/rules/](https://code.claude.com/docs/en/memory#organize-rules-with-claude/rules/)

---

## 7. Auto memory

- **Storage**: `~/.claude/projects/<project>/memory/MEMORY.md` + topic files.
  `<project>` is derived from the git repo, so all worktrees share one dir.
- **Loaded**: first 200 lines or 25 KB of `MEMORY.md` (topic files load on demand).
- **Toggle**: `/memory` command, `autoMemoryEnabled: false` in settings, or
  `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`.
- **Custom location**: `autoMemoryDirectory` (user/local/policy settings only —
  **not** project settings, to prevent shared repos redirecting writes).
- **Requires** Claude Code v2.1.59+.
- Files are plain markdown — edit or delete freely.

Source: [memory docs §Auto memory](https://code.claude.com/docs/en/memory#auto-memory)

---

## 8. Settings & flags reference

| Setting / flag | Where | What it does |
|---|---|---|
| `claudeMdExcludes` | any settings layer | Glob list of CLAUDE.md paths to skip (managed policy CLAUDE.md cannot be excluded). |
| `autoMemoryEnabled` | project / user / local | Boolean. Toggle auto memory. |
| `autoMemoryDirectory` | user / local / policy (not project) | Custom auto-memory dir. |
| `CLAUDE_CODE_DISABLE_AUTO_MEMORY` | env var | Disable auto memory. |
| `CLAUDE_CODE_NEW_INIT=1` | env var | Enable interactive multi-phase `/init`. |
| `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1` | env var | Load CLAUDE.md from `--add-dir` paths. |
| `--append-system-prompt` | CLI flag | System-prompt-level instructions (must pass each invocation). |
| `--setting-sources` | CLI flag | Control which settings layers apply at startup. |
| `InstructionsLoaded` hook | `.claude/settings.json` | Fires when instruction files load — useful for debugging. |
| `/init` | slash command | Auto-generate starter CLAUDE.md from codebase analysis. |
| `/memory` | slash command | List loaded memory files; toggle auto memory. |
| `#` prefix | prompt shortcut | Quick-add a memory entry from the prompt line. |

Source: [memory docs](https://code.claude.com/docs/en/memory) · [settings docs](https://code.claude.com/docs/en/settings) · [best-practices](https://code.claude.com/docs/en/best-practices)

---

## 9. Writing effective CLAUDE.md (Anthropic best practices, 2026)

### Size
> "target under 200 lines per CLAUDE.md file. Longer files consume more context
> and reduce adherence."

### Specificity
> "Use 2-space indentation" beats "format code properly". Concrete, verifiable
> rules outperform abstract ones.

### Emphasis
> "You can tune instructions by adding emphasis (e.g., 'IMPORTANT' or 'YOU MUST')
> to improve adherence."

### What to include vs exclude

| ✅ Include | ❌ Exclude |
|---|---|
| Bash commands Claude can't guess | Anything Claude can figure out by reading code |
| Code style rules that differ from defaults | Standard language conventions |
| Test runner & how to run a single test | Detailed API docs (link to docs instead) |
| Repo etiquette (branches, PR conventions) | Information that changes frequently |
| Architectural decisions specific to project | Long explanations or tutorials |
| Dev-environment quirks (required env vars) | File-by-file descriptions of the codebase |
| Common gotchas / non-obvious behaviors | Self-evident practices like "write clean code" |

### The pruning test
> "For each line, ask: *Would removing this cause Claude to make mistakes?* If
> not, cut it. Bloated CLAUDE.md files cause Claude to ignore your actual
> instructions."

### Compaction
- **Project-root CLAUDE.md / AGENTS.md survives `/compact`** — re-injected from disk.
- **Nested CLAUDE.md files are NOT re-injected** until Claude reads a file in
  that subdir again.
- You can hint preservation explicitly:
  > `When compacting, always preserve the full list of modified files and any test commands`

Sources: [best-practices §Write an effective CLAUDE.md](https://code.claude.com/docs/en/best-practices#write-an-effective-claude-md) · [memory docs §Write effective instructions](https://code.claude.com/docs/en/memory#write-effective-instructions) · [context-window §What survives compaction](https://code.claude.com/docs/en/context-window#what-survives-compaction)

---

## 10. What `haac-aikit` ships by default

When you run `npx haac-aikit init` and select `claude` as a tool:

| File | Always | Standard+ scope only | Notes |
|---|---|---|---|
| `AGENTS.md` | ✓ | | Canonical, marker-managed, idempotent on `sync`. |
| `CLAUDE.md` | ✓ | | 5-line `@AGENTS.md` shim with empty override block. |
| `.claude/settings.json` | ✓ | | Permissions allow/deny/ask matrix. |
| `docs/claude-md-reference.md` | | ✓ | This file. Reference for your team. |
| `.claude/rules/example.md` | | ✓ | Starter path-scoped rule — customise or delete. |

`AGENTS.md` is the single source of truth, automatically read by Cursor,
Copilot, Codex, Aider, Gemini CLI, Windsurf, and Claude Code.

---

## Sources

- [How Claude remembers your project (memory docs)](https://code.claude.com/docs/en/memory) — primary canonical reference for CLAUDE.md, auto memory, `.claude/rules/`, imports, scopes, load order, settings.
- [Best Practices for Claude Code](https://code.claude.com/docs/en/best-practices) — `/init`, emphasis tuning, include/exclude table, pruning heuristic.
- [Settings reference](https://code.claude.com/docs/en/settings) — `autoMemoryEnabled`, `autoMemoryDirectory`, `claudeMdExcludes`, env vars.
- [Context window](https://code.claude.com/docs/en/context-window) — what survives `/compact`.
- [Skills](https://code.claude.com/docs/en/skills) — when to use a skill instead of CLAUDE.md content.
- [Hooks](https://code.claude.com/docs/en/hooks) — `InstructionsLoaded` hook for debugging memory loads.

_Shipped by haac-aikit. Last refreshed: 2026-04-29._
