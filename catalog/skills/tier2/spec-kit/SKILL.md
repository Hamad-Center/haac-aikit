---
name: spec-kit
description: Spec-driven development workflow — bootstrap, update, or extend a project constitution and per-feature specs under specs/.
when_to_use: |
  Use when the user wants to write or evolve specs following the SDD (spec-driven development) pattern from the DeepLearning.AI SDD course:
  - bootstrap a new project's constitution (mission.md, tech-stack.md, roadmap.md)
  - retrofit a constitution onto an existing codebase
  - update an existing constitution as the project evolves
  - kick off a new dated feature spec (specs/YYYY-MM-DD-<name>/{requirements,plan,validation}.md)
  Trigger phrases: "create spec", "feature spec", "next phase", "start the next feature", "create a constitution", "bootstrap specs", "retrofit specs", "update the mission / tech-stack / roadmap", "/spec-kit", "/spec".
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - AskUserQuestion
  - Bash(git checkout:*)
  - Bash(git status:*)
  - Bash(git log:*)
  - Bash(git ls-files:*)
  - Bash(ls:*)
---

# Spec-Kit

Stack-agnostic implementation of the spec-driven development (SDD) workflow from the DeepLearning.AI SDD course.

## Goal

Produce one of two artifacts, depending on mode:

1. A complete **constitution** — `specs/mission.md`, `specs/tech-stack.md`, `specs/roadmap.md` — written, committed-ready, and internally consistent.
2. A complete **feature spec** — `specs/YYYY-MM-DD-<feature-name>/{requirements.md, plan.md, validation.md}` — on a fresh branch, readable top-to-bottom, with no spec section left "TBD".

In both cases: nothing is written before the 3-question interview returns answers.

## Mode dispatch

First, detect state from the repo, then pick the mode. If ambiguous, ask the user.

| State | Mode | Reference to load |
|-------|------|-------------------|
| `specs/` missing AND only scaffold code (e.g., empty `src/`) | `init-fresh` | `references/constitution.md` |
| `specs/` missing AND source code or README/TODO present | `init-retrofit` | `references/constitution.md` |
| `specs/` exists AND user wants to revise mission/tech-stack/roadmap | `update` | `references/constitution.md` |
| `specs/` exists AND user wants the next feature (default for "create spec" / "feature spec" / "next phase") | `feature` | `references/feature-spec.md` |

Quick state check (run before picking a mode):

```bash
ls specs/mission.md specs/tech-stack.md specs/roadmap.md 2>/dev/null
ls README.md TODO.md package.json 2>/dev/null
git status --short 2>/dev/null
```

Load the matching reference file with `Read` only after the mode is decided. Examples live in `references/examples/` — read them for shape inspiration when drafting, not on every invocation.

## Universal rules (every mode)

1. **Interview before writing.** Use `AskUserQuestion` with **exactly 3 grouped questions in one call** before writing any file. Buckets vary by mode (see the mode's reference). Wait for all three answers.
2. **Read before drafting.** For feature mode: read `specs/mission.md` and `specs/tech-stack.md` first. For update mode: read the file(s) being updated.
3. **No new dependencies** without explicit user approval. Respect `specs/tech-stack.md` if it exists.
4. **Phases stay small.** Each roadmap phase must be independently shippable, reviewable, and testable in one focused session.
5. **Date format.** `YYYY-MM-DD` using today's date (already in your system context — do not run `date`).
6. **Roadmap items are checkboxes.** `- [ ]` open, `- [x]` complete. Feature mode picks the first phase whose items are all `- [ ]`.
7. **Don't refactor while specifying.** A spec describes the work; it does not also fix unrelated issues.
8. **Refuse to over-spec.** If the user's three answers leave a decision genuinely open, write it as an explicit open question in the spec rather than inventing a choice.

## AskUserQuestion conventions

- All interviews go through `AskUserQuestion`. Never ask the user via plain text when a structured question fits.
- **Do not add an "Other" option manually.** The tool already gives the user a freeform input. Adding it yourself wastes a slot.
- Do not add "I'll edit it myself" / "Needs tweaking" placeholder options. Same reason — the freeform field exists.
- Each option must be 1–5 words and **mutually exclusive** with the others. If you can't name two distinct options, the question isn't ready to ask.
- Pre-select the implied option with `(Recommended)` if the user's earlier message hinted at it; the user can still override.

## Cross-cutting structure conventions

### `requirements.md` (feature spec)
Sections, in order:
1. **Scope** — what is included; field/data table if applicable.
2. **Out of Scope** — bullets, explicit non-goals.
3. **Decisions** — choices and why; one short paragraph or sub-heading per decision (draw from user's answers).
4. **Context** — tone rules, stack pointers, existing patterns to follow, links to related specs.
5. **Stakeholder Notes** — optional; only if specific stakeholders were named.

### `plan.md` (feature spec)
- Numbered **task groups** appropriate to the feature (e.g., Database → Components → Page & Route → Navigation → Tests). Generic order: data layer → domain logic → interface → integration → tests.
- Each group contains numbered sub-tasks that are concrete enough to execute without further design.
- Groups should be independently implementable so reviewers can read them in any order.

### `validation.md` (feature spec)
Sections, in order:
1. **Automated** — project's test and typecheck commands (taken from `tech-stack.md` or `package.json`), plus specific assertions/test names required.
2. **Manual** — walkthrough, behaviour, edge cases. Checklist format.
3. **Tone Check** — only if the feature has user-facing copy.
4. **Definition of Done** — one short paragraph: all checks pass, branch is clean, no leftover debug code.

### Constitution files
- `mission.md` — overview / what we do / who we serve / target audience / what success looks like.
- `tech-stack.md` — table of layer + choice + rationale; data; testing; tooling; what we're NOT using.
- `roadmap.md` — numbered phases, each with `- [ ]` checklist items; small slices only.

See `references/examples/` for trimmed exemplars of each file.

## Branching

- **Feature mode**: create a branch *before* writing files. Default name: `phase-N-<kebab-feature-name>` if the roadmap uses Phase N numbering, otherwise `feature/<kebab-feature-name>`. Use `git checkout -b <name>`.
- **Constitution modes**: stay on the current branch (usually `main`). Don't branch unless the user asks.

## What this skill does NOT do

- Does **not** implement the spec. Implementation is a separate step the user kicks off afterwards.
- Does **not** mark roadmap phases complete. That happens at merge time, by the user or a merge skill.
- Does **not** maintain `CHANGELOG.md`. Use a separate changelog skill for that.
- Does **not** create stack-specific scaffolding (`package.json`, `tsconfig.json`, etc.).
