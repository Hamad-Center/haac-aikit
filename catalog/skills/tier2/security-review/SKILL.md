---
name: security-review
description: Use when the user says "security review", "audit this", "check for vulns", "/security-review", or before creating a PR that touches auth, API endpoints, file I/O, or env handling. Runs an OWASP-aligned (A01/A02/A03/A06/A07) sweep and emits a ✓/⚠/✗ report.
version: "1.0.0"
source: haac-aikit
license: MIT
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash(git diff:*)
  - Bash(npm audit:*)
  - Bash(pip-audit:*)
---

## When to use
- Before creating a PR that touches auth, API endpoints, file I/O, or env handling
- When the human asks for a security review
- After adding any new external-facing surface

## Review checklist

### Injection (A03)
- [ ] All SQL queries use parameterised statements / ORM — no string concatenation
- [ ] Shell commands use `execFile`/`spawnFile` with arg arrays — never pass user data to shell-form exec
- [ ] Template rendering sanitises HTML — no direct `innerHTML = userInput`
- [ ] File paths constructed from user input are canonicalised and bounded

### Authentication & session (A07)
- [ ] Tokens are not logged or included in error responses
- [ ] Session IDs are regenerated on privilege escalation
- [ ] Password resets use time-limited, single-use tokens

### Sensitive data (A02)
- [ ] No secrets, API keys, or credentials in source code
- [ ] No secrets in log output
- [ ] Env vars are validated at startup — missing required secrets fail fast
- [ ] `console.log(req)` or `console.log(user)` that might expose sensitive fields

### Access control (A01)
- [ ] Every endpoint/route checks authorisation — not just authentication
- [ ] Resource ownership is verified (user can only access their own resources)
- [ ] Admin/privileged routes are explicitly gated

### Supply chain (A06)
- [ ] No new dependencies installed without `dependency-hygiene` review
- [ ] `npm audit` / `pip-audit` passes

## Output format
```
Security sweep: [scope]
✓ No issues found in [category]
⚠ [category]: [finding] at [file:line] — [recommended fix]
✗ [critical finding] — MUST fix before merge
```

## Anti-patterns
- **Scanning only changed files when the change is in a shared helper.** The blast radius is every caller — widen the scope to all consumers.
- **Flagging style issues as security findings.** Dilutes the signal; reviewers learn to ignore your reports. Keep ✗/⚠ for actual security.
- **Auto-installing recommended security packages** without `dependency-hygiene` review. The fix package can introduce its own vulns or license issues.
- **Treating `npm audit` exit 0 as proof of safety.** Audit only catches *known* CVEs in *direct* deps. Logic bugs, auth bypasses, and SSRF won't show up.
