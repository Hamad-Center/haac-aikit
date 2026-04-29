# Interactive conflict resolution — design spec

- **Date:** 2026-04-29
- **Status:** Draft (awaiting implementation)
- **Author:** Claude (with Mersall)
- **Target version:** 0.7.0

## Context

When `aikit sync` (or `aikit update`) re-installs a template file (agent, skill, command, or hook `.md`) that the user has hand-edited, the current behavior is to **silently overwrite**. The `copyAction` helper in `src/commands/sync.ts:147` checks for content equality and reports `"skipped"` if equal, but it does not branch to a `"conflict"` action when the content differs — it just calls `copyFileSync` and reports `"updated"`.

This is in contrast to `safeWrite` (`src/fs/safeWrite.ts:47`) which DOES return `"conflict"` for non-marker files when content differs and `--force` isn't set. The two write paths handle the same situation differently.

Users have asked for a friendlier behavior: prompt before overwriting a locally-modified file.

## Goals

- Detect conflicts in `copyAction` (parity with `safeWrite`).
- When stdin is a TTY, present an interactive prompt with sensible options.
- Default to "Replace with catalog version" so the safe-and-most-common choice is one keystroke away.
- Provide a "Keep local + mark as tier3" option that auto-edits `.aikitrc.json` so the file is permanently protected from future overwrites.
- Preserve existing headless behavior: `--yes` / `--force` / non-TTY skips prompts; CI is unaffected.

## Non-goals

- **No manifest / hash tracking.** This release uses a simple "destination ≠ incoming → conflict" rule. Future catalog updates that genuinely change a file the user didn't touch will be flagged as conflicts. Acceptable noise for v1; see Out of scope.
- **No 3-way merge.** "Keep" preserves the local file as-is; "Replace" uses the catalog version. There's no merge.
- **No conflict resolution for markered files** (AGENTS.md etc.). Those use `safeWrite`'s existing flow, which already handles them via BEGIN/END region updates. This spec only addresses `copyAction`.
- **No persistent "always replace" preference.** "Replace all" is sticky for the current invocation only.

## Decisions

### D1. Where conflicts are detected

In `src/commands/sync.ts`, refactor `copyAction` to return `"conflict"` when content differs and the caller hasn't requested `--force`. New signature:

```ts
function copyAction(
  srcPath: string,
  destPath: string,
  opts: { dryRun: boolean; force: boolean }
): WriteResult
```

The function:
1. If destination doesn't exist → `created` (write).
2. If destination matches incoming → `skipped` (no write).
3. If destination differs and `force === false` → `conflict` (no write yet).
4. If destination differs and `force === true` → `updated` (write).

### D2. Conflict resolution UX

After all `WriteResult`s are collected, sync inspects `conflicts = results.filter((r) => r.action === "conflict")`. If `conflicts.length === 0`, current output flow is unchanged.

If conflicts exist AND stdin is a TTY AND `--force` was not passed AND `--yes` was not passed:
1. Print a banner: `Found {N} files modified locally. Reviewing each…`.
2. For each conflict, prompt:

```
Modified locally: .claude/agents/reviewer.md
  ▸ Replace with catalog version (recommended)
    Keep local version (mark as tier3 to silence future prompts)
    Show diff first
    Replace all remaining conflicts
    Skip all remaining conflicts
```

3. Each conflict is prompted independently. Picking "Replace" or "Keep" only affects that single file. Picking "Replace all" or "Skip all" short-circuits the rest of the conflicts in this run — no further prompts, applied uniformly.

**Implementation detail:** "Show diff first" displays a colored unified diff inline (using `kleur`), then re-prompts the same file with the same 4 non-diff choices. This is a render-then-loop, not a separate state.

### D3. Headless / non-TTY behavior

If `--yes`, `--force`, or stdin is not a TTY (e.g., piped, CI, scripts), conflicts are NOT prompted. The flow is:
- `--force` → silently overwrite (current behavior with the new branch path).
- `--yes` (without `--force`) → skip conflicts and warn (`{N} conflict(s) skipped — re-run with --force or interactively to resolve`).
- Non-TTY → same as `--yes`.

This preserves existing CI behavior. CI was already piping into `aikit` and never expected interactive prompts.

### D4. "Keep + mark as tier3" config update

When the user picks "Keep local version", we must:
1. NOT overwrite the file.
2. Add the file's bare name (no extension) to the appropriate `tierN.tier3` array in `.aikitrc.json`.

The "appropriate" array depends on the file path:
- `.claude/agents/foo.md` → `config.agents.tier3`
- `.claude/skills/foo.md` → `config.skills.tier3`
- `.claude/commands/foo.md` and `.claude/hooks/*` → no tier3 mechanism for these (commands and hooks have no `tier3` array in `AikitConfig`). In this case, "Keep" simply skips the file for this run with a one-line warning: `Kept .claude/commands/foo.md — no tier3 protection available for commands; this file will be flagged again on next sync.` The user must keep choosing "Keep" each run, or fork the catalog. v1 limitation; commands/hooks tier3 could be added later if real-world demand emerges.

For the agents and skills cases, the tier3 update writes back to `.aikitrc.json` via the existing `writeConfig` helper. The change is in-memory until the sync run completes; it's persisted at the end of the sync.

### D5. Diff display format

When the user picks "Show diff first", display a unified diff using a small inline implementation:
- Lines only in destination (their local) → red, prefixed `- `
- Lines only in incoming (catalog) → green, prefixed `+ `
- Unchanged context lines → dim, prefixed `  ` (3 lines of context)

A library like `diff` (npm) provides this off-the-shelf. Adding one tightly-scoped runtime dependency is acceptable per `AGENTS.md` policy ("Don't add new deps without checking existing ones first"). The `diff` package is ~30KB, single-purpose, MIT-licensed, and battle-tested. **Decision: add `diff` as a dep** if no existing dep covers it. (`@clack/prompts`, `kleur`, `mri` — none do.)

### D6. Resolution mode is per-invocation only

"Replace all" / "Skip all" affect only the current `aikit sync` command. They do NOT persist to `.aikitrc.json`. The user re-grants per-invocation trust each time.

## CLI surface changes (touched files)

- `src/commands/sync.ts` — refactor `copyAction` signature; collect conflicts post-loop; pre-write prompt loop.
- `src/fs/conflict.ts` (NEW) — `resolveConflict()` helper using `@clack/prompts.select`. Returns `{ action: "replace" | "keep" | "replace_all" | "skip_all" }`.
- `src/fs/diff.ts` (NEW) — small wrapper around the `diff` package for colorized inline display.
- `src/types.ts` — possibly add `ConflictResolution` type if the helper's return type is used in multiple places.
- `package.json` — add `diff` dependency.

## Testing

- **`test/copy-action-conflict.test.ts`** — `copyAction` returns `"conflict"` when content differs; `"updated"` when `force: true`.
- **`test/resolve-conflict.test.ts`** — pure-function tests for the resolver: given a stub TTY input, returns the right action. Use a mockable `prompt()` interface so we don't shell into actual TTY.
- **`test/sync-conflict-headless.test.ts`** — non-TTY mode: conflicts skipped, warning printed, exit 0.
- **`test/sync-conflict-keep-tier3.test.ts`** — when "Keep" is chosen for an agent file, `.aikitrc.json` gets updated `agents.tier3: [name]`.

## Rollout

- Version bump: `0.6.0` → `0.7.0` (minor, feature add, no breaking changes).
- `CHANGELOG.md` 0.7.0 entry under `### Added`:
  - Interactive conflict resolution during `aikit sync` and `aikit update`.
  - "Keep + tier3" auto-config update for agents and skills.
- New `docs/conflict-resolution.md` walkthrough (or update `docs/agents.md` with a section).
- Update README with a one-line note about the new behavior.

## Risks

| # | Risk | Mitigation |
|---|---|---|
| R1 | Catalog updates trigger conflict prompts for files the user never modified (no manifest tracking) | Document the limitation prominently; add manifest tracking in 0.8.0 if real-world feedback demands it. |
| R2 | Headless `aikit update` in CI suddenly prompts and hangs | TTY check + explicit `--yes` + non-TTY all bypass the prompt. CI tests cover all three. |
| R3 | "Keep + tier3" silently corrupts `.aikitrc.json` if the file is mid-write during ctrl-c | Buffer changes in memory; write-on-completion only. Atomic file write via temp file + rename. |
| R4 | Adding `diff` package introduces supply-chain risk | `diff` is widely used (~50M weekly downloads), MIT-licensed, single-purpose. Reasonable. Pin to exact version. |
| R5 | "Show diff first" output is too long for terminal | Acceptable for v1 — user can re-run with `--force` if needed. Pager support is future work. |

## Open questions

None — all resolved during conversational design.

## Out of scope (future work)

- **Manifest tracking** (`.aikit/manifest.json`) — record per-file content hash at install time, distinguish "user modified" from "stale relative to new catalog" — eliminates R1 noise. Plausible for 0.8.0.
- **3-way merge** — full conflict resolution like `git merge --tool`. Out of scope; the manifest + diff path covers most actual cases.
- **External pager support** — pipe diff to `less` / `bat` if `$PAGER` is set. Nice-to-have.
- **Conflict resolution for markered files** — extending the same UX to AGENTS.md (currently `safeWrite` reports conflict but never prompts).
- **Persistent "always replace" preference** — a flag in `.aikitrc.json` that says "I trust you, never prompt". Convenience for power users.
