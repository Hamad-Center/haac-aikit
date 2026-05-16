# 05 · Cross-cutting issues

Patterns that span multiple files in the catalog. Each issue here is independently named in the per-file docs (01–04) but is duplicated across enough files that the fix is cleaner if done as a sweep.

## 1 · Broken cross-references (P0 — affects 4 files)

References to skills, agents, or tools that don't exist in the catalog. The model treats these as load-bearing instructions and will attempt to dispatch them — silently failing or hallucinating.

| File | Line | Broken reference | What exists | Fix |
|---|---|---|---|---|
| `agents/tier1/orchestrator.md` | 28–34 | `planner`, `researcher`, `implementer`, `reviewer`, `tester`, `security-auditor`, `devops` | `backend`, `frontend`, `mobile`, `pr-describer` | Replace roster — see [03-agents.md](./03-agents.md#agentstier1orchestratormd) |
| `agents/tier1/orchestrator.md` | 5 | Tool `Agent` | Tool `Task` | Replace |
| `agents/tier1/pr-describer.md` | 3 | Agent `changelog-curator` | `writing-pull-requests` skill | Replace |
| `agents/tier2/backend.md` | 45 | Agents `reviewer`, `tester` | `orchestrator`, `user` | Replace handoff target |
| `agents/tier2/frontend.md` | 45 | Same | Same | Same |
| `agents/tier2/mobile.md` | 44 | Same | Same | Same |
| `skills/tier2/software-architect.md` | 29 | Agent `architect` | (none — inline the RFC, or add the agent) | See [02-skills-tier2.md](./02-skills-tier2.md#skillstier2software-architectmd) |
| `skills/tier2/receiving-code-review.md` | 11 | Agent `code-reviewer` | (none — refer to orchestrator) | Replace |

**Root cause:** the orchestrator's specialist list was written aspirationally before the agent catalog was finalized, and several other files copied the pattern. **Fix:** introduce a "validated agent registry" check at catalog build time (`scripts/catalog-check.js`) so the next instance gets caught in CI rather than at user dispatch time.

## 2 · Wrong tool name (P0 — affects 2 files)

Claude Code's actual subagent-dispatch tool is `Task`, not `Agent`. Files that reference `Agent` will silently fail at the model layer.

| File | Line | Wrong | Right |
|---|---|---|---|
| `agents/tier1/orchestrator.md` | 5 | `tools: Agent, Read` | `tools: Task, Read` |
| `skills/tier2/dispatching-parallel-agents.md` | 42–43 | `Use the \`Agent\` tool with \`run_in_background: true\`` | `Issue multiple \`Task\` tool calls in a single assistant message` |

Also: `run_in_background` is a `Bash` parameter, not a `Task` parameter. `Task` subagents run concurrently when multiple `Task` calls are issued in one assistant message — there is no `run_in_background` flag on `Task`. The `dispatching-parallel-agents` skill currently teaches the wrong dispatch shape.

## 3 · Description bloat (P1 — affects 11 files)

Claude Code skills load based on the YAML `description` field alone. Anything beyond 2 sentences is wasted pre-load context AND dilutes trigger signal.

| File | Current sentence count | Recommended fix |
|---|---|---|
| `skills/tier1/decide.md` | 3 | Compress to 2 — see [01-skills-tier1.md](./01-skills-tier1.md) |
| `skills/tier1/directions.md` | 3 | Compress to 2 |
| `skills/tier1/docs.md` | 4 | Compress to 2 — biggest offender |
| `skills/tier1/roadmap.md` | 3 | Compress to 2 |
| `skills/tier2/api-design.md` | 3 | Compress to 2 |
| `skills/tier2/incident-response.md` | 3 | Compress to 2 |
| `skills/tier2/performance-profiling.md` | 3 | Compress to 2 |
| `skills/tier2/receiving-code-review.md` | 3 | Compress to 2 |
| `skills/tier2/refactoring-simplify.md` | 3 | Compress to 2 |

The repeated pattern: an authoring author added a third "explicit-only" or "auto-triggers on…" sentence as policy. Move policy into the body; keep the description focused on (a) what + (b) when.

## 4 · Missing literal trigger phrases (P1 — affects ~12 files)

Many skills describe their trigger condition abstractly (*"Use when…[abstract condition]"*) without quoting the literal words users type. This hurts auto-load: the model only sees the description, and users rarely phrase requests in the abstract.

**Pattern to apply** (works for any skill):

```
Use when [condition] — phrases like "<literal phrase 1>", "<literal phrase 2>",
"<literal phrase 3>", or [optional file/path pattern]. [What the skill does, in
one sentence with an output path if applicable.]
```

Affected files (non-exhaustive): `brainstorming`, `codebase-exploration`, `executing-plans`, `requesting-code-review`, `systematic-debugging`, `test-driven-development`, `using-git-worktrees`, `verification-before-completion`, `writing-commits`, `writing-plans`, `dependency-hygiene`, `dispatching-parallel-agents`, `finishing-a-development-branch`, `performance-profiling`, `refactoring-simplify`, `security-review`, `software-architect`, `writing-pull-requests`.

Per-file rewrites are in [01-skills-tier1.md](./01-skills-tier1.md) and [02-skills-tier2.md](./02-skills-tier2.md).

## 5 · DRY violations between commands and skills (P1 — affects 4 pairs)

Several commands duplicate the body of the skill they're supposed to invoke. The two files then drift independently and the model gets conflicting guidance.

| Command | Skill | Duplicated content | Fix |
|---|---|---|---|
| `commands/security-review.md` | `skills/tier2/security-review.md` | ~30 lines of OWASP checklist | Command → 5-line shim |
| `commands/commit.md` | `skills/tier1/writing-commits.md` | Conventional Commits rules + HEREDOC pattern | Command → invoke skill |
| `commands/commit-push-pr.md` | `skills/tier2/writing-pull-requests.md` | PR title rules + body shape | Command → invoke skill |
| `commands/decide.md` `directions.md` `roadmap.md` `docs.md` | matching tier1 HTML skills | template paths + structure rules | Commands → invoke skill, drop hardcoded paths |

**Pattern:** every command whose job is "invoke skill X" should be roughly:

```markdown
Run the `<skill-name>` skill on `$ARGUMENTS` (or recent context).

[1-2 line note about command-only concerns — e.g., scope detection,
 ship-gate semantics — that are NOT in the skill body.]
```

## 6 · Missing anti-patterns sections (P1 — affects 7 skills)

Tier1/tier2 convention is `## Anti-patterns` (or `## Anti-patterns to avoid`) with ≥3 items. Several skills use custom headings or omit the section entirely.

| File | Current | Should be |
|---|---|---|
| `skills/tier1/codebase-exploration.md` | `## Constraint` (1 item) | `## Anti-patterns` (≥3) |
| `skills/tier1/executing-plans.md` | `## Do not` (3 items) | `## Anti-patterns` (≥3) |
| `skills/tier1/requesting-code-review.md` | (missing) | Add |
| `skills/tier1/test-driven-development.md` | (missing) | Add |
| `skills/tier1/verification-before-completion.md` | (missing) | Add |
| `skills/tier1/using-git-worktrees.md` | `## When NOT to use` (2 items) | `## Anti-patterns` (≥3) |
| `skills/tier2/dependency-hygiene.md` | (missing) | Add |
| `skills/tier2/dispatching-parallel-agents.md` | (missing) | Add |
| `skills/tier2/finishing-a-development-branch.md` | (missing) | Add |
| `skills/tier2/refactoring-simplify.md` | `## Rules` | `## Anti-patterns` |
| `skills/tier2/security-review.md` | (missing) | Add |
| `skills/tier2/writing-pull-requests.md` | (missing) | Add |

Per-skill suggested anti-patterns are listed in 01 / 02.

## 7 · Section heading inconsistency (P2 — affects ~8 files)

Tier1's flagship style (used by `brainstorming.md`, `executing-plans.md`, `decide.md`):

```
## When to use
## Process
1.
2.
## Anti-patterns
```

Files diverging from this:

- `codebase-exploration.md` → `## Exploration sequence` + `### 1. Orient` (sub-headings)
- `systematic-debugging.md` → `## Protocol` + `### 1. Reproduce first` (sub-headings)
- `test-driven-development.md` → `## RED` / `## GREEN` / `## REFACTOR` as parent headings
- `api-design.md` → `## Phase 1` / `## Phase 2` instead of `## Process`
- `receiving-code-review.md` → `### 1./2./3./4.` with no parent
- `writing-plans.md` → `## What not to include` instead of `## Anti-patterns`

**Fix:** unify under `## Process` + numbered list, demote phase/stage headings to `### 1./2.` inside the list when needed.

## 8 · Hardcoded language / framework assumptions (P2 — affects 5 files)

The catalog markets itself as "cross-tool, cross-language" but several skills bake in language-specific commands.

| File | Hardcoded | Generalize to |
|---|---|---|
| `skills/tier1/verification-before-completion.md` line 27 | `tsc --noEmit` | "project typechecker (e.g. tsc --noEmit, mypy, cargo check)" |
| `skills/tier2/refactoring-simplify.md` line 27 | `noUnusedLocals` | "compiler/linter dead-code detector" |
| `agents/tier2/frontend.md` line 31 | `next/image` | "framework image primitive" |
| `agents/tier2/mobile.md` line 31 | "iOS 15+, Android 10+" | "project's declared minimums in Info.plist / build.gradle" |
| `commands/commit-push-pr.md` line 16 | `npm test` | detect from package.json / Cargo.toml / pyproject.toml |
| `commands/ship.md` lines 6, 14 | `package.json`, `npm publish` | detect from project manifest |

## 9 · Co-Authored-By trailer drift (P2 — affects 2 files)

| File | Current trailer | Project convention (per recent git log) |
|---|---|---|
| `skills/tier1/writing-commits.md` line 16 | `Co-Authored-By: Claude <noreply@anthropic.com>` | `Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>` |
| `commands/commit.md` line 13 | Same | Same |

**Fix:** make the trailer model-versioned. Either generate at commit time or document as `Co-Authored-By: <model-name> <noreply@anthropic.com>` with `<model-name>` filled at invocation.

## 10 · Memory + capability disclaimers missing on agents (P1 — affects 5 files)

Every agent in the catalog (all 5) is missing one or both of:

1. **Memory boundary:** "You have NO memory of the parent conversation."
2. **Capability declaration:** "You are read-only" or "You are write-capable (Edit / Write / Bash)".

These are critical because the parent agent has to predict what the subagent will do. Without the disclaimers, the parent's heuristics about what context to pass are guesswork.

**Fix:** add a 3–4 line block at the top of every agent body. Template:

```
You are [read-only | write-capable (Edit / Write / Bash)] and have NO
memory of the parent conversation. Brief yourself from the files referenced
in the dispatch message. If the brief is missing context, return
Status: NEEDS_CONTEXT with a specific list of what you need.
```

## 11 · Missing `$ARGUMENTS` in commands (P2 — affects 6 files)

Slash commands support `$ARGUMENTS` as a placeholder for inline user input. Most commands don't use it, which forces the model to prompt for parameters that could be passed in one shot.

| Command | Missing placeholder | Suggested signature |
|---|---|---|
| `commit.md` | yes | `/commit $ARGUMENTS` (optional message override) |
| `commit-push-pr.md` | yes | `/commit-push-pr $ARGUMENTS` (optional PR title) |
| `decide.md` | implicit `<topic>` | `/decide $ARGUMENTS` |
| `directions.md` | implicit `<surface>` | `/directions $ARGUMENTS` |
| `docs.md` | implicit `[optional intent]` | `/docs $ARGUMENTS` |
| `roadmap.md` | implicit `<feature>` | `/roadmap $ARGUMENTS` |
| `security-review.md` | yes | `/security-review $ARGUMENTS` (optional scope) |
| `ship.md` | yes | `/ship $ARGUMENTS` (version tag) |

## 12 · `verification-before-completion` underused (P1 — affects 4 files)

The tier1 skill exists specifically to gate "done" claims, but several skills/commands that *should* invoke it don't:

| File | Currently | Should invoke |
|---|---|---|
| `skills/tier1/executing-plans.md` step 6 | "run the full test suite" | "invoke verification-before-completion" |
| `skills/tier1/requesting-code-review.md` | (no mention) | Add: "verify before requesting review" |
| `commands/commit-push-pr.md` | (no mention) | Step 0 gate |
| `commands/ship.md` step 1 | "run all tests" | "invoke verification-before-completion as gate" |

**Fix:** every skill/command that produces a "done" or "ready" claim should invoke `verification-before-completion` explicitly, by name.

---

## Suggested sweep order

These cross-cutting issues are easier to fix as batches than per-file:

1. **Sweep 1 (P0 cluster):** broken references (§1) + wrong tool name (§2). One PR, ~6 files. ~30 min.
2. **Sweep 2 (P1 cluster):** description rewrites (§3) + literal trigger phrases (§4). One PR, ~14 files. ~90 min.
3. **Sweep 3 (P1 cluster):** anti-patterns sections (§6) + agent disclaimers (§10) + verification-skill cross-links (§12). One PR, ~12 files. ~60 min.
4. **Sweep 4 (P1 cluster):** command/skill DRY collapse (§5) — touches commands + skills together. ~45 min.
5. **Sweep 5 (P2 polish):** heading consistency (§7), language hardcoding (§8), trailer drift (§9), `$ARGUMENTS` (§11). ~45 min.

See [06-priority-roadmap.md](./06-priority-roadmap.md) for the full ordering with effort math and dependencies.
