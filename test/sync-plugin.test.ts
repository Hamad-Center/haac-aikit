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
  projectName: "myproject",
  projectDescription: "demo",
  tools: ["claude"],
  scope: "standard",
  shape: ["library"],
  integrations: {
    mcp: false, hooks: false, commands: false, subagents: false,
    ci: false, husky: false, devcontainer: false, plugin: true, otel: false,
  },
};

function writeConfig(cfg: AikitConfig): void {
  writeFileSync(".aikitrc.json", JSON.stringify(cfg, null, 2));
}

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "haac-sync-plugin-"));
  origCwd = process.cwd();
  process.chdir(tmpDir);
});

afterEach(() => {
  process.chdir(origCwd);
});

describe("sync — plugin integration", () => {
  it("installs plugin.json with projectName interpolated", async () => {
    writeConfig(baseConfig);
    await runSync({ _: ["sync"] });

    expect(existsSync(".claude/plugin/plugin.json")).toBe(true);
    const content = readFileSync(".claude/plugin/plugin.json", "utf8");
    const parsed = JSON.parse(content);
    expect(parsed.name).toBe("myproject-aikit");
    expect(parsed.name).not.toContain("{{");
  });

  it("leaves no unreplaced template tokens in plugin.json", async () => {
    writeConfig(baseConfig);
    await runSync({ _: ["sync"] });

    const content = readFileSync(".claude/plugin/plugin.json", "utf8");
    expect(content).not.toContain("{{");
    expect(content).not.toContain("}}");
  });

  it("does NOT install plugin.json when integration is disabled", async () => {
    writeConfig({
      ...baseConfig,
      integrations: { ...baseConfig.integrations, plugin: false },
    });
    await runSync({ _: ["sync"] });

    expect(existsSync(".claude/plugin/plugin.json")).toBe(false);
  });
});
