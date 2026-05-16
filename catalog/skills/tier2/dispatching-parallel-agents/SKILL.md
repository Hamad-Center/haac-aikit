---
name: dispatching-parallel-agents
description: Use when fanning out independent work across files, services, or sources — phrases like "research these in parallel", "do this for each", "fan out". Dispatches multiple `Task` subagents in one message, then synthesises their returns; only safe for read-only / report-producing sub-tasks.
version: "1.0.0"
source: obra/superpowers
license: MIT
allowed-tools:
  - Task
---

## When to use
- Research across multiple files/modules that don't depend on each other
- Running the same operation on several independent targets (e.g. reviewing 4 services)
- Gathering information from multiple sources simultaneously

## Decomposition rules

A sub-task is safe to parallelise if:
1. It requires no output from another concurrent sub-task
2. It does not write to shared state (files, databases, branches)
3. Its result is a summary or report, not a mutation

If any sub-task writes files: do not parallelise — writing conflicts produce unpredictable results.

## Dispatch format

```
Dispatching [N] parallel agents:
- Agent 1: [role] — [specific task] — returns: [expected output format]
- Agent 2: [role] — [specific task] — returns: [expected output format]
- Agent N: [role] — [specific task] — returns: [expected output format]
```

Each agent brief must be self-contained — include file paths, relevant context, and the exact question to answer. The agent has no memory of this conversation.

## Synthesis

After all agents return:
1. Identify agreements and conflicts across their outputs
2. Resolve conflicts explicitly (don't average or ignore them)
3. Produce a unified summary with sources attributed

## Tool

Issue multiple `Task` tool calls in a single assistant message — they execute concurrently. Do **not** use `run_in_background` (that's a `Bash` flag; `Task` has no equivalent). Each `Task` brief is self-contained — the subagent has no memory of this conversation.

## Anti-patterns to avoid

- **Parallelising writes.** Two agents editing the same file produce unpredictable merges. Only parallelise read-only / report-producing work.
- **Passing shared state via the filesystem.** "Agent A writes `/tmp/x.json`, Agent B reads it" reintroduces a sequential dependency hidden under a parallel facade.
- **Not synthesising conflicts.** If two agents disagree, the parent must resolve and explain — silently picking one is data loss.
- **Dispatching when sequential context-sharing would be faster.** A 3-step pipeline where each step feeds the next has zero parallelism to extract; fanning out wastes orchestration overhead.
