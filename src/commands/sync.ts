import * as p from "@clack/prompts";
import { readConfig } from "../fs/readConfig.js";
import { safeWrite } from "../fs/safeWrite.js";
import { ensureGitignoreEntries } from "../fs/gitignore.js";
import { CATALOG_ROOT, loadCatalog } from "../catalog/index.js";
import { existsSync, mkdirSync, copyFileSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { CliArgs, WriteResult } from "../types.js";

export async function runSync(argv: CliArgs): Promise<void> {
  const dryRun = argv["dry-run"];
  const force = argv.force;
  const config = readConfig(argv.config);

  if (!config) {
    p.log.error(".aikitrc.json not found. Run `aikit` first to initialise.");
    process.exit(1);
  }

  p.log.info(`Syncing from .aikitrc.json (scope: ${config.scope})`);

  const catalog = loadCatalog();
  const results: WriteResult[] = [];
  const opts = { dryRun, force };

  // Rules
  const agentsMdContent = catalog.agentsMd({
    projectName: config.projectName,
    description: config.projectDescription ?? "",
  });
  results.push(safeWrite("AGENTS.md", agentsMdContent, { ...opts, useMarkers: true, managedContent: agentsMdContent }));

  if (config.tools.includes("claude")) {
    results.push(safeWrite("CLAUDE.md", catalog.claudeMd(), { ...opts, useMarkers: false }));
    results.push(safeWrite(".claude/settings.json", catalog.settingsJson(), { ...opts, useMarkers: false }));
    if (config.scope !== "minimal") {
      results.push(safeWrite("docs/claude-md-reference.md", catalog.claudeMdReference(), { ...opts, useMarkers: false }));
      results.push(...syncDir("rules/claude-rules", ".claude/rules", dryRun, [".md"]));
    }
  }
  if (config.tools.includes("copilot")) {
    results.push(safeWrite(".github/copilot-instructions.md", catalog.copilotInstructions(), { ...opts, useMarkers: false }));
  }
  if (config.tools.includes("cursor")) {
    results.push(safeWrite(".cursor/rules/000-base.mdc", catalog.cursorBase(), { ...opts, useMarkers: false }));
  }
  if (config.tools.includes("windsurf")) {
    results.push(safeWrite(".windsurf/rules/project.md", catalog.windsurfRules(), { ...opts, useMarkers: false }));
  }
  if (config.tools.includes("aider")) {
    results.push(safeWrite("CONVENTIONS.md", catalog.aiderConventions(), { ...opts, useMarkers: false }));
    results.push(safeWrite(".aider.conf.yml", catalog.aiderConf(), { ...opts, useMarkers: false }));
  }
  if (config.tools.includes("gemini")) {
    results.push(safeWrite("GEMINI.md", catalog.geminiMd(), { ...opts, useMarkers: false }));
  }

  // MCP
  if (config.integrations.mcp && config.tools.includes("claude")) {
    results.push(safeWrite(".mcp.json", catalog.mcpJson(), { ...opts, useMarkers: false }));
  }

  // Skills
  if (config.scope !== "minimal") {
    results.push(...syncSkills("tier1", dryRun));
    results.push(...syncSkills("tier2", dryRun));
  }

  // Hooks
  if (config.integrations.hooks) {
    results.push(...syncHooks(dryRun));
  }

  // Agents
  if (config.integrations.subagents) {
    results.push(...syncAgents(config.shape, dryRun));
  }

  // Commands
  if (config.integrations.commands) {
    results.push(...syncCommands(dryRun));
  }

  // CI
  if (config.integrations.ci) {
    results.push(...syncCI(dryRun));
  }

  // Everything tier
  if (config.integrations.devcontainer) {
    results.push(...syncDir("devcontainer", ".devcontainer", dryRun, [".json"]));
  }
  if (config.integrations.otel) {
    results.push(safeWrite(".env.example", readCatalogFile("settings/env.example"), { dryRun, useMarkers: false }));
  }

  ensureGitignoreEntries(dryRun);

  const created = results.filter((r) => r.action === "created").length;
  const updated = results.filter((r) => r.action === "updated").length;
  const conflicts = results.filter((r) => r.action === "conflict");

  if (dryRun) {
    p.note(results.map((r) => `${r.action.padEnd(9)} ${r.path}`).join("\n"), "Dry run");
    return;
  }

  p.note(
    results.map((r) => `${r.action.padEnd(9)} ${r.path}`).join("\n"),
    `${created} created, ${updated} updated`
  );

  if (conflicts.length > 0) {
    p.log.warn(`${conflicts.length} conflict(s) skipped (use --force to overwrite)`);
  }

  p.outro("Sync complete.");
}

function syncSkills(tier: "tier1" | "tier2", dryRun: boolean): WriteResult[] {
  const srcDir = join(CATALOG_ROOT, "skills", tier);
  const destDir = `.claude/skills`;
  const results: WriteResult[] = [];

  if (!existsSync(srcDir)) return results;

  const files = readdirSync(srcDir).filter((f) => f.endsWith(".md"));
  if (!dryRun) mkdirSync(destDir, { recursive: true });

  for (const file of files) {
    const dest = join(destDir, file);
    if (!dryRun) copyFileSync(join(srcDir, file), dest);
    results.push({ path: dest, action: existsSync(dest) ? "updated" : "created" });
  }

  return results;
}

function syncHooks(dryRun: boolean): WriteResult[] {
  const srcDir = join(CATALOG_ROOT, "hooks");
  const destDir = `.claude/hooks`;
  const results: WriteResult[] = [];

  if (!existsSync(srcDir)) return results;

  const files = readdirSync(srcDir).filter((f) => f.endsWith(".sh") || f === "hooks.json");
  if (!dryRun) mkdirSync(destDir, { recursive: true });

  for (const file of files) {
    const dest = join(destDir, file);
    if (!dryRun) copyFileSync(join(srcDir, file), dest);
    results.push({ path: dest, action: existsSync(dest) ? "updated" : "created" });
  }

  return results;
}

function syncAgents(shapes: string[], dryRun: boolean): WriteResult[] {
  const srcDir = join(CATALOG_ROOT, "agents");
  const destDir = `.claude/agents`;
  const results: WriteResult[] = [];

  if (!existsSync(srcDir)) return results;

  const CORE_AGENTS = ["orchestrator", "planner", "researcher", "implementer", "reviewer", "tester", "security-auditor", "devops"];
  const SHAPE_AGENTS: Record<string, string[]> = {
    web: ["frontend"],
    fullstack: ["frontend", "backend"],
    backend: ["backend"],
    mobile: ["mobile"],
    library: ["backend"],
  };

  const agentsToInstall = new Set(CORE_AGENTS);
  for (const shape of shapes) {
    for (const agent of (SHAPE_AGENTS[shape] ?? [])) {
      agentsToInstall.add(agent);
    }
  }

  if (!dryRun) mkdirSync(destDir, { recursive: true });

  for (const agent of agentsToInstall) {
    const src = join(srcDir, `${agent}.md`);
    const dest = join(destDir, `${agent}.md`);
    if (!existsSync(src)) continue;
    if (!dryRun) copyFileSync(src, dest);
    results.push({ path: dest, action: existsSync(dest) ? "updated" : "created" });
  }

  return results;
}

function syncCommands(dryRun: boolean): WriteResult[] {
  const srcDir = join(CATALOG_ROOT, "commands");
  const destDir = `.claude/commands`;
  const results: WriteResult[] = [];

  if (!existsSync(srcDir)) return results;

  const files = readdirSync(srcDir).filter((f) => f.endsWith(".md"));
  if (!dryRun) mkdirSync(destDir, { recursive: true });

  for (const file of files) {
    const dest = join(destDir, file);
    if (!dryRun) copyFileSync(join(srcDir, file), dest);
    results.push({ path: dest, action: existsSync(dest) ? "updated" : "created" });
  }

  return results;
}

function syncCI(dryRun: boolean): WriteResult[] {
  const srcDir = join(CATALOG_ROOT, "ci");
  const destDir = `.github/workflows`;
  const results: WriteResult[] = [];

  if (!existsSync(srcDir)) return results;

  const files = readdirSync(srcDir).filter((f) => f.endsWith(".yml"));
  if (!dryRun) mkdirSync(destDir, { recursive: true });

  for (const file of files) {
    const dest = join(destDir, file);
    if (!dryRun) copyFileSync(join(srcDir, file), dest);
    results.push({ path: dest, action: existsSync(dest) ? "updated" : "created" });
  }

  return results;
}

function syncDir(
  catalogSubdir: string,
  destDir: string,
  dryRun: boolean,
  extensions = [".md", ".json", ".yml", ".yaml"]
): WriteResult[] {
  const srcDir = join(CATALOG_ROOT, catalogSubdir);
  const results: WriteResult[] = [];

  if (!existsSync(srcDir)) return results;

  const files = readdirSync(srcDir).filter((f) =>
    extensions.some((ext) => f.endsWith(ext))
  );
  if (!dryRun) mkdirSync(destDir, { recursive: true });

  for (const file of files) {
    const dest = join(destDir, file);
    if (!dryRun) copyFileSync(join(srcDir, file), dest);
    results.push({ path: dest, action: existsSync(dest) ? "updated" : "created" });
  }

  return results;
}

function readCatalogFile(rel: string): string {
  return readFileSync(join(CATALOG_ROOT, rel), "utf8");
}
