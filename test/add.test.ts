import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runAdd } from "../src/commands/add.js";
import type { AikitConfig } from "../src/types.js";

let tmpDir: string;
let origCwd: string;

const baseConfig: AikitConfig = {
  version: 1,
  projectName: "demo",
  projectDescription: "",
  tools: ["claude"],
  scope: "standard",
  shape: [],
  integrations: { mcp: false, hooks: false, commands: false, subagents: false, ci: false, husky: false, devcontainer: false, plugin: false, otel: false },
  skills: { tier1: "all", tier2: "all", tier3: [] },
  canonical: "AGENTS.md",
};

function writeConfig(cfg: AikitConfig): void {
  writeFileSync(".aikitrc.json", JSON.stringify(cfg, null, 2));
}

function readWrittenConfig(): AikitConfig {
  return JSON.parse(readFileSync(".aikitrc.json", "utf8"));
}

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "haac-add-"));
  origCwd = process.cwd();
  process.chdir(tmpDir);
  // Suppress add.ts's stdout noise during tests.
  vi.spyOn(process.stdout, "write").mockImplementation(() => true);
});

afterEach(() => {
  process.chdir(origCwd);
  vi.restoreAllMocks();
});

describe("aikit add — config persistence (regression: pre-0.5 didn't update config)", () => {
  it("adds the matching shape to config.shape when an agent is installed", async () => {
    writeConfig(baseConfig);
    await runAdd({ _: ["add", "backend"] } as never);

    const after = readWrittenConfig();
    expect(after.shape).toContain("backend");
    expect(existsSync(".claude/agents/backend.md")).toBe(true);
  });

  it("adds 'web' shape when frontend agent is installed", async () => {
    writeConfig(baseConfig);
    await runAdd({ _: ["add", "frontend"] } as never);

    expect(readWrittenConfig().shape).toContain("web");
  });

  it("is idempotent — adding the same agent twice doesn't duplicate the shape", async () => {
    writeConfig(baseConfig);
    await runAdd({ _: ["add", "backend"] } as never);
    await runAdd({ _: ["add", "backend"], force: true } as never);

    const shape = readWrittenConfig().shape;
    expect(shape.filter((s) => s === "backend")).toHaveLength(1);
  });

  it("doesn't touch config when adding tier1/tier2 skills (already covered by 'all')", async () => {
    writeConfig(baseConfig);
    await runAdd({ _: ["add", "brainstorming"] } as never);

    const after = readWrittenConfig();
    expect(after.skills.tier3).toEqual([]);
    expect(after.skills.tier1).toBe("all");
  });

  it("turns on integrations.hooks when a hook is added on a fresh config", async () => {
    writeConfig(baseConfig);
    await runAdd({ _: ["add", "block-dangerous-bash"] } as never);

    expect(readWrittenConfig().integrations.hooks).toBe(true);
    expect(existsSync(".claude/hooks/block-dangerous-bash.sh")).toBe(true);
  });
});
