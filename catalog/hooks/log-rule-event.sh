#!/usr/bin/env bash
# Telemetry hook: records when instruction files load and which rule IDs they contain.
# Fires on InstructionsLoaded.
#
# Output: appends one JSON line per loaded rule to .aikit/events.jsonl.
# Schema: {"ts":"<iso>","event":"loaded","rule_id":"<id>","source":"<path>"}
#
# This hook is read-only and never blocks. If anything fails it exits silently
# so it can never break a Claude Code session.

set -euo pipefail

INPUT="$(cat)"
LOG_DIR=".aikit"
LOG_FILE="$LOG_DIR/events.jsonl"

# Bail early if we can't even create the log dir (read-only fs, etc.).
mkdir -p "$LOG_DIR" 2>/dev/null || { echo '{"decision":"approve"}'; exit 0; }

TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# Extract loaded file paths from the hook input (passed via env var, not stdin,
# because the heredoc below already occupies python's stdin as the script source).
FILES="$(HOOK_INPUT="$INPUT" python3 <<'PY' 2>/dev/null || true
import os, json
try:
    d = json.loads(os.environ.get("HOOK_INPUT", ""))
except Exception:
    d = {}
candidates = []
for key in ("files", "paths", "instructionFiles", "loaded", "memory"):
    val = d.get(key) if isinstance(d, dict) else None
    if isinstance(val, list):
        candidates.extend(str(v) for v in val if v)
    elif isinstance(val, str):
        candidates.append(val)
# Always probe the standard memory file locations even if not echoed back.
for default in ("AGENTS.md", "CLAUDE.md", ".claude/CLAUDE.md"):
    candidates.append(default)
print("\n".join(dict.fromkeys(candidates)))
PY
)"

# For each loaded file, scan for rule IDs in HTML comments and log one event per ID.
echo "$FILES" | while IFS= read -r FILE; do
  [[ -z "$FILE" || ! -f "$FILE" ]] && continue
  # Match <!-- id: foo.bar --> (whitespace tolerant). Requires a dotted slug
  # starting with a letter, so docstring examples like <!-- id: ... --> don't
  # produce phantom rule events.
  grep -oE '<!--[[:space:]]*id:[[:space:]]*[a-zA-Z][a-zA-Z0-9_-]*\.[a-zA-Z0-9._-]+[[:space:]]*-->' "$FILE" 2>/dev/null \
    | sed -E 's/<!--[[:space:]]*id:[[:space:]]*([a-zA-Z][a-zA-Z0-9_-]*\.[a-zA-Z0-9._-]+)[[:space:]]*-->/\1/' \
    | while IFS= read -r RULE_ID; do
        [[ -z "$RULE_ID" ]] && continue
        printf '{"ts":"%s","event":"loaded","rule_id":"%s","source":"%s"}\n' \
          "$TS" "$RULE_ID" "$FILE" >> "$LOG_FILE" 2>/dev/null || true
      done
done

# Always approve — this hook only observes.
echo '{"decision":"approve"}'
