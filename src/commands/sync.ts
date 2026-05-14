import * as p from "@clack/prompts";
import { readConfig, writeConfig } from "../fs/readConfig.js";
import { safeWrite } from "../fs/safeWrite.js";
import { ensureGitignoreEntries } from "../fs/gitignore.js";
import { CATALOG_ROOT, loadCatalog } from "../catalog/index.js";
import { existsSync, mkdirSync, copyFileSync, readdirSync, readFileSync, chmodSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { parseRuleSet, translateForCursor } from "../render/dialects/index.js";
import { interpolate } from "../render/template.js";
import { extractMarkerRegion } from "../render/markers.js";
import {
  parseFrontmatter,
  skillToCursorMdc,
  skillToWindsurfRule,
  skillToCopilotInstruction,
  skillToGeminiCommand,
  agentToCopilotAgent,
  agentToCodexToml,
  buildCursorHooksJson,
  buildCodexConfigToml,
  buildSkillsIndex,
} from "../render/translators.js";
import { interactivePrompt, inferTier3Slot, type ConflictPrompt } from "../fs/conflict.js";
import type { CliArgs, WriteResult, WriteOpts, AikitConfig, ConflictResolution } from "../types.js";

export async function runSync(argv: CliArgs & { _conflictPrompt?: ConflictPrompt }): Promise<void> {
  const dryRun = argv["dry-run"];
  const force = argv.force;
  const config = readConfig(argv.config);

  if (!config) {
    p.log.error(".aikitrc.json not found. Run `aikit` first to initialise.");
    process.exit(1);
  }

  p.log.info(`Syncing from .aikitrc.json`);

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

  // Load skills + agents from catalog once — each per-tool block translates them.
  const allSkills = loadSkillsFromCatalog();
  const allAgents = loadAgentsFromCatalog(config);
  const installedHookNames = listHookFiles();

  // ---------- Claude Code ----------
  if (config.tools.includes("claude")) {
    results.push(safeWrite("CLAUDE.md", catalog.claudeMd(), { ...opts, useMarkers: false }));
    results.push(safeWrite(".claude/settings.json", catalog.settingsJson(), { ...opts, useMarkers: false }));
    results.push(safeWrite(".claude/aikit-rules.json", catalog.aikitRulesJson(), { ...opts, useMarkers: false }));
    results.push(...syncDir("rules/claude-rules", ".claude/rules", opts, [".md"]));

    results.push(...syncSkills("tier1", opts));
    results.push(...syncSkills("tier2", opts));
    if (config.integrations.hooks) results.push(...syncHooks(opts));
    if (config.integrations.subagents) results.push(...syncAgents(config, opts));
    if (config.integrations.commands) results.push(...syncCommands(opts));
    if (config.integrations.mcp) {
      results.push(safeWrite(".mcp.json", catalog.mcpJson(), { ...opts, useMarkers: false }));
    }
  }

  // ---------- Cursor ----------
  if (config.tools.includes("cursor")) {
    const ruleSet = parseRuleSet(agentsMdContent, config.projectName, config.projectDescription ?? "");
    results.push(safeWrite(".cursor/rules/000-base.mdc", translateForCursor(ruleSet), { ...opts, useMarkers: false }));

    // Each skill becomes a Cursor rule that auto-loads on description match.
    for (const skill of allSkills) {
      const name = skill.frontmatter["name"];
      if (!name) continue;
      results.push(safeWrite(`.cursor/rules/skill-${name}.mdc`, skillToCursorMdc(skill), { ...opts, useMarkers: false }));
    }

    // Cursor 1.7+ hooks. Copy the safety shell scripts to .cursor/hooks/ and
    // wire them through .cursor/hooks.json so Cursor invokes them via stdio.
    if (config.integrations.hooks) {
      const srcDir = join(CATALOG_ROOT, "hooks");
      const destDir = ".cursor/hooks";
      if (existsSync(srcDir)) {
        if (!dryRun) mkdirSync(destDir, { recursive: true });
        for (const file of installedHookNames) {
          results.push(copyAction(join(srcDir, file), join(destDir, file), opts));
        }
        results.push(safeWrite(".cursor/hooks.json", buildCursorHooksJson(installedHookNames), { ...opts, useMarkers: false }));
      }
    }

    if (config.integrations.mcp) {
      results.push(safeWrite(".cursor/mcp.json", catalog.mcpJson(), { ...opts, useMarkers: false }));
    }
  }

  // ---------- Windsurf ----------
  if (config.tools.includes("windsurf")) {
    results.push(safeWrite(".windsurf/rules/project.md", catalog.windsurfRules(), { ...opts, useMarkers: false }));
    for (const skill of allSkills) {
      const name = skill.frontmatter["name"];
      if (!name) continue;
      results.push(safeWrite(`.windsurf/rules/skill-${name}.md`, skillToWindsurfRule(skill), { ...opts, useMarkers: false }));
    }
  }

  // ---------- Copilot ----------
  if (config.tools.includes("copilot")) {
    results.push(safeWrite(".github/copilot-instructions.md", catalog.copilotInstructions(), { ...opts, useMarkers: false }));

    for (const skill of allSkills) {
      const name = skill.frontmatter["name"];
      if (!name) continue;
      results.push(safeWrite(`.github/instructions/${name}.instructions.md`, skillToCopilotInstruction(skill), { ...opts, useMarkers: false }));
    }

    if (config.integrations.subagents) {
      for (const agent of allAgents) {
        const name = agent.frontmatter["name"];
        if (!name) continue;
        results.push(safeWrite(`.github/agents/${name}.agent.md`, agentToCopilotAgent(agent), { ...opts, useMarkers: false }));
      }
    }

    // Copilot in VS Code reads MCP servers from .vscode/mcp.json.
    // Per https://code.visualstudio.com/docs/copilot/customization/mcp-servers
    if (config.integrations.mcp) {
      results.push(safeWrite(".vscode/mcp.json", catalog.mcpJson(), { ...opts, useMarkers: false }));
    }
  }

  // ---------- Codex ----------
  if (config.tools.includes("codex")) {
    // AGENTS.md is already canonical for Codex — no separate shim needed.
    if (config.integrations.subagents) {
      for (const agent of allAgents) {
        const name = agent.frontmatter["name"];
        if (!name) continue;
        results.push(safeWrite(`.codex/agents/${name}.toml`, agentToCodexToml(agent), { ...opts, useMarkers: false }));
      }
    }
    // Codex config.toml always ships when codex is selected: it carries the
    // [features] codex_hooks flag, [agents] concurrency caps, and (if MCP is
    // enabled) the [mcp_servers.*] tables.
    const mcpJson = config.integrations.mcp ? catalog.mcpJson() : "{}";
    results.push(safeWrite(".codex/config.toml", buildCodexConfigToml(mcpJson), { ...opts, useMarkers: false }));
  }

  // ---------- Gemini ----------
  if (config.tools.includes("gemini")) {
    results.push(safeWrite("GEMINI.md", catalog.geminiMd(), { ...opts, useMarkers: false }));
    // HTML-artifact skills get namespaced under html/ so they invoke as
    // /html:docs etc. Other skills go in the root commands/ dir.
    // Per https://geminicli.com/docs/cli/custom-commands — subdir = namespace.
    const htmlSkillNames = new Set(["docs", "decide", "directions", "roadmap"]);
    for (const skill of allSkills) {
      const name = skill.frontmatter["name"];
      if (!name) continue;
      const subdir = htmlSkillNames.has(name) ? "html/" : "";
      results.push(safeWrite(`.gemini/commands/${subdir}${name}.toml`, skillToGeminiCommand(skill), { ...opts, useMarkers: false }));
    }
    // Gemini reads MCP servers from .gemini/settings.json `mcpServers`.
    // Per https://geminicli.com/docs/tools/mcp-server
    if (config.integrations.mcp) {
      results.push(safeWrite(".gemini/settings.json", catalog.mcpJson(), { ...opts, useMarkers: false }));
    }
  }

  // ---------- Aider ----------
  if (config.tools.includes("aider")) {
    // Aider has no rule loader. Ship CONVENTIONS.md with a skills index
    // appended so users see what's available; they paste a skill body into
    // chat when its `When to use` clause matches their task.
    const base = catalog.aiderConventions();
    const augmented = base.replace(/<!-- END:haac-aikit -->/, buildSkillsIndex(allSkills) + "<!-- END:haac-aikit -->");
    results.push(safeWrite("CONVENTIONS.md", augmented, { ...opts, useMarkers: false }));
    results.push(safeWrite(".aider.conf.yml", catalog.aiderConf(), { ...opts, useMarkers: false }));
  }

  // ---------- Tool-agnostic surfaces ----------
  // Templates: tool-agnostic — any agent or human can read them.
  results.push(...syncTemplates(opts));

  if (config.integrations.ci) {
    results.push(...syncCI(opts));
  }

  ensureGitignoreEntries(dryRun);

  const conflicts = results.filter((r) => r.action === "conflict");

  // Interactive conflict resolution: only when stdin is a TTY and neither
  // --yes nor --force was passed. Headless / CI paths skip this block.
  if (conflicts.length > 0 && !force) {
    // An injected _conflictPrompt is the test-seam signal: treat it as interactive
    // even without a real TTY so integration tests can exercise the loop.
    const isInteractive = (Boolean(process.stdin.isTTY) || argv._conflictPrompt != null) && !argv.yes;
    if (isInteractive) {
      const prompt = argv._conflictPrompt ?? interactivePrompt;
      let bulkAction: "replace_all" | "skip_all" | null = null;
      let configMutated = false;
      let workingConfig: AikitConfig = config;

      p.log.info(`Found ${conflicts.length} file(s) modified locally. Reviewing each…`);

      for (const conflict of conflicts) {
        const incomingSrc = conflict.src;
        if (!incomingSrc) continue;

        // Bulk skip_all: mark skipped and move on — no tier3 update.
        if (bulkAction === "skip_all") {
          conflict.action = "skipped";
          continue;
        }

        let resolution: ConflictResolution;
        if (bulkAction === "replace_all") {
          resolution = "replace";
        } else {
          const local = readFileSync(conflict.path, "utf8");
          const incoming = readFileSync(incomingSrc, "utf8");
          resolution = await prompt.ask(conflict.path, local, incoming);
          if (resolution === "replace_all") bulkAction = "replace_all";
          if (resolution === "skip_all") {
            // Treat the current file as a plain skip, then continue loop
            // with bulkAction = "skip_all" (no tier3 update for bulk skips).
            bulkAction = "skip_all";
            conflict.action = "skipped";
            continue;
          }
        }

        if (resolution === "replace" || resolution === "replace_all") {
          if (!opts.dryRun) copyFileSync(incomingSrc, conflict.path);
          conflict.action = "updated";
        } else if (resolution === "keep") {
          const slot = inferTier3Slot(conflict.path);
          if (slot) {
            const name = basename(conflict.path).replace(/\.md$/, "");
            const current = workingConfig[slot] ?? { tier1: "all", tier2: "all", tier3: [] };
            if (!current.tier3.includes(name)) {
              workingConfig = {
                ...workingConfig,
                [slot]: { ...current, tier3: [...current.tier3, name] },
              };
              configMutated = true;
            }
          } else {
            p.log.warn(
              `Kept ${conflict.path} — no tier3 protection available; this file will be flagged again on next sync.`
            );
          }
          conflict.action = "skipped";
        }
      }

      if (configMutated && !opts.dryRun) {
        writeConfig(workingConfig);
      }
    }
    // Non-interactive (--yes, non-TTY): fall through to the existing
    // "X conflict(s) skipped" warning below.
  }

  const created = results.filter((r) => r.action === "created").length;
  const updated = results.filter((r) => r.action === "updated").length;
  const skipped = results.filter((r) => r.action === "skipped").length;
  const remainingConflicts = results.filter((r) => r.action === "conflict");

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

  if (remainingConflicts.length > 0) {
    p.log.warn(`${remainingConflicts.length} conflict(s) skipped (use --force to overwrite)`);
  }

  // Codex silently drops .codex/* config in untrusted projects. Surface a
  // post-sync reminder so users don't think their hooks/agents are wired and
  // then wonder why nothing fires. See docs/observability for details.
  if (config.tools.includes("codex")) {
    p.log.info(
      "Codex: trust this project to enable .codex/ (config.toml, agents/, hooks). " +
      "Untrusted projects silently skip the project-local layer."
    );
  }

  p.outro("Sync complete.");
}

// Resolve the right action for a copy-style sync. Captures pre-write state
// and compares content so we report `created` / `updated` / `skipped` / `conflict`
// honestly instead of always saying `updated`.
export function copyAction(
  srcPath: string,
  destPath: string,
  opts: WriteOpts,
): WriteResult {
  const existed = existsSync(destPath);
  const incoming = readFileSync(srcPath, "utf8");
  if (existed) {
    const current = readFileSync(destPath, "utf8");
    if (current === incoming) {
      return { path: destPath, action: "skipped", src: srcPath };
    }
    if (!opts.force) {
      return { path: destPath, action: "conflict", src: srcPath };
    }
  }
  if (!opts.dryRun) {
    mkdirSync(dirname(destPath), { recursive: true });
    copyFileSync(srcPath, destPath);
    if (destPath.endsWith(".sh") || destPath.includes("/.husky/") || destPath.includes("/.claude/hooks/")) {
      chmodSync(destPath, 0o755);
    }
  }
  return { path: destPath, action: existed ? "updated" : "created", src: srcPath };
}

/** Read every skill from the catalog (tier1 + tier2) and parse its frontmatter. */
function loadSkillsFromCatalog(): ReturnType<typeof parseFrontmatter>[] {
  const out: ReturnType<typeof parseFrontmatter>[] = [];
  for (const tier of ["tier1", "tier2"] as const) {
    const dir = join(CATALOG_ROOT, "skills", tier);
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".md"))) {
      const content = readFileSync(join(dir, file), "utf8");
      out.push(parseFrontmatter(content));
    }
  }
  return out;
}

/**
 * Read agents the user has opted into from the catalog and parse them. Mirrors
 * the selection logic in syncAgents (tier1 = all by default, tier2 = explicit
 * list or 'all').
 */
function loadAgentsFromCatalog(config: AikitConfig): ReturnType<typeof parseFrontmatter>[] {
  const out: ReturnType<typeof parseFrontmatter>[] = [];
  const tier1Sel = config.agents?.tier1 ?? "all";
  const tier2Sel = resolveTier2Set(config);

  for (const [tier, selection] of [["tier1", tier1Sel], ["tier2", tier2Sel]] as const) {
    const dir = join(CATALOG_ROOT, "agents", tier);
    if (!existsSync(dir)) continue;
    const allNames = readdirSync(dir)
      .filter((f) => f.endsWith(".md"))
      .map((f) => f.replace(/\.md$/, ""));
    const include = selection === "all" ? allNames : allNames.filter((a) => selection.includes(a));
    for (const name of include) {
      const content = readFileSync(join(dir, `${name}.md`), "utf8");
      out.push(parseFrontmatter(content));
    }
  }
  return out;
}

/** Names of every hook shell script in the catalog (for hooks.json wiring). */
function listHookFiles(): string[] {
  const dir = join(CATALOG_ROOT, "hooks");
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith(".sh"));
}

function syncSkills(tier: "tier1" | "tier2", opts: WriteOpts): WriteResult[] {
  const srcDir = join(CATALOG_ROOT, "skills", tier);
  const destDir = `.claude/skills`;
  const results: WriteResult[] = [];

  if (!existsSync(srcDir)) return results;

  const files = readdirSync(srcDir).filter((f) => f.endsWith(".md"));
  if (!opts.dryRun) mkdirSync(destDir, { recursive: true });

  for (const file of files) {
    results.push(copyAction(join(srcDir, file), join(destDir, file), opts));
  }

  return results;
}

function syncTemplates(opts: WriteOpts): WriteResult[] {
  const srcRoot = join(CATALOG_ROOT, "templates");
  const results: WriteResult[] = [];

  if (!existsSync(srcRoot)) return results;

  // Each child of catalog/templates/ becomes a synced subdirectory under
  // .aikit/templates/. Today: docs/ (the /docs starter) and decide/ (the
  // /decide tradeoff template).
  for (const pack of readdirSync(srcRoot)) {
    const srcDir = join(srcRoot, pack);
    const destDir = join(".aikit/templates", pack);
    if (!existsSync(srcDir)) continue;

    if (!opts.dryRun) mkdirSync(destDir, { recursive: true });

    // Templates ship pristine — include .html, .json, .md.
    const files = readdirSync(srcDir).filter((f) =>
      f.endsWith(".html") || f.endsWith(".json") || f.endsWith(".md")
    );
    for (const file of files) {
      results.push(copyAction(join(srcDir, file), join(destDir, file), opts));
    }
  }

  return results;
}

function syncHooks(opts: WriteOpts): WriteResult[] {
  const srcDir = join(CATALOG_ROOT, "hooks");
  const destDir = `.claude/hooks`;
  const results: WriteResult[] = [];

  if (!existsSync(srcDir)) return results;

  const files = readdirSync(srcDir).filter((f) => f.endsWith(".sh") || f === "hooks.json");
  if (!opts.dryRun) mkdirSync(destDir, { recursive: true });

  for (const file of files) {
    results.push(copyAction(join(srcDir, file), join(destDir, file), opts));
  }

  return results;
}

function syncAgents(config: AikitConfig, opts: WriteOpts): WriteResult[] {
  const results: WriteResult[] = [];
  results.push(...syncAgentTier("tier1", config.agents?.tier1 ?? "all", opts));
  results.push(...syncAgentTier("tier2", resolveTier2Set(config), opts));
  return results;
}

function resolveTier2Set(config: AikitConfig): "all" | string[] {
  if (config.agents?.tier2 === "all") return "all";
  return Array.isArray(config.agents?.tier2) ? config.agents.tier2 : [];
}

function syncAgentTier(
  tier: "tier1" | "tier2",
  selection: "all" | string[],
  opts: WriteOpts,
): WriteResult[] {
  const srcDir = join(CATALOG_ROOT, "agents", tier);
  const destDir = ".claude/agents";
  const results: WriteResult[] = [];

  if (!existsSync(srcDir)) return results;

  const allAgents = readdirSync(srcDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));

  const agentsToInstall =
    selection === "all" ? allAgents : allAgents.filter((a) => selection.includes(a));

  if (!opts.dryRun) mkdirSync(destDir, { recursive: true });

  for (const agent of agentsToInstall) {
    const src = join(srcDir, `${agent}.md`);
    const dest = join(destDir, `${agent}.md`);
    results.push(copyAction(src, dest, opts));
  }
  return results;
}

function syncCommands(opts: WriteOpts): WriteResult[] {
  const srcDir = join(CATALOG_ROOT, "commands");
  const destDir = `.claude/commands`;
  const results: WriteResult[] = [];

  if (!existsSync(srcDir)) return results;

  const files = readdirSync(srcDir).filter((f) => f.endsWith(".md"));
  if (!opts.dryRun) mkdirSync(destDir, { recursive: true });

  for (const file of files) {
    results.push(copyAction(join(srcDir, file), join(destDir, file), opts));
  }

  return results;
}

function syncCI(opts: WriteOpts): WriteResult[] {
  const srcDir = join(CATALOG_ROOT, "ci");
  const destDir = `.github/workflows`;
  const results: WriteResult[] = [];

  if (!existsSync(srcDir)) return results;

  const files = readdirSync(srcDir).filter((f) => f.endsWith(".yml"));
  if (!opts.dryRun) mkdirSync(destDir, { recursive: true });

  for (const file of files) {
    results.push(copyAction(join(srcDir, file), join(destDir, file), opts));
  }

  return results;
}

function syncDir(
  catalogSubdir: string,
  destDir: string,
  opts: WriteOpts,
  extensions = [".md", ".json", ".yml", ".yaml"]
): WriteResult[] {
  const srcDir = join(CATALOG_ROOT, catalogSubdir);
  const results: WriteResult[] = [];

  if (!existsSync(srcDir)) return results;

  const files = readdirSync(srcDir).filter((f) =>
    extensions.length === 0 || extensions.some((ext) => f.endsWith(ext))
  );
  if (!opts.dryRun) mkdirSync(destDir, { recursive: true });

  for (const file of files) {
    results.push(copyAction(join(srcDir, file), join(destDir, file), opts));
  }

  return results;
}

function readCatalogFile(rel: string): string {
  return readFileSync(join(CATALOG_ROOT, rel), "utf8");
}
