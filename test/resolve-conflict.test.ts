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

  it("returns null for paths that contain 'agents' but aren't .claude-rooted", () => {
    expect(inferTier3Slot("random/dir/agents/foo.md")).toBe(null);
    expect(inferTier3Slot("src/agents/foo.md")).toBe(null);
  });

  it("returns null for paths that contain 'skills' but aren't .claude-rooted", () => {
    expect(inferTier3Slot("random/dir/skills/foo.md")).toBe(null);
    expect(inferTier3Slot("src/skills/foo.md")).toBe(null);
  });

  it("returns 'agents' for absolute tmp-dir paths containing /.claude/agents/", () => {
    expect(inferTier3Slot("/tmp/haac-test/abc/.claude/agents/reviewer.md")).toBe("agents");
  });

  it("returns 'skills' for absolute tmp-dir paths containing /.claude/skills/", () => {
    expect(inferTier3Slot("/tmp/haac-test/abc/.claude/skills/brainstorming.md")).toBe("skills");
  });
});
