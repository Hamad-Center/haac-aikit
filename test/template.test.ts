import { describe, expect, it } from "vitest";
import { extractVars, interpolate } from "../src/render/template.js";

describe("interpolate", () => {
  it("replaces {{var}} tokens", () => {
    expect(interpolate("Hello {{name}}!", { name: "world" })).toBe("Hello world!");
  });

  it("replaces multiple distinct tokens", () => {
    expect(interpolate("{{a}} and {{b}}", { a: "foo", b: "bar" })).toBe("foo and bar");
  });

  it("throws on missing variable", () => {
    expect(() => interpolate("{{missing}}", {})).toThrow("{{missing}}");
  });
});

describe("extractVars", () => {
  it("returns unique variable names", () => {
    expect(extractVars("{{a}} {{b}} {{a}}")).toEqual(["a", "b"]);
  });

  it("returns empty array when no vars", () => {
    expect(extractVars("no vars here")).toEqual([]);
  });
});
