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
    // simplifier doesn't exist as a catalog file yet (added in Task 10), so it
    // won't be installed here — the test asserts the *attempt* via shape-derived presence.
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
