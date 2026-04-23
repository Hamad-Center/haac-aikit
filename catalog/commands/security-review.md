Run an OWASP-aligned security sweep using the security-review skill.

Check the recent changes (or the specified scope) for:

**Injection (A03)**
- SQL queries use parameterised statements — no string concatenation
- Shell commands use execFile with arg arrays — no user data in shell strings
- Template rendering sanitises HTML output

**Auth & session (A07)**
- Tokens not in logs or error responses
- Session IDs regenerated on privilege escalation

**Sensitive data (A02)**
- No hardcoded secrets, API keys, or credentials
- Env vars validated at startup
- No sensitive fields in console.log output

**Access control (A01)**
- Every route checks authorisation, not just authentication
- Resource ownership verified

**Supply chain (A06)**
- No new dependencies without hygiene check
- `npm audit` passes

Output:
```
Security sweep: [scope]
✓ No issues in [category]
⚠ [category]: [finding] at [file:line] — [fix]
✗ [critical] — MUST fix before merge
```
