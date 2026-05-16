# Feature Spec Mode

Create `specs/YYYY-MM-DD-<feature-name>/{requirements.md, plan.md, validation.md}` for the next slice of work.

## Preconditions

- `specs/mission.md`, `specs/tech-stack.md`, and `specs/roadmap.md` must exist. If any is missing, switch to constitution mode first.
- Working tree should be clean (or close to it). If it's dirty, ask the user whether to stash, branch from current state, or abort.

## Workflow

### 1. Find the next phase

Read `specs/roadmap.md`. The next phase is the first `## Phase N — <Name>` (or equivalent heading) section whose checklist items are **all** `- [ ]`.

If the next phase is ambiguous (multiple match, or items are mixed), confirm with the user before continuing.

Derive:
- `feature-name` — kebab-case of the phase name (e.g., "Phase 3 — Therapies Catalog" → `therapies-catalog`).
- `phase-number` — the digit after `Phase`.

**Success criteria:** you can state the exact phase number, exact feature name (kebab-case), and the list of `- [ ]` items the spec must cover. If the roadmap is empty or has no all-`[ ]` phase, stop and ask the user — do not invent a phase.

### 2. Create the branch

```
git checkout -b phase-<N>-<feature-name>
```

If the roadmap doesn't use Phase N numbering, use `feature/<feature-name>`. Do this **before** writing files so the spec lives on the branch.

**Success criteria:** `git status` shows the new branch as HEAD; working tree is clean (or only contains the user's pre-existing changes that they accepted into the branch).

### 3. Interview the user — BEFORE writing any files

Use `AskUserQuestion` with **exactly 3 grouped questions in one call**.

| Header | What to elicit |
|--------|----------------|
| **Scope** | What the feature collects, exposes, or does. Fields, behaviour, data shape. Make options concrete (e.g., "Form fields: name+message only / name+email+message / full contact details"). |
| **Decisions** | Key implementation choices: storage shape, visibility, validation strategy, UX pattern, auth, error handling. Pre-populate options from `tech-stack.md`. |
| **Context** | Tone, constraints, related work, open questions. Anything that shapes the spec without being a hard requirement. |

Rules for the interview:

- **One call**, all three questions. The course is explicit on this — grouping forces the user to think holistically.
- Each question must have 2–4 concrete options. Avoid open-ended "what do you want?" questions.
- If the user's earlier message already answered a bucket, still ask but pre-select the implied option as Recommended.
- Do **not** add an "Other" / "Needs tweaking" option manually — `AskUserQuestion` provides a freeform field automatically.
- Do **not** write any file until all three answers are returned.

**Success criteria:** three answers in hand — Scope, Decisions, Context — each specific enough to write a section from. Vague answers get re-asked.

### 4. Read guidance files

Before drafting:

```
Read specs/mission.md
Read specs/tech-stack.md
```

Also Read any related earlier spec the user references, or `specs/` siblings that establish patterns (e.g., the most recent dated spec).

**Success criteria:** you can quote (a) the project's domain tone, (b) the test/typecheck commands, (c) at least one existing pattern (component path, route file, migration file) you'll point the implementer at in the Context section.

### 5. Create the spec directory

`specs/YYYY-MM-DD-<feature-name>/` using today's date from the system context. Do not run `date`.

Write the three files. Each is a separate `Write` call.

#### `requirements.md`

```markdown
# Requirements: <Feature Name>

## Scope

<2–4 sentence summary>

### Fields / Data / Behaviour
<Table or list if the feature collects or exposes structured data>

## Out of Scope

- <Explicit non-goal 1>
- <Explicit non-goal 2>

## Decisions

### <Decision 1 — short heading>
<Why this choice; reference user's answer>

### <Decision 2>
<...>

## Context

- See `specs/mission.md` for domain context
- See `specs/tech-stack.md` for stack constraints
- Existing patterns to follow: `<file>` for <pattern>
- Open questions: <if any>

## Stakeholder Notes
<Optional — only if specific stakeholders were named>
```

Concrete examples of decision-headings: "Visibility", "Pin version X", "No client-side JS", "POST/redirect/GET". Each is one short paragraph.

#### `plan.md`

```markdown
# Plan: <Feature Name>

## Group 1 — <Name>

1. <Concrete task — verb first>
2. <...>

## Group 2 — <Name>

3. <Continue numbering across groups>
4. <...>

## Group 3 — <Name>
...
```

Rules for the plan:

- **Numbered across groups**, not restarted per group. The implementer reads top-to-bottom.
- **Concrete tasks** — "Create `src/components/Foo.tsx` with props X, Y, Z" not "Add the component."
- **Generic group order** (adapt to feature): Data/Schema → Domain Logic → Components/Views → Routes/Endpoints → Integration (nav, wiring) → Tests.
- **Verify step.** End with a small "Verify" group that runs the typecheck/test commands and one manual check.
- Each group should be reviewable in isolation.

#### `validation.md`

```markdown
# Validation: <Feature Name>

Implementation is complete and ready to merge when all of the following pass.

## Automated Tests

- [ ] `<test command from tech-stack.md>` exits 0
- [ ] `<typecheck command>` exits 0

### Specific test coverage required

- [ ] <Assertion 1 — name it like a test case>
- [ ] <Assertion 2>

## Manual Checks

- [ ] <Behaviour 1 — visible/observable>
- [ ] <Edge case 1>
- [ ] <Edge case 2>

## Tone Check
<Only include this section if the feature has user-facing copy>

- [ ] <Copy follows tone rules from requirements.md>

## Definition of Done

All automated tests pass, all manual checks confirmed, no leftover TODOs or debug code, and the branch is rebased cleanly onto `main`.
```

Rules for validation:

- Automated commands come from `tech-stack.md` (or `package.json` scripts / `Makefile`). Don't invent commands the project doesn't have.
- Specific assertions should map 1:1 with the plan — every plan item that produces observable behaviour gets a validation entry.
- Manual checks are for what the test suite can't easily catch (visual layout, redirect chains, navigation, tone).

**Success criteria:** three files exist at `specs/YYYY-MM-DD-<feature-name>/`. Every plan task has a corresponding validation entry (where applicable). No section is "TBD" or empty. The feature name, date, and phase number are consistent across all three files. Test/typecheck commands in `validation.md` are taken from the project (not invented).

### 6. After writing

Report back to the user:
- Branch created
- Files written (paths only — don't paste the bodies)
- A one-line summary
- The next step: "Ready to implement. Confirm or invoke your implementer."

Do **not** auto-commit. Do **not** start implementing.

**Success criteria:** the user sees a paths-only summary and the next-step suggestion. No git commit was made. No source files outside `specs/` were touched.

## Special cases

### MVP / multi-phase feature spec

Sometimes the user wants one spec to cover several roadmap phases (the course does this in Lesson 10). Same workflow, but:
- Feature name: `mvp` or `<theme>-mvp`.
- `requirements.md` has a `## Phases Included` section listing the roadmap phases this spec covers.
- `plan.md` groups by phase, then by sub-area within each.
- `validation.md` lists per-phase merge criteria.

### Spec that doesn't fit a roadmap phase

If the user wants a spec for something not in the roadmap (e.g., emergency hotfix), ask whether to:
1. Add it to the roadmap as a new phase first, then proceed.
2. Write the spec without roadmap linkage (rare — should be justified).

### Updating an existing feature spec

If a feature spec already exists and the user wants to amend it (e.g., "add a task group for X" — see Lesson 5 prompt 2):
- Read the current files first.
- Use `Edit` not `Write`.
- Keep numbering stable. Append new tasks at the end of the group or as a new group.
- Update sibling files for consistency (e.g., a new plan item may need a new validation assertion).

## Examples

See `references/examples/requirements.md`, `plan.md`, `validation.md` — trimmed exemplars from the course's Feedback Form feature. They are illustrative; your spec's content will be domain-specific.
