/**
 * Translators: convert catalog skill/agent/hook content into each AI tool's
 * native loader format so the kit is actually cross-tool.
 *
 * Source: research/cross-tool-mechanisms (May 2026):
 *   - Cursor: .cursor/rules/*.mdc (description-triggered) + .cursor/hooks.json + .cursor/mcp.json
 *   - Windsurf: .windsurf/rules/*.md (trigger: model_decision)
 *   - Copilot: .github/instructions/*.instructions.md + .github/agents/*.agent.md
 *   - Codex: .codex/agents/*.toml + .codex/config.toml [mcp_servers]
 *   - Gemini: .gemini/commands/*.toml (manual /<name>)
 *   - Aider: append index to CONVENTIONS.md
 *
 * The parser is intentionally minimal — frontmatter in this catalog is simple
 * key:value pairs, no nested YAML structures except agent `tools:` lists, so a
 * full YAML lib is overkill.
 */

export interface ParsedDoc {
  frontmatter: Record<string, string>;
  body: string;
  toolsList?: string[]; // agents may have a `tools:` list (multi-line array)
}

/**
 * Extract `---`-bounded frontmatter from a catalog file. Returns the parsed
 * key/value pairs plus the body content below.
 *
 * Limitations (by design):
 *   - Top-level key: value only; nested structures (other than the `tools:`
 *     bullet list used by agents) are returned as raw strings.
 *   - Values aren't unquoted — `"1.0.0"` stays as `"1.0.0"` if quoted. Good
 *     enough for our consumers.
 */
export function parseFrontmatter(content: string): ParsedDoc {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match || !match[1]) {
    return { frontmatter: {}, body: content };
  }
  const fmRaw = match[1];
  const body = match[2] ?? "";
  const frontmatter: Record<string, string> = {};
  let toolsList: string[] | undefined;

  const lines = fmRaw.split(/\r?\n/);
  let inToolsList = false;
  for (const line of lines) {
    if (inToolsList) {
      const m = line.match(/^\s*-\s*(.+?)\s*$/);
      if (m && m[1]) {
        toolsList = toolsList ?? [];
        toolsList.push(m[1]);
        continue;
      }
      inToolsList = false;
    }
    const kv = line.match(/^([A-Za-z_][A-Za-z0-9_-]*)\s*:\s*(.*)$/);
    if (!kv || !kv[1]) continue;
    const key = kv[1];
    const val = (kv[2] ?? "").trim();
    if (key === "tools" && val === "") {
      inToolsList = true;
      continue;
    }
    frontmatter[key] = val;
  }
  const doc: ParsedDoc = { frontmatter, body: body.trimStart() };
  if (toolsList) doc.toolsList = toolsList;
  return doc;
}

/**
 * Build a Cursor `.mdc` rule file from a skill. Cursor auto-attaches rules
 * with a `description:` whenever the user's prompt matches — same trigger
 * mechanism Claude Code uses for skills.
 *
 * Per https://cursor.com/docs/context/rules, "Agent Requested" rules use the
 * description to decide whether to load.
 */
export function skillToCursorMdc(skill: ParsedDoc): string {
  const description = skill.frontmatter["description"] ?? "";
  // Escape backslashes BEFORE quotes so we don't double-escape the escapes.
  const escaped = description.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `---
description: "${escaped}"
alwaysApply: false
---

${skill.body}
`;
}

/**
 * Build a Windsurf rule file from a skill. Uses `trigger: model_decision` so
 * the model decides to load based on the description.
 *
 * Per https://docs.windsurf.com/windsurf/cascade/memories — workspace rules
 * cap at 12,000 characters per file; we truncate gracefully with a footer
 * pointing back to the canonical Claude location so the user can fetch the
 * full body if needed. Without this guard, Windsurf silently truncates and
 * the rule loads with mid-sentence cutoffs.
 */
const WINDSURF_FILE_LIMIT = 12000;

export function skillToWindsurfRule(skill: ParsedDoc): string {
  const description = skill.frontmatter["description"] ?? "";
  const name = skill.frontmatter["name"] ?? "(unnamed)";
  const header = `---\ntrigger: model_decision\ndescription: ${description}\n---\n\n`;
  const footer = `\n\n---\n_Truncated to fit Windsurf's 12k-char rule limit. Full skill: \`.claude/skills/${name}.md\` (after \`aikit sync\` with claude selected)._\n`;
  const budget = WINDSURF_FILE_LIMIT - header.length - footer.length - 100; // 100 char safety margin

  if (skill.body.length <= budget) {
    return header + skill.body + "\n";
  }
  // Truncate at a paragraph boundary if possible — find the last \n\n before the budget.
  const truncated = skill.body.slice(0, budget);
  const lastBreak = truncated.lastIndexOf("\n\n");
  const safeTruncate = lastBreak > budget * 0.7 ? truncated.slice(0, lastBreak) : truncated;
  return header + safeTruncate + footer;
}

/**
 * Build a Copilot path-scoped instruction file from a skill. `applyTo: '**'`
 * means it's available everywhere (skills aren't path-scoped, they're
 * intent-scoped). Copilot uses the body content as guidance when relevant.
 *
 * Per https://code.visualstudio.com/docs/copilot/copilot-customization
 */
export function skillToCopilotInstruction(skill: ParsedDoc): string {
  const description = skill.frontmatter["description"] ?? "";
  return `---
applyTo: '**'
description: ${description}
---

${skill.body}
`;
}

/**
 * Build a Gemini CLI custom slash command from a skill. Gemini commands are
 * manual-invocation only (the user types `/<name>`), so this translation
 * gives the user a portable command — the auto-trigger semantics are lost.
 *
 * Per https://geminicli.com/docs/cli/custom-commands/
 *
 * Uses TOML literal multi-line strings (`'''...'''`) when possible so
 * backslashes in the body don't need escaping (TOML 1.0 §6: literal strings
 * have NO escape processing). Falls back to basic strings only when the body
 * contains the literal-string terminator `'''`.
 */
export function skillToGeminiCommand(skill: ParsedDoc): string {
  const description = (skill.frontmatter["description"] ?? "").replace(/"/g, '\\"');
  return `description = "${description}"
prompt = ${tomlMultiline(skill.body)}
`;
}

/**
 * Emit a TOML multi-line string for arbitrary text. Prefers literal strings
 * (`'''`) which require no escaping; falls back to basic strings (`"""`)
 * with backslash + triple-quote escaping when the body contains `'''`.
 */
function tomlMultiline(body: string): string {
  if (!body.includes("'''")) {
    // Literal multi-line — no escape processing. Newline immediately after
    // the opening delimiter is trimmed by TOML (§6) so add one for legibility.
    return `'''\n${body}\n'''`;
  }
  // Fall back to basic string — escape `\` then `"""` (order matters).
  const escaped = body.replace(/\\/g, "\\\\").replace(/"""/g, '\\"\\"\\"');
  return `"""\n${escaped}\n"""`;
}

/**
 * Build a Copilot custom agent file from a haac-aikit agent.
 *
 * Per https://docs.github.com/en/copilot/reference/custom-agents-configuration —
 * canonical `.agent.md` fields are `name`, `description`, `prompt`, `tools`,
 * optionally `model`. `user-invocable` is a `.skill.md` field (a different
 * file format for user-invoked workflows) and would be unrecognised here.
 *
 * The agent body becomes the `prompt` content in the document body, which
 * Copilot uses as the persona system prompt when this agent is auto-loaded
 * by relevance. Auto-load semantics match Claude's subagent dispatch.
 *
 * Fields we don't translate yet (would need source data in catalog agent files):
 * - `argument-hint`: hint shown in chat UI
 * - `handoffs`: cross-agent dispatch graph (would map to our orchestrator
 *   agent's role)
 * - `mcp-servers`: per-agent MCP — kit's MCP is workspace-scoped
 */
export function agentToCopilotAgent(agent: ParsedDoc): string {
  const name = agent.frontmatter["name"] ?? "";
  const description = agent.frontmatter["description"] ?? "";
  const model = agent.frontmatter["model"] ?? "";
  const fm = [`name: ${name}`, `description: ${description}`];
  if (model) fm.push(`model: ${model}`);
  if (agent.toolsList && agent.toolsList.length > 0) {
    fm.push(`tools:`);
    for (const tool of agent.toolsList) fm.push(`  - ${tool}`);
  }
  return `---
${fm.join("\n")}
---

${agent.body}
`;
}

/**
 * Build a Codex subagent TOML from a haac-aikit agent. Codex uses a TOML
 * shape: `name`, `description`, `developer_instructions`, optional `model`.
 *
 * Per https://developers.openai.com/codex/subagents
 *
 * Uses TOML literal strings for `developer_instructions` (see tomlMultiline)
 * so backslashes and special chars in agent bodies survive unescaped.
 */
export function agentToCodexToml(agent: ParsedDoc): string {
  const name = agent.frontmatter["name"] ?? "";
  const description = agent.frontmatter["description"] ?? "";
  // Codex doesn't recognise Anthropic model IDs — leave model unset and let
  // Codex pick its default. Mapping Claude IDs to OpenAI IDs is out of scope.
  const escapedDesc = description.replace(/"/g, '\\"');
  return `name = "${name}"
description = "${escapedDesc}"
developer_instructions = ${tomlMultiline(agent.body)}
`;
}

/**
 * Build a Cursor hooks.json from the list of catalog hooks we ship.
 *
 * Per https://cursor.com/docs/agent/hooks — Cursor 1.7+ exposes 21 events
 * spanning session lifecycle, tool execution, shell execution, MCP execution,
 * subagent dispatch, and prompt submission.
 *
 * Hook entry fields used:
 * - `command`: shell command to run (relative to project root)
 * - `failClosed`: true for safety hooks → if the hook errors or times out,
 *   Cursor BLOCKS the operation instead of allowing through. Without this,
 *   a buggy hook = safety-net bypassed.
 *
 * Note on per-event filtering: our shell scripts self-filter (e.g.
 * `block-force-push-main.sh` exits 0 immediately if the command isn't a force
 * push). Cursor's `matcher` field schema has changed across versions and is
 * documented inconsistently, so we omit it and trust the scripts. The perf
 * cost is one fast `case` statement per shell command.
 */
export function buildCursorHooksJson(installedHooks: string[]): string {
  const has = (name: string): boolean => installedHooks.includes(`${name}.sh`);

  interface HookEntry {
    command: string;
    failClosed?: boolean;
  }
  const hooks: Record<string, HookEntry[]> = {};
  const add = (event: string, entry: HookEntry): void => {
    hooks[event] = hooks[event] ?? [];
    hooks[event].push(entry);
  };

  // ----- Safety hooks: failClosed=true so a broken hook is fail-safe -----
  if (has("block-dangerous-bash")) {
    add("beforeShellExecution", { command: ".cursor/hooks/block-dangerous-bash.sh", failClosed: true });
  }
  if (has("block-force-push-main")) {
    add("beforeShellExecution", { command: ".cursor/hooks/block-force-push-main.sh", failClosed: true });
  }
  if (has("block-secrets-in-commits")) {
    add("beforeShellExecution", { command: ".cursor/hooks/block-secrets-in-commits.sh", failClosed: true });
  }
  if (has("file-guard")) {
    add("beforeReadFile", { command: ".cursor/hooks/file-guard.sh", failClosed: true });
  }

  // ----- Lifecycle -----
  if (has("session-start-prime")) {
    add("sessionStart", { command: ".cursor/hooks/session-start-prime.sh" });
  }
  if (has("compaction-preservation")) {
    add("preCompact", { command: ".cursor/hooks/compaction-preservation.sh" });
  }

  // ----- Telemetry: observability parity with Claude Code -----
  if (has("log-rule-event")) {
    add("preToolUse", { command: ".cursor/hooks/log-rule-event.sh" });
    add("postToolUse", { command: ".cursor/hooks/log-rule-event.sh" });
    add("subagentStart", { command: ".cursor/hooks/log-rule-event.sh" });
    add("subagentStop", { command: ".cursor/hooks/log-rule-event.sh" });
  }
  if (has("check-pattern-violations")) {
    add("afterFileEdit", { command: ".cursor/hooks/check-pattern-violations.sh" });
  }
  if (has("judge-rule-compliance")) {
    add("stop", { command: ".cursor/hooks/judge-rule-compliance.sh" });
  }

  return JSON.stringify({ version: 1, hooks }, null, 2) + "\n";
}

/**
 * Build a Codex config.toml containing `[features]`, `[agents]` concurrency
 * knobs, and `[mcp_servers.*]` tables (translated from our Claude mcp.json).
 *
 * Per https://developers.openai.com/codex/config-advanced
 *
 * - `[features] codex_hooks = true` enables the experimental hooks system.
 *   Without this, hooks ship but don't fire.
 * - `[agents]` caps spawned-subagent runaway: max_threads (parallel agents),
 *   max_depth (subagent calling another subagent), job_max_runtime_seconds
 *   (hard ceiling so a runaway agent can't burn budget overnight).
 * - `[mcp_servers.*]` per-server tables: same shape Codex docs use.
 */
export function buildCodexConfigToml(mcpJson: string): string {
  const lines: string[] = [
    "# Generated by haac-aikit. Edit and re-sync with `aikit sync`.",
    "",
    "[features]",
    "# Enables the experimental hooks system so .codex/hooks (if shipped) actually fires.",
    "codex_hooks = true",
    "",
    "[agents]",
    "# Sensible defaults to prevent runaway subagent dispatch. Tune to taste.",
    "max_threads = 3",
    "max_depth = 2",
    "job_max_runtime_seconds = 300",
  ];

  // MCP servers — translated from our Claude .mcp.json.
  let parsed: { mcpServers?: Record<string, { command?: string; args?: string[]; env?: Record<string, string> }> };
  try {
    parsed = JSON.parse(mcpJson);
  } catch {
    return lines.join("\n") + "\n";
  }
  const servers = parsed.mcpServers ?? {};
  if (Object.keys(servers).length > 0) {
    lines.push("");
    lines.push("# MCP servers (translated from .mcp.json)");
  }
  for (const [serverName, cfg] of Object.entries(servers)) {
    lines.push(``);
    lines.push(`[mcp_servers.${serverName}]`);
    if (cfg.command) lines.push(`command = "${cfg.command}"`);
    if (cfg.args && cfg.args.length > 0) {
      const items = cfg.args.map((a) => `"${a.replace(/"/g, '\\"')}"`).join(", ");
      lines.push(`args = [${items}]`);
    }
    if (cfg.env && Object.keys(cfg.env).length > 0) {
      const envInline = Object.entries(cfg.env)
        .map(([k, v]) => `${k} = "${v}"`)
        .join(", ");
      lines.push(`env = { ${envInline} }`);
    }
  }
  return lines.join("\n") + "\n";
}

/**
 * Legacy export retained for backward compat with existing callers and tests.
 * New callers should use `buildCodexConfigToml`.
 */
export function mcpJsonToCodexToml(mcpJson: string): string {
  return buildCodexConfigToml(mcpJson);
}

/**
 * Build the skills-index appendix for tools without a native skill loader
 * (Aider). We list every installed skill by name + description so the user
 * sees what's available; to actually use one, they copy the skill body into
 * chat.
 */
export function buildSkillsIndex(skills: ParsedDoc[]): string {
  if (skills.length === 0) return "";
  const lines: string[] = ["", "## Available skills (from haac-aikit)", "", "These are pattern-specific protocols. Copy a skill's content into chat when its `When to use` clause matches your task. Each skill lives at `.claude/skills/<name>.md`.", ""];
  for (const skill of skills) {
    const name = skill.frontmatter["name"] ?? "(unnamed)";
    const description = skill.frontmatter["description"] ?? "";
    const oneLine = description.split(/[.!?]/)[0]?.trim() ?? description;
    lines.push(`- **${name}** — ${oneLine}.`);
  }
  return lines.join("\n") + "\n";
}
