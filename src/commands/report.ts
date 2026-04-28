import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { CliArgs } from "../types.js";

interface RuleEvent {
  ts: string;
  event: "loaded" | "violation" | "cited" | "judged_violation";
  rule_id: string;
  source?: string;
  file?: string;
  severity?: string;
  line?: number;
}

interface RuleStats {
  loaded: number;
  cited: number;
  violations: number;
  judged: number;
  files: Set<string>;
  lastSeen: string;
}

const EVENTS_PATH = ".aikit/events.jsonl";

export async function runReport(argv: CliArgs): Promise<void> {
  const format = (argv.format ?? "markdown") as "markdown" | "json";

  if (!existsSync(EVENTS_PATH)) {
    process.stdout.write(noTelemetryReport(format));
    return;
  }

  const events = parseEvents(readFileSync(EVENTS_PATH, "utf8"));
  if (events.length === 0) {
    process.stdout.write(noTelemetryReport(format));
    return;
  }

  const since = argv.since ? new Date(argv.since).toISOString() : null;
  const filtered = since ? events.filter((e) => e.ts >= since) : events;

  const known = collectKnownRuleIds();
  const stats = aggregate(filtered, known);

  if (format === "json") {
    process.stdout.write(JSON.stringify(toJsonReport(stats, filtered.length, since), null, 2) + "\n");
    return;
  }

  process.stdout.write(toMarkdownReport(stats, filtered.length, since));
}

function parseEvents(content: string): RuleEvent[] {
  const out: RuleEvent[] = [];
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const parsed = JSON.parse(trimmed) as RuleEvent;
      if (parsed.rule_id && parsed.event) out.push(parsed);
    } catch {
      // best-effort
    }
  }
  return out;
}

function collectKnownRuleIds(): Set<string> {
  const ids = new Set<string>();
  const candidates = ["AGENTS.md", "CLAUDE.md", ".claude/CLAUDE.md"];
  if (existsSync(".claude/rules")) {
    for (const f of readdirSync(".claude/rules")) {
      if (f.endsWith(".md")) candidates.push(join(".claude/rules", f));
    }
  }
  const idRx = /<!--\s*id:\s*([a-zA-Z][a-zA-Z0-9_-]*\.[a-zA-Z0-9._-]+)\s*-->/g;
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    const content = readFileSync(path, "utf8");
    for (const m of content.matchAll(idRx)) {
      if (m[1]) ids.add(m[1]);
    }
  }
  return ids;
}

function aggregate(events: RuleEvent[], known: Set<string>): Map<string, RuleStats> {
  const stats = new Map<string, RuleStats>();
  const seen = new Set<string>([...known]);

  for (const e of events) {
    seen.add(e.rule_id);
    let s = stats.get(e.rule_id);
    if (!s) {
      s = { loaded: 0, cited: 0, violations: 0, judged: 0, files: new Set(), lastSeen: e.ts };
      stats.set(e.rule_id, s);
    }
    if (e.event === "loaded") s.loaded++;
    else if (e.event === "cited") s.cited++;
    else if (e.event === "violation") s.violations++;
    else if (e.event === "judged_violation") s.judged++;
    if (e.file) s.files.add(e.file);
    if (e.ts > s.lastSeen) s.lastSeen = e.ts;
  }

  for (const id of seen) {
    if (!stats.has(id)) {
      stats.set(id, { loaded: 0, cited: 0, violations: 0, judged: 0, files: new Set(), lastSeen: "" });
    }
  }

  return stats;
}

function adherence(stats: Map<string, RuleStats>): { score: number; observed: number } {
  let observed = 0;
  let followed = 0;
  for (const s of stats.values()) {
    const interactions = s.loaded + s.cited + s.violations + s.judged;
    if (interactions === 0) continue;
    observed++;
    const negative = s.violations + s.judged;
    const positive = Math.max(s.loaded, 0) + s.cited;
    if (positive + negative === 0) continue;
    followed += positive / (positive + negative);
  }
  if (observed === 0) return { score: 0, observed: 0 };
  return { score: Math.round((followed / observed) * 100), observed };
}

function noTelemetryReport(format: "markdown" | "json"): string {
  if (format === "json") {
    return JSON.stringify({ status: "no_telemetry", message: "No .aikit/events.jsonl found yet." }, null, 2) + "\n";
  }
  return [
    "## Rule Observability",
    "",
    "_No telemetry yet. Run a Claude Code session in this repo, then re-run the report._",
    "",
  ].join("\n");
}

function toJsonReport(
  stats: Map<string, RuleStats>,
  totalEvents: number,
  since: string | null
): unknown {
  const { score, observed } = adherence(stats);
  return {
    generated_at: new Date().toISOString(),
    since,
    total_events: totalEvents,
    rule_count: stats.size,
    observed_rules: observed,
    adherence_score: score,
    rules: [...stats.entries()].map(([id, s]) => ({
      id,
      loaded: s.loaded,
      cited: s.cited,
      violations: s.violations,
      judged_violations: s.judged,
      files: [...s.files],
      last_seen: s.lastSeen,
    })),
  };
}

function toMarkdownReport(
  stats: Map<string, RuleStats>,
  totalEvents: number,
  since: string | null
): string {
  const { score, observed } = adherence(stats);
  const rows = [...stats.entries()].sort(([, a], [, b]) => b.loaded + b.violations - (a.loaded + a.violations));

  const hot = rows.filter(([, s]) => s.loaded > 0 && (s.violations + s.judged) === 0);
  const disputed = rows.filter(([, s]) => s.violations + s.judged > 0);
  const dead = rows.filter(([, s]) => s.loaded === 0 && s.cited === 0 && s.violations === 0 && s.judged === 0);

  const out: string[] = [];
  out.push("## 🔭 Rule Observability");
  out.push("");
  if (since) out.push(`_Since: \`${since}\`_`);
  out.push(`_Adherence: **${score}%** across ${observed} observed rules · ${totalEvents} events recorded_`);
  out.push("");

  if (disputed.length > 0) {
    out.push("### ⚠️ Rules under pressure");
    out.push("");
    out.push("| Rule | Loads | Pattern violations | Judged violations |");
    out.push("|---|---:|---:|---:|");
    for (const [id, s] of disputed) {
      out.push(`| \`${id}\` | ${s.loaded} | ${s.violations} | ${s.judged} |`);
    }
    out.push("");
  }

  if (hot.length > 0) {
    out.push("### ✅ Hot rules (loaded, no violations)");
    out.push("");
    for (const [id, s] of hot) {
      out.push(`- \`${id}\` — ${s.loaded} loads`);
    }
    out.push("");
  }

  if (dead.length > 0) {
    out.push("### 💀 Dead rules (declared but never observed)");
    out.push("");
    for (const [id] of dead) {
      out.push(`- \`${id}\` — consider removing or rephrasing`);
    }
    out.push("");
  }

  out.push("---");
  out.push(`<sub>Generated by \`aikit report\` · ${new Date().toISOString()}</sub>`);
  out.push("");

  return out.join("\n");
}
