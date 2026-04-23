---
name: dependency-hygiene
description: Use before installing any new package. Evaluates whether the dependency is necessary, checks for existing alternatives in the codebase, assesses license compatibility and maintenance health. Prevents dependency bloat and security surface expansion.
version: "1.0.0"
source: haac-aikit
license: MIT
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
