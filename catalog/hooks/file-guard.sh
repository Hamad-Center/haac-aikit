#!/usr/bin/env bash
# Blocks reads and writes to sensitive files.
# Fires on PreToolUse(Read|Edit|Write).

set -euo pipefail

INPUT="$(cat)"
FILE_PATH="$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('file_path','') or d.get('path',''))" 2>/dev/null || echo "")"

BLOCKED_PATTERNS=(
  ".env"
  "secrets/"
  ".ssh/"
  ".aws/"
  "*.pem"
  "id_rsa"
  "id_ed25519"
  ".netrc"
  "credentials"
)

for pattern in "${BLOCKED_PATTERNS[@]}"; do
  if [[ "$FILE_PATH" == *"$pattern"* ]]; then
    echo "BLOCKED: access to sensitive file: $FILE_PATH" >&2
    echo "{\"decision\":\"block\",\"reason\":\"Access to sensitive file blocked: $pattern. Override in .claude/settings.local.json if needed.\"}"
    exit 0
  fi
done

echo '{"decision":"approve"}'
