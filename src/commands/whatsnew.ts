import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import kleur from "kleur";
import { CATALOG_ROOT } from "../catalog/index.js";
import type { CliArgs } from "../types.js";

interface ReleaseEntry {
  version: string;
  date: string;
  headline: string;
  highlights: string[];
  breaking?: string[];
  migration?: string[];
  links?: { changelog?: string; release?: string };
}

interface ReleaseNotes {
  version: 1;
  releases: ReleaseEntry[];
}

export async function runWhatsNew(argv: CliArgs): Promise<void> {
  const notesPath = join(CATALOG_ROOT, "release-notes.json");
  if (!existsSync(notesPath)) {
    process.stderr.write(
      `release-notes.json not found at ${notesPath}. Run \`npm run build\` if this is a dev checkout.\n`
    );
    process.exit(1);
  }

  let notes: ReleaseNotes;
  try {
    notes = JSON.parse(readFileSync(notesPath, "utf8")) as ReleaseNotes;
  } catch (err) {
    process.stderr.write(
      `release-notes.json is malformed: ${err instanceof Error ? err.message : String(err)}\n`
    );
    process.exit(1);
  }

  if (!Array.isArray(notes.releases) || notes.releases.length === 0) {
    process.stdout.write("No release notes available.\n");
    return;
  }

  const showAll = Boolean(argv.all);
  const toPrint = showAll ? notes.releases : notes.releases.slice(0, 1);

  for (const release of toPrint) {
    printRelease(release);
  }

  if (!showAll && notes.releases.length > 1) {
    process.stdout.write(
      `\n${kleur.dim(`(showing latest only — run \`aikit whatsnew --all\` for the full history of ${notes.releases.length} releases)`)}\n`
    );
  }
}

function printRelease(release: ReleaseEntry): void {
  process.stdout.write(
    `\n${kleur.bold().cyan(`haac-aikit v${release.version}`)} ${kleur.dim(`— ${release.date}`)}\n`
  );
  process.stdout.write(`${kleur.bold(release.headline)}\n\n`);

  if (release.highlights.length > 0) {
    process.stdout.write(`${kleur.bold("Highlights")}\n`);
    for (const item of release.highlights) {
      process.stdout.write(`  ${kleur.green("•")} ${item}\n`);
    }
  }

  if (release.breaking && release.breaking.length > 0) {
    process.stdout.write(`\n${kleur.bold().yellow("Breaking changes")}\n`);
    for (const item of release.breaking) {
      process.stdout.write(`  ${kleur.yellow("!")} ${item}\n`);
    }
  }

  if (release.migration && release.migration.length > 0) {
    process.stdout.write(`\n${kleur.bold("Migration")}\n`);
    for (const item of release.migration) {
      process.stdout.write(`  ${kleur.cyan("→")} ${item}\n`);
    }
  }

  if (release.links) {
    process.stdout.write(`\n${kleur.bold("Links")}\n`);
    if (release.links.changelog) {
      process.stdout.write(`  ${kleur.dim("CHANGELOG:")} ${release.links.changelog}\n`);
    }
    if (release.links.release) {
      process.stdout.write(`  ${kleur.dim("Release:  ")} ${release.links.release}\n`);
    }
  }
}
