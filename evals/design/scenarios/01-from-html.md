# Scenario 01 — Extract a design system from pasted HTML

## Task

You have been given the HTML below. Build a `DESIGN.md` file that captures the
project's visual language in marker-bounded sections so every AI tool reading
the repo (Claude Code, Cursor, Copilot, etc.) can produce visually-consistent
work.

## Input HTML

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      background: #F5F1EB;
      color: #2A2520;
      font-family: "Crimson Pro", Georgia, serif;
      line-height: 1.6;
      max-width: 640px;
      margin: 0 auto;
      padding: 56px 24px;
    }
    h1 { font-size: 38px; font-weight: 600; letter-spacing: -0.015em; margin: 0 0 16px; }
    h2 { font-size: 22px; font-weight: 600; margin: 32px 0 8px; }
    a { color: #B85C38; text-decoration: none; border-bottom: 1px solid #D9C9B6; }
    a:hover { color: #2A2520; border-bottom-color: #B85C38; }
    .card { background: #FFFFFF; border: 1px solid #D9C9B6; border-radius: 4px; padding: 20px 24px; }
    .card + .card { margin-top: 12px; }
    .meta { font-family: "JetBrains Mono", ui-monospace, monospace; font-size: 12px; color: #806B5A; letter-spacing: 0.04em; text-transform: uppercase; }
    button { background: #2A2520; color: #F5F1EB; border: none; border-radius: 2px; padding: 10px 20px; font-family: inherit; font-size: 15px; cursor: pointer; }
    button:hover { background: #B85C38; }
  </style>
</head>
<body>
  <h1>Letters from the field</h1>
  <p>A monthly dispatch on craft, attention, and the slow web.</p>

  <article class="card">
    <div class="meta">2026 / SPRING</div>
    <h2>On hairlines</h2>
    <p>The cheapest border weight is also the most generous.
       <a href="#">Continue reading</a>.</p>
  </article>
  <article class="card">
    <div class="meta">2026 / WINTER</div>
    <h2>Against the grain</h2>
    <p>Why we still pull paper off a press.
       <a href="#">Continue reading</a>.</p>
  </article>

  <button type="button">Subscribe</button>
</body>
</html>
```

## Output instructions

Produce the **full content of `DESIGN.md`** and nothing else. No prefatory
commentary, no markdown code-fence around your output, no closing remarks.
The first character of your reply is the first character of the file.

The file should be readable by any AI tool that loads it as context, so favor
explicit, descriptive language. The project root will commit this file alongside
`AGENTS.md`.
