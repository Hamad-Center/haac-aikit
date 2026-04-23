import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { upsertMarkerRegion } from "../src/render/markers.js";

let tmpDir: string;
let origCwd: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "haac-idempotency-"));
  origCwd = process.cwd();
  process.chdir(tmpDir);
});

afterEach(() => {
  process.chdir(origCwd);
});

describe("idempotency — marker upsert", () => {
  it("applying the same content twice produces identical output", () => {
    const filePath = "AGENTS.md";
    const managed = "# Managed section\nsome content";

    const { replaced: first } = upsertMarkerRegion("", managed, filePath);
    writeFileSync(filePath, first);

    const { replaced: second } = upsertMarkerRegion(first, managed, filePath);
    expect(second).toBe(first);
  });

  it("user content outside markers is preserved after repeated upserts", () => {
    const filePath = "AGENTS.md";
    const userContent = "# My project\nCustom user content here\n";
    const managed = "managed content v1";

    const { replaced: initial } = upsertMarkerRegion(userContent, managed, filePath);
    writeFileSync(filePath, initial);

    const managedV2 = "managed content v2";
    const { replaced: updated } = upsertMarkerRegion(initial, managedV2, filePath);

    expect(updated).toContain("Custom user content here");
    expect(updated).toContain("managed content v2");
    expect(updated).not.toContain("managed content v1");
  });

  it("appending new markers does not corrupt existing non-managed content", () => {
    const filePath = "AGENTS.md";
    const existingUserOwned =
      "# Header\n\nSome text.\n\n## Section\n\nMore text.\n";

    const { replaced } = upsertMarkerRegion(existingUserOwned, "injected", filePath);

    expect(replaced).toContain("# Header");
    expect(replaced).toContain("Some text.");
    expect(replaced).toContain("## Section");
    expect(replaced).toContain("More text.");
    expect(replaced).toContain("injected");
    expect(replaced).toContain("<!-- BEGIN:haac-aikit -->");
  });
});
