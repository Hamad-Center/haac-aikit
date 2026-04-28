import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runReport } from "../src/commands/report.js";

let tmpDir: string;
let origCwd: string;
let stdout: string;

function captureStdout(): void {
  stdout = "";
  vi.spyOn(process.stdout, "write").mockImplementation((chunk: unknown) => {
    stdout += typeof chunk === "string" ? chunk : String(chunk);
    return true;
  });
}

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "haac-report-"));
  origCwd = process.cwd();
  process.chdir(tmpDir);
  captureStdout();
});

afterEach(() => {
  process.chdir(origCwd);
  vi.restoreAllMocks();
});

function writeEvents(events: object[]): void {
  mkdirSync(".aikit", { recursive: true });
  writeFileSync(".aikit/events.jsonl", events.map((e) => JSON.stringify(e)).join("\n") + "\n");
}

function writeAgentsMd(ruleIds: string[]): void {
  const lines = ruleIds.map((id) => `- <!-- id: ${id} --> rule for ${id}`).join("\n");
  writeFileSync("AGENTS.md", `# test\n\n<!-- BEGIN:haac-aikit -->\n${lines}\n<!-- END:haac-aikit -->\n`);
}

describe("aikit report", () => {
  it("emits a 'no telemetry' notice when events.jsonl is missing", async () => {
    await runReport({ _: ["report"], format: "markdown" } as never);
    expect(stdout).toContain("Rule Observability");
    expect(stdout).toContain("No telemetry yet");
  });

  it("emits markdown by default", async () => {
    writeAgentsMd(["code-style.no-default-export"]);
    writeEvents([
      { ts: "2026-04-29T00:00:00Z", event: "loaded", rule_id: "code-style.no-default-export", source: "AGENTS.md" },
      { ts: "2026-04-29T00:01:00Z", event: "loaded", rule_id: "code-style.no-default-export", source: "AGENTS.md" },
    ]);

    await runReport({ _: ["report"] } as never);

    expect(stdout).toContain("## 🔭 Rule Observability");
    expect(stdout).toContain("Hot rules");
    expect(stdout).toContain("`code-style.no-default-export`");
    expect(stdout).toContain("2 loads");
  });

  it("emits valid JSON when --format=json", async () => {
    writeAgentsMd(["code-style.no-any"]);
    writeEvents([
      { ts: "2026-04-29T00:00:00Z", event: "loaded", rule_id: "code-style.no-any" },
      { ts: "2026-04-29T00:01:00Z", event: "violation", rule_id: "code-style.no-any", file: "src/x.ts", line: 5 },
    ]);

    await runReport({ _: ["report"], format: "json" } as never);

    const parsed = JSON.parse(stdout);
    expect(parsed).toHaveProperty("adherence_score");
    expect(parsed).toHaveProperty("rules");
    expect(Array.isArray(parsed.rules)).toBe(true);
    expect(parsed.total_events).toBe(2);
    const rule = parsed.rules.find((r: { id: string }) => r.id === "code-style.no-any");
    expect(rule).toBeDefined();
    expect(rule.loaded).toBe(1);
    expect(rule.violations).toBe(1);
  });

  it("filters events by --since", async () => {
    writeAgentsMd(["code-style.no-any"]);
    writeEvents([
      { ts: "2026-01-01T00:00:00Z", event: "loaded", rule_id: "code-style.no-any" },
      { ts: "2026-04-29T00:00:00Z", event: "loaded", rule_id: "code-style.no-any" },
    ]);

    await runReport({ _: ["report"], format: "json", since: "2026-04-01" } as never);

    const parsed = JSON.parse(stdout);
    expect(parsed.total_events).toBe(1);
  });

  it("classifies a rule with violations as 'under pressure'", async () => {
    writeAgentsMd(["code-style.no-console-log"]);
    writeEvents([
      { ts: "2026-04-29T00:00:00Z", event: "loaded", rule_id: "code-style.no-console-log" },
      { ts: "2026-04-29T00:01:00Z", event: "violation", rule_id: "code-style.no-console-log", file: "src/x.ts" },
      { ts: "2026-04-29T00:02:00Z", event: "judged_violation", rule_id: "code-style.no-console-log", verdict: "logged in error path" },
    ]);

    await runReport({ _: ["report"] } as never);

    expect(stdout).toContain("Rules under pressure");
    expect(stdout).toContain("code-style.no-console-log");
  });
});
