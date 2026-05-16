# Tech Stack

AgentClinic is a server-side TypeScript application. All rendering happens on the server; the browser receives plain HTML that works well and looks good.

## Core

| Layer | Choice | Rationale |
|---|---|---|
| Language | TypeScript | Type safety end-to-end |
| Runtime | Node.js | Stable, well-supported, vast ecosystem |
| Server framework | **Hono** | Lightweight, TypeScript-first, fast, excellent DX |
| Templating | Hono JSX (server-side) | JSX without React overhead; components are just functions |
| CSS | Plain CSS + custom properties | No build step required |

## Data

- **SQLite** via `better-sqlite3` for local development and early production — simple, embedded, no infrastructure.
- Migrations via plain SQL files in `src/db/migrations/`; no ORM.
- Seed data via `src/db/seed.ts` (idempotent).

## Testing

- **Vitest** — fast, TypeScript-native.
- Tests live in `tests/`: `tests/app.test.tsx` (integration), `tests/components.test.tsx` (rendering), `tests/db.test.ts` (database).
- Run with `npm test`.

## Tooling

- `tsx` for development (run TypeScript directly, no build step).
- `tsc` for production builds and `npm run typecheck`.
- `prettier` for formatting.

## What We Are Not Using

- No React, Vue, or Svelte — server-side rendering keeps the stack simple.
- No ORM — SQL is sufficient at this scale.
- No Docker — not yet; that's a later phase concern.
- No client-side JS bundle — forms submit via standard HTML POST.
