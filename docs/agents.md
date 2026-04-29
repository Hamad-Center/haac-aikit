# Agents

`haac-aikit` ships **19 agents** organised into two tiers, mirroring the skills system.

## Tier model

| Tier | Behaviour | When to use |
|---|---|---|
| **tier1** | Always installed by `aikit init` and `aikit sync`. The "core team" every project needs. | Process roles (orchestrator, planner, researcher, implementer, reviewer, tester) plus security-auditor, devops, debugger, and pr-describer. |
| **tier2** | Opt-in. Two routes: shape-driven (e.g., shape `web` → `frontend`) or wizard multi-select. | Domain specialists (frontend, backend, mobile) and specialty agents (flake-hunter, simplifier, prompt-engineer, evals-author, changelog-curator, dependency-upgrader). |
| **tier3** | User-authored. `aikit sync` never touches these. | Custom agents that live in `.claude/agents/` and are tracked in `.aikitrc.json`'s `agents.tier3` list. |

The catalog layout is `catalog/agents/tier1/<name>.md` and `catalog/agents/tier2/<name>.md`. **Directory location is the tier** — there is no frontmatter `tier:` field. Promote/demote by `git mv`.

## Roster (default model assignment)

The model field in each agent's frontmatter follows the principle: *Does the cost of being wrong justify the upgrade?*

| Agent | Tier | Model | Why this model |
|---|---|---|---|
| orchestrator | 1 | sonnet-4-6 | Routing reasoning; haiku misroutes subtle tasks. |
| planner | 1 | opus-4-7 | Bad plan invalidates downstream work. |
| researcher | 1 | haiku-4-5 | Read-only exploration + summarization. Highest-volume agent. |
| implementer | 1 | sonnet-4-6 | Writes code under plan constraint; tests verify. |
| reviewer | 1 | opus-4-7 | Missed bugs ship. |
| tester | 1 | sonnet-4-6 | Writes test code; suite verifies. |
| security-auditor | 1 | opus-4-7 | OWASP misses ship vulns. |
| devops | 1 | sonnet-4-6 | YAML config has subtle traps. |
| debugger | 1 | sonnet-4-6 | Has Bash/Read/Grep — verifies via test runs. |
| pr-describer | 1 | haiku-4-5 | Diff → title + body. Fires every PR. |
| frontend | 2 | sonnet-4-6 | Component code with a11y/perf judgment. |
| backend | 2 | sonnet-4-6 | API/schema/auth code. |
| mobile | 2 | sonnet-4-6 | RN/Flutter platform-specific code. |
| flake-hunter | 2 | sonnet-4-6 | Diagnoses race/timing; verifies via re-runs. |
| simplifier | 2 | sonnet-4-6 | Refactors with judgment; tests verify. |
| prompt-engineer | 2 | opus-4-7 | Bad prompts silently regress quality — hardest failure mode to detect. |
| evals-author | 2 | sonnet-4-6 | Generates eval datasets; runs verify. |
| changelog-curator | 2 | haiku-4-5 | `git log` → markdown. Pure summarization. |
| dependency-upgrader | 2 | sonnet-4-6 | Runs codemods; verifies via build/test. |

**Distribution:** 4 opus / 12 sonnet / 3 haiku. The haiku agents (researcher, pr-describer, changelog-curator) are pure read-only or summarization roles where cheap-and-fast wins.

## Configuration

`.aikitrc.json` carries an optional `agents` block:

```json
{
  "agents": {
    "tier1": "all",
    "tier2": ["simplifier", "prompt-engineer"],
    "tier3": ["my-custom-agent"]
  }
}
```

- `tier1: "all"` — install every tier1 agent (the only sensible value; explicit string array also works).
- `tier2: "all" | string[]` — `"all"` installs every tier2; an array installs only listed names. Shape-derived names (frontend/backend/mobile) are added automatically based on `shape:`.
- `tier3: string[]` — names of user-authored agents `aikit sync` should leave alone.

When the `agents` block is absent, the loader defaults to `{ tier1: "all", tier2: <shape-derived>, tier3: [] }`. Existing 0.5.x configs sync no-op.

## Wizard flow

1. Project shape prompt (existing) sets `shape:`, which triggers shape-derived tier2 agents.
2. Specialty multi-select (new) lists the 6 non-shape tier2 agents:
   - flake-hunter, simplifier, prompt-engineer, evals-author, changelog-curator, dependency-upgrader
3. Headless `--yes` defaults: `minimal`/`standard` install no specialty agents; `everything` installs all six.

## Adding a new agent

1. Decide tier:
   - **tier1** if every project should have it on by default.
   - **tier2** otherwise.
2. Create `catalog/agents/<tier>/<name>.md` with frontmatter:
   ```yaml
   ---
   name: <name>
   description: <one-line — include "use this instead of X when…" if it overlaps with another agent>
   model: <claude-haiku-4-5 | claude-sonnet-4-6 | claude-opus-4-7>
   tools:
     - <tool>
   ---
   ```
3. Run `npm run catalog:check`.
4. Add a row to the table above.
