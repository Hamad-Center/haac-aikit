# Design: html-artifacts voice & plain-language rule

**Date:** 2026-05-13
**Skill affected:** `catalog/skills/tier1/html-artifacts.md` (v2.1.0 → v2.2.0)
**Status:** Approved (pending user review of this spec)

## Problem

The `html-artifacts` skill fills 20 reference templates with real project context. Visual structure (milestones, tables, cards, tag chips, charts) is well-received — users like it. The pain is **the prose inside that structure**.

Concrete symptom observed in a demo (frontend-performance-q3-plan): milestone descriptions like *"Optimistic insert with rollback on failure, one level of nesting only"* and *"Realtime fan-out & unread state"* mash multiple technical concepts into one sentence. A smart non-specialist trying to make a decision from the artifact has to stop and decode each term before parsing the meaning.

User intent, in their words: *"easy for me to take decision... it's too much concept... I like diagrams and all in UI but I don't like text itself"* — interpreted as: keep the visual structure, simplify the language inside it.

The bar set during brainstorming: **a smart non-specialist understands every sentence on first read, without expanding tooltips or having prior domain context.**

## Non-goals

- **Not touching templates.** All 20 templates stay byte-identical. The fix is in how the agent fills them.
- **Not removing technical terms from artifacts.** Jargon stays grep-able for AI re-readers and engineer-grade detail — it just moves from main prose into tag chips, `<code>` spans, and `<details>` blocks.
- **Not changing structure.** Section pruning (v2.1.0 Tweak 1) and density rule (v2.1.0 Tweak 2) stay as-is. This design is additive.
- **Not adding a new skill or agent.** All changes land in the existing `html-artifacts.md` skill.

## Design

### 1. New top-level section in the skill

Insert a new section titled **`## Voice & plain-language rule`** between `## Cross-cutting techniques` and `## Pattern playbook`. Placement is deliberate — top-level visibility, encountered before the playbook patterns the rule applies to.

Section content:

- **The bar (one sentence):** the default reader is a smart non-specialist taking a decision; they should understand every sentence on first read without expanding tooltips, looking up jargon, or having prior domain context.
- **Four sub-rules:**
  1. One concept per sentence — no "X with Y and Z" compounds.
  2. Plain-language verb + concrete object. Example: *"Load images only when the reader scrolls to them"* beats *"Implement lazy-loading via IntersectionObserver."*
  3. Jargon lives in tag chips, `<code>` spans, or collapsed `<details>` — never in the main reading path.
  4. Concrete first, abstract term in parens. Example: *"Make sure failed requests retry safely (idempotent)"* beats *"Idempotent retry on failure."*
- **Three side-by-side bad → good examples** (the load-bearing part of the section; planning-flavored because that's where the demo pain surfaced):

  | Bad | Good |
  |---|---|
  | "Schema & API contract — tRPC router stubs reviewed before anything else lands" | "Define the API the backend will expose. Review the contract before any UI work." |
  | "Optimistic insert with rollback on failure, one level of nesting only" | "Show the comment immediately. Roll back if the server rejects it. One level of replies — no deeper threads." |
  | "Fan-out via realtime channel, per-user read cursors track unread state" | "When a card is open, listen for new comments on it. Push updates to everyone watching." |

### 2. Enforcement hook in the scaffolding protocol

Step 5 of the scaffolding protocol (`Preserve structure verbatim`) gains one sub-bullet at the end:

> - **Apply the Voice & plain-language rule** when writing prose into the template's content nodes (`<p>`, `<h3>`, milestone bodies, risk explanations). Jargon goes in tag chips, `<code>` spans, or `<details>` — never in main prose.

This is the execution-time reminder that pairs with the top-level rule.

### 3. Failure-mode anti-pattern

Append one bullet to the existing `## Failure modes (anti-patterns)` list:

> - **Jargon-heavy main prose** — using `tRPC`, `fan-out`, `idempotent`, `IntersectionObserver` in the reading path makes the artifact unreadable for non-specialists. Plain-language verb + concrete object in prose; technical terms in tag chips and code blocks.

Mirrors the rule in negative form. Pulls double duty: warns the agent during generation, and surfaces in code review of agent-produced artifacts.

### 4. Version bump

`2.1.0` → `2.2.0`. Minor bump per semver — additive feature, no breaking changes. No description change required; existing description already says the skill "fills templates with project context," and how it fills them is what changed.

## Why this design

- **Two enforcement points (top-level section + step-5 hook) is the minimum for reliability.** The top-level section establishes the rule; the step-5 hook fires it during fill. Either alone is brittle.
- **Examples carry the rule.** Abstract "avoid jargon" guidance gets ignored under generation pressure. Three concrete bad → good pairs give the agent enough variation to extract the pattern.
- **No template changes.** v2.1.0 templates already have tag chips, code spans, and `<details>` — the rule just teaches the agent to put jargon there instead of in prose. That keeps maintenance flat.
- **Net ~20 lines added** (skill goes 166 → ~186 lines). Tier1 budget impact negligible.
- **AI-reference value preserved.** Technical terms still appear in the artifact, just in chips/code/details. AI re-readers and engineer audiences keep the rich layer; decision-makers get the scannable layer.

## Alternatives considered

- **Approach B (per-pattern voice line in each of 9 patterns)** — rejected as pre-emptive. The general rule + examples covers all patterns. If a specific pattern drifts in practice, that pattern alone gets upgraded surgically.
- **Approach C (layered prose templates with `.plain` + `<details>`)** — rejected as too invasive. Touches all 20 templates, doubles maintenance, and the designed density of templates suffers when collapsing the technical layer.
- **Style-guide companion file (`STYLE.md`)** — rejected as indirection without value. The rule is short enough to inline.

## Implementation steps (high-level — `writing-plans` will expand)

1. Edit `catalog/skills/tier1/html-artifacts.md`:
   - Bump version `2.1.0` → `2.2.0`
   - Insert `## Voice & plain-language rule` section between Cross-cutting techniques and Pattern playbook
   - Add sub-bullet to scaffolding protocol step 5
   - Append anti-pattern to Failure modes list
2. Run `npm run catalog:check` — must pass.
3. Commit as `feat(skills): plain-language voice rule in html-artifacts (v2.2.0)`.

## Verification

- **Static:** the new section is present, the step-5 sub-bullet is present, the failure mode is present, version is 2.2.0, catalog:check passes.
- **Behavioral:** in a fresh conversation, invoke `/html` on a planning task with technical content. The agent should produce milestone descriptions that pass the "smart non-specialist understands on first read" test, with jargon visible only in chips/code/details.
- **Regression check:** rerun the existing demo (`frontend-perf-q3-plan`) and compare the new fill against the existing artifact at `/tmp/aikit-html-demo/.aikit/artifacts/01-frontend-perf-q3-plan.html`. Expect plainer milestone prose; jargon migrates from sentences into the existing `.tag` chips.

## Scope check

This is a single, focused skill update. One file changes. ~20 lines net. Implementable in a single short session. No new dependencies, no new commands, no template changes.

Ready for `writing-plans` to expand into an executable step-by-step plan.
