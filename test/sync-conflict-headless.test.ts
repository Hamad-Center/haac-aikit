import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
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
  integrations: {
    mcp: false, hooks: false, commands: false, subagents: true, ci: false,
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
    await runSync({ _: ["sync"], yes: true, "dry-run": false, force: false, "skip-git-check": false, "no-color": false, help: false, version: false });

    // Modify a tier1 agent locally.
    const modifiedPath = ".claude/agents/orchestrator.md";
    writeFileSync(modifiedPath, "LOCAL MODIFICATION");

    // Second sync with --yes — should NOT overwrite.
    await runSync({ _: ["sync"], yes: true, "dry-run": false, force: false, "skip-git-check": false, "no-color": false, help: false, version: false });

    // The local modification must NOT have been overwritten.
    expect(readFileSync(modifiedPath, "utf8")).toBe("LOCAL MODIFICATION");
  });

  it("overwrites conflicts when --force is passed", async () => {
    writeFileSync(".aikitrc.json", JSON.stringify(baseConfig));
    await runSync({ _: ["sync"], yes: true, "dry-run": false, force: false, "skip-git-check": false, "no-color": false, help: false, version: false });

    const modifiedPath = ".claude/agents/orchestrator.md";
    writeFileSync(modifiedPath, "LOCAL MODIFICATION");

    await runSync({ _: ["sync"], yes: true, "dry-run": false, force: true, "skip-git-check": false, "no-color": false, help: false, version: false });

    // Local mod is now gone; orchestrator.md matches catalog.
    expect(readFileSync(modifiedPath, "utf8")).not.toBe("LOCAL MODIFICATION");
    expect(readFileSync(modifiedPath, "utf8").toLowerCase()).toContain("orchestrator");
  });
});
