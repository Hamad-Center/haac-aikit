import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runDoctor } from "../src/commands/doctor.js";

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
  tmpDir = mkdtempSync(join(tmpdir(), "haac-doctor-rules-"));
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

describe("aikit doctor --rules", () => {
  it("reports a friendly message when no telemetry exists", async () => {
    await runDoctor({ _: ["doctor"], rules: true } as never);
    expect(stdout).toContain("No telemetry yet");
  });

  it("classifies a hot rule (loaded, no violations)", async () => {
    writeAgentsMd(["code-style.no-default-export"]);
    writeEvents([
      { ts: "2026-04-29T00:00:00Z", event: "loaded", rule_id: "code-style.no-default-export", source: "AGENTS.md" },
      { ts: "2026-04-29T00:01:00Z", event: "loaded", rule_id: "code-style.no-default-export", source: "AGENTS.md" },
    ]);

    await runDoctor({ _: ["doctor"], rules: true } as never);

    expect(stdout).toContain("Hot rules");
    expect(stdout).toContain("code-style.no-default-export");
    expect(stdout).toContain("2 loads");
  });

  it("classifies a disputed rule (>30% violation rate)", async () => {
    writeAgentsMd(["code-style.no-console-log"]);
    writeEvents([
      { ts: "2026-04-29T00:00:00Z", event: "loaded", rule_id: "code-style.no-console-log", source: "AGENTS.md" },
      { ts: "2026-04-29T00:01:00Z", event: "violation", rule_id: "code-style.no-console-log", file: "src/x.ts" },
      { ts: "2026-04-29T00:02:00Z", event: "violation", rule_id: "code-style.no-console-log", file: "src/y.ts" },
    ]);

    await runDoctor({ _: ["doctor"], rules: true } as never);

    expect(stdout).toContain("Disputed rules");
    expect(stdout).toContain("code-style.no-console-log");
    expect(stdout).toContain("strengthen with IMPORTANT");
  });

  it("classifies a dead rule (declared in AGENTS.md but never observed)", async () => {
    writeAgentsMd(["dead.never-fires", "code-style.no-any"]);
    writeEvents([
      { ts: "2026-04-29T00:00:00Z", event: "loaded", rule_id: "code-style.no-any", source: "AGENTS.md" },
    ]);

    await runDoctor({ _: ["doctor"], rules: true } as never);

    expect(stdout).toContain("Dead rules");
    expect(stdout).toContain("dead.never-fires");
    expect(stdout).toContain("Never loaded, cited, or violated");
  });

  it("counts judged_violation events alongside pattern violations (Phase 1.1 LLM judge)", async () => {
    writeAgentsMd(["code-style.no-console-log"]);
    writeEvents([
      { ts: "2026-04-29T00:00:00Z", event: "loaded", rule_id: "code-style.no-console-log" },
      { ts: "2026-04-29T00:01:00Z", event: "judged_violation", rule_id: "code-style.no-console-log", verdict: "logged in error path" },
      { ts: "2026-04-29T00:02:00Z", event: "judged_violation", rule_id: "code-style.no-console-log", verdict: "stray debug log" },
    ]);

    await runDoctor({ _: ["doctor"], rules: true } as never);

    expect(stdout).toContain("Disputed rules");
    expect(stdout).toContain("code-style.no-console-log");
  });

  it("classifies cited-only rules as hot (LLM judge fired before InstructionsLoaded)", async () => {
    writeAgentsMd(["code-style.no-default-export"]);
    writeEvents([
      { ts: "2026-04-29T00:00:00Z", event: "cited", rule_id: "code-style.no-default-export" },
      { ts: "2026-04-29T00:01:00Z", event: "cited", rule_id: "code-style.no-default-export" },
    ]);

    await runDoctor({ _: ["doctor"], rules: true } as never);

    expect(stdout).toContain("Hot rules");
    expect(stdout).toContain("code-style.no-default-export");
    expect(stdout).not.toContain("Dead rules");
  });

  it("ignores malformed JSONL lines without crashing", async () => {
    writeAgentsMd(["code-style.no-any"]);
    mkdirSync(".aikit", { recursive: true });
    writeFileSync(".aikit/events.jsonl",
      `{"ts":"2026-04-29T00:00:00Z","event":"loaded","rule_id":"code-style.no-any"}\n` +
      `not valid json\n` +
      `{"missing":"required fields"}\n` +
      `{"ts":"2026-04-29T00:01:00Z","event":"loaded","rule_id":"code-style.no-any"}\n`
    );

    await runDoctor({ _: ["doctor"], rules: true } as never);

    expect(stdout).toContain("Hot rules");
    expect(stdout).toContain("2 loads");
  });

  it("surfaces malformed-line count when log is corrupt", async () => {
    writeAgentsMd(["code-style.no-any"]);
    mkdirSync(".aikit", { recursive: true });
    writeFileSync(".aikit/events.jsonl",
      `{"ts":"2026-04-29T00:00:00Z","event":"loaded","rule_id":"code-style.no-any"}\n` +
      `not json\n` +
      `also not json\n` +
      `{"missing":"fields"}\n`
    );

    await runDoctor({ _: ["doctor"], rules: true } as never);

    expect(stdout).toContain("3 malformed line(s)");
  });

  it("emits valid JSON when --format=json", async () => {
    writeAgentsMd(["code-style.no-any"]);
    writeEvents([
      { ts: "2026-04-29T00:00:00Z", event: "loaded", rule_id: "code-style.no-any" },
      { ts: "2026-04-29T00:01:00Z", event: "violation", rule_id: "code-style.no-any", file: "src/x.ts" },
    ]);

    await runDoctor({ _: ["doctor"], rules: true, format: "json" } as never);

    const parsed = JSON.parse(stdout);
    expect(parsed).toHaveProperty("generated_at");
    expect(parsed).toHaveProperty("rules");
    expect(Array.isArray(parsed.rules)).toBe(true);
    expect(parsed.rules.length).toBeGreaterThanOrEqual(1);
    expect(parsed.rules[0]).toHaveProperty("bucket");
    expect(parsed.rules[0]).toHaveProperty("advice");
  });

  it("includes compile_errors in JSON output", async () => {
    writeAgentsMd([]);
    writeEvents([
      {
        ts: "2026-04-29T00:00:00Z",
        event: "rule_compile_error",
        rule_id: "code-style.bad",
        pattern: "(unclosed",
        error: "missing paren",
      },
    ]);

    await runDoctor({ _: ["doctor"], rules: true, format: "json" } as never);

    const parsed = JSON.parse(stdout);
    expect(parsed.compile_errors).toHaveLength(1);
    expect(parsed.compile_errors[0].rule_id).toBe("code-style.bad");
  });

  it("surfaces rule_compile_error events from broken regex patterns", async () => {
    writeAgentsMd(["code-style.bad-regex"]);
    writeEvents([
      {
        ts: "2026-04-29T00:00:00Z",
        event: "rule_compile_error",
        rule_id: "code-style.bad-regex",
        pattern: "(unclosed",
        error: "missing closing paren",
      },
    ]);

    await runDoctor({ _: ["doctor"], rules: true } as never);

    expect(stdout).toContain("Rule pattern compile errors");
    expect(stdout).toContain("code-style.bad-regex");
    expect(stdout).toContain("missing closing paren");
  });
});
