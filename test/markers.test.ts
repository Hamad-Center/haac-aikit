import { describe, expect, it } from "vitest";
import { extractMarkerRegion, upsertMarkerRegion, wrapWithMarkers } from "../src/render/markers.js";

describe("upsertMarkerRegion", () => {
  it("appends markers to a file with no existing markers", () => {
    const result = upsertMarkerRegion("# Existing header\n", "new content", "README.md");
    expect(result.hasMarkers).toBe(false);
    expect(result.replaced).toContain("<!-- BEGIN:haac-aikit -->");
    expect(result.replaced).toContain("new content");
    expect(result.replaced).toContain("<!-- END:haac-aikit -->");
    expect(result.replaced).toContain("# Existing header");
  });

  it("replaces only the managed region, preserving surrounding content", () => {
    const existing = [
      "# Header",
      "<!-- BEGIN:haac-aikit -->",
      "old managed content",
      "<!-- END:haac-aikit -->",
      "## Footer",
    ].join("\n");

    const { replaced } = upsertMarkerRegion(existing, "new managed content", "README.md");
    expect(replaced).toContain("new managed content");
    expect(replaced).not.toContain("old managed content");
    expect(replaced).toContain("# Header");
    expect(replaced).toContain("## Footer");
  });

  it("uses YAML-style markers for .yml files", () => {
    const result = upsertMarkerRegion("", "content", "config.yml");
    expect(result.replaced).toContain("# BEGIN:haac-aikit");
    expect(result.replaced).toContain("# END:haac-aikit");
  });

  it("uses JSON-style markers for .json files", () => {
    const result = upsertMarkerRegion("", "content", "settings.json");
    expect(result.replaced).toContain('"// BEGIN:haac-aikit"');
    expect(result.replaced).toContain('"// END:haac-aikit"');
  });
});

describe("extractMarkerRegion", () => {
  it("returns null when no markers present", () => {
    expect(extractMarkerRegion("no markers here", "README.md")).toBeNull();
  });

  it("extracts content between markers", () => {
    const content = [
      "before",
      "<!-- BEGIN:haac-aikit -->",
      "managed content",
      "<!-- END:haac-aikit -->",
      "after",
    ].join("\n");
    expect(extractMarkerRegion(content, "README.md")).toBe("managed content");
  });
});

describe("wrapWithMarkers", () => {
  it("wraps content with markdown markers", () => {
    const result = wrapWithMarkers("body", "README.md");
    expect(result).toMatch(/<!-- BEGIN:haac-aikit -->\nbody\n<!-- END:haac-aikit -->/);
  });
});
