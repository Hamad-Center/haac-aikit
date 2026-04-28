import type { ParsedRuleSet } from "./types.js";

// Translate a parsed AGENTS.md rule set into Cursor's MDC format.
// Cursor reads `.cursor/rules/*.mdc` files; frontmatter `globs:` enables
// path-scoped loading (Cursor's equivalent of Claude's `paths:`).
//
// MVP: emit a single base file with `alwaysApply: true`. Path-scoped per-rule
// emission (one .mdc per glob group) is a Phase 2.1 follow-up.
export function translateForCursor(ruleSet: ParsedRuleSet): string {
  const lines: string[] = [];
  lines.push("---");
  lines.push(`description: Project rules for ${ruleSet.projectName} — generated from AGENTS.md by haac-aikit`);
  lines.push("alwaysApply: true");
  lines.push("---");
  lines.push("");
  lines.push("<!-- BEGIN:haac-aikit -->");
  lines.push(`# ${ruleSet.projectName}`);
  lines.push("");
  if (ruleSet.description) {
    lines.push(ruleSet.description);
    lines.push("");
  }
  lines.push(`See [AGENTS.md](../../AGENTS.md) for the authoritative rule set. Cursor-specific dialect:`);
  lines.push("");

  if (ruleSet.rules.length === 0) {
    lines.push("_No annotated rules found in AGENTS.md. Add `<!-- id: x.y -->` comments to opt rules into Cursor translation._");
  } else {
    // Group rules by section to keep the structure familiar.
    const bySection = new Map<string, typeof ruleSet.rules>();
    for (const rule of ruleSet.rules) {
      const section = rule.section || "Rules";
      const existing = bySection.get(section) ?? [];
      existing.push(rule);
      bySection.set(section, existing);
    }

    for (const [section, rules] of bySection) {
      lines.push(`## ${section}`);
      lines.push("");
      for (const rule of rules) {
        const prefix = rule.meta.emphasis === "high" ? "**" : "";
        const suffix = rule.meta.emphasis === "high" ? "**" : "";
        const pathsHint = rule.meta.paths && rule.meta.paths.length > 0
          ? ` _(applies to: \`${rule.meta.paths.join("`, `")}\`)_`
          : "";
        lines.push(`- ${prefix}${rule.text}${suffix}${pathsHint}  <!-- id: ${rule.id} -->`);
      }
      lines.push("");
    }
  }

  lines.push("<!-- END:haac-aikit -->");
  return lines.join("\n");
}
