---
name: security-review
description: Use before committing code that handles user input, authentication, file operations, external API calls, or environment variables. Performs an OWASP-aligned sweep to catch injection, auth, secrets, and access-control vulnerabilities before they reach main.
version: "1.0.0"
source: haac-aikit
license: MIT
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
