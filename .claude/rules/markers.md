---
paths:
  - "src/render/**/*.ts"
  - "src/render/**/*.test.ts"
  - "test/markers.test.ts"
  - "test/idempotency.test.ts"
  - "catalog/**/*.tmpl"
  - "catalog/**/*.shim"
---

# Marker engine rules

> Loaded only when editing files that touch the BEGIN/END marker engine.
> See `docs/claude-md-reference.md` §6 for the path-scoped-rules mechanism.

## The invariant

The marker engine in `src/render/markers.ts` is the **safety contract** for the whole CLI: every file haac-aikit writes into a user's repo is bracketed by `BEGIN:haac-aikit` / `END:haac-aikit` markers, and **only content between markers is ever overwritten on `sync`**. Anything outside the markers is user-authored and sacred.

## YOU MUST

- **Never** edit, rename, reformat, or remove markers in any `catalog/**/*.tmpl` or `catalog/**/*.shim` file. The exact byte sequence is matched.
- **Never** introduce a new file dialect without:
  1. Adding it to the dialect map in `src/render/markers.ts`.
  2. Adding a **round-trip test** in `test/markers.test.ts` (write → read → re-write produces byte-identical output).
  3. Adding an **idempotency test** in `test/idempotency.test.ts` (running `sync` twice produces no diff).
- **Never** allow `upsertMarkerRegion` to write a file that lacks both markers — that's the bug that ate someone's `CLAUDE.md`. Throw or skip; do not silently append.

## Dialect cheat sheet

| Extension | Comment syntax |
|---|---|
| `.md`, `.mdx` | `<!-- BEGIN:haac-aikit --> ... <!-- END:haac-aikit -->` |
| `.yml`, `.yaml` | `# BEGIN:haac-aikit` ... `# END:haac-aikit` |
| `.json` | `// BEGIN:haac-aikit` ... `// END:haac-aikit` (JSONC; not standard JSON) |
| `.sh`, no-ext | `# BEGIN:haac-aikit` ... `# END:haac-aikit` |

## When debugging marker bugs

1. Check the file extension reaches the dialect resolver — extension casing matters.
2. Run the round-trip test with the actual user content as input.
3. Verify markers aren't inside a fenced code block in markdown (the parser is line-based, not AST-based — fenced code does not protect markers from rewrite).
