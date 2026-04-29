# Tiered agents roster — design spec

- **Date:** 2026-04-29
- **Status:** Draft (awaiting implementation)
- **Author:** Claude (with Mersall)
- **Target version:** 0.6.0

## Context

`haac-aikit` ships 11 agents in a flat `catalog/agents/` directory. Installation is governed by two hardcoded lists in `src/commands/sync.ts`: `CORE_AGENTS` (always installed) and `SHAPE_AGENTS` (installed conditionally based on `projectShape`). The skills system already uses a tiered, directory-based layout (`catalog/skills/tier1/`, `tier2/`).

Two pressures motivate this change:

1. **Roster growth.** The catalog needs more agents to fill obvious gaps (investigation, DX, AI-native, refactor/migration). Adding 6–8 to the flat directory crowds the `subagent_type` picker and increases the orchestrator's chance of misrouting.
2. **Convention drift.** Skills already use directory-based tiers. Agents using a separate hardcoded mechanism is inconsistent and harder to evolve.

## Goals

- Mirror the skills tier system for agents: `catalog/agents/tier1/` (always-on) and `catalog/agents/tier2/` (opt-in).
- Add 8 new agents that fill the gaps highlighted in brainstorming (debugger, pr-describer, flake-hunter, simplifier, prompt-engineer, evals-author, changelog-curator, dependency-upgrader).
- Apply 2026 token-efficiency principles to model assignment across all 19 agents (introduce haiku for read-only / summarization roles).
- Preserve current default install behavior for existing users — sync remains a no-op for repos already on 0.5.x.

## Non-goals

- No frontmatter `tier:` field. Directory location is the tier (matches skills).
- No new tier3 mechanism beyond mirroring skills (user-authored agents land in `agents.tier3` config, sync leaves them alone).
- No restructuring of the existing 11 agents' content. Only their location changes.
- No data/ML agents (deferred — not in user's accepted scope).

## Decisions

### D1. Tier assignment

| Tier | Behavior | Members (after change) |
|---|---|---|
| **tier1** | Always installed by `init` and `sync`. The "core team". | orchestrator, planner, researcher, implementer, reviewer, tester, security-auditor, devops, **debugger** (new), **pr-describer** (new) |
| **tier2** | Opt-in. Two routes: shape-driven (e.g., `web` → `frontend`) or wizard multi-select. | frontend, backend, mobile, **flake-hunter** (new), **simplifier** (new), **prompt-engineer** (new), **evals-author** (new), **changelog-curator** (new), **dependency-upgrader** (new) |
| **tier3** | User-authored. Sync never touches. | (empty by default) |

**Total: 19 agents** (10 tier1 + 9 tier2). Default install for a fullstack project: 12 agents (10 tier1 + frontend + backend).

### D2. Model assignment

Principle: *Does the cost of being wrong justify the upgrade?* Wrong plans, missed bugs, and silent prompt regressions justify opus. Verifiable work (writes code, runs tests) is fine on sonnet. Pure read/summarize work moves to haiku.

| # | Agent | Tier | Model | Δ from current | Rationale |
|---|---|---|---|---|---|
| 1 | orchestrator | 1 | sonnet-4-6 | unchanged | Routing reasoning; haiku misroutes subtle tasks. |
| 2 | planner | 1 | opus-4-7 | unchanged | Bad plan invalidates downstream work. |
| 3 | researcher | 1 | **haiku-4-5** | ⬇ from sonnet | Read-only exploration + summarization. Highest-volume agent — biggest single saving. |
| 4 | implementer | 1 | sonnet-4-6 | unchanged | Writes code under plan constraint; tests verify. |
| 5 | reviewer | 1 | opus-4-7 | unchanged | Missed bugs ship. |
| 6 | tester | 1 | sonnet-4-6 | unchanged | Writes test code; suite verifies. |
| 7 | security-auditor | 1 | opus-4-7 | unchanged | OWASP misses ship vulns. |
| 8 | devops | 1 | sonnet-4-6 | unchanged | YAML config has subtle traps. |
| 9 | **debugger** | 1 | sonnet-4-6 | NEW | Has Bash/Read/Grep — verifies via test runs. |
| 10 | **pr-describer** | 1 | **haiku-4-5** | NEW | Diff → title + body. Fires every PR. |
| 11 | frontend | 2 | sonnet-4-6 | unchanged | Component code with a11y/perf judgment. |
| 12 | backend | 2 | sonnet-4-6 | unchanged | API/schema/auth code. |
| 13 | mobile | 2 | sonnet-4-6 | unchanged | RN/Flutter platform-specific code. |
| 14 | **flake-hunter** | 2 | sonnet-4-6 | NEW | Diagnoses race/timing; verifies via re-runs. |
| 15 | **simplifier** | 2 | sonnet-4-6 | NEW | Refactors with judgment; tests verify. |
| 16 | **prompt-engineer** | 2 | opus-4-7 | NEW | Bad prompts silently regress quality. |
| 17 | **evals-author** | 2 | sonnet-4-6 | NEW | Generates eval datasets; runs verify. |
| 18 | **changelog-curator** | 2 | **haiku-4-5** | NEW | `git log` → markdown. Pure summarization. |
| 19 | **dependency-upgrader** | 2 | sonnet-4-6 | NEW | Runs codemods; verifies via build/test. |

**Distribution:** 4 opus / 12 sonnet / 3 haiku — vs. today's 3 opus / 8 sonnet / 0 haiku.

### D3. The 8 new agents (one-line specs)

- **debugger** (tier1, sonnet) — Reproduce a failing scenario, isolate the minimal cause, propose a fix path. Reads code + runs tests; never edits. Tools: Read, Grep, Glob, Bash.
- **pr-describer** (tier1, haiku) — Read `git diff` against base, output a conventional-commit-styled PR title (≤70 chars) and Summary + Test Plan body. Tools: Read, Bash.
- **flake-hunter** (tier2, sonnet) — Identify intermittent test failures, reproduce via repeated runs, classify root cause (race, env, order-dependent), recommend quarantine or fix. Tools: Read, Grep, Glob, Bash.
- **simplifier** (tier2, sonnet) — Find DRY violations, dead exports, over-abstraction. Proposes diffs with before/after; verifies tests still pass. Tools: Read, Edit, Grep, Glob, Bash.
- **prompt-engineer** (tier2, opus) — Author or optimize prompts; runs A/B comparisons against an eval set if one exists; documents the rationale. Tools: Read, Edit, Write, Grep, Bash.
- **evals-author** (tier2, sonnet) — Build eval datasets (golden examples, edge cases, regressions) and a runner; reports pass-rate deltas across prompt or model changes. Tools: Read, Edit, Write, Grep, Bash.
- **changelog-curator** (tier2, haiku) — Read commits since last tag, group by conventional-commit type, write `CHANGELOG.md` entry following Keep-a-Changelog format. Tools: Read, Edit, Bash.
- **dependency-upgrader** (tier2, sonnet) — Audit `package.json` for major-version bumps, run codemods (e.g., `next`, `react`, vendor-shipped), verify build/test, write migration notes. Tools: Read, Edit, Write, Grep, Bash.

All 8 follow the existing handoff format (`[agent] → [next] / Status: DONE | DONE_WITH_CONCERNS`).

### D4. Catalog layout

```
catalog/agents/
├── tier1/
│   ├── orchestrator.md
│   ├── planner.md
│   ├── researcher.md
│   ├── implementer.md
│   ├── reviewer.md
│   ├── tester.md
│   ├── security-auditor.md
│   ├── devops.md
│   ├── debugger.md          (new)
│   └── pr-describer.md      (new)
└── tier2/
    ├── frontend.md
    ├── backend.md
    ├── mobile.md
    ├── flake-hunter.md       (new)
    ├── simplifier.md         (new)
    ├── prompt-engineer.md    (new)
    ├── evals-author.md       (new)
    ├── changelog-curator.md  (new)
    └── dependency-upgrader.md (new)
```

Migration: `git mv` existing 11 files into the appropriate tier subdirectory.

Sync output destination remains **flat** (`.claude/agents/foo.md`) — only the catalog source has subdirs.

### D5. Config schema

Add a sibling to the existing `skills:` block on `AikitConfig`:

```ts
export type AgentTier = "tier1" | "tier2" | "tier3";

export interface AikitConfig {
  // ... existing ...
  skills:  { tier1: "all" | string[]; tier2: "all" | string[]; tier3: string[] };
  agents:  { tier1: "all" | string[]; tier2: "all" | string[]; tier3: string[] }; // NEW
}
```

**Backwards-compat:** when `agents:` is absent (existing 0.5.x configs), the loader returns `{ tier1: "all", tier2: <derived from shape>, tier3: [] }`. Existing installs sync no-op.

### D6. Sync logic

Replace the hardcoded `CORE_AGENTS` list at `src/commands/sync.ts:200` with a directory walk that mirrors `syncSkills()`:

```ts
function syncAgents(config: AikitConfig, dryRun: boolean): WriteResult[] {
  const results: WriteResult[] = [];
  results.push(...syncAgentTier("tier1", config.agents?.tier1 ?? "all", dryRun));
  results.push(...syncAgentTier("tier2", resolveTier2Set(config), dryRun));
  return results;
}
```

`resolveTier2Set()` returns:
- `"all"` if `config.agents?.tier2 === "all"` (passes through; sync writes every tier2 agent).
- Otherwise, the union of:
  1. Shape-derived names (`web` → `frontend`, `mobile` → `mobile`, `fullstack` → `frontend` + `backend`, `library` → `backend`).
  2. Explicit user opt-in from `config.agents.tier2` (string array).

`SHAPE_AGENTS` mapping moves from sync.ts to a small constants module so it's testable independently.

### D7. Wizard UX

After the existing project-shape prompt, add one new step:

```
Include specialty agents?  (debugger and pr-describer always installed)
[ ] flake-hunter        — Diagnose intermittent test failures
[ ] simplifier          — DRY, dead code, complexity reduction
[ ] prompt-engineer     — Author/optimize prompts
[ ] evals-author        — Eval datasets & benchmarks
[ ] changelog-curator   — Generate CHANGELOG from commits
[ ] dependency-upgrader — npm major bumps + codemods
```

`frontend`, `backend`, and `mobile` are deliberately omitted from this multi-select — they're added automatically via the shape prompt, so listing them here would let the user create an inconsistent state.

**Headless / `--yes` defaults by scope:**
- `minimal`, `standard` → none of the specialty agents (only shape-specialists).
- `everything` → all six.

### D8. Conflict resolution

- Catalog-shipped name (tier1 or tier2) wins over a user-authored tier3 with the same name. Same as skills.
- Same name in both tier1 and tier2 = `catalog:check` failure.

## CLI surface changes (touched files)

- `src/types.ts` — add `AgentTier`, extend `AikitConfig` with `agents:` field.
- `src/commands/sync.ts` — replace hardcoded `CORE_AGENTS` with tier-directory walk; extract `SHAPE_AGENTS` to a constants module.
- `src/commands/init.ts:101` — set default `agents: { tier1: "all", tier2: "all", tier3: [] }` (alongside skills).
- `src/commands/list.ts:14` — add `Agents — Tier 1` and `Agents — Tier 2` rows.
- `src/commands/diff.ts:39` — check both `agents/tier1` and `agents/tier2`.
- `src/commands/add.ts:158` — `detectAgentTier()` mirrors `detectSkillTier()`; user-authored agents land in `agents.tier3`.
- `src/wizard.ts` — add specialty-agent multi-select step; honor scope-based `--yes` defaults.
- `scripts/catalog-check.js` — assert tier dirs exist, reject same-name collisions across tiers, reject `.md` files at the catalog root of `agents/`.
- File moves: `git mv` 11 existing agents into `tier1/` and `tier2/` per the table above.

## Testing

- **`test/sync-agents.test.ts`** — migration safety (old config syncs identically to current), tier1 "all", tier2 explicit + shape-merge, tier2 "all", tier3 untouched.
- **`test/wizard-agents.test.ts`** — `--yes minimal` → tier2 = shape-only; `--yes everything` → tier2 = "all"; interactive multi-select stores selection.
- **`test/catalog-check.test.ts`** — extend existing check: both tier dirs non-empty, no name collision, every agent has parseable frontmatter (`name`, `description`, `model`, `tools`).
- **`test/types-config.test.ts`** — existing `.aikitrc.json` fixtures still validate after schema extension.

## Rollout

- Version bump: `0.5.0` → `0.6.0` (minor, feature add, no breaking changes).
- `CHANGELOG.md` under `### Added`:
  - Tiered agent system (`catalog/agents/tier1/`, `tier2/`).
  - 8 new agents.
  - Token-efficient model assignments (haiku for read-only / summarization agents).
- New `docs/agents.md` — tier overview, model rationale, the table from D2.
- Update `docs/README.md` index.
- Update root `AGENTS.md` (the "Project layout" line and the "Tier system" gotcha to mention agents in addition to skills).
- Update README "What changes after you install it" section.

## Risks

| # | Risk | Mitigation |
|---|---|---|
| R1 | Wizard prompt fatigue | Single multi-select (not 6 yes/no prompts). Skipped under `--yes`. |
| R2 | Catalog drift — agent added to `catalog/agents/` root instead of a tier dir | `catalog:check` fails when it finds `.md` outside a known tier dir. |
| R3 | haiku-4-5 unavailable in user environment | Same risk as opus today; acceptable. Documented in `docs/agents.md`. |
| R4 | Orchestrator misroutes between similar agents (e.g., `debugger` vs `researcher`, `simplifier` vs `reviewer`) | Each new agent's frontmatter `description:` includes an explicit "use this instead of X when…" disambiguator. |
| R5 | User has customized one of our 11 agents in `.claude/agents/foo.md` | Same as today — sync overwrites flat-named files. No new risk introduced by tier change. |

## Open questions

None — all resolved during brainstorming.

## Out of scope (future work)

- Data/ML agents (`data-engineer`, `ml-engineer`, `analytics-sql`).
- Niche investigation agents (`perf-profiler`, `incident-responder`).
- Onboarding agents (`onboarder`, `architecture-mapper`).
- A `tool-auditor` for MCP/SDK builders.
- Agent-tier auto-promotion based on telemetry (`aikit learn` could surface "tier2 X is invoked in 80% of your sessions, promote to tier1?").
