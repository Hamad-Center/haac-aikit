# 03 · Agents (tier1 + tier2)

Per-file improvement specs for all 5 subagents under `catalog/agents/`.

Agents have no memory of the parent conversation — everything they need must be in their frontmatter, their system-prompt body, OR briefed in the dispatch message. The convention bar here is: state the memory boundary explicitly, declare read-only vs. write-capable, define a handoff format, and never reference subagents that don't exist.

See [00-conventions.md §2](./00-conventions.md) for the standard this audits against.

## Summary table

| File | Priority | Effort | Headline issue |
|---|---|---|---|
| tier1/orchestrator.md | **P0** | M | dispatches 7 specialist agents that don't exist + wrong tool name (`Agent` → `Task`) |
| tier1/pr-describer.md | P1 | S | references nonexistent `changelog-curator` agent |
| tier2/backend.md | P1 | S | handoff references nonexistent `reviewer` / `tester` agents |
| tier2/frontend.md | P1 | S | same handoff bug + Next.js-only framework lock-in |
| tier2/mobile.md | P1 | S | same handoff bug + impractical "test on both iOS and Android" rule |

**Aggregate:** 1 P0 · 4 P1. The orchestrator is the linchpin — it should be fixed first because it's the one referencing the most fictional artifacts.

---

## Per-file specs

### `agents/tier1/orchestrator.md`
**Current state:** Pure dispatcher agent that decomposes tasks and routes to specialists (54 lines); well-formed frontmatter with `name`, `description`, `model`, `tools`, but body references agents that don't exist in this catalog.

**Issues identified:**
- **Lines 28–34 (P0):** References 7 specialist agents — `planner`, `researcher`, `implementer`, `reviewer`, `tester`, `security-auditor`, `devops` — **none of which exist**. The only shipped agents are `orchestrator`, `pr-describer`, `backend`, `frontend`, `mobile`. Any user invoking `/orchestrator` will get a parent agent dispatching to phantom subagents, which fails silently or hallucinates.
- Lines 5–7 (P0): `tools: Agent, Read` — `Agent` is not a standard Claude Code tool name; the actual mechanism is the `Task` tool. Will be silently ignored.
- Line 36: Says "agent has no memory of this conversation" but only in the briefing step — doesn't tell the orchestrator itself that it has no memory of the parent conversation (convention #3).
- Line 47: `Status: DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED` is good, but no schema for what a NEEDS_CONTEXT response should ask for.
- Line 3: description doesn't explicitly say "Use **proactively** when…" — Claude Code convention for auto-delegation cues.
- No mention of the existing `dispatching-parallel-agents` skill (catalog/skills/tier2) which belongs here.
- Read-only vs write-capable not declared (convention #4) — should explicitly state "read-only coordinator".

**Improvements:**
1. **Replace the fictional agent roster** with the real catalog.
   - **Before:**
     ```
     - `planner` — needs an implementation plan
     - `researcher` — needs codebase or web research
     - `implementer` — needs code written
     - `reviewer` — needs a review
     - `tester` — needs tests written or run
     - `security-auditor` — needs a security sweep
     - `devops` — needs CI/CD, Docker, or deploy config
     ```
   - **After:**
     ```
     - `backend` — server-side: APIs, DB schemas, auth, queues
     - `frontend` — UI components, a11y, CSS, browser perf
     - `mobile`  — React Native / Flutter, platform-specific work
     - `pr-describer` — diff → PR title + Summary + Test plan
     (For research, planning, review, testing, security sweeps, and CI work,
      invoke the corresponding skill directly rather than dispatching — see
      codebase-exploration, writing-plans, requesting-code-review,
      test-driven-development, security-review, dependency-hygiene.)
     ```
2. **Fix the `tools` list:** change `Agent` → `Task`.
3. **Replace the description** with: `Use proactively when a task spans backend, frontend, and/or mobile concerns, or when sub-tasks can run in parallel. Pure coordinator — never writes implementation code. Delegates to the backend / frontend / mobile / pr-describer subagents and synthesises their results.`
4. **Add explicit memory + read-only disclaimer** at the top of the body:
   ```
   You are read-only and have NO memory of the parent conversation.
   The parent agent must brief you with: the user's goal, the relevant
   file paths, and any constraints. If the brief is missing context, return
   Status: NEEDS_CONTEXT with a specific list of what you need.
   ```
5. **Add a section on parallel dispatch** that points to the `dispatching-parallel-agents` skill rather than re-explaining it.
6. **Model:** `claude-sonnet-4-6` is appropriate for cost; consider `claude-opus-4-7` only if orchestration consistently needs deeper planning.

**Priority:** P0 (broken — references 5 non-existent agents and a non-existent tool) · **Estimated effort:** M

---

### `agents/tier1/pr-describer.md`
**Current state:** Tight, focused diff-to-PR-description agent (58 lines); frontmatter, body voice, handoff format, and tool list are all clean and convention-aligned.

**Issues identified:**
- Line 3: description references `changelog-curator` which does **not exist** in `catalog/agents/` — dangling cross-reference.
- Line 5: model `claude-haiku-4-5` is fine for the task and matches current convention.
- No explicit "you have no memory of the parent conversation" disclaimer (convention #3).
- Read-only vs write-capable not declared (convention #4) — only `Read` + `Bash` in tools, but the agent does write to stdout/handoff. Should say "read-only on the repo; output is the PR body only — does not run `gh pr create`".
- Line 20: default base `main` is hardcoded — should fall back to detecting `git symbolic-ref refs/remotes/origin/HEAD` to support `master` / `develop` / `trunk`.
- No mention of the `writing-pull-requests` skill (tier2) — this agent should explicitly defer formatting rules to it.
- Line 28: "Read the diff, not the commit messages" is good but the protocol also tells you to run `git log` (line 20) — slight contradiction; should say "use commits as hints, but verify against the diff".

**Improvements:**
1. **Remove the dangling reference.**
   - **Before:** `…use \`changelog-curator\` for release notes across multiple commits.`
   - **After:** `For multi-commit release notes, use the \`writing-pull-requests\` skill with explicit version scope rather than this agent.`
2. **Auto-detect base branch.** Replace step 1 body with:
   ```
   Run `BASE=$(git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@')`
   then `git diff "$BASE"...HEAD` and `git log "$BASE"..HEAD --oneline`.
   ```
3. **Add memory/scope disclaimer** at the top of the body:
   ```
   You are read-only on the repo and have NO memory of the parent
   conversation. Output is the PR title + body only — you do NOT run
   `gh pr create`. The caller does that.
   ```
4. **Cross-link the skill.** Add a "See also: `writing-pull-requests` skill for the canonical format" line near the output-format block.

**Priority:** P1 · **Estimated effort:** S

---

### `agents/tier2/backend.md`
**Current state:** Backend specialist with API/DB/auth/async expertise (49 lines); frontmatter clean, body crisp, but the handoff references non-existent agents.

**Issues identified:**
- Line 45: handoff target `[reviewer | tester | orchestrator]` — `reviewer` and `tester` agents don't exist. Only `orchestrator` does.
- Line 3: description is fine but doesn't say "Use **proactively** when the user touches `**/api/**`, `**/db/**`, `**/migrations/**`, `**/server/**` paths" — would help auto-delegation.
- No "you have no memory of the parent conversation" disclaimer (convention #3).
- Write-capable but does not declare it explicitly (convention #4). Tools include `Edit`, `Write`, `Bash` — should say so up front.
- Lines 26–32 "Constraints" are good but missing the rule that this agent must run the project's test suite before returning.
- No cross-reference to the `api-design` skill (tier2) which directly applies here.

**Improvements:**
1. **Fix handoff targets.**
   - **Before:** `[backend] → [reviewer | tester | orchestrator]`
   - **After:** `[backend] → [orchestrator | user]` and replace `Next: [review / test / migrate]` with `Next: run \`npm test\` (or repo equivalent) / apply migration / hand back to orchestrator`.
2. **Add memory + capability disclaimer** at the top of the body:
   ```
   You are write-capable (Edit / Write / Bash) and have NO memory of the
   parent conversation. Brief yourself from the file paths the caller
   provides. Before returning Status: DONE, run the project's test suite
   and report pass/fail.
   ```
3. **Replace description** with: `Backend specialist for APIs, database schemas, auth, background jobs, and service integrations. Use proactively when work touches \`**/api/**\`, \`**/server/**\`, \`**/db/**\`, \`**/migrations/**\`, or background-job code. Write-capable.`
4. **Cross-link skills** in a "See also" block: `api-design`, `dependency-hygiene`, `security-review`, `test-driven-development`.

**Priority:** P1 · **Estimated effort:** S

---

### `agents/tier2/frontend.md`
**Current state:** Frontend specialist for React/Vue/Svelte + a11y + perf (49 lines); well-structured but suffers the same handoff-to-non-existent-agents problem as backend.

**Issues identified:**
- Line 45: handoff target `[reviewer | tester | orchestrator]` — `reviewer` and `tester` don't exist.
- Line 3: description doesn't list trigger globs — would help proactive delegation. E.g. `**/components/**`, `**/app/**`, `*.tsx`, `*.vue`.
- No memory disclaimer (convention #3).
- Write-capability not declared (convention #4).
- Line 21: "React/Next.js" is hardcoded — but the agent also claims Vue/Svelte breadth in the description. Pick one stance or generalise.
- Lines 31–32: `next/image` is Next-specific; if user is on Vite/Remix/Astro this is wrong. Soften to "use the framework's image-optimisation primitive".
- No cross-reference to the `directions`, `decide`, or `docs` HTML skills (tier1) that are very relevant for UI work.

**Improvements:**
1. **Fix handoff targets** same as backend: `[frontend] → [orchestrator | user]`.
2. **Add memory + capability disclaimer** at top of body (same template as backend).
3. **Replace description** with: `Frontend specialist for component architecture, CSS, accessibility, and browser performance. Use proactively when work touches \`**/components/**\`, \`**/app/**\`, \`**/pages/**\`, \`*.tsx\`, \`*.vue\`, \`*.svelte\`, or styling files. Write-capable.`
4. **Generalise the framework lock-in.**
   - **Before:** `use \`next/image\` or equivalent`
   - **After:** `use the framework's image-optimisation primitive (\`next/image\`, \`@astrojs/image\`, \`nuxt/image\`, etc.) — never raw \`<img>\` for non-decorative content`
5. **Cross-link** the `directions` and `decide` skills for "should we even build this?" / "which way?" work.

**Priority:** P1 · **Estimated effort:** S

---

### `agents/tier2/mobile.md`
**Current state:** Mobile specialist for React Native + Flutter (48 lines); same shape as the other tier2 agents with the same convention gaps.

**Issues identified:**
- Line 44: handoff target `[reviewer | tester | orchestrator]` — same dangling references.
- Line 3: description doesn't list trigger globs (`**/ios/**`, `**/android/**`, `*.dart`, `**/App.tsx`).
- No memory disclaimer (convention #3).
- Write-capability not declared (convention #4).
- Line 28: "Test on both iOS and Android before marking done" — practically impossible inside a Claude Code session unless simulators are wired up. Should soften to "request the user run on both before sign-off" or scope to "verify build succeeds for both targets".
- Line 31: "older OS versions (iOS 15+, Android 10+)" — these baselines drift fast; pin to "the project's stated minimums (check `Info.plist` / `build.gradle`)" instead of hardcoding.

**Improvements:**
1. **Fix handoff targets:** `[mobile] → [orchestrator | user]`, replace `test on device` with `request device test`.
2. **Add memory + capability disclaimer** at top of body.
3. **Replace description** with: `Mobile specialist for React Native and Flutter. Use proactively when work touches \`**/ios/**\`, \`**/android/**\`, \`*.dart\`, \`**/App.tsx\`, \`**/expo/**\`, or platform-channel code. Write-capable.`
4. **De-hardcode OS baselines.**
   - **Before:** `(iOS 15+, Android 10+) unless told otherwise`
   - **After:** `the project's declared minimums in \`Info.plist\` / \`build.gradle\` — never assume`
5. **Soften device-test rule.**
   - **Before:** `Test on both iOS and Android before marking done`
   - **After:** `Verify the build succeeds on both targets; request the user device-test before sign-off`

**Priority:** P1 · **Estimated effort:** S
