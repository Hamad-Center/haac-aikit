import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { interpolate } from "../render/template.js";

export type SkillTierName = "tier1" | "tier2";

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

// Skills live as `catalog/skills/<tier>/<name>/SKILL.md` (folder format). The
// install destination mirrors that layout at `.claude/skills/<name>/SKILL.md`,
// which is required so sibling files (e.g. spec-kit/references/) ride along.
export function skillFolder(tier: SkillTierName, name: string): string {
  return join(CATALOG_ROOT, "skills", tier, name);
}

export function skillFile(tier: SkillTierName, name: string): string {
  return join(skillFolder(tier, name), "SKILL.md");
}

/** Catalog skill folder names for a tier (only entries that contain SKILL.md). */
export function listSkillFolders(tier: SkillTierName): string[] {
  const dir = join(CATALOG_ROOT, "skills", tier);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((entry) => {
    const full = join(dir, entry);
    try {
      return statSync(full).isDirectory() && existsSync(join(full, "SKILL.md"));
    } catch {
      return false;
    }
  });
}

/** Installed skill folder names under `.claude/skills/` (or any install root). */
export function listInstalledSkillFolders(installRoot: string): string[] {
  if (!existsSync(installRoot)) return [];
  return readdirSync(installRoot).filter((entry) => {
    const full = join(installRoot, entry);
    try {
      return statSync(full).isDirectory() && existsSync(join(full, "SKILL.md"));
    } catch {
      return false;
    }
  });
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
