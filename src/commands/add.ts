import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as p from "@clack/prompts";
import kleur from "kleur";
import type { CliArgs } from "../types.js";

const CATALOG_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "catalog");

const ITEM_DIRS: Record<string, { catalog: string; dest: string; ext: string[] }> = {
  skill: { catalog: "skills/tier1", dest: ".claude/skills", ext: [".md"] },
  agent: { catalog: "agents", dest: ".claude/agents", ext: [".md"] },
  hook: { catalog: "hooks", dest: ".claude/hooks", ext: [".sh"] },
};

export async function runAdd(argv: CliArgs): Promise<void> {
  const itemArg = argv._[1];

  if (!itemArg) {
    p.log.error("Usage: aikit add <name>  (e.g. aikit add brainstorming)");
    process.exit(1);
  }

  // Search all categories for the item name
  for (const [_type, spec] of Object.entries(ITEM_DIRS)) {
    for (const tier of ["tier1", "tier2", ""]) {
      const catalogDir = join(CATALOG_ROOT, tier ? `skills/${tier}` : spec.catalog);
      if (!existsSync(catalogDir)) continue;

      for (const ext of spec.ext) {
        const srcFile = join(catalogDir, `${itemArg}${ext}`);
        if (existsSync(srcFile)) {
          const dest = spec.dest;
          const destFile = join(dest, `${itemArg}${ext}`);

          if (existsSync(destFile) && !argv.force) {
            p.log.warn(`${destFile} already exists. Use --force to overwrite.`);
            return;
          }

          if (!argv["dry-run"]) {
            mkdirSync(dest, { recursive: true });
            copyFileSync(srcFile, destFile);
          }

          process.stdout.write(
            `${argv["dry-run"] ? "[dry-run] " : ""}${kleur.green("✓")} Added ${destFile}\n`
          );
          return;
        }
      }
    }
  }

  // Not found — suggest similar names
  const allItems = listAllCatalogItems();
  const similar = allItems.filter((n) => n.includes(itemArg) || itemArg.includes(n.split("-")[0] ?? ""));

  p.log.error(`"${itemArg}" not found in catalog.`);
  if (similar.length > 0) {
    process.stdout.write(`Did you mean: ${similar.slice(0, 5).join(", ")}?\n`);
  }
  process.stdout.write(`Run ${kleur.cyan("aikit list")} to see all available items.\n`);
  process.exit(1);
}

function listAllCatalogItems(): string[] {
  const items: string[] = [];
  for (const subdir of ["skills/tier1", "skills/tier2", "agents", "hooks"]) {
    const dir = join(CATALOG_ROOT, subdir);
    if (existsSync(dir)) {
      readdirSync(dir)
        .filter((f) => f.endsWith(".md") || f.endsWith(".sh"))
        .forEach((f) => items.push(f.replace(/\.(md|sh)$/, "")));
    }
  }
  return items;
}
