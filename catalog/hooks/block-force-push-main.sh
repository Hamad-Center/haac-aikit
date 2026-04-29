#!/usr/bin/env bash
# Blocks force-push to protected branches.
# Fires on PreToolUse(Bash).

set -euo pipefail

INPUT="$(cat)"
COMMAND="$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('command',''))" 2>/dev/null || echo "")"

PROTECTED_BRANCHES=("main" "master" "develop" "production" "staging")

if echo "$COMMAND" | grep -qE "git push.*(--force|-f)"; then
  for branch in "${PROTECTED_BRANCHES[@]}"; do
    if echo "$COMMAND" | grep -qE "(^| )${branch}( |$)"; then
      echo "BLOCKED: force-push to protected branch '$branch'" >&2
      echo "{\"decision\":\"block\",\"reason\":\"Force-push to $branch is blocked by haac-aikit safety hook. Use a PR instead.\"}"
      exit 0
    fi
  done
fi

echo '{"decision":"approve"}'
