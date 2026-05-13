import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runWhatsNew } from "../src/commands/whatsnew.js";
import type { CliArgs } from "../src/types.js";

function args(overrides: Partial<CliArgs> = {}): CliArgs {
  return {
    _: ["whatsnew"],
    yes: false,
    "dry-run": false,
    force: false,
    "skip-git-check": false,
    "no-color": false,
    help: false,
    version: false,
    ...overrides,
  } as CliArgs;
}

let stdout: string[];

beforeEach(() => {
  stdout = [];
  vi.spyOn(process.stdout, "write").mockImplementation((chunk: unknown) => {
    stdout.push(String(chunk));
    return true;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("aikit whatsnew", () => {
  it("prints the latest release headline and highlights", async () => {
    await runWhatsNew(args());
    const output = stdout.join("");
    expect(output).toContain("haac-aikit v0.11.0");
    expect(output).toContain("Highlights");
    expect(output).toContain("/docs");
  });

  it("includes the migration section when present", async () => {
    await runWhatsNew(args());
    const output = stdout.join("");
    expect(output).toContain("Migration");
    expect(output).toContain("aikit sync");
  });

  it("prints links when present", async () => {
    await runWhatsNew(args());
    const output = stdout.join("");
    expect(output).toContain("CHANGELOG");
    expect(output).toContain("github.com");
  });

  it("--all flag shows all releases (not just latest)", async () => {
    await runWhatsNew(args({ all: true }));
    const output = stdout.join("");
    expect(output).toContain("haac-aikit v0.11.0");
    expect(output).toContain("haac-aikit v0.9.0");
    // The "showing latest only" hint should NOT appear when --all is set.
    expect(output).not.toContain("showing latest only");
  });

  it("without --all, hints at --all when multiple releases exist", async () => {
    await runWhatsNew(args());
    const output = stdout.join("");
    // With 2+ releases in the catalog, the latest-only path should surface a
    // hint pointing at --all for the full history.
    expect(output).toContain("showing latest only");
  });
});
