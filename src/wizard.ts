import * as p from "@clack/prompts";
import kleur from "kleur";
import type { Integration, ProjectShape, Scope, Tool, WizardAnswers } from "./types.js";

export const SPECIALTY_TIER2_AGENTS = [
  { value: "flake-hunter", label: "flake-hunter — diagnose intermittent test failures" },
  { value: "simplifier", label: "simplifier — DRY, dead code, complexity reduction" },
  { value: "prompt-engineer", label: "prompt-engineer — author/optimize prompts" },
  { value: "evals-author", label: "evals-author — eval datasets & benchmarks" },
  { value: "changelog-curator", label: "changelog-curator — generate CHANGELOG from commits" },
  { value: "dependency-upgrader", label: "dependency-upgrader — npm major bumps + codemods" },
] as const;

export function defaultSpecialtyAgents(scope: Scope): string[] {
  if (scope === "everything") return SPECIALTY_TIER2_AGENTS.map((a) => a.value);
  return [];
}

const ALL_TOOLS: { value: Tool; label: string; hint: string }[] = [
  { value: "claude", label: "Claude Code", hint: "CLAUDE.md + .claude/" },
  { value: "cursor", label: "Cursor", hint: ".cursor/rules/" },
  { value: "copilot", label: "GitHub Copilot", hint: ".github/copilot-instructions.md" },
  { value: "windsurf", label: "Windsurf", hint: ".windsurf/rules/" },
  { value: "aider", label: "Aider", hint: "CONVENTIONS.md + .aider.conf.yml" },
  { value: "gemini", label: "Gemini CLI", hint: "GEMINI.md shim" },
  { value: "codex", label: "OpenAI Codex CLI", hint: "AGENTS.md (already canonical)" },
];

const ALL_SHAPES: { value: ProjectShape; label: string }[] = [
  { value: "web", label: "Web frontend" },
  { value: "fullstack", label: "Full-stack" },
  { value: "backend", label: "Backend / API" },
  { value: "mobile", label: "Mobile" },
  { value: "library", label: "Library / package" },
];

const ALL_INTEGRATIONS: { value: Integration; label: string }[] = [
  { value: "mcp", label: "MCP stub (.mcp.json)" },
  { value: "hooks", label: "Claude Code hooks" },
  { value: "commands", label: "Slash commands" },
  { value: "subagents", label: "Subagents catalog" },
  { value: "ci", label: "CI workflows (.github/workflows/)" },
  { value: "husky", label: "Husky pre-commit hooks" },
  { value: "devcontainer", label: "Dev container (.devcontainer/)" },
  { value: "plugin", label: "Claude Code plugin wrapper" },
  { value: "otel", label: "OTel telemetry exporter" },
];

export async function runWizard(projectName: string): Promise<WizardAnswers> {
  p.intro(kleur.bgCyan().black(" haac-aikit ") + "  The batteries-included AI-agentic-coding kit");

  const answers = await p.group(
    {
      projectName: () =>
        p.text({
          message: "Project name",
          defaultValue: projectName,
          placeholder: projectName,
        }),

      projectDescription: () =>
        p.text({
          message: "Project description",
          placeholder: "One sentence (optional)",
        }),

      tools: () =>
        p.multiselect<Tool>({
          message: "Which AI coding tools do you use?",
          options: ALL_TOOLS,
          initialValues: ALL_TOOLS.map((t) => t.value),
          required: true,
        }),

      scope: () =>
        p.select<Scope>({
          message: "Installation scope",
          options: [
            {
              value: "html",
              label: "Just HTML artifacts",
              hint: "html-artifacts skill + 20 templates + /html command. No AGENTS.md, no agents, no hooks.",
            },
            {
              value: "minimal",
              label: "Minimal",
              hint: "AGENTS.md + rule shims + .mcp.json",
            },
            {
              value: "standard",
              label: "Standard (recommended)",
              hint: "+ skills, commands, agents, hooks, CI",
            },
            {
              value: "everything",
              label: "Everything",
              hint: "+ devcontainer, plugin, OTel, sync workflow",
            },
          ],
          initialValue: "standard",
        }),

      integrations: ({ results }) => {
        if (results.scope === "html") return Promise.resolve(undefined);
        if (results.scope !== "everything") return Promise.resolve(undefined);
        return p.multiselect<Integration>({
          message: "Optional integrations",
          options: ALL_INTEGRATIONS,
          initialValues: ALL_INTEGRATIONS.map((i) => i.value),
          required: false,
        });
      },

      shape: ({ results }) => {
        if (results.scope === "minimal" || results.scope === "html") return Promise.resolve(undefined);
        return p.multiselect<ProjectShape>({
          message: "Project shape  (adds domain-specialist agents)",
          options: ALL_SHAPES,
          initialValues: ["web"],
          required: false,
        });
      },

      specialtyAgents: ({ results }) => {
        if (results.scope === "minimal" || results.scope === "html") return Promise.resolve(undefined);
        return p.multiselect<string>({
          message: "Include specialty agents? (debugger and pr-describer always installed)",
          options: SPECIALTY_TIER2_AGENTS.map((a) => ({ value: a.value, label: a.label })),
          required: false,
          initialValues: defaultSpecialtyAgents(results.scope ?? "standard"),
        });
      },
    },
    {
      onCancel: () => {
        p.cancel("Setup cancelled.");
        process.exit(0);
      },
    }
  );

  return {
    projectName: (answers.projectName as string) || projectName,
    projectDescription: (answers.projectDescription as string) || "",
    tools: (answers.tools as Tool[]) ?? ALL_TOOLS.map((t) => t.value),
    scope: (answers.scope as Scope) ?? "standard",
    integrations: (answers.integrations as Integration[]) ?? [],
    shape: (answers.shape as ProjectShape[]) ?? [],
    specialtyAgents: (answers.specialtyAgents as string[]) ?? [],
  };
}
