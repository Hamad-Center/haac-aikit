import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import kleur from "kleur";
import { readConfig } from "../fs/readConfig.js";
import {
  CATALOG_ROOT,
  listSkillFolders,
  loadCatalog,
  skillFolder,
} from "../catalog/index.js";
import type { AikitConfig, CliArgs } from "../types.js";

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
  checkCatalogSkillTier("tier1", missing, drifted);
  checkCatalogSkillTier("tier2", missing, drifted);
  checkCatalogDir("agents/tier1", ".claude/agents", missing, drifted);
  checkCatalogAgentsTier2(config, missing, drifted);
  checkCatalogDir("hooks", ".claude/hooks", missing, drifted, [".sh"]);

  // Claude-only assets
  if (config.tools.includes("claude")) {
    checkCatalogDir("rules/claude-rules", ".claude/rules", missing, drifted);
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

function checkCatalogAgentsTier2(
  config: AikitConfig,
  missing: string[],
  drifted: string[],
): void {
  const tier2Selection = config.agents?.tier2;
  if (tier2Selection === "all") {
    checkCatalogDir("agents/tier2", ".claude/agents", missing, drifted);
    return;
  }

  const expected = new Set<string>(
    Array.isArray(tier2Selection) ? tier2Selection : []
  );

  if (expected.size === 0) return;

  const tier2Dir = join(CATALOG_ROOT, "agents", "tier2");
  if (!existsSync(tier2Dir)) return;

  for (const name of expected) {
    const catalogPath = join(tier2Dir, `${name}.md`);
    const installedPath = join(".claude/agents", `${name}.md`);
    if (!existsSync(catalogPath)) continue; // user-named agent not in catalog — ignore
    if (!existsSync(installedPath)) {
      missing.push(`agents/${name}.md`);
      continue;
    }
    // drift check (compare contents)
    if (readFileSync(catalogPath, "utf8") !== readFileSync(installedPath, "utf8")) {
      drifted.push(`agents/${name}.md`);
    }
  }
}

function checkCatalogSkillTier(
  tier: "tier1" | "tier2",
  missing: string[],
  drifted: string[],
): void {
  const destRoot = ".claude/skills";
  for (const name of listSkillFolders(tier)) {
    const srcRoot = skillFolder(tier, name);
    for (const srcFile of walkFiles(srcRoot)) {
      const rel = relative(srcRoot, srcFile);
      const destFile = join(destRoot, name, rel);
      if (!existsSync(destFile)) {
        missing.push(destFile);
        continue;
      }
      if (readFileSync(srcFile, "utf8") !== readFileSync(destFile, "utf8")) {
        drifted.push(destFile);
      }
    }
  }
}

function walkFiles(root: string): string[] {
  const out: string[] = [];
  if (!existsSync(root)) return out;
  for (const entry of readdirSync(root)) {
    const full = join(root, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walkFiles(full));
    } else {
      out.push(full);
    }
  }
  return out;
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
