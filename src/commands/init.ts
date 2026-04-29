import * as p from "@clack/prompts";
import { basename } from "node:path";
import { isDirtyTree, isGitRepo } from "../detect/gitState.js";
import { readConfig, writeConfig } from "../fs/readConfig.js";
import type { AikitConfig, CliArgs, Integration, ProjectShape, Scope, Tool } from "../types.js";
import { runWizard } from "../wizard.js";

export async function runInit(argv: CliArgs, headless: boolean): Promise<void> {
  const dryRun = argv["dry-run"];

  // Dirty-tree check (skip in CI / with flag)
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

  // Resolve config from flags or wizard
  let config: AikitConfig;

  if (headless || argv.yes) {
    const projectName = basename(process.cwd());
    const tools = parseTools(argv.tools);
    const scope = argv.preset ?? "standard";
    const integrations = defaultIntegrationsForScope(scope);
    config = buildDefaultConfig(projectName, "", tools, scope, integrations, []);
  } else {
    const answers = await runWizard(basename(process.cwd()));
    const defaultIntegrations = defaultIntegrationsForScope(answers.scope);
    const integrations = answers.integrations.length > 0 ? answers.integrations : defaultIntegrations;
    config = buildDefaultConfig(
      answers.projectName,
      answers.projectDescription,
      answers.tools,
      answers.scope,
      integrations,
      answers.shape
    );
  }

  // Write config first so sync can read it
  writeConfig(config, argv.config ?? ".aikitrc.json", dryRun);

  // Delegate all file writing to sync for consistency
  const { runSync } = await import("./sync.js");
  await runSync(argv);
}

function parseTools(raw?: string): Tool[] {
  const all: Tool[] = ["claude", "cursor", "copilot", "windsurf", "aider", "gemini", "codex"];
  if (!raw || raw === "all") return all;
  if (raw === "none") return [];
  return raw.split(",").filter((t): t is Tool => all.includes(t as Tool));
}

function defaultIntegrationsForScope(scope: Scope): Integration[] {
  if (scope === "minimal") return ["mcp"];
  if (scope === "standard") return ["mcp", "hooks", "commands", "subagents", "ci", "husky"];
  return ["mcp", "hooks", "commands", "subagents", "ci", "husky", "devcontainer", "plugin", "otel"];
}

function buildDefaultConfig(
  projectName: string,
  projectDescription: string,
  tools: Tool[],
  scope: Scope,
  integrations: Integration[],
  shape: ProjectShape[]
): AikitConfig {
  return {
    version: 1,
    projectName,
    projectDescription,
    tools,
    scope,
    shape,
    integrations: {
      mcp: integrations.includes("mcp"),
      hooks: integrations.includes("hooks"),
      commands: integrations.includes("commands"),
      subagents: integrations.includes("subagents"),
      ci: integrations.includes("ci"),
      husky: integrations.includes("husky"),
      devcontainer: integrations.includes("devcontainer"),
      plugin: integrations.includes("plugin"),
      otel: integrations.includes("otel"),
    },
    skills: { tier1: "all", tier2: "all", tier3: [] },
    agents: { tier1: "all", tier2: "all", tier3: [] },
    canonical: "AGENTS.md",
  };
}
