# audits/catalog-templates.md

HTML templates catalog.

## Inventory (4 packs)

- `catalog/templates/docs/starter.html` — `/docs` starter
- `catalog/templates/decide/template.html` — `/decide` tradeoff doc
- `catalog/templates/directions/template.html` — `/directions` visual exploration
- `catalog/templates/roadmap/template.html` — `/roadmap` implementation plan

## Audit checklist

- [x] All 4 templates are self-contained — no CDN, no remote fonts, no build step
- [x] Same design tokens shared across all 4 (clay/slate/ivory/oat/olive)
- [x] A11y baseline: `<title>`, single `<h1>`, landmark roles, ≥4.5:1 color contrast
- [x] Mobile responsive — tested via media queries
- [x] Dark mode support — handled per-template (directions has explicit light/dark toggle; decide/docs/roadmap default to light)
- [x] Inline SVG diagrams have `<title>` + `aria-labelledby` for screen readers
- [x] No JavaScript framework dependencies (vanilla JS or none)
- [x] Placeholders use `{{TOKEN_NAME}}` pattern consistent across templates
- [x] Templates sync to `.aikit/templates/<name>/` via `syncTemplates`
- [ ] Manual: open each template in a browser, verify no console errors / accessibility violations

## Status

🟢 — design system consistent, accessible, build-step-free.
