import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { interpolate } from "../render/template.js";

// Walk up from this file looking for a sibling `catalog/` directory. Resolves
// correctly in both states:
//   bundled: dist/cli.mjs        → dist/../catalog       = ./catalog        ✓
//   dev:     src/catalog/index.ts → walk up → repo-root/catalog              ✓
function findCatalogRoot(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 6; i++) {
    const candidate = join(dir, "catalog");
    if (existsSync(join(candidate, "rules", "AGENTS.md.tmpl"))) {
      return candidate;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("haac-aikit: catalog/ directory not found relative to module location");
}

export const CATALOG_ROOT = findCatalogRoot();

function read(rel: string): string {
  return readFileSync(join(CATALOG_ROOT, rel), "utf8");
}

export function loadCatalog() {
  return {
    agentsMd: (vars: Record<string, string>) => interpolate(read("rules/AGENTS.md.tmpl"), vars),
    claudeMd: () => read("rules/CLAUDE.md.shim"),
    copilotInstructions: () => read("rules/copilot-instructions.md"),
    cursorBase: () => read("rules/cursor-base.mdc"),
    windsurfRules: () => read("rules/windsurf-rules.md"),
    aiderConventions: () => read("rules/aider-conventions.md"),
    aiderConf: () => read("rules/aider.conf.yml"),
    geminiMd: () => read("rules/GEMINI.md.shim"),
    mcpJson: () => read("mcp/mcp.json"),
    settingsJson: () => read("settings/settings.json"),
    aikitRulesJson: () => read("rules/aikit-rules.json"),
  };
}
