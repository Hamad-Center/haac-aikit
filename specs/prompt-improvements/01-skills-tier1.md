# 01 · Skills · tier1 (always-on)

Per-file improvement specs for all 14 always-on skills under `catalog/skills/tier1/`.

These skills are paid context for **every** user, so the bar is highest here: tight descriptions with literal trigger phrases, body 30–150 lines, ≥3 anti-patterns, and clean cross-references.

See [00-conventions.md](./00-conventions.md) for the standard this audits against.

## Summary table

| File | Priority | Effort | Headline issue |
|---|---|---|---|
| brainstorming.md | P1 | S | description lacks literal user-phrase triggers |
| codebase-exploration.md | P1 | M | no `## Anti-patterns` section; uses custom headings |
| decide.md | P1 | S | 3-sentence description; missing related-skills link |
| directions.md | P1 | M | description bloat; voice + variant rules could merge |
| docs.md | P1 | M | 4-sentence description; 131 lines pushing the bloat boundary |
| executing-plans.md | P2 | S | `## Do not` instead of `## Anti-patterns`; missing verification link |
| requesting-code-review.md | P1 | S | no anti-patterns; vague dispatch mechanism |
| roadmap.md | **P0** | S | factual error: says "six sections" then lists eight |
| systematic-debugging.md | P1 | S | uses `### 1.` sub-headings instead of flat numbered list |
| test-driven-development.md | P1 | S | no anti-patterns; missing TDD trigger phrases |
| using-git-worktrees.md | P1 | S | only 2 items in custom "When NOT to use" section |
| verification-before-completion.md | P1 | S | no anti-patterns; TypeScript-specific typechecker hardcoded |
| writing-commits.md | P1 | S | Co-Authored-By line doesn't match project convention |
| writing-plans.md | P1 | S | template says "executing unless you redirect" but rule says "confirm first" — conflict |

**Aggregate:** 1 P0 · 12 P1 · 1 P2 · most fixes <5 min.

---

## Per-file specs

### `skills/tier1/brainstorming.md`
**Current state:** 40-line skill for surfacing assumptions and presenting 2–3 approaches before coding on ambiguous requests; fits Claude Code conventions reasonably well but the description lacks literal trigger phrases.

**Issues identified:**
- Line 3: description does not embed literal user-phrase triggers like `"make this better"`, `"add auth"`, `"refactor this"` — those live in the body on line 10, but the model never sees the body pre-load.
- Line 35: section is titled `## Anti-patterns to avoid` — other tier1 skills (debugging, decide, directions, executing-plans) use just `## Anti-patterns`. Inconsistent heading.
- Lines 35–39: only 4 anti-patterns, but none warn about the highest-value failure mode: continuing past the `→ Correct me now` prompt without an actual reply.
- No explicit cross-link to `writing-plans` (the natural next step after brainstorming converges).

**Improvements:**
1. Rewrite line 3 description to embed trigger phrases verbatim:
   - **Before:** `Use when a request is ambiguous, has multiple valid approaches, or involves a product/design decision…`
   - **After:** `Use when a request is ambiguous or has multiple valid approaches — phrases like "make this better", "add auth", "refactor this", "clean this up", or any vague ask. Surfaces assumptions and presents 2-3 concrete options before writing code, so you don't burn implementation time on the wrong interpretation.`
2. Rename `## Anti-patterns to avoid` → `## Anti-patterns` for tier1 consistency.
3. Add to anti-patterns: *"Treating the `→ Correct me now` line as rhetorical and proceeding without an actual human reply"*; *"Listing assumptions but burying the recommendation under a wall of options"*.
4. Append a `## Related` line: *"After convergence, invoke `writing-plans` to turn the chosen approach into executable steps."*

**Priority:** P1 · **Estimated effort:** S

---

### `skills/tier1/codebase-exploration.md`
**Current state:** 56-line read-only reconnaissance protocol with bash recipes and an output template; well within length budget but missing the standard `## Anti-patterns` section.

**Issues identified:**
- Line 3: description leads with "Use when" but contains no literal user-phrase triggers (`"how does X work?"`, `"explain this codebase"`, `"I'm new to this repo"`).
- Lines 15–43: uses custom subsection headings (`### 1. Orient`, `### 2. Find the entry points`, …) inside a parent `## Exploration sequence` instead of the numbered list format other tier1 skills use under `## Process`.
- Lines 54–55: has `## Constraint` (singular, custom) instead of the conventional `## Anti-patterns`.
- No anti-patterns section at all — violates convention #7 (≥3 items).
- No cross-link to `systematic-debugging` or `writing-plans`.

**Improvements:**
1. Replace line 3 with: `Use when starting work in an unfamiliar codebase or module, or when the user says "how does X work?", "explain this repo", "I'm new here", or "let me understand before touching it". Read-only reconnaissance — entry points, critical path, dependencies, tests — before any edit, so you don't break code you don't understand.`
2. Rename `## Exploration sequence` → `## Process` and convert the `### 1./2./3.` headings into a numbered list, matching the brainstorming/executing-plans format.
3. Replace `## Constraint` with `## Anti-patterns` containing ≥3 items:
   - *"Editing during exploration — every fix-while-exploring discovers another unrelated 'while I'm here' edit."*
   - *"Reading source before tests — tests show intent in one screen; source forces you to infer it across many."*
   - *"Skipping the dependency map (who imports this?) — most refactor regressions come from hidden consumers."*
   - *"Spending >5 minutes on `ls`/`cat` orientation before naming the specific file you need to touch."*
4. Add a closing line: `When exploration ends in a bug, invoke systematic-debugging. When it ends in a build task, invoke writing-plans.`

**Priority:** P1 · **Estimated effort:** M

---

### `skills/tier1/decide.md`
**Current state:** 53-line HTML decision-page generator with strict structure, voice rules, and a11y baseline; opt-in, well-scoped, fits conventions strongly except heading order diverges slightly.

**Issues identified:**
- Line 3: description is 3 sentences (convention is ≤2); the third sentence is critical but bloats the description.
- Line 3: trigger phrases are buried in the body (line 11) — `/decide`, `"use the decide skill"`, `"make me a decision page on X"` should appear in the description itself.
- Lines 36–44: voice rule and a11y baseline push the body close to 60 lines without giving the model an actionable failure list early.
- Lines 46–52: 5 anti-patterns is fine, but missing the most common failure — writing prose paragraphs instead of using the option-card structure required by the template.
- No explicit link to `directions` (visual exploration) or `roadmap` (after the decision is made).

**Improvements:**
1. Compress line 3 to ≤2 sentences with embedded triggers:
   - **After:** `Use when the user types "/decide <topic>", "use the decide skill", or "make me a decision page on X" — a non-trivial choice with 2-4 viable options that needs tradeoffs visualized as one rich HTML page. Generates a self-contained file at docs/decisions/YYYY-MM-DD-<slug>.html. Opt-in: do not invoke proactively.`
2. Add anti-pattern: *"Prose paragraphs instead of option cards — if the page reads as an essay, the template wasn't followed; restart from `.aikit/templates/decide/template.html`."*
3. Add anti-pattern: *"Inventing fake tradeoffs to fill a 'cons' column — if an option genuinely has no downside on a dimension, omit the bullet rather than manufacture one."*
4. Add a `## Related` one-liner: `For visual A/B exploration use directions; for the build sequence after the decision use roadmap or writing-plans.`

**Priority:** P1 · **Estimated effort:** S

---

### `skills/tier1/directions.md`
**Current state:** 73-line opt-in HTML design-exploration generator; thorough and within length budget, but description is too long and dense for a pre-load decision signal.

**Issues identified:**
- Line 3: description is 3 sentences and 60+ words — too long. Trigger phrases are present but lost inside a long compound sentence.
- Lines 16–21 ("What this skill is for (and what it isn't)"): valuable but lives below "When to use" — the disambiguation should be the first body section so the model doesn't load this when the user wanted `/decide` or `/docs`.
- Lines 66–72: 6 anti-patterns are strong but missing a warning about variants that drift from the user's domain language (a separate failure from "lorem ipsum").
- Lines 42–48 ("Variant rules") and 50–55 ("Voice rule") are both prescriptive lists that bloat the body — could be collapsed.

**Improvements:**
1. Tighten line 3 to ≤2 sentences:
   - **After:** `Use when the user types "/directions <surface>", "show me design directions for X", or "explore visual options for the empty state / hero / dashboard card" — 2-4 rendered visual takes side-by-side on one self-contained HTML page with a light/dark toggle. Output: docs/directions/YYYY-MM-DD-<slug>.html. Opt-in only.`
2. Promote the "What this skill is for (and what it isn't)" block to immediately follow the description (before "When to use"), so the model can rule the skill out quickly when the user wanted `/decide`/`/roadmap`/`/docs`.
3. Add anti-pattern: *"Variants that drift to lorem-ipsum mid-page — every variant must use the user's domain words throughout, not just on the first card."*
4. Merge "Variant rules" + "Voice rule" headings into one `## Rules (non-negotiable)` block to cut redundant scaffolding while keeping all bullets.

**Priority:** P1 · **Estimated effort:** M

---

### `skills/tier1/docs.md`
**Current state:** 131-line HTML documentation maintenance skill with marker-engine integration, theme prompts, diagrams, and starter-template rules; comprehensive but the longest tier1 skill and pushing the bloat boundary.

**Issues identified:**
- Line 3: description is 4 sentences and ~70 words — far over the ≤2 sentence convention. Includes implementation detail (marker block names) the loading-time model doesn't need.
- Line 3: no literal user-phrase triggers (`/docs`, `"update the docs"`, `"document this"`, `"the readme is stale"`).
- 131 lines is approaching the 150-line soft cap; the diagram sub-section (lines 86–117) alone is ~30 lines and reads like a style guide.
- Lines 119–130: 10 anti-patterns — strongest in tier1, no issue here.
- No explicit cross-link back to `decide`, even though docs.md references it from the "When to use" body.
- Theme-prompt section (lines 58–70) is procedurally important but consumes 13 lines; could be compressed.

**Improvements:**
1. Rewrite line 3 to ≤2 sentences with triggers:
   - **After:** `Use when the user types "/docs", "update the docs", "document this", or when conversation just established a new feature/gotcha/architectural fact and the existing docs contradict it. Maintains an HTML doc tree at docs/ with eye-comfort palette, light/dark themes, optional inline-SVG diagrams, and surgical marker-bounded section edits.`
2. Move the diagram taxonomy (lines 86–117) into a `## Reference: diagrams` block at the bottom or extract to a sibling file referenced by relative path, so the main skill body drops below 100 lines.
3. Compress the theme prompt section (lines 58–70) into a 4-line conditional: ask once on first scaffold; default both; for light/dark-only, delete the `@media` block, `[data-theme=dark]` block, toggle button, and script.
4. Add `## Related`: `Before documenting a decision, use decide. For forward-looking implementation artifacts, use roadmap. For one-off explanations, stay in chat.`

**Priority:** P1 · **Estimated effort:** M

---

### `skills/tier1/executing-plans.md`
**Current state:** 35-line execution protocol enforcing one-step-at-a-time verification; concise and on-convention with a clear `## Do not` close that substitutes for an explicit anti-patterns heading.

**Issues identified:**
- Line 3: description lacks literal user-phrase triggers (`"execute"`, `"go ahead"`, `"implement it"`, `"ship it"`).
- Lines 31–34: section titled `## Do not` (only 3 items) instead of `## Anti-patterns` — inconsistent. Borderline on the ≥3 items rule.
- No cross-link to `verification-before-completion` or `writing-plans`.
- Line 28 ("Final verification") mentions running the full test suite but doesn't reference the dedicated `verification-before-completion` skill that exists for exactly this purpose.

**Improvements:**
1. Rewrite line 3:
   - **After:** `Use when executing an approved implementation plan — phrases like "execute", "go ahead", "implement it", "ship it", "run the plan". Enforces one-step-at-a-time with verification between each so unverified intermediate state can't compound into a broken end state.`
2. Rename `## Do not` → `## Anti-patterns` and add a 4th item: *"Marking a step done because the file changed — done means the verification (test, typecheck, or command output) confirmed the intended effect."*
3. In step 6 (line 28), add: `Then invoke verification-before-completion before reporting done.`
4. Add `## Related`: `Prerequisite: writing-plans (the plan being executed). Follow-up: verification-before-completion before reporting done.`

**Priority:** P2 · **Estimated effort:** S

---

### `skills/tier1/requesting-code-review.md`
**Current state:** 37-line skill defining how to dispatch a code-reviewer subagent with explicit context and what to do with findings; concise but missing the conventional anti-patterns section.

**Issues identified:**
- Line 3: description lacks literal user-phrase triggers (`"review this"`, `"can you review"`, `"PR review"`, `"ready for review"`).
- No `## Anti-patterns` section — violates convention #7. Lines 32–37 ("What to do with review output") functions as a half-substitute but is positive guidance, not warning signs.
- Lines 16–23: the "Review request format" code block uses `Dispatching code-reviewer with context:` — but doesn't say *how* the dispatch happens (Task tool? subagent name? slash command?). Vague for the model.
- No cross-link to `verification-before-completion` or `writing-commits`.

**Improvements:**
1. Rewrite line 3:
   - **After:** `Use when the user says "review this", "can you review", "ready for review", or after completing a feature/fix/refactor and before opening a PR. Dispatches a code-reviewer subagent with diff + intent + intentional tradeoffs so the review surfaces real issues rather than generic style nits.`
2. Add an `## Anti-patterns` section with ≥3 items:
   - *"Asking for review without naming intentional tradeoffs — the reviewer flags deliberate choices, you waste cycles defending them."*
   - *"Pasting the whole diff without a one-line 'what this change does' — the reviewer has to reverse-engineer intent."*
   - *"Marking findings 'resolved' without making the change — every resolution must point at a commit or an explicit explanation of why it's intentional."*
   - *"Requesting review on unverified code — run tests and verification-before-completion first; review is for design/quality, not 'does it compile'."*
3. In step 1 (line 27), name the dispatch mechanism: `git diff main...HEAD` and pass to a subagent named `code-reviewer` (or the `Task` tool with that subagent type).
4. Add `## Related`: `Prerequisite: verification-before-completion. Follow-up: writing-commits, then opening the PR.`

**Priority:** P1 · **Estimated effort:** S

---

### `skills/tier1/roadmap.md`
**Current state:** 72-line opt-in HTML roadmap-page generator with 8-section structure, voice rules, and a11y baseline; strong skill but description is too long AND the "Structure" section has a factual error.

**Issues identified:**
- **Line 24 (P0):** "Every page has the same **six sections**" — but lines 26–33 enumerate **eight** numbered items (Header, Summary strip, Milestones, Data flow, Mockups, Key code, Risks, Open questions). Off-by-two factual error the model will reproduce.
- Line 3: description is 3 sentences with a parenthetical aside about `writing-plans` — too long, trigger phrases lost in prose.
- Line 3 parenthetical "for AI-executable text plans use `writing-plans`" is good cross-linking but belongs in the body.
- Lines 64–71: 6 anti-patterns are strong — no issue.
- Lines 15–20 "Roadmap vs. adjacent skills" is excellent disambiguation but lives under a custom heading.

**Improvements:**
1. **Fix line 24:** change "six sections" → "eight sections" (the structure clearly wants all eight).
2. Tighten line 3 to ≤2 sentences:
   - **After:** `Use when the user types "/roadmap <feature>", "draw up a roadmap for X", or "give me a one-page implementation doc" — the approach is already settled and they want milestones + data-flow diagram + mockups + key code + risks + open questions on one committed HTML page. Output: docs/roadmaps/YYYY-MM-DD-<slug>.html. Opt-in only.`
3. Add anti-pattern: *"Skipping the data-flow diagram because 'the system is simple' — if there's no diagram, the roadmap is just a list and loses 80% of its hand-off value."*
4. Add `## Related`: `Before this, use decide (pick the approach) or directions (pick the visual). After this, use writing-plans for the AI-executable text plan, or executing-plans to start building.`

**Priority:** P0 (the "six sections" → eight mismatch is a factual error) · **Estimated effort:** S

---

### `skills/tier1/systematic-debugging.md`
**Current state:** 51-line hypothesis-driven debugging protocol with reproduce → form → test → narrow → fix → verify steps; well-structured and within length budget.

**Issues identified:**
- Line 3: description lacks literal user-phrase triggers (`"this is broken"`, `"why is X failing"`, `"bug"`, `"the test is red"`, `"it's not working"`).
- Lines 17–44: uses `### 1. Reproduce first` / `### 2. Form hypotheses` sub-headings under a `## Protocol` parent — inconsistent with brainstorming/executing-plans which use a flat numbered list under `## Process`.
- Lines 46–50: 4 anti-patterns meets minimum but missing one of the most common failures — declaring a fix without re-running the original reproduction.
- No cross-link to `test-driven-development` or `verification-before-completion`.

**Improvements:**
1. Rewrite line 3:
   - **After:** `Use when investigating a bug, test failure, error, or unexpected behaviour — phrases like "this is broken", "why is X failing", "the test is red", "it's not working", "a previous fix made it worse". Forces hypothesis-driven root-cause investigation before any code change so you stop the random-edit-and-rerun loop.`
2. Convert `### 1. Reproduce first` etc. into the flat numbered-list-under-`## Process` format used by brainstorming/executing-plans.
3. Add anti-patterns:
   - *"Declaring the fix done without re-running the original reproduction — the only proof a fix works is that the failing case stops failing."*
   - *"Forming hypotheses by skimming code first — hypotheses are cheaper to generate before code-reading biases you toward 'this looks suspicious'."*
4. Add `## Related`: `For the regression test in step 6, use test-driven-development. Before declaring done, use verification-before-completion.`

**Priority:** P1 · **Estimated effort:** S

---

### `skills/tier1/test-driven-development.md`
**Current state:** 44-line red-green-refactor enforcement skill with sub-sections for each phase; concise and clear, but anti-patterns section is missing and description doesn't trigger on common phrasing.

**Issues identified:**
- Line 3: description lacks literal user-phrase triggers (`"write a test for"`, `"TDD"`, `"add tests"`, `"test-first"`, `"red-green"`).
- No `## Anti-patterns` section — violates convention #7. Closest substitute is "Definition of done" (line 43), which is positive guidance.
- Lines 23–41: uses `## RED` / `## GREEN` / `## REFACTOR` as parent-level headings — fine, but the relationship between the loop diagram (line 17–20) and the prose sections isn't reinforced.
- No cross-link to `systematic-debugging` or `verification-before-completion`.

**Improvements:**
1. Rewrite line 3:
   - **After:** `Use when implementing new behaviour, fixing a confirmed bug, or when the user says "TDD", "test-first", "write a test for X", or "add tests". Enforces red-green-refactor: every behaviour gets a failing test first, then the minimal code to pass, then refactor — so untested code never enters the codebase.`
2. Add `## Anti-patterns`:
   - *"Writing the test after the implementation 'just to add coverage' — that's coverage theatre, not TDD; the test never verifies the test."*
   - *"Implementing more than the failing test requires — extra behaviour has no covering test by definition."*
   - *"Modifying the test to make it pass when the implementation is wrong — the test is the spec; if the spec is wrong, write a new test, don't bend the existing one."*
   - *"Skipping the 'confirm it fails for the right reason' check — a test that fails on import error gives the same green light as a real failure when you 'fix' it."*
3. Promote `## RED` / `## GREEN` / `## REFACTOR` to `### RED` etc. under `## The loop` for cleaner hierarchy.
4. Add `## Related`: `For bug fixes, pair with systematic-debugging (step 6 writes the regression test using this loop). Before reporting done, use verification-before-completion.`

**Priority:** P1 · **Estimated effort:** S

---

### `skills/tier1/using-git-worktrees.md`
**Current state:** 44-line skill on isolating work via `git worktree add`; concise and on convention but uses a custom `## When NOT to use` section instead of conventional `## Anti-patterns`.

**Issues identified:**
- Line 3: description lacks literal user-phrase triggers (`"try this in isolation"`, `"don't touch main"`, `"spin up a worktree"`, `"isolated branch"`, `"parallel branch"`).
- Lines 41–43: `## When NOT to use` is a custom heading with only 2 items — should be `## Anti-patterns` with ≥3 items.
- Lines 30–39 ("Rules"): each rule could be sharper (e.g., rule 5 reads as background info, not an actionable rule).
- No cross-link to the `EnterWorktree` / `ExitWorktree` tools that may exist in the Claude Code harness.
- No cross-link to `writing-commits` (commits-from-the-wrong-tree is a real risk this skill warns about).

**Improvements:**
1. Rewrite line 3:
   - **After:** `Use when starting a feature, experiment, or risky refactor that should be isolated — phrases like "try this in isolation", "don't touch main", "spin up a worktree", "parallel branch", or any multi-session work you might abandon. Sets up git worktrees in a sibling directory so you can switch branches without clobbering in-progress work.`
2. Convert `## When NOT to use` → `## Anti-patterns` and expand to ≥3 items:
   - *"Spinning up a worktree for a 5-minute fix — the cleanup cost exceeds the isolation benefit."*
   - *"Nesting the worktree inside the main repo (e.g. `./worktrees/feat-x`) — git allows it but most tools (eslint, vscode workspace, search) double-index and confuse paths. Always use a sibling directory."*
   - *"Forgetting `git worktree remove` after the branch merges — `git worktree list` accumulates dangling trees that confuse later sessions."*
   - *"Committing from the wrong tree because the prompt looked the same — always `git branch` first when the cwd is suspect."*
3. If `EnterWorktree`/`ExitWorktree` tools exist in the harness, add: `When the EnterWorktree tool is available, prefer it over manual git worktree add — it handles cleanup automatically.`
4. Add `## Related`: `When committing inside a worktree, follow writing-commits (the "don't commit from the wrong tree" rule is non-negotiable).`

**Priority:** P1 · **Estimated effort:** S

---

### `skills/tier1/verification-before-completion.md`
**Current state:** 46-line checklist skill ensuring claims of "done" are backed by evidence (tests, typecheck, output); concise and well-structured except for missing explicit anti-patterns section.

**Issues identified:**
- Line 3: description lacks literal user-phrase triggers (`"done"`, `"complete"`, `"finished"`, `"ready"` — these appear in body line 11 only).
- No `## Anti-patterns` section — has implicit anti-guidance via "Do not say 'this should work'" (line 46) but no structured list.
- Line 27: `tsc --noEmit` is TypeScript-specific — should generalize.
- No cross-link to `writing-commits` (the natural next step) or `requesting-code-review`.

**Improvements:**
1. Rewrite line 3:
   - **After:** `Use before saying "done", "complete", "finished", "implemented", "fixed", or "ready" — and before handing back to the user for review. Forces evidence (test output, command output, typecheck pass/fail count) instead of "I believe this works", so compiled-but-broken code can't slip through.`
2. Generalize line 27: change `tsc --noEmit passes without error` → `Project typechecker (e.g. tsc --noEmit, mypy, cargo check) passes — adapt to the project's language.`
3. Add explicit `## Anti-patterns`:
   - *"Saying 'this should work' / 'I believe this is correct' / 'looks good to me' — all three are evidence-substitutes; replace with actual output."*
   - *"Reporting 'tests pass' without naming which tests or showing the pass count — vague claims are unverifiable claims."*
   - *"Skipping verification because 'the change is small' — small changes break full suites more often than large ones precisely because they bypass scrutiny."*
   - *"Marking done while a test is still red and 'unrelated' — unrelated failures often aren't."*
4. Add `## Related`: `After verification passes, use writing-commits then requesting-code-review.`

**Priority:** P1 · **Estimated effort:** S

---

### `skills/tier1/writing-commits.md`
**Current state:** 53-line skill enforcing Conventional Commits, HEREDOC commit creation, and safety rules; concise but missing the conventional anti-patterns heading and lacking trigger phrases in the description.

**Issues identified:**
- Line 3: description lacks literal user-phrase triggers (`"commit this"`, `"git commit"`, `"ship a commit"`, `"let's commit"`).
- Line 3 ends with "Never use --no-verify or --amend on published commits" — safety rule, not a description; bloats sentence count.
- Lines 47–52: `## Safety rules` is custom; the rest of tier1 would call this `## Anti-patterns`. 3 items, each phrased as a "Never" rule rather than warning signs.
- Line 16: `Co-Authored-By: Claude <noreply@anthropic.com>` — the project's actual commit convention (per system prompt git instructions) is `Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>`. Inconsistent.
- No mention of "only commit when explicitly asked" — a Claude Code core rule.
- No cross-link to `verification-before-completion` (run first) or `requesting-code-review` (after).

**Improvements:**
1. Rewrite line 3:
   - **After:** `Use when the user explicitly asks to commit — phrases like "commit this", "git commit", "ship a commit", "let's commit", "make a commit". Enforces Conventional Commits format, blocks committing secrets or debug artifacts, and uses HEREDOC so multiline bodies survive shell quoting. Never commit without an explicit ask.`
2. Convert `## Safety rules` → `## Anti-patterns` and rephrase as warning signs:
   - *"Using `git commit --amend` on a commit that has been pushed — rewrites history others may have pulled."*
   - *"Using `--no-verify` to bypass a failing hook — the hook is failing for a reason; fix the underlying issue, re-stage, NEW commit."*
   - *"Force-pushing to `main`/`master`/`develop` — never. To any shared branch — only with explicit user opt-in."*
   - *"Staging with `git add .` or `git add -A` when secrets might be untracked — add specific files by name."*
   - *"Committing because the task feels done — only commit when the user explicitly asks."*
3. Update example Co-Authored-By trailer to match project convention: verify with `git log -3 --format=%B` and align.
4. Add `## Related`: `Run verification-before-completion before staging. After the commit, follow with requesting-code-review or open a PR.`

**Priority:** P1 · **Estimated effort:** S

---

### `skills/tier1/writing-plans.md`
**Current state:** 43-line skill that converts an approved approach into a sequenced step-by-step plan a second agent could execute; concise and on-convention but missing anti-patterns and has an internal conflict.

**Issues identified:**
- Line 3: description lacks literal user-phrase triggers (`"plan this"`, `"let's plan"`, `"make a plan"`, `"/plan"`, `"plan mode"`).
- Lines 36–39: `## What not to include` is a custom heading covering only 3 items — should be `## Anti-patterns`. Items are about plan *content*, not behaviour failures.
- No anti-patterns about behavioural failures: skipping the "present before executing" gate, padding a 2-step task into 8 fake steps, etc.
- No cross-link to `brainstorming` (prerequisite when approach isn't chosen) or `executing-plans` (sequel).
- **Conflict between line 22 and line 42:** PLAN template ends with `→ Executing unless you redirect.` (opt-out) but line 42 says "Confirm they approve before taking any action." (opt-in). The model gets contradictory guidance.

**Improvements:**
1. Rewrite line 3:
   - **After:** `Use when the user says "plan this", "let's plan", "make a plan", "/plan", or before entering plan mode on any multi-step task. Turns an approved approach into a numbered, atomic, verifiable sequence a second agent could execute without further clarification.`
2. **Resolve the opt-in/opt-out conflict.** Recommend opt-in (safer default): change template line 22 to `→ Confirm or redirect before I start.` Align line 42 with it.
3. Rename `## What not to include` → `## Anti-patterns` and add behavioural items:
   - *"Plans with more than 10 steps — split into phases; nobody verifies step 11 with the same rigor as step 1."*
   - *"Padding a 2-step task into 8 fake steps to look thorough — the user counts steps and trusts them."*
   - *"Executing before the user confirms — the gate exists because plans get redirected ~30% of the time."*
   - (keep existing) *"Vague steps like 'refactor the auth module' — decompose until atomic."*
   - (keep existing) *"Steps that say 'figure out how X works' — that's exploration (use codebase-exploration), not a plan step."*
4. Add `## Related`: `When the approach isn't chosen yet, use brainstorming first. When the plan is approved, use executing-plans.`

**Priority:** P1 · **Estimated effort:** S
