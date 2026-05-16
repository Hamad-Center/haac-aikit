import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
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
  projectDescription: "demo project",
  tools: ["claude"],
  integrations: { mcp: false, hooks: false, commands: false, subagents: false, ci: false },
  skills: { tier1: "all", tier2: "all", tier3: [] },
  canonical: "AGENTS.md",
};

function writeConfig(cfg: AikitConfig): void {
  writeFileSync(".aikitrc.json", JSON.stringify(cfg, null, 2));
}

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "haac-sync-claude-"));
  origCwd = process.cwd();
  process.chdir(tmpDir);
});

afterEach(() => {
  process.chdir(origCwd);
});

describe("sync — Claude assets", () => {
  it("ships .claude/rules/example.md and .claude/aikit-rules.json when claude is selected", async () => {
    writeConfig(baseConfig);

    await runSync({ _: ["sync"] });

    expect(existsSync(".claude/rules/example.md")).toBe(true);
    const rule = readFileSync(".claude/rules/example.md", "utf8");
    expect(rule).toContain("paths:");
    expect(rule).toContain("Example path-scoped rule");

    expect(existsSync(".claude/aikit-rules.json")).toBe(true);
    const rulesCfg = JSON.parse(readFileSync(".claude/aikit-rules.json", "utf8"));
    expect(rulesCfg.version).toBe(1);
    expect(Array.isArray(rulesCfg.rules)).toBe(true);
  });

  it("installs tier1 + tier2 skills as folder-format SKILL.md files", async () => {
    writeConfig(baseConfig);

    await runSync({ _: ["sync"] });

    // Spot-check a representative skill from each tier — the regression that
    // motivated this test had sync silently installing zero skills.
    expect(existsSync(".claude/skills/brainstorming/SKILL.md")).toBe(true);
    expect(existsSync(".claude/skills/api-design/SKILL.md")).toBe(true);

    // Sibling files in a skill folder (spec-kit/references/*) must ride along.
    expect(existsSync(".claude/skills/spec-kit/references/constitution.md")).toBe(true);

    // Sanity floor: at least 14 tier1 + 12 tier2 skills as of this PR.
    const installed = readFileSync(
      ".claude/skills/brainstorming/SKILL.md",
      "utf8",
    );
    expect(installed).toContain("name: brainstorming");
  });

  it("does NOT ship the Claude assets when claude is not selected", async () => {
    writeConfig({ ...baseConfig, tools: ["cursor"] });

    await runSync({ _: ["sync"] });

    expect(existsSync(".claude/rules/example.md")).toBe(false);
    expect(existsSync(".claude/aikit-rules.json")).toBe(false);
  });

  it("emphasises and adds compaction guidance to AGENTS.md template", async () => {
    writeConfig(baseConfig);

    await runSync({ _: ["sync"] });

    const agents = readFileSync("AGENTS.md", "utf8");
    expect(agents).toContain("When compacting");
  });
});
