import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import * as p from "@clack/prompts";
import kleur from "kleur";
import {
  htmlArtifactsRoot,
  loadHtmlArtifactsManifest,
  resolveTemplate,
} from "../templates/index.js";
import type {
  CliArgs,
  TemplateEntry,
  TemplateManifest,
  TemplateCategory,
} from "../types.js";

export async function runScaffold(argv: CliArgs): Promise<void> {
  // Subcommand: first positional arg after `scaffold` selects the kind.
  // Today only `html` is supported; this leaves room for other scaffolds.
  const kind = argv._[1];

  if (!kind) {
    p.log.error("Usage: aikit scaffold html [<pattern>]  (run --list to see patterns)");
    process.exit(1);
  }

  if (kind !== "html") {
    p.log.error(`Unknown scaffold kind: "${kind}". Supported: html`);
    process.exit(1);
  }

  const manifest = loadHtmlArtifactsManifest();

  if (argv.list) {
    printList(manifest);
    return;
  }

  const identifier = argv._[2];
  const template = identifier
    ? resolveTemplate(manifest, identifier)
    : await pickTemplateInteractive(manifest);

  if (!template) {
    if (identifier) {
      p.log.error(`Template not found: "${identifier}"`);
      const slugs = manifest.templates.map((t) => t.slug).slice(0, 5).join(", ");
      process.stdout.write(`Run ${kleur.cyan("aikit scaffold html --list")} to see all. Slugs include: ${slugs}, ...\n`);
      process.exit(1);
    }
    p.cancel("Cancelled.");
    return;
  }

  const sourcePath = join(htmlArtifactsRoot(), template.file);
  if (!existsSync(sourcePath)) {
    p.log.error(`Template file missing on disk: ${sourcePath}`);
    process.exit(1);
  }

  const destFilename = argv.name ?? template.file;
  const destPath = resolve(process.cwd(), destFilename);

  if (existsSync(destPath) && !argv.force) {
    p.log.error(
      `Refusing to overwrite ${destFilename}. Use --force to replace, or --name to choose a different filename.`
    );
    process.exit(1);
  }

  if (argv["dry-run"]) {
    process.stdout.write(
      `${kleur.dim("[dry-run]")} would write ${kleur.cyan(destPath)} from ${kleur.dim(template.file)}\n`
    );
    return;
  }

  mkdirSync(dirname(destPath), { recursive: true });
  copyFileSync(sourcePath, destPath);

  process.stdout.write(
    `${kleur.green("✓")} Scaffolded ${kleur.bold(destFilename)} ` +
      `${kleur.dim(`(${template.title}, pattern: ${template.category})`)}\n`
  );
  process.stdout.write(
    `\nNext steps:\n` +
      `  1. Open it: ${kleur.cyan(`open ${destFilename}`)}\n` +
      `  2. Ask your agent to fill it with current project context — the html-artifacts skill\n     describes which sections to populate for the ${kleur.bold(template.category)} pattern.\n`
  );
}

async function pickTemplateInteractive(
  manifest: TemplateManifest
): Promise<TemplateEntry | null> {
  const options = buildPickerOptions(manifest);

  const selection = (await p.select({
    message: "Pick a template to scaffold",
    options,
  })) as string | symbol;

  if (typeof selection === "symbol") return null;
  return manifest.templates.find((t) => t.slug === selection) ?? null;
}

function buildPickerOptions(
  manifest: TemplateManifest
): { value: string; label: string; hint?: string }[] {
  // Group templates by category for a structured picker; @clack/prompts.select
  // doesn't have native groups, so we prefix labels with the category title.
  const byCategory = new Map<string, TemplateEntry[]>();
  for (const t of manifest.templates) {
    const list = byCategory.get(t.category) ?? [];
    list.push(t);
    byCategory.set(t.category, list);
  }

  const options: { value: string; label: string; hint?: string }[] = [];
  for (const cat of manifest.categories) {
    const items = byCategory.get(cat.slug);
    if (!items || items.length === 0) continue;
    for (const item of items) {
      options.push({
        value: item.slug,
        label: `${cat.title} — ${item.title}`,
        hint: item.description,
      });
    }
  }
  return options;
}

function printList(manifest: TemplateManifest): void {
  process.stdout.write(`\n${kleur.bold("html-artifact templates")} (${manifest.templates.length} total)\n`);
  process.stdout.write(
    `${kleur.dim("Use: aikit scaffold html <slug>   |   aikit scaffold html <number>")}\n`
  );

  const byCategory = new Map<string, TemplateEntry[]>();
  for (const t of manifest.templates) {
    const list = byCategory.get(t.category) ?? [];
    list.push(t);
    byCategory.set(t.category, list);
  }

  for (const cat of manifest.categories) {
    const items = byCategory.get(cat.slug);
    if (!items || items.length === 0) continue;
    process.stdout.write(`\n${kleur.bold(cat.title)}\n`);
    for (const item of items) {
      process.stdout.write(
        `  ${kleur.dim(item.number)}  ${kleur.cyan(item.slug.padEnd(20))} ${kleur.dim(item.description)}\n`
      );
    }
  }
  process.stdout.write("\n");
}

// Test seam — exposes the manifest reader so tests can assert it's well-formed
// without re-implementing the JSON parse here.
export function readManifestForTests(): TemplateManifest {
  return loadHtmlArtifactsManifest();
}

// Exported for use by external test utilities that want to read the raw file
// content (e.g. to check file size or specific markup). Kept narrow on purpose.
export function readTemplateFileForTests(file: string): string {
  return readFileSync(join(htmlArtifactsRoot(), file), "utf8");
}
