import { describe, expect, it } from "vitest";
import { inferTier3Slot } from "../src/fs/conflict.js";

describe("inferTier3Slot", () => {
  it("returns 'agents' for .claude/agents/*.md", () => {
    expect(inferTier3Slot(".claude/agents/reviewer.md")).toBe("agents");
  });

  it("returns 'skills' for .claude/skills/*.md", () => {
    expect(inferTier3Slot(".claude/skills/brainstorming.md")).toBe("skills");
  });

  it("returns null for .claude/commands/*.md", () => {
    expect(inferTier3Slot(".claude/commands/explore.md")).toBe(null);
  });

  it("returns null for .claude/hooks/*.sh", () => {
    expect(inferTier3Slot(".claude/hooks/pre-commit.sh")).toBe(null);
  });

  it("returns null for unknown paths", () => {
    expect(inferTier3Slot("AGENTS.md")).toBe(null);
    expect(inferTier3Slot(".github/workflows/ci.yml")).toBe(null);
  });
});
