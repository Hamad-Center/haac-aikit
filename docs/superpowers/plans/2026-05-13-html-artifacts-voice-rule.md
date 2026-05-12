# html-artifacts voice & plain-language rule Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a plain-language voice rule to the `html-artifacts` skill (v2.1.0 → v2.2.0) so that filled artifacts use scannable, jargon-free prose readable by a smart non-specialist on first read.

**Architecture:** Single-file edit. Add a new top-level "Voice & plain-language rule" section to the catalog skill (between Cross-cutting techniques and Pattern playbook), wire it into the scaffolding protocol via a step-5 sub-bullet, and add a mirroring anti-pattern to Failure modes. No template changes; no command changes.

**Tech Stack:** Markdown skill file (`catalog/skills/tier1/html-artifacts.md`); `Edit` tool for surgical changes; `npm run catalog:check` for structural validation; git for commits.

---

## Prerequisite — git state

This plan assumes the working tree already has the v2.1.0 changes to `catalog/skills/tier1/html-artifacts.md` (section pruning + density rule). Those changes are uncommitted at plan-write time.

**Before starting Task 1:** Verify `git diff catalog/skills/tier1/html-artifacts.md` shows the v2.1.0 changes. If they're already committed, fine. If they're uncommitted, the engineer should commit them as a separate prerequisite commit:

```bash
cd /Users/mersall/Desktop/HAAC/haac-aikit
git diff catalog/skills/tier1/html-artifacts.md   # confirm v2.1.0 changes present
git add catalog/skills/tier1/html-artifacts.md
git commit -m "feat(skills): section pruning + density rule in html-artifacts (v2.1.0)"
```

If `git diff` shows nothing, skip this — v2.1.0 was committed elsewhere. The Task 4 version bump (2.1.0 → 2.2.0) only works if the file is currently at 2.1.0.

---

## File Structure

| File | Change | Responsibility |
| --- | --- | --- |
| `catalog/skills/tier1/html-artifacts.md` | Modify | The only file that changes. Add one new top-level section, one sub-bullet in the scaffolding protocol, one anti-pattern in Failure modes, version bump. |

No new files. No deletions. No template changes.

---

## Task 1: Add the "Voice & plain-language rule" section

**Files:**
- Modify: `catalog/skills/tier1/html-artifacts.md` (insertion point: between "Cross-cutting techniques" section and "Pattern playbook" section)

- [ ] **Step 1: Confirm the insertion anchor exists**

Run: `grep -n "Density-adaptive rendering" /Users/mersall/Desktop/HAAC/haac-aikit/catalog/skills/tier1/html-artifacts.md`

Expected output: a single line matching the density-adaptive rendering bullet (the last bullet of Cross-cutting techniques). If the grep returns no match or multiple matches, STOP — the file structure has drifted from what this plan assumes.

- [ ] **Step 2: Insert the Voice & plain-language rule section**

Use the Edit tool with exact match. The `old_string` is the closing of the Density-adaptive rendering bullet plus the next heading; the `new_string` keeps that closing and inserts the new section between it and the next heading.

`old_string`:

```
- **Density-adaptive rendering**: when the artifact's total visible items (milestones + risks + cards + rows across all sections) is ≤ 6, drop decorations designed for dense pages — section numbers, tag chips, colored dot indicators, multi-column summary cards. These visuals were tuned for ~12-item artifacts; on sparse content they read as noise instead of hierarchy. The point of structure is signal; if there's little content, decoration buries it.

## Pattern playbook (9 patterns, aligned with the source)
```

`new_string`:

```
- **Density-adaptive rendering**: when the artifact's total visible items (milestones + risks + cards + rows across all sections) is ≤ 6, drop decorations designed for dense pages — section numbers, tag chips, colored dot indicators, multi-column summary cards. These visuals were tuned for ~12-item artifacts; on sparse content they read as noise instead of hierarchy. The point of structure is signal; if there's little content, decoration buries it.

## Voice & plain-language rule

The default reader is a smart non-specialist taking a decision. They should understand every sentence on first read without expanding tooltips, looking up jargon, or having prior domain context.

**Four sub-rules:**

1. **One concept per sentence** — no "X with Y and Z" compounds.
2. **Plain-language verb + concrete object** — "Load images only when the reader scrolls to them" beats "Implement lazy-loading via IntersectionObserver."
3. **Jargon lives in tag chips, `<code>` spans, or collapsed `<details>`** — never in the main reading path.
4. **Concrete first, abstract term in parens** — "Make sure failed requests retry safely (idempotent)" beats "Idempotent retry on failure."

**Three side-by-side examples (bad → good):**

| Bad | Good |
| --- | --- |
| "Schema & API contract — tRPC router stubs reviewed before anything else lands" | "Define the API the backend will expose. Review the contract before any UI work." |
| "Optimistic insert with rollback on failure, one level of nesting only" | "Show the comment immediately. Roll back if the server rejects it. One level of replies — no deeper threads." |
| "Fan-out via realtime channel, per-user read cursors track unread state" | "When a card is open, listen for new comments on it. Push updates to everyone watching." |

The technical details (`tRPC`, `optimistic insert`, `fan-out`) still appear in the artifact — but as tag chips beneath the prose, not in the reading path. The visible layer is decision-grade scannable; the chip layer keeps the artifact grep-able and AI-readable.

## Pattern playbook (9 patterns, aligned with the source)
```

- [ ] **Step 3: Verify the new section reads correctly**

Run: `grep -n "^## Voice & plain-language rule" /Users/mersall/Desktop/HAAC/haac-aikit/catalog/skills/tier1/html-artifacts.md`

Expected: one match, around line 41.

Run: `awk '/^## Voice & plain-language rule/,/^## Pattern playbook/' /Users/mersall/Desktop/HAAC/haac-aikit/catalog/skills/tier1/html-artifacts.md | wc -l`

Expected: ~22 lines (the section content). If far off, re-inspect.

---

## Task 2: Add the enforcement hook to scaffolding protocol step 5

**Files:**
- Modify: `catalog/skills/tier1/html-artifacts.md` (step 5 of the Scaffolding protocol, append one sub-bullet)

- [ ] **Step 1: Confirm the insertion anchor exists**

Run: `grep -n "The pattern's visual language" /Users/mersall/Desktop/HAAC/haac-aikit/catalog/skills/tier1/html-artifacts.md`

Expected: a single line — the last sub-bullet of step 5.

- [ ] **Step 2: Append the voice-rule sub-bullet**

Use the Edit tool.

`old_string`:

```
   - The pattern's visual language (severity colors, badge styles, dot indicators, monospace meta text)
```

`new_string`:

```
   - The pattern's visual language (severity colors, badge styles, dot indicators, monospace meta text)
   - **Apply the Voice & plain-language rule** when writing prose into content nodes (`<p>`, `<h3>`, milestone bodies, risk explanations). Jargon goes in tag chips, `<code>` spans, or `<details>` — never in main prose.
```

- [ ] **Step 3: Verify**

Run: `grep -A 1 "The pattern's visual language" /Users/mersall/Desktop/HAAC/haac-aikit/catalog/skills/tier1/html-artifacts.md`

Expected output:

```
   - The pattern's visual language (severity colors, badge styles, dot indicators, monospace meta text)
   - **Apply the Voice & plain-language rule** when writing prose into content nodes (`<p>`, `<h3>`, milestone bodies, risk explanations). Jargon goes in tag chips, `<code>` spans, or `<details>` — never in main prose.
```

---

## Task 3: Add the failure-mode anti-pattern

**Files:**
- Modify: `catalog/skills/tier1/html-artifacts.md` (Failure modes list, append one bullet)

- [ ] **Step 1: Confirm the insertion anchor exists**

Run: `grep -n "Missing provenance footer" /Users/mersall/Desktop/HAAC/haac-aikit/catalog/skills/tier1/html-artifacts.md`

Expected: one line — the last bullet in Failure modes.

- [ ] **Step 2: Append the anti-pattern bullet**

Use the Edit tool.

`old_string`:

```
- Missing provenance footer — "where did these numbers come from?" should always be answerable
```

`new_string`:

```
- Missing provenance footer — "where did these numbers come from?" should always be answerable
- **Jargon-heavy main prose** — using `tRPC`, `fan-out`, `idempotent`, `IntersectionObserver` in the reading path makes the artifact unreadable for non-specialists. Plain-language verb + concrete object in prose; technical terms in tag chips and code blocks.
```

- [ ] **Step 3: Verify**

Run: `grep -A 1 "Missing provenance footer" /Users/mersall/Desktop/HAAC/haac-aikit/catalog/skills/tier1/html-artifacts.md`

Expected output:

```
- Missing provenance footer — "where did these numbers come from?" should always be answerable
- **Jargon-heavy main prose** — using `tRPC`, `fan-out`, `idempotent`, `IntersectionObserver` in the reading path makes the artifact unreadable for non-specialists. Plain-language verb + concrete object in prose; technical terms in tag chips and code blocks.
```

---

## Task 4: Bump version 2.1.0 → 2.2.0

**Files:**
- Modify: `catalog/skills/tier1/html-artifacts.md` (frontmatter, line 4)

- [ ] **Step 1: Confirm current version**

Run: `grep -E "^version:" /Users/mersall/Desktop/HAAC/haac-aikit/catalog/skills/tier1/html-artifacts.md`

Expected: `version: "2.1.0"`. If it says `2.2.0` already, skip this task. If it says anything else, STOP — the prerequisite was not met.

- [ ] **Step 2: Bump version**

Use the Edit tool.

`old_string`:

```
version: "2.1.0"
```

`new_string`:

```
version: "2.2.0"
```

- [ ] **Step 3: Verify**

Run: `grep -E "^version:" /Users/mersall/Desktop/HAAC/haac-aikit/catalog/skills/tier1/html-artifacts.md`

Expected: `version: "2.2.0"`.

---

## Task 5: Validate + commit

**Files:**
- No file edits; this is the validation and commit task.

- [ ] **Step 1: Run catalog validator**

Run: `cd /Users/mersall/Desktop/HAAC/haac-aikit && npm run catalog:check`

Expected last line: `catalog-check: all checks passed`.

If it fails, read the error message — common causes are malformed YAML frontmatter (check quotes around the version value) or a missing required field. Fix and re-run.

- [ ] **Step 2: Read the full edited file to sanity-check the result**

Run: `wc -l /Users/mersall/Desktop/HAAC/haac-aikit/catalog/skills/tier1/html-artifacts.md`

Expected: ~186 lines (was 166 at v2.1.0; +20 net for v2.2.0).

Spot-check sections exist:

```bash
grep -cE "^## " /Users/mersall/Desktop/HAAC/haac-aikit/catalog/skills/tier1/html-artifacts.md
```

Expected: 11 (was 10 at v2.1.0; the new "Voice & plain-language rule" section adds one). If the count is wrong, a heading was lost.

- [ ] **Step 3: Stage and commit**

Run:

```bash
cd /Users/mersall/Desktop/HAAC/haac-aikit
git add catalog/skills/tier1/html-artifacts.md
git commit -m "$(cat <<'EOF'
feat(skills): plain-language voice rule in html-artifacts (v2.2.0)

Add a top-level "Voice & plain-language rule" section that sets the
reading bar for filled artifacts: a smart non-specialist understands
every sentence on first read, without expanding tooltips or having
prior domain context. Wire the rule into scaffolding protocol step 5
and mirror it as an anti-pattern in Failure modes.

No template changes; templates already have tag chips, code spans,
and <details> blocks where jargon now lives. Net +20 lines in the
skill (166 to ~186). Spec: docs/superpowers/specs/2026-05-13-html-artifacts-voice-rule-design.md
EOF
)"
```

- [ ] **Step 4: Verify commit landed**

Run: `git log --oneline -3`

Expected: the new `feat(skills): plain-language voice rule...` commit at the top.

---

## Self-Review

After completing all 5 tasks, run this checklist:

**1. Spec coverage:**
   - Spec §"Design" item 1 (new top-level section) → covered by Task 1.
   - Spec §"Design" item 2 (scaffolding step 5 hook) → covered by Task 2.
   - Spec §"Design" item 3 (failure-mode anti-pattern) → covered by Task 3.
   - Spec §"Design" item 4 (version bump) → covered by Task 4.
   - Spec §"Verification" (catalog:check passes) → covered by Task 5 Step 1.
   - Spec §"Verification" (static checks for section presence) → covered by Task 1 Step 3, Task 2 Step 3, Task 3 Step 3, Task 5 Step 2.

**2. Placeholder scan:** No "TBD", "TODO", "fill in", "similar to Task N", or hand-wavy guidance. Every Edit lists the exact `old_string` and `new_string`. Every verify step lists the exact command and expected output.

**3. Type consistency:** Not applicable — this is a markdown skill content change. There are no types, function names, or method signatures across tasks.

**4. Naming consistency:**
   - Section name is "Voice & plain-language rule" in every reference (frontmatter description not changed, plan tasks, step-5 hook, anti-pattern all use the same name).
   - Version is "2.2.0" consistently.
   - File path is `catalog/skills/tier1/html-artifacts.md` consistently.

**5. Order of operations:** Tasks 1-4 are commutative (any order works). Task 5 must run last. Plan is robust to running Task 4 before Tasks 1-3 if desired.

---

## Behavioral validation (optional, post-plan)

The unit-test equivalent above only validates structure. To validate the rule actually changes agent behavior, run an interactive end-to-end test:

1. In a fresh conversation, invoke `/html` with a planning intent that involves technical content (e.g., "implement caching strategy for the API").
2. Observe the milestone descriptions in the produced artifact.
3. Test: can a non-engineer (or someone outside the project) read each milestone description and understand the action being taken?
4. Inspect the tag chips — they should contain the technical terms (`Redis`, `cache-aside`, `TTL`, etc.) that the prose deliberately did NOT contain.

Compare against the existing demo at `/tmp/aikit-html-demo/.aikit/artifacts/01-frontend-perf-q3-plan.html` — milestone bodies in that artifact (generated before v2.2.0) still have jargon-in-prose. The new artifact should not.

This test is interactive and not part of the implementation plan, but it's the meaningful validation of whether the rule worked.
