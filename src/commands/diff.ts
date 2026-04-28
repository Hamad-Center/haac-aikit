import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import kleur from "kleur";
import { readConfig } from "../fs/readConfig.js";
import { CATALOG_ROOT, loadCatalog } from "../catalog/index.js";
import type { CliArgs } from "../types.js";

export async function runDiff(argv: CliArgs): Promise<void> {
  const config = readConfig(argv.config);
  if (!config) {
    process.stderr.write(".aikitrc.json not found. Run `aikit` to initialise.\n");
    process.exit(1);
  }

  const catalog = loadCatalog();
  const drifted: string[] = [];
  const missing: string[] = [];

  // Check AGENTS.md managed region
  if (existsSync("AGENTS.md")) {
    const current = readFileSync("AGENTS.md", "utf8");
    const freshContent = catalog.agentsMd({
      projectName: config.projectName,
      description: config.projectDescription ?? "",
    });
    const begin = "<!-- BEGIN:haac-aikit -->";
    const end = "<!-- END:haac-aikit -->";
    const currentRegion = extractRegion(current, begin, end);
    // freshContent already contains markers (from the .tmpl file), so extract directly
    const freshRegion = extractRegion(freshContent, begin, end);
    if (currentRegion !== freshRegion) {
      drifted.push("AGENTS.md (managed region differs from catalog template)");
    }
  } else {
    missing.push("AGENTS.md");
  }

  // Check skill files
  checkCatalogDir("skills/tier1", ".claude/skills", missing, drifted);
  checkCatalogDir("skills/tier2", ".claude/skills", missing, drifted);
  checkCatalogDir("agents", ".claude/agents", missing, drifted);
  checkCatalogDir("hooks", ".claude/hooks", missing, drifted, [".sh"]);

  // Claude-only assets shipped at standard+ scope
  if (config.tools.includes("claude") && config.scope !== "minimal") {
    checkCatalogDir("rules/claude-rules", ".claude/rules", missing, drifted);
    const refPath = "docs/claude-md-reference.md";
    if (!existsSync(refPath)) {
      missing.push(refPath);
    } else {
      const fresh = catalog.claudeMdReference();
      if (readFileSync(refPath, "utf8") !== fresh) {
        drifted.push(refPath);
      }
    }
    const rulesPath = ".claude/aikit-rules.json";
    if (!existsSync(rulesPath)) {
      missing.push(rulesPath);
    } else {
      const fresh = catalog.aikitRulesJson();
      if (readFileSync(rulesPath, "utf8") !== fresh) {
        drifted.push(rulesPath);
      }
    }
  }

  if (missing.length === 0 && drifted.length === 0) {
    process.stdout.write(kleur.green("✓ No drift — project is in sync with catalog.\n"));
    return;
  }

  if (missing.length > 0) {
    process.stdout.write(kleur.yellow(`Missing (${missing.length}):\n`));
    for (const m of missing) process.stdout.write(`  · ${m}\n`);
  }

  if (drifted.length > 0) {
    process.stdout.write(kleur.cyan(`Drifted (${drifted.length}):\n`));
    for (const d of drifted) process.stdout.write(`  ~ ${d}\n`);
  }

  process.stdout.write(`\nRun ${kleur.cyan("aikit sync")} to update all, or ${kleur.cyan("aikit update")} to review changes first.\n`);
}

function extractRegion(content: string, begin: string, end: string): string {
  const bi = content.indexOf(begin);
  const ei = content.indexOf(end);
  if (bi === -1 || ei === -1) return "";
  return content.slice(bi + begin.length, ei).trim();
}

function checkCatalogDir(
  catalogSubdir: string,
  installedDir: string,
  missing: string[],
  drifted: string[],
  extensions = [".md"]
): void {
  const catalogDir = join(CATALOG_ROOT, catalogSubdir);
  if (!existsSync(catalogDir)) return;

  const files = readdirSync(catalogDir).filter((f) =>
    extensions.some((ext) => f.endsWith(ext))
  );

  for (const file of files) {
    const installedPath = join(installedDir, file);
    if (!existsSync(installedPath)) {
      missing.push(`${installedDir}/${file}`);
      continue;
    }
    const catalogContent = readFileSync(join(catalogDir, file), "utf8");
    const installedContent = readFileSync(installedPath, "utf8");
    if (catalogContent !== installedContent) {
      drifted.push(`${installedDir}/${file}`);
    }
  }
}
