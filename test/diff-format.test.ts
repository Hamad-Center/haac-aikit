import { describe, expect, it } from "vitest";
import { formatUnifiedDiff } from "../src/fs/diff.js";

describe("formatUnifiedDiff", () => {
  it("returns empty string for identical inputs", () => {
    expect(formatUnifiedDiff("hello\n", "hello\n")).toBe("");
  });

  it("marks added lines with '+ '", () => {
    const out = formatUnifiedDiff("a\n", "a\nb\n");
    // Strip ANSI for assertion stability.
    const plain = out.replace(/\x1b\[[0-9;]*m/g, "");
    expect(plain).toMatch(/^\+ b$/m);
  });

  it("marks removed lines with '- '", () => {
    const out = formatUnifiedDiff("a\nb\n", "a\n");
    const plain = out.replace(/\x1b\[[0-9;]*m/g, "");
    expect(plain).toMatch(/^- b$/m);
  });

  it("includes 3 lines of context around a change", () => {
    const local = "1\n2\n3\n4\n5\n6\n7\n";
    const incoming = "1\n2\n3\nFOUR\n5\n6\n7\n";
    const out = formatUnifiedDiff(local, incoming);
    const plain = out.replace(/\x1b\[[0-9;]*m/g, "");
    expect(plain).toMatch(/^  3$/m);
    expect(plain).toMatch(/^- 4$/m);
    expect(plain).toMatch(/^\+ FOUR$/m);
    expect(plain).toMatch(/^  5$/m);
  });
});
