#!/usr/bin/env node
import mri from "mri";
import { isInteractive } from "./detect/isCI.js";
import type { CliArgs } from "./types.js";

const VERSION = "0.1.0";

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

FLAGS
  --yes, -y           Accept all defaults
  --dry-run           Print what would be written; don't write
  --force             Overwrite without prompting
  --skip-git-check    Allow dirty working tree
  --no-color          Disable ANSI colours
  --config=<path>     Use a specific .aikitrc.json location
  --tools=<list>      Comma-separated tool list (claude,cursor,copilot,...)
  --preset=<scope>    minimal | standard | everything
  --help, -h          Show this help
  --version, -v       Show version
`;

async function main(): Promise<void> {
  const argv = mri<CliArgs>(process.argv.slice(2), {
    boolean: ["yes", "dry-run", "force", "skip-git-check", "no-color", "help", "version", "rules"],
    string: ["config", "tools", "preset", "format", "since"],
    alias: { y: "yes", h: "help", v: "version" },
    default: {
      yes: false,
      "dry-run": false,
      force: false,
      "skip-git-check": false,
      "no-color": false,
      help: false,
      version: false,
      rules: false,
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
