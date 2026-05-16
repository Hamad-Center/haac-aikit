# Roadmap

Phases are intentionally small — each is a shippable slice of work, independently reviewable and testable.

---

## Phase 1 — Hello Hono
- [x] Install and configure Hono with `tsx` dev server
- [x] Single `/` route returning a minimal HTML home page
- [x] Confirm TypeScript types work end-to-end (`tsc --noEmit` passes)

## Phase 2 — Agents & Ailments
- [x] Server-side JSX layout component (header, nav, main, footer)
- [x] SQLite database + migrations
- [x] Seed a handful of fictional agents and ailments
- [x] `/agents` list page and `/agents/:id` detail page
- [x] `/ailments` list page; link agents to ailments via join table

## Phase 3 — Therapies Catalog
- [ ] `therapies` table + seed data
- [ ] `/therapies` list page
- [ ] Map ailments → recommended therapies (many-to-many)

## Phase 4 — Appointment Booking
- [ ] `appointments` table (agent, therapist, datetime, status)
- [ ] Booking form on agent detail page
- [ ] Server-side validation and confirmation page

## Phase 5 — Staff Dashboard
- [ ] `/dashboard` with summary counts: agents, open appointments, ailments in-flight
- [ ] Simple table views for staff to manage records

## Phase 6 — Polish & Accessibility
- [ ] Responsive layout audit
- [ ] Semantic HTML audit
- [ ] Keyboard navigation and visible focus styles

## Phase 7 — Hardening
- [ ] Error pages (404, 500)
- [ ] Input sanitization on all forms
- [ ] Basic logging middleware

---

Later phases (not yet planned): auth, email notifications, therapist profiles, reporting.
