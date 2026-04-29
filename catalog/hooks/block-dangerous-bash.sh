#!/usr/bin/env bash
# Blocks destructive shell commands before they execute.
# Fires on PreToolUse(Bash).

set -euo pipefail

INPUT="$(cat)"
COMMAND="$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('command',''))" 2>/dev/null || echo "")"

PATTERNS=(
  "rm -rf /"
  "rm -rf ~"
  "rm -rf \*"
  "dd if="
  "mkfs"
  ":(){:|:&};:"
  "chmod -R 777"
  "> /dev/sda"
  "shred -"
)

for pattern in "${PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qF "$pattern"; then
    echo "BLOCKED: dangerous command pattern detected: $pattern" >&2
    echo '{"decision":"block","reason":"Dangerous bash command blocked by haac-aikit safety hook"}'
    exit 0
  fi
done

echo '{"decision":"approve"}'
