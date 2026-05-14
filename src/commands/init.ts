import * as p from "@clack/prompts";
import { basename } from "node:path";
import { isDirtyTree, isGitRepo } from "../detect/gitState.js";
import { readConfig, writeConfig } from "../fs/readConfig.js";
import type { AikitConfig, CliArgs, Tool } from "../types.js";
import { runWizard } from "../wizard.js";

export async function runInit(argv: CliArgs, headless: boolean): Promise<void> {
  const dryRun = argv["dry-run"];

  if (!argv["skip-git-check"] && !headless && isGitRepo() && isDirtyTree()) {
    const proceed = await p.confirm({
      message: "Working tree has uncommitted changes. Continue?",
      initialValue: false,
    });
    if (!proceed) {
      p.cancel("Aborted. Stash or commit changes first.");
      process.exit(0);
    }
  }

  // If .aikitrc.json already exists → sync mode
  const existing = readConfig(argv.config);
  if (existing) {
    const { runSync } = await import("./sync.js");
    await runSync(argv);
    return;
  }

  let config: AikitConfig;

  if (headless || argv.yes) {
    config = buildDefaultConfig(basename(process.cwd()), "", parseTools(argv.tools));
  } else {
    const answers = await runWizard(basename(process.cwd()));
    config = buildDefaultConfig(answers.projectName, answers.projectDescription, answers.tools);
  }

  writeConfig(config, argv.config ?? ".aikitrc.json", dryRun);

  const { runSync } = await import("./sync.js");
  await runSync(argv);
}

function parseTools(raw?: string): Tool[] {
  const all: Tool[] = ["claude", "cursor", "copilot", "windsurf", "aider", "gemini", "codex"];
  if (!raw || raw === "all") return all;
  if (raw === "none") return [];
  return raw.split(",").filter((t): t is Tool => all.includes(t as Tool));
}

function buildDefaultConfig(projectName: string, projectDescription: string, tools: Tool[]): AikitConfig {
  return {
    version: 1,
    projectName,
    projectDescription,
    tools,
    integrations: {
      mcp: true,
      hooks: true,
      commands: true,
      subagents: true,
      ci: true,
    },
    skills: { tier1: "all", tier2: "all", tier3: [] },
    agents: { tier1: "all", tier2: "all", tier3: [] },
    canonical: "AGENTS.md",
  };
}
