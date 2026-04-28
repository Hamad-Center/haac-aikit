export type Tool =
  | "claude"
  | "cursor"
  | "copilot"
  | "windsurf"
  | "aider"
  | "gemini"
  | "codex";

export type Scope = "minimal" | "standard" | "everything";

export type ProjectShape = "web" | "mobile" | "fullstack" | "backend" | "library";

export type Integration =
  | "mcp"
  | "hooks"
  | "commands"
  | "subagents"
  | "ci"
  | "husky"
  | "devcontainer"
  | "plugin"
  | "otel";

export type SkillTier = "tier1" | "tier2" | "tier3";

export interface AikitConfig {
  $schema?: string;
  version: 1;
  projectName: string;
  projectDescription?: string;
  tools: Tool[];
  scope: Scope;
  shape: ProjectShape[];
  integrations: {
    mcp: boolean;
    hooks: boolean;
    commands: boolean;
    subagents: boolean;
    ci: boolean;
    husky: boolean;
    devcontainer?: boolean;
    plugin?: boolean;
    otel?: boolean;
  };
  skills: {
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
  scope: Scope;
  integrations: Integration[];
  shape: ProjectShape[];
}

export interface WriteResult {
  path: string;
  action: "created" | "updated" | "skipped" | "conflict";
}

export interface CliArgs {
  _: string[];
  yes: boolean;
  "dry-run": boolean;
  force: boolean;
  "skip-git-check": boolean;
  "no-color": boolean;
  config?: string;
  tools?: string;
  preset?: Scope;
  help: boolean;
  version: boolean;
  rules?: boolean;
  format?: "markdown" | "json";
  since?: string;
  limit?: number | string;
}
