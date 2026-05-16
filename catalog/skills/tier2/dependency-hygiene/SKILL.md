---
name: dependency-hygiene
description: Use when the user runs `npm install` / `pip install` / `go get` / `cargo add`, says "we need a library for X", or asks "can we drop this dep?". Evaluates coverage by existing deps, license, bundle cost, and maintenance health before any install.
version: "1.0.0"
source: haac-aikit
license: MIT
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash(npm:*)
  - Bash(pip:*)
  - Bash(cargo:*)
  - Bash(go:*)
---

## When to use
- Before `npm install`, `pip install`, `go get`, `cargo add`
- When the human says "we need a library for X"
- When refactoring and wondering if a dep can be removed

## Pre-install checklist

### 1. Is it already covered?
```bash
# Check if the functionality is already available
grep -r "require\|import" src/ | grep -i "<keyword>"
cat package.json | grep -i "<keyword>"
```
Check built-in language APIs first — `node:crypto`, `node:fs`, standard library.

### 2. What does this dep cost?
```bash
npx cost-of-modules <package>   # or bundlephobia.com
npm info <package> | head -20   # version, maintainers, last publish
```
- Bundle size impact (for browser code)
- Transitive dependency count
- Last published date (>2 years without activity is a yellow flag)

### 3. License check
- MIT, Apache 2.0, BSD: generally safe
- GPL, AGPL: may require open-sourcing your code — confirm with policy
- Proprietary: requires explicit approval
- Check: `npm info <package> license`

### 4. Maintenance health
- Stars + recent activity on GitHub (not a hard requirement, but signals)
- Open CVEs: `npm audit` after install, or check Snyk/OSV

## Decision output
```
Dependency assessment: <package>
- Existing coverage: [none / partial via X]
- Bundle size: [Xkb / not applicable]
- License: [MIT / ...]
- Last release: [date]
- Verdict: [INSTALL / USE_BUILTIN(X) / DEFER / REJECT]
- Reason: [one sentence]
```

## Anti-patterns
- **Installing because "everyone uses it".** Popularity is not coverage — check the actual use case before installing.
- **Adding a dep to avoid 20 lines of code.** Vendor risk + bundle cost + license review exceeds the cost of writing 20 lines.
- **Skipping the license check on GPL/AGPL packages.** Copyleft can poison a codebase; "we'll check later" rarely happens.
- **Ignoring `npm audit` failures** as "noise". Triage each one; suppress only with a documented reason.

See also: `security-review` (the supply-chain section A06 defers all dependency checks back to this skill).
