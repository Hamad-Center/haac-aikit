# 02 · Skills · tier2 (opt-in)

Per-file improvement specs for all 11 opt-in skills under `catalog/skills/tier2/`.

Tier2 skills are loaded on demand, so descriptions can carry longer-tail / more specialized triggers than tier1. The bar on cross-reference integrity, tool-name accuracy, and DRY with commands is the same as tier1.

See [00-conventions.md](./00-conventions.md) for the standard this audits against.

## Summary table

| File | Priority | Effort | Headline issue |
|---|---|---|---|
| api-design.md | P2 | S | 3-sentence description; uses `## Phase 1/2` instead of `## Process` |
| dependency-hygiene.md | P1 | S | recommends `cost-of-modules` (abandoned since 2017) |
| dispatching-parallel-agents.md | **P0** | S | wrong tool name (`Agent` → `Task`); wrong `run_in_background` placement |
| finishing-a-development-branch.md | P2 | S | destructive `git branch -d` without pre-merge guard |
| incident-response.md | P2 | S | 3-sentence description; otherwise solid |
| performance-profiling.md | P1 | M | trigger phrases live in body — model can't see them pre-load |
| receiving-code-review.md | P1 | S | references `code-reviewer` agent that doesn't exist |
| refactoring-simplify.md | P2 | S | 3-sentence description; no disambiguation vs. global `simplify` skill |
| security-review.md | P1 | M | duplicates content with `/security-review` command — DRY violation |
| software-architect.md | **P0** | M | dispatches `architect` agent that doesn't exist |
| writing-pull-requests.md | P2 | S | hardcoded `🤖 Generated with Claude Code` footer; `gh pr list` lacks `--state open` |

**Aggregate:** 2 P0 · 4 P1 · 5 P2.

---

## Per-file specs

### `skills/tier2/api-design.md`
**Current state:** Two-phase REST/GraphQL/Events API design protocol (65 lines) — mostly conforms to tier1 structure but description is overlong and uses non-standard headings.

**Issues identified:**
- Line 3: 3 sentences, exceeds the 2-sentence cap; embeds duplicate trigger phrases that repeat in the body (line 11).
- Line 13: cross-reference to `software-architect` skill is valid but soft; should point at the artifact path the architect produces (`docs/decisions/...`).
- No `## Process` section header — uses `## Phase 1` / `## Phase 2` instead. Inconsistent with tier1 convention.
- Lines 19–44: three large `□`-prefixed checklist blocks inside fenced code — readable but heavier than the tier1 norm of markdown bullets.

**Improvements:**
1. Rewrite description to 2 sentences:
   - **Before:** `Use when designing a new REST, GraphQL, or event/webhook API. Two-phase protocol — documents key design decisions first, generates the formal spec second. Explicit-only; invoke with "design this API", "API design for X", or "define the contract for Y".`
   - **After:** `Use when the user says "design this API", "API design for X", "define the contract for Y", or is introducing a new REST / GraphQL / webhook surface. Documents key design decisions in docs/api/<topic>-design.md first, then generates the formal OpenAPI/GraphQL/AsyncAPI spec.`
2. Rename `## Phase 1 — Decisions Doc` / `## Phase 2 — Formal Spec` to a single `## Process` with numbered steps `1. Decisions doc`, `2. Formal spec`.
3. Add a Phase 0 cross-reference line in Process: *"If the feature also introduces new services or cross-module data flow, run `software-architect` first and link its RFC."*

**Priority:** P2 · **Estimated effort:** S

---

### `skills/tier2/dependency-hygiene.md`
**Current state:** Pre-install checklist for new packages (53 lines) covering coverage / cost / license / maintenance — well-sized but missing standard `## Anti-patterns` section and recommends an abandoned tool.

**Issues identified:**
- Line 3: starts with abstract `"Use before installing any new package"` — should name literal commands/phrases users type.
- No `## Anti-patterns to avoid` section — inconsistent with tier1 and sibling tier2 skills.
- **Line 26 (P1):** `npx cost-of-modules <package>` — `cost-of-modules` is unmaintained (last release ~2017). Recommending an abandoned tool in a hygiene skill is ironic. Replace with `bundlephobia` or `npm ls --depth=0` size inspection.
- Lines 17–21: grep example `grep -r "require\|import" src/ | grep -i "<keyword>"` misses ESM `from "..."` patterns; use ripgrep with a multi-pattern.
- No cross-reference to `security-review` even though `security-review` line 39 explicitly defers supply-chain checks to this skill.

**Improvements:**
1. Replace description: `Use when the user runs npm install / pip install / go get / cargo add, says "we need a library for X", or asks "can we drop this dep?". Evaluates coverage by existing deps, license, bundle cost, and maintenance health before any install.`
2. Replace `npx cost-of-modules <package>` with `npx bundle-phobia-cli <package>` (or just `# bundlephobia.com/package/<name>`).
3. Add `## Anti-patterns to avoid`: installing because "everyone uses it"; adding deps to avoid 20 lines of code; skipping the license check on GPL/AGPL packages; ignoring `npm audit` failures.
4. Add a `See also: security-review (supply-chain section A06)` line at the bottom — closes the round-trip reference.

**Priority:** P1 · **Estimated effort:** S

---

### `skills/tier2/dispatching-parallel-agents.md`
**Current state:** Fan-out protocol for parallel subagent dispatch (43 lines) — concise but contains a wrong tool name that will silently fail.

**Issues identified:**
- **Line 43 (P0):** `Use the \`Agent\` tool with \`run_in_background: true\` for genuinely parallel tasks.` Claude Code's subagent dispatch tool is `Task`, not `Agent`. A model following this will hallucinate a nonexistent tool.
- **Line 43 also:** `run_in_background: true` is a `Bash` parameter, not a `Task` parameter. Task subagents run concurrently when multiple Task calls are issued in one assistant message — there is no `run_in_background` flag on Task.
- Line 3: leads with conditional `"Use when a task can be decomposed…"` rather than literal user phrases. Triggers users actually type (`"research these 4 files in parallel"`, `"fan out"`, `"do this for each service"`) are absent.
- No `## Anti-patterns` section.
- Section header `## Tool` (line 41) is unusual — convert to inline guidance under Process.

**Improvements:**
1. **Fix the tool reference (P0).** Replace lines 41–43 with:
   - **Before:** `Use the \`Agent\` tool with \`run_in_background: true\` for genuinely parallel tasks. Send multiple tool calls in a single message.`
   - **After:** `Issue multiple \`Task\` tool calls in a single assistant message — they execute concurrently. Do not use \`run_in_background\` (that's a \`Bash\` flag; \`Task\` has no equivalent). Each Task brief is self-contained — the subagent has no memory of this conversation.`
2. Rewrite description: `Use when fanning out independent work across files, services, or sources — phrases like "research these in parallel", "do this for each", "fan out". Dispatches multiple Task subagents in one message, then synthesises their returns; only safe for read-only / report-producing sub-tasks.`
3. Add `## Anti-patterns to avoid`: parallelising writes; passing shared state via filesystem; not synthesising conflicts; dispatching when sequential context-sharing would be faster.

**Priority:** P0 (broken tool name — model will fail to dispatch) · **Estimated effort:** S

---

### `skills/tier2/finishing-a-development-branch.md`
**Current state:** Merge/PR/cleanup decision tree (49 lines) — concise and operational, missing the standard `## Anti-patterns` section.

**Issues identified:**
- Line 3: leads with `"Use when a feature or fix is complete and needs to be merged"` — lacks literal trigger phrases the body supplies on lines 9–11 (`"I think this is ready to merge"`, `"How do I finish this branch?"`).
- Line 12: references `verification-before-completion` — verified to exist in tier1. ✓
- Line 34: references `writing-pull-requests` skill — verified to exist in tier2. ✓
- Line 41: `git branch -d feature/my-feature` then immediately `git push origin --delete feature/my-feature` — destructive ops without a merge-state guard.
- No `## Anti-patterns` section.

**Improvements:**
1. Update description with literal triggers: `Use when the user says "I think this is ready to merge", "how do I finish this branch?", "ship this", or after verification-before-completion confirms correctness. Walks the rebase / clean-diff / PR / post-merge-cleanup decision tree so branches land without surprises.`
2. Add a pre-delete guard on lines 41–42:
   - **Before:** `git branch -d feature/my-feature        # local cleanup`
   - **After:**
     ```
     git branch --merged main | grep feature/my-feature  # confirm merge first
     git branch -d feature/my-feature        # local cleanup (use -D only if merge confirmed)
     ```
3. Add `## Anti-patterns to avoid`: force-pushing to a protected branch; deleting a branch before confirming merge in remote; merging with red CI "because it's flaky"; merging a stale branch without rebasing.

**Priority:** P2 · **Estimated effort:** S

---

### `skills/tier2/incident-response.md`
**Current state:** Three-phase production-incident protocol with post-mortem template (79 lines) — well-structured, conforms to tier1 conventions.

**Issues identified:**
- Line 3: 3 sentences (caps the 2-sentence rule). The third sentence "Explicit-only; do not use for non-production debugging" is policy that belongs in the body (and is already on lines 11–13).
- Line 14: cross-reference to `systematic-debugging` — verified to exist in tier1. ✓
- Line 78: anti-pattern says "Using `systematic-debugging` protocol during an active incident — that protocol is too slow" — consistent with the When-to-use note. ✓
- Minor: post-mortem path `docs/incidents/YYYY-MM-DD-<topic>.md` (line 45) is not cross-referenced anywhere else in the catalog; consider adding to `AGENTS.md.tmpl` or roadmap template so the directory convention is discoverable.

**Improvements:**
1. Trim description to 2 sentences with literal triggers:
   - **After:** `Use when the user says "production is down", "run incident response", "start incident protocol", or service is broken and needs immediate restoration. Three-phase protocol — stabilize, investigate, post-mortem — with required docs/incidents/YYYY-MM-DD-<topic>.md artifact.`
2. (Optional) Add the path `docs/incidents/` to the directory list in `catalog/rules/AGENTS.md.tmpl` so the convention is grep-able.

**Priority:** P2 · **Estimated effort:** S

---

### `skills/tier2/performance-profiling.md`
**Current state:** Five-phase measure-first profiling protocol with a brief report template (99 lines) — well-structured and the largest tier2 skill, but still inside the 30–150 line band.

**Issues identified:**
- Line 3: 3 sentences. Final sentence ("Auto-triggers on performance signals; also explicitly invokable") is meta-commentary, not content the routing model needs.
- Line 12: lists auto-trigger phrases as a body section — but Claude Code skills don't have "auto-trigger" semantics independent of the description. The model only sees the YAML description pre-load, so these triggers must live in the description to function.
- Lines 19–22, 29–33, 36–42: heavy use of `□`-prefixed fenced code blocks instead of markdown `- [ ]` checkboxes. Other tier2 skills (`refactoring-simplify`, `security-review`) use `- [ ]` which renders properly in both Claude Code and GitHub. The `□` glyph is inert and harder to scan.
- No cross-reference to `systematic-debugging` even though Phase 2 ("Identify") overlaps significantly.

**Improvements:**
1. Move trigger phrases into the description so the router can actually fire on them:
   - **Before:** `Use when something is slow, memory is high, latency spikes, or bundle/build size grows unexpectedly. Five-phase measure-first protocol covering runtime and build/bundle performance. Auto-triggers on performance signals; also explicitly invokable.`
   - **After:** `Use when the user says "slow", "timeout", "latency spike", "high memory", "bundle too large", "CI is slow", "build taking forever", "profile this", or "why is this slow". Runs a five-phase measure-first protocol (Measure -> Identify -> Fix -> Verify -> Report) and commits docs/performance/YYYY-MM-DD-<topic>.md.`
2. Convert `□` checklists to `- [ ]` markdown checkboxes for consistency.
3. Add a "See also" note: *"If the bottleneck isn't reproducible, hand off to `systematic-debugging` first; come back to Phase 1 once you can repro."*

**Priority:** P1 (description triggers are unreachable as-written) · **Estimated effort:** M

---

### `skills/tier2/receiving-code-review.md`
**Current state:** Protocol for processing review feedback with triage / address / decline / report-back flow (50 lines) — conforms to tier1 conventions and pairs cleanly with tier1 `requesting-code-review.md`.

**Issues identified:**
- Line 3: 3 sentences, exceeds the 2-sentence cap.
- **Line 11:** "After a code-reviewer agent returns findings" — there is **no** `code-reviewer` agent in the catalog. Broken cross-reference.
- No cross-reference to tier1 `requesting-code-review` — natural pair.
- Section heading style uses `### 1. Triage each finding` etc. with no parent `## Process` — inconsistent with tier1.

**Improvements:**
1. Fix the broken agent reference on line 11:
   - **Before:** `- After a code-reviewer agent returns findings`
   - **After:** `- After the orchestrator or a review subagent returns findings` (or remove the bullet — `requesting-code-review` already covers the trigger from the other side)
2. Trim description to 2 sentences with literal triggers:
   - **After:** `Use when the user pastes PR review comments, says "address this feedback", "process the review", or returns from requesting-code-review. Triages each finding (Must-fix / Should-fix / Consider), addresses or declines with stated reasoning, and reports back in a structured summary.`
3. Wrap `### 1./2./3./4.` under a single `## Process` header for consistency.
4. Add at bottom: *"Paired with `requesting-code-review` (tier1) — that skill produces the findings this skill consumes."*

**Priority:** P1 · **Estimated effort:** S

---

### `skills/tier2/refactoring-simplify.md`
**Current state:** Post-feature simplification checklist covering duplication / over-abstraction / dead code / naming (41 lines) — concise, uses `- [ ]` checklists correctly.

**Issues identified:**
- Line 3: 3 sentences. The third sentence is the rule of three — useful philosophy but description-budget heavy.
- Body has no `## When to use` content beyond a 3-bullet list under that heading; no `## Process`; the closing `## Rules` section is partly anti-patterns rebranded.
- Line 27 references TypeScript-specific `noUnusedLocals` — consider language-agnostic phrasing.
- No cross-reference to the global `simplify` skill listed in available skills — they could confuse the model. Disambiguation needed.

**Improvements:**
1. Tighten description with literal triggers:
   - **After:** `Use when the user says "simplify this", "clean this up", "is there dead code here", or after a feature is complete with tests green. Walks a duplication / over-abstraction / dead-code / naming checklist; enforces "three similar lines beats a premature abstraction".`
2. Rename `## Rules` (line 37) to `## Anti-patterns to avoid` and rephrase imperatives as anti-patterns ("Refactoring on red tests", "Mixing refactor + behaviour commits", "Extracting for hypothetical future use") — matches sibling tier2 skills.
3. Add disambiguation note at top of "When to use": *"Not to be confused with the global `simplify` skill — this is a manual review checklist; `simplify` auto-fixes recently-changed code."*

**Priority:** P2 · **Estimated effort:** S

---

### `skills/tier2/security-review.md`
**Current state:** OWASP-aligned pre-commit checklist (48 lines) covering A01/A02/A03/A06/A07 — concise but duplicates the `/security-review` command and is missing the standard `## Anti-patterns` section.

**Issues identified:**
- **DRY violation with `catalog/commands/security-review.md`:** the command file (34 lines) re-states the same OWASP checklist almost verbatim and ends with "Run an OWASP-aligned security sweep using the security-review skill." Both files duplicate the checklist; the command should be a 5-line thin wrapper that defers to the skill. If either drifts the two go out of sync.
- Line 3: 2 sentences — within cap. Good. Lacks the literal command/phrase users type (`"security review"`, `"audit this"`, `/security-review`).
- Line 39: `No new dependencies installed without dependency-hygiene review` — valid skill cross-reference. ✓
- No `## Anti-patterns to avoid` section.
- Line 31: `console.log(req) or console.log(user)` — phrased as a checklist item but doesn't say what to verify; should be a concrete grep pattern.

**Improvements:**
1. **Tighten command file** (`catalog/commands/security-review.md`) to a thin shim — see [04-commands.md](./04-commands.md) for the full rewrite.
2. Add literal triggers to description: `Use when the user says "security review", "audit this", "check for vulns", "/security-review", or before creating a PR that touches auth, API endpoints, file I/O, or env handling. Runs an OWASP-aligned (A01/A02/A03/A06/A07) sweep and emits a ✓/⚠/✗ report.`
3. Add `## Anti-patterns to avoid`: scanning only changed files when the change is in a shared helper; flagging style issues as security findings (dilutes signal); auto-installing recommended security packages without `dependency-hygiene`; treating `npm audit` exit 0 as proof of safety.
4. Rephrase line 31: `- [ ] grep for \`console.log(req|user|token|password|secret)\` patterns in changed files`.

**Priority:** P1 (duplication with command file is a maintenance bomb) · **Estimated effort:** M

---

### `skills/tier2/software-architect.md`
**Current state:** RFC-first protocol for high-impact changes (43 lines) — strong structure but contains a P0 broken agent reference.

**Issues identified:**
- **Line 29 (P0):** `Dispatch the \`architect\` agent with:` — there is **NO** `architect` agent in the catalog. The shipped tier2 agents are only `backend`, `frontend`, `mobile`. The model will fail or hallucinate.
- Line 3: 2 sentences — within cap. Good. But lacks literal user phrases beyond `"run the architect"`, `"design this first"`, `"RFC for X"` (buried in body line 20).
- Line 34: references `writing-plans` skill — verified to exist. ✓
- Line 22: "Pause — do not write code or a plan yet" is good but no explicit handoff verb to `writing-plans` until step 5.
- Cross-coupling with `api-design`: when triggered by "API surface being designed" (line 17), no note that `api-design` is the more specific skill — risk of dueling skills.

**Improvements:**
1. **Fix the broken agent reference on line 29 (P0).** Two options:
   - **Option A (preferred):** Remove the agent dispatch entirely and inline the work — the skill itself does the RFC by writing to `docs/decisions/...`. Replace step 4 with: `4. **Write the RFC** directly to docs/decisions/YYYY-MM-DD-<topic>.md using the template below — capture decisions, rejected alternatives, and risks. Commit before proceeding.`
   - **Option B:** Add an `architect` agent to `catalog/agents/tier2/`. Heavier — only if the team wants the parallel-agent shape.
2. Add an RFC template to the body (similar to `incident-response`'s post-mortem template): `## Decision`, `## Context`, `## Options considered`, `## Choice & rationale`, `## Risks`, `## Rollback`.
3. Add to When-to-use: *"For API-surface design specifically, delegate to `api-design` after the RFC commits — that skill handles spec generation."*
4. Update description with literal triggers: `Use when the user says "run the architect", "design this first", "RFC for X", or introduces a new service / cross-module data flow / external integration / schema change / feature touching 3+ domains. Produces docs/decisions/YYYY-MM-DD-<topic>.md (RFC) before any plan or implementation begins.`

**Priority:** P0 (broken agent reference — core process step references nonexistent artifact) · **Estimated effort:** M

---

### `skills/tier2/writing-pull-requests.md`
**Current state:** PR creation skill with HEREDOC template, title/body rules, and pre-create checklist (48 lines) — concise and operational, matches the `gh pr create` convention in AGENTS.md.

**Issues identified:**
- Line 3: 2 sentences — within cap. Good. Lacks the literal `/commit-push-pr` slash command reference even though the command-file pipeline ends in PR creation.
- Lines 9–11 ("When to use"): only 2 bullets; could add literal triggers from sibling commands.
- Line 27: `🤖 Generated with [Claude Code](https://claude.com/claude-code)` — emoji locked into the template. Tier1 `writing-commits.md` convention and AGENTS.md "no emojis unless requested" rule suggest making this comment-controlled opt-in.
- No `## Anti-patterns` section.
- Line 34: rule says "Imperative mood: 'add auth middleware', not 'added' or 'adds'" — fine. But title format on line 16 uses `<type>(scope):` while AGENTS.md gives both `type(scope): description` and `type: description` (scope optional).
- Line 46: `gh pr list --head $(git branch --show-current)` is fine but doesn't filter by state; add `--state open` to avoid matching closed PRs from the same branch name.

**Improvements:**
1. Update description with literal triggers: `Use when the user says "create a PR", "open a PR", "/ship", "/commit-push-pr", or after finishing-a-development-branch confirms the branch is ready. Produces a <70-char conventional-commits title and a Summary + Test plan body via gh pr create.`
2. Make the Claude Code footer opt-in (or remove): document it in the template as `<!-- footer optional; omit if repo policy disallows -->`.
3. Fix the pre-create check on line 46:
   - **Before:** `gh pr list --head $(git branch --show-current)`
   - **After:** `gh pr list --head "$(git branch --show-current)" --state open`
4. Add `## Anti-patterns to avoid`: title > 70 chars; body as prose paragraph instead of bullets; test plan that just says "all tests pass"; including the full commit history in the body; force-pushing after CI passes to "clean up" history.
5. Add link to paired tier2 skill: *"See `finishing-a-development-branch` for the pre-PR rebase / clean-diff checks."*

**Priority:** P2 · **Estimated effort:** S
