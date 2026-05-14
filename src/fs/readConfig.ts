import { existsSync, readFileSync, writeFileSync } from "node:fs";
import type { AikitConfig } from "../types.js";

/**
 * Fields removed in 0.12.0. If we see any of these in a parsed config, the
 * user is upgrading from <0.12 and the file is stale. Warn loudly so they
 * re-run the wizard instead of getting silent dropouts.
 */
const REMOVED_FIELDS = ["scope", "shape"] as const;
const REMOVED_INTEGRATIONS = ["husky", "devcontainer", "plugin", "otel"] as const;

/**
 * The known-good top-level keys an .aikitrc.json should have in 0.12+. Any
 * other top-level keys are flagged as unknown — likely a typo, or a hand-edit
 * that should have gone in `integrations.*` or `agents.*`.
 */
const KNOWN_TOP_LEVEL_KEYS = new Set([
  "$schema", "version", "projectName", "projectDescription",
  "tools", "integrations", "skills", "agents", "canonical",
]);

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

  const cfg = raw as Partial<AikitConfig> & Record<string, unknown>;
  if (cfg.version !== 1) {
    throw new Error(`${configPath}: unsupported version ${cfg.version}`);
  }

  // Detect 0.11→0.12 stale fields and emit a clear warning to stderr.
  // We don't auto-migrate (the user should run the wizard) but we don't crash
  // either — sync still works, we just want the user to know.
  const staleFields: string[] = [];
  for (const field of REMOVED_FIELDS) {
    if (field in cfg) staleFields.push(field);
  }
  const integrations = (cfg.integrations as Record<string, unknown> | undefined) ?? {};
  for (const field of REMOVED_INTEGRATIONS) {
    if (field in integrations) staleFields.push(`integrations.${field}`);
  }
  const unknownKeys = Object.keys(cfg).filter((k) => !KNOWN_TOP_LEVEL_KEYS.has(k));

  if (staleFields.length > 0 || unknownKeys.length > 0) {
    const parts: string[] = [`Warning: ${configPath} has fields no longer recognised:`];
    if (staleFields.length > 0) parts.push(`  removed in 0.12: ${staleFields.join(", ")}`);
    if (unknownKeys.length > 0) parts.push(`  unknown top-level keys: ${unknownKeys.join(", ")}`);
    parts.push(`  Re-run \`npx haac-aikit\` to regenerate the config in the current shape.`);
    process.stderr.write(parts.join("\n") + "\n");
  }

  return cfg as AikitConfig;
}

export function writeConfig(config: AikitConfig, configPath = ".aikitrc.json", dryRun = false): void {
  // Re-emit ONLY the known-good keys so a stale field carried in from an old
  // file (e.g. scope/shape from 0.11) doesn't get silently re-persisted.
  const clean: Record<string, unknown> = {
    $schema: "https://haac-aikit.dev/schema.json",
  };
  const configAsRecord = config as unknown as Record<string, unknown>;
  for (const key of KNOWN_TOP_LEVEL_KEYS) {
    if (key === "$schema") continue;
    if (key in configAsRecord) clean[key] = configAsRecord[key];
  }
  const content = JSON.stringify(clean, null, 2) + "\n";
  if (!dryRun) writeFileSync(configPath, content, "utf8");
}
