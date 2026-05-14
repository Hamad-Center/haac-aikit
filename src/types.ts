export type Tool =
  | "claude"
  | "cursor"
  | "copilot"
  | "windsurf"
  | "aider"
  | "gemini"
  | "codex";

export type Integration =
  | "mcp"
  | "hooks"
  | "commands"
  | "subagents"
  | "ci";

export type SkillTier = "tier1" | "tier2" | "tier3";
export type AgentTier = "tier1" | "tier2" | "tier3";

export interface AikitConfig {
  $schema?: string;
  version: 1;
  projectName: string;
  projectDescription?: string;
  tools: Tool[];
  integrations: {
    mcp: boolean;
    hooks: boolean;
    commands: boolean;
    subagents: boolean;
    ci: boolean;
  };
  skills: {
    tier1: "all" | string[];
    tier2: "all" | string[];
    tier3: string[];
  };
  agents?: {
    tier1: "all" | string[];
    tier2: "all" | string[];
    tier3: string[];
  };
  canonical: "AGENTS.md";
}

export interface WizardAnswers {
  projectName: string;
  projectDescription: string;
  tools: Tool[];
}

export interface WriteResult {
  path: string;
  action: "created" | "updated" | "skipped" | "conflict";
  src?: string;
}

export interface WriteOpts {
  dryRun: boolean;
  force: boolean;
}

export type ConflictResolution = "replace" | "keep" | "replace_all" | "skip_all";

export type Tier3Slot = "agents" | "skills" | null;

export interface CliArgs {
  _: string[];
  yes: boolean;
  "dry-run": boolean;
  force: boolean;
  "skip-git-check": boolean;
  "no-color": boolean;
  config?: string;
  tools?: string;
  help: boolean;
  version: boolean;
  rules?: boolean;
  format?: "markdown" | "json";
  since?: string;
  html?: boolean;
}
