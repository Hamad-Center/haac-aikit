import type { ProjectShape } from "../types.js";

export const SHAPE_AGENTS: Record<ProjectShape, string[]> = {
  web: ["frontend"],
  fullstack: ["frontend", "backend"],
  backend: ["backend"],
  mobile: ["mobile"],
  library: ["backend"],
};

export function resolveShapeAgents(shapes: ProjectShape[]): string[] {
  const set = new Set<string>();
  for (const shape of shapes) {
    for (const agent of SHAPE_AGENTS[shape] ?? []) {
      set.add(agent);
    }
  }
  return Array.from(set);
}
