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

  it("reports skipped when content is byte-identical (regression: pre-fix false 'conflict')", () => {
    writeFileSync("test.md", "hello");
    const result = safeWrite("test.md", "hello", { useMarkers: false });
    expect(result.action).toBe("skipped");
  });

  it("reports skipped for marker-managed files when content is unchanged", () => {
    const filePath = "test.md";
    // The file on disk has full content with markers around an inner region.
    // managedContent is the INNER region only — this matches sync.ts's
    // extractMarkerRegion-based passing convention (regression: pre-0.5
    // sync.ts passed the whole file, which double-wrapped on every re-run).
    const initial = "intro\n<!-- BEGIN:haac-aikit -->\nmanaged\n<!-- END:haac-aikit -->\nouter";
    writeFileSync(filePath, initial);
    const result = safeWrite(filePath, initial, {
      useMarkers: true,
      managedContent: "managed",
    });
    expect(result.action).toBe("skipped");
  });

  it("does not nest BEGIN/END markers on repeated syncs (regression: pre-0.5 nesting bug)", () => {
    const filePath = "test.md";
    const initial = "# Project\n\n<!-- BEGIN:haac-aikit -->\noriginal\n<!-- END:haac-aikit -->\n";
    writeFileSync(filePath, initial);

    // First sync — inner content changes.
    safeWrite(filePath, initial, { useMarkers: true, managedContent: "updated" });
    // Second sync with the same managedContent should NOT add more markers.
    safeWrite(filePath, initial, { useMarkers: true, managedContent: "updated" });

    const final = readFileSync(filePath, "utf8");
    const beginCount = (final.match(/BEGIN:haac-aikit/g) ?? []).length;
    const endCount = (final.match(/END:haac-aikit/g) ?? []).length;
    expect(beginCount).toBe(1);
    expect(endCount).toBe(1);
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
