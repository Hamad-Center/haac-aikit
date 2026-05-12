#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));

function fail(message) {
  console.error(`catalog-check: ${message}`);
  process.exit(1);
}

function checkAgents() {
  const agentsRoot = join(repoRoot, "catalog", "agents");
  if (!existsSync(agentsRoot) || !statSync(agentsRoot).isDirectory()) {
    fail(`missing required directory ${agentsRoot}`);
  }

  // No .md at root.
  const rootMd = readdirSync(agentsRoot).filter((f) => f.endsWith(".md"));
  if (rootMd.length > 0) {
    fail(
      `catalog/agents/ must not contain .md files at root (found: ${rootMd.join(", ")}). ` +
      `Move them into tier1/ or tier2/.`
    );
  }

  // tier1 and tier2 must exist.
  const tierDirs = ["tier1", "tier2"];
  const namesByTier = {};
  for (const tier of tierDirs) {
    const dir = join(agentsRoot, tier);
    if (!existsSync(dir) || !statSync(dir).isDirectory()) {
      fail(`missing required directory catalog/agents/${tier}/`);
    }
    namesByTier[tier] = readdirSync(dir)
      .filter((f) => f.endsWith(".md"))
      .map((f) => f.replace(/\.md$/, ""));
  }

  // Reject same-name collisions across tiers.
  const tier1Set = new Set(namesByTier.tier1);
  const collisions = namesByTier.tier2.filter((n) => tier1Set.has(n));
  if (collisions.length > 0) {
    fail(`agent names appear in both tier1 and tier2: ${collisions.join(", ")}`);
  }

  // Validate frontmatter on each agent file.
  for (const tier of tierDirs) {
    for (const name of namesByTier[tier]) {
      const filePath = join(agentsRoot, tier, `${name}.md`);
      const content = readFileSync(filePath, "utf8");
      const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (!fmMatch) {
        fail(`${filePath} missing YAML frontmatter`);
      }
      const fm = fmMatch[1];
      for (const field of ["name", "description", "model"]) {
        if (!new RegExp(`^${field}:`, "m").test(fm)) {
          fail(`${filePath} frontmatter missing '${field}:'`);
        }
      }
    }
  }

  console.log(
    `catalog-check: agents OK (${namesByTier.tier1.length} tier1, ${namesByTier.tier2.length} tier2)`
  );
}

checkAgents();
checkHtmlArtifactsTemplates();
console.log("catalog-check: all checks passed");

function checkHtmlArtifactsTemplates() {
  const root = join(repoRoot, "catalog", "templates", "html-artifacts");
  if (!existsSync(root) || !statSync(root).isDirectory()) {
    fail(`missing required directory ${root}`);
  }

  const manifestPath = join(root, "MANIFEST.json");
  if (!existsSync(manifestPath)) {
    fail(`missing ${manifestPath}`);
  }

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch (err) {
    fail(`${manifestPath} is not valid JSON: ${err.message}`);
  }

  if (manifest.version !== 1) {
    fail(`${manifestPath} version must be 1 (got ${manifest.version})`);
  }
  if (!Array.isArray(manifest.templates)) {
    fail(`${manifestPath} missing 'templates' array`);
  }
  if (!Array.isArray(manifest.categories)) {
    fail(`${manifestPath} missing 'categories' array`);
  }

  // Every manifest entry must point to an existing file.
  const slugsSeen = new Set();
  const numbersSeen = new Set();
  const filesInManifest = new Set();
  const categorySlugs = new Set(manifest.categories.map((c) => c.slug));

  for (const entry of manifest.templates) {
    for (const field of ["number", "slug", "category", "title", "description", "file"]) {
      if (typeof entry[field] !== "string" || entry[field].length === 0) {
        fail(`manifest entry ${JSON.stringify(entry)} missing required string '${field}'`);
      }
    }
    if (slugsSeen.has(entry.slug)) fail(`duplicate slug in manifest: ${entry.slug}`);
    if (numbersSeen.has(entry.number)) fail(`duplicate number in manifest: ${entry.number}`);
    slugsSeen.add(entry.slug);
    numbersSeen.add(entry.number);
    if (!categorySlugs.has(entry.category)) {
      fail(`manifest entry ${entry.slug} references unknown category '${entry.category}'`);
    }
    const filePath = join(root, entry.file);
    if (!existsSync(filePath)) {
      fail(`manifest entry ${entry.slug} points to missing file: ${entry.file}`);
    }
    filesInManifest.add(entry.file);
  }

  // Every .html file (except index.html) must be referenced by the manifest.
  const orphans = readdirSync(root)
    .filter((f) => f.endsWith(".html") && f !== "index.html")
    .filter((f) => !filesInManifest.has(f));
  if (orphans.length > 0) {
    fail(
      `template files not listed in MANIFEST.json: ${orphans.join(", ")}. ` +
      `Add manifest entries or remove the files.`
    );
  }

  console.log(
    `catalog-check: html-artifacts templates OK (${manifest.templates.length} entries, ${manifest.categories.length} categories)`
  );
}
