---
name: brainstorming
description: Use when a request is ambiguous, has multiple valid approaches, or involves a product/design decision. Clarifies requirements before writing any code or making irreversible changes. Prevents wasted implementation work caused by misunderstood intent.
version: "1.0.0"
source: obra/superpowers
license: MIT
---

## When to use
- Request is vague ("make this better", "add auth", "refactor this")
- Multiple valid implementation approaches exist
- The task involves a non-trivial architectural decision
- You're unsure which of several files to modify

## Process

1. **State what you understand** — describe the goal in your own words (2-3 sentences).

2. **Surface your assumptions** — list them explicitly:
   ```
   ASSUMPTIONS:
   1. [assumption]
   2. [assumption]
   → Correct me now or I'll proceed with these.
   ```

3. **Identify the key decision** — the one choice that, if wrong, invalidates all following work. Name it.

4. **Present 2-3 concrete approaches** (not more) — for each: one sentence on what it does, one on the main tradeoff. No implementation yet.

5. **Make a recommendation** — state which you'd pick and why. Then stop. Let the human choose.

6. **Confirm before implementing** — do not proceed until the human explicitly approves an approach.

## Anti-patterns to avoid
- Asking 5+ questions in sequence instead of synthesising a recommendation
- Starting implementation before requirements are clear
- Treating "do X" as unambiguous when X has multiple valid interpretations
- Presenting approaches without tradeoffs (forces the human to do the analysis)
