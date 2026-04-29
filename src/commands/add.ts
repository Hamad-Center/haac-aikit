import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import * as p from "@clack/prompts";
import kleur from "kleur";
import { CATALOG_ROOT } from "../catalog/index.js";
import { readConfig, writeConfig } from "../fs/readConfig.js";
import type { AikitConfig, CliArgs, ProjectShape } from "../types.js";

type ItemType = "skill" | "agent" | "hook";

const ITEM_DIRS: Record<ItemType, { catalog: string; dest: string; ext: string[] }> = {
  skill: { catalog: "skills/tier1", dest: ".claude/skills", ext: [".md"] },
  agent: { catalog: "agents", dest: ".claude/agents", ext: [".md"] },
  hook: { catalog: "hooks", dest: ".claude/hooks", ext: [".sh"] },
};

// Maps an agent name to the shapes that require it. When `aikit add backend`
// runs, we look up which shape to add to config.shape so a future sync
// re-installs the agent.
const AGENT_TO_SHAPE: Record<string, ProjectShape> = {
  frontend: "web",
  backend: "backend",
  mobile: "mobile",
};

interface FoundItem {
  type: ItemType;
  name: string;
  srcFile: string;
  destFile: string;
  destDir: string;
}

export async function runAdd(argv: CliArgs): Promise<void> {
  const itemArg = argv._[1];

  if (!itemArg) {
    p.log.error("Usage: aikit add <name>  (e.g. aikit add brainstorming)");
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
    const shape = AGENT_TO_SHAPE[item.name];
    if (shape && !config.shape.includes(shape)) {
      updated = { ...config, shape: [...config.shape, shape] };
      message = `Added "${shape}" to .aikitrc.json shape (so sync re-installs ${item.name})`;
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

function detectSkillTier(name: string): "tier1" | "tier2" | "tier3" {
  for (const tier of ["tier1", "tier2"] as const) {
    if (existsSync(join(CATALOG_ROOT, "skills", tier, `${name}.md`))) {
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
