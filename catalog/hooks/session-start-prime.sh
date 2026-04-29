#!/usr/bin/env bash
# Prints useful context at session start.
# Fires on SessionStart.

set -euo pipefail

echo "=== Session context ==="

# Current branch
BRANCH="$(git branch --show-current 2>/dev/null || echo 'not in a git repo')"
echo "Branch: $BRANCH"

# Uncommitted changes
DIRTY="$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')"
if [[ "$DIRTY" -gt 0 ]]; then
  echo "Uncommitted changes: $DIRTY file(s)"
fi

# Recent failing tests (Jest/Vitest)
if [[ -f ".last-test-result" ]]; then
  echo "Last test run: $(cat .last-test-result)"
fi

# TODO count
TODO_COUNT="$(grep -r 'TODO\|FIXME\|HACK' --include='*.ts' --include='*.js' --include='*.py' . 2>/dev/null | wc -l | tr -d ' ')"
if [[ "$TODO_COUNT" -gt 0 ]]; then
  echo "TODOs in codebase: $TODO_COUNT"
fi

echo "======================"
exit 0
