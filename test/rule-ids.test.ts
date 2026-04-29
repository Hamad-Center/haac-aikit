import { describe, expect, it } from "vitest";
import { extractRuleIds, RULE_ID_REGEX_SINGLE } from "../src/render/rule-ids.js";

describe("extractRuleIds", () => {
  it("matches a plain rule ID", () => {
    expect(extractRuleIds("- <!-- id: code-style.no-any --> Use unknown")).toEqual([
      "code-style.no-any",
    ]);
  });

  it("matches a rule ID with emphasis metadata (regression: 0.4.0 metadata-blind bug)", () => {
    expect(
      extractRuleIds("- <!-- id: security.no-secrets emphasis=high --> Never commit secrets")
    ).toEqual(["security.no-secrets"]);
  });

  it("matches a rule ID with paths metadata", () => {
    expect(
      extractRuleIds('- <!-- id: code-style.no-any paths=src/**/*.ts --> Use unknown')
    ).toEqual(["code-style.no-any"]);
  });

  it("matches a rule ID with multiple metadata pairs", () => {
    expect(
      extractRuleIds(
        '- <!-- id: code-style.no-any emphasis=high paths=src/**/*.ts --> Use unknown'
      )
    ).toEqual(["code-style.no-any"]);
  });

  it("rejects single-segment slugs (no dot)", () => {
    expect(extractRuleIds("<!-- id: foo -->")).toEqual([]);
  });

  it("rejects dotless docstring placeholders like '...'", () => {
    expect(extractRuleIds("Add an ID like `<!-- id: ... -->` here.")).toEqual([]);
  });

  it("requires the slug to start with a letter", () => {
    expect(extractRuleIds("<!-- id: 1.2 -->")).toEqual([]);
    expect(extractRuleIds("<!-- id: -bad.foo -->")).toEqual([]);
  });

  it("extracts every ID across multiple matches in one document", () => {
    const content = `
- <!-- id: commit.types --> Conventional commits
- <!-- id: pr.title-under-70 --> Short titles
- <!-- id: security.no-secrets emphasis=high --> No secrets
`;
    expect(extractRuleIds(content)).toEqual([
      "commit.types",
      "pr.title-under-70",
      "security.no-secrets",
    ]);
  });

  it("preserves duplicates (caller decides whether to dedupe)", () => {
    const content =
      "- <!-- id: x.y --> first\n- <!-- id: x.y emphasis=high --> second";
    expect(extractRuleIds(content)).toEqual(["x.y", "x.y"]);
  });

  it("RULE_ID_REGEX_SINGLE captures the slug as group 1", () => {
    const match = "- <!-- id: code-style.no-any emphasis=high --> Use unknown".match(
      RULE_ID_REGEX_SINGLE
    );
    expect(match?.[1]).toBe("code-style.no-any");
  });
});
