#!/usr/bin/env node
import mri from "mri";
import { isInteractive } from "./detect/isCI.js";
import { checkAndNotify } from "./notify.js";
import type { CliArgs } from "./types.js";

// Version is substituted at build time by tsup's `define` from package.json,
// so the bundle and the manifest can't drift. Falls back to a literal for ts-node
// or dev contexts where the define isn't applied.
const VERSION = process.env.HAAC_AIKIT_VERSION ?? "dev";

const HELP = `
haac-aikit — the batteries-included AI-agentic-coding kit

USAGE
  npx haac-aikit [command] [flags]
  aikit [command] [flags]       (if installed globally)

COMMANDS
  (default)         Interactive wizard — drop a complete AI setup into this repo
  sync              Regenerate per-tool files from .aikitrc.json (idempotent)
  update            Pull latest templates; show diff; prompt before writing
  diff              Show drift between current state and a fresh generation
  add <item>        Add a single skill, command, agent, or hook
  list              Show installed items + available catalog
  doctor            Sanity-check: schema, triggers, broken links
  doctor --rules    Rule observability report — which rules fire, are followed, are dead
  report            Markdown / JSON rule-adherence summary (for PR comments / CI)
  learn             Mine recent PR review comments for repeated corrections; propose rules
  whatsnew          Show release notes for the current version (--all for full history)

FLAGS
  --yes, -y           Accept all defaults
  --dry-run           Print what would be written; don't write
  --force             Overwrite without prompting
  --skip-git-check    Allow dirty working tree
  --no-color          Disable ANSI colours
  --config=<path>     Use a specific .aikitrc.json location
  --tools=<list>      Comma-separated tool list (claude,cursor,copilot,...)
  --scope=<scope>     minimal | standard | everything  (--preset is an alias)
  --rules             (with doctor)  Show rule-observability buckets
  --format=<fmt>      (with report / doctor --rules)  markdown | json
  --since=<date>      (with report)  Restrict events to after this ISO date
  --limit=<n>         (with learn)   How many merged PRs to scan (default 30)
  --all               (with whatsnew) Show release notes for all versions
  --no-update-check   Skip the once-per-day npm registry check for this invocation
                      (also honored: AIKIT_NO_UPDATE_CHECK=1 env var)
  --help, -h          Show this help
  --version, -v       Show version
`;

async function main(): Promise<void> {
  const argv = mri<CliArgs>(process.argv.slice(2), {
    boolean: ["yes", "dry-run", "force", "skip-git-check", "no-color", "help", "version", "rules", "all", "no-update-check"],
    string: ["config", "tools", "preset", "scope", "format", "since", "limit"],
    alias: { y: "yes", h: "help", v: "version", scope: "preset" },
    default: {
      yes: false,
      "dry-run": false,
      force: false,
      "skip-git-check": false,
      "no-color": false,
      help: false,
      version: false,
      rules: false,
      all: false,
      "no-update-check": false,
    },
  });

  if (argv.version) {
    process.stdout.write(`haac-aikit v${VERSION}\n`);
    return;
  }

  if (argv.help) {
    process.stdout.write(HELP + "\n");
    return;
  }

  // Update check runs before the command dispatch. The function never throws
  // past its own try/catch, so a network failure can't break the CLI.
  await checkAndNotify(argv, VERSION);

  const [command = "init"] = argv._;

  // Headless flag coalescing — --yes with no explicit command means init
  const headless = argv.yes && !isInteractive();

  switch (command) {
    case "init":
    case "": {
      const { runInit } = await import("./commands/init.js");
      await runInit(argv, headless);
      break;
    }
    case "sync": {
      const { runSync } = await import("./commands/sync.js");
      await runSync(argv);
      break;
    }
    case "update": {
      const { runUpdate } = await import("./commands/update.js");
      await runUpdate(argv);
      break;
    }
    case "diff": {
      const { runDiff } = await import("./commands/diff.js");
      await runDiff(argv);
      break;
    }
    case "add": {
      const { runAdd } = await import("./commands/add.js");
      await runAdd(argv);
      break;
    }
    case "list": {
      const { runList } = await import("./commands/list.js");
      await runList(argv);
      break;
    }
    case "doctor": {
      const { runDoctor } = await import("./commands/doctor.js");
      await runDoctor(argv);
      break;
    }
    case "report": {
      const { runReport } = await import("./commands/report.js");
      await runReport(argv);
      break;
    }
    case "learn": {
      const { runLearn } = await import("./commands/learn.js");
      await runLearn(argv);
      break;
    }
    case "whatsnew": {
      const { runWhatsNew } = await import("./commands/whatsnew.js");
      await runWhatsNew(argv);
      break;
    }
    default:
      process.stderr.write(`Unknown command: ${command}\nRun --help for usage.\n`);
      process.exit(1);
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`\nError: ${message}\n`);
  process.exit(1);
});
