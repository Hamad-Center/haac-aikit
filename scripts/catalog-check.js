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
console.log("catalog-check: all checks passed");
