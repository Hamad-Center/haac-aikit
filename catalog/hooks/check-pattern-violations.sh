#!/usr/bin/env bash
# Telemetry hook: pattern-checks just-written files against rules in
# .claude/aikit-rules.json and logs violations.
# Fires on PostToolUse(Edit|Write).
#
# Output: appends one JSON line per violation to .aikit/events.jsonl.
# Schema: {"ts":"<iso>","event":"violation","rule_id":"<id>","file":"<path>","severity":"<level>","line":<n>}
#
# Read-only and non-blocking. Never fails the tool call.

set -euo pipefail

INPUT="$(cat)"
LOG_DIR=".aikit"
LOG_FILE="$LOG_DIR/events.jsonl"
RULES_FILE=".claude/aikit-rules.json"

mkdir -p "$LOG_DIR" 2>/dev/null || exit 0

# Bail if there are no rules to check.
[[ ! -f "$RULES_FILE" ]] && { echo '{"decision":"approve"}'; exit 0; }

# Extract the file_path from the tool input.
FILE_PATH="$(echo "$INPUT" | python3 -c "import sys,json
try:
    d = json.load(sys.stdin)
    print(d.get('file_path','') or d.get('path',''))
except Exception:
    pass" 2>/dev/null || echo "")"

[[ -z "$FILE_PATH" || ! -f "$FILE_PATH" ]] && { echo '{"decision":"approve"}'; exit 0; }

TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# Use python to parse JSON rules + apply globs + scan for patterns. Bash glob
# matching is too limited (no exclude support, no `**`).
HOOK_FILE_PATH="$FILE_PATH" HOOK_RULES_PATH="$RULES_FILE" HOOK_LOG_PATH="$LOG_FILE" HOOK_TS="$TS" \
python3 <<'PY' 2>/dev/null || true
import json, re, os, sys
file_path = os.environ["HOOK_FILE_PATH"]
rules_path = os.environ["HOOK_RULES_PATH"]
log_path = os.environ["HOOK_LOG_PATH"]
ts = os.environ["HOOK_TS"]
try:
    with open(rules_path, "r", encoding="utf-8") as f:
        cfg = json.load(f)
except Exception:
    sys.exit(0)

def glob_to_regex(pattern: str) -> str:
    # Custom translator because Python 3.9's pathlib doesn't handle ** recursion
    # and fnmatch treats ** as a single segment.
    out = []
    i = 0
    while i < len(pattern):
        c = pattern[i]
        if c == "*":
            if i + 1 < len(pattern) and pattern[i + 1] == "*":
                if i + 2 < len(pattern) and pattern[i + 2] == "/":
                    out.append(r"(?:[^/]+/)*")  # zero-or-more directory segments
                    i += 3
                    continue
                out.append(".*")
                i += 2
                continue
            out.append(r"[^/]*")
            i += 1
        elif c == "?":
            out.append(r"[^/]")
            i += 1
        elif c in ".+()[]{}|^$\\":
            out.append("\\" + c)
            i += 1
        else:
            out.append(c)
            i += 1
    return "^" + "".join(out) + "$"

def glob_match(path: str, patterns) -> bool:
    for p in patterns:
        rx = re.compile(glob_to_regex(p))
        if rx.match(path):
            return True
    return False

try:
    with open(file_path, "r", encoding="utf-8", errors="replace") as f:
        content = f.read()
except Exception:
    sys.exit(0)

events = []
for rule in cfg.get("rules", []):
    rid = rule.get("id") or ""
    pat = rule.get("pattern")
    if not rid or not pat:
        continue
    includes = rule.get("fileGlobs") or ["**/*"]
    excludes = rule.get("exclude") or []
    if not glob_match(file_path, includes):
        continue
    if excludes and glob_match(file_path, excludes):
        continue
    try:
        rx = re.compile(pat, re.MULTILINE)
    except re.error as compile_err:
        events.append({
            "ts": ts,
            "event": "rule_compile_error",
            "rule_id": rid,
            "pattern": pat[:200],
            "error": str(compile_err)[:200],
        })
        continue
    for m in rx.finditer(content):
        line = content.count("\n", 0, m.start()) + 1
        events.append({
            "ts": ts,
            "event": "violation",
            "rule_id": rid,
            "file": file_path,
            "severity": rule.get("severity", "warn"),
            "line": line,
        })

if events:
    try:
        os.makedirs(os.path.dirname(log_path) or ".", exist_ok=True)
        with open(log_path, "a", encoding="utf-8") as f:
            for e in events:
                f.write(json.dumps(e, separators=(",", ":")) + "\n")
    except Exception:
        pass
PY

# Always approve — this hook only observes.
echo '{"decision":"approve"}'
