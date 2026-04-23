import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { safeWrite } from "../src/fs/safeWrite.js";

let tmpDir: string;
let origCwd: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "haac-test-"));
  origCwd = process.cwd();
  process.chdir(tmpDir);
});

afterEach(() => {
  process.chdir(origCwd);
});

describe("safeWrite", () => {
  it("creates a new file when it does not exist", () => {
    const result = safeWrite("test.md", "hello", { useMarkers: false });
    expect(result.action).toBe("created");
    expect(readFileSync("test.md", "utf8")).toBe("hello");
  });

  it("reports conflict when file exists and useMarkers is false", () => {
    writeFileSync("test.md", "existing");
    const result = safeWrite("test.md", "new content", { useMarkers: false });
    expect(result.action).toBe("conflict");
    expect(readFileSync("test.md", "utf8")).toBe("existing");
  });

  it("overwrites with --force even when file exists", () => {
    writeFileSync("test.md", "existing");
    const result = safeWrite("test.md", "new content", { useMarkers: false, force: true });
    expect(result.action).toBe("updated");
    expect(readFileSync("test.md", "utf8")).toBe("new content");
  });

  it("upserts marker region when useMarkers=true and file already has markers", () => {
    writeFileSync(
      "AGENTS.md",
      "# Header\n<!-- BEGIN:haac-aikit -->\nold content\n<!-- END:haac-aikit -->\n## Footer\n"
    );
    const result = safeWrite("AGENTS.md", "ignored", {
      useMarkers: true,
      managedContent: "new content",
    });
    expect(result.action).toBe("updated");
    const content = readFileSync("AGENTS.md", "utf8");
    expect(content).toContain("new content");
    expect(content).not.toContain("old content");
    expect(content).toContain("# Header");
    expect(content).toContain("## Footer");
  });

  it("does not write when dryRun=true", () => {
    const result = safeWrite("test.md", "hello", { useMarkers: false, dryRun: true });
    expect(result.action).toBe("created");
    expect(existsSync("test.md")).toBe(false);
  });

  it("creates parent directories as needed", () => {
    const result = safeWrite("deep/nested/dir/file.md", "content", { useMarkers: false });
    expect(result.action).toBe("created");
    expect(existsSync("deep/nested/dir/file.md")).toBe(true);
  });
});
