import * as p from "@clack/prompts";
import kleur from "kleur";
import type { Tool, WizardAnswers } from "./types.js";

const ALL_TOOLS: { value: Tool; label: string; hint: string }[] = [
  { value: "claude", label: "Claude Code", hint: "CLAUDE.md + .claude/" },
  { value: "cursor", label: "Cursor", hint: ".cursor/rules/" },
  { value: "copilot", label: "GitHub Copilot", hint: ".github/copilot-instructions.md" },
  { value: "windsurf", label: "Windsurf", hint: ".windsurf/rules/" },
  { value: "aider", label: "Aider", hint: "CONVENTIONS.md + .aider.conf.yml" },
  { value: "gemini", label: "Gemini CLI", hint: "GEMINI.md shim" },
  { value: "codex", label: "OpenAI Codex CLI", hint: "AGENTS.md (already canonical)" },
];

export async function runWizard(projectName: string): Promise<WizardAnswers> {
  p.intro(kleur.bgCyan().black(" haac-aikit ") + "  The batteries-included AI-coding kit");

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
  };
}
