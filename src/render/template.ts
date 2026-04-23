/**
 * Simple {{var}} string interpolation. No dependencies — keeps the bundle tiny.
 * Throws if a referenced variable is missing from the context.
 */
export function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    if (!(key in vars)) {
      throw new Error(`Template variable not found: {{${key}}}`);
    }
    return vars[key] ?? "";
  });
}

/** Returns list of all {{var}} tokens in a template. */
export function extractVars(template: string): string[] {
  const matches = template.matchAll(/\{\{(\w+)\}\}/g);
  return [...new Set([...matches].map((m) => m[1] as string))];
}
