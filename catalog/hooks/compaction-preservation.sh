#!/usr/bin/env bash
# Writes a scratch file before compaction to preserve working state.
# Fires on PreCompact.

set -euo pipefail

SCRATCH_FILE=".claude/pre-compact-state.md"
mkdir -p .claude

{
  echo "# Pre-compaction state"
  echo "## Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo ""
  echo "## Modified files"
  git status --porcelain 2>/dev/null || echo "(not a git repo)"
  echo ""
  echo "## Recent commits"
  git log --oneline -5 2>/dev/null || echo "(not a git repo)"
  echo ""
  echo "## Failing tests"
  if [[ -f ".last-test-result" ]]; then
    cat .last-test-result
  else
    echo "(no test result recorded)"
  fi
} > "$SCRATCH_FILE"

echo "Pre-compact state saved to $SCRATCH_FILE"
exit 0
