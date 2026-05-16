import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readSection, writeSection } from "../src/render/markers.js";

const repoRoot = join(__dirname, "..");
const starterPath = join(repoRoot, "catalog/templates/design/starter-DESIGN.md");
const showroomPath = join(repoRoot, "catalog/templates/design/template.html");

// The five canonical section IDs. Order matches the skill's documented contract;
// renaming any of these is a breaking change for users who have an existing
// DESIGN.md — surface it here loudly.
const SECTION_IDS = ["atmosphere", "colors", "typography", "components", "layout"] as const;

describe("starter-DESIGN.md", () => {
  const starter = readFileSync(starterPath, "utf8");

  it("contains all five marker-bounded sections", () => {
    for (const id of SECTION_IDS) {
      expect(starter, `missing BEGIN marker for section '${id}'`)
        .toContain(`<!-- BEGIN:haac-aikit:section:${id} -->`);
      expect(starter, `missing END marker for section '${id}'`)
        .toContain(`<!-- END:haac-aikit:section:${id} -->`);
    }
  });

  it("round-trips each section: writeSection(c, id, readSection(c, id)!, file) === c", () => {
    // This is the guarantee /design refine relies on — reading and re-writing a
    // section must produce byte-identical output, so unchanged sections stay
    // exactly as the user authored them.
    for (const id of SECTION_IDS) {
      const body = readSection(starter, id, starterPath);
      expect(body, `section '${id}' returned null from readSection`).not.toBeNull();
      const roundTripped = writeSection(starter, id, body!, starterPath);
      expect(roundTripped, `round-trip mismatch for section '${id}'`).toBe(starter);
    }
  });

  it("readSection returns trimmed body (no leading or trailing newline)", () => {
    // readSection promises a trimmed body — verify the contract holds for at
    // least one section so future marker changes can't quietly regress it.
    const atmo = readSection(starter, "atmosphere", starterPath);
    expect(atmo).not.toBeNull();
    expect(atmo!.startsWith("\n")).toBe(false);
    expect(atmo!.endsWith("\n")).toBe(false);
  });
});

describe("showroom template.html", () => {
  const showroom = readFileSync(showroomPath, "utf8");

  it("has a data-aikit-section DOM hook for each canonical section", () => {
    // The showroom JS uses these attributes to find sections and bind live
    // controls (color pickers, font dropdowns). Without them, the showroom
    // renders but is silently non-interactive.
    for (const id of SECTION_IDS) {
      expect(showroom, `template.html missing data-aikit-section="${id}"`)
        .toContain(`data-aikit-section="${id}"`);
    }
  });

  it("ships no CDN-loaded scripts or stylesheets", () => {
    // Showroom contract: self-contained, opens off disk, no network.
    expect(showroom).not.toMatch(/<script[^>]+src=["']https?:/);
    expect(showroom).not.toMatch(/<link[^>]+rel=["']stylesheet["'][^>]+href=["']https?:/);
  });
});
