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

# Do all work inside python so file paths with quotes/backslashes can't break
# the JSONL output (json.dumps escapes them safely).
HOOK_INPUT="$INPUT" HOOK_LOG="$LOG_FILE" HOOK_TS="$TS" \
python3 <<'PY' 2>/dev/null || true
import json, os, re
try:
    payload = json.loads(os.environ.get("HOOK_INPUT", "") or "{}")
    if not isinstance(payload, dict):
        payload = {}
except Exception:
    payload = {}

candidates = []
for key in ("files", "paths", "instructionFiles", "loaded", "memory"):
    val = payload.get(key)
    if isinstance(val, list):
        candidates.extend(str(v) for v in val if v)
    elif isinstance(val, str):
        candidates.append(val)
# Always probe the standard memory file locations even if not echoed back.
for default in ("AGENTS.md", "CLAUDE.md", ".claude/CLAUDE.md"):
    candidates.append(default)

# Dedupe while preserving order.
seen = set()
files = [c for c in candidates if not (c in seen or seen.add(c))]

# Match a dotted-slug rule ID, starting with a letter so docstring examples
# like <!-- id: ... --> don't produce phantom events. Allows optional
# space-separated key=value metadata between the ID and the closing -->.
id_rx = re.compile(r"<!--\s*id:\s*([a-zA-Z][a-zA-Z0-9_-]*\.[a-zA-Z0-9._-]+)(?:\s+[a-zA-Z][a-zA-Z0-9_-]*=[^>\s]+)*\s*-->")
ts = os.environ["HOOK_TS"]
log_path = os.environ["HOOK_LOG"]

events = []
for path in files:
    if not os.path.isfile(path):
        continue
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as fh:
            content = fh.read()
    except Exception:
        continue
    for match in id_rx.finditer(content):
        rule_id = match.group(1)
        if rule_id:
            events.append({"ts": ts, "event": "loaded", "rule_id": rule_id, "source": path})

if events:
    try:
        with open(log_path, "a", encoding="utf-8") as fh:
            for e in events:
                fh.write(json.dumps(e, separators=(",", ":")) + "\n")
    except Exception:
        pass
PY

# Always approve — this hook only observes.
echo '{"decision":"approve"}'
