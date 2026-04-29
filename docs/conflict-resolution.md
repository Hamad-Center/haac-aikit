# Conflict resolution

When `aikit sync` or `aikit update` would overwrite a template file (`.claude/agents/*.md`, `.claude/skills/*.md`, `.claude/commands/*.md`, `.claude/hooks/*`) that you've **modified locally**, you'll see an interactive prompt:

```
Modified locally: .claude/agents/reviewer.md
  ▸ Replace with catalog version (recommended)
    Keep local version (mark as tier3 to silence future prompts)
    Show diff first
    Replace all remaining conflicts
    Skip all remaining conflicts
```

## Options

| Option | Effect |
|---|---|
| **Replace** (default) | Overwrites your local file with the catalog version. Your changes are lost — use `git diff HEAD~1` to recover if you regret it. |
| **Keep** | Preserves your local file. For agents and skills, the file's name is added to `agents.tier3` (or `skills.tier3`) in `.aikitrc.json` so future syncs skip it entirely. |
| **Show diff** | Displays a colored unified diff (3 lines of context). Re-prompts after. |
| **Replace all** | Replaces this file AND all remaining conflicts in this run. No further prompts. |
| **Skip all** | Keeps this file AND all remaining conflicts in this run. Configs are NOT updated for skipped files (no auto-tier3). |

## Headless mode (`--yes`, `--force`, CI)

The prompt only appears when:
- Stdin is a TTY (interactive terminal), AND
- `--yes` was NOT passed, AND
- `--force` was NOT passed.

Otherwise:
- `--force` → silently overwrite all conflicts (current 0.6.x behavior).
- `--yes` (without `--force`) → skip conflicts and report a warning. Sync continues for non-conflicting files.
- Non-TTY (e.g., CI, piped input) → same as `--yes`.

This means existing CI flows are unchanged. The prompt is purely additive for interactive use.

## Limitations (v1)

- **No history tracking.** If a catalog update genuinely changes a file you didn't touch, the diff between your installed version and the new catalog will trigger the prompt — even though you're not the source of the change. We accept this noise in v1; future versions may add per-file hash tracking to distinguish "user modified" from "catalog evolved".
- **Commands and hooks have no tier3.** Choosing "Keep" for `.claude/commands/*.md` or `.claude/hooks/*` skips the file for this run with a warning, but the file will be flagged again on the next sync. To permanently customize a command or hook, fork the catalog or rename the file.
- **No 3-way merge.** "Keep" preserves your file, "Replace" uses the catalog version. There's no chunk-by-chunk merge.
