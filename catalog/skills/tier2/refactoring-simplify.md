---
name: refactoring-simplify
description: Use when reviewing code for over-engineering, duplication, or dead code. Identifies unnecessary abstractions, premature generalisations, and code that should be deleted. Three similar lines is better than a premature abstraction — this skill enforces that principle.
version: "1.0.0"
source: anthropics/skills
license: Apache-2.0
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
- [ ] Functions that are never called (check with grep + TypeScript `noUnusedLocals`)
- [ ] Branches that can never be reached (check for impossible conditions)
- [ ] Feature flags that are always true or always false
- [ ] Commented-out code blocks → delete (git history preserves history)

### Naming
- [ ] Misleading names: a function named `getUser` that also creates a user
- [ ] Generic names (`data`, `result`, `temp`, `obj`) that could be more descriptive
- [ ] Abbreviations that aren't universally understood in this domain

## Rules
- Do not refactor without green tests first
- Do not mix refactoring commits with behaviour changes
- Do not extract an abstraction "for future use" — YAGNI
