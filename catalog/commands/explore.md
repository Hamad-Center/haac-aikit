Explore the codebase to understand how something works, using the codebase-exploration skill.

This is a read-only reconnaissance — no file edits during exploration.

1. Orient (≤3 minutes):
```bash
ls -la
cat package.json | head -30
git log --oneline -10
```
2. Find entry points (index.ts, main.go, app/layout.tsx, bin fields).
3. Trace the critical path for the feature/area in question:
   - Triggering event → handler → service → data layer
   - Note each I/O boundary
4. Map dependencies: what does this module import? What imports it?
5. Read the test file for the module before the source — tests reveal intent.

Output:
```
Understanding:
- Entry: [file:line]
- Critical path: [A → B → C]
- Key dependencies: [list]
- Gotchas: [anything surprising]
→ Ready to proceed / Need to clarify: [question]
```
