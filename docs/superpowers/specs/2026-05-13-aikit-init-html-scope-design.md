# Design: `aikit init html` — minimal install for just html-artifacts

**Date:** 2026-05-13
**Files affected:** `src/types.ts`, `src/commands/init.ts`, `src/commands/sync.ts`, `src/cli.ts`, `src/wizard.ts`, `README.md`, new `test/init-html-scope.test.ts`
**Status:** Approved (design content reviewed and accepted in chat before this spec was written)

## Problem

A growing audience wants to use only the html-artifacts skill + templates without adopting the rest of haac-aikit (AGENTS.md, agents, hooks, CI templates, MCP config, etc.). Today the smallest install (`--scope minimal`) still writes AGENTS.md and MCP config, and skips skills entirely. There's no path for "just give me the HTML thing."

The new `html` scope creates that path. It also serves as a discoverability lever: by adding a prominent README callout, users searching for "HTML output from Claude" or "Claude templates" find a one-command install that doesn't ask them to buy into the whole kit.

## Non-goals

- **Not a separate npm package.** The html-artifacts skill stays inside haac-aikit. The new scope is a slice of what already ships, not a fork.
- **Not removing existing scopes.** `minimal`, `standard`, `everything` keep their current behavior. The `html` scope is additive.
- **Not changing the html-artifacts skill itself.** No content change to the skill, templates, or `/html` command — only the install machinery changes.
- **Not rewriting the install wizard.** The wizard adds one new choice; the existing flow for the other three scopes is untouched.

## Design

### 1. New Scope value

In `src/types.ts`:

```ts
export type Scope = "minimal" | "standard" | "everything" | "html";
```

### 2. Sync behavior for the html scope

In `src/commands/sync.ts`, add an **early-return branch** at the top of `runSync` (after config load, before any existing writes):

```ts
if (config.scope === "html") {
  // Sync ONLY: html-artifacts skill, /html command, html templates.
  results.push(...syncOneSkill("tier1", "html-artifacts", opts));
  if (config.tools.includes("claude")) {
    results.push(...syncOneCommand("html", opts));
  }
  results.push(...syncTemplates(opts));
  ensureGitignoreEntries(dryRun);
  return results;
}
```

Two helpers added or used:
- `syncOneSkill(tier, name, opts)` — single-file variant of the existing `syncSkills` loop. Implement inline if not already present.
- `syncOneCommand(name, opts)` — single-file variant of `syncCommands`. Same pattern.

**Skipped entirely in html scope**: AGENTS.md, MCP config, hooks, agents, CI, husky, devcontainer, plugin, OTel, all other skills, all other commands. The early return is the simplest way to express "this scope is a slice, not a configuration of integrations."

### 3. Init defaults for html scope

In `src/commands/init.ts`, `defaultIntegrationsForScope("html")` returns `[]`. The html scope does NOT enable any integrations — it's a content slice, not an integration set.

The `tools` array for an html-scope install defaults to `["claude"]` (the /html command only works in Claude Code, and that's the primary user); the wizard still lets the user pick other tools if they want the templates installed without the command.

### 4. CLI subcommand alias

In `src/cli.ts`, add a route at the command-dispatch site:

```ts
case "init html": {
  argv.scope = "html";
  const { runInit } = await import("./commands/init.js");
  return runInit({ ...argv, scope: "html" });
}
```

This makes `aikit init html` shorthand for `aikit init --scope html`. Existing `--scope` and `--preset` flag handling routes the canonical name through the same code path.

### 5. Wizard option

In `src/wizard.ts`, the scope picker gains one choice:

```ts
{ value: "html", label: "Just HTML artifacts (minimal — no agents, hooks, or CI)" }
```

When picked, the wizard:
- Skips the integrations question (always empty for html scope)
- Skips the tools question (defaults to `["claude"]`) — OR keeps the tools question and notes that only claude gets the `/html` command. Pick the simpler path: keep tools question, defaults claude pre-selected.

### 6. README callout

Insert near the top of `README.md`, right after the badges line and before `## Quickstart`:

```markdown
> [!TIP]
> **Just want HTML output from Claude Code?** Skip the full kit and install only the html-artifacts skill + 20 templates:
>
> ```bash
> npx haac-aikit init html
> ```
```

Why this shape:
- GitHub renders `> [!TIP]` as a colored callout with icon — the "big font" / prominent treatment markdown supports
- Single benefit sentence + one command — no feature dump
- Keywords ("HTML output", "Claude Code", "html-artifacts skill", "templates") flow naturally into the sentence so searches hit them

### 7. Tests

New file: `test/init-html-scope.test.ts`. Uses the existing test fixture pattern. Asserts:

- After `aikit init html --yes` in a tmpdir, these files exist:
  - `.aikitrc.json` with `scope: "html"`
  - `.claude/skills/html-artifacts.md`
  - `.claude/commands/html.md`
  - `.aikit/templates/html-artifacts/MANIFEST.json` (plus all 20 template files)
- After the same run, these files do NOT exist:
  - `AGENTS.md`
  - `.mcp.json`
  - `.claude/hooks/`
  - `.claude/agents/`
  - `.github/`
  - `.devcontainer/`
  - `.husky/`
  - `.claude/skills/<any-other-skill>.md` (sample a few names)

## Why this design

- **Early-return branch** in sync.ts is the cheapest, most readable way to express "html is a slice." Alternative: a feature-flag matrix per integration. Rejected because the integration grid is already complex and adding "html scope skips all of these" branches everywhere makes it worse.
- **Single-skill / single-command sync helpers** instead of using the existing loop with a filter: clearer call sites, easier to reason about, no accidental inclusion of new skills as the catalog grows.
- **`tools` defaults to `["claude"]` for html scope** because the /html command is Claude-only. Templates work cross-tool but the command file (`/html` slash) only fires in Claude Code. Pre-selecting claude reflects the primary use case.
- **GitHub `[!TIP]` callout** is the "big" markdown affordance; raw HTML would render but breaks on non-GitHub viewers. The callout is the right tradeoff.
- **No new package**: shipping a separate `@hamad-center/html-artifacts` package doubles maintenance, splits the source of truth, and complicates the brand. A scope slice gets the same outcome at zero ongoing cost.

## Alternatives considered

- **Separate npm package** — doubles maintenance, no clear benefit
- **Fuzzy CLI matcher** (Levenshtein) — user clarified "fuzzy" referred to README scannability, not CLI matching. Skipped.
- **`--preset html` only, no subcommand alias** — `aikit init html` is the natural shorthand; supporting both is one extra case in the switch
- **Add a "minimal-html" scope keeping AGENTS.md** — AGENTS.md is opinionated; users who want "just HTML" don't want to be opted into the kit's conventions. Skip AGENTS.md in html scope is correct.

## Implementation steps (high-level — execution will expand)

1. `src/types.ts` — extend `Scope` union with `"html"`
2. `src/commands/init.ts` — add `defaultIntegrationsForScope("html") => []`, set default tools to `["claude"]` for html scope
3. `src/commands/sync.ts` — add early-return branch + extract `syncOneSkill`, `syncOneCommand` helpers
4. `src/cli.ts` — add `init html` route, also handle `aikit init <scope>` positional convention if not already supported
5. `src/wizard.ts` — add html option in scope picker
6. `test/init-html-scope.test.ts` — new test asserting file presence/absence
7. `README.md` — add `[!TIP]` callout before Quickstart
8. Run `npm test`, `npm run typecheck`, `npm run catalog:check`
9. Commit. Push.

## Verification

- **Static**: typecheck passes, lint passes, catalog:check passes
- **Test**: `npm test` includes the new `init-html-scope.test.ts` and passes
- **Behavioral**: `npx <local-dist>/cli.mjs init html --yes` in a fresh tmpdir produces only the expected files; `find . -type f` matches the test assertion list

## Scope check

This is a single, focused feature. 7 files modified, ~120 lines added net. One commit. No breaking changes (existing scopes untouched). Ready for execution.
