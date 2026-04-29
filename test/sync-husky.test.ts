import { existsSync, mkdtempSync, statSync, writeFileSync } from "node:fs";
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
    mcp: false, hooks: false, commands: false, subagents: false,
    ci: false, husky: true, devcontainer: false, plugin: false, otel: false,
  },
};

function writeConfig(cfg: AikitConfig): void {
  writeFileSync(".aikitrc.json", JSON.stringify(cfg, null, 2));
}

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "haac-sync-husky-"));
  origCwd = process.cwd();
  process.chdir(tmpDir);
});

afterEach(() => {
  process.chdir(origCwd);
});

describe("sync — husky integration", () => {
  it("installs husky scripts when husky integration enabled", async () => {
    writeConfig(baseConfig);
    await runSync({ _: ["sync"] });

    expect(existsSync(".husky/pre-commit")).toBe(true);
    expect(existsSync(".husky/commit-msg")).toBe(true);
    expect(existsSync(".husky/pre-push")).toBe(true);
  });

  it("installs husky scripts with the executable bit set", async () => {
    writeConfig(baseConfig);
    await runSync({ _: ["sync"] });

    const stat = statSync(".husky/pre-commit");
    // owner-exec bit (0o100) must be set
    expect((stat.mode & 0o100) !== 0).toBe(true);
  });

  it("installs all husky files (scripts + configs)", async () => {
    writeConfig(baseConfig);
    await runSync({ _: ["sync"] });

    expect(existsSync(".husky/commitlint.config.js")).toBe(true);
    expect(existsSync(".husky/gitleaks.toml")).toBe(true);
    expect(existsSync(".husky/lintstagedrc.json")).toBe(true);
  });

  it("does NOT install husky files when integration is disabled", async () => {
    writeConfig({
      ...baseConfig,
      integrations: { ...baseConfig.integrations, husky: false },
    });
    await runSync({ _: ["sync"] });

    expect(existsSync(".husky")).toBe(false);
  });
});
