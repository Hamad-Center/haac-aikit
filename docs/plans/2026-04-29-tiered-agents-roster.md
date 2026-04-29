# Tiered Agents Roster Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mirror the skills tier system on agents — restructure `catalog/agents/` into `tier1/` and `tier2/` subdirectories, ship 8 new agents (debugger, pr-describer, flake-hunter, simplifier, prompt-engineer, evals-author, changelog-curator, dependency-upgrader), and apply 2026 token-efficient model assignments (3 haiku, 4 opus, 12 sonnet).

**Architecture:** Directory location IS the tier (no frontmatter `tier:` field), matching `catalog/skills/`. Replace the hardcoded `CORE_AGENTS` list in `src/commands/sync.ts:200` with directory walks. Add an optional `agents: { tier1, tier2, tier3 }` field on `AikitConfig`. New wizard step lets users multi-select 6 specialty tier2 agents (frontend/backend/mobile remain shape-driven and are not in the new picker).

**Tech Stack:** TypeScript 5 (strict), vitest, tsup (ESM bundle), `@clack/prompts` (wizard).

**Spec:** [`docs/specs/2026-04-29-tiered-agents-roster.md`](../specs/2026-04-29-tiered-agents-roster.md)

---

## File structure (created / modified)

**Catalog moves (11 files):**
- `catalog/agents/{orchestrator,planner,researcher,implementer,reviewer,tester,security-auditor,devops}.md` → `catalog/agents/tier1/`
- `catalog/agents/{frontend,backend,mobile}.md` → `catalog/agents/tier2/`

**Catalog new files (8 agents):**
- `catalog/agents/tier1/debugger.md`
- `catalog/agents/tier1/pr-describer.md`
- `catalog/agents/tier2/flake-hunter.md`
- `catalog/agents/tier2/simplifier.md`
- `catalog/agents/tier2/prompt-engineer.md`
- `catalog/agents/tier2/evals-author.md`
- `catalog/agents/tier2/changelog-curator.md`
- `catalog/agents/tier2/dependency-upgrader.md`

**Source new files:**
- `src/catalog/shape-agents.ts` — extracted SHAPE_AGENTS map (testable in isolation)

**Source modified:**
- `src/types.ts` — add `AgentTier` and optional `agents` field on `AikitConfig`
- `src/commands/sync.ts` — replace hardcoded `CORE_AGENTS` with tier directory walk
- `src/commands/init.ts` — set default `agents` config alongside `skills`
- `src/commands/list.ts` — add Tier 1 / Tier 2 agent rows
- `src/commands/diff.ts` — check both tier directories
- `src/commands/add.ts` — add `detectAgentTier()` mirroring `detectSkillTier()`
- `src/wizard.ts` — add specialty multi-select step
- `scripts/catalog-check.js` — assert tier dirs, reject collisions, reject `.md` at agents root

**Tests new:**
- `test/sync-agents.test.ts` — sync behavior across config shapes

**Tests modified:**
- `test/add.test.ts` — extend with agent-tier detection (if exists; else covered by sync-agents)

**Docs new:**
- `docs/agents.md` — tier system overview, model rationale, full table

**Docs modified:**
- `docs/README.md` — add `agents.md` to index
- `AGENTS.md` — update Project layout reference for `catalog/agents/`
- `README.md` — update "What changes after you install it" mention of specialty agents

**Repo metadata:**
- `package.json` — version `0.5.0` → `0.6.0`
- `CHANGELOG.md` — new `## 0.6.0` section

---

### Task 1: Add `AgentTier` type and optional `agents` field

**Files:**
- Modify: `src/types.ts:25` (add new type) and `src/types.ts:46-50` (add field on AikitConfig)

- [ ] **Step 1: Edit `src/types.ts`**

Replace the `SkillTier` line with both type aliases, and add the `agents` field after `skills` on `AikitConfig`. The full updated section:

```ts
export type SkillTier = "tier1" | "tier2" | "tier3";
export type AgentTier = "tier1" | "tier2" | "tier3";

export interface AikitConfig {
  $schema?: string;
  version: 1;
  projectName: string;
  projectDescription?: string;
  tools: Tool[];
  scope: Scope;
  shape: ProjectShape[];
  integrations: {
    mcp: boolean;
    hooks: boolean;
    commands: boolean;
    subagents: boolean;
    ci: boolean;
    husky: boolean;
    devcontainer?: boolean;
    plugin?: boolean;
    otel?: boolean;
  };
  skills: {
    tier1: "all" | string[];
    tier2: "all" | string[];
    tier3: string[];
  };
  agents?: {
    tier1: "all" | string[];
    tier2: "all" | string[];
    tier3: string[];
  };
  canonical: "AGENTS.md";
}
```

The `agents` field is optional so existing `.aikitrc.json` files (which lack it) keep validating.

- [ ] **Step 2: Run typecheck to verify**

Run: `npm run typecheck`
Expected: `tsc --noEmit` exits 0 with no errors. Existing tests' `baseConfig` literal does not have `agents`, which is fine because the field is optional.

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat(types): add AgentTier and optional agents config field"
```

---

### Task 2: Extract SHAPE_AGENTS to a constants module

**Files:**
- Create: `src/catalog/shape-agents.ts`
- Modify: `src/commands/sync.ts:201-207` (remove the inline literal; import from new module)

- [ ] **Step 1: Write the failing test**

Create `test/shape-agents.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { resolveShapeAgents, SHAPE_AGENTS } from "../src/catalog/shape-agents.js";

describe("shape-agents", () => {
  it("maps each known shape to a fixed agent list", () => {
    expect(SHAPE_AGENTS.web).toEqual(["frontend"]);
    expect(SHAPE_AGENTS.fullstack).toEqual(["frontend", "backend"]);
    expect(SHAPE_AGENTS.backend).toEqual(["backend"]);
    expect(SHAPE_AGENTS.mobile).toEqual(["mobile"]);
    expect(SHAPE_AGENTS.library).toEqual(["backend"]);
  });

  it("resolveShapeAgents returns the union for multiple shapes (deduped)", () => {
    const result = resolveShapeAgents(["web", "backend"]);
    expect(result.sort()).toEqual(["backend", "frontend"]);
  });

  it("resolveShapeAgents returns [] for unknown shapes", () => {
    const result = resolveShapeAgents(["unknown-shape"] as never);
    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run test/shape-agents.test.ts`
Expected: FAIL with "Cannot find module '../src/catalog/shape-agents.js'".

- [ ] **Step 3: Create `src/catalog/shape-agents.ts`**

```ts
import type { ProjectShape } from "../types.js";

export const SHAPE_AGENTS: Record<ProjectShape, string[]> = {
  web: ["frontend"],
  fullstack: ["frontend", "backend"],
  backend: ["backend"],
  mobile: ["mobile"],
  library: ["backend"],
};

export function resolveShapeAgents(shapes: ProjectShape[]): string[] {
  const set = new Set<string>();
  for (const shape of shapes) {
    for (const agent of SHAPE_AGENTS[shape] ?? []) {
      set.add(agent);
    }
  }
  return Array.from(set);
}
```

- [ ] **Step 4: Update `src/commands/sync.ts` to import from the new module**

In `src/commands/sync.ts`, remove the inline `SHAPE_AGENTS` literal (currently lines 201-207). Add at the top of the file:

```ts
import { SHAPE_AGENTS } from "../catalog/shape-agents.js";
```

The remaining `syncAgents` function still works — it references `SHAPE_AGENTS[shape]` exactly the same way.

- [ ] **Step 5: Run the test and the existing sync test**

Run: `npx vitest run test/shape-agents.test.ts test/sync-claude.test.ts`
Expected: PASS — 4 tests in shape-agents, plus the existing sync-claude tests still pass.

- [ ] **Step 6: Commit**

```bash
git add src/catalog/shape-agents.ts src/commands/sync.ts test/shape-agents.test.ts
git commit -m "refactor(catalog): extract SHAPE_AGENTS to constants module"
```

---

### Task 3: Move existing 11 agents into tier subdirectories AND refactor sync

These two changes must happen in the same commit because `syncAgents()` will fail to find the agents otherwise. Order matters within the task.

**Files:**
- Move: 11 files via `git mv` (8 to `catalog/agents/tier1/`, 3 to `catalog/agents/tier2/`)
- Modify: `src/commands/sync.ts` — replace the body of `syncAgents()` with a tier-aware version

- [ ] **Step 1: Create the tier directories and move 11 agents**

```bash
mkdir -p catalog/agents/tier1 catalog/agents/tier2
git mv catalog/agents/orchestrator.md     catalog/agents/tier1/
git mv catalog/agents/planner.md          catalog/agents/tier1/
git mv catalog/agents/researcher.md       catalog/agents/tier1/
git mv catalog/agents/implementer.md      catalog/agents/tier1/
git mv catalog/agents/reviewer.md         catalog/agents/tier1/
git mv catalog/agents/tester.md           catalog/agents/tier1/
git mv catalog/agents/security-auditor.md catalog/agents/tier1/
git mv catalog/agents/devops.md           catalog/agents/tier1/
git mv catalog/agents/frontend.md         catalog/agents/tier2/
git mv catalog/agents/backend.md          catalog/agents/tier2/
git mv catalog/agents/mobile.md           catalog/agents/tier2/
```

Verify with `ls catalog/agents/tier1 catalog/agents/tier2` — tier1 has 8 files, tier2 has 3 files, and `catalog/agents/` itself has only the two subdirs.

- [ ] **Step 2: Replace the body of `syncAgents()` in `src/commands/sync.ts`**

Find the existing `syncAgents()` function (around line 193) and replace it entirely with:

```ts
function syncAgents(config: AikitConfig, dryRun: boolean): WriteResult[] {
  const results: WriteResult[] = [];
  results.push(...syncAgentTier("tier1", config.agents?.tier1 ?? "all", dryRun));
  results.push(...syncAgentTier("tier2", resolveTier2Set(config), dryRun));
  return results;
}

function resolveTier2Set(config: AikitConfig): "all" | string[] {
  if (config.agents?.tier2 === "all") return "all";

  const set = new Set<string>(
    Array.isArray(config.agents?.tier2) ? config.agents.tier2 : []
  );
  for (const agent of resolveShapeAgents(config.shape)) {
    set.add(agent);
  }
  return Array.from(set);
}

function syncAgentTier(
  tier: "tier1" | "tier2",
  selection: "all" | string[],
  dryRun: boolean,
): WriteResult[] {
  const srcDir = join(CATALOG_ROOT, "agents", tier);
  const destDir = ".claude/agents";
  const results: WriteResult[] = [];

  if (!existsSync(srcDir)) return results;

  const allAgents = readdirSync(srcDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));

  const agentsToInstall =
    selection === "all" ? allAgents : allAgents.filter((a) => selection.includes(a));

  if (!dryRun) mkdirSync(destDir, { recursive: true });

  for (const agent of agentsToInstall) {
    const src = join(srcDir, `${agent}.md`);
    const dest = join(destDir, `${agent}.md`);
    results.push(copyAction(src, dest, dryRun));
  }
  return results;
}
```

Add `readdirSync` to the existing `node:fs` import at the top of the file. Also add the import:

```ts
import { resolveShapeAgents } from "../catalog/shape-agents.js";
```

Update the existing `syncAgents` call site (search for `syncAgents(config.shape,` in the same file) to pass the full config:

```ts
if (config.integrations.subagents) {
  results.push(...syncAgents(config, dryRun));
}
```

Remove the now-unused `SHAPE_AGENTS` import if it's no longer referenced elsewhere in `sync.ts` (the new code uses `resolveShapeAgents` from the constants module).

- [ ] **Step 3: Run the existing test suite to verify nothing regressed**

Run: `npm test`
Expected: All existing tests pass. Default config (no `agents:` field) installs every tier1 agent + shape-derived tier2 agents (e.g., shape `library` → `backend`).

- [ ] **Step 4: Run typecheck**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 5: Run catalog-check**

Run: `npm run catalog:check`
Expected: passes (we update the script in Task 11; for now the existing version still finds the agents under the new paths because it likely globs `.md` recursively, but if it fails here the failure is informative).

If catalog-check fails because of the move, defer to Task 11 and force-pass with `--no-verify` skipped — instead, note the failure and continue. The test suite is the canonical signal for this task.

- [ ] **Step 6: Commit**

```bash
git add catalog/agents src/commands/sync.ts
git commit -m "refactor(agents): move 11 agents into tier1/tier2 dirs; tier-aware sync"
```

---

### Task 4: Add sync-agents tests covering tier behavior

**Files:**
- Create: `test/sync-agents.test.ts`

- [ ] **Step 1: Write the test file**

Create `test/sync-agents.test.ts`:

```ts
import { existsSync, mkdtempSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runSync } from "../src/commands/sync.js";
import type { AikitConfig } from "../src/types.js";

let tmpDir: string;
let origCwd: string;

const baseConfig: AikitConfig = {
  version: 1,
  projectName: "demo",
  projectDescription: "demo",
  tools: ["claude"],
  scope: "standard",
  shape: ["library"],
  integrations: {
    mcp: false, hooks: false, commands: false, subagents: true,
    ci: false, husky: false, devcontainer: false, plugin: false, otel: false,
  },
  skills: { tier1: "all", tier2: "all", tier3: [] },
  canonical: "AGENTS.md",
};

function writeConfig(cfg: AikitConfig): void {
  writeFileSync(".aikitrc.json", JSON.stringify(cfg, null, 2));
}

function listAgents(): string[] {
  if (!existsSync(".claude/agents")) return [];
  return readdirSync(".claude/agents").filter((f) => f.endsWith(".md")).sort();
}

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "haac-sync-agents-"));
  origCwd = process.cwd();
  process.chdir(tmpDir);
});

afterEach(() => {
  process.chdir(origCwd);
});

describe("sync — agents tier system", () => {
  it("installs all tier1 agents by default (config without agents field)", async () => {
    writeConfig(baseConfig);
    await runSync({ _: ["sync"] });

    const agents = listAgents();
    expect(agents).toContain("orchestrator.md");
    expect(agents).toContain("planner.md");
    expect(agents).toContain("researcher.md");
    expect(agents).toContain("implementer.md");
    expect(agents).toContain("reviewer.md");
    expect(agents).toContain("tester.md");
    expect(agents).toContain("security-auditor.md");
    expect(agents).toContain("devops.md");
  });

  it("installs shape-derived tier2 agents (library → backend)", async () => {
    writeConfig({ ...baseConfig, shape: ["library"] });
    await runSync({ _: ["sync"] });

    expect(listAgents()).toContain("backend.md");
    expect(listAgents()).not.toContain("frontend.md");
  });

  it("installs explicit tier2 opt-ins alongside shape-derived ones", async () => {
    writeConfig({
      ...baseConfig,
      shape: ["web"],
      agents: { tier1: "all", tier2: ["simplifier"], tier3: [] },
    });
    await runSync({ _: ["sync"] });

    const agents = listAgents();
    expect(agents).toContain("frontend.md"); // shape-derived
    expect(agents).toContain("simplifier.md"); // explicit
    expect(agents).not.toContain("prompt-engineer.md"); // not selected
  });

  it("installs every tier2 agent when agents.tier2 is 'all'", async () => {
    writeConfig({
      ...baseConfig,
      shape: ["fullstack"],
      agents: { tier1: "all", tier2: "all", tier3: [] },
    });
    await runSync({ _: ["sync"] });

    const agents = listAgents();
    expect(agents).toContain("frontend.md");
    expect(agents).toContain("backend.md");
    expect(agents).toContain("mobile.md");
  });

  it("does not write agents when integrations.subagents is false", async () => {
    writeConfig({
      ...baseConfig,
      integrations: { ...baseConfig.integrations, subagents: false },
    });
    await runSync({ _: ["sync"] });

    expect(existsSync(".claude/agents")).toBe(false);
  });
});
```

- [ ] **Step 2: Run the new tests**

Run: `npx vitest run test/sync-agents.test.ts`
Expected: All 5 tests pass. The first test ("default config without `agents:` field") proves migration safety.

- [ ] **Step 3: Run the full suite**

Run: `npm test`
Expected: All tests pass (pre-existing + 5 new).

- [ ] **Step 4: Commit**

```bash
git add test/sync-agents.test.ts
git commit -m "test(sync): cover tier1/tier2/shape-merge/all/disabled agent paths"
```

---

### Task 5: Downgrade `researcher` model to haiku-4-5

**Files:**
- Modify: `catalog/agents/tier1/researcher.md` (frontmatter only)

- [ ] **Step 1: Edit the model line**

In `catalog/agents/tier1/researcher.md`, change:

```yaml
model: claude-sonnet-4-6
```

to:

```yaml
model: claude-haiku-4-5
```

Leave the rest of the file untouched.

- [ ] **Step 2: Run catalog-check**

Run: `npm run catalog:check`
Expected: passes (or fails identically to before — Task 11 stabilizes this).

- [ ] **Step 3: Commit**

```bash
git add catalog/agents/tier1/researcher.md
git commit -m "perf(agents): downgrade researcher to haiku-4-5 (read-only role)"
```

---

### Task 6: Set default `agents` config in `init`

**Files:**
- Modify: `src/commands/init.ts:101`

- [ ] **Step 1: Add `agents` to the default config block**

Find the line:

```ts
skills: { tier1: "all", tier2: "all", tier3: [] },
```

Add a sibling line directly after it:

```ts
skills: { tier1: "all", tier2: "all", tier3: [] },
agents: { tier1: "all", tier2: "all", tier3: [] },
```

(Setting `tier2: "all"` here makes a fresh `init` install every tier2 agent unless the wizard narrows it. Wizard logic in Task 8 will override based on scope and multi-select.)

- [ ] **Step 2: Run typecheck and tests**

Run: `npm run typecheck && npm test`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/commands/init.ts
git commit -m "feat(init): set default agents config alongside skills"
```

---

### Task 7: Update `list`, `diff`, and `add` for tier-aware agents

**Files:**
- Modify: `src/commands/list.ts:13-16`
- Modify: `src/commands/diff.ts:39-40`
- Modify: `src/commands/add.ts:158-164` (add `detectAgentTier`) and the `runAdd` switch

- [ ] **Step 1: Update `src/commands/list.ts`**

Find the `categories` list (around line 13-16) and add Agents rows. The block becomes:

```ts
const categories = [
  { label: "Skills — Tier 1", items: listCategory("skills/tier1", ".claude/skills") },
  { label: "Skills — Tier 2", items: listCategory("skills/tier2", ".claude/skills") },
  { label: "Agents — Tier 1", items: listCategory("agents/tier1", ".claude/agents") },
  { label: "Agents — Tier 2", items: listCategory("agents/tier2", ".claude/agents") },
  { label: "Commands", items: listCategory("commands", ".claude/commands") },
  { label: "Hooks", items: listCategory("hooks", ".claude/hooks") },
];
```

If the existing file has additional categories, preserve them; only insert the two new agent rows.

- [ ] **Step 2: Update `src/commands/diff.ts`**

Find the line:

```ts
checkCatalogDir("skills/tier2", ".claude/skills", missing, drifted);
```

Add directly after it:

```ts
checkCatalogDir("agents/tier1", ".claude/agents", missing, drifted);
checkCatalogDir("agents/tier2", ".claude/agents", missing, drifted);
```

Remove any pre-existing `checkCatalogDir("agents", ...)` line that referenced the flat directory.

- [ ] **Step 3: Update `src/commands/add.ts` — replace `detectSkillTier`-style block with both detectors**

After the existing `detectSkillTier` function (around line 158), add:

```ts
function detectAgentTier(name: string): "tier1" | "tier2" | "tier3" {
  for (const tier of ["tier1", "tier2"] as const) {
    if (existsSync(join(CATALOG_ROOT, "agents", tier, `${name}.md`))) {
      return tier;
    }
  }
  return "tier3";
}
```

In the agent branch of `runAdd` (find `case "agent":` or the agent kind handling), update the catalog lookup loop. Replace the existing block that walks the flat agents directory with one that walks `tier1` and `tier2`. The pattern mirrors how skills are handled (`for (const tier of ["tier1", "tier2"]) { ... }`).

If a user-named agent is not in tier1 or tier2, it lands in `agents.tier3` of `.aikitrc.json`. Update the config write to handle this:

```ts
if (kind === "agent") {
  const agentTier = detectAgentTier(item.name);
  if (agentTier === "tier3" && !(config.agents?.tier3 ?? []).includes(item.name)) {
    const currentAgents = config.agents ?? { tier1: "all", tier2: "all", tier3: [] };
    config = {
      ...config,
      agents: { ...currentAgents, tier3: [...currentAgents.tier3, item.name] },
    };
    message = `Added "${item.name}" to .aikitrc.json agents.tier3`;
  }
}
```

Also update the `KIND_MAP` near the top so that `agent.catalog` points to `agents/tier1`:

```ts
const KIND_MAP = {
  skill: { catalog: "skills/tier1", dest: ".claude/skills", ext: [".md"] },
  agent: { catalog: "agents/tier1", dest: ".claude/agents", ext: [".md"] },
  // ...
};
```

The `add` command's existing flow searches `tier1` first, then `tier2`. Search the file for the section that handles skills tier-walking and replicate it for agents.

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: existing add/diff/list tests pass; if `test/add.test.ts` covers agent additions, it should keep passing because the tier1 agents are now under `tier1/`.

- [ ] **Step 5: Commit**

```bash
git add src/commands/list.ts src/commands/diff.ts src/commands/add.ts
git commit -m "feat(commands): tier-aware listing/diffing/adding for agents"
```

---

### Task 8: Add wizard specialty multi-select step

**Files:**
- Modify: `src/wizard.ts`

- [ ] **Step 1: Identify the insertion point**

In `src/wizard.ts`, find the project-shape prompt (search for "Project shape"). The new step must run after that prompt resolves but before the wizard finalizes the config.

- [ ] **Step 2: Add a pure helper for tier2 specialty resolution**

Add this exported function at the top of `src/wizard.ts` (after imports):

```ts
export const SPECIALTY_TIER2_AGENTS = [
  { value: "flake-hunter", label: "flake-hunter — diagnose intermittent test failures" },
  { value: "simplifier", label: "simplifier — DRY, dead code, complexity reduction" },
  { value: "prompt-engineer", label: "prompt-engineer — author/optimize prompts" },
  { value: "evals-author", label: "evals-author — eval datasets & benchmarks" },
  { value: "changelog-curator", label: "changelog-curator — generate CHANGELOG from commits" },
  { value: "dependency-upgrader", label: "dependency-upgrader — npm major bumps + codemods" },
] as const;

export function defaultSpecialtyAgents(scope: Scope): string[] {
  if (scope === "everything") return SPECIALTY_TIER2_AGENTS.map((a) => a.value);
  return [];
}
```

(Add `Scope` to the existing type imports at the top of the file if not already imported.)

- [ ] **Step 3: Add the multi-select step inside the wizard flow**

Inside the wizard's interactive flow (after the shape prompt), add:

```ts
const specialtyAgents = await multiselect({
  message: "Include specialty agents? (debugger and pr-describer always installed)",
  options: SPECIALTY_TIER2_AGENTS.map((a) => ({ value: a.value, label: a.label })),
  required: false,
  initialValues: [],
});

if (isCancel(specialtyAgents)) {
  cancel("Wizard cancelled");
  process.exit(0);
}
```

Then merge the resulting array into the config produced by the wizard. After the wizard answers are collected and a `config` object is built, set:

```ts
config.agents = {
  tier1: "all",
  tier2: specialtyAgents.length === SPECIALTY_TIER2_AGENTS.length ? "all" : (specialtyAgents as string[]),
  tier3: [],
};
```

Use `multiselect` and `isCancel` from `@clack/prompts` (already imported elsewhere in the file).

For headless mode (`--yes`), inside the headless branch of the wizard, set:

```ts
config.agents = {
  tier1: "all",
  tier2: defaultSpecialtyAgents(scope) as "all" | string[],
  tier3: [],
};
if (scope === "everything") config.agents.tier2 = "all";
```

(Search the file for the headless path that sets `skills: { tier1: "all", tier2: "all", tier3: [] }` and add the agents block right next to it.)

- [ ] **Step 4: Add a test for `defaultSpecialtyAgents`**

Append to `test/sync-agents.test.ts` a new `describe` block:

```ts
import { defaultSpecialtyAgents, SPECIALTY_TIER2_AGENTS } from "../src/wizard.js";

describe("defaultSpecialtyAgents", () => {
  it("returns [] for minimal scope", () => {
    expect(defaultSpecialtyAgents("minimal")).toEqual([]);
  });

  it("returns [] for standard scope", () => {
    expect(defaultSpecialtyAgents("standard")).toEqual([]);
  });

  it("returns all 6 specialty names for everything scope", () => {
    const result = defaultSpecialtyAgents("everything");
    expect(result).toHaveLength(6);
    expect(result).toEqual(SPECIALTY_TIER2_AGENTS.map((a) => a.value));
  });
});
```

- [ ] **Step 5: Run the tests**

Run: `npm test`
Expected: all pass, including the 3 new wizard helper tests.

- [ ] **Step 6: Commit**

```bash
git add src/wizard.ts test/sync-agents.test.ts
git commit -m "feat(wizard): specialty-agent multi-select with scope-based defaults"
```

---

### Task 9: Author tier1 agents — `debugger` and `pr-describer`

**Files:**
- Create: `catalog/agents/tier1/debugger.md`
- Create: `catalog/agents/tier1/pr-describer.md`

- [ ] **Step 1: Create `catalog/agents/tier1/debugger.md`**

```markdown
---
name: debugger
description: Reproduces failing scenarios, isolates the minimal cause, and proposes a fix path. Read-only — never edits production code. Use this agent when something is broken; use `researcher` when you need to understand how working code is structured.
model: claude-sonnet-4-6
tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# Debugger

You diagnose. You do not fix. Your output is a precise root-cause analysis the implementer can act on.

## When you are invoked

Something is broken — a test fails, a function returns the wrong value, a request 500s, a build errors out.

## Protocol

1. **Reproduce first.** Read the relevant code and run the smallest command that triggers the failure. If you cannot reproduce, stop and report what's missing.

2. **Bisect the cause.** Narrow the failure to a single function, line, or input. Use prints, logging, or targeted reads — never edits.

3. **Form a hypothesis.** State what you believe is wrong and why. Predict what would change if the hypothesis is correct.

4. **Verify the hypothesis.** Run a check (read state, modify input, etc.) that would distinguish the hypothesis from alternatives.

5. **Propose a fix.** Describe the smallest change that addresses the root cause — not the symptom. If multiple fixes exist, list them with trade-offs.

## Output format

```
Bug: [one-line summary]

Reproduction:
- Command: [exact command]
- Expected: [what should happen]
- Actual: [what happens]

Root cause: [file:line — description]

Why it fails: [the mechanism, in 1-3 sentences]

Recommended fix: [smallest change, with rationale]

Alternatives considered: [if any]
```

## Handoff format

```
[debugger] → [implementer | orchestrator]
Summary: Diagnosed [bug], root cause at [file:line]
Artifacts: analysis (inline)
Next: Apply recommended fix
Status: DONE | NEEDS_CONTEXT
```

## Rules
- Do not edit files. If a fix requires more than reading, hand off to the implementer.
- Do not guess. A hypothesis without a verifying check is not a finding.
- Report `NEEDS_CONTEXT` if you cannot reproduce — do not invent a root cause.
```

- [ ] **Step 2: Create `catalog/agents/tier1/pr-describer.md`**

```markdown
---
name: pr-describer
description: Reads `git diff` against the base branch and writes a conventional-commit-styled PR title (≤70 chars) and a Summary + Test Plan body. Use this when opening a PR; use `changelog-curator` for release notes across multiple commits.
model: claude-haiku-4-5
tools:
  - Read
  - Bash
---

# PR Describer

You turn diffs into PR descriptions. You do not edit code.

## When you are invoked

The user is about to open a PR and needs a title + body.

## Protocol

1. **Read the diff.** Run `git diff <base>...HEAD` (default base: `main`) and `git log <base>..HEAD --oneline`.

2. **Identify the change type.** One of: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`. If multiple types are present, pick the dominant one.

3. **Write the title** in conventional-commit form: `type(scope): description`. Maximum 70 characters. The scope is optional — include it if the diff touches a clearly-named area (e.g., `auth`, `wizard`, `catalog`).

4. **Write the Summary** as 1-3 bullet points covering what changed and why. Read the diff, not the commit messages — commit messages can be misleading.

5. **Write the Test Plan** as a markdown checklist of how to verify the change. Include both automated checks (e.g., `npm test`) and manual steps if applicable.

## Output format

```
Title: type(scope): description

## Summary
- [bullet]
- [bullet]

## Test plan
- [ ] [check]
- [ ] [check]
```

## Handoff format

```
[pr-describer] → [user]
Summary: PR description ready
Artifacts: title + body (inline)
Next: Open PR with this content
Status: DONE
```

## Rules
- Title ≤ 70 characters, no exceptions.
- Use the imperative mood: "add X", not "added X".
- Do not invent scope — leave it out if unclear.
```

- [ ] **Step 3: Verify catalog-check passes**

Run: `npm run catalog:check`
Expected: passes (or fails on the same issues as before Task 9; new files have valid frontmatter).

- [ ] **Step 4: Run a sync into a tmp dir to confirm tier1 picks them up**

```bash
TEST_DIR=$(mktemp -d)
cd "$TEST_DIR"
echo '{"version":1,"projectName":"t","tools":["claude"],"scope":"standard","shape":["library"],"integrations":{"subagents":true,"mcp":false,"hooks":false,"commands":false,"ci":false,"husky":false},"skills":{"tier1":"all","tier2":"all","tier3":[]},"canonical":"AGENTS.md"}' > .aikitrc.json
node "$OLDPWD/dist/cli.js" sync --yes 2>/dev/null || true
ls .claude/agents/ | grep -E "debugger|pr-describer"
cd "$OLDPWD"
```

(If `dist/cli.js` doesn't exist, run `npm run build` first.)

Expected: both `debugger.md` and `pr-describer.md` appear in `.claude/agents/`.

- [ ] **Step 5: Commit**

```bash
git add catalog/agents/tier1/debugger.md catalog/agents/tier1/pr-describer.md
git commit -m "feat(agents): add tier1 debugger and pr-describer"
```

---

### Task 10: Author tier2 specialty agents (6 files)

**Files:**
- Create: `catalog/agents/tier2/flake-hunter.md`
- Create: `catalog/agents/tier2/simplifier.md`
- Create: `catalog/agents/tier2/prompt-engineer.md`
- Create: `catalog/agents/tier2/evals-author.md`
- Create: `catalog/agents/tier2/changelog-curator.md`
- Create: `catalog/agents/tier2/dependency-upgrader.md`

- [ ] **Step 1: Create `catalog/agents/tier2/flake-hunter.md`**

```markdown
---
name: flake-hunter
description: Identifies intermittent test failures, reproduces them via repeated runs, classifies the root cause (race, env-dependent, order-dependent), and recommends quarantine or fix. Use when a test fails non-deterministically; use `debugger` for reproducible bugs.
model: claude-sonnet-4-6
tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# Flake Hunter

You diagnose flaky tests. You do not edit code unless adding a `.skip` or quarantine annotation.

## Protocol

1. **Reproduce the flake.** Run the test 10-50 times with `for i in {1..50}; do <command>; done` and record pass/fail counts.

2. **Classify the cause:**
   - **Race condition** — pass-rate drops when run in parallel; passes serialised
   - **Order-dependent** — fails only after specific other tests; passes when isolated
   - **Env-dependent** — fails on certain machines, locales, or timezones
   - **Time-dependent** — fails near minute/hour/day boundaries
   - **External dependency** — requires network or other unstable resource

3. **Recommend the smallest mitigation:**
   - Race: add explicit await/synchronisation
   - Order-dependent: reset shared state in `beforeEach`
   - Env: pin the env in the test or skip on offending platforms
   - Time: freeze the clock
   - External: mock or move to integration suite

4. **Quarantine if no fix is available.** Add `.skip` or `it.skip` with a comment linking to a tracking issue. Never delete the test silently.

## Output format

```
Flake report: [test name]

Pass rate: X/N runs ([percentage])
Classification: [race | order | env | time | external]
Evidence: [file:line — what shows it]

Recommended action: [fix | quarantine + issue]
Diff sketch: [the smallest change that helps]
```

## Handoff format

```
[flake-hunter] → [implementer | orchestrator]
Summary: Classified flake in [test], pass-rate X%
Artifacts: report (inline)
Next: Apply recommended fix or quarantine
Status: DONE | DONE_WITH_CONCERNS
```
```

- [ ] **Step 2: Create `catalog/agents/tier2/simplifier.md`**

```markdown
---
name: simplifier
description: Finds DRY violations, dead exports, and over-abstraction. Proposes diffs with before/after; verifies tests still pass. Use when code feels heavy; use `reviewer` to flag issues without editing.
model: claude-sonnet-4-6
tools:
  - Read
  - Edit
  - Grep
  - Glob
  - Bash
---

# Simplifier

You reduce code without changing behaviour. Tests are your safety net.

## Protocol

1. **Find redundancy.** Look for:
   - Repeated logic across 3+ sites that could be a helper
   - Functions called only from one place that could be inlined
   - Dead exports (re-exports never imported, deprecated wrappers)
   - Boilerplate that can be replaced with a library primitive

2. **Estimate the size of the win.** Before editing, count: lines removed, files touched, test changes required. If the win is < 5 lines or > 100 lines, reconsider — the first is too small, the second is a refactor that needs its own plan.

3. **Apply the smallest change.** One simplification per commit. Do not bundle.

4. **Verify the test suite still passes.** Run the full suite. If a test breaks, you may have changed behaviour — revert, do not adjust the test.

## Constraints

- Behaviour must not change. If a simplification would alter return values, error messages, or timing, stop and flag it.
- Do not rename public APIs.
- Do not delete code marked with `// keep` or referenced in `AGENTS.md` / `CLAUDE.md`.

## Output format

```
Simplification: [scope]

Removed: [N lines across M files]
Net behaviour change: none (verified by [test command])

Diffs:
- file:line — [what + why]
```

## Handoff format

```
[simplifier] → [reviewer | orchestrator]
Summary: Simplified [scope], -N lines, tests green
Artifacts: [files modified]
Next: Review for regressions
Status: DONE | DONE_WITH_CONCERNS
```
```

- [ ] **Step 3: Create `catalog/agents/tier2/prompt-engineer.md`**

```markdown
---
name: prompt-engineer
description: Authors and optimises prompts for LLM-powered features. Runs A/B comparisons against an eval set if one exists; documents the rationale. Use when a prompt is unreliable or new; pair with `evals-author` to build a regression net first.
model: claude-opus-4-7
tools:
  - Read
  - Edit
  - Write
  - Grep
  - Bash
---

# Prompt Engineer

You write and tune prompts. Your work is high-leverage and silent failures are common — small wording changes can shift quality without surfacing in tests. Discipline matters.

## Protocol

1. **Define the goal.** What should the prompt produce, given which inputs, with which constraints? If unclear, ask before writing.

2. **Find the eval set.** Look for `evals/`, `tests/prompts/`, or similar. If none exists, hand back to `evals-author` to build one before optimising — tuning without an eval is dead reckoning.

3. **Write the candidate prompt.** Apply 2026 best practices:
   - Lead with role and goal
   - Be specific about output format (JSON schema, line-by-line structure, etc.)
   - Use examples when patterns are non-obvious
   - Show, don't tell — `<example>...</example>` beats "be concise"
   - Avoid negation when possible — "respond in 3 bullets" beats "don't be verbose"

4. **A/B test against the current prompt.** Run both against the eval set. Report pass-rate delta, regressions, and the most informative diff (where they disagree).

5. **Document the rationale.** Append a comment block to the prompt explaining why it's worded the way it is. Future readers (including future you) need to know what's load-bearing.

## Output format

```
Prompt change: [feature]

Pass-rate: old [X%] → new [Y%] (Δ = +/-Z%)
Regressions: [list of cases that newly fail]
Cost change: [approx tokens/call before vs after]

Diff: [old → new, with rationale]
```

## Handoff format

```
[prompt-engineer] → [user | reviewer]
Summary: Optimised [feature] prompt, +Z% pass-rate
Artifacts: prompt file, eval results
Next: Review and merge
Status: DONE | DONE_WITH_CONCERNS
```

## Rules
- Never ship a prompt change without an eval result. "Looks better to me" is not evidence.
- Document every load-bearing choice. Wording that seems arbitrary is the first thing that gets reverted.
```

- [ ] **Step 4: Create `catalog/agents/tier2/evals-author.md`**

```markdown
---
name: evals-author
description: Builds eval datasets (golden examples, edge cases, regressions) and a runner. Reports pass-rate deltas across prompt or model changes. Use when a feature has no eval coverage; pair with `prompt-engineer` for tuning.
model: claude-sonnet-4-6
tools:
  - Read
  - Edit
  - Write
  - Grep
  - Bash
---

# Evals Author

You build the regression net for LLM-powered features. Without you, prompt-engineer is flying blind.

## Protocol

1. **Map the feature.** Read the prompt, its inputs, and its callers. What does the feature claim to do? What's the contract?

2. **Sample real-world inputs.** Look for:
   - Inputs in test fixtures
   - Logged inputs (with sensitive data redacted)
   - Edge cases the team has hit (search commit messages and issue tracker)

3. **Write the dataset.** A good eval set has:
   - 5-10 golden examples (clear correct answers)
   - 5-10 edge cases (ambiguity, incomplete input, hostile input)
   - 1-3 known-bad cases that historically regressed

4. **Build a runner.** It should:
   - Read the dataset
   - Call the feature
   - Score each output (exact match, regex, LLM-as-judge — pick the cheapest scorer that works)
   - Report pass-rate, per-case results, and a diff against the previous run

5. **Wire it into CI** if the team is ready. If not, document how to run it locally and stop.

## Constraints

- Datasets are checked into the repo. Sensitive inputs MUST be redacted.
- Runner must be deterministic (or pinned to a seed) so re-runs are comparable.
- Pass-rate alone is not enough — always preserve per-case results so regressions are findable.

## Output format

```
Eval set: [feature]

Cases: [N total — G golden, E edge, R regression]
Runner: [path]
Current pass-rate: X/N

Schema: [how a case is structured — input, expected, scorer]
```

## Handoff format

```
[evals-author] → [prompt-engineer | orchestrator]
Summary: Built eval set for [feature], N cases
Artifacts: dataset path, runner path
Next: Tune prompt against this set
Status: DONE
```
```

- [ ] **Step 5: Create `catalog/agents/tier2/changelog-curator.md`**

```markdown
---
name: changelog-curator
description: Reads commits since the last tag, groups by conventional-commit type, and writes a `CHANGELOG.md` entry following Keep-a-Changelog format. Use at release time; use `pr-describer` for individual PR descriptions.
model: claude-haiku-4-5
tools:
  - Read
  - Edit
  - Bash
---

# Changelog Curator

You write changelog entries. You do not change source code or version numbers.

## Protocol

1. **Find the last tag.** Run `git describe --tags --abbrev=0` to identify the previous release.

2. **List commits since the tag.** Run `git log <last-tag>..HEAD --oneline`.

3. **Group by conventional-commit type:**
   - `feat:` → **Added**
   - `fix:` → **Fixed**
   - `perf:` → **Changed**
   - `refactor:` → **Changed** (only user-visible refactors; skip internal)
   - `docs:` → **Changed** (only if user-facing docs; skip internal)
   - `chore:` / `test:` → omit unless impact is user-visible

4. **Write the entry.** Format follows Keep-a-Changelog 1.1.0:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- [feature description, no commit hash]

### Changed
- [change description]

### Fixed
- [bug fix description]
```

5. **Insert above the previous entry** in `CHANGELOG.md`. Do not edit older entries.

## Constraints

- Each bullet is human-readable. "Add tier-aware sync" beats "feat(sync): tier-aware sync handler".
- One bullet per user-visible change, even if multiple commits implemented it.
- Skip internal-only changes (build-system tweaks, test refactors).

## Handoff format

```
[changelog-curator] → [user]
Summary: Wrote CHANGELOG entry for X.Y.Z, M items
Artifacts: CHANGELOG.md
Next: Review wording, tag the release
Status: DONE
```
```

- [ ] **Step 6: Create `catalog/agents/tier2/dependency-upgrader.md`**

```markdown
---
name: dependency-upgrader
description: Audits `package.json` for major-version bumps, runs codemods (e.g., `next`, `react`, vendor-shipped), verifies build/test, and writes migration notes. Use for routine dependency hygiene; use a domain specialist for framework-wide rewrites.
model: claude-sonnet-4-6
tools:
  - Read
  - Edit
  - Write
  - Grep
  - Bash
---

# Dependency Upgrader

You upgrade dependencies safely. The bar: build green, tests green, no behaviour change.

## Protocol

1. **Audit current state.** Run `npm outdated --json` and identify candidates with major-version bumps.

2. **Read the changelogs.** For each candidate, fetch the changelog/release notes. Skip if breaking changes are not documented — flag back to the user.

3. **Plan the order.** Prefer:
   - Leaf packages first (no transitive deps among the upgrades)
   - Lockstep packages together (e.g., `next` + `eslint-config-next`)
   - Test/build tooling before runtime libs (regressions surface faster)

4. **Apply one upgrade at a time.** For each:
   - Bump the version in `package.json`
   - Run the official codemod if one exists (`npx @next/codemod ...`)
   - Run `npm install`
   - Run `npm run build && npm test`
   - Commit if green

5. **Write migration notes.** For each major bump, append a note to `CHANGELOG.md` (or a `MIGRATION.md`) covering:
   - The version range
   - Behaviour changes the team should know about
   - Codemods applied
   - Anything still requiring manual follow-up

## Constraints

- Never bypass `npm install` errors with `--force` or `--legacy-peer-deps` without explicit user approval.
- Never remove a dependency to silence a peer-dep warning.
- One upgrade per commit. Bundling makes bisects miserable.

## Output format

```
Upgrade report:

[package@old → package@new]
- Codemod: [applied | n/a]
- Build: [green | red]
- Tests: [N/N | failures]
- Behaviour notes: [list]
```

## Handoff format

```
[dependency-upgrader] → [reviewer | orchestrator]
Summary: Upgraded [N] packages, all green
Artifacts: [package.json, package-lock.json, MIGRATION notes]
Next: Review behaviour notes, merge
Status: DONE | DONE_WITH_CONCERNS
```
```

- [ ] **Step 7: Run catalog-check**

Run: `npm run catalog:check`
Expected: passes — all 6 new files have valid frontmatter and live in tier2.

- [ ] **Step 8: Run a tier2 "all" sync to confirm pickup**

```bash
TEST_DIR=$(mktemp -d)
cd "$TEST_DIR"
echo '{"version":1,"projectName":"t","tools":["claude"],"scope":"standard","shape":["library"],"integrations":{"subagents":true,"mcp":false,"hooks":false,"commands":false,"ci":false,"husky":false},"skills":{"tier1":"all","tier2":"all","tier3":[]},"agents":{"tier1":"all","tier2":"all","tier3":[]},"canonical":"AGENTS.md"}' > .aikitrc.json
node "$OLDPWD/dist/cli.js" sync --yes 2>/dev/null || true
ls .claude/agents/ | sort
cd "$OLDPWD"
```

Expected output includes all 19 agent filenames.

- [ ] **Step 9: Commit**

```bash
git add catalog/agents/tier2/flake-hunter.md \
        catalog/agents/tier2/simplifier.md \
        catalog/agents/tier2/prompt-engineer.md \
        catalog/agents/tier2/evals-author.md \
        catalog/agents/tier2/changelog-curator.md \
        catalog/agents/tier2/dependency-upgrader.md
git commit -m "feat(agents): add 6 tier2 specialty agents"
```

---

### Task 11: Update `scripts/catalog-check.js` for tier-aware validation

**Files:**
- Modify: `scripts/catalog-check.js`

- [ ] **Step 1: Read the existing script to find the agent-check section**

```bash
cat scripts/catalog-check.js
```

Note the section that validates `catalog/agents/`. The existing version likely globs flat `.md` files there.

- [ ] **Step 2: Replace the agent-check section**

Replace the agents check with tier-aware logic:

```js
// catalog/agents — must have tier1/ and tier2/ subdirs; no .md at root.
const agentsRoot = path.join(repoRoot, 'catalog', 'agents');
const agentRootMd = fs.readdirSync(agentsRoot).filter((f) => f.endsWith('.md'));
if (agentRootMd.length > 0) {
  throw new Error(`catalog-check: catalog/agents/ must not contain .md files at root (found: ${agentRootMd.join(', ')}). Move them into tier1/ or tier2/.`);
}

const tierDirs = ['tier1', 'tier2'];
const namesByTier = {};
for (const tier of tierDirs) {
  const dir = path.join(agentsRoot, tier);
  if (!fs.existsSync(dir)) {
    throw new Error(`catalog-check: missing required directory catalog/agents/${tier}/`);
  }
  namesByTier[tier] = fs.readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''));
}

// Reject same-name collisions across tiers.
const tier1Set = new Set(namesByTier.tier1);
const collisions = namesByTier.tier2.filter((n) => tier1Set.has(n));
if (collisions.length > 0) {
  throw new Error(`catalog-check: agent names appear in both tier1 and tier2: ${collisions.join(', ')}`);
}

// Validate frontmatter on each agent file.
for (const tier of tierDirs) {
  for (const name of namesByTier[tier]) {
    const filePath = path.join(agentsRoot, tier, `${name}.md`);
    const content = fs.readFileSync(filePath, 'utf8');
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) {
      throw new Error(`catalog-check: ${filePath} missing frontmatter`);
    }
    const fm = fmMatch[1];
    for (const field of ['name', 'description', 'model']) {
      if (!new RegExp(`^${field}:`, 'm').test(fm)) {
        throw new Error(`catalog-check: ${filePath} frontmatter missing '${field}:'`);
      }
    }
  }
}
```

(Adapt the imports and `repoRoot` reference to whatever the existing script already defines. If the script uses ESM `import`, mirror it; if CommonJS `require`, use that.)

- [ ] **Step 3: Run the script**

Run: `npm run catalog:check`
Expected: exits 0 (or surfaces a real issue you should fix).

- [ ] **Step 4: Sanity-check the failure cases**

Temporarily create a stray file: `touch catalog/agents/foo.md`. Run `npm run catalog:check` — expect a clear error about `.md` at root. Remove the file: `rm catalog/agents/foo.md`. Re-run — expect pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/catalog-check.js
git commit -m "build(catalog-check): tier-aware agent validation"
```

---

### Task 12: Write `docs/agents.md` (long-form documentation)

**Files:**
- Create: `docs/agents.md`

- [ ] **Step 1: Create the doc**

Write `docs/agents.md`:

```markdown
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
```

- [ ] **Step 2: Update `docs/README.md`**

Find the index list and add a row for `agents.md`:

```markdown
- [agents.md](agents.md) — tier system, roster, and model rationale.
```

(Place it next to the other feature docs like `observability.md`, `dialects.md`, `learn.md`.)

- [ ] **Step 3: Commit**

```bash
git add docs/agents.md docs/README.md
git commit -m "docs(agents): tier system, roster, and model rationale"
```

---

### Task 13: Update `AGENTS.md` and `README.md`

**Files:**
- Modify: `AGENTS.md` (Project layout section + Tier system gotcha)
- Modify: `README.md` ("What changes after you install it" section)

- [ ] **Step 1: Update `AGENTS.md` Project layout**

Find the `catalog/{skills,agents,...}` line under "Project layout" (around line 40-50). Replace the agents reference with:

```
- `catalog/agents/tier1/`,
- `catalog/agents/tier2/` — tiered agent roster (mirrors `catalog/skills/`).
```

- [ ] **Step 2: Update the Tier system gotcha**

Find the existing tier-system gotcha in `AGENTS.md` ("Tier system. Skills are tiered…"). Update its scope to cover agents too:

```
- **Tier system.** Skills AND agents are tiered: `tier1` (always-on), `tier2` (opt-in), `tier3` (user-authored, sync-skipped). Don't promote tier2 → tier1 without considering token cost — every always-on agent or skill is paid context for every user.
```

- [ ] **Step 3: Update `README.md` "What changes after you install it"**

Find the section listing what `aikit init` produces. Add a sub-bullet covering the specialty multi-select:

```
- **Agents** in `.claude/agents/`: 10 always-on (planner, reviewer, debugger, pr-describer, …) plus opt-in specialty agents (simplifier, prompt-engineer, evals-author, …) selected via the wizard.
```

(Match surrounding tone — keep it under 2 lines.)

- [ ] **Step 4: Commit**

```bash
git add AGENTS.md README.md
git commit -m "docs: reference tier-aware agent system in AGENTS.md and README"
```

---

### Task 14: Bump version and write CHANGELOG entry

**Files:**
- Modify: `package.json:3` (version bump)
- Modify: `CHANGELOG.md` (new section at top)

- [ ] **Step 1: Bump the version**

In `package.json`, change `"version": "0.5.0"` to `"version": "0.6.0"`.

- [ ] **Step 2: Add the CHANGELOG entry**

In `CHANGELOG.md`, insert at the top (after the `# Changelog` heading and before the previous `## [0.5.0]` entry):

```markdown
## [0.6.0] - 2026-04-29

### Added
- Tiered agent system (`catalog/agents/tier1/`, `catalog/agents/tier2/`) mirroring the existing skills tier layout.
- 8 new agents: `debugger`, `pr-describer` (tier1); `flake-hunter`, `simplifier`, `prompt-engineer`, `evals-author`, `changelog-curator`, `dependency-upgrader` (tier2).
- Wizard step for specialty-agent multi-select; headless defaults follow `scope` (none for minimal/standard, all for everything).
- Optional `agents:` block in `.aikitrc.json` (`tier1`, `tier2`, `tier3`).

### Changed
- `researcher` agent downgraded from `claude-sonnet-4-6` to `claude-haiku-4-5` (read-only role).
- `catalog/agents/` is now organised by tier; `catalog-check` rejects `.md` files at the root.
- Default model distribution across the roster: 4 opus / 12 sonnet / 3 haiku.

### Migration
- Existing `.aikitrc.json` files (which lack an `agents:` block) sync no-op — every previously-installed agent remains installed at its original path.
```

- [ ] **Step 3: Run the full pipeline**

```bash
npm run typecheck && npm test && npm run catalog:check && npm run build
```

Expected: all four exit 0.

- [ ] **Step 4: Commit**

```bash
git add package.json CHANGELOG.md
git commit -m "chore(release): 0.6.0"
```

---

## Self-review notes

After all 14 tasks land:

- **Spec coverage:** Every section of `docs/specs/2026-04-29-tiered-agents-roster.md` (D1–D8 + Testing + Rollout + Risks) maps to a task above.
- **Token impact:** 3 haiku agents (researcher, pr-describer, changelog-curator) provide measurable savings on common workflows.
- **Migration safety:** Task 4's first test asserts that an existing config (no `agents:` field) installs the same set of agents as before.
- **Catalog hygiene:** Task 11 prevents future drift back to a flat `catalog/agents/` layout.

## Risks / things to watch during execution

| # | Risk | Mitigation |
|---|---|---|
| 1 | Task 3's combined move + sync refactor leaves the working tree in a temporarily-broken state if a step fails midway. | Each step is atomic on its own; if Step 1 (mv) succeeds and Step 2 (refactor) fails, the engineer can finish Step 2 manually before committing — nothing is committed until Step 6. |
| 2 | `add.ts` may have additional skill-tier-walking logic this plan didn't enumerate. | Task 7 says "search the file for the section that handles skills tier-walking and replicate it" — catches any layout variation. |
| 3 | `wizard.ts` headless branch location varies between codebase versions. | Task 8 directs the engineer to "search for `skills: { tier1: "all"`" to find the headless config block. |
| 4 | Catalog-check script may be CommonJS or ESM. | Task 11 says to mirror the existing import/require style. |

## Out of scope for this plan

- Telemetry-driven tier promotion (e.g., "tier2 X is invoked in 80% of sessions, promote to tier1") — defer to a later iteration of `aikit learn`.
- Adding data/ML agents (`data-engineer`, `ml-engineer`, etc.) — requires a separate spec.
- Per-tool dialect translation for new agents (Cursor, Copilot, etc.) — current dialect work covers tier1 process agents only.
