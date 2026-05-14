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
  integrations: {
    mcp: false, hooks: false, commands: false, subagents: true, ci: false,
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
    expect(agents).toContain("pr-describer.md");
  });

  it("installs every tier2 agent when agents.tier2 is 'all'", async () => {
    writeConfig({
      ...baseConfig,
      agents: { tier1: "all", tier2: "all", tier3: [] },
    });
    await runSync({ _: ["sync"] });

    const agents = listAgents();
    expect(agents).toContain("frontend.md");
    expect(agents).toContain("backend.md");
    expect(agents).toContain("mobile.md");
  });

  it("installs only explicit tier2 opt-ins when agents.tier2 is a list", async () => {
    writeConfig({
      ...baseConfig,
      agents: { tier1: "all", tier2: ["backend"], tier3: [] },
    });
    await runSync({ _: ["sync"] });

    const agents = listAgents();
    expect(agents).toContain("backend.md");
    expect(agents).not.toContain("frontend.md");
    expect(agents).not.toContain("mobile.md");
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
