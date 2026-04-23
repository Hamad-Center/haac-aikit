import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readConfig, writeConfig } from "../src/fs/readConfig.js";
import type { AikitConfig } from "../src/types.js";

let tmpDir: string;
let origCwd: string;

const VALID_CONFIG: AikitConfig = {
  version: 1,
  projectName: "my-project",
  tools: ["claude", "cursor"],
  scope: "standard",
  shape: ["web"],
  integrations: {
    mcp: true,
    hooks: true,
    commands: true,
    subagents: true,
    ci: true,
    husky: false,
  },
  skills: { tier1: "all", tier2: "all", tier3: [] },
  canonical: "AGENTS.md",
};

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "haac-config-test-"));
  origCwd = process.cwd();
  process.chdir(tmpDir);
});

afterEach(() => {
  process.chdir(origCwd);
});

describe("readConfig", () => {
  it("returns null when no config file exists", () => {
    expect(readConfig()).toBeNull();
  });

  it("reads a valid config", () => {
    writeFileSync(".aikitrc.json", JSON.stringify(VALID_CONFIG));
    const config = readConfig();
    expect(config?.projectName).toBe("my-project");
    expect(config?.tools).toContain("claude");
  });

  it("throws on invalid JSON", () => {
    writeFileSync(".aikitrc.json", "{ invalid json");
    expect(() => readConfig()).toThrow("invalid JSON");
  });

  it("throws on unsupported version", () => {
    writeFileSync(".aikitrc.json", JSON.stringify({ ...VALID_CONFIG, version: 99 }));
    expect(() => readConfig()).toThrow("unsupported version");
  });
});

describe("writeConfig", () => {
  it("writes a valid config file", () => {
    writeConfig(VALID_CONFIG);
    const read = readConfig();
    expect(read?.projectName).toBe("my-project");
  });

  it("round-trips correctly", () => {
    writeConfig(VALID_CONFIG);
    const read = readConfig();
    expect(read?.tools).toEqual(VALID_CONFIG.tools);
    expect(read?.integrations.mcp).toBe(true);
  });
});
