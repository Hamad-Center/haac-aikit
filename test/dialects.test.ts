import { describe, expect, it } from "vitest";
import { parseRuleSet, translateForCursor } from "../src/render/dialects/index.js";

const SAMPLE_AGENTS = `# my-project

<!-- BEGIN:haac-aikit -->
A test project.

## Code style
- <!-- id: code-style.no-any emphasis=high paths=src/**/*.ts --> Use \`unknown\` + type guards, not \`any\`.
- <!-- id: code-style.no-default-export --> Use named exports.

## Security
- <!-- id: security.no-secrets emphasis=high --> Never commit secrets.
<!-- END:haac-aikit -->
`;

describe("parser", () => {
  it("extracts rules with IDs from AGENTS.md content", () => {
    const ruleSet = parseRuleSet(SAMPLE_AGENTS, "my-project", "A test project.");
    expect(ruleSet.rules).toHaveLength(3);
    expect(ruleSet.rules.map((r) => r.id)).toEqual([
      "code-style.no-any",
      "code-style.no-default-export",
      "security.no-secrets",
    ]);
  });

  it("captures emphasis metadata", () => {
    const ruleSet = parseRuleSet(SAMPLE_AGENTS, "p", "");
    const noAny = ruleSet.rules.find((r) => r.id === "code-style.no-any");
    expect(noAny?.meta.emphasis).toBe("high");
    const noDefault = ruleSet.rules.find((r) => r.id === "code-style.no-default-export");
    expect(noDefault?.meta.emphasis).toBeUndefined();
  });

  it("captures paths metadata as an array", () => {
    const ruleSet = parseRuleSet(SAMPLE_AGENTS, "p", "");
    const noAny = ruleSet.rules.find((r) => r.id === "code-style.no-any");
    expect(noAny?.meta.paths).toEqual(["src/**/*.ts"]);
  });

  it("captures the section each rule belongs to", () => {
    const ruleSet = parseRuleSet(SAMPLE_AGENTS, "p", "");
    expect(ruleSet.rules.find((r) => r.id === "code-style.no-any")?.section).toBe("Code style");
    expect(ruleSet.rules.find((r) => r.id === "security.no-secrets")?.section).toBe("Security");
  });

  it("strips the ID comment from the rule text", () => {
    const ruleSet = parseRuleSet(SAMPLE_AGENTS, "p", "");
    const noAny = ruleSet.rules.find((r) => r.id === "code-style.no-any");
    expect(noAny?.text).toBe("Use `unknown` + type guards, not `any`.");
  });
});

describe("Cursor translator", () => {
  it("emits MDC frontmatter with alwaysApply", () => {
    const ruleSet = parseRuleSet(SAMPLE_AGENTS, "my-project", "A test project.");
    const out = translateForCursor(ruleSet);
    expect(out.startsWith("---\n")).toBe(true);
    expect(out).toContain("alwaysApply: true");
    expect(out).toContain("description: Project rules for my-project");
  });

  it("includes BEGIN/END markers for idempotent sync", () => {
    const ruleSet = parseRuleSet(SAMPLE_AGENTS, "p", "");
    const out = translateForCursor(ruleSet);
    expect(out).toContain("<!-- BEGIN:haac-aikit -->");
    expect(out).toContain("<!-- END:haac-aikit -->");
  });

  it("renders high-emphasis rules in bold", () => {
    const ruleSet = parseRuleSet(SAMPLE_AGENTS, "p", "");
    const out = translateForCursor(ruleSet);
    expect(out).toContain("**Use `unknown` + type guards, not `any`.**");
    expect(out).toContain("**Never commit secrets.**");
    // Non-emphasized rules stay plain.
    expect(out).toContain("- Use named exports.");
  });

  it("surfaces paths metadata as a hint", () => {
    const ruleSet = parseRuleSet(SAMPLE_AGENTS, "p", "");
    const out = translateForCursor(ruleSet);
    expect(out).toContain("applies to:");
    expect(out).toContain("src/**/*.ts");
  });

  it("groups rules by section", () => {
    const ruleSet = parseRuleSet(SAMPLE_AGENTS, "p", "");
    const out = translateForCursor(ruleSet);
    expect(out).toContain("## Code style");
    expect(out).toContain("## Security");
  });

  it("preserves rule IDs as inline comments for telemetry continuity", () => {
    const ruleSet = parseRuleSet(SAMPLE_AGENTS, "p", "");
    const out = translateForCursor(ruleSet);
    expect(out).toContain("<!-- id: code-style.no-any -->");
    expect(out).toContain("<!-- id: security.no-secrets -->");
  });
});
