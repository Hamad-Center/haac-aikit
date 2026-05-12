# Design: html-artifacts accessibility + decision-callout rules

**Date:** 2026-05-13
**Skill affected:** `catalog/skills/tier1/html-artifacts.md` (v2.2.0 → v2.3.0)
**Status:** Approved (design content reviewed and accepted in chat before this spec was written)

## Problem

After v2.2.0 (voice & plain-language rule), online research surfaced two gaps in the `html-artifacts` skill that complement the existing decision-grade UX goal:

1. **Accessibility (a11y)** — multiple 2026 sources flag AI-generated HTML as routinely missing ARIA labels, alt text on diagrams, landmark roles, and proper heading hierarchy. Decision documents read by people on phones, screen readers, or in high-contrast mode get an inferior experience or are unusable. The skill says "semantic HTML" but doesn't enumerate the specific a11y rules that need to be enforced.

2. **Decision callout** — the v2.2.0 voice rule made every sentence scannable, but didn't address artifact-level scannability. Current planning artifacts bury the call-to-action ("what should I approve?") inside the Milestones or Risks sections. Decision-makers shouldn't have to scroll to find what they're being asked to decide.

Both gaps complement the v2.2.0 philosophy: optimize for the actual human reader, not the writer or the template designer.

## Non-goals

- **Not touching templates.** All 20 templates stay byte-identical. v2.0.0 templates already have `<details>`, native form controls, design tokens that meet WCAG AA contrast — the rules teach the agent to use these affordances correctly, not to add new structural elements.
- **Not adding print styles, dark mode, markdown sidecar, or security hygiene callouts.** These were Tier 2 / Tier 3 in the brainstorm and are skipped to avoid tier1 budget bloat. Revisit only if usage shows demand.
- **Not changing 8 of 9 patterns' Must-haves.** Decision callout is added to Exploration & Planning only (the pattern where decisions live); the cross-cutting bullet handles the universal principle for other patterns.

## Design

### 1. New top-level section: `## Accessibility (a11y)`

Inserted between `## Cross-cutting techniques` and `## Voice & plain-language rule`. Placement pairs it with the Voice rule — both are "make the artifact work for the actual reader, not just a desktop browser."

Six hard rules:
1. **Landmark roles** — `<main>`, `<nav>`, `<article>`, `<aside>` for top-level structure. Screen readers use these to navigate.
2. **Alt text on every diagram and icon** — inline `<svg>` gets `<title>` + `aria-labelledby` or `aria-label`; `<img>` gets `alt="..."`. Decorative-only icons get `aria-hidden="true"`.
3. **Heading hierarchy never skips levels** — `<h1>` → `<h2>` → `<h3>`. Exactly one `<h1>` per artifact (the title).
4. **Native form controls only** — `<input>` paired with `<label for="...">`, `<button>` for buttons, native `<select>`. No div-button hacks.
5. **Color contrast ≥ 4.5:1 for body text, ≥ 3:1 for large text** — design tokens already meet WCAG AA; don't override per-artifact in ways that break the ratio.
6. **Keyboard focus visible** — never `outline: none` without a `:focus-visible` replacement that meets contrast.

### 2. New bullet in Cross-cutting techniques: Decision callout

> **Decision callout first**: any artifact that asks the user to decide something starts with a "Decision needed" block at the top — the call-to-action in one sentence, options in chips (`A —` / `B —`), the recommendation marked. Don't make decision-makers scroll to find what to approve.

### 3. Pattern playbook update — Exploration & Planning Must-haves

Update the existing "Must-haves" line to add the Decision needed block as a concrete requirement for planning artifacts. Adds the specific implementation (clay-bordered card with `A —` / `B —` chips and a recommendation marker).

### 4. Two new failure-mode anti-patterns

- **Decision buried below the fold** — artifact asks the user to approve but the call-to-action lives in Milestones or Risks, not at the top.
- **Missing alt text / aria-label on SVG and `<img>`** — diagrams and charts invisible to screen readers and indexing.

### 5. Version bump

`2.2.0` → `2.3.0`. Minor bump per semver; additive feature, no breaking changes. Description left unchanged.

## Why this design

- **Six a11y rules cover the 2026-common AI-HTML failures**: ARIA on interactive elements, alt text on visuals, landmark structure, semantic heading hierarchy, form labels, color contrast, keyboard focus. These are the categories the WebAIM and accessibility-research sources consistently flag as missed in LLM-generated HTML.
- **Decision callout splits cross-cutting + pattern-specific deliberately**: the *principle* is universal (every artifact that needs a decision should start with one), but the *concrete shape* (clay-bordered card, chip-style options, recommendation mark) is specific to planning artifacts. Embedding the shape in 9 patterns would be generic stuffing; one universal bullet + one pattern-specific implementation is the right grain.
- **Top-level section placement for a11y**: a11y is a category of rules, not a single technique. A category buried as one bullet in the 17-item Cross-cutting techniques list would get lost. Top-level gives it the heading + index entry it earns.
- **Net ~25 lines added** (skill goes 189 → ~214). Still within tier1 budget.

## Alternatives considered

- **A11y as Cross-cutting bullets instead of a top-level section** — rejected. Six rules can't be one bullet, and breaking into six bullets buries them in a long list.
- **Decision callout in all 9 patterns** — rejected as generic stuffing. Only planning artifacts have explicit decisions in the artifact body; reports, prototypes, code reviews have different "decisions" embedded elsewhere.
- **Adding print styles, dark mode** — Tier 2 in the brainstorm; deferred to a future v2.4.0 if demand surfaces.
- **Adding markdown sidecar / security hygiene callouts** — Tier 3; skipped (low value-to-cost ratio, already partially covered).

## Implementation steps (high-level — execution will expand)

1. Edit `catalog/skills/tier1/html-artifacts.md`:
   - Insert `## Accessibility (a11y)` section between Cross-cutting and Voice rule
   - Add "Decision callout first" bullet to Cross-cutting techniques
   - Update Exploration & Planning Must-haves
   - Append two new failure-mode anti-patterns
   - Bump version `2.2.0` → `2.3.0`
2. Run `npm run catalog:check` — must pass.
3. Commit as `feat(skills): a11y + decision-callout rules in html-artifacts (v2.3.0)`.

## Verification

- **Static:** new section exists, new bullets are present, failure modes are present, version is 2.3.0, catalog:check passes.
- **Behavioral:** in a fresh conversation, invoke `/html` on a planning intent. Expect: artifact opens with a "Decision needed" card, every inline `<svg>` has an `aria-label`, top-level structure uses `<main>` and `<article>`.
- **Regression:** the v2.2.0 voice rule still applies. The v2.1.0 section pruning + density rules still apply. The a11y/decision rules layer on top, they don't replace anything.

## Scope check

Single skill file. ~25 lines net. One commit. No package version change (per prior decision: ship catalog updates via `aikit sync`, not via a new npm release until later).

Ready for execution.
