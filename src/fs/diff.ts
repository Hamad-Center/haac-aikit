import { createPatch } from "diff";
import kleur from "kleur";

/**
 * Render a unified diff between two strings as colored, human-readable text.
 * Empty string when inputs are identical. 3 lines of context.
 */
export function formatUnifiedDiff(local: string, incoming: string): string {
  if (local === incoming) return "";

  // createPatch returns a unified diff with a header. Strip the header,
  // keep only hunk content. Use 3 lines of context.
  const raw = createPatch("local", local, incoming, "", "", { context: 3 });

  const lines: string[] = [];
  let inHunk = false;
  for (const line of raw.split("\n")) {
    if (line.startsWith("@@")) {
      inHunk = true;
      continue;
    }
    if (!inHunk) continue;
    if (line.startsWith("+") && !line.startsWith("+++")) {
      lines.push(kleur.green(`+ ${line.slice(1)}`));
    } else if (line.startsWith("-") && !line.startsWith("---")) {
      lines.push(kleur.red(`- ${line.slice(1)}`));
    } else if (line.startsWith(" ")) {
      lines.push(kleur.dim(`  ${line.slice(1)}`));
    }
  }
  return lines.join("\n");
}
