import type { ParsedRule, ParsedRuleSet, RuleMeta } from "./types.js";

// Match a rule-ID HTML comment with optional metadata key=value pairs.
// Examples that match:
//   <!-- id: code-style.no-any -->
//   <!-- id: code-style.no-any emphasis=high -->
//   <!-- id: code-style.no-any emphasis=high paths=src/**/*.ts,test/** -->
const ID_LINE_RX =
  /<!--\s*id:\s*(?<id>[a-zA-Z][a-zA-Z0-9_-]*\.[a-zA-Z0-9._-]+)(?<meta>(?:\s+[a-zA-Z][a-zA-Z0-9_-]*=[^>\s]+)*)\s*-->/;

// Match the leading bullet glyph + the inline ID comment so we can isolate
// the human-readable rule text on the same line.
const RULE_PREFIX_RX = /^(\s*[-*]\s*)?<!--\s*id:[^>]+-->\s*/;

const SECTION_RX = /^##\s+(.+)$/;

export function parseRuleSet(content: string, projectName: string, description: string): ParsedRuleSet {
  const rules: ParsedRule[] = [];
  const rawSections = new Map<string, string>();

  let currentSection = "";
  let sectionBuffer: string[] = [];

  const flushSection = (): void => {
    if (currentSection && sectionBuffer.length > 0) {
      rawSections.set(currentSection, sectionBuffer.join("\n").trim());
    }
  };

  for (const line of content.split("\n")) {
    const sectionMatch = line.match(SECTION_RX);
    if (sectionMatch?.[1]) {
      flushSection();
      currentSection = sectionMatch[1].trim();
      sectionBuffer = [];
      continue;
    }
    sectionBuffer.push(line);

    const idMatch = line.match(ID_LINE_RX);
    if (idMatch?.groups?.id) {
      const text = line.replace(RULE_PREFIX_RX, "").trim();
      rules.push({
        id: idMatch.groups.id,
        text: text || idMatch.groups.id,
        meta: parseMeta(idMatch.groups.meta ?? ""),
        section: currentSection,
      });
    }
  }
  flushSection();

  return { projectName, description, rules, rawSections };
}

function parseMeta(metaString: string): RuleMeta {
  const meta: RuleMeta = {};
  for (const part of metaString.trim().split(/\s+/).filter(Boolean)) {
    const eq = part.indexOf("=");
    if (eq < 1) continue;
    const key = part.slice(0, eq);
    const value = part.slice(eq + 1);
    if (key === "emphasis" && (value === "high" || value === "normal" || value === "low")) {
      meta.emphasis = value;
    } else if (key === "paths") {
      meta.paths = value.split(",").map((p) => p.trim()).filter(Boolean);
    }
  }
  return meta;
}
