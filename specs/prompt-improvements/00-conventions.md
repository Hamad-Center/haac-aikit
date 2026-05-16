# 00 · Claude Code conventions (audit baseline)

This document captures the conventions used by the official Claude Code CLI for skills, agents, and slash commands. It is the reference standard the rest of this folder audits against.

Everything here is observable from the Claude Code system prompt and from how the CLI loads/dispatches these artifacts. Where the haac-aikit catalog diverges, [05-cross-cutting.md](./05-cross-cutting.md) lists the violations.

---

## 1 · Skills

Skills are **folders** with a `SKILL.md` entry point. The folder is the unit of versioning, packaging, and migration; `SKILL.md` is the always-loaded body; `references/`, `examples/`, and `scripts/` (optional subdirs) carry lazy-loaded content the skill body reads on demand.

```
catalog/skills/<tier>/<skill-name>/
├── SKILL.md                  # required — entry point
├── references/               # optional — lazy-loaded reference docs
│   ├── <topic>.md
│   └── examples/             # optional — trimmed exemplars
│       └── *.md
└── scripts/                  # optional — executable helpers
    └── *.sh
```

Folder-name = skill-name = `name:` field in `SKILL.md` frontmatter. The three must agree, and the validator (`scripts/catalog-check.js`) enforces it.

Flat `tier{1,2}/<name>.md` files are **rejected** by the validator. The folder shape is mandatory.

### Required frontmatter

```yaml
---
name: kebab-case-name        # MUST match the folder name
description: <≤2 sentences>  # MUST contain trigger phrases — see §1.2
allowed-tools:               # least-privilege tool budget (REQUIRED)
  - Read
  - Edit
  - Bash(git status:*)
---
```

Optional (used by haac-aikit but not by Claude Code natively): `version`, `source`, `license`, `when_to_use`. These are fine to keep — they don't break anything.

### Why `allowed-tools:` is mandatory

The runtime uses this list to scope what the skill can do. Without it, every skill implicitly inherits every tool — a `writing-commits` skill could `rm -rf /` because the runtime has no scope to enforce against. Every skill must declare its minimum tool budget. Common patterns:

- **Conversational skills** (`brainstorming`, `writing-plans`): `[AskUserQuestion]` only.
- **Read-only skills** (`codebase-exploration`, `security-review`): `Read`, `Grep`, `Glob`, narrowly-scoped `Bash(...)`.
- **HTML-flow skills** (`decide`, `directions`, `roadmap`, `docs`): `Read`, `Write`, `Bash(date:*)`, `AskUserQuestion`.
- **Git skills** (`writing-commits`, `using-git-worktrees`): scoped `Bash(git ...:*)` only — never bare `Bash`.
- **Workflow skills** (`executing-plans`, `incident-response`): broader budgets including `Task` for subagent dispatch.

Prefer scoped `Bash(<command>:*)` over bare `Bash` whenever the skill only needs one or two CLI tools.

### 1.1 Description rules

- **Length:** ≤2 sentences (~300 chars max). Longer descriptions waste pre-load context and bury the trigger signal.
- **Shape:** start with what the skill does, then "Use when…" with concrete trigger conditions.
- **Triggers must include literal phrasing users actually type.** Abstract triggers ("use when context is needed") fail because they don't match user wording. Good triggers list example phrases: *"create a banner", "build the JUBLIA banner", or pastes a Figma link"*.
- **File / path triggers count too:** *"Triggers on .py files importing `from manim import *`"*.
- **If the skill should NOT auto-fire**, say so explicitly: *"Do not invoke proactively — only when the user types /docs"*.

### 1.2 Body structure

Tier1 (always-on) and tier2 (opt-in) skills in this catalog use a consistent shape inside `SKILL.md`:

```markdown
## When to use
- bullet list of trigger conditions

## Process
1. Step
2. Step
3. Step

## Anti-patterns to avoid
- ≥3 warning signs / failure modes
```

- **`SKILL.md` length:** 30–150 lines is healthy. Over 200 = bloated; extract the heavy material into `references/<topic>.md` and have the body `Read` it on demand.
- **Action-oriented:** prefer imperatives ("Run X", "Check Y") over narration.
- **Cross-reference related skills explicitly** by name. Example: *"After implementation, invoke `verification-before-completion`."*
- **≥3 anti-patterns.** They are the most valuable section — they tell the model what NOT to do, which is harder to infer than what to do.
- **Reference files** in `references/` get loaded lazily by the skill body (e.g., `spec-kit` loads `references/constitution.md` only for init/update modes). Each reference is self-contained; the body sees the description-line summary, not the full content.

### 1.3 Tiering

- **tier1** = always-on. Every skill here is paid context for every user. Be ruthless about what earns tier1 status.
- **tier2** = opt-in. Longer-tail / specialized. Can afford richer descriptions because they're not loaded by default.
- **tier3** = user-authored. Sync skips these.

---

## 2 · Agents

Agents are subagents the parent agent dispatches via the `Task` tool. They have no memory of the parent conversation — everything they need must be in their system prompt OR briefed in the dispatch message.

### Required frontmatter

```yaml
---
name: agent-name
description: <when to delegate to this agent>
model: claude-opus-4-7 | claude-sonnet-4-6 | claude-haiku-4-5
tools:
  - Read
  - Edit
  - Bash
---
```

### 2.1 Description rules

Same trigger-quality rule as skills, but oriented toward the **parent agent's** decision: *"Use when a task spans multiple concerns or could benefit from parallel execution"*, *"Use when you need a security sweep of pending changes"*.

Avoid overly abstract phrases like *"Use for tasks requiring deep server-side knowledge"* — the parent has to guess what that means. Concrete user-phrase examples help.

### 2.2 Body structure

- **2nd person voice** — the body IS the agent's system prompt: *"You are a pure dispatcher. Your role is…"*.
- **State the memory boundary explicitly:** *"You have no memory of the parent conversation — brief yourself from the files referenced in the dispatch message."*
- **State read-only vs. write-capable** so the parent picks the right agent.
- **Handoff format:** define the exact output structure the parent expects:

```
[agent-name] → [parent]
Summary: ...
Artifacts: ...
Next: ...
Status: DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED
```

### 2.3 Cross-reference integrity

If an agent dispatches **other** agents (e.g., an orchestrator), the named agents MUST exist in the catalog. Naming fictional agents in the system prompt is a P0 bug — the parent model will try to dispatch them and fail.

### 2.4 Model selection

- `claude-opus-4-7` — heaviest reasoning, slowest, most expensive. For orchestration, architecture, security audit.
- `claude-sonnet-4-6` — default for implementation, code-writing agents.
- `claude-haiku-4-5` — fastest, cheapest. For mechanical tasks (formatting, simple edits, log parsing).

Stale model IDs (`claude-3-*`, `claude-2-*`) are P0 — they fail at dispatch time.

---

## 3 · Slash commands

Slash commands are markdown files Claude Code injects as user-message content when the user types `/<command-name>`. They are NOT skills — they execute immediately and don't have YAML frontmatter.

### 3.1 Body rules

- **Terse:** ≤30 lines for most commands. They are procedures the model executes, not skill bodies.
- **Action-oriented imperatives**, numbered list when steps must run in order.
- **Use `$ARGUMENTS` for parameterized commands** (e.g., `/decide <topic>` → body references `$ARGUMENTS`).
- **Delegate to skills where one exists.** Don't duplicate skill content in commands. `/security-review` should be one line: *"Run the `security-review` skill on the current diff or specified scope."*
- **Consistent header style across the catalog.** The HTML-flow commands (`/decide`, `/directions`, `/roadmap`, `/docs`) all have a `## Usage` header. The commit-flow commands (`/commit`, `/ship`) currently don't. Pick one and apply consistently.
- **Shipping/merging gates should mention `verification-before-completion`** so the model knows to invoke it.

### 3.2 Discoverability

Slash command names are listed in the Claude Code UI by filename. Filenames should match the user's mental model: `commit-push-pr.md` is good; `cppr.md` would not be.

---

## 4 · Cross-cutting

### 4.1 Tool name accuracy

Tool names in skill / agent bodies must match Claude Code's actual tool names:

| Wrong | Right | Notes |
|---|---|---|
| `Agent` | `Task` | Subagent dispatch. |
| `Background` | `run_in_background: true` | Parameter on `Bash` or `Task`. |
| `Subagent` | `Task` | Same as above. |

### 4.2 Cross-reference integrity

Any reference by name to a skill, agent, or command must point to an artifact that exists in `catalog/`. The catalog ships:

- **Skills:** all files in `catalog/skills/tier1/` and `catalog/skills/tier2/`.
- **Agents:** `orchestrator`, `pr-describer` (tier1), `backend`, `frontend`, `mobile` (tier2).
- **Commands:** all files in `catalog/commands/`.

If you reference an artifact not in this list, either add the artifact or rewrite the reference.

### 4.3 DRY between skills and commands

When a command exists primarily to invoke a skill (e.g., `/security-review` → `security-review` skill), the command should delegate, not duplicate. Otherwise the two drift and the model gets conflicting guidance.

### 4.4 Conciseness norms (from Claude Code's own system prompt)

These apply to anything the model reads as guidance:

- "Default to writing no comments."
- "Don't narrate internal deliberation."
- "Match responses to the task."
- "End-of-turn summary: one or two sentences. What changed and what's next. Nothing else."

Skill bodies that contradict these norms (e.g., one that tells the model to write verbose docstrings) will confuse the model when other guidance pulls the opposite way.

---

## 5 · Quick checklist for new prompts

When writing a new skill, agent, or command, run through:

- [ ] (Skills) Lives in `catalog/skills/<tier>/<name>/SKILL.md` — NOT a flat `.md`
- [ ] Frontmatter `name` matches the folder/file name
- [ ] Description ≤2 sentences with literal trigger phrases
- [ ] (Skills) `allowed-tools:` declares the minimum tool budget — scoped `Bash(...)` over bare `Bash`
- [ ] `SKILL.md` body 30–150 lines (or ≤30 for commands)
- [ ] ≥3 anti-patterns (skills only)
- [ ] Heavy reference material extracted to `references/` and lazy-loaded (when SKILL.md would exceed 150 lines)
- [ ] All cross-references point to artifacts that exist
- [ ] Tool names match Claude Code's actual tools (`Task`, not `Agent`)
- [ ] Model ID is current (no `claude-3-*` or `claude-2-*`)
- [ ] If it's an agent, body states the memory boundary + read/write capability + handoff format
- [ ] If it's a command and a skill exists for the same job, it delegates rather than duplicates
- [ ] `npm run catalog:check` passes
