import { existsSync, readFileSync, writeFileSync } from "node:fs";
import type { AikitConfig } from "../types.js";

export function readConfig(configPath = ".aikitrc.json"): AikitConfig | null {
  if (!existsSync(configPath)) return null;

  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(configPath, "utf8"));
  } catch {
    throw new Error(`Failed to parse ${configPath}: invalid JSON`);
  }

  if (typeof raw !== "object" || raw === null) {
    throw new Error(`${configPath} must be a JSON object`);
  }

  const cfg = raw as Partial<AikitConfig>;
  if (cfg.version !== 1) {
    throw new Error(`${configPath}: unsupported version ${cfg.version}`);
  }

  return cfg as AikitConfig;
}

export function writeConfig(config: AikitConfig, configPath = ".aikitrc.json", dryRun = false): void {
  const content =
    JSON.stringify({ $schema: "https://haac-aikit.dev/schema.json", ...config }, null, 2) + "\n";
  if (!dryRun) writeFileSync(configPath, content, "utf8");
}
