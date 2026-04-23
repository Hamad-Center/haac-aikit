import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { interpolate } from "../render/template.js";

// When bundled: import.meta.url points to dist/cli.mjs; catalog is at ../catalog
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "catalog");

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
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
  };
}
