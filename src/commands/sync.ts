import * as p from "@clack/prompts";
import { readConfig } from "../fs/readConfig.js";
import { safeWrite } from "../fs/safeWrite.js";
import { ensureGitignoreEntries } from "../fs/gitignore.js";
import { CATALOG_ROOT, loadCatalog } from "../catalog/index.js";
import { existsSync, mkdirSync, copyFileSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseRuleSet, translateForCursor } from "../render/dialects/index.js";
import { extractMarkerRegion } from "../render/markers.js";
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
  // The rendered template already contains BEGIN/END markers around its
  // managed region. Pass only that inner region to safeWrite so re-syncs don't
  // nest markers (regression: pre-0.5 produced 2 BEGINs / 5 ENDs after 3 syncs).
  const agentsMdManaged = extractMarkerRegion(agentsMdContent, "AGENTS.md") ?? agentsMdContent;
  results.push(safeWrite("AGENTS.md", agentsMdContent, { ...opts, useMarkers: true, managedContent: agentsMdManaged }));

  if (config.tools.includes("claude")) {
    results.push(safeWrite("CLAUDE.md", catalog.claudeMd(), { ...opts, useMarkers: false }));
    results.push(safeWrite(".claude/settings.json", catalog.settingsJson(), { ...opts, useMarkers: false }));
    if (config.scope !== "minimal") {
      results.push(safeWrite("docs/claude-md-reference.md", catalog.claudeMdReference(), { ...opts, useMarkers: false }));
      results.push(safeWrite(".claude/aikit-rules.json", catalog.aikitRulesJson(), { ...opts, useMarkers: false }));
      results.push(...syncDir("rules/claude-rules", ".claude/rules", dryRun, [".md"]));
    }
  }
  if (config.tools.includes("copilot")) {
    results.push(safeWrite(".github/copilot-instructions.md", catalog.copilotInstructions(), { ...opts, useMarkers: false }));
  }
  if (config.tools.includes("cursor")) {
    // Phase 2: dialect-aware translation. Parse the canonical AGENTS.md and
    // emit Cursor's MDC format with rules extracted, instead of a generic shim.
    const ruleSet = parseRuleSet(agentsMdContent, config.projectName, config.projectDescription ?? "");
    const cursorContent = translateForCursor(ruleSet);
    results.push(safeWrite(".cursor/rules/000-base.mdc", cursorContent, { ...opts, useMarkers: false }));
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
  const skipped = results.filter((r) => r.action === "skipped").length;
  const conflicts = results.filter((r) => r.action === "conflict");

  // Hide skipped (already up-to-date) entries from the per-file list to keep
  // the output focused on what actually changed. Show them only on dry-run
  // and only if there's genuine drift to display.
  const visible = dryRun
    ? results
    : results.filter((r) => r.action !== "skipped");

  if (dryRun) {
    p.note(visible.map((r) => `${r.action.padEnd(9)} ${r.path}`).join("\n"), "Dry run");
    return;
  }

  if (visible.length > 0) {
    p.note(
      visible.map((r) => `${r.action.padEnd(9)} ${r.path}`).join("\n"),
      `${created} created, ${updated} updated, ${skipped} unchanged`
    );
  } else {
    p.log.info(`Already up to date — ${skipped} files match the catalog.`);
  }

  if (conflicts.length > 0) {
    p.log.warn(`${conflicts.length} conflict(s) skipped (use --force to overwrite)`);
  }

  p.outro("Sync complete.");
}

// Resolve the right action for a copy-style sync. Captures pre-write state
// and compares content so we report `created` / `updated` / `skipped`
// honestly instead of always saying `updated`.
function copyAction(srcPath: string, destPath: string, dryRun: boolean): WriteResult {
  const existed = existsSync(destPath);
  const incoming = readFileSync(srcPath, "utf8");
  if (existed) {
    const current = readFileSync(destPath, "utf8");
    if (current === incoming) {
      return { path: destPath, action: "skipped" };
    }
  }
  if (!dryRun) copyFileSync(srcPath, destPath);
  return { path: destPath, action: existed ? "updated" : "created" };
}

function syncSkills(tier: "tier1" | "tier2", dryRun: boolean): WriteResult[] {
  const srcDir = join(CATALOG_ROOT, "skills", tier);
  const destDir = `.claude/skills`;
  const results: WriteResult[] = [];

  if (!existsSync(srcDir)) return results;

  const files = readdirSync(srcDir).filter((f) => f.endsWith(".md"));
  if (!dryRun) mkdirSync(destDir, { recursive: true });

  for (const file of files) {
    results.push(copyAction(join(srcDir, file), join(destDir, file), dryRun));
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
    results.push(copyAction(join(srcDir, file), join(destDir, file), dryRun));
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
    results.push(copyAction(src, dest, dryRun));
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
    results.push(copyAction(join(srcDir, file), join(destDir, file), dryRun));
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
    results.push(copyAction(join(srcDir, file), join(destDir, file), dryRun));
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
    results.push(copyAction(join(srcDir, file), join(destDir, file), dryRun));
  }

  return results;
}

function readCatalogFile(rel: string): string {
  return readFileSync(join(CATALOG_ROOT, rel), "utf8");
}
