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

function checkSkills() {
  const skillsRoot = join(repoRoot, "catalog", "skills");
  if (!existsSync(skillsRoot) || !statSync(skillsRoot).isDirectory()) {
    fail(`missing required directory ${skillsRoot}`);
  }

  const tierDirs = ["tier1", "tier2"];
  const namesByTier = {};

  for (const tier of tierDirs) {
    const dir = join(skillsRoot, tier);
    if (!existsSync(dir) || !statSync(dir).isDirectory()) {
      fail(`missing required directory catalog/skills/${tier}/`);
    }

    // Reject any loose .md at tier root — all skills must be folders.
    const looseMd = readdirSync(dir).filter(
      (f) => f.endsWith(".md") && statSync(join(dir, f)).isFile()
    );
    if (looseMd.length > 0) {
      fail(
        `catalog/skills/${tier}/ must not contain flat .md files ` +
        `(found: ${looseMd.join(", ")}). Each skill lives in its own folder ` +
        `with a SKILL.md entry point — e.g. ${tier}/<name>/SKILL.md.`
      );
    }

    // Collect skill directories.
    namesByTier[tier] = readdirSync(dir).filter((entry) => {
      const entryPath = join(dir, entry);
      return statSync(entryPath).isDirectory();
    });

    // Reject any non-directory, non-.md entry (typos like foo.mdx, stray files,
    // accidentally-committed SKILL.md at tier root). .DS_Store is the one
    // tolerated exception so we don't break macOS contributors.
    const accountedFor = new Set([...looseMd, ...namesByTier[tier]]);
    const orphans = readdirSync(dir).filter(
      (entry) => !accountedFor.has(entry) && entry !== ".DS_Store"
    );
    if (orphans.length > 0) {
      fail(
        `catalog/skills/${tier}/ has unrecognized entries: ${orphans.join(", ")}. ` +
        `Each skill must be a folder containing SKILL.md.`
      );
    }
  }

  // Reject same-name collisions across tiers.
  const tier1Set = new Set(namesByTier.tier1);
  const collisions = namesByTier.tier2.filter((n) => tier1Set.has(n));
  if (collisions.length > 0) {
    fail(`skill names appear in both tier1 and tier2: ${collisions.join(", ")}`);
  }

  // Validate each skill folder.
  for (const tier of tierDirs) {
    for (const name of namesByTier[tier]) {
      const skillDir = join(skillsRoot, tier, name);
      const skillFile = join(skillDir, "SKILL.md");

      if (!existsSync(skillFile)) {
        fail(`${skillDir}/ missing required SKILL.md entry point`);
      }

      const content = readFileSync(skillFile, "utf8");
      const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (!fmMatch) {
        fail(`${skillFile} missing YAML frontmatter`);
      }
      const fm = fmMatch[1];

      // `name:` must match the folder name.
      const nameMatch = fm.match(/^name:\s*(.+?)\s*$/m);
      if (!nameMatch) {
        fail(`${skillFile} frontmatter missing 'name:'`);
      }
      if (nameMatch[1] !== name) {
        fail(
          `${skillFile} frontmatter name '${nameMatch[1]}' does not match folder name '${name}'`
        );
      }

      // `description:` required.
      if (!/^description:/m.test(fm)) {
        fail(`${skillFile} frontmatter missing 'description:'`);
      }

      // `allowed-tools:` required — least-privilege declaration. Must have a
      // non-empty value: `allowed-tools:` (bare) or `allowed-tools: []` defeats
      // the purpose. Accept either a string list (`Read, Edit`) or a YAML block
      // sequence starting on the next line (`- Read`).
      const allowedToolsMatch = fm.match(/^allowed-tools:[ \t]*(.*)$/m);
      if (!allowedToolsMatch) {
        fail(
          `${skillFile} frontmatter missing 'allowed-tools:' — every skill must ` +
          `declare which tools it needs (least-privilege).`
        );
      }
      const sameLineValue = allowedToolsMatch[1].trim();
      // Match the next non-blank line after `allowed-tools:` for block-sequence form.
      const blockMatch = fm.match(/^allowed-tools:[ \t]*\n([\s\S]+)$/m);
      const blockHasItem = blockMatch && /^\s*-\s+\S/m.test(blockMatch[1]);
      const isEmptyInline = sameLineValue === "" || sameLineValue === "[]";
      if (isEmptyInline && !blockHasItem) {
        fail(
          `${skillFile} frontmatter 'allowed-tools:' has no tools listed. ` +
          `Declare at least one tool — empty allow-lists defeat least-privilege.`
        );
      }
    }
  }

  console.log(
    `catalog-check: skills OK (${namesByTier.tier1.length} tier1, ${namesByTier.tier2.length} tier2)`
  );
}

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
    join(repoRoot, "catalog", "skills", "tier1", "docs", "SKILL.md"),
    join(repoRoot, "catalog", "skills", "tier1", "decide", "SKILL.md"),
    join(repoRoot, "catalog", "skills", "tier1", "directions", "SKILL.md"),
    join(repoRoot, "catalog", "skills", "tier1", "roadmap", "SKILL.md"),
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

checkAgents();
checkSkills();
checkLivingDocsTemplates();
console.log("catalog-check: all checks passed");
