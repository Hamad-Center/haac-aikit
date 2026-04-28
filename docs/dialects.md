# Dialect translation

Same rule content, reformatted per tool. Cursor MDC ships in 0.4.0; Claude, Aider, Copilot, and Gemini are queued.

## Why this exists

Other multi-tool kits ship the same content into every per-tool file: `.cursor/rules/`, `.github/copilot-instructions.md`, `CONVENTIONS.md`, `GEMINI.md` all become 5-line shims that point at AGENTS.md. Functional, but each tool has dialect quirks the canonical file doesn't exploit:

- **Cursor** — MDC frontmatter with `globs:` for path-scoped loading. Bullet lists with markdown emphasis.
- **Claude Code** — `IMPORTANT:` / `YOU MUST` emphasis tokens measurably improve adherence. `paths:` frontmatter for path-scoped loading.
- **Aider** — Imperative phrasing in `CONVENTIONS.md`. Auto-loaded via `.aider.conf.yml`'s `read:` directive.
- **Copilot** — Short bullets, small context budget.
- **Codex / Gemini** — AGENTS.md natively.

haac-aikit reads the canonical AGENTS.md, parses rule IDs and metadata, then emits per-tool files using each tool's preferred idioms.

## Metadata syntax

Two optional keys on a rule's ID comment:

```markdown
- <!-- id: code-style.no-any emphasis=high paths=src/**/*.ts --> Use `unknown` and type guards, not `any`.
```

| Key | Values | Effect |
|---|---|---|
| `emphasis` | `high` / `normal` / `low` | High → wrapped in `**bold**` for tools that respond to emphasis. |
| `paths` | comma-separated globs | Surfaced as Cursor `globs:` / Claude `paths:` frontmatter when relevant. |

Defaults: `emphasis=normal`, `paths=` empty (the rule applies everywhere).

The metadata is parsed by `src/render/dialects/parser.ts`. It does NOT affect Claude's reading of AGENTS.md — Claude strips HTML comments before injection.

## Currently shipping: Cursor MDC

Input — a rule in AGENTS.md:

```markdown
- <!-- id: code-style.no-any emphasis=high paths=src/**/*.ts --> Use `unknown` and type guards, not `any`.
```

Output — `.cursor/rules/000-base.mdc`:

```mdc
---
description: Project rules for my-project — generated from AGENTS.md by haac-aikit
alwaysApply: true
---

<!-- BEGIN:haac-aikit -->
# my-project

...

## Code style

- **Use `unknown` and type guards, not `any`.** _(applies to: `src/**/*.ts`)_  <!-- id: code-style.no-any -->

<!-- END:haac-aikit -->
```

Notice:
- MDC frontmatter (Cursor's native format) instead of plain markdown.
- High-emphasis rules get `**bold**`.
- Paths metadata becomes a hint comment.
- Rule IDs are preserved so the observability hooks see them load alongside AGENTS.md — telemetry stays unified.
- `<!-- BEGIN:haac-aikit -->` / `<!-- END:haac-aikit -->` markers protect any user edits outside the managed region.

## Roadmap

The translator infrastructure (`src/render/dialects/`) is built; adding a new dialect is one file plus tests.

| Tool | Status | What it'd add |
|---|---|---|
| Cursor MDC (single file) | ✅ shipping in 0.4.0 | Path hints surfaced inline (this doc) |
| Cursor MDC (multi-file, per-glob) | Planned | One `.mdc` per `paths` group with proper `globs:` frontmatter |
| Claude `CLAUDE.md` | Planned | `IMPORTANT:` / `YOU MUST` prefixes on emphasis=high rules |
| Aider `CONVENTIONS.md` | Planned | Imperative phrasing (`Always use…`, `Never write…`) |
| Copilot | Planned | Short bullets, hard token cap |
| Gemini | Planned | Same shim model as Claude (still reads AGENTS.md) |

## Adding a new translator

1. Create `src/render/dialects/<tool>.ts` exporting `translateFor<Tool>(ruleSet: ParsedRuleSet): string`.
2. The function receives:
   ```ts
   interface ParsedRuleSet {
     projectName: string;
     description: string;
     rules: ParsedRule[];          // each with id, text, meta, section
     rawSections: Map<string, string>;
   }
   ```
3. Emit a string with `<!-- BEGIN:haac-aikit -->` / `<!-- END:haac-aikit -->` markers around the managed content (so user edits outside survive sync).
4. Wire into `src/commands/sync.ts` in the `if (config.tools.includes("<tool>"))` block.
5. Add tests under `test/dialects.test.ts`.

The Cursor implementation in `src/render/dialects/cursor.ts` is the reference.

## Why one file at a time, not a config-driven matrix

The translators are intentionally small, hand-written functions instead of a generic templating system. Reasons:

- Each tool's idioms shift over time (Cursor added `globs:` mid-2025, Aider added `read:` in late 2025). A hand-written translator can adapt to nuance; a generic templater would be stuck on the lowest common denominator.
- Total code per translator is ~30-60 lines. Not enough to justify abstraction overhead.
- Tests can assert tool-specific output (`expect(out).toContain("**Use \`unknown\`")`) without juggling config templates.

## Reference

- `src/render/dialects/types.ts` — `RuleMeta`, `ParsedRule`, `ParsedRuleSet`
- `src/render/dialects/parser.ts` — extract rules + metadata from AGENTS.md
- `src/render/dialects/cursor.ts` — Cursor MDC translator (reference impl)
- `src/render/dialects/index.ts` — public exports
- `test/dialects.test.ts` — parser + translator tests (11 currently)
