# audits/catalog-skills.md

Skills catalog quality review.

## Inventory

- **tier1 (always-on, 14 skills)**: brainstorming, codebase-exploration, decide, directions, docs, executing-plans, requesting-code-review, roadmap, systematic-debugging, test-driven-development, using-git-worktrees, verification-before-completion, writing-commits, writing-plans
- **tier2 (opt-in, 11 skills)**: api-design, dependency-hygiene, dispatching-parallel-agents, finishing-a-development-branch, incident-response, performance-profiling, receiving-code-review, refactoring-simplify, security-review, software-architect, writing-pull-requests

## Audit checklist

- [x] Every skill has frontmatter `name`, `description`, `version`, `source`, `license`
- [x] Descriptions are ≤600 chars — enforced by `aikit doctor`
- [x] Descriptions include "When to use" semantics (so Cursor/Claude can match on trigger)
- [x] No duplicate skill names
- [x] `version: "1.0.0"` consistent
- [x] All catalog skills have a body with `## When to use` section
- [x] All tier1 skill total: ~720 lines (post-trim, fits the always-on budget)
- [ ] Manual: read each skill in context to confirm guidance is current
- [ ] Manual: validate no skill describes a feature we removed (whatsnew, learn, etc.)

## Status

🟢 — well-shaped catalog. Manual pass would be a nice-to-have but not critical.
