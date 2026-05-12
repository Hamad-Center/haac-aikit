import { existsSync, readFileSync, writeFileSync } from "node:fs";

// We list specific subpaths inside .aikit/ rather than ignoring the whole
// directory. Generated content (.aikit/artifacts/) is excluded; reference
// content (.aikit/templates/, the future .aikit/cache/ if any) is tracked
// so a fresh clone has them without re-running `aikit sync`.
// Git negation cannot re-include children of a wholly-excluded directory, so
// the pattern must target the children directly, not use `!` negations.
const ENTRIES = [
  ".claude/settings.local.json",
  ".claude/backups/",
  ".aikit/artifacts/",
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
