import { describe, expect, it } from "vitest";
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
  mcpJsonToCodexToml,
  buildSkillsIndex,
} from "../src/render/translators.js";

const SKILL_FIXTURE = `---
name: docs
description: Use when documentation drifts.
version: "1.0.0"
---

## When to use

Document features as you ship them.
`;

const AGENT_FIXTURE = `---
name: orchestrator
description: Dispatches specialists.
model: claude-sonnet-4-6
tools:
  - Agent
  - Read
---

# Orchestrator

You decompose tasks into sub-tasks.
`;

describe("parseFrontmatter", () => {
  it("extracts name and description from a skill", () => {
    const parsed = parseFrontmatter(SKILL_FIXTURE);
    expect(parsed.frontmatter.name).toBe("docs");
    expect(parsed.frontmatter.description).toBe("Use when documentation drifts.");
    expect(parsed.body).toContain("## When to use");
  });

  it("parses an agent's tools list", () => {
    const parsed = parseFrontmatter(AGENT_FIXTURE);
    expect(parsed.frontmatter.name).toBe("orchestrator");
    expect(parsed.frontmatter.model).toBe("claude-sonnet-4-6");
    expect(parsed.toolsList).toEqual(["Agent", "Read"]);
  });

  it("returns empty frontmatter when none is present", () => {
    const result = parseFrontmatter("just body content");
    expect(result.frontmatter).toEqual({});
    expect(result.body).toBe("just body content");
  });
});

describe("skill translators", () => {
  const skill = parseFrontmatter(SKILL_FIXTURE);

  it("Cursor MDC has description in frontmatter and body preserved", () => {
    const mdc = skillToCursorMdc(skill);
    expect(mdc).toMatch(/^---\ndescription: "Use when documentation drifts\."\n/);
    expect(mdc).toContain("alwaysApply: false");
    expect(mdc).toContain("## When to use");
  });

  it("Windsurf rule uses trigger: model_decision", () => {
    const rule = skillToWindsurfRule(skill);
    expect(rule).toContain("trigger: model_decision");
    expect(rule).toContain("description: Use when documentation drifts.");
  });

  it("Copilot instruction uses applyTo: '**'", () => {
    const inst = skillToCopilotInstruction(skill);
    expect(inst).toContain("applyTo: '**'");
  });

  it("Gemini command emits TOML with prompt block (literal-string by default)", () => {
    const cmd = skillToGeminiCommand(skill);
    expect(cmd).toContain('description = "Use when documentation drifts."');
    expect(cmd).toContain("prompt = '''");
    expect(cmd).toContain("## When to use");
  });
});

describe("agent translators", () => {
  const agent = parseFrontmatter(AGENT_FIXTURE);

  it("Copilot agent preserves name, description, model, tools", () => {
    const out = agentToCopilotAgent(agent);
    expect(out).toContain("name: orchestrator");
    expect(out).toContain("description: Dispatches specialists.");
    expect(out).toContain("model: claude-sonnet-4-6");
    expect(out).toContain("- Agent");
    expect(out).toContain("- Read");
  });

  it("Codex TOML uses developer_instructions with literal-string by default", () => {
    const out = agentToCodexToml(agent);
    expect(out).toContain('name = "orchestrator"');
    expect(out).toContain('description = "Dispatches specialists."');
    expect(out).toContain("developer_instructions = '''");
    expect(out).toContain("# Orchestrator");
  });
});

describe("buildCursorHooksJson", () => {
  it("maps shipped safety hooks to Cursor events", () => {
    const json = buildCursorHooksJson([
      "block-dangerous-bash.sh",
      "block-force-push-main.sh",
      "block-secrets-in-commits.sh",
      "file-guard.sh",
      "session-start-prime.sh",
    ]);
    const parsed = JSON.parse(json);
    expect(parsed.version).toBe(1);
    expect(parsed.hooks.beforeShellExecution).toHaveLength(3);
    expect(parsed.hooks.beforeReadFile).toHaveLength(1);
    expect(parsed.hooks.sessionStart).toHaveLength(1);
  });

  it("omits events when their hook isn't installed", () => {
    const json = buildCursorHooksJson(["block-dangerous-bash.sh"]);
    const parsed = JSON.parse(json);
    expect(parsed.hooks.beforeShellExecution).toHaveLength(1);
    expect(parsed.hooks.beforeReadFile).toBeUndefined();
    expect(parsed.hooks.sessionStart).toBeUndefined();
  });
});

describe("mcpJsonToCodexToml", () => {
  it("converts mcpServers to [mcp_servers.*] tables", () => {
    const mcp = JSON.stringify({
      mcpServers: {
        filesystem: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-filesystem", "."],
          env: {},
        },
      },
    });
    const toml = mcpJsonToCodexToml(mcp);
    expect(toml).toContain("[mcp_servers.filesystem]");
    expect(toml).toContain('command = "npx"');
    expect(toml).toContain('args = ["-y", "@modelcontextprotocol/server-filesystem", "."]');
  });
});

describe("buildSkillsIndex", () => {
  it("emits a bulleted name + one-line description list", () => {
    const skills = [parseFrontmatter(SKILL_FIXTURE)];
    const index = buildSkillsIndex(skills);
    expect(index).toContain("## Available skills");
    expect(index).toContain("**docs** — Use when documentation drifts");
  });

  it("returns empty string when no skills passed", () => {
    expect(buildSkillsIndex([])).toBe("");
  });
});

describe("Windsurf rule char-limit guard", () => {
  it("truncates skill body when over 12k chars, appends footer", () => {
    const longBody = "X".repeat(15000);
    const skill = parseFrontmatter(`---
name: longskill
description: long
---

${longBody}
`);
    const out = skillToWindsurfRule(skill);
    expect(out.length).toBeLessThan(12000);
    expect(out).toContain("Truncated to fit Windsurf's 12k-char rule limit");
    expect(out).toContain(".claude/skills/longskill.md");
  });

  it("does not truncate short skill bodies", () => {
    const skill = parseFrontmatter(SKILL_FIXTURE);
    const out = skillToWindsurfRule(skill);
    expect(out).not.toContain("Truncated");
    expect(out).toContain("## When to use");
  });
});

describe("Cursor hook entry fields and event surface", () => {
  it("emits failClosed: true on safety hooks", () => {
    const json = JSON.parse(
      buildCursorHooksJson(["block-dangerous-bash.sh", "block-force-push-main.sh", "file-guard.sh"])
    );
    expect(json.hooks.beforeShellExecution[0].failClosed).toBe(true);
    expect(json.hooks.beforeShellExecution[1].failClosed).toBe(true);
    expect(json.hooks.beforeReadFile[0].failClosed).toBe(true);
  });

  it("does NOT emit a matcher field (scripts self-filter to avoid Cursor schema drift)", () => {
    const json = JSON.parse(
      buildCursorHooksJson(["block-force-push-main.sh", "block-secrets-in-commits.sh"])
    );
    const events = json.hooks.beforeShellExecution as { matcher?: string; command: string }[];
    for (const entry of events) {
      expect(entry).not.toHaveProperty("matcher");
    }
  });

  it("wires log-rule-event to 4 telemetry events for observability parity", () => {
    const json = JSON.parse(buildCursorHooksJson(["log-rule-event.sh"]));
    expect(json.hooks.preToolUse).toHaveLength(1);
    expect(json.hooks.postToolUse).toHaveLength(1);
    expect(json.hooks.subagentStart).toHaveLength(1);
    expect(json.hooks.subagentStop).toHaveLength(1);
  });

  it("wires preCompact when compaction-preservation is installed", () => {
    const json = JSON.parse(buildCursorHooksJson(["compaction-preservation.sh"]));
    expect(json.hooks.preCompact).toHaveLength(1);
  });
});

describe("Codex config.toml", () => {
  it("includes [features] codex_hooks = true so hooks fire", () => {
    const toml = buildCodexConfigToml("{}");
    expect(toml).toContain("[features]");
    expect(toml).toContain("codex_hooks = true");
  });

  it("includes [agents] concurrency caps", () => {
    const toml = buildCodexConfigToml("{}");
    expect(toml).toContain("[agents]");
    expect(toml).toContain("max_threads = 3");
    expect(toml).toContain("max_depth = 2");
    expect(toml).toContain("job_max_runtime_seconds = 300");
  });

  it("appends [mcp_servers.*] tables when mcp.json provides them", () => {
    const mcp = JSON.stringify({
      mcpServers: { filesystem: { command: "npx", args: ["-y", "x"] } },
    });
    const toml = buildCodexConfigToml(mcp);
    expect(toml).toContain("[mcp_servers.filesystem]");
    expect(toml).toContain('command = "npx"');
  });
});

describe("Copilot agent format compliance", () => {
  it("does NOT include user-invocable (that's a skill field, not agent)", () => {
    const agent = parseFrontmatter(AGENT_FIXTURE);
    const out = agentToCopilotAgent(agent);
    expect(out).not.toContain("user-invocable");
  });

  it("emits canonical agent fields: name, description, model, tools", () => {
    const agent = parseFrontmatter(AGENT_FIXTURE);
    const out = agentToCopilotAgent(agent);
    expect(out).toMatch(/^---\nname: orchestrator/);
    expect(out).toContain("description: Dispatches specialists.");
    expect(out).toContain("model: claude-sonnet-4-6");
    expect(out).toContain("- Agent");
    expect(out).toContain("- Read");
  });
});

describe("TOML literal-string output (no escape needed)", () => {
  it("Codex agent body containing backslashes survives unescaped via literal strings", () => {
    const skill = parseFrontmatter(`---
name: pathy
description: handles Windows paths
---

Read C:\\\\Users\\\\dev\\\\file.txt and never split on backslash.
`);
    const out = agentToCodexToml(skill);
    expect(out).toContain("'''");
    expect(out).toContain("C:\\\\Users\\\\dev\\\\file.txt");
  });

  it("Codex agent falls back to basic strings (\"\"\") when body contains '''", () => {
    const agent = parseFrontmatter(`---
name: literal
description: x
---

Don't use ''' triple-quotes anywhere.
`);
    const out = agentToCodexToml(agent);
    // Delimiter should be """ (basic string) — body still mentions ''' as content,
    // so we check the delimiter shape specifically.
    expect(out).toMatch(/developer_instructions = """/);
    expect(out).not.toMatch(/developer_instructions = '''/);
  });

  it("Gemini command uses literal strings by default", () => {
    const skill = parseFrontmatter(SKILL_FIXTURE);
    const out = skillToGeminiCommand(skill);
    expect(out).toContain("prompt = '''");
  });
});

describe("Cursor MDC backslash escape", () => {
  it("escapes backslashes in description so YAML stays valid", () => {
    const skill = parseFrontmatter(`---
name: pathy
description: matches C:\\\\Users\\\\dev paths
---

body
`);
    const out = skillToCursorMdc(skill);
    expect(out).toContain('description: "matches C:\\\\\\\\Users\\\\\\\\dev paths"');
  });
});
