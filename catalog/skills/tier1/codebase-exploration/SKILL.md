---
name: codebase-exploration
description: Use when starting work in an unfamiliar codebase or module, or when the user says "how does X work?", "explain this repo", "I'm new here", or "let me understand before touching it". Read-only reconnaissance — entry points, critical path, dependencies, tests — before any edit, so you don't break code you don't understand.
version: "1.0.0"
source: haac-aikit
license: MIT
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash(ls:*)
  - Bash(find:*)
  - Bash(rg:*)
---

## When to use
- First session in a codebase
- Moving into a module you haven't touched before
- Before refactoring code you didn't write
- When the human asks "how does X work?"

## Exploration sequence

### 1. Orient (2-3 minutes max)
```bash
ls -la                          # top-level structure
cat package.json | head -30     # or Cargo.toml / go.mod / pyproject.toml
git log --oneline -10           # recent activity
git diff main...HEAD --stat     # if on a feature branch
```

### 2. Find the entry points
- Web: `src/index.ts`, `app/layout.tsx`, `main.go`, `__main__.py`
- CLI: look for the `bin` field in package.json, or `cmd/` directory
- Library: `src/index.ts` exports

### 3. Trace the critical path
For the specific feature you need to touch:
1. Identify the triggering event (HTTP request, CLI invocation, UI interaction)
2. Follow the call chain: find the handler → service → data layer
3. Note each boundary: where does I/O happen? Where does auth happen?

### 4. Map dependencies
- What does the module you're editing import?
- What imports the module you're editing?
- Are there hidden consumers (dynamic imports, reflection, DI containers)?

### 5. Read tests before source
Tests reveal intent. Read the test file for the module first — it shows expected behaviour without having to infer it from implementation.

## Output format
```
Understanding:
- Entry: [file:line]
- Critical path: [A → B → C → D]
- Key dependencies: [list]
- Gotchas noticed: [anything surprising]
→ Ready to proceed / Need to clarify: [question]
```

## Anti-patterns
- **Editing during exploration.** Every fix-while-exploring discovers another unrelated "while I'm here" edit; the exploration never finishes. Note issues, fix them after.
- **Reading source before tests.** Tests show intent in one screen; source forces you to infer it across many files.
- **Skipping the dependency map** (who imports this?). Most refactor regressions come from hidden consumers.
- **Spending >5 minutes on `ls`/`cat` orientation** before naming the specific file you need to touch. Re-scope: explore *to answer a question*, not exhaustively.

When exploration ends in a bug, invoke `systematic-debugging`. When it ends in a build task, invoke `writing-plans`.
