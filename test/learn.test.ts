import { describe, expect, it } from "vitest";
import { clusterCandidates, idFromText, isTeachingComment } from "../src/commands/learn.js";
import type { ReviewComment } from "../src/commands/learn.js";

describe("isTeachingComment", () => {
  it("matches 'we always' pattern", () => {
    expect(isTeachingComment("we always use named exports here")).toBe(true);
  });

  it("matches 'don't' pattern", () => {
    expect(isTeachingComment("don't put logs in this file please")).toBe(true);
  });

  it("matches 'nit:' pattern", () => {
    expect(isTeachingComment("nit: trailing newline missing")).toBe(true);
  });

  it("matches 'actually let's' pattern", () => {
    expect(isTeachingComment("actually let's keep this consistent with FooService")).toBe(true);
  });

  it("rejects neutral feedback comments", () => {
    expect(isTeachingComment("LGTM!")).toBe(false);
    expect(isTeachingComment("looks good to me")).toBe(false);
  });

  it("rejects empty or trivial comments", () => {
    expect(isTeachingComment("")).toBe(false);
    expect(isTeachingComment("ok")).toBe(false);
  });

  it("rejects very long comments (likely architectural discussions)", () => {
    const long = "we always do this".repeat(100);
    expect(isTeachingComment(long)).toBe(false);
  });
});

describe("idFromText", () => {
  it("produces stable kebab-case ids", () => {
    expect(idFromText("we always use named exports")).toMatch(/^learned\.[a-z]/);
  });

  it("strips stopwords", () => {
    const id = idFromText("we always use named exports");
    expect(id).not.toContain("we");
    expect(id).not.toContain("the");
  });

  it("limits to 4 meaningful words", () => {
    const id = idFromText("the quick brown fox jumps over the lazy dog while running fast");
    const parts = id.replace(/^learned\./, "").split("-");
    expect(parts.length).toBeLessThanOrEqual(4);
  });

  it("produces 'learned.unnamed' for tokenless input", () => {
    expect(idFromText("a")).toBe("learned.unnamed");
  });

  it("starts with 'learned.' prefix for telemetry namespacing", () => {
    expect(idFromText("don't use console.log")).toMatch(/^learned\./);
  });
});

describe("clusterCandidates", () => {
  function comment(body: string, prNumber = 1): ReviewComment {
    return { body, prNumber };
  }

  it("clusters semantically similar comments", () => {
    const comments = [
      comment("we always use named exports, never default", 1),
      comment("please use named exports here, not default exports", 2),
      comment("our convention is named exports", 3),
    ];
    const candidates = clusterCandidates(comments);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.evidenceCount).toBe(3);
    expect(candidates[0]?.prs).toEqual([1, 2, 3]);
  });

  it("requires at least 2 pieces of evidence per cluster", () => {
    const comments = [comment("we always use named exports", 1)];
    expect(clusterCandidates(comments)).toEqual([]);
  });

  it("keeps unrelated corrections in separate clusters", () => {
    const comments = [
      comment("we always use named exports", 1),
      comment("please use named exports here", 2),
      comment("don't commit secrets to the repo", 3),
      comment("never put secrets in commits", 4),
    ];
    const candidates = clusterCandidates(comments);
    expect(candidates).toHaveLength(2);
  });

  it("sorts candidates by evidence count descending", () => {
    const comments = [
      comment("we always validate inputs at the boundary", 1),
      comment("please validate inputs", 2),
      comment("we always use named exports", 3),
      comment("please use named exports", 4),
      comment("definitely use named exports here", 5),
    ];
    const candidates = clusterCandidates(comments);
    expect(candidates[0]?.evidenceCount).toBeGreaterThanOrEqual(candidates[1]?.evidenceCount ?? 0);
  });

  it("dedupes pr numbers within a cluster", () => {
    const comments = [
      comment("we always use named exports", 1),
      comment("please use named exports", 1),
      comment("named exports preferred", 2),
    ];
    const candidates = clusterCandidates(comments);
    expect(candidates[0]?.prs).toEqual([1, 2]);
  });
});
