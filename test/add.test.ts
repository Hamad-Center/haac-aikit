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
  integrations: { mcp: false, hooks: false, commands: false, subagents: false, ci: false },
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

describe("aikit add — config persistence", () => {
  it("installs a tier2 agent and adds it to agents.tier2 when tier2 isn't 'all'", async () => {
    writeConfig({
      ...baseConfig,
      agents: { tier1: "all", tier2: [], tier3: [] },
    });
    await runAdd({ _: ["add", "backend"] } as never);

    const after = readWrittenConfig();
    expect(after.agents?.tier2).toContain("backend");
    expect(existsSync(".claude/agents/backend.md")).toBe(true);
  });

  it("is idempotent — adding the same agent twice doesn't duplicate the entry", async () => {
    writeConfig({
      ...baseConfig,
      agents: { tier1: "all", tier2: [], tier3: [] },
    });
    await runAdd({ _: ["add", "backend"] } as never);
    await runAdd({ _: ["add", "backend"], force: true } as never);

    const tier2 = readWrittenConfig().agents?.tier2;
    expect(Array.isArray(tier2) && tier2.filter((a) => a === "backend")).toHaveLength(1);
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

describe("aikit add --html — HTML-artifact bundle", () => {
  const expectedSkills = ["docs", "decide", "directions", "roadmap"];
  const expectedTemplates = [
    "docs/starter.html",
    "decide/template.html",
    "directions/template.html",
    "roadmap/template.html",
  ];

  it("installs all four skills, commands, and template packs in one shot", async () => {
    writeConfig(baseConfig);
    await runAdd({ _: ["add"], html: true } as never);

    for (const name of expectedSkills) {
      expect(existsSync(`.claude/skills/${name}.md`), `skill ${name}`).toBe(true);
      expect(existsSync(`.claude/commands/${name}.md`), `command /${name}`).toBe(true);
    }
    for (const path of expectedTemplates) {
      expect(existsSync(`.aikit/templates/${path}`), `template ${path}`).toBe(true);
    }
  });

  it("is idempotent — a second run doesn't error and writes nothing new", async () => {
    writeConfig(baseConfig);
    await runAdd({ _: ["add"], html: true } as never);
    await runAdd({ _: ["add"], html: true } as never);

    // Files still exist and weren't deleted.
    for (const name of expectedSkills) {
      expect(existsSync(`.claude/skills/${name}.md`)).toBe(true);
    }
  });

  it("respects --dry-run by listing files but not writing them", async () => {
    writeConfig(baseConfig);
    await runAdd({ _: ["add"], html: true, "dry-run": true } as never);

    for (const name of expectedSkills) {
      expect(existsSync(`.claude/skills/${name}.md`), `skill ${name} (dry-run)`).toBe(false);
    }
    for (const path of expectedTemplates) {
      expect(existsSync(`.aikit/templates/${path}`), `template ${path} (dry-run)`).toBe(false);
    }
  });
});
