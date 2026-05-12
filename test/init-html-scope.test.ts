import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runSync } from "../src/commands/sync.js";
import type { AikitConfig } from "../src/types.js";

let tmpDir: string;
let origCwd: string;

const htmlConfig: AikitConfig = {
  version: 1,
  projectName: "html-only",
  projectDescription: "",
  tools: ["claude"],
  scope: "html",
  shape: [],
  integrations: {
    mcp: false, hooks: false, commands: false, subagents: false,
    ci: false, husky: false, devcontainer: false, plugin: false, otel: false,
  },
  skills: { tier1: "all", tier2: "all", tier3: [] },
  agents: { tier1: "all", tier2: "all", tier3: [] },
  canonical: "AGENTS.md",
};

function writeConfig(cfg: AikitConfig): void {
  writeFileSync(".aikitrc.json", JSON.stringify(cfg, null, 2));
}

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "haac-init-html-"));
  origCwd = process.cwd();
  process.chdir(tmpDir);
});

afterEach(() => {
  process.chdir(origCwd);
});

describe("sync — html scope (slice install)", () => {
  it("installs the html-artifacts skill", async () => {
    writeConfig(htmlConfig);
    await runSync({ _: ["sync"] });

    expect(existsSync(".claude/skills/html-artifacts.md")).toBe(true);
  });

  it("installs the /html command (claude tool selected)", async () => {
    writeConfig(htmlConfig);
    await runSync({ _: ["sync"] });

    expect(existsSync(".claude/commands/html.md")).toBe(true);
  });

  it("installs all 20 html templates + MANIFEST.json", async () => {
    writeConfig(htmlConfig);
    await runSync({ _: ["sync"] });

    expect(existsSync(".aikit/templates/html-artifacts/MANIFEST.json")).toBe(true);
    const files = readdirSync(".aikit/templates/html-artifacts");
    const htmlFiles = files.filter((f) => f.match(/^\d{2}-.*\.html$/));
    expect(htmlFiles.length).toBe(20);
  });

  it("does NOT install AGENTS.md", async () => {
    writeConfig(htmlConfig);
    await runSync({ _: ["sync"] });

    expect(existsSync("AGENTS.md")).toBe(false);
  });

  it("does NOT install MCP, hooks, agents, CI, devcontainer", async () => {
    writeConfig(htmlConfig);
    await runSync({ _: ["sync"] });

    expect(existsSync(".mcp.json")).toBe(false);
    expect(existsSync(".claude/hooks")).toBe(false);
    expect(existsSync(".claude/agents")).toBe(false);
    expect(existsSync(".github/workflows")).toBe(false);
    expect(existsSync(".devcontainer")).toBe(false);
    expect(existsSync(".husky")).toBe(false);
  });

  it("does NOT install other tier1/tier2 skills", async () => {
    writeConfig(htmlConfig);
    await runSync({ _: ["sync"] });

    expect(existsSync(".claude/skills/html-artifacts.md")).toBe(true);
    const skills = readdirSync(".claude/skills");
    expect(skills).toEqual(["html-artifacts.md"]);
  });

  it("does NOT install other slash commands", async () => {
    writeConfig(htmlConfig);
    await runSync({ _: ["sync"] });

    const commands = readdirSync(".claude/commands");
    expect(commands).toEqual(["html.md"]);
  });

  it("html scope without claude tool: templates land, skill+command do not", async () => {
    // Edge case: someone runs html scope but didn't pick claude as a tool.
    // Templates are tool-agnostic, so they still install. The skill file
    // lives under .claude/, which is Claude-specific by convention — but
    // we install it anyway (it's the whole point of html scope), and the
    // /html command is skipped because it's a Claude slash command.
    const noClaudeConfig = { ...htmlConfig, tools: ["cursor"] as AikitConfig["tools"] };
    writeConfig(noClaudeConfig);
    await runSync({ _: ["sync"] });

    expect(existsSync(".aikit/templates/html-artifacts/MANIFEST.json")).toBe(true);
    expect(existsSync(".claude/skills/html-artifacts.md")).toBe(true);
    expect(existsSync(".claude/commands/html.md")).toBe(false);
  });

  it(".gitignore is updated even in html scope", async () => {
    writeConfig(htmlConfig);
    await runSync({ _: ["sync"] });

    expect(existsSync(".gitignore")).toBe(true);
    const gitignore = readFileSync(".gitignore", "utf8");
    expect(gitignore).toMatch(/\.aikit\//);
  });
});
