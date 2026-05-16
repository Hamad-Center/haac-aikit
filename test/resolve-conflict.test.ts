import { describe, expect, it } from "vitest";
import { inferTier3Slot, tier3KeyFromConflictPath } from "../src/fs/conflict.js";

describe("inferTier3Slot", () => {
  it("returns 'agents' for .claude/agents/*.md", () => {
    expect(inferTier3Slot(".claude/agents/reviewer.md")).toBe("agents");
  });

  it("returns 'skills' for legacy flat .claude/skills/*.md", () => {
    expect(inferTier3Slot(".claude/skills/brainstorming.md")).toBe("skills");
  });

  it("returns 'skills' for folder-format .claude/skills/<name>/SKILL.md", () => {
    expect(inferTier3Slot(".claude/skills/brainstorming/SKILL.md")).toBe("skills");
    expect(inferTier3Slot(".claude/skills/spec-kit/references/constitution.md")).toBe("skills");
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
    expect(inferTier3Slot("/tmp/haac-test/abc/.claude/skills/brainstorming/SKILL.md")).toBe("skills");
  });
});

describe("tier3KeyFromConflictPath", () => {
  it("extracts agent name from flat .claude/agents/<name>.md", () => {
    expect(tier3KeyFromConflictPath(".claude/agents/reviewer.md")).toEqual({
      slot: "agents",
      name: "reviewer",
    });
  });

  it("extracts skill name (folder, not 'SKILL') from .claude/skills/<name>/SKILL.md", () => {
    expect(tier3KeyFromConflictPath(".claude/skills/brainstorming/SKILL.md")).toEqual({
      slot: "skills",
      name: "brainstorming",
    });
  });

  it("extracts skill name from sibling files inside a skill folder", () => {
    expect(
      tier3KeyFromConflictPath(".claude/skills/spec-kit/references/constitution.md"),
    ).toEqual({ slot: "skills", name: "spec-kit" });
  });

  it("extracts skill name from legacy flat .claude/skills/<name>.md", () => {
    expect(tier3KeyFromConflictPath(".claude/skills/brainstorming.md")).toEqual({
      slot: "skills",
      name: "brainstorming",
    });
  });

  it("handles absolute tmp paths", () => {
    expect(
      tier3KeyFromConflictPath("/tmp/haac/.claude/skills/docs/SKILL.md"),
    ).toEqual({ slot: "skills", name: "docs" });
  });

  it("returns null for non-tier3 paths", () => {
    expect(tier3KeyFromConflictPath(".claude/commands/explore.md")).toBeNull();
    expect(tier3KeyFromConflictPath("AGENTS.md")).toBeNull();
    expect(tier3KeyFromConflictPath("src/skills/foo.md")).toBeNull();
  });
});
