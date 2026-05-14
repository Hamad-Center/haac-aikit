import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import * as p from "@clack/prompts";
import kleur from "kleur";
import { CATALOG_ROOT } from "../catalog/index.js";
import { readConfig, writeConfig } from "../fs/readConfig.js";
import type { AikitConfig, AgentTier, CliArgs, SkillTier } from "../types.js";

type ItemType = "skill" | "agent" | "hook";

const ITEM_DIRS: Record<ItemType, { catalog: string; dest: string; ext: string[] }> = {
  skill: { catalog: "skills/tier1", dest: ".claude/skills", ext: [".md"] },
  agent: { catalog: "agents/tier1", dest: ".claude/agents", ext: [".md"] },
  hook: { catalog: "hooks", dest: ".claude/hooks", ext: [".sh"] },
};

interface FoundItem {
  type: ItemType;
  name: string;
  srcFile: string;
  destFile: string;
  destDir: string;
}

// The HTML-artifact bundle: skills, matching slash commands, and template
// directories. Installed as a unit via `aikit add --html`. Keep the list
// alongside the four tier1 HTML skills so a missed addition here surfaces in
// catalog-check rather than silently dropping a file from the bundle.
const HTML_BUNDLE_ITEMS = ["docs", "decide", "directions", "roadmap"] as const;
const HTML_BUNDLE_TEMPLATE_PACKS = ["docs", "decide", "directions", "roadmap"] as const;

export async function runAdd(argv: CliArgs): Promise<void> {
  if (argv.html) {
    await runAddHtmlBundle(argv);
    return;
  }

  const itemArg = argv._[1];

  if (!itemArg) {
    p.log.error("Usage: aikit add <name>  (e.g. aikit add brainstorming) or aikit add --html");
    process.exit(1);
  }

  // Reject path-traversal attempts before we use the name in filesystem joins.
  // Names are expected to be simple kebab-case slugs matching a catalog file.
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(itemArg)) {
    p.log.error(
      `Invalid item name "${itemArg}". Names must be kebab-case slugs ` +
      `(letters, digits, hyphens, underscores). Run \`aikit list\` to see catalog items.`
    );
    process.exit(1);
  }

  const found = findCatalogItem(itemArg);
  if (!found) {
    p.log.error(`"${itemArg}" not found in catalog.`);
    const similar = listAllCatalogItems().filter(
      (n) => n.includes(itemArg) || itemArg.includes((n.split("-")[0] ?? ""))
    );
    if (similar.length > 0) {
      process.stdout.write(`Did you mean: ${similar.slice(0, 5).join(", ")}?\n`);
    }
    process.stdout.write(`Run ${kleur.cyan("aikit list")} to see all available items.\n`);
    process.exit(1);
  }

  if (existsSync(found.destFile) && !argv.force) {
    p.log.warn(`${found.destFile} already exists. Use --force to overwrite.`);
    return;
  }

  if (!argv["dry-run"]) {
    mkdirSync(found.destDir, { recursive: true });
    copyFileSync(found.srcFile, found.destFile);
  }

  const dryPrefix = argv["dry-run"] ? "[dry-run] " : "";
  process.stdout.write(`${dryPrefix}${kleur.green("✓")} Added ${found.destFile}\n`);

  // Persist the addition so the next `aikit sync` reproduces it.
  if (!argv["dry-run"]) {
    const configChange = updateConfigForAddition(argv.config, found);
    if (configChange) {
      process.stdout.write(`  ${kleur.dim(configChange)}\n`);
    }
  }
}

async function runAddHtmlBundle(argv: CliArgs): Promise<void> {
  const dryPrefix = argv["dry-run"] ? "[dry-run] " : "";
  let installed = 0;
  let skipped = 0;

  // Skills: all four live in tier1.
  for (const name of HTML_BUNDLE_ITEMS) {
    const src = join(CATALOG_ROOT, "skills", "tier1", `${name}.md`);
    const dest = join(".claude/skills", `${name}.md`);
    if (!existsSync(src)) {
      p.log.error(`bundled skill missing in catalog: ${src}`);
      process.exit(1);
    }
    if (existsSync(dest) && !argv.force) {
      process.stdout.write(`  ${kleur.dim("·")} skill ${name} (already installed)\n`);
      skipped++;
      continue;
    }
    if (!argv["dry-run"]) {
      mkdirSync(".claude/skills", { recursive: true });
      copyFileSync(src, dest);
    }
    process.stdout.write(`${dryPrefix}${kleur.green("✓")} skill .claude/skills/${name}.md\n`);
    installed++;
  }

  // Slash commands.
  for (const name of HTML_BUNDLE_ITEMS) {
    const src = join(CATALOG_ROOT, "commands", `${name}.md`);
    const dest = join(".claude/commands", `${name}.md`);
    if (!existsSync(src)) {
      p.log.error(`bundled command missing in catalog: ${src}`);
      process.exit(1);
    }
    if (existsSync(dest) && !argv.force) {
      process.stdout.write(`  ${kleur.dim("·")} command /${name} (already installed)\n`);
      skipped++;
      continue;
    }
    if (!argv["dry-run"]) {
      mkdirSync(".claude/commands", { recursive: true });
      copyFileSync(src, dest);
    }
    process.stdout.write(`${dryPrefix}${kleur.green("✓")} command .claude/commands/${name}.md\n`);
    installed++;
  }

  // Templates — every file under each pack directory.
  for (const pack of HTML_BUNDLE_TEMPLATE_PACKS) {
    const srcDir = join(CATALOG_ROOT, "templates", pack);
    const destDir = join(".aikit/templates", pack);
    if (!existsSync(srcDir)) {
      p.log.error(`bundled template pack missing in catalog: ${srcDir}`);
      process.exit(1);
    }
    if (!argv["dry-run"]) mkdirSync(destDir, { recursive: true });
    for (const file of readdirSync(srcDir).filter((f) => /\.(html|json|md)$/.test(f))) {
      const destFile = join(destDir, file);
      if (existsSync(destFile) && !argv.force) {
        process.stdout.write(`  ${kleur.dim("·")} template ${pack}/${file} (already installed)\n`);
        skipped++;
        continue;
      }
      if (!argv["dry-run"]) copyFileSync(join(srcDir, file), destFile);
      process.stdout.write(`${dryPrefix}${kleur.green("✓")} template .aikit/templates/${pack}/${file}\n`);
      installed++;
    }
  }

  const summary = argv["dry-run"]
    ? `Would install ${installed} files${skipped ? `, skip ${skipped} existing` : ""}.`
    : `Installed ${installed} files${skipped ? `, skipped ${skipped} existing` : ""}. Use ${kleur.cyan("--force")} to overwrite.`;
  process.stdout.write(`\n${summary}\n`);
}

function findCatalogItem(name: string): FoundItem | null {
  // Skills are spread across tier1 and tier2.
  for (const tier of ["tier1", "tier2"]) {
    const dir = join(CATALOG_ROOT, "skills", tier);
    if (existsSync(dir)) {
      const candidate = join(dir, `${name}.md`);
      if (existsSync(candidate)) {
        return {
          type: "skill",
          name,
          srcFile: candidate,
          destFile: join(".claude/skills", `${name}.md`),
          destDir: ".claude/skills",
        };
      }
    }
  }

  // Agents live in tier subdirectories (tier1, tier2); hooks live flat.
  for (const tier of ["tier1", "tier2"]) {
    const dir = join(CATALOG_ROOT, "agents", tier);
    if (existsSync(dir)) {
      const candidate = join(dir, `${name}.md`);
      if (existsSync(candidate)) {
        return {
          type: "agent",
          name,
          srcFile: candidate,
          destFile: join(".claude/agents", `${name}.md`),
          destDir: ".claude/agents",
        };
      }
    }
  }

  // Hooks live in a flat catalog directory.
  for (const type of ["hook"] as const) {
    const spec = ITEM_DIRS[type];
    const catalogDir = join(CATALOG_ROOT, spec.catalog);
    if (!existsSync(catalogDir)) continue;
    for (const ext of spec.ext) {
      const candidate = join(catalogDir, `${name}${ext}`);
      if (existsSync(candidate)) {
        return {
          type,
          name,
          srcFile: candidate,
          destFile: join(spec.dest, `${name}${ext}`),
          destDir: spec.dest,
        };
      }
    }
  }

  return null;
}

function updateConfigForAddition(configPath: string | undefined, item: FoundItem): string | null {
  const config = readConfig(configPath);
  if (!config) return null;

  let updated: AikitConfig | null = null;
  let message = "";

  if (item.type === "agent") {
    const agentTier = detectAgentTier(item.name);
    if (agentTier === "tier2") {
      const currentAgents = config.agents ?? { tier1: "all", tier2: "all", tier3: [] };
      const tier2 = currentAgents.tier2;
      if (tier2 !== "all" && !tier2.includes(item.name)) {
        updated = {
          ...config,
          agents: { ...currentAgents, tier2: [...tier2, item.name] },
        };
        message = `Added "${item.name}" to .aikitrc.json agents.tier2`;
      }
    }
    if (agentTier === "tier3" && !(config.agents?.tier3 ?? []).includes(item.name)) {
      const currentAgents = config.agents ?? { tier1: "all", tier2: "all", tier3: [] };
      updated = {
        ...config,
        agents: { ...currentAgents, tier3: [...currentAgents.tier3, item.name] },
      };
      message = `Added "${item.name}" to .aikitrc.json agents.tier3`;
    }
  } else if (item.type === "skill") {
    // Default scope already installs all tier1+tier2. If the skill isn't in
    // tier1/tier2 (e.g. user-authored copy), record it in skills.tier3.
    const skillTier = detectSkillTier(item.name);
    if (skillTier === "tier3" && !config.skills.tier3.includes(item.name)) {
      updated = {
        ...config,
        skills: { ...config.skills, tier3: [...config.skills.tier3, item.name] },
      };
      message = `Added "${item.name}" to .aikitrc.json skills.tier3`;
    }
  } else if (item.type === "hook") {
    if (!config.integrations.hooks) {
      updated = {
        ...config,
        integrations: { ...config.integrations, hooks: true },
      };
      message = "Set integrations.hooks=true in .aikitrc.json";
    }
  }

  if (updated) {
    writeConfig(updated, configPath);
    return message;
  }
  return null;
}

function detectSkillTier(name: string): SkillTier {
  for (const tier of ["tier1", "tier2"] as const) {
    if (existsSync(join(CATALOG_ROOT, "skills", tier, `${name}.md`))) {
      return tier;
    }
  }
  return "tier3";
}

function detectAgentTier(name: string): AgentTier {
  for (const tier of ["tier1", "tier2"] as const) {
    if (existsSync(join(CATALOG_ROOT, "agents", tier, `${name}.md`))) {
      return tier;
    }
  }
  return "tier3";
}

function listAllCatalogItems(): string[] {
  const items: string[] = [];
  for (const subdir of ["skills/tier1", "skills/tier2", "agents/tier1", "agents/tier2", "hooks"]) {
    const dir = join(CATALOG_ROOT, subdir);
    if (existsSync(dir)) {
      readdirSync(dir)
        .filter((f) => f.endsWith(".md") || f.endsWith(".sh"))
        .forEach((f) => items.push(f.replace(/\.(md|sh)$/, "")));
    }
  }
  return items;
}
