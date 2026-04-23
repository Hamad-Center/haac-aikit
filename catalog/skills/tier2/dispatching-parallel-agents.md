---
name: dispatching-parallel-agents
description: Use when a task can be decomposed into independent sub-tasks that don't share state. Fan out to fresh subagents to work in parallel, then synthesise results. Prevents serialising work that could run concurrently and wastes wall-clock time.
version: "1.0.0"
source: obra/superpowers
license: MIT
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

Use the `Agent` tool with `run_in_background: true` for genuinely parallel tasks. Send multiple tool calls in a single message.
