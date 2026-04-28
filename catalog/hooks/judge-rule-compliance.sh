#!/usr/bin/env bash
# Telemetry hook: opt-in LLM judge that verdicts whether the assistant's last
# turn cited / violated / ignored each loaded rule.
# Fires on Stop and SubagentStop.
#
# Output: appends one JSON line per rule verdict to .aikit/events.jsonl.
# Schema: {"ts":"<iso>","event":"cited"|"judged_violation","rule_id":"<id>","verdict":"<text>"}
#
# Activation:
#   - Set AIKIT_JUDGE=1 (otherwise the hook exits immediately, free).
#   - Set ANTHROPIC_API_KEY (otherwise the hook exits silently).
# Cost: ~$0.001/turn with claude-haiku-4-5. Disabled by default for that reason.
#
# Read-only and non-blocking. Never fails the parent tool call.

set -uo pipefail

INPUT="$(cat)"
LOG_DIR=".aikit"
LOG_FILE="$LOG_DIR/events.jsonl"
MODEL="${AIKIT_JUDGE_MODEL:-claude-haiku-4-5-20251001}"

# Always echo approve at the end, even on early exit.
trap 'echo "{\"decision\":\"approve\"}"' EXIT

# Cheap exits before any expensive work.
[[ "${AIKIT_JUDGE:-0}" != "1" ]] && exit 0
[[ -z "${ANTHROPIC_API_KEY:-}" ]] && exit 0
command -v curl >/dev/null 2>&1 || exit 0
mkdir -p "$LOG_DIR" 2>/dev/null || exit 0

TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# Build the judge call entirely in python so JSON escaping is correct. The
# script reads the hook input (assistant transcript) from $HOOK_INPUT, scans
# the project's rule files for declared IDs, and asks Haiku for a verdict.
HOOK_INPUT="$INPUT" HOOK_LOG="$LOG_FILE" HOOK_TS="$TS" HOOK_MODEL="$MODEL" \
python3 <<'PY' 2>/dev/null || true
import json, os, re, sys, urllib.request, urllib.error

api_key = os.environ.get("ANTHROPIC_API_KEY", "")
if not api_key:
    sys.exit(0)

raw = os.environ.get("HOOK_INPUT", "")
log_path = os.environ["HOOK_LOG"]
ts = os.environ["HOOK_TS"]
model = os.environ["HOOK_MODEL"]

try:
    payload = json.loads(raw) if raw else {}
except Exception:
    payload = {}

# Try to extract the assistant's last response. Hook input shape varies across
# Claude Code versions; handle a few likely fields.
transcript = ""
for key in ("assistant_message", "last_response", "transcript", "messages"):
    val = payload.get(key)
    if isinstance(val, str):
        transcript = val
        break
    if isinstance(val, list) and val:
        last = val[-1]
        if isinstance(last, dict):
            transcript = str(last.get("content") or last.get("text") or "")
        else:
            transcript = str(last)
        break

if not transcript or len(transcript) < 20:
    sys.exit(0)

# Cap transcript size to keep the judge prompt cheap.
if len(transcript) > 8000:
    transcript = transcript[:8000] + "\n...[truncated]"

# Collect declared rule IDs from project rule files.
id_rx = re.compile(r"<!--\s*id:\s*([a-zA-Z][a-zA-Z0-9_-]*\.[a-zA-Z0-9._-]+)\s*-->")
rules = {}  # id -> surrounding line for context
candidates = ["AGENTS.md", "CLAUDE.md", ".claude/CLAUDE.md"]
rules_dir = ".claude/rules"
if os.path.isdir(rules_dir):
    for f in os.listdir(rules_dir):
        if f.endswith(".md"):
            candidates.append(os.path.join(rules_dir, f))

for path in candidates:
    if not os.path.isfile(path):
        continue
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as fh:
            content = fh.read()
    except Exception:
        continue
    for line in content.splitlines():
        m = id_rx.search(line)
        if not m:
            continue
        rid = m.group(1)
        # Strip the comment to get the rule text in human-readable form.
        text = id_rx.sub("", line).strip(" -*\t")
        if rid and text and rid not in rules:
            rules[rid] = text[:240]

if not rules:
    sys.exit(0)

# Construct judge prompt. Keep it tight — Haiku rewards specificity.
rules_block = "\n".join(f"- {rid}: {txt}" for rid, txt in rules.items())
prompt = (
    "You are a precise auditor. Given the assistant's last response and a list "
    "of project rules, decide for each rule whether the response CITED it "
    "(referenced it explicitly), VIOLATED it (acted against it), or was "
    "IRRELEVANT (the rule didn't apply this turn). Respond with JSON only.\n\n"
    f"RULES:\n{rules_block}\n\n"
    f"ASSISTANT RESPONSE:\n{transcript}\n\n"
    'Output JSON exactly: {"verdicts":[{"rule_id":"...","status":"cited|violated|irrelevant","reason":"<10 words"}]}'
)

req = urllib.request.Request(
    "https://api.anthropic.com/v1/messages",
    data=json.dumps({
        "model": model,
        "max_tokens": 1024,
        "messages": [{"role": "user", "content": prompt}],
    }).encode("utf-8"),
    headers={
        "Content-Type": "application/json",
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
    },
)

def log_error(reason):
    # Errors land in a sibling log so the user (who explicitly opted in via
    # AIKIT_JUDGE=1 and is paying for verdicts) can see why a turn produced
    # nothing. Stays out of events.jsonl to keep the rule-event stream clean.
    try:
        err_path = os.path.join(os.path.dirname(log_path) or ".", "judge-errors.log")
        os.makedirs(os.path.dirname(err_path) or ".", exist_ok=True)
        with open(err_path, "a", encoding="utf-8") as eh:
            eh.write(f"{ts}  {reason}\n")
    except Exception:
        pass

try:
    with urllib.request.urlopen(req, timeout=15) as resp:
        body = json.loads(resp.read().decode("utf-8"))
except urllib.error.HTTPError as e:
    log_error(f"http {e.code}: {e.reason}")
    sys.exit(0)
except urllib.error.URLError as e:
    log_error(f"url-error: {e.reason}")
    sys.exit(0)
except (TimeoutError, json.JSONDecodeError) as e:
    log_error(f"transport: {type(e).__name__}: {e}")
    sys.exit(0)

# Extract the model's text content.
text_chunks = [c.get("text", "") for c in body.get("content", []) if c.get("type") == "text"]
verdict_text = "\n".join(text_chunks).strip()

# Pull out the first {...} JSON object (Haiku usually emits clean JSON, but be defensive).
match = re.search(r"\{.*\}", verdict_text, re.DOTALL)
if not match:
    log_error(f"no JSON object in model response (len={len(verdict_text)})")
    sys.exit(0)
try:
    verdicts = json.loads(match.group(0)).get("verdicts", [])
except Exception as e:
    log_error(f"verdicts json parse failed: {e}")
    sys.exit(0)

# Append events. cited → "cited", violated → "judged_violation", irrelevant → skip.
events = []
for v in verdicts:
    rid = v.get("rule_id")
    status = v.get("status")
    if not rid or status not in {"cited", "violated"}:
        continue
    events.append({
        "ts": ts,
        "event": "cited" if status == "cited" else "judged_violation",
        "rule_id": rid,
        "verdict": (v.get("reason") or "")[:200],
    })

if events:
    try:
        os.makedirs(os.path.dirname(log_path) or ".", exist_ok=True)
        with open(log_path, "a", encoding="utf-8") as fh:
            for e in events:
                fh.write(json.dumps(e, separators=(",", ":")) + "\n")
    except Exception:
        pass
PY
