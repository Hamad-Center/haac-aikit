# Interactive Conflict Resolution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `aikit sync` and `aikit update` prompt the user before overwriting locally-modified template files (agents, skills, commands, hooks). The prompt offers Replace (default), Keep + tier3, Show diff, Replace all, Skip all. Headless / CI behavior is preserved (skip with warning, never block).

**Architecture:** Refactor `copyAction` (`src/commands/sync.ts:147`) to surface a `"conflict"` action when local content differs from the catalog (parity with `safeWrite`). Add a `resolveConflict()` helper (`src/fs/conflict.ts`) that prompts via `@clack/prompts` when stdin is a TTY. Add an inline colorized diff renderer (`src/fs/diff.ts`) backed by the `diff` package. Wire the conflict loop into `runSync` between the file-collection and write phases. "Keep" updates `config.agents.tier3` or `config.skills.tier3` in-memory and persists via the existing `writeConfig` at the end of the run.

**Tech Stack:** TypeScript 5 (strict), vitest, tsup (ESM bundle), `@clack/prompts` (existing), `kleur` (existing), `diff` (NEW dep, ~30KB, MIT, single-purpose).

**Spec:** [`docs/specs/2026-04-29-interactive-conflict-resolution.md`](../specs/2026-04-29-interactive-conflict-resolution.md)

---

## File structure (created / modified)

**Source new files:**
- `src/fs/diff.ts` — pure function: `formatUnifiedDiff(local: string, incoming: string): string` (colorized, 3 lines context)
- `src/fs/conflict.ts` — `resolveConflict()` interactive prompt + `inferTier3Slot()` path → kind helper

**Source modified:**
- `src/types.ts` — add `ConflictResolution` union type
- `src/commands/sync.ts` — refactor `copyAction` signature; add conflict loop between collection and reporting phases
- `package.json` — add `diff` dependency, bump version to `0.7.0`

**Tests new:**
- `test/diff-format.test.ts` — `formatUnifiedDiff` snapshot/structural tests
- `test/copy-action-conflict.test.ts` — `copyAction` returns `"conflict"` when content differs without `force: true`
- `test/resolve-conflict.test.ts` — pure-function tests for the resolver via injected prompt
- `test/sync-conflict-headless.test.ts` — non-TTY mode skips conflicts with warning, exit 0
- `test/sync-conflict-keep-tier3.test.ts` — "Keep" updates `agents.tier3` in `.aikitrc.json`

**Docs new:**
- `docs/conflict-resolution.md` — walkthrough of the prompt UX, what each option does, headless/CI behavior

**Docs modified:**
- `docs/README.md` — add `conflict-resolution.md` to index
- `README.md` — single-line note about the new behavior under "What changes after you install it"
- `CHANGELOG.md` — new `## [0.7.0]` section

---

### Task 1: Add `diff` dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the package**

```bash
npm install diff@7.0.0 --save-exact
npm install --save-dev @types/diff@7.0.0 --save-exact
```

(Pin to exact version per spec R4. If `7.0.0` is not the latest at the time of execution, use the current latest stable but still pin exact.)

- [ ] **Step 2: Verify the lock file changed and the dep is in `package.json`**

```bash
grep '"diff"' package.json
grep '"@types/diff"' package.json
```

Expected: both present with exact versions.

- [ ] **Step 3: Verify imports work**

Quick smoke import in a node REPL or one-liner:

```bash
node -e 'import("diff").then(d => console.log(typeof d.createPatch))'
```

Expected: prints `function`.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): add diff package for inline conflict diff rendering"
```

---

### Task 2: Create `src/fs/diff.ts` — inline colorized unified diff

**Files:**
- Create: `src/fs/diff.ts`
- Create: `test/diff-format.test.ts`

- [ ] **Step 1: Write the failing test**

Create `test/diff-format.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { formatUnifiedDiff } from "../src/fs/diff.js";

describe("formatUnifiedDiff", () => {
  it("returns empty string for identical inputs", () => {
    expect(formatUnifiedDiff("hello\n", "hello\n")).toBe("");
  });

  it("marks added lines with '+ '", () => {
    const out = formatUnifiedDiff("a\n", "a\nb\n");
    // Strip ANSI for assertion stability.
    const plain = out.replace(/\x1b\[[0-9;]*m/g, "");
    expect(plain).toMatch(/^\+ b$/m);
  });

  it("marks removed lines with '- '", () => {
    const out = formatUnifiedDiff("a\nb\n", "a\n");
    const plain = out.replace(/\x1b\[[0-9;]*m/g, "");
    expect(plain).toMatch(/^- b$/m);
  });

  it("includes 3 lines of context around a change", () => {
    const local = "1\n2\n3\n4\n5\n6\n7\n";
    const incoming = "1\n2\n3\nFOUR\n5\n6\n7\n";
    const out = formatUnifiedDiff(local, incoming);
    const plain = out.replace(/\x1b\[[0-9;]*m/g, "");
    expect(plain).toMatch(/^  3$/m);
    expect(plain).toMatch(/^- 4$/m);
    expect(plain).toMatch(/^\+ FOUR$/m);
    expect(plain).toMatch(/^  5$/m);
  });
});
```

- [ ] **Step 2: Run the test, expect failure**

Run: `npx vitest run test/diff-format.test.ts`
Expected: FAIL with `Cannot find module '../src/fs/diff.js'`.

- [ ] **Step 3: Implement `src/fs/diff.ts`**

```ts
import { createPatch } from "diff";
import kleur from "kleur";

/**
 * Render a unified diff between two strings as colored, human-readable text.
 * Empty string when inputs are identical. 3 lines of context.
 */
export function formatUnifiedDiff(local: string, incoming: string): string {
  if (local === incoming) return "";

  // createPatch wants four args (oldFileName, newFileName, oldStr, newStr)
  // and returns a unified diff string with a header. Strip the header.
  const raw = createPatch("local", "incoming", local, incoming, "", "", { context: 3 });

  const lines: string[] = [];
  let inHunk = false;
  for (const line of raw.split("\n")) {
    if (line.startsWith("@@")) {
      inHunk = true;
      continue;
    }
    if (!inHunk) continue;
    if (line.startsWith("+") && !line.startsWith("+++")) {
      lines.push(kleur.green(`+ ${line.slice(1)}`));
    } else if (line.startsWith("-") && !line.startsWith("---")) {
      lines.push(kleur.red(`- ${line.slice(1)}`));
    } else if (line.startsWith(" ")) {
      lines.push(kleur.dim(`  ${line.slice(1)}`));
    }
  }
  return lines.join("\n");
}
```

- [ ] **Step 4: Run the test, expect pass**

Run: `npx vitest run test/diff-format.test.ts`
Expected: 4/4 pass.

- [ ] **Step 5: Run full suite + typecheck**

Run: `npm test && npm run typecheck`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/fs/diff.ts test/diff-format.test.ts
git commit -m "feat(fs): inline colorized unified diff helper"
```

---

### Task 3: Create `src/fs/conflict.ts` — resolveConflict + inferTier3Slot

**Files:**
- Create: `src/fs/conflict.ts`
- Create: `test/resolve-conflict.test.ts`
- Modify: `src/types.ts` (add `ConflictResolution` type)

- [ ] **Step 1: Add `ConflictResolution` type to `src/types.ts`**

After the existing `WriteResult` interface, add:

```ts
export type ConflictResolution = "replace" | "keep" | "replace_all" | "skip_all";

export type Tier3Slot = "agents" | "skills" | null;
```

(The `null` case is for commands/hooks which don't have a tier3 array.)

- [ ] **Step 2: Write the failing test**

Create `test/resolve-conflict.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { inferTier3Slot } from "../src/fs/conflict.js";

describe("inferTier3Slot", () => {
  it("returns 'agents' for .claude/agents/*.md", () => {
    expect(inferTier3Slot(".claude/agents/reviewer.md")).toBe("agents");
  });

  it("returns 'skills' for .claude/skills/*.md", () => {
    expect(inferTier3Slot(".claude/skills/brainstorming.md")).toBe("skills");
  });

  it("returns null for .claude/commands/*.md", () => {
    expect(inferTier3Slot(".claude/commands/explore.md")).toBe(null);
  });

  it("returns null for .claude/hooks/*.sh", () => {
    expect(inferTier3Slot(".claude/hooks/pre-commit.sh")).toBe(null);
  });

  it("returns null for unknown paths", () => {
    expect(inferTier3Slot("AGENTS.md")).toBe(null);
    expect(inferTier3Slot(".github/workflows/ci.yml")).toBe(null);
  });
});
```

- [ ] **Step 3: Run the test, expect failure**

Run: `npx vitest run test/resolve-conflict.test.ts`
Expected: FAIL with module not found.

- [ ] **Step 4: Implement `src/fs/conflict.ts`**

```ts
import * as p from "@clack/prompts";
import { basename } from "node:path";
import type { ConflictResolution, Tier3Slot } from "../types.js";
import { formatUnifiedDiff } from "./diff.js";

/**
 * Map a destination file path to its corresponding tier3 slot in AikitConfig.
 * Returns null for paths without a tier3 mechanism (commands, hooks, or others).
 */
export function inferTier3Slot(filePath: string): Tier3Slot {
  if (filePath.includes("/agents/") && filePath.endsWith(".md")) return "agents";
  if (filePath.includes("/skills/") && filePath.endsWith(".md")) return "skills";
  return null;
}

export interface ConflictPrompt {
  /** Ask the user how to resolve a single conflict. */
  ask(filePath: string, local: string, incoming: string): Promise<ConflictResolution>;
}

/**
 * Default interactive prompt using @clack/prompts. Tests inject their own
 * implementation so we never block on stdin in CI.
 */
export const interactivePrompt: ConflictPrompt = {
  async ask(filePath, local, incoming) {
    while (true) {
      const choice = await p.select<ConflictResolution | "diff">({
        message: `Modified locally: ${filePath}`,
        options: [
          { value: "replace", label: "Replace with catalog version (recommended)" },
          { value: "keep", label: "Keep local version (mark as tier3 to silence future prompts)" },
          { value: "diff", label: "Show diff first" },
          { value: "replace_all", label: "Replace all remaining conflicts" },
          { value: "skip_all", label: "Skip all remaining conflicts" },
        ],
        initialValue: "replace",
      });

      if (p.isCancel(choice)) {
        p.cancel("Sync cancelled");
        process.exit(0);
      }

      if (choice === "diff") {
        const out = formatUnifiedDiff(local, incoming);
        p.note(out, basename(filePath));
        continue; // re-prompt
      }

      return choice;
    }
  },
};
```

- [ ] **Step 5: Run the test, expect pass**

Run: `npx vitest run test/resolve-conflict.test.ts`
Expected: 5/5 pass (only `inferTier3Slot` is tested at the unit level here; the interactive flow is covered at the integration level in Task 5's tests).

- [ ] **Step 6: Run full suite + typecheck**

Run: `npm test && npm run typecheck`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add src/fs/conflict.ts test/resolve-conflict.test.ts src/types.ts
git commit -m "feat(fs): conflict resolution helper + tier3 slot inference"
```

---

### Task 4: Refactor `copyAction` to surface conflicts

**Files:**
- Modify: `src/commands/sync.ts`
- Create: `test/copy-action-conflict.test.ts`

- [ ] **Step 1: Write the failing test**

Create `test/copy-action-conflict.test.ts`. Note: `copyAction` is currently a private function in `sync.ts`; you'll need to export it for testability. Add `export` to its declaration in Step 2.

```ts
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { copyAction } from "../src/commands/sync.js";

let tmpDir: string;
let origCwd: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "haac-copy-action-"));
  origCwd = process.cwd();
  process.chdir(tmpDir);
});

afterEach(() => {
  process.chdir(origCwd);
});

describe("copyAction", () => {
  it("returns 'created' when destination doesn't exist", () => {
    mkdirSync("src", { recursive: true });
    writeFileSync("src/foo.md", "hello");
    const result = copyAction("src/foo.md", "dest/foo.md", { dryRun: false, force: false });
    expect(result.action).toBe("created");
    expect(readFileSync("dest/foo.md", "utf8")).toBe("hello");
  });

  it("returns 'skipped' when destination matches incoming", () => {
    mkdirSync("src", { recursive: true });
    mkdirSync("dest", { recursive: true });
    writeFileSync("src/foo.md", "same");
    writeFileSync("dest/foo.md", "same");
    const result = copyAction("src/foo.md", "dest/foo.md", { dryRun: false, force: false });
    expect(result.action).toBe("skipped");
  });

  it("returns 'conflict' when destination differs and force=false", () => {
    mkdirSync("src", { recursive: true });
    mkdirSync("dest", { recursive: true });
    writeFileSync("src/foo.md", "incoming");
    writeFileSync("dest/foo.md", "local-modification");
    const result = copyAction("src/foo.md", "dest/foo.md", { dryRun: false, force: false });
    expect(result.action).toBe("conflict");
    // Destination is NOT overwritten on conflict.
    expect(readFileSync("dest/foo.md", "utf8")).toBe("local-modification");
  });

  it("returns 'updated' when destination differs and force=true", () => {
    mkdirSync("src", { recursive: true });
    mkdirSync("dest", { recursive: true });
    writeFileSync("src/foo.md", "incoming");
    writeFileSync("dest/foo.md", "local-modification");
    const result = copyAction("src/foo.md", "dest/foo.md", { dryRun: false, force: true });
    expect(result.action).toBe("updated");
    expect(readFileSync("dest/foo.md", "utf8")).toBe("incoming");
  });

  it("never writes on dryRun=true", () => {
    mkdirSync("src", { recursive: true });
    mkdirSync("dest", { recursive: true });
    writeFileSync("src/foo.md", "incoming");
    writeFileSync("dest/foo.md", "local-modification");
    const result = copyAction("src/foo.md", "dest/foo.md", { dryRun: true, force: true });
    expect(result.action).toBe("updated");
    // Destination unchanged on dry run.
    expect(readFileSync("dest/foo.md", "utf8")).toBe("local-modification");
  });
});
```

- [ ] **Step 2: Run the test, expect failure**

Run: `npx vitest run test/copy-action-conflict.test.ts`
Expected: FAIL — `copyAction` is not exported (you'll see an import error or a reference error).

- [ ] **Step 3: Update `copyAction` signature in `src/commands/sync.ts`**

Replace the existing `copyAction` function body (currently lines 147-158) with:

```ts
export function copyAction(
  srcPath: string,
  destPath: string,
  opts: { dryRun: boolean; force: boolean },
): WriteResult {
  const existed = existsSync(destPath);
  const incoming = readFileSync(srcPath, "utf8");
  if (existed) {
    const current = readFileSync(destPath, "utf8");
    if (current === incoming) {
      return { path: destPath, action: "skipped" };
    }
    if (!opts.force) {
      return { path: destPath, action: "conflict" };
    }
  }
  if (!opts.dryRun) copyFileSync(srcPath, destPath);
  return { path: destPath, action: existed ? "updated" : "created" };
}
```

Update ALL call sites of `copyAction` in the same file. They currently call `copyAction(src, dest, dryRun)`. Find every call site and change to `copyAction(src, dest, { dryRun, force })` — passing the `force` flag through from the caller.

The callers are inside `syncSkills`, `syncAgentTier`, `syncCommands`, and `syncHooks` (or whatever the equivalents are — search for `copyAction(` in `sync.ts`). Each of these functions takes `dryRun` already; they'll need to also take `force`. Trace upward to find where these are called from `runSync` and pipe the `force` value through.

The simplest change: extract the `dryRun, force` pair into a small `WriteOpts` interface and pass that everywhere instead of two separate booleans. Add to `src/types.ts`:

```ts
export interface WriteOpts {
  dryRun: boolean;
  force: boolean;
}
```

Then refactor sync helpers to accept `WriteOpts` instead of `dryRun: boolean`.

- [ ] **Step 4: Run the conflict tests, expect pass**

Run: `npx vitest run test/copy-action-conflict.test.ts`
Expected: 5/5 pass.

- [ ] **Step 5: Run the full suite — existing tests must still pass**

Run: `npm test`
Expected: all tests pass. The full suite at this point is the existing 108 + the 4 from Task 2 + the 5 from Task 3 + the 5 from Task 4 = 122. Your run should match (modulo any tests added in failing branches you've discarded).

- [ ] **Step 6: Run typecheck**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 7: Commit**

```bash
git add src/commands/sync.ts src/types.ts test/copy-action-conflict.test.ts
git commit -m "refactor(sync): copyAction surfaces conflicts when force=false"
```

---

### Task 5: Wire conflict resolution into `runSync` flow

**Files:**
- Modify: `src/commands/sync.ts`
- Create: `test/sync-conflict-headless.test.ts`
- Create: `test/sync-conflict-keep-tier3.test.ts`

- [ ] **Step 1: Write the headless test**

Create `test/sync-conflict-headless.test.ts`:

```ts
import { existsSync, mkdtempSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
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

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "haac-conflict-headless-"));
  origCwd = process.cwd();
  process.chdir(tmpDir);
});

afterEach(() => {
  process.chdir(origCwd);
});

describe("sync — conflict resolution (headless)", () => {
  it("skips conflicts when --yes is passed and reports them", async () => {
    writeFileSync(".aikitrc.json", JSON.stringify(baseConfig));

    // First sync to install everything.
    await runSync({ _: ["sync"], yes: true });

    // Modify a tier1 agent locally.
    const modifiedPath = ".claude/agents/reviewer.md";
    writeFileSync(modifiedPath, "LOCAL MODIFICATION");

    // Capture stdout for warning check.
    let captured = "";
    const origWrite = process.stdout.write.bind(process.stdout);
    process.stdout.write = (chunk: string | Uint8Array): boolean => {
      captured += typeof chunk === "string" ? chunk : chunk.toString();
      return true;
    };

    try {
      await runSync({ _: ["sync"], yes: true });
    } finally {
      process.stdout.write = origWrite;
    }

    // The local modification must NOT have been overwritten.
    expect(readFileSync(modifiedPath, "utf8")).toBe("LOCAL MODIFICATION");
    // A warning must mention conflicts.
    expect(captured).toMatch(/conflict/i);
  });

  it("overwrites conflicts when --force is passed", async () => {
    writeFileSync(".aikitrc.json", JSON.stringify(baseConfig));
    await runSync({ _: ["sync"], yes: true });

    const modifiedPath = ".claude/agents/reviewer.md";
    writeFileSync(modifiedPath, "LOCAL MODIFICATION");

    await runSync({ _: ["sync"], yes: true, force: true });

    // Local mod is now gone; reviewer.md matches catalog.
    expect(readFileSync(modifiedPath, "utf8")).not.toBe("LOCAL MODIFICATION");
    expect(readFileSync(modifiedPath, "utf8")).toMatch(/Reviewer/);
  });
});
```

- [ ] **Step 2: Write the tier3 keep test**

Create `test/sync-conflict-keep-tier3.test.ts`:

```ts
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runSync } from "../src/commands/sync.js";
import type { AikitConfig, ConflictResolution } from "../src/types.js";

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

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "haac-conflict-keep-"));
  origCwd = process.cwd();
  process.chdir(tmpDir);
});

afterEach(() => {
  process.chdir(origCwd);
});

describe("sync — Keep + tier3", () => {
  it("adds the file's name to agents.tier3 when 'keep' is chosen", async () => {
    writeFileSync(".aikitrc.json", JSON.stringify(baseConfig));
    await runSync({ _: ["sync"], yes: true });

    // Modify reviewer locally.
    writeFileSync(".claude/agents/reviewer.md", "LOCAL MODIFICATION");

    // Inject a stub prompt that always answers "keep".
    const stubPrompt = {
      ask: async (): Promise<ConflictResolution> => "keep",
    };

    await runSync({ _: ["sync"], _conflictPrompt: stubPrompt } as never);

    const cfg = JSON.parse(readFileSync(".aikitrc.json", "utf8"));
    expect(cfg.agents?.tier3).toContain("reviewer");
    // Local mod preserved.
    expect(readFileSync(".claude/agents/reviewer.md", "utf8")).toBe("LOCAL MODIFICATION");
  });
});
```

- [ ] **Step 3: Run both tests, expect failure**

Run: `npx vitest run test/sync-conflict-headless.test.ts test/sync-conflict-keep-tier3.test.ts`
Expected: FAIL — the conflict loop and `_conflictPrompt` injection don't exist yet.

- [ ] **Step 4: Implement the conflict loop in `runSync`**

In `src/commands/sync.ts`:

1. Import the conflict helpers and types:

```ts
import { interactivePrompt, inferTier3Slot, type ConflictPrompt } from "../fs/conflict.js";
import { writeConfig } from "../fs/readConfig.js";
import { copyFileSync, readFileSync as fsReadFile } from "node:fs";
```

2. **First, extend `WriteResult` to carry the source path** so the conflict loop can re-read incoming content without rebuilding a path-map. In `src/types.ts`:

```ts
export interface WriteResult {
  path: string;
  action: "created" | "updated" | "skipped" | "conflict";
  src?: string; // catalog source path for copy-style writes
}
```

Then in `copyAction` (Task 4 already exported it), populate `src: srcPath` on the conflict-returning branch. Other branches don't need it but you can populate uniformly for consistency.

3. Modify the `runSync` signature to accept an optional injected prompt (for testability):

```ts
export async function runSync(
  args: CliArgs & { _conflictPrompt?: ConflictPrompt }
): Promise<void> {
  // ... existing setup
}
```

4. After the line `const conflicts = results.filter((r) => r.action === "conflict");` (currently around line 114), add the conflict-handling block BEFORE the existing reporting logic:

```ts
if (conflicts.length > 0 && !args.force) {
  const isInteractive = Boolean(process.stdin.isTTY) && !args.yes;
  if (isInteractive) {
    const prompt = args._conflictPrompt ?? interactivePrompt;
    let bulkAction: "replace_all" | "skip_all" | null = null;
    let configMutated = false;
    let workingConfig: AikitConfig = config;

    p.log.info(`Found ${conflicts.length} file(s) modified locally. Reviewing each…`);

    for (const conflict of conflicts) {
      const incomingSrc = conflict.src;
      if (!incomingSrc) continue; // conflicts without a source path can't be resolved

      let resolution: ConflictResolution;
      if (bulkAction === "replace_all") {
        resolution = "replace";
      } else if (bulkAction === "skip_all") {
        resolution = "keep";
      } else {
        const local = readFileSync(conflict.path, "utf8");
        const incoming = readFileSync(incomingSrc, "utf8");
        resolution = await prompt.ask(conflict.path, local, incoming);
        if (resolution === "replace_all") bulkAction = "replace_all";
        if (resolution === "skip_all") bulkAction = "skip_all";
      }

      if (resolution === "replace" || resolution === "replace_all") {
        if (!dryRun) copyFileSync(incomingSrc, conflict.path);
        conflict.action = "updated";
      } else if (resolution === "keep") {
        const slot = inferTier3Slot(conflict.path);
        if (slot) {
          const name = basename(conflict.path).replace(/\.md$/, "");
          const current = workingConfig[slot] ?? { tier1: "all", tier2: "all", tier3: [] };
          if (!current.tier3.includes(name)) {
            workingConfig = {
              ...workingConfig,
              [slot]: { ...current, tier3: [...current.tier3, name] },
            };
            configMutated = true;
          }
          conflict.action = "skipped";
        } else {
          p.log.warn(
            `Kept ${conflict.path} — no tier3 protection available; this file will be flagged again on next sync.`
          );
          conflict.action = "skipped";
        }
      }
    }

    if (configMutated && !dryRun) {
      writeConfig(workingConfig);
    }
  }
  // If non-interactive (--yes, --force, or non-TTY): keep existing
  // "X conflict(s) skipped" warning. No mutation, no prompt.
}
```

The `basename` and `readFileSync` imports must be added to the existing imports in `sync.ts` if they're not already there. `copyFileSync` is already imported.

- [ ] **Step 5: Run all tests**

Run: `npm test`
Expected: all tests pass including the 2 new conflict integration tests.

- [ ] **Step 6: Run typecheck**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 7: Commit**

```bash
git add src/commands/sync.ts src/types.ts test/sync-conflict-headless.test.ts test/sync-conflict-keep-tier3.test.ts
git commit -m "feat(sync): interactive conflict resolution loop with tier3 keep"
```

---

### Task 6: Write `docs/conflict-resolution.md` walkthrough

**Files:**
- Create: `docs/conflict-resolution.md`
- Modify: `docs/README.md` (index)

- [ ] **Step 1: Create the doc**

```markdown
# Conflict resolution

When `aikit sync` or `aikit update` would overwrite a template file (`.claude/agents/*.md`, `.claude/skills/*.md`, `.claude/commands/*.md`, `.claude/hooks/*`) that you've **modified locally**, you'll see an interactive prompt:

```
Modified locally: .claude/agents/reviewer.md
  ▸ Replace with catalog version (recommended)
    Keep local version (mark as tier3 to silence future prompts)
    Show diff first
    Replace all remaining conflicts
    Skip all remaining conflicts
```

## Options

| Option | Effect |
|---|---|
| **Replace** (default) | Overwrites your local file with the catalog version. Your changes are lost — use `git diff HEAD~1` to recover if you regret it. |
| **Keep** | Preserves your local file. For agents and skills, the file's name is added to `agents.tier3` (or `skills.tier3`) in `.aikitrc.json` so future syncs skip it entirely. |
| **Show diff** | Displays a colored unified diff (3 lines of context). Re-prompts after. |
| **Replace all** | Replaces this file AND all remaining conflicts in this run. No further prompts. |
| **Skip all** | Keeps this file AND all remaining conflicts in this run. Configs are NOT updated for skipped files (no auto-tier3). |

## Headless mode (`--yes`, `--force`, CI)

The prompt only appears when:
- Stdin is a TTY (interactive terminal), AND
- `--yes` was NOT passed, AND
- `--force` was NOT passed.

Otherwise:
- `--force` → silently overwrite all conflicts (current 0.6.x behavior).
- `--yes` (without `--force`) → skip conflicts and report a warning. Sync continues for non-conflicting files.
- Non-TTY (e.g., CI, piped input) → same as `--yes`.

This means existing CI flows are unchanged. The prompt is purely additive for interactive use.

## Limitations (v1)

- **No history tracking.** If a catalog update genuinely changes a file you didn't touch, the diff between your installed version and the new catalog will trigger the prompt — even though you're not the source of the change. We accept this noise in v1; future versions may add per-file hash tracking to distinguish "user modified" from "catalog evolved".
- **Commands and hooks have no tier3.** Choosing "Keep" for `.claude/commands/*.md` or `.claude/hooks/*` skips the file for this run with a warning, but the file will be flagged again on the next sync. To permanently customize a command or hook, fork the catalog or rename the file.
- **No 3-way merge.** "Keep" preserves your file, "Replace" uses the catalog version. There's no chunk-by-chunk merge.
```

- [ ] **Step 2: Update `docs/README.md` index**

Add a row near the other feature docs:

```markdown
- [conflict-resolution.md](conflict-resolution.md) — what happens when `aikit sync` would overwrite a locally-modified file.
```

- [ ] **Step 3: Verify nothing else changed**

Run: `npm test && npm run typecheck && npm run catalog:check`
Expected: all green (docs changes don't affect any of these).

- [ ] **Step 4: Commit**

```bash
git add docs/conflict-resolution.md docs/README.md
git commit -m "docs: walkthrough for interactive conflict resolution"
```

---

### Task 7: Bump version to 0.7.0 + CHANGELOG + README

**Files:**
- Modify: `package.json` (version 0.6.0 → 0.7.0)
- Modify: `src/cli.ts` (the hardcoded VERSION constant — same as the 0.6.0 release)
- Modify: `CHANGELOG.md` (new section at top)
- Modify: `README.md` (one-line note about conflict resolution)

- [ ] **Step 1: Bump versions**

In `package.json`, change `"version": "0.6.0"` to `"version": "0.7.0"`.

In `src/cli.ts`, find the hardcoded `VERSION` constant and change `"0.6.0"` to `"0.7.0"`.

- [ ] **Step 2: Add CHANGELOG entry**

In `CHANGELOG.md`, insert at the top (after the file header, before the `## [0.6.0]` entry):

```markdown
## [0.7.0] - 2026-04-29

### Added
- Interactive conflict resolution: `aikit sync` and `aikit update` now prompt before overwriting locally-modified template files (agents, skills, commands, hooks). Five options: Replace (recommended default), Keep + tier3 (auto-protects future syncs for agents/skills), Show diff, Replace all, Skip all.
- `src/fs/diff.ts` — inline colorized unified diff helper backed by the `diff` package.
- `src/fs/conflict.ts` — `resolveConflict()` interactive prompt + `inferTier3Slot()` path-to-tier3-slot mapper.
- `docs/conflict-resolution.md` — full walkthrough of the prompt UX and headless behavior.

### Changed
- `copyAction()` in `src/commands/sync.ts` now returns `WriteResult.action === "conflict"` (parity with `safeWrite`) when destination differs from incoming and `--force` is not set.
- `WriteResult` interface gains an optional `src` field carrying the catalog source path for copy-style writes.

### Headless behavior (no change for CI)
- `--force` overwrites all conflicts silently (existing behavior).
- `--yes` (without `--force`) skips conflicts with a warning (existing behavior).
- Non-TTY environments behave like `--yes` — never block.

### Known limitations
- v1 has no per-file hash tracking, so legitimate catalog updates will sometimes trigger conflict prompts even for files you didn't modify. Hash tracking is planned for 0.8.0.
- Commands and hooks have no tier3 protection — "Keep" preserves them for the run only.
```

- [ ] **Step 3: Update README**

In `README.md`, find the "What changes after you install it" section. Add a single bullet:

```markdown
- **Conflict-aware sync**: if you've modified an installed template (e.g., `.claude/agents/reviewer.md`), `aikit sync` and `aikit update` now prompt before overwriting — instead of silently replacing it.
```

Place it logically with the other behavior bullets in that section.

- [ ] **Step 4: Run the full release pipeline**

```bash
npm run typecheck
npm test
npm run catalog:check
npm run build
```

All must exit 0.

- [ ] **Step 5: Verify version output**

```bash
node dist/cli.mjs --version
```

Expected: `haac-aikit v0.7.0`.

- [ ] **Step 6: Final smoke test of conflict flow**

```bash
TEST_DIR=$(mktemp -d)
cd "$TEST_DIR"
git init -q
echo "# t" > README.md
git add . && git commit -qm "init"

cat > .aikitrc.json <<'EOF'
{"version":1,"projectName":"t","tools":["claude"],"scope":"standard","shape":["library"],"integrations":{"subagents":true,"mcp":false,"hooks":false,"commands":false,"ci":false,"husky":false},"skills":{"tier1":"all","tier2":"all","tier3":[]},"agents":{"tier1":"all","tier2":"all","tier3":[]},"canonical":"AGENTS.md"}
EOF

# First sync.
node "$OLDPWD/dist/cli.mjs" sync --yes 2>&1 | tail -2

# Modify a file locally.
echo "LOCAL EDIT" > .claude/agents/reviewer.md

# Second sync with --yes — should skip the conflict and warn.
node "$OLDPWD/dist/cli.mjs" sync --yes 2>&1 | tail -5

# Verify the local edit is preserved.
cat .claude/agents/reviewer.md

cd "$OLDPWD"
rm -rf "$TEST_DIR"
```

Expected: the second sync prints a warning about 1 conflict, the local edit is preserved (`cat` shows `LOCAL EDIT`), and exit code is 0.

- [ ] **Step 7: Commit**

```bash
git add package.json src/cli.ts CHANGELOG.md README.md
git commit -m "chore(release): 0.7.0"
```

---

## Self-review notes

After all 7 tasks land:

- **Spec coverage:** Every D1-D6 design decision maps to a task above (D1 → Task 4, D2 → Task 5, D3 → Task 5, D4 → Task 5 + Task 3, D5 → Task 2, D6 → Task 5).
- **Migration safety:** No schema changes. Existing 0.6.x configs work without modification. Only behavior change is the new conflict prompt; CI is unaffected.
- **Test coverage:** Every code path has a test — diff format (Task 2), tier3 slot inference (Task 3), copyAction conflict surfacing (Task 4), headless skip (Task 5), keep+tier3 (Task 5).

## Risks / things to watch during execution

| # | Risk | Mitigation |
|---|---|---|
| 1 | The `runSync` function is large; injecting `_conflictPrompt` cleanly may require a small refactor | Keep the change minimal — accept the prompt as an optional 2nd argument or as a property on the args object. |
| 2 | The `copyAction` signature change cascades to multiple `syncFoo` helpers | Use a `WriteOpts` interface to pass `{ dryRun, force }` consistently. Touched files: only `sync.ts`. |
| 3 | Bulk "skip_all" semantics for agents/skills (do we still update tier3 in bulk skip?) | No — bulk skip leaves config untouched. The user has explicitly opted out of per-file tier3 marking. |
| 4 | The diff package's `createPatch` output format may shift between versions | Pinned to exact version (Task 1). Tests assert structural patterns, not byte-exact output. |

## Out of scope for this plan

- Manifest tracking for "user modified vs catalog updated" disambiguation (deferred to 0.8.0).
- Conflict resolution for markered files (`AGENTS.md`, etc.).
- External pager support for diff display.
- Persistent "always replace" preference in `.aikitrc.json`.
- 3-way merge.
