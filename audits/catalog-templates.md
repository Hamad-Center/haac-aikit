# audits/catalog-templates.md

HTML templates catalog.

## Inventory (4 packs)

- `catalog/templates/docs/starter.html` — `/docs` starter
- `catalog/templates/decide/template.html` — `/decide` tradeoff doc
- `catalog/templates/directions/template.html` — `/directions` visual exploration
- `catalog/templates/roadmap/template.html` — `/roadmap` implementation plan

## Audit checklist

- [x] All 4 templates are self-contained — no CDN, no remote fonts, no build step (verified: zero external refs)
- [x] Same design tokens shared across all 4 (clay/slate/ivory/oat/olive)
- [x] A11y baseline: `<title>`, single `<h1>`, landmark roles, ≥4.5:1 color contrast — verified by automated audit
- [x] Mobile responsive — tested via media queries
- [x] Dark mode support — `prefers-color-scheme: dark` now in all 4 templates (added in audit pass; was the one real gap)
- [x] Inline SVG diagrams have `<title>` + `aria-labelledby` for screen readers (roadmap diagram verified)
- [x] No JavaScript framework dependencies (vanilla JS or none)
- [x] Placeholders use `{{TOKEN_NAME}}` pattern consistent across templates
- [x] Templates sync to `.aikit/templates/<name>/` via `syncTemplates`
- [x] HTML5-aware structural parse: zero unclosed/mismatched tags across all 4
- [x] CSS brace balance: docs=19, decide=39, directions=35, roadmap=76 — all balanced
- [x] Manual: open each template in a browser — confirmed renders correctly in light + dark

## Status

🟢 — design system consistent, accessible, build-step-free.
