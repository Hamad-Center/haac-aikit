import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { TemplateEntry, TemplateManifest } from "../types.js";

// Mirror of CATALOG_ROOT resolution from src/catalog/index.ts. We walk up
// looking for catalog/templates/ specifically so both states work:
//   bundled: dist/cli.mjs           → ../catalog/templates       ✓
//   dev:     src/templates/index.ts → repo-root/catalog/templates ✓
function findTemplatesRoot(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 6; i++) {
    const candidate = join(dir, "catalog", "templates");
    if (existsSync(join(candidate, "html-artifacts", "MANIFEST.json"))) {
      return candidate;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(
    "haac-aikit: catalog/templates/ directory not found relative to module location"
  );
}

export const TEMPLATES_ROOT = findTemplatesRoot();

export function htmlArtifactsRoot(): string {
  return join(TEMPLATES_ROOT, "html-artifacts");
}

export function loadHtmlArtifactsManifest(): TemplateManifest {
  const path = join(htmlArtifactsRoot(), "MANIFEST.json");
  const raw = readFileSync(path, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  if (!isTemplateManifest(parsed)) {
    throw new Error(`haac-aikit: ${path} does not match the expected manifest shape`);
  }
  return parsed;
}

// Resolve a user-supplied identifier (slug, number with or without leading
// zero, or filename) to a single template entry. Returns null if no match.
export function resolveTemplate(
  manifest: TemplateManifest,
  identifier: string
): TemplateEntry | null {
  const trimmed = identifier.trim().toLowerCase();
  if (trimmed === "") return null;

  // Exact slug match
  const bySlug = manifest.templates.find((t) => t.slug.toLowerCase() === trimmed);
  if (bySlug) return bySlug;

  // Number match — accept both "3" and "03"
  const padded = trimmed.padStart(2, "0");
  const byNumber = manifest.templates.find((t) => t.number === padded);
  if (byNumber) return byNumber;

  // Filename match — accept "03-code-review-pr.html" or without extension
  const filename = trimmed.endsWith(".html") ? trimmed : `${trimmed}.html`;
  const byFile = manifest.templates.find((t) => t.file.toLowerCase() === filename);
  if (byFile) return byFile;

  return null;
}

function isTemplateManifest(value: unknown): value is TemplateManifest {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    obj.version === 1 &&
    typeof obj.source === "object" &&
    Array.isArray(obj.categories) &&
    Array.isArray(obj.templates)
  );
}
