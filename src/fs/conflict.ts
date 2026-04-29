import * as p from "@clack/prompts";
import { basename } from "node:path";
import type { ConflictResolution, Tier3Slot } from "../types.js";
import { formatUnifiedDiff } from "./diff.js";

/**
 * Map a destination file path to its corresponding tier3 slot in AikitConfig.
 * Returns null for paths without a tier3 mechanism (commands, hooks, others).
 */
export function inferTier3Slot(filePath: string): Tier3Slot {
  if (filePath.includes("/agents/") && filePath.endsWith(".md")) return "agents";
  if (filePath.includes("/skills/") && filePath.endsWith(".md")) return "skills";
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
