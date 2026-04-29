import { describe, expect, it } from "vitest";
import { resolveShapeAgents, SHAPE_AGENTS } from "../src/catalog/shape-agents.js";

describe("shape-agents", () => {
  it("maps each known shape to a fixed agent list", () => {
    expect(SHAPE_AGENTS.web).toEqual(["frontend"]);
    expect(SHAPE_AGENTS.fullstack).toEqual(["frontend", "backend"]);
    expect(SHAPE_AGENTS.backend).toEqual(["backend"]);
    expect(SHAPE_AGENTS.mobile).toEqual(["mobile"]);
    expect(SHAPE_AGENTS.library).toEqual(["backend"]);
  });

  it("resolveShapeAgents returns the union for multiple shapes (deduped)", () => {
    const result = resolveShapeAgents(["web", "backend"]);
    expect(result.sort()).toEqual(["backend", "frontend"]);
  });

  it("resolveShapeAgents returns [] for unknown shapes", () => {
    const result = resolveShapeAgents(["unknown-shape"] as never);
    expect(result).toEqual([]);
  });
});
