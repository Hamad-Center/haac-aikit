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

/* ------------------------------------------------------------------ *
 * Named-section markers: BEGIN:haac-aikit:section:<id>
 *
 * These are siblings of the main BEGIN:haac-aikit block. They give the
 * /docs and /decide skills a way to read or edit one named slice of a
 * file without re-loading the whole thing.
 *
 * Same dialect rules apply (see makeBegin/makeEnd above).
 * ------------------------------------------------------------------ */

const SECTION_ID_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;

function validateSectionId(id: string): void {
  if (!SECTION_ID_REGEX.test(id)) {
    throw new Error(
      `invalid section id: ${JSON.stringify(id)} (must match ${SECTION_ID_REGEX})`
    );
  }
}

function makeSectionBegin(dialect: Dialect, id: string): string {
  switch (dialect) {
    case "json":
      return `"// BEGIN:${MARKER}:section:${id}": ""`;
    case "yaml":
      return `# BEGIN:${MARKER}:section:${id}`;
    case "markdown":
      return `<!-- BEGIN:${MARKER}:section:${id} -->`;
  }
}

function makeSectionEnd(dialect: Dialect, id: string): string {
  switch (dialect) {
    case "json":
      return `"// END:${MARKER}:section:${id}": ""`;
    case "yaml":
      return `# END:${MARKER}:section:${id}`;
    case "markdown":
      return `<!-- END:${MARKER}:section:${id} -->`;
  }
}

/**
 * Returns true if the named section exists in the file.
 */
export function hasSection(content: string, sectionId: string, filePath: string): boolean {
  validateSectionId(sectionId);
  const dialect = detectDialect(filePath);
  const begin = makeSectionBegin(dialect, sectionId);
  const end = makeSectionEnd(dialect, sectionId);
  const beginIdx = content.indexOf(begin);
  const endIdx = content.indexOf(end);
  return beginIdx !== -1 && endIdx !== -1 && endIdx > beginIdx;
}

/**
 * Read the body of a named section. Returns null if the section is missing.
 * The returned body has leading/trailing newlines stripped (`.trim()`).
 */
export function readSection(
  content: string,
  sectionId: string,
  filePath: string
): string | null {
  validateSectionId(sectionId);
  const dialect = detectDialect(filePath);
  const begin = makeSectionBegin(dialect, sectionId);
  const end = makeSectionEnd(dialect, sectionId);

  const beginIdx = content.indexOf(begin);
  const endIdx = content.indexOf(end);
  if (beginIdx === -1 || endIdx === -1 || endIdx <= beginIdx) return null;

  return content.slice(beginIdx + begin.length, endIdx).trim();
}

/**
 * Replace the body of a named section. Throws if the section is missing —
 * use {@link appendSection} to create a new one.
 *
 * Round-trip property: writeSection(c, id, readSection(c, id)!, file) === c
 * when the round-trip cases in the test suite pass.
 */
export function writeSection(
  content: string,
  sectionId: string,
  newBody: string,
  filePath: string
): string {
  validateSectionId(sectionId);
  const dialect = detectDialect(filePath);
  const begin = makeSectionBegin(dialect, sectionId);
  const end = makeSectionEnd(dialect, sectionId);

  const beginIdx = content.indexOf(begin);
  const endIdx = content.indexOf(end);
  if (beginIdx === -1 || endIdx === -1 || endIdx <= beginIdx) {
    throw new Error(`section not found: ${JSON.stringify(sectionId)} in ${filePath}`);
  }

  const before = content.slice(0, beginIdx + begin.length);
  const after = content.slice(endIdx);
  return `${before}\n${newBody}\n${after}`;
}

/**
 * Append a new named section at the end of the file. Throws if a section
 * with that id already exists.
 */
export function appendSection(
  content: string,
  sectionId: string,
  body: string,
  filePath: string
): string {
  validateSectionId(sectionId);
  if (hasSection(content, sectionId, filePath)) {
    throw new Error(`section already exists: ${JSON.stringify(sectionId)} in ${filePath}`);
  }
  const dialect = detectDialect(filePath);
  const begin = makeSectionBegin(dialect, sectionId);
  const end = makeSectionEnd(dialect, sectionId);

  const separator = content.length > 0 && !content.endsWith("\n") ? "\n\n" : content.length > 0 ? "\n" : "";
  return `${content}${separator}${begin}\n${body}\n${end}\n`;
}
