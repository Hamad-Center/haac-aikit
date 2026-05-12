import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runScaffold } from "../src/commands/scaffold.js";
import type { CliArgs } from "../src/types.js";

let tmpDir: string;
let origCwd: string;

function args(overrides: Partial<CliArgs> & { _: string[] }): CliArgs {
  return {
    _: overrides._,
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

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "haac-scaffold-"));
  origCwd = process.cwd();
  process.chdir(tmpDir);
  vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  // Re-throw so the test can catch instead of terminating the runner.
  vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
    throw new Error(`process.exit(${code ?? 0})`);
  }) as never);
});

afterEach(() => {
  process.chdir(origCwd);
  vi.restoreAllMocks();
});

describe("aikit scaffold html", () => {
  it("--list prints all templates and returns", async () => {
    const writes: string[] = [];
    vi.spyOn(process.stdout, "write").mockImplementation((chunk: unknown) => {
      writes.push(String(chunk));
      return true;
    });
    await runScaffold(args({ _: ["scaffold", "html"], list: true }));

    const output = writes.join("");
    expect(output).toContain("html-artifact templates");
    expect(output).toContain("20 total");
    expect(output).toContain("pr-review");
    expect(output).toContain("Custom Editing Interfaces");
  });

  it("scaffolds by slug — writes the file with the template's own name", async () => {
    await runScaffold(args({ _: ["scaffold", "html", "pr-review"] }));
    expect(existsSync(join(tmpDir, "03-code-review-pr.html"))).toBe(true);
    const content = readFileSync(join(tmpDir, "03-code-review-pr.html"), "utf8");
    expect(content).toContain("<html");
  });

  it("scaffolds by number — '03' resolves the same as 'pr-review'", async () => {
    await runScaffold(args({ _: ["scaffold", "html", "03"] }));
    expect(existsSync(join(tmpDir, "03-code-review-pr.html"))).toBe(true);
  });

  it("accepts bare numbers without leading zero — '3' resolves like '03'", async () => {
    await runScaffold(args({ _: ["scaffold", "html", "3"] }));
    expect(existsSync(join(tmpDir, "03-code-review-pr.html"))).toBe(true);
  });

  it("--name overrides the output filename", async () => {
    await runScaffold(args({ _: ["scaffold", "html", "pr-review"], name: "my-review.html" }));
    expect(existsSync(join(tmpDir, "my-review.html"))).toBe(true);
    expect(existsSync(join(tmpDir, "03-code-review-pr.html"))).toBe(false);
  });

  it("--dry-run prints intent but does not write", async () => {
    await runScaffold(args({ _: ["scaffold", "html", "pr-review"], "dry-run": true }));
    expect(existsSync(join(tmpDir, "03-code-review-pr.html"))).toBe(false);
  });

  it("refuses to overwrite an existing file without --force", async () => {
    writeFileSync(join(tmpDir, "03-code-review-pr.html"), "PRE-EXISTING");
    await expect(
      runScaffold(args({ _: ["scaffold", "html", "pr-review"] }))
    ).rejects.toThrow(/process\.exit\(1\)/);
    expect(readFileSync(join(tmpDir, "03-code-review-pr.html"), "utf8")).toBe("PRE-EXISTING");
  });

  it("--force overwrites an existing file", async () => {
    writeFileSync(join(tmpDir, "03-code-review-pr.html"), "PRE-EXISTING");
    await runScaffold(args({ _: ["scaffold", "html", "pr-review"], force: true }));
    const after = readFileSync(join(tmpDir, "03-code-review-pr.html"), "utf8");
    expect(after).not.toBe("PRE-EXISTING");
    expect(after).toContain("<html");
  });

  it("errors with exit 1 when the slug is unknown", async () => {
    await expect(
      runScaffold(args({ _: ["scaffold", "html", "definitely-not-a-template"] }))
    ).rejects.toThrow(/process\.exit\(1\)/);
  });

  it("errors with exit 1 when scaffold kind is missing", async () => {
    await expect(runScaffold(args({ _: ["scaffold"] }))).rejects.toThrow(
      /process\.exit\(1\)/
    );
  });

  it("errors with exit 1 when scaffold kind is unsupported", async () => {
    await expect(
      runScaffold(args({ _: ["scaffold", "markdown"] }))
    ).rejects.toThrow(/process\.exit\(1\)/);
  });
});
