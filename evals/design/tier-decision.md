# /design — tier1 vs tier2 decision

**Resolution: keep `/design` as tier2 (opt-in).**

The benchmark (`evals/design/results/2026-05-16-rebuild.md`) confirms a real
**+29 pp** uplift over the freestyle baseline. That result is loud — it makes
this question worth asking.

But "valuable" is not the same as "universal," and tier1's contract is
universality, not value-when-applicable.

## The case for promoting to tier1

1. The benchmark proves the skill works.
2. Sensible defaults shape adoption — many users won't discover opt-in skills.
3. Progressive disclosure has lowered the cost of always-on items.
4. Users coming via the landing already see the feature card; promoting to
   tier1 would close the loop ("we promoted it; you should install it").

## The case for keeping tier2

1. **Not universal.** Backend services, CLI tools, data pipelines, ML
   notebooks have no visual surface to codify. `/design` for these projects
   is paid context for no return. The skill's `SKILL.md` itself states this
   in its closing section: "Not every project has a visual surface."
2. **Explicit-invocation skill.** Unlike most tier1 skills (TDD, debugging,
   brainstorming, planning), `/design` does **nothing passively**. It activates
   only when the user runs `/design` or `/design refine`. Tier2 (opt-in
   install) matches that explicit-invocation pattern; tier1 (always-on
   context) is mismatched.
3. **Token cost is real and additive.** The SKILL.md is ~8.7 KB. Multiply by
   the always-on contract: every haac-aikit user, every session, forever.
   For projects that need it, fair trade. For projects that don't, pure waste.
4. **Companion footprint matters too.** `/design` ships a slash command, a
   showroom template, and a starter `DESIGN.md`. Total ~18 KB written to the
   user's repo. Justified for visual projects; wasteful for non-visual ones.
5. **Discoverability is solid without tier1.** The landing's `/design`
   feature card with `+29 pp` is already impossible to miss; the benchmark
   section sits right below it. Adoption pressure should come from the
   evidence, not from forcing the install.

## Tradeoff summary

| | Tier1 (always-on) | Tier2 (opt-in) |
|---|---|---|
| Context cost per user | ~8.7 KB on every session | 0 KB for non-visual projects |
| Discovery surface | Implicit (always present) | Landing card + CLI list |
| Install footprint | ~18 KB in every repo | Only in repos that opt in |
| Matches "explicit invocation" pattern | No | Yes |
| Universal utility | Forced — no | Yes |

The first row is the dispositive one. Tier1's costs are paid by **all** users,
including the ones who derive zero value from the skill. The benchmark
measures uplift for users who would use `/design` — it says nothing about
whether *all* users should be charged context for it.

## The better default

Tier-promotion isn't the right axis. Smart default detection is.

**Recommendation for follow-up work:** teach `src/wizard.ts` to inspect
`package.json` and auto-suggest `/design` when it detects a frontend stack
(`react`, `vue`, `next`, `svelte`, `astro`, `solid`, `qwik`, etc.). The
wizard prompt becomes a pre-checked option for projects that fit, and an
absent option for those that don't. This makes `/design` feel like tier1
for projects that benefit, while preserving the opt-out semantic for
projects that don't.

That's a separate, bounded piece of work — not part of this decision. The
decision here is: **don't promote**. The improvement is: **detect smarter**.

## What this decision changes

Nothing in the current code or catalog. `/design` stays at
`catalog/skills/tier2/design/SKILL.md`. The landing's `/design` feature card
already correctly labels it `[opt-in]`. The benchmark and the new section
order do all the discoverability lifting that promotion would have done —
without burdening users who don't have a visual surface.

## Revisit criteria

This decision is revisitable if any of the following change:

- haac-aikit's user base shifts heavily toward frontend-first projects (>80%
  have a visual surface in their primary directory). Then "not universal"
  weakens enough to justify tier1.
- `/design` evolves to provide passive value (e.g., always-on color-blindness
  warnings, automatic palette extraction during AGENTS.md sync). Then the
  explicit-invocation argument weakens.
- Multiple users explicitly report missing `/design` because they didn't
  discover it. Then the discoverability argument weakens. Track via issues
  with the label `discovery:design`.

Until one of those is true, tier2 stands.
