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
  scope: "standard",
  shape: ["library"],
  integrations: { mcp: false, hooks: false, commands: false, subagents: false, ci: false, husky: false, devcontainer: false, plugin: false, otel: false },
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

describe("sync — Claude 2026 assets", () => {
  it("ships docs/claude-md-reference.md and .claude/rules/example.md at scope=standard", async () => {
    writeConfig(baseConfig);

    await runSync({ _: ["sync"] });

    expect(existsSync("docs/claude-md-reference.md")).toBe(true);
    const ref = readFileSync("docs/claude-md-reference.md", "utf8");
    expect(ref).toContain("CLAUDE.md & Memory Configuration Reference");

    expect(existsSync(".claude/rules/example.md")).toBe(true);
    const rule = readFileSync(".claude/rules/example.md", "utf8");
    expect(rule).toContain("paths:");
    expect(rule).toContain("Example path-scoped rule");
  });

  it("does NOT ship the Claude 2026 assets at scope=minimal", async () => {
    writeConfig({ ...baseConfig, scope: "minimal" });

    await runSync({ _: ["sync"] });

    expect(existsSync("docs/claude-md-reference.md")).toBe(false);
    expect(existsSync(".claude/rules/example.md")).toBe(false);
  });

  it("does NOT ship the Claude 2026 assets when claude is not selected", async () => {
    writeConfig({ ...baseConfig, tools: ["cursor"] });

    await runSync({ _: ["sync"] });

    expect(existsSync("docs/claude-md-reference.md")).toBe(false);
    expect(existsSync(".claude/rules/example.md")).toBe(false);
  });

  it("emphasises and adds compaction guidance to AGENTS.md template", async () => {
    writeConfig(baseConfig);

    await runSync({ _: ["sync"] });

    const agents = readFileSync("AGENTS.md", "utf8");
    expect(agents).toContain("When compacting");
    expect(agents).toContain("Further reading");
    expect(agents).toContain("docs/claude-md-reference.md");
  });
});
