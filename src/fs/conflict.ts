import * as p from "@clack/prompts";
import { basename } from "node:path";
import type { ConflictResolution, Tier3Slot } from "../types.js";
import { formatUnifiedDiff } from "./diff.js";

/**
 * Map a destination file path to its corresponding tier3 slot in AikitConfig.
 * Returns null for paths without a tier3 mechanism (commands, hooks, others).
 *
 * Accepts both legacy flat skill paths (`.claude/skills/<name>.md`) and the
 * folder format (`.claude/skills/<name>/SKILL.md` or sibling files inside the
 * folder). Use `tier3KeyFromConflictPath` when you also need the name.
 */
export function inferTier3Slot(filePath: string): Tier3Slot {
  if ((filePath.includes("/.claude/agents/") || filePath.startsWith(".claude/agents/")) && filePath.endsWith(".md")) return "agents";
  if (filePath.includes("/.claude/skills/") || filePath.startsWith(".claude/skills/")) return "skills";
  return null;
}

/**
 * Extract the tier3 slot + canonical name from a conflict path. Handles:
 *   - agents: `.claude/agents/<name>.md`           → name = <name>
 *   - skills (folder): `.claude/skills/<name>/...` → name = <name>
 *   - skills (legacy flat): `.claude/skills/<name>.md` → name = <name>
 *
 * Returns null when the path has no tier3 protection.
 */
export function tier3KeyFromConflictPath(
  filePath: string,
): { slot: NonNullable<Tier3Slot>; name: string } | null {
  // Normalize so an absolute `/tmp/.../.claude/skills/foo` matches the same way
  // as a relative `.claude/skills/foo`.
  const agentMatch = filePath.match(/(?:^|\/)\.claude\/agents\/([^/]+)\.md$/);
  if (agentMatch?.[1]) return { slot: "agents", name: agentMatch[1] };

  const skillFolderMatch = filePath.match(/(?:^|\/)\.claude\/skills\/([^/]+)\/.+$/);
  if (skillFolderMatch?.[1]) return { slot: "skills", name: skillFolderMatch[1] };

  const skillFlatMatch = filePath.match(/(?:^|\/)\.claude\/skills\/([^/]+)\.md$/);
  if (skillFlatMatch?.[1]) return { slot: "skills", name: skillFlatMatch[1] };

  return null;
}

export interface ConflictPrompt {
  /** Ask the user how to resolve a single conflict. */
  ask(filePath: string, local: string, incoming: string): Promise<ConflictResolution>;
}

/**
 * Default interactive prompt using @clack/prompts. Tests inject their own
 * implementation so we never block on stdin in CI.
 */
export const interactivePrompt: ConflictPrompt = {
  async ask(filePath, local, incoming) {
    while (true) {
      const choice = await p.select<ConflictResolution | "diff">({
        message: `Modified locally: ${filePath}`,
        options: [
          { value: "replace", label: "Replace with catalog version (recommended)" },
          { value: "keep", label: "Keep local version (mark as tier3 to silence future prompts)" },
          { value: "diff", label: "Show diff first" },
          { value: "replace_all", label: "Replace all remaining conflicts" },
          { value: "skip_all", label: "Skip all remaining conflicts" },
        ],
        initialValue: "replace",
      });

      if (p.isCancel(choice)) {
        p.cancel("Sync cancelled");
        process.exit(0);
      }

      if (choice === "diff") {
        const out = formatUnifiedDiff(local, incoming);
        p.note(out, basename(filePath));
        continue; // re-prompt
      }

      return choice;
    }
  },
};
