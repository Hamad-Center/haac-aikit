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
checkLivingDocsTemplates();
console.log("catalog-check: all checks passed");

function checkLivingDocsTemplates() {
  // The HTML-artifact skills (/docs, /decide, /directions, /roadmap) each ship
  // a single template; we confirm the files exist. All four live in tier1 so
  // they're always available; the `aikit add --html` group installs only this set.
  const requiredTemplates = [
    join(repoRoot, "catalog", "templates", "docs", "starter.html"),
    join(repoRoot, "catalog", "templates", "decide", "template.html"),
    join(repoRoot, "catalog", "templates", "directions", "template.html"),
    join(repoRoot, "catalog", "templates", "roadmap", "template.html"),
  ];
  for (const path of requiredTemplates) {
    if (!existsSync(path)) {
      fail(`missing required template: ${path}`);
    }
  }

  // Confirm matching skill + command files exist alongside the templates.
  const requiredSkillsAndCommands = [
    join(repoRoot, "catalog", "skills", "tier1", "docs.md"),
    join(repoRoot, "catalog", "skills", "tier1", "decide.md"),
    join(repoRoot, "catalog", "skills", "tier1", "directions.md"),
    join(repoRoot, "catalog", "skills", "tier1", "roadmap.md"),
    join(repoRoot, "catalog", "commands", "docs.md"),
    join(repoRoot, "catalog", "commands", "decide.md"),
    join(repoRoot, "catalog", "commands", "directions.md"),
    join(repoRoot, "catalog", "commands", "roadmap.md"),
  ];
  for (const path of requiredSkillsAndCommands) {
    if (!existsSync(path)) {
      fail(`missing required catalog file: ${path}`);
    }
  }

  console.log(
    `catalog-check: living-docs templates OK (${requiredTemplates.length} templates, ${requiredSkillsAndCommands.length} catalog entries)`
  );
}
