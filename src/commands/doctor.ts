import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import kleur from "kleur";
import { readConfig } from "../fs/readConfig.js";
import { extractRuleIds } from "../render/rule-ids.js";
import type { CliArgs } from "../types.js";

interface Finding {
  level: "error" | "warn" | "ok";
  check: string;
  message: string;
}

interface RuleEvent {
  ts: string;
  event: "loaded" | "violation" | "cited" | "judged_violation" | "rule_compile_error";
  rule_id: string;
  source?: string;
  file?: string;
  severity?: string;
  line?: number;
  pattern?: string;
  error?: string;
}

interface RuleStats {
  loadedCount: number;
  violationCount: number;
  citedCount: number;
  judgedCount: number;
  lastSeen: string;
  firstSeen: string;
  sources: Set<string>;
}

export async function runDoctor(argv: CliArgs): Promise<void> {
  // --rules subcommand: rule-effectiveness telemetry summary
  if (argv.rules) {
    runRulesReport(argv.format === "json" ? "json" : "text");
    return;
  }

  const findings: Finding[] = [];

  // 1. Config exists
  const config = readConfig(argv.config);
  if (!config) {
    findings.push({ level: "error", check: ".aikitrc.json", message: "Not found — run `aikit` to initialise." });
    printFindings(findings);
    return;
  }
  findings.push({ level: "ok", check: ".aikitrc.json", message: `version ${config.version}, scope: ${config.scope}` });

  // 2. AGENTS.md exists and has markers
  if (existsSync("AGENTS.md")) {
    const content = readFileSync("AGENTS.md", "utf8");
    if (content.includes("<!-- BEGIN:haac-aikit -->")) {
      const lines = content.split("\n").length;
      if (lines > 200) {
        findings.push({ level: "warn", check: "AGENTS.md", message: `${lines} lines — exceeds 200-line budget. Consider pruning.` });
      } else {
        findings.push({ level: "ok", check: "AGENTS.md", message: `${lines} lines, markers present` });
      }
    } else {
      findings.push({ level: "warn", check: "AGENTS.md", message: "No haac-aikit markers — run `aikit sync` to inject them." });
    }
  } else {
    findings.push({ level: "error", check: "AGENTS.md", message: "Missing — run `aikit sync`." });
  }

  // 3. Per-tool rule shims
  const toolChecks: Record<string, string> = {
    claude: "CLAUDE.md",
    copilot: ".github/copilot-instructions.md",
    cursor: ".cursor/rules/000-base.mdc",
    windsurf: ".windsurf/rules/project.md",
    aider: "CONVENTIONS.md",
    gemini: "GEMINI.md",
  };
  for (const tool of config.tools) {
    const file = toolChecks[tool];
    if (!file) continue;
    if (existsSync(file)) {
      findings.push({ level: "ok", check: `${tool} shim`, message: file });
    } else {
      findings.push({ level: "warn", check: `${tool} shim`, message: `${file} missing — run \`aikit sync\`` });
    }
  }

  // 4. Settings.json
  if (config.tools.includes("claude")) {
    if (existsSync(".claude/settings.json")) {
      findings.push({ level: "ok", check: "settings.json", message: ".claude/settings.json present" });
    } else {
      findings.push({ level: "warn", check: "settings.json", message: "Missing — run `aikit sync`" });
    }
  }

  // 5. Skills count
  if (config.scope !== "minimal") {
    const skillsDir = ".claude/skills";
    if (existsSync(skillsDir)) {
      const count = readdirSync(skillsDir).filter((f) => f.endsWith(".md")).length;
      findings.push({ level: "ok", check: "skills", message: `${count} installed` });
    } else {
      findings.push({ level: "warn", check: "skills", message: "Not installed — run `aikit sync`" });
    }
  }

  // 6. Skill description length (≤600 chars)
  const skillsDir = ".claude/skills";
  if (existsSync(skillsDir)) {
    const skills = readdirSync(skillsDir).filter((f) => f.endsWith(".md"));
    let descErrors = 0;
    for (const skill of skills) {
      const content = readFileSync(join(skillsDir, skill), "utf8");
      const descMatch = content.match(/^description:\s*(.+)$/m);
      if (descMatch?.[1] && (descMatch[1] as string).length > 600) {
        descErrors++;
        findings.push({
          level: "warn",
          check: `skill:${skill}`,
          message: `description is ${(descMatch[1] as string).length} chars — exceeds 600-char limit`,
        });
      }
    }
    if (descErrors === 0) {
      findings.push({ level: "ok", check: "skill descriptions", message: "All within 600-char limit" });
    }
  }

  // 6b. 0.4.0 artefacts (Claude + scope ≥ standard)
  if (config.tools.includes("claude") && config.scope !== "minimal") {
    for (const path of [
      ".claude/aikit-rules.json",
      "docs/claude-md-reference.md",
      ".claude/rules/example.md",
    ]) {
      if (existsSync(path)) {
        findings.push({ level: "ok", check: path, message: "present" });
      } else {
        findings.push({ level: "warn", check: path, message: "Missing — run `aikit sync`" });
      }
    }

    // Telemetry hooks (only when integrations.hooks is on).
    if (config.integrations.hooks) {
      for (const hook of ["log-rule-event.sh", "check-pattern-violations.sh", "judge-rule-compliance.sh"]) {
        const path = `.claude/hooks/${hook}`;
        if (existsSync(path)) {
          findings.push({ level: "ok", check: `telemetry:${hook}`, message: "installed" });
        } else {
          findings.push({ level: "warn", check: `telemetry:${hook}`, message: "Missing — run `aikit sync`" });
        }
      }
    }
  }

  // 7. Hooks registration
  if (config.integrations.hooks) {
    if (existsSync(".claude/hooks/hooks.json")) {
      findings.push({ level: "ok", check: "hooks", message: "hooks.json present" });
    } else {
      findings.push({ level: "warn", check: "hooks", message: "hooks.json missing — run `aikit sync`" });
    }
  }

  // 8. .gitignore contains .env*
  if (existsSync(".gitignore")) {
    const gi = readFileSync(".gitignore", "utf8");
    if (gi.includes(".env")) {
      findings.push({ level: "ok", check: ".gitignore", message: ".env* entries present" });
    } else {
      findings.push({ level: "warn", check: ".gitignore", message: ".env* not in .gitignore — secrets risk" });
    }
  } else {
    findings.push({ level: "warn", check: ".gitignore", message: "Missing — run `aikit sync` to create" });
  }

  printFindings(findings);
}

function printFindings(findings: Finding[]): void {
  const errors = findings.filter((f) => f.level === "error");
  const warns = findings.filter((f) => f.level === "warn");
  const oks = findings.filter((f) => f.level === "ok");

  for (const f of findings) {
    const icon =
      f.level === "error" ? kleur.red("✗") : f.level === "warn" ? kleur.yellow("⚠") : kleur.green("✓");
    process.stdout.write(`${icon}  ${kleur.bold(f.check)}: ${f.message}\n`);
  }

  process.stdout.write("\n");
  if (errors.length > 0) {
    process.stdout.write(kleur.red(`${errors.length} error(s), ${warns.length} warning(s)\n`));
    process.exit(1);
  } else if (warns.length > 0) {
    process.stdout.write(kleur.yellow(`0 errors, ${warns.length} warning(s) — run \`aikit sync\` to resolve\n`));
  } else {
    process.stdout.write(kleur.green(`All ${oks.length} checks passed.\n`));
  }
}

function runRulesReport(format: "text" | "json"): void {
  const eventsPath = ".aikit/events.jsonl";
  if (!existsSync(eventsPath)) {
    if (format === "json") {
      process.stdout.write(
        JSON.stringify({ status: "no_telemetry", message: ".aikit/events.jsonl not found" }, null, 2) + "\n"
      );
    } else {
      process.stdout.write(
        kleur.yellow("No telemetry yet. ") +
          "Hooks log to .aikit/events.jsonl on first session.\n" +
          "Run a Claude Code session in this repo, then re-run `aikit doctor --rules`.\n"
      );
    }
    return;
  }

  const { events, malformed } = parseEvents(readFileSync(eventsPath, "utf8"));
  if (events.length === 0) {
    if (format === "json") {
      process.stdout.write(JSON.stringify({ status: "empty_log", malformed }, null, 2) + "\n");
    } else {
      process.stdout.write(kleur.yellow("Telemetry log is empty. No rule events recorded yet.\n"));
    }
    return;
  }

  const known = collectKnownRuleIds();
  const stats = aggregateStats(events, known);
  const compileErrors = collectCompileErrors(events);

  if (format === "json") {
    process.stdout.write(JSON.stringify(toRulesJson(stats, events.length, malformed, compileErrors), null, 2) + "\n");
    return;
  }

  printRulesReport(stats, events.length, malformed, compileErrors);
}

function toRulesJson(
  stats: Map<string, RuleStats>,
  totalEvents: number,
  malformed: number,
  compileErrors: CompileError[]
): unknown {
  return {
    generated_at: new Date().toISOString(),
    total_events: totalEvents,
    malformed_lines: malformed,
    rules: [...stats.entries()].map(([id, s]) => {
      const cls = classifyRule(s);
      return {
        id,
        bucket: cls.bucket,
        loaded: s.loadedCount,
        cited: s.citedCount,
        violations: s.violationCount,
        judged_violations: s.judgedCount,
        last_seen: s.lastSeen,
        advice: cls.advice,
      };
    }),
    compile_errors: compileErrors.map((ce) => ({
      rule_id: ce.ruleId,
      pattern: ce.pattern,
      error: ce.error,
      ts: ce.ts,
    })),
  };
}

interface CompileError {
  ruleId: string;
  pattern: string;
  error: string;
  ts: string;
}

function collectCompileErrors(events: RuleEvent[]): CompileError[] {
  const latestByRule = new Map<string, CompileError>();
  for (const e of events) {
    if (e.event !== "rule_compile_error") continue;
    const existing = latestByRule.get(e.rule_id);
    if (!existing || e.ts > existing.ts) {
      latestByRule.set(e.rule_id, {
        ruleId: e.rule_id,
        pattern: e.pattern ?? "",
        error: e.error ?? "(no detail)",
        ts: e.ts,
      });
    }
  }
  return [...latestByRule.values()];
}

function parseEvents(content: string): { events: RuleEvent[]; malformed: number } {
  const out: RuleEvent[] = [];
  let malformed = 0;
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const parsed = JSON.parse(trimmed) as RuleEvent;
      if (parsed.rule_id && parsed.event) out.push(parsed);
      else malformed++;
    } catch {
      malformed++;
    }
  }
  return { events: out, malformed };
}

function collectKnownRuleIds(): Set<string> {
  // Scan AGENTS.md and .claude/rules/*.md for declared rule IDs.
  const ids = new Set<string>();
  const candidates = ["AGENTS.md", "CLAUDE.md", ".claude/CLAUDE.md"];
  if (existsSync(".claude/rules")) {
    for (const f of readdirSync(".claude/rules")) {
      if (f.endsWith(".md")) candidates.push(join(".claude/rules", f));
    }
  }
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    for (const id of extractRuleIds(readFileSync(path, "utf8"))) ids.add(id);
  }
  return ids;
}

function aggregateStats(events: RuleEvent[], known: Set<string>): Map<string, RuleStats> {
  const stats = new Map<string, RuleStats>();
  const seenIds = new Set<string>([...known]);

  for (const e of events) {
    seenIds.add(e.rule_id);
    let s = stats.get(e.rule_id);
    if (!s) {
      s = { loadedCount: 0, violationCount: 0, citedCount: 0, judgedCount: 0, lastSeen: e.ts, firstSeen: e.ts, sources: new Set() };
      stats.set(e.rule_id, s);
    }
    if (e.event === "loaded") s.loadedCount++;
    else if (e.event === "violation") s.violationCount++;
    else if (e.event === "cited") s.citedCount++;
    else if (e.event === "judged_violation") s.judgedCount++;
    if (e.source) s.sources.add(e.source);
    if (e.file) s.sources.add(e.file);
    if (e.ts > s.lastSeen) s.lastSeen = e.ts;
    if (e.ts < s.firstSeen) s.firstSeen = e.ts;
  }

  // Surface known-but-never-fired rules so they appear in the "dead" bucket.
  for (const id of seenIds) {
    if (!stats.has(id)) {
      stats.set(id, {
        loadedCount: 0,
        violationCount: 0,
        citedCount: 0,
        judgedCount: 0,
        lastSeen: "",
        firstSeen: "",
        sources: new Set(),
      });
    }
  }

  return stats;
}

function classifyRule(s: RuleStats): { bucket: "hot" | "disputed" | "dead" | "unused"; advice: string } {
  const negative = s.violationCount + s.judgedCount;
  const interactions = s.loadedCount + s.citedCount + negative;

  if (interactions === 0) {
    return { bucket: "dead", advice: "Never loaded, cited, or violated — consider removing or rephrasing." };
  }
  // A rule with negatives but no loads is a pattern hit on a rule the agent
  // never saw — likely a rules-file-presence problem, not an adherence issue.
  if (s.loadedCount === 0 && s.citedCount === 0) {
    return { bucket: "unused", advice: "Pattern violations recorded but rule not loaded — check rule file presence." };
  }
  if (negative > 0) {
    // Compare negatives to engaged signal (cited > loaded as "rule was actually
    // applied"). Fall back to loadedCount if no cited evidence is available.
    const denominator = s.citedCount > 0 ? s.citedCount + negative : Math.max(s.loadedCount, 1);
    const ratio = negative / denominator;
    if (ratio > 0.3) {
      return { bucket: "disputed", advice: "Frequently violated — strengthen with IMPORTANT/YOU MUST or move to a hook." };
    }
    return { bucket: "hot", advice: "Active rule with occasional violations — keep monitoring." };
  }
  return { bucket: "hot", advice: "Loaded and obeyed — keep." };
}

function printRulesReport(stats: Map<string, RuleStats>, totalEvents: number, malformed: number, compileErrors: CompileError[]): void {
  const rows: Array<{ id: string; stats: RuleStats; bucket: string; advice: string }> = [];
  for (const [id, s] of stats) {
    const cls = classifyRule(s);
    rows.push({ id, stats: s, bucket: cls.bucket, advice: cls.advice });
  }

  const hot = rows.filter((r) => r.bucket === "hot");
  const disputed = rows.filter((r) => r.bucket === "disputed");
  const dead = rows.filter((r) => r.bucket === "dead");
  const unused = rows.filter((r) => r.bucket === "unused");

  process.stdout.write(kleur.bold("Rule observability — ") + kleur.dim(`${totalEvents} events across ${rows.length} rules`) + "\n\n");

  if (hot.length > 0) {
    process.stdout.write(kleur.green("✓ Hot rules (working as intended)\n"));
    for (const r of hot) {
      const v = r.stats.violationCount > 0 ? kleur.yellow(` ${r.stats.violationCount} violations`) : "";
      process.stdout.write(`  ${kleur.bold(r.id)} — ${r.stats.loadedCount} loads${v}\n`);
    }
    process.stdout.write("\n");
  }

  if (disputed.length > 0) {
    process.stdout.write(kleur.yellow("⚠ Disputed rules (>30% violation rate)\n"));
    for (const r of disputed) {
      process.stdout.write(`  ${kleur.bold(r.id)} — ${r.stats.loadedCount} loads, ${r.stats.violationCount} violations\n`);
      process.stdout.write(`    ${kleur.dim(r.advice)}\n`);
    }
    process.stdout.write("\n");
  }

  if (dead.length > 0) {
    process.stdout.write(kleur.red("✗ Dead rules (never observed)\n"));
    for (const r of dead) {
      process.stdout.write(`  ${kleur.bold(r.id)}\n`);
      process.stdout.write(`    ${kleur.dim(r.advice)}\n`);
    }
    process.stdout.write("\n");
  }

  if (unused.length > 0) {
    process.stdout.write(kleur.yellow("⚠ Pattern hits without rule load\n"));
    for (const r of unused) {
      process.stdout.write(`  ${kleur.bold(r.id)} — ${r.stats.violationCount} pattern hits\n`);
      process.stdout.write(`    ${kleur.dim(r.advice)}\n`);
    }
    process.stdout.write("\n");
  }

  process.stdout.write(kleur.dim(`Hot: ${hot.length}  ·  Disputed: ${disputed.length}  ·  Dead: ${dead.length}  ·  Unmatched: ${unused.length}\n`));

  if (compileErrors.length > 0) {
    process.stdout.write(kleur.red(`\n✗ Rule pattern compile errors (${compileErrors.length})\n`));
    for (const ce of compileErrors) {
      process.stdout.write(`  ${kleur.bold(ce.ruleId)} — ${kleur.dim(ce.error)}\n`);
      if (ce.pattern) process.stdout.write(`    pattern: ${kleur.dim(ce.pattern)}\n`);
    }
    process.stdout.write(kleur.dim("  Fix these regex patterns in .claude/aikit-rules.json.\n"));
  }

  if (malformed > 0) {
    process.stdout.write(
      kleur.yellow(`\n⚠  ${malformed} malformed line(s) in .aikit/events.jsonl were skipped.\n`) +
        kleur.dim("   This usually means a hook crashed mid-write. Adherence numbers reflect only the parsed lines.\n")
    );
  }
}
