# Constitution Mode

The constitution is `specs/mission.md` + `specs/tech-stack.md` + `specs/roadmap.md`. It is the persistent backbone that every feature spec is judged against. Three sub-modes share most of the workflow.

## Sub-modes

| Sub-mode | When | Inputs |
|----------|------|--------|
| `init-fresh` | New repo, scaffold only, no specs/ | User answers (interview) |
| `init-retrofit` | Existing code + README/TODO, no specs/ | User answers + repo inspection |
| `update` | specs/ exists, user wants to revise | User answers + current spec files |

## Workflow (all sub-modes)

### 1. Read existing inputs

- `init-fresh`: list the working tree (`ls`, `git ls-files | head`). Confirm there's nothing more than a scaffold.
- `init-retrofit`: read `README.md`, `TODO.md`, `package.json` (or equivalent manifest: `pyproject.toml`, `go.mod`, `Cargo.toml`). Skim `src/` or equivalent to identify the actual stack in use (look at imports / dependencies).
- `update`: read the target file(s) — `specs/mission.md`, `specs/tech-stack.md`, and/or `specs/roadmap.md`.

**Success criteria:** you can name (1) the project's domain in one sentence, (2) the actual language/framework/storage choices already in use (retrofit/update) or absent (init-fresh), and (3) any stakeholder asks captured in README/TODO. If any are unclear, surface them as the first item in the next step's interview.

### 2. Interview the user — BEFORE writing or editing

Use `AskUserQuestion` with **exactly 3 grouped questions in one call**. Buckets for constitution mode:

| Header | What to ask |
|--------|-------------|
| **Mission** | Domain, problem, who it serves, what success looks like. For retrofit: "stakeholder asks not yet captured." For update: "what changed?" |
| **Tech Stack** | Language, runtime, framework, data, testing, deployment. For retrofit: "anything in use but undocumented" or "anything you'd swap." For update: "what we're adding/removing." |
| **Roadmap** | Phase ordering, MVP scope, what comes first / next / later. For retrofit: "current state vs. desired state." For update: "phases to add, combine, or split." |

Do **not** write any file until all three answers are returned.

**Success criteria:** three concrete answers in hand, each picking one of the offered options or providing freeform text. Vague answers ("the usual") count as incomplete — re-ask the relevant question.

### 3. Draft the files

Use `Write` (init-*) or `Edit` (update) tools.

#### `specs/mission.md` structure

```markdown
# Mission

<One-paragraph elevator pitch in the project's own voice>

## What We Do
<2–4 bullets or 1 short paragraph>

## Who We Serve
- <Audience 1> — what they need
- <Audience 2> — what they need

## Target Audience
<Optional — primary users / use cases / personas>

## What Success Looks Like
<Concrete outcomes, not vague aspirations>
```

#### `specs/tech-stack.md` structure

```markdown
# Tech Stack

<One-sentence summary of the architecture>

## Core
| Layer | Choice | Rationale |
|---|---|---|
| Language | <e.g. TypeScript> | <why> |
| Runtime | <e.g. Node.js> | <why> |
| Framework | <e.g. Hono> | <why> |
| ... |

## Data
<Storage, migrations, ORM (or no-ORM)>

## Testing
<Framework, location, commands>

## Tooling
<Build, dev, format, lint>

## What We Are Not Using
- No <X> — <why explicitly rejected>
```

The "What We Are Not Using" section is load-bearing: it prevents future drift back to rejected options.

#### `specs/roadmap.md` structure

```markdown
# Roadmap

Phases are intentionally small — each is a shippable slice, independently reviewable and testable.

---

## Phase 1 — <Name>
- [ ] <Sub-task>
- [ ] <Sub-task>

## Phase 2 — <Name>
- [ ] ...
```

Rules for phases:

- **Small.** If a phase needs more than ~one focused session to implement, split it.
- **Shippable.** Each phase, when complete, leaves the project in a working, demonstrable state.
- **Ordered.** Phase N+1 builds on Phase N — don't list parallel tracks here.
- **Checkbox items.** Use `- [ ]` (unchecked). Complete phases use `- [x]`.
- **Phase 1 is plumbing only.** First phase should prove the dev loop works — a "hello world" route, an empty CLI command, a passing typecheck. Don't try to deliver business value in Phase 1.

**Success criteria:** three files exist and contain no `<placeholder>` / TODO markers; each phase in `roadmap.md` has at least two `- [ ]` items; `tech-stack.md` includes a "What We Are Not Using" section; `mission.md` has a measurable "What Success Looks Like" section.

### 4. Sanity check before reporting done

- Each file is non-empty and not boilerplate.
- Roadmap phases match the tech stack (no SQLite phase if `tech-stack.md` says "no database").
- Mission's "What Success Looks Like" is measurable, not just inspirational.
- No new dependencies introduced in tech-stack.md that contradict user answers.

**Success criteria:** all four checks above pass on visual inspection. If any fail, fix before reporting done — do not hand back a half-baked constitution.

### 5. After writing

Tell the user:
- Files written/edited
- A one-line summary of each
- Suggest the next step: "When ready, run /spec-kit again to start the first feature spec for Phase 1."

Do **not** auto-commit. The user reviews and commits.

**Success criteria:** the user has a list of files touched and knows what to do next. No git commit was made by this skill.

## Update mode specifics

When the user invokes the skill to amend an existing constitution:

- **Read first.** Always Read the file before Editing.
- **Interview is still 3 questions.** Even for small updates — it forces clarification.
- **Sync siblings.** If `tech-stack.md` adds a testing framework, append it to `roadmap.md` if not yet there, and update any feature specs that mention testing. Tell the user which files you touched.
- **Don't silently rewrite.** Show diffs / summaries; never replace a section unless the user asked to.
- **Preserve completed-phase checkmarks** in roadmap.md — never reset `- [x]` to `- [ ]`.

## Retrofit mode specifics

When inferring from existing code:

- **Inspect what's actually in use** (manifest deps, imports) — not just what the README claims.
- **Flag gaps in your draft.** Anything the code uses but you can't justify, mark with `<!-- TODO: confirm rationale -->` so the user can fill it.
- **Roadmap from current state forward.** Don't backfill phases for completed work — start at "Phase 1: hardening / next feature."
- **Don't auto-create migration history** or fictional past phases. The roadmap describes the future.

## Examples

See `references/examples/mission.md`, `tech-stack.md`, `roadmap.md` for shape (trimmed from the course AgentClinic exemplars). Don't copy verbatim — the domain is different.
