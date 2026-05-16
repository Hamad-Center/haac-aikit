# 04 · Slash commands

Per-file improvement specs for all 8 slash commands under `catalog/commands/`.

Slash commands are procedures the model executes when the user types `/<name>`. They should be terse (≤30 lines), action-oriented, and **delegate to skills rather than duplicate skill content**. Where a skill exists for the same job, the command should be a thin shim.

See [00-conventions.md §3](./00-conventions.md) for the standard this audits against.

## Summary table

| File | Priority | Effort | Headline issue |
|---|---|---|---|
| commit.md | P1 | S | duplicates `writing-commits` skill content; no `$ARGUMENTS` |
| commit-push-pr.md | **P0** | M | can push broken code — no verification gate; refuses no pushes from `main` |
| decide.md | P2 | S | hardcodes template path; duplicates skill knowledge |
| directions.md | P2 | S | personality vocabulary lives in command instead of skill |
| docs.md | P2 | S | leaks `readSection(content, id, filePath)` internal API signature |
| roadmap.md | P2 | S | over 30-line budget; open-questions rule should be template-enforced |
| security-review.md | P1 | M | duplicates `security-review` skill content (DRY violation); no `$ARGUMENTS` |
| ship.md | P1 | M | npm-only assumption; missing `verification-before-completion` invocation |

**Aggregate:** 1 P0 · 3 P1 · 4 P2.

The `/commit-push-pr` flow is the highest blast-radius issue: it can push broken code from `main` without a test gate.

---

## Per-file specs

### `commands/commit.md`
**Current state:** Stages, drafts a Conventional Commits message, and commits (17 lines); terse and procedural, no header style, uses HEREDOC format correctly.

**Issues identified:**
- Line 1: mentions "writing-commits skill" but does not invoke or defer to it — duplicates content that lives in the skill.
- No `$ARGUMENTS` placeholder — user can't say `/commit "fix: foo"` to override.
- Line 4: says ≤72 chars but the project AGENTS.md and `pr-describer` use ≤70 chars (PR title rule). Technically correct (commit subjects are conventionally ≤72, PR titles ≤70) but worth a one-line note.
- No mention of `verification-before-completion` — should at minimum recommend running tests before committing for non-trivial changes.
- Co-author line `Co-Authored-By: Claude <noreply@anthropic.com>` is inconsistent with the codebase's own convention (root template + recent commits use `Claude Opus 4.7` model-versioned author).

**Improvements:**
1. **Delegate to the skill instead of duplicating.**
   - **Before:**
     ```
     Stage changed files, draft a Conventional Commits message, and commit using the writing-commits skill.
     1. Run `git status`…
     ```
   - **After:**
     ```
     Stage changed files and commit using the `writing-commits` skill.
     $ARGUMENTS may supply the commit message; otherwise draft one.

     1. Run `git status` + `git diff --staged`; confirm no secrets or `.env*`.
     2. Apply `writing-commits` skill rules (Conventional Commits, ≤72 chars,
        imperative, body explains WHY).
     3. Recommend `verification-before-completion` (`npm test`) if the
        change touches src/ or test/.
     4. Commit via HEREDOC; co-author = current model.
     5. Report commit hash + message.
     ```
2. **Add `$ARGUMENTS`** so `/commit "feat(x): y"` skips drafting.
3. **Add `## Usage` header** for consistency with HTML-flow commands — OR explicitly carve out commit-flow as a separate style.

**Priority:** P1 · **Estimated effort:** S

---

### `commands/commit-push-pr.md`
**Current state:** Commit + push + open PR end-to-end flow (22 lines); chains `/commit` then `gh pr create`; no `## Usage` header.

**Issues identified:**
- Line 5: references "writing-pull-requests skill" but doesn't load it — duplicates title/body rules inline.
- No `$ARGUMENTS` — no way to pass a PR title override.
- Line 16: hardcodes `npm test` in the test-plan checklist — projects with `pnpm` / `cargo test` / `pytest` will get incorrect boilerplate.
- Line 17: emoji + "Generated with Claude Code" footer is inconsistent with the project's AGENTS.md ("Only use emojis if the user explicitly requests it"). Worth flagging as opt-in attribution, not mandatory.
- **No `verification-before-completion` gate (P0).** A `/commit-push-pr` flow that pushes broken code is an active foot-gun. Should require tests pass before push.
- Line 8: `git push -u origin HEAD` is right, but no fallback if the branch already has an upstream (will work but emits warning).
- No mention of branch-naming convention (AGENTS.md says `type/short-description`) — if user is on `main`, this command should refuse or create a branch first.

**Improvements:**
1. **Add verification gate as step 0.** Before step 1:
   ```
   0. **Gate**: run the project's test command (detect from package.json /
      Cargo.toml / pyproject.toml). If it fails, STOP and report — do not
      commit broken code.
   ```
2. **Refuse to push from `main`.** Add: *"If `git branch --show-current` returns `main` / `master`, refuse and ask the user to create a feature branch first (`type/short-description` per AGENTS.md)."*
3. **Detect test command.**
   - **Before:** `- [ ] Full suite passes: \`npm test\``
   - **After:** `- [ ] Full suite passes: <detected test command>`
4. **Use `$ARGUMENTS` for title override** so `/commit-push-pr "feat(x): y"` works.
5. **Delegate visibly to skills.** Add a one-liner at top: *"Uses the `writing-commits` and `writing-pull-requests` skills; gated by `verification-before-completion`."*

**Priority:** P0 (can push broken code without verification gate) · **Estimated effort:** M

---

### `commands/decide.md`
**Current state:** Generates a single rich HTML decision page via the `decide` skill (24 lines); has `## Usage`, `## Steps`, `## Fallback` headers — clean HTML-flow command shape; delegates to the skill correctly.

**Issues identified:**
- Line 12: hardcodes `.aikit/templates/decide/template.html` — works in `init`ed projects but the template path is a runtime concern.
- Line 14: "Read the template" is procedural; the `decide` skill (tier1) should own that step. Command duplicates skill body.
- Line 18: filename pattern `YYYY-MM-DD-<slug>.html` is right but doesn't say what timezone — minor reproducibility issue.
- `$ARGUMENTS` is implicit via `<topic>` but never named.

**Improvements:**
1. **Use `$ARGUMENTS` explicitly.**
   - **Before:** `\`/decide <topic>\``
   - **After:** `\`/decide $ARGUMENTS\` — where \`$ARGUMENTS\` is the decision topic + options`
2. **Defer template discovery to the skill.**
   - **Before:** `Read the template at \`.aikit/templates/decide/template.html\`. Copy its structure verbatim…`
   - **After:** `Invoke the \`decide\` skill (tier1) which loads the template, design tokens, and voice rules.`
3. **Add timezone note.** Append to step 5: `(date is local-zone — use \`date +%Y-%m-%d\`)`.

**Priority:** P2 · **Estimated effort:** S

---

### `commands/directions.md`
**Current state:** Renders 2–4 visual design directions on a self-contained HTML page via the `directions` skill (29 lines); clean HTML-flow shape, good "render don't describe" rule.

**Issues identified:**
- Line 15: same template-path hardcoding as `decide.md`.
- Line 23: same date/timezone ambiguity.
- Line 5: `$ARGUMENTS` not named explicitly.
- Line 17: "one-word personality" list is great but lives in the command — should live in the `directions` skill so it stays in sync.
- Line 13: "I'll render each live on light and dark stages" — but command doesn't tell the agent to actually wire up the dark-mode toggle; assumes the template does it. Worth an explicit "template ships dark-mode tokens — do not strip them" reminder (recent commit `e76cc7a` added dark mode to all 4 templates, so this is a live concern).

**Improvements:**
1. **Use `$ARGUMENTS` explicitly** in the Usage line: `\`/directions $ARGUMENTS\` — where \`$ARGUMENTS\` is the surface to design`.
2. **Defer to the skill** for template-loading and personality vocabulary — keep the command to ≤15 lines that are unique to it (gate-before-write, slug filename, report shape).
3. **Add dark-mode preservation note.** New step: *"**Preserve dark-mode tokens.** The template ships light + dark CSS — do not strip the `:where(:root[data-theme="dark"])` rules."*

**Priority:** P2 · **Estimated effort:** S

---

### `commands/docs.md`
**Current state:** Updates project HTML docs via the marker engine + `docs` skill (27 lines); clean shape, correctly cites `readSection`/`writeSection`/`appendSection`.

**Issues identified:**
- Line 13: `readSection(content, id, filePath)` — leaks an internal TypeScript API signature into a user-facing command file. The user / agent invoking `/docs` shouldn't need to know the function signature; the `docs` skill should own this.
- Line 6: `[optional intent]` placeholder is good but not named `$ARGUMENTS`.
- Line 26: fallback path `.aikit/templates/docs/starter.html` is correct but hardcodes the location.
- No mention of who owns `docs/index.html` regeneration policy — step 5 says "update if you created a new doc or materially changed an existing one" — "materially" is vague.
- Line 17: "Propose before writing" is great; this is the strongest gate in any command and should be highlighted as the model for `decide` / `directions` / `roadmap` too.

**Improvements:**
1. **Use `$ARGUMENTS`.**
   - **Before:** `/docs [optional intent]`
   - **After:** `/docs $ARGUMENTS — intent is optional; without it, infer from recent turns`
2. **Hide the marker-API signature.**
   - **Before:** `Use \`readSection(content, id, filePath)\` from \`src/render/markers\` — never load the whole file.`
   - **After:** `Use the \`docs\` skill's section-scoped read/write helpers — never load the whole file.`
3. **Tighten the index-update rule.**
   - **Before:** `if you created a new doc or materially changed an existing one`
   - **After:** `if you changed any \`summary-<slug>\` section content or created a new \`docs/<slug>.html\` file`
4. **Promote this command's gate pattern** to the other HTML commands as a reference.

**Priority:** P2 · **Estimated effort:** S

---

### `commands/roadmap.md`
**Current state:** Generates a thorough single-page implementation roadmap via the `roadmap` skill (31 lines); richest of the HTML commands, clean shape, slightly over the ≤30-line convention.

**Issues identified:**
- Line 16: same template-path hardcoding.
- Line 26: same date/timezone ambiguity.
- Line 5: `$ARGUMENTS` not named explicitly.
- Line 21: "If you don't know a number, ask — don't invent one" — excellent rule, would benefit `decide.md` too.
- Line 23: "Every roadmap needs at least one open question" — strong, but enforcement is on the agent's honour; the `roadmap` skill template could enforce it via a required `<section id="open-questions">` block.
- Line 13: long single sentence; readability suffers.
- Line count (31) crosses the ≤30 guideline. Trimmable by deferring more to the skill.

**Improvements:**
1. **Use `$ARGUMENTS` explicitly.** Same change as the other HTML commands.
2. **Defer template structure to the skill.** Steps 2 & 4–6 (template, mockups, code-block sizing, open-questions enforcement) currently live in the command body. Collapse all four into: `Invoke the \`roadmap\` skill — it owns template loading, mockup-as-HTML rules, code-block sizing, and open-questions enforcement.`
3. **Make open-questions a template requirement** so the rule lives in one place (`catalog/templates/roadmap/template.html` ships a required `<section id="open-questions">` placeholder).
4. **Break the long confirmation sentence** into a bulleted list inside the say-back template.

**Priority:** P2 · **Estimated effort:** S

---

### `commands/security-review.md`
**Current state:** OWASP-aligned security sweep using the `security-review` skill (34 lines); structured by OWASP category (A01, A02, A03, A06, A07), clear output format.

**Issues identified:**
- Line 1: mentions "security-review skill" but doesn't actually invoke it — duplicates the skill's content inline. Command and skill will drift.
- No `$ARGUMENTS` — can't say `/security-review src/auth/` to scope.
- Line 3: "Check the recent changes (or the specified scope)" — "specified scope" implies args but they're not wired via `$ARGUMENTS`.
- OWASP categories listed are A01, A02, A03, A06, A07 — missing A04 (Insecure Design), A05 (Security Misconfiguration), A08 (Software/Data Integrity), A09 (Logging Failures), A10 (SSRF). Partial coverage is fine for a command but should note "subset of OWASP Top 10 — see the security-review skill for the full sweep".
- No mention of `verification-before-completion` — this command should be invoked as a pre-merge gate.
- Line 26 "No new dependencies without hygiene check" duplicates the `dependency-hygiene` skill (tier2).

**Improvements:**
1. **Wire `$ARGUMENTS`.**
   - **Before:** `Run an OWASP-aligned security sweep using the security-review skill.\n\nCheck the recent changes (or the specified scope)…`
   - **After:** `Run an OWASP-aligned security sweep using the \`security-review\` skill.\n\nScope: \`$ARGUMENTS\` if provided (file path / glob), otherwise the diff vs the merge base.`
2. **Defer category list to the skill.** Replace lines 5–26 with: *"Invoke the `security-review` skill — it owns the full OWASP Top 10 checklist, severity mapping, and remediation patterns. This command is the dispatch shim, not the checklist."*
3. **Add ship-gate note.** Append: *"This command is a gate for `/ship` — `/ship` runs it on changed files before tagging."*
4. **Cross-link** `dependency-hygiene` for A06 instead of duplicating the rule.

**Priority:** P1 (duplicates skill; missing `$ARGUMENTS`; partial OWASP coverage undocumented) · **Estimated effort:** M

---

### `commands/ship.md`
**Current state:** Full release checklist (tests, types, lint, security, changelog, version, tag, publish, release) (21 lines); well-ordered and concrete, clean procedural shape.

**Issues identified:**
- Line 1: "Run the full release checklist before tagging a release" — doesn't mention which skill backs it (`verification-before-completion` exists in tier1 and should be the gate).
- No `$ARGUMENTS` — can't pass `vX.Y.Z`.
- Line 6: "Version bump: update `package.json`" — assumes npm. Projects using `Cargo.toml`, `pyproject.toml`, or `go.mod` will get an incorrect step.
- Lines 10–12: `git tag -a vX.Y.Z` is right, but no signing (`-s`) option — for projects that require signed releases this will be rejected.
- Lines 14–17: `npm publish` is npm-specific same as version bump.
- No `/security-review` invocation step — line 4 says "run the `/security-review` command on changed files" which is good, but should be more explicit that a non-clean result blocks the ship.
- Line 21: "Only mark shipped when all 9 steps are complete" — checklist has 9 numbered items, good. But no `verification-before-completion` skill invocation.
- Missing post-publish smoke test (install the just-published package + run a `--version` check) — common gotcha.

**Improvements:**
1. **Invoke the verification skill upfront.** Before step 1: *"0. Invoke the `verification-before-completion` skill — it sets the gate that every numbered step below must pass."*
2. **Detect package manager.** Replace step 6: *"Version bump: update the project's manifest (`package.json` for npm, `Cargo.toml` for Cargo, `pyproject.toml` for Poetry/PDM, `go.mod` for Go modules). Commit with `chore(release): vX.Y.Z`."* Same for step 8 (publish).
3. **Add `$ARGUMENTS`.** `/ship $ARGUMENTS` — `$ARGUMENTS` is the version tag (e.g. `v1.2.3`); prompts if missing.
4. **Make security a blocker.** Step 4 becomes: *"Security sweep: `/security-review` on changed files. Any ✗ (critical) blocks the ship."*
5. **Add post-publish smoke test as step 10.** *"Smoke test: install the published artifact in a temp dir and verify `--version` matches."* Update line 21 to "all 10 steps".
6. **Note signed tags.** Append to step 7: *"Use `-s` instead of `-a` if `commit.gpgsign=true`."*

**Priority:** P1 · **Estimated effort:** M
