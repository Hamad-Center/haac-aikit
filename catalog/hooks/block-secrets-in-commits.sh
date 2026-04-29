#!/usr/bin/env bash
# Blocks git commits when staged diff contains likely secrets.
# Fires on PreToolUse(Bash) when the command contains 'git commit'.

set -euo pipefail

INPUT="$(cat)"
COMMAND="$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('command',''))" 2>/dev/null || echo "")"

if ! echo "$COMMAND" | grep -q "git commit"; then
  echo '{"decision":"approve"}'
  exit 0
fi

# Check staged diff for secret-like patterns
DIFF="$(git diff --cached --unified=0 2>/dev/null || echo "")"

SECRET_PATTERNS=(
  "AKIA[0-9A-Z]{16}"              # AWS access key
  "sk-[a-zA-Z0-9]{48}"            # OpenAI API key
  "ghp_[a-zA-Z0-9]{36}"           # GitHub personal access token
  "ghs_[a-zA-Z0-9]{36}"           # GitHub app token
  "xoxb-[0-9A-Za-z-]+"            # Slack bot token
  "password[[:space:]]*=[[:space:]]*['\"][^'\"]{8,}" # password = "..."
  "secret[[:space:]]*=[[:space:]]*['\"][^'\"]{8,}"   # secret = "..."
  "api_key[[:space:]]*=[[:space:]]*['\"][^'\"]{8,}"  # api_key = "..."
)

for pattern in "${SECRET_PATTERNS[@]}"; do
  if echo "$DIFF" | grep -qP "^\+.*${pattern}" 2>/dev/null; then
    echo "BLOCKED: potential secret detected in staged changes (pattern: $pattern)" >&2
    echo "{\"decision\":\"block\",\"reason\":\"Potential secret in staged diff. Review with 'git diff --cached' before committing.\"}"
    exit 0
  fi
done

echo '{"decision":"approve"}'
