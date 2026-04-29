import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { copyAction } from "../src/commands/sync.js";

let tmpDir: string;
let origCwd: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "haac-copy-action-"));
  origCwd = process.cwd();
  process.chdir(tmpDir);
});

afterEach(() => {
  process.chdir(origCwd);
});

describe("copyAction", () => {
  it("returns 'created' when destination doesn't exist", () => {
    mkdirSync("src", { recursive: true });
    writeFileSync("src/foo.md", "hello");
    const result = copyAction("src/foo.md", "dest/foo.md", { dryRun: false, force: false });
    expect(result.action).toBe("created");
    expect(readFileSync("dest/foo.md", "utf8")).toBe("hello");
  });

  it("returns 'skipped' when destination matches incoming", () => {
    mkdirSync("src", { recursive: true });
    mkdirSync("dest", { recursive: true });
    writeFileSync("src/foo.md", "same");
    writeFileSync("dest/foo.md", "same");
    const result = copyAction("src/foo.md", "dest/foo.md", { dryRun: false, force: false });
    expect(result.action).toBe("skipped");
  });

  it("returns 'conflict' when destination differs and force=false", () => {
    mkdirSync("src", { recursive: true });
    mkdirSync("dest", { recursive: true });
    writeFileSync("src/foo.md", "incoming");
    writeFileSync("dest/foo.md", "local-modification");
    const result = copyAction("src/foo.md", "dest/foo.md", { dryRun: false, force: false });
    expect(result.action).toBe("conflict");
    // Destination is NOT overwritten on conflict.
    expect(readFileSync("dest/foo.md", "utf8")).toBe("local-modification");
  });

  it("returns 'updated' when destination differs and force=true", () => {
    mkdirSync("src", { recursive: true });
    mkdirSync("dest", { recursive: true });
    writeFileSync("src/foo.md", "incoming");
    writeFileSync("dest/foo.md", "local-modification");
    const result = copyAction("src/foo.md", "dest/foo.md", { dryRun: false, force: true });
    expect(result.action).toBe("updated");
    expect(readFileSync("dest/foo.md", "utf8")).toBe("incoming");
  });

  it("never writes on dryRun=true", () => {
    mkdirSync("src", { recursive: true });
    mkdirSync("dest", { recursive: true });
    writeFileSync("src/foo.md", "incoming");
    writeFileSync("dest/foo.md", "local-modification");
    const result = copyAction("src/foo.md", "dest/foo.md", { dryRun: true, force: true });
    expect(result.action).toBe("updated");
    // Destination unchanged on dry run.
    expect(readFileSync("dest/foo.md", "utf8")).toBe("local-modification");
  });
});
