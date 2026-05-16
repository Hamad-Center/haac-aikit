import { spawnSync } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(TEST_DIR, "..");
const CHECK_SCRIPT = join(REPO_ROOT, "scripts", "catalog-check.js");

// Run catalog-check.js against a fixture repo (so we don't touch the real
// catalog). The script resolves `repoRoot` from its own location via __filename,
// so we copy it into the fixture and invoke that copy.
function runCheck(fixtureRoot: string): { code: number; stdout: string; stderr: string } {
  const scriptInFixture = join(fixtureRoot, "scripts", "catalog-check.js");
  mkdirSync(join(fixtureRoot, "scripts"), { recursive: true });
  cpSync(CHECK_SCRIPT, scriptInFixture);

  const result = spawnSync(process.execPath, [scriptInFixture], { encoding: "utf8" });
  return {
    code: result.status ?? -1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

function writeSkill(
  fixtureRoot: string,
  tier: "tier1" | "tier2",
  name: string,
  body: string,
): void {
  const dir = join(fixtureRoot, "catalog", "skills", tier, name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "SKILL.md"), body);
}

function scaffoldMinimalCatalog(fixtureRoot: string): void {
  // catalog-check requires both agent tiers and a couple of templates+commands.
  // Seed the minimum so we can target the skill checks specifically.
  const agentBody = `---
name: orchestrator
description: stub
model: claude-sonnet-4-6
---
body
`;
  mkdirSync(join(fixtureRoot, "catalog", "agents", "tier1"), { recursive: true });
  mkdirSync(join(fixtureRoot, "catalog", "agents", "tier2"), { recursive: true });
  writeFileSync(join(fixtureRoot, "catalog", "agents", "tier1", "orchestrator.md"), agentBody);

  for (const pack of ["docs", "decide", "directions", "roadmap"]) {
    const dir = join(fixtureRoot, "catalog", "templates", pack);
    mkdirSync(dir, { recursive: true });
    const file = pack === "docs" ? "starter.html" : "template.html";
    writeFileSync(join(dir, file), "<html></html>");
  }
  mkdirSync(join(fixtureRoot, "catalog", "commands"), { recursive: true });
  for (const name of ["docs", "decide", "directions", "roadmap"]) {
    writeSkill(fixtureRoot, "tier1", name, validSkill(name));
    writeFileSync(join(fixtureRoot, "catalog", "commands", `${name}.md`), "stub");
  }
  // The skill checks demand tier2 exist as a directory even if empty.
  mkdirSync(join(fixtureRoot, "catalog", "skills", "tier2"), { recursive: true });
}

function validSkill(name: string): string {
  return `---
name: ${name}
description: A skill named ${name}.
allowed-tools: Read, Edit
---

body
`;
}

let fixtureRoot: string;

beforeEach(() => {
  fixtureRoot = mkdtempSync(join(tmpdir(), "haac-catalog-check-"));
});

afterEach(() => {
  rmSync(fixtureRoot, { recursive: true, force: true });
});

describe("catalog-check.js — folder-format validation", () => {
  it("passes on a well-formed minimal catalog", () => {
    scaffoldMinimalCatalog(fixtureRoot);
    const { code, stdout } = runCheck(fixtureRoot);
    expect(code).toBe(0);
    expect(stdout).toContain("all checks passed");
  });

  it("fails when a tier directory contains a loose .md file", () => {
    scaffoldMinimalCatalog(fixtureRoot);
    writeFileSync(
      join(fixtureRoot, "catalog", "skills", "tier1", "stray.md"),
      "---\nname: stray\ndescription: x\nallowed-tools: Read\n---",
    );
    const { code, stderr } = runCheck(fixtureRoot);
    expect(code).toBe(1);
    expect(stderr).toMatch(/must not contain flat \.md files/);
  });

  it("fails when a skill folder is missing SKILL.md", () => {
    scaffoldMinimalCatalog(fixtureRoot);
    mkdirSync(join(fixtureRoot, "catalog", "skills", "tier2", "empty"), { recursive: true });
    const { code, stderr } = runCheck(fixtureRoot);
    expect(code).toBe(1);
    expect(stderr).toMatch(/missing required SKILL\.md/);
  });

  it("fails when frontmatter name doesn't match folder name", () => {
    scaffoldMinimalCatalog(fixtureRoot);
    writeSkill(fixtureRoot, "tier2", "renamed", validSkill("old-name"));
    const { code, stderr } = runCheck(fixtureRoot);
    expect(code).toBe(1);
    expect(stderr).toMatch(/does not match folder name/);
  });

  it("fails when allowed-tools is missing", () => {
    scaffoldMinimalCatalog(fixtureRoot);
    writeSkill(
      fixtureRoot,
      "tier2",
      "noperms",
      `---
name: noperms
description: x
---
body
`,
    );
    const { code, stderr } = runCheck(fixtureRoot);
    expect(code).toBe(1);
    expect(stderr).toMatch(/missing 'allowed-tools:'/);
  });

  it("fails when allowed-tools is present but empty", () => {
    scaffoldMinimalCatalog(fixtureRoot);
    writeSkill(
      fixtureRoot,
      "tier2",
      "empty-tools",
      `---
name: empty-tools
description: x
allowed-tools:
---
body
`,
    );
    const { code, stderr } = runCheck(fixtureRoot);
    expect(code).toBe(1);
    expect(stderr).toMatch(/has no tools listed/);
  });

  it("fails when an unrecognized entry sits at a tier root (orphan check)", () => {
    scaffoldMinimalCatalog(fixtureRoot);
    writeFileSync(join(fixtureRoot, "catalog", "skills", "tier1", "typo.mdx"), "x");
    const { code, stderr } = runCheck(fixtureRoot);
    expect(code).toBe(1);
    expect(stderr).toMatch(/unrecognized entries/);
  });

  it("tolerates .DS_Store in a tier directory", () => {
    scaffoldMinimalCatalog(fixtureRoot);
    writeFileSync(join(fixtureRoot, "catalog", "skills", "tier1", ".DS_Store"), "");
    const { code } = runCheck(fixtureRoot);
    expect(code).toBe(0);
  });

  it("accepts allowed-tools as a YAML block sequence", () => {
    scaffoldMinimalCatalog(fixtureRoot);
    writeSkill(
      fixtureRoot,
      "tier2",
      "blocky",
      `---
name: blocky
description: x
allowed-tools:
  - Read
  - Edit
---
body
`,
    );
    const { code } = runCheck(fixtureRoot);
    expect(code).toBe(0);
  });
});
