import { describe, expect, it } from "vitest";
import {
  appendSection,
  hasSection,
  readSection,
  writeSection,
} from "../src/render/markers.js";

const md = (lines: string[]): string => lines.join("\n");

describe("readSection", () => {
  it("returns null when no section markers present", () => {
    expect(readSection("plain content", "auth", "docs/architecture.html")).toBeNull();
  });

  it("returns null when the requested section id is missing", () => {
    const content = md([
      "<!-- BEGIN:haac-aikit:section:overview -->",
      "overview body",
      "<!-- END:haac-aikit:section:overview -->",
    ]);
    expect(readSection(content, "auth", "docs/architecture.html")).toBeNull();
  });

  it("extracts content between matching section markers", () => {
    const content = md([
      "preamble",
      "<!-- BEGIN:haac-aikit:section:auth -->",
      "auth body line 1",
      "auth body line 2",
      "<!-- END:haac-aikit:section:auth -->",
      "trailer",
    ]);
    expect(readSection(content, "auth", "features.html")).toBe(
      "auth body line 1\nauth body line 2"
    );
  });

  it("reads only the requested section when multiple sections exist", () => {
    const content = md([
      "<!-- BEGIN:haac-aikit:section:overview -->",
      "OVERVIEW",
      "<!-- END:haac-aikit:section:overview -->",
      "<!-- BEGIN:haac-aikit:section:auth -->",
      "AUTH",
      "<!-- END:haac-aikit:section:auth -->",
    ]);
    expect(readSection(content, "auth", "features.html")).toBe("AUTH");
    expect(readSection(content, "overview", "features.html")).toBe("OVERVIEW");
  });

  it("uses YAML-style markers for .yml files", () => {
    const content = md([
      "# BEGIN:haac-aikit:section:db",
      "database: postgres",
      "# END:haac-aikit:section:db",
    ]);
    expect(readSection(content, "db", "config.yml")).toBe("database: postgres");
  });

  it("uses JSON-style markers for .json files", () => {
    // JSON dialect quirk: the leading `,` after the BEGIN marker's value is
    // part of the slice. Consistent with the existing `extractMarkerRegion`
    // behavior; callers consuming JSON sections strip syntax artifacts.
    const content = md([
      '"// BEGIN:haac-aikit:section:db": "",',
      '"db": "postgres",',
      '"// END:haac-aikit:section:db": ""',
    ]);
    expect(readSection(content, "db", "settings.json")).toBe(',\n"db": "postgres",');
  });
});

describe("hasSection", () => {
  it("returns true when section exists", () => {
    const content = md([
      "<!-- BEGIN:haac-aikit:section:x -->",
      "x",
      "<!-- END:haac-aikit:section:x -->",
    ]);
    expect(hasSection(content, "x", "doc.html")).toBe(true);
  });

  it("returns false when section is missing", () => {
    expect(hasSection("nothing", "x", "doc.html")).toBe(false);
  });
});

describe("writeSection", () => {
  it("replaces only the named section, preserving everything else", () => {
    const existing = md([
      "preamble",
      "<!-- BEGIN:haac-aikit:section:auth -->",
      "old auth body",
      "<!-- END:haac-aikit:section:auth -->",
      "<!-- BEGIN:haac-aikit:section:db -->",
      "db body",
      "<!-- END:haac-aikit:section:db -->",
      "trailer",
    ]);
    const replaced = writeSection(existing, "auth", "new auth body", "features.html");
    expect(replaced).toContain("new auth body");
    expect(replaced).not.toContain("old auth body");
    expect(replaced).toContain("preamble");
    expect(replaced).toContain("trailer");
    expect(replaced).toContain("db body");
  });

  it("throws when the section does not exist", () => {
    expect(() => writeSection("plain content", "auth", "body", "doc.html")).toThrow(
      /section.*not found/i
    );
  });

  it("rejects invalid section ids", () => {
    expect(() => writeSection("", "BAD ID!", "body", "doc.html")).toThrow(/invalid section id/i);
    expect(() => writeSection("", "", "body", "doc.html")).toThrow(/invalid section id/i);
    expect(() => writeSection("", "-leading-dash", "body", "doc.html")).toThrow(
      /invalid section id/i
    );
  });

  it("accepts valid section ids (alnum, dash, underscore)", () => {
    const content = md([
      "<!-- BEGIN:haac-aikit:section:adr-001_v2 -->",
      "old",
      "<!-- END:haac-aikit:section:adr-001_v2 -->",
    ]);
    expect(() =>
      writeSection(content, "adr-001_v2", "new", "doc.html")
    ).not.toThrow();
  });
});

describe("appendSection", () => {
  it("adds a new section at the end of the file", () => {
    const existing = "existing content\n";
    const result = appendSection(existing, "newone", "the body", "doc.html");
    expect(result).toContain("existing content");
    expect(result).toContain("<!-- BEGIN:haac-aikit:section:newone -->");
    expect(result).toContain("the body");
    expect(result).toContain("<!-- END:haac-aikit:section:newone -->");
    expect(result.indexOf("existing content")).toBeLessThan(
      result.indexOf("<!-- BEGIN:haac-aikit:section:newone -->")
    );
  });

  it("throws when the section already exists", () => {
    const existing = md([
      "<!-- BEGIN:haac-aikit:section:dup -->",
      "x",
      "<!-- END:haac-aikit:section:dup -->",
    ]);
    expect(() => appendSection(existing, "dup", "y", "doc.html")).toThrow(
      /section.*already exists/i
    );
  });

  it("creates the file content when starting from empty", () => {
    const result = appendSection("", "first", "first body", "doc.html");
    expect(result).toContain("<!-- BEGIN:haac-aikit:section:first -->");
    expect(result).toContain("first body");
    expect(result).toContain("<!-- END:haac-aikit:section:first -->");
  });
});

describe("round-trip (append → read → write → read)", () => {
  it("produces identical content when writing the same body twice", () => {
    const initial = appendSection("preamble\n", "auth", "first body", "features.html");
    const afterFirstWrite = writeSection(initial, "auth", "first body", "features.html");
    expect(afterFirstWrite).toBe(initial);
  });

  it("round-trips across read → write with the same content", () => {
    const seeded = appendSection("# Title\n", "overview", "overview body", "doc.html");
    const body = readSection(seeded, "overview", "doc.html");
    expect(body).toBe("overview body");
    const rewritten = writeSection(seeded, "overview", body!, "doc.html");
    expect(rewritten).toBe(seeded);
  });

  it("preserves user-authored prose between sections across edits", () => {
    const seeded = md([
      "<!-- BEGIN:haac-aikit:section:a -->",
      "A body",
      "<!-- END:haac-aikit:section:a -->",
      "",
      "USER PROSE BETWEEN SECTIONS — must survive",
      "",
      "<!-- BEGIN:haac-aikit:section:b -->",
      "B body",
      "<!-- END:haac-aikit:section:b -->",
    ]);
    const updated = writeSection(seeded, "a", "A new", "doc.html");
    expect(updated).toContain("USER PROSE BETWEEN SECTIONS — must survive");
    expect(updated).toContain("B body");
    expect(updated).toContain("A new");
    expect(updated).not.toContain("A body\n");
  });
});

describe("dialect coexistence with the existing haac-aikit marker", () => {
  it("does not interfere with the unnamed BEGIN:haac-aikit block", () => {
    const content = md([
      "<!-- BEGIN:haac-aikit -->",
      "main managed block",
      "<!-- END:haac-aikit -->",
      "<!-- BEGIN:haac-aikit:section:extra -->",
      "extra section body",
      "<!-- END:haac-aikit:section:extra -->",
    ]);
    expect(readSection(content, "extra", "doc.html")).toBe("extra section body");
  });
});
