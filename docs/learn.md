# Learn from PR history

`aikit learn` mines your team's PR review comments for repeated correction patterns, clusters them by token similarity, and proposes new rules in a paste-ready block.

The premise: your team's *real* rules already exist — they live in PR review comments where someone wrote "we always validate inputs at the boundary" or "don't put logs in this file". Those comments never make it into CLAUDE.md because nobody has time to translate code review into rules. `aikit learn` does that translation.

## Quickstart

```bash
aikit learn --limit=30
```

Pulls your last 30 merged PRs via `gh`. Output looks like:

```
Fetching last 30 merged PRs...
Pulling review comments from 30 PRs...
Found 18 teaching comments out of 142 total.

Proposed rule candidates (3)
Each candidate is backed by ≥2 PR review comments.

▸ learned.use-named-exports
  evidence: 4 comments across #102, #117, #124, #131
  exemplar: we always use named exports here, not default exports

▸ learned.validate-input-boundary
  evidence: 3 comments across #98, #115, #128
  exemplar: please validate inputs at the API boundary, not deeper

▸ learned.no-magic-numbers
  evidence: 2 comments across #109, #122
  exemplar: extract this 3600 to a named constant

Suggested AGENTS.md additions
Copy the block below into AGENTS.md inside a <!-- BEGIN:learned --> ... <!-- END:learned --> region:

<!-- BEGIN:learned -->
## Learned conventions
- <!-- id: learned.use-named-exports --> we always use named exports here, not default exports
- <!-- id: learned.validate-input-boundary --> please validate inputs at the API boundary, not deeper
- <!-- id: learned.no-magic-numbers --> extract this 3600 to a named constant
<!-- END:learned -->
```

Review the suggestions, edit them, paste the keepers into AGENTS.md.

## Requirements

- `gh` CLI installed and authenticated (`gh auth status`).
- A repo with merged PRs and review comments. Empty repos produce nothing useful.
- No API keys. No ML dependencies. Just regex, a stopword list, and a five-line stemmer.

## How clustering works

The pipeline:

1. **Fetch** — `gh pr list --state=merged --limit=N`, then `gh pr view <num> --json reviews,comments` for each.
2. **Filter** — keep comments matching teaching phrases:
   - `we (always|usually|never|don't|prefer|tend to|should)`
   - `please (always|never|don't)`
   - `actually (we|let's|i'd)`
   - `should (always|never)? be`
   - `our convention is to`
   - `nit:`
   - `can we`, `could we`, `would prefer`
   Length-bounded: 10 to 1500 chars (skip "LGTM" and architecture essays).
3. **Tokenise** — lowercase, split on non-alphanumeric, drop tokens of length ≤2, drop English stopwords, apply a tiny stemmer (`commits` → `commit`, `validating` → `validat`).
4. **Cluster** — for each comment, compare against each existing cluster's seed (first comment) using Jaccard similarity. Threshold 0.15 — permissive on purpose since proposals get human review before becoming rules.
5. **Filter** — drop singletons (clusters with <2 comments).
6. **Sort** — descending by evidence count.
7. **Format** — one exemplar per cluster (shortest meaningful comment), generate a stable `learned.<slug>` ID from the first 4 non-stopword tokens.

## Tuning

The threshold and filters are constants in `src/commands/learn.ts`. If you find yourself rejecting most proposals, the threshold may need adjustment.

| Constant | Default | Effect of raising | Effect of lowering |
|---|---|---|---|
| `SIMILARITY_THRESHOLD` | `0.15` | Stricter clusters, fewer proposals, higher precision | Looser clusters, more proposals, more false positives |
| Min cluster size | `2` (in `.filter(c => c.comments.length >= 2)`) | Require more evidence per proposal | Ship singletons (high noise) |
| Comment length bounds | `10..1500` chars | Drop more architectural discussions | Include more drive-by nits |
| `CORRECTION_PHRASES` | 7 patterns | More rejection of off-topic comments | More potential signal |

False positives are easier to reject than missed signal is to recover. The defaults err permissive.

## What `aikit learn` doesn't do

- **No auto-PR creation** — output goes to stdout; you copy/paste. (Auto-PR via `gh pr create` is on the roadmap as `aikit learn --pr`.)
- **No embedding-based similarity** — Jaccard on stemmed tokens is enough for the corpus sizes this targets (10s-100s of PRs). Embeddings would add an API key requirement and aren't measurably better at this scale.
- **No Slack / Linear / Jira mining** — only `gh`. Other sources can plug in via the same pipeline if useful.
- **No deduplication against existing rules** — you might propose a rule that already exists in AGENTS.md. Worth checking before pasting.
- **No conversation context** — each comment is treated as isolated text. A nit referencing "the function above" loses that context.

## CI usage

A weekly cron is feasible:

```yaml
# .github/workflows/aikit-learn.yml (not shipped — illustrative)
name: aikit learn weekly
on:
  schedule:
    - cron: "0 9 * * 1"  # Mondays 9am UTC
jobs:
  learn:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: npm install -g haac-aikit
      - run: aikit learn --limit=50 > /tmp/proposals.md
      - uses: peter-evans/create-pull-request@v6
        with:
          title: "weekly: learned conventions from PR review history"
          body-path: /tmp/proposals.md
          branch: aikit-learned-${{ github.run_id }}
```

This isn't shipped in `catalog/ci/` because the right cadence and reviewer assignment vary by team.

## Reference

- `src/commands/learn.ts` — entry, fetch, filter, cluster, output
- Pure functions exported for testing: `isTeachingComment`, `clusterCandidates`, `idFromText`
- `test/learn.test.ts` — 17 tests covering pattern matching, ID generation, and cluster behavior
