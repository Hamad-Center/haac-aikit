---
paths:
  - "src/**/*.ts"
  - "src/**/*.tsx"
---

# Example path-scoped rule (CUSTOMISE OR DELETE)

> This file was shipped by `haac-aikit` as a starter. It demonstrates the 2026
> `.claude/rules/` mechanism: rules with a `paths:` frontmatter load **only when
> Claude reads a matching file**, saving context.
>
> Edit it to match your project's conventions, change the `paths:` glob, or
> delete the file entirely. See `docs/claude-md-reference.md` §6 for the full
> spec.

## Conventions for files matching the `paths:` glob

<!-- Rule IDs let `aikit doctor --rules` track each rule's fire-rate and
     violation-rate over time. Match the ID exactly in `aikit-rules.json` if
     you want pattern-based violation detection on top of the load-time log. -->

- <!-- id: code-style.no-default-export --> Use named exports, not `export default`.
- <!-- id: code-style.no-any --> Use `unknown` + type guards instead of `any`.
- <!-- id: code-style.no-console-log --> No `console.log` in production code (remove before commit).
- Prefix the most load-bearing rules with `IMPORTANT:` or `YOU MUST` —
  Anthropic guidance says emphasis improves adherence.

## How to add another rule

Create another `.md` file in `.claude/rules/`. Without `paths:` frontmatter, the
rule loads on every session. With `paths:`, it loads only when Claude reads a
matching file. Subdirectories like `.claude/rules/frontend/` are supported.

## How to delete this file

`rm .claude/rules/example.md`. `aikit diff` will then report it as missing on
the next run; ignore the warning or run `aikit sync --force` to suppress it.
