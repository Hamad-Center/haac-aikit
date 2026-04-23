import { existsSync, readFileSync, writeFileSync } from "node:fs";

const ENTRIES = [
  ".claude/settings.local.json",
  ".claude/backups/",
  ".env.local",
  ".env*.local",
];

export function ensureGitignoreEntries(dryRun = false): void {
  const path = ".gitignore";
  const existing = existsSync(path) ? readFileSync(path, "utf8") : "";
  const lines = existing.split("\n");

  const toAdd = ENTRIES.filter((e) => !lines.some((l) => l.trim() === e));
  if (toAdd.length === 0) return;

  const appended =
    (existing.endsWith("\n") || existing === "" ? existing : existing + "\n") +
    toAdd.join("\n") +
    "\n";

  if (!dryRun) writeFileSync(path, appended, "utf8");
}
