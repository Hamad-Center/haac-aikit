// Shared rule-ID parsing for telemetry, dialect translation, and the doctor /
// report commands. Lives in one place so the regex doesn't drift across files
// (which is what caused the metadata-blind bug pre-0.4.1: 4 callers had the
// same regex without metadata support, only the dialects parser was updated).

// Match a rule-ID HTML comment, optionally followed by space-separated
// `key=value` metadata pairs:
//   <!-- id: code-style.no-any -->
//   <!-- id: code-style.no-any emphasis=high -->
//   <!-- id: code-style.no-any emphasis=high paths=src/**/*.ts -->
//
// The slug must start with a letter and contain at least one dot. This
// excludes both single-segment IDs (`foo`) and dotless tokens that turn up
// in docstring examples (`...`).
export const RULE_ID_REGEX =
  /<!--\s*id:\s*([a-zA-Z][a-zA-Z0-9_-]*\.[a-zA-Z0-9._-]+)(?:\s+[a-zA-Z][a-zA-Z0-9_-]*=[^>\s]+)*\s*-->/g;

// Same pattern but anchored for use in single-match contexts.
export const RULE_ID_REGEX_SINGLE =
  /<!--\s*id:\s*([a-zA-Z][a-zA-Z0-9_-]*\.[a-zA-Z0-9._-]+)(?:\s+[a-zA-Z][a-zA-Z0-9_-]*=[^>\s]+)*\s*-->/;

// Extract every rule ID from a piece of markdown content. Used by the doctor
// and report commands to know which rules a project has declared.
export function extractRuleIds(content: string): string[] {
  const ids: string[] = [];
  for (const m of content.matchAll(RULE_ID_REGEX)) {
    if (m[1]) ids.push(m[1]);
  }
  return ids;
}
