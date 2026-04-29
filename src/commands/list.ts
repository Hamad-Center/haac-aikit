import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import kleur from "kleur";
import { CATALOG_ROOT } from "../catalog/index.js";
import type { CliArgs } from "../types.js";

interface CatalogItem {
  name: string;
  installed: boolean;
}

export async function runList(_argv: CliArgs): Promise<void> {
  const sections: { label: string; items: CatalogItem[] }[] = [
    { label: "Skills — Tier 1", items: listCategory("skills/tier1", ".claude/skills") },
    { label: "Skills — Tier 2", items: listCategory("skills/tier2", ".claude/skills") },
    { label: "Slash commands", items: listCategory("commands", ".claude/commands") },
    { label: "Agents", items: listCategory("agents", ".claude/agents") },
    { label: "Hooks", items: listCategory("hooks", ".claude/hooks", [".sh"]) },
    { label: "Path-scoped rules", items: listClaudeRules() },
  ];

  let total = 0;
  let installed = 0;

  for (const section of sections) {
    if (section.items.length === 0) continue;
    process.stdout.write(`\n${kleur.bold(section.label)}\n`);
    for (const item of section.items) {
      const mark = item.installed ? kleur.green("✓") : kleur.dim("·");
      const name = item.installed ? item.name : kleur.dim(item.name);
      process.stdout.write(`  ${mark}  ${name}\n`);
      total++;
      if (item.installed) installed++;
    }
  }

  process.stdout.write(`\n${installed}/${total} catalog items installed.\n`);
  if (installed < total) {
    process.stdout.write(
      `Run ${kleur.cyan("aikit add <name>")} to install individual items, or ${kleur.cyan("aikit sync")} to install all.\n`
    );
  }
}

function listCategory(
  catalogSubdir: string,
  installedDir: string,
  extensions = [".md"]
): CatalogItem[] {
  const catalogDir = join(CATALOG_ROOT, catalogSubdir);
  if (!existsSync(catalogDir)) return [];

  const installedFiles = new Set(
    existsSync(installedDir)
      ? readdirSync(installedDir).filter((f) => extensions.some((ext) => f.endsWith(ext)))
      : []
  );

  return readdirSync(catalogDir)
    .filter((f) => extensions.some((ext) => f.endsWith(ext)))
    .map((f) => ({
      name: stripExtension(f, extensions),
      installed: installedFiles.has(f),
    }));
}

function listClaudeRules(): CatalogItem[] {
  const catalogDir = join(CATALOG_ROOT, "rules", "claude-rules");
  if (!existsSync(catalogDir)) return [];

  const installedDir = ".claude/rules";
  const installedFiles = new Set(
    existsSync(installedDir)
      ? readdirSync(installedDir).filter((f) => f.endsWith(".md"))
      : []
  );

  return readdirSync(catalogDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => ({ name: stripExtension(f, [".md"]), installed: installedFiles.has(f) }));
}

function stripExtension(filename: string, extensions: string[]): string {
  for (const ext of extensions) {
    if (filename.endsWith(ext)) return filename.slice(0, -ext.length);
  }
  return filename;
}
