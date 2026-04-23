/**
 * BEGIN/END marker engine.
 *
 * Supports four file dialects:
 *   markdown / .mdc  → <!-- BEGIN:haac-aikit --> … <!-- END:haac-aikit -->
 *   JSON             → "// BEGIN:haac-aikit": "" … "// END:haac-aikit": ""
 *   YAML / shell     → # BEGIN:haac-aikit … # END:haac-aikit
 *
 * Content outside markers is always preserved unchanged.
 */

const MARKER = "haac-aikit";

type Dialect = "markdown" | "json" | "yaml";

function detectDialect(filePath: string): Dialect {
  if (filePath.endsWith(".json")) return "json";
  if (
    filePath.endsWith(".yaml") ||
    filePath.endsWith(".yml") ||
    filePath.endsWith(".sh") ||
    filePath.endsWith(".conf") ||
    filePath.endsWith(".toml")
  )
    return "yaml";
  return "markdown";
}

function makeBegin(dialect: Dialect): string {
  switch (dialect) {
    case "json":
      return `"// BEGIN:${MARKER}": ""`;
    case "yaml":
      return `# BEGIN:${MARKER}`;
    case "markdown":
      return `<!-- BEGIN:${MARKER} -->`;
  }
}

function makeEnd(dialect: Dialect): string {
  switch (dialect) {
    case "json":
      return `"// END:${MARKER}": ""`;
    case "yaml":
      return `# END:${MARKER}`;
    case "markdown":
      return `<!-- END:${MARKER} -->`;
  }
}

export interface MarkerResult {
  hasMarkers: boolean;
  replaced: string;
}

/**
 * If the file already contains BEGIN/END markers, replace only the
 * content between them. Otherwise append the new content with markers.
 */
export function upsertMarkerRegion(
  existing: string,
  newContent: string,
  filePath: string
): MarkerResult {
  const dialect = detectDialect(filePath);
  const begin = makeBegin(dialect);
  const end = makeEnd(dialect);

  const beginIdx = existing.indexOf(begin);
  const endIdx = existing.indexOf(end);

  if (beginIdx !== -1 && endIdx !== -1 && endIdx > beginIdx) {
    const before = existing.slice(0, beginIdx + begin.length);
    const after = existing.slice(endIdx);
    const replaced = `${before}\n${newContent}\n${after}`;
    return { hasMarkers: true, replaced };
  }

  // No markers — append
  const separator = existing.length > 0 && !existing.endsWith("\n") ? "\n\n" : "\n";
  const replaced = `${existing}${separator}${begin}\n${newContent}\n${end}\n`;
  return { hasMarkers: false, replaced };
}

/**
 * Wrap content with BEGIN/END markers for a fresh file.
 */
export function wrapWithMarkers(content: string, filePath: string): string {
  const dialect = detectDialect(filePath);
  return `${makeBegin(dialect)}\n${content}\n${makeEnd(dialect)}\n`;
}

/**
 * Extract content inside markers. Returns null if no markers found.
 */
export function extractMarkerRegion(content: string, filePath: string): string | null {
  const dialect = detectDialect(filePath);
  const begin = makeBegin(dialect);
  const end = makeEnd(dialect);

  const beginIdx = content.indexOf(begin);
  const endIdx = content.indexOf(end);

  if (beginIdx === -1 || endIdx === -1 || endIdx <= beginIdx) return null;
  return content.slice(beginIdx + begin.length, endIdx).trim();
}
