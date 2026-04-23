import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import kleur from "kleur";
import { readConfig } from "../fs/readConfig.js";
import type { CliArgs } from "../types.js";

interface Finding {
  level: "error" | "warn" | "ok";
  check: string;
  message: string;
}

export async function runDoctor(argv: CliArgs): Promise<void> {
  const findings: Finding[] = [];

  // 1. Config exists
  const config = readConfig(argv.config);
  if (!config) {
    findings.push({ level: "error", check: ".aikitrc.json", message: "Not found — run `aikit` to initialise." });
    printFindings(findings);
    return;
  }
  findings.push({ level: "ok", check: ".aikitrc.json", message: `version ${config.version}, scope: ${config.scope}` });

  // 2. AGENTS.md exists and has markers
  if (existsSync("AGENTS.md")) {
    const content = readFileSync("AGENTS.md", "utf8");
    if (content.includes("<!-- BEGIN:haac-aikit -->")) {
      const lines = content.split("\n").length;
      if (lines > 200) {
        findings.push({ level: "warn", check: "AGENTS.md", message: `${lines} lines — exceeds 200-line budget. Consider pruning.` });
      } else {
        findings.push({ level: "ok", check: "AGENTS.md", message: `${lines} lines, markers present` });
      }
    } else {
      findings.push({ level: "warn", check: "AGENTS.md", message: "No haac-aikit markers — run `aikit sync` to inject them." });
    }
  } else {
    findings.push({ level: "error", check: "AGENTS.md", message: "Missing — run `aikit sync`." });
  }

  // 3. Per-tool rule shims
  const toolChecks: Record<string, string> = {
    claude: "CLAUDE.md",
    copilot: ".github/copilot-instructions.md",
    cursor: ".cursor/rules/000-base.mdc",
    windsurf: ".windsurf/rules/project.md",
    aider: "CONVENTIONS.md",
    gemini: "GEMINI.md",
  };
  for (const tool of config.tools) {
    const file = toolChecks[tool];
    if (!file) continue;
    if (existsSync(file)) {
      findings.push({ level: "ok", check: `${tool} shim`, message: file });
    } else {
      findings.push({ level: "warn", check: `${tool} shim`, message: `${file} missing — run \`aikit sync\`` });
    }
  }

  // 4. Settings.json
  if (config.tools.includes("claude")) {
    if (existsSync(".claude/settings.json")) {
      findings.push({ level: "ok", check: "settings.json", message: ".claude/settings.json present" });
    } else {
      findings.push({ level: "warn", check: "settings.json", message: "Missing — run `aikit sync`" });
    }
  }

  // 5. Skills count
  if (config.scope !== "minimal") {
    const skillsDir = ".claude/skills";
    if (existsSync(skillsDir)) {
      const count = readdirSync(skillsDir).filter((f) => f.endsWith(".md")).length;
      findings.push({ level: "ok", check: "skills", message: `${count} installed` });
    } else {
      findings.push({ level: "warn", check: "skills", message: "Not installed — run `aikit sync`" });
    }
  }

  // 6. Skill description length (≤600 chars)
  const skillsDir = ".claude/skills";
  if (existsSync(skillsDir)) {
    const skills = readdirSync(skillsDir).filter((f) => f.endsWith(".md"));
    let descErrors = 0;
    for (const skill of skills) {
      const content = readFileSync(join(skillsDir, skill), "utf8");
      const descMatch = content.match(/^description:\s*(.+)$/m);
      if (descMatch?.[1] && (descMatch[1] as string).length > 600) {
        descErrors++;
        findings.push({
          level: "warn",
          check: `skill:${skill}`,
          message: `description is ${(descMatch[1] as string).length} chars — exceeds 600-char limit`,
        });
      }
    }
    if (descErrors === 0) {
      findings.push({ level: "ok", check: "skill descriptions", message: "All within 600-char limit" });
    }
  }

  // 7. Hooks registration
  if (config.integrations.hooks) {
    if (existsSync(".claude/hooks/hooks.json")) {
      findings.push({ level: "ok", check: "hooks", message: "hooks.json present" });
    } else {
      findings.push({ level: "warn", check: "hooks", message: "hooks.json missing — run `aikit sync`" });
    }
  }

  // 8. .gitignore contains .env*
  if (existsSync(".gitignore")) {
    const gi = readFileSync(".gitignore", "utf8");
    if (gi.includes(".env")) {
      findings.push({ level: "ok", check: ".gitignore", message: ".env* entries present" });
    } else {
      findings.push({ level: "warn", check: ".gitignore", message: ".env* not in .gitignore — secrets risk" });
    }
  } else {
    findings.push({ level: "warn", check: ".gitignore", message: "Missing — run `aikit sync` to create" });
  }

  printFindings(findings);
}

function printFindings(findings: Finding[]): void {
  const errors = findings.filter((f) => f.level === "error");
  const warns = findings.filter((f) => f.level === "warn");
  const oks = findings.filter((f) => f.level === "ok");

  for (const f of findings) {
    const icon =
      f.level === "error" ? kleur.red("✗") : f.level === "warn" ? kleur.yellow("⚠") : kleur.green("✓");
    process.stdout.write(`${icon}  ${kleur.bold(f.check)}: ${f.message}\n`);
  }

  process.stdout.write("\n");
  if (errors.length > 0) {
    process.stdout.write(kleur.red(`${errors.length} error(s), ${warns.length} warning(s)\n`));
    process.exit(1);
  } else if (warns.length > 0) {
    process.stdout.write(kleur.yellow(`0 errors, ${warns.length} warning(s) — run \`aikit sync\` to resolve\n`));
  } else {
    process.stdout.write(kleur.green(`All ${oks.length} checks passed.\n`));
  }
}
