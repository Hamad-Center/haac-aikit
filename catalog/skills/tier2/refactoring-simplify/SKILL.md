---
name: refactoring-simplify
description: Use when the user says "simplify this", "clean this up", "is there dead code here", or after a feature is complete with tests green. Walks a duplication / over-abstraction / dead-code / naming checklist; enforces "three similar lines beats a premature abstraction". Not the same as the harness-level `simplify` skill (which auto-fixes recently-changed code) — this one is a manual review checklist.
version: "1.0.0"
source: anthropics/skills
license: Apache-2.0
allowed-tools:
  - Read
  - Edit
  - Grep
  - Glob
  - Bash
---

## When to use
- After a feature is complete and tests are green
- When the human says "clean this up" or "simplify this"
- When code review finds the abstraction is unclear

## Simplification checklist

### Duplication
- [ ] Is the same logic copy-pasted in ≥3 places? → extract a function
- [ ] Is the same logic copy-pasted in 2 places? → leave it; wait for a third before abstracting
- [ ] Are there near-identical functions that differ by one variable? → parameterise

### Over-abstraction
- [ ] Does the abstraction have only one caller? → inline it
- [ ] Does the abstraction require understanding 3+ files to use? → likely too abstract
- [ ] Is there an interface with only one implementation? → remove the interface

### Dead code
- [ ] Functions that are never called (use the project's dead-code detector: TypeScript `noUnusedLocals`, Pyflakes / ruff `F401`, `cargo clippy`, etc.)
- [ ] Branches that can never be reached (check for impossible conditions)
- [ ] Feature flags that are always true or always false
- [ ] Commented-out code blocks → delete (git history preserves history)

### Naming
- [ ] Misleading names: a function named `getUser` that also creates a user
- [ ] Generic names (`data`, `result`, `temp`, `obj`) that could be more descriptive
- [ ] Abbreviations that aren't universally understood in this domain

## Anti-patterns
- **Refactoring on red tests.** Without a green baseline, you can't tell whether the refactor broke something or "it was already broken".
- **Mixing refactor + behaviour changes in the same commit.** When the commit later breaks something, you can't isolate which change caused it.
- **Extracting an abstraction "for future use" (YAGNI).** Three similar lines beats a premature abstraction. Wait for the third real call site before extracting.
- **Deleting "dead" code without grepping repo-wide first.** What looks unused locally may be referenced by a dynamic import, a CI script, or a generated file.
