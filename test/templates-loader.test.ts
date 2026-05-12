import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  TEMPLATES_ROOT,
  htmlArtifactsRoot,
  loadHtmlArtifactsManifest,
  resolveTemplate,
} from "../src/templates/index.js";

describe("templates loader", () => {
  it("TEMPLATES_ROOT resolves to a directory that contains html-artifacts/MANIFEST.json", () => {
    expect(existsSync(join(TEMPLATES_ROOT, "html-artifacts", "MANIFEST.json"))).toBe(true);
  });

  it("htmlArtifactsRoot() returns the catalog/templates/html-artifacts/ path", () => {
    expect(htmlArtifactsRoot().endsWith("html-artifacts")).toBe(true);
    expect(existsSync(htmlArtifactsRoot())).toBe(true);
  });

  it("loadHtmlArtifactsManifest() parses the JSON and validates basic shape", () => {
    const manifest = loadHtmlArtifactsManifest();
    expect(manifest.version).toBe(1);
    expect(manifest.templates.length).toBe(20);
    expect(manifest.categories.length).toBe(9);
    expect(manifest.source.upstream).toMatch(/github\.com\/ThariqS/);
  });

  it("every manifest entry points to an existing .html file on disk", () => {
    const manifest = loadHtmlArtifactsManifest();
    for (const entry of manifest.templates) {
      const filePath = join(htmlArtifactsRoot(), entry.file);
      expect(existsSync(filePath), `missing file for ${entry.slug}: ${entry.file}`).toBe(true);
    }
  });

  it("every manifest entry references a known category slug", () => {
    const manifest = loadHtmlArtifactsManifest();
    const categorySlugs = new Set(manifest.categories.map((c) => c.slug));
    for (const entry of manifest.templates) {
      expect(categorySlugs.has(entry.category), `unknown category for ${entry.slug}`).toBe(true);
    }
  });

  it("slugs and numbers are unique across all templates", () => {
    const manifest = loadHtmlArtifactsManifest();
    const slugs = new Set<string>();
    const numbers = new Set<string>();
    for (const t of manifest.templates) {
      expect(slugs.has(t.slug), `duplicate slug: ${t.slug}`).toBe(false);
      expect(numbers.has(t.number), `duplicate number: ${t.number}`).toBe(false);
      slugs.add(t.slug);
      numbers.add(t.number);
    }
  });
});

describe("resolveTemplate()", () => {
  const manifest = loadHtmlArtifactsManifest();

  it("resolves an exact slug match", () => {
    const t = resolveTemplate(manifest, "pr-review");
    expect(t?.number).toBe("03");
  });

  it("resolves a zero-padded number", () => {
    const t = resolveTemplate(manifest, "03");
    expect(t?.slug).toBe("pr-review");
  });

  it("resolves a bare number without leading zero", () => {
    const t = resolveTemplate(manifest, "3");
    expect(t?.slug).toBe("pr-review");
  });

  it("resolves a filename with extension", () => {
    const t = resolveTemplate(manifest, "03-code-review-pr.html");
    expect(t?.slug).toBe("pr-review");
  });

  it("is case-insensitive on slugs", () => {
    const t = resolveTemplate(manifest, "PR-REVIEW");
    expect(t?.slug).toBe("pr-review");
  });

  it("returns null on no match", () => {
    expect(resolveTemplate(manifest, "definitely-not-a-template")).toBe(null);
  });

  it("returns null on empty input", () => {
    expect(resolveTemplate(manifest, "")).toBe(null);
    expect(resolveTemplate(manifest, "   ")).toBe(null);
  });
});
