# Plan: Feedback Form

## Group 1 — Database

1. Add a `feedback` table migration to `src/db/migrate.ts`:
   - `id` INTEGER PRIMARY KEY AUTOINCREMENT
   - `name` TEXT NOT NULL
   - `email` TEXT (nullable)
   - `message` TEXT NOT NULL
   - `rating` INTEGER NOT NULL (1–5)
   - `created_at` TEXT NOT NULL DEFAULT (datetime('now'))
2. Add `Feedback` type to `src/db/types.ts`.
3. Add feedback CRUD helpers to `src/db/index.ts`:
   - `getAllFeedback(): Feedback[]`
   - `createFeedback(data): Feedback`
4. Add seed entries to `src/db/seed.ts` — 3–5 plausible feedback rows.

## Group 2 — Components

5. Create `src/components/FeedbackForm.tsx` with form fields (name, email, message, rating), action `POST /feedback`, in-world label and placeholder copy from requirements, and HTML5 required attributes on required fields.
6. Create `src/components/FeedbackList.tsx`: accepts `Feedback[]` prop, renders each entry (name, rating, message, date), empty state copy: "No feedback yet. Be the first agent to share your experience."

## Group 3 — Page & Route

7. Create `src/pages/Feedback.tsx`: composes `<Layout>` + `<FeedbackForm>` + `<FeedbackList>`.
8. Create `src/routes/feedback.tsx`:
   - `GET /feedback` — fetch all feedback, render `<Feedback>` page.
   - `POST /feedback` — validate inputs, call `createFeedback`, redirect to `GET /feedback`.
9. Register the feedback router in `src/app.tsx`.

## Group 4 — Navigation

10. Add a "Feedback" link to `src/components/Header.tsx`.

## Group 5 — Tests

11. Add to `tests/db.test.ts`: test `createFeedback` and `getAllFeedback`.
12. Add to `tests/app.test.tsx`:
    - `GET /feedback` returns 200.
    - `POST /feedback` with valid data redirects to `/feedback`.
    - `POST /feedback` with missing required fields returns 400 or re-renders with error.
13. Add to `tests/components.test.tsx`:
    - `FeedbackForm` renders all four fields.
    - `FeedbackList` renders entries and empty state.

## Group 6 — Verify

14. Run `npm run typecheck` — must exit 0.
15. Run `npm test` — must exit 0.
16. Run `npm run dev`, open `/feedback`, submit a form, confirm the new entry appears after redirect.
