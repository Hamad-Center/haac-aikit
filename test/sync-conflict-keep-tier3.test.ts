import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runSync } from "../src/commands/sync.js";
import type { AikitConfig, ConflictResolution } from "../src/types.js";

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

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "haac-conflict-keep-"));
  origCwd = process.cwd();
  process.chdir(tmpDir);
});

afterEach(() => {
  process.chdir(origCwd);
});

describe("sync — Keep + tier3", () => {
  it("adds the file's name to agents.tier3 when 'keep' is chosen", async () => {
    writeFileSync(".aikitrc.json", JSON.stringify(baseConfig));
    await runSync({ _: ["sync"], yes: true, "dry-run": false, force: false, "skip-git-check": false, "no-color": false, help: false, version: false });

    // Modify orchestrator locally.
    writeFileSync(".claude/agents/orchestrator.md", "LOCAL MODIFICATION");

    // Inject a stub prompt that always answers "keep". Cast args to `never`
    // because `_conflictPrompt` is a private testability hook; the production
    // CliArgs type doesn't know about it.
    const stubPrompt = {
      ask: async (): Promise<ConflictResolution> => "keep",
    };

    await runSync({ _: ["sync"], yes: false, "dry-run": false, force: false, "skip-git-check": false, "no-color": false, help: false, version: false, _conflictPrompt: stubPrompt } as never);

    const cfg = JSON.parse(readFileSync(".aikitrc.json", "utf8"));
    expect(cfg.agents?.tier3).toContain("orchestrator");
    // Local mod preserved.
    expect(readFileSync(".claude/agents/orchestrator.md", "utf8")).toBe("LOCAL MODIFICATION");
  });
});
