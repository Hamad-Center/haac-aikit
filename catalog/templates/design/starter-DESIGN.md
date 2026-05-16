# DESIGN

The visual contract for this project. Every AI tool reads this file alongside `AGENTS.md`. Edit a single section with `/design refine "<change>"` — the marker engine preserves the rest.

<!-- BEGIN:haac-aikit:section:atmosphere -->
## Atmosphere

One paragraph capturing the overall mood. Adjectives, not jargon. State the project's design *temperament* — quiet or loud, formal or playful, sparse or dense. Reference texture (grain, hairlines, drop shadows) and movement (still, hover-only, animated).

*Placeholder — replace via `/design` bootstrap with input from screenshot, HTML, URL, or design brief.*
<!-- END:haac-aikit:section:atmosphere -->

<!-- BEGIN:haac-aikit:section:colors -->
## Colors

Every color is described by **hex code in inline `code` ticks** plus a plain-language description. The showroom binds color pickers to these hex codes — framework token names will not be detected.

| Role | Hex | Description |
|---|---|---|
| Background | `#FAFAFA` | A near-white off-tone. Less clinical than pure white. |
| Ink | `#1A1A1A` | Off-black for body text. |
| Accent | `#D97757` | A warm terracotta clay — use sparingly for emphasis and links. |
| Muted | `#787878` | Mid-gray for secondary copy and metadata. |
| Surface | `#FFFFFF` | Pure white for cards and inputs sitting on the background. |
| Hairline | `#E5E5E5` | Subtle border between regions. |

Dark mode (when applicable): invert ink ↔ background, soften the accent to `#E08C70`, lift hairlines to `#2A2A2A`.

*Placeholder palette — replace via `/design` bootstrap.*
<!-- END:haac-aikit:section:colors -->

<!-- BEGIN:haac-aikit:section:typography -->
## Typography

Quote font stacks in full so they survive the absence of any single typeface.

- **Headlines:** `ui-serif, Georgia, "Times New Roman", serif` — used for h1/h2. Weight 600. Tight tracking: `letter-spacing: -0.01em`.
- **Body:** `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`. Weight 400. `line-height: 1.55`.
- **Mono:** `ui-monospace, "SF Mono", "Fira Code", "JetBrains Mono", monospace`. Used for inline `code` and command examples.

Scale (modular, 1.25 ratio):

| Element | Size |
|---|---|
| h1 | 36px |
| h2 | 24px |
| h3 | 18px |
| Body | 16px |
| Small | 13px |

*Placeholder type stack — replace via `/design` bootstrap.*
<!-- END:haac-aikit:section:typography -->

<!-- BEGIN:haac-aikit:section:components -->
## Components

Key primitives. Each component is described by shape, border, and states.

### Buttons

- **Primary:** background `#1A1A1A`, ink `#FAFAFA`, border-radius `6px`, padding `8px 16px`. Hover: background `#2D2D2D`. No drop shadow.
- **Secondary:** background transparent, ink `#1A1A1A`, border `1px solid #E5E5E5`. Hover: border `#1A1A1A`.

### Cards

- Background `#FFFFFF`, border `1px solid #E5E5E5`, border-radius `10px`, padding `18px 20px`.
- Hover: border shifts to accent (`#D97757`), no shadow.

### Inputs

- Background `#FFFFFF`, border `1px solid #E5E5E5`, border-radius `6px`, padding `8px 12px`.
- Focus: border `1px solid #D97757`, no outline ring.

*Placeholder components — replace via `/design` bootstrap.*
<!-- END:haac-aikit:section:components -->

<!-- BEGIN:haac-aikit:section:layout -->
## Layout

Numerical, not adjectival. Quote pixel widths and breakpoints.

- **Content column:** `720px` max-width, centered. Padding `64px 24px 96px` (top, sides, bottom).
- **Gutters:** `24px` horizontal padding inside the column.
- **Section rhythm:** `64px` vertical space between major sections.
- **Card grid:** 2 columns at full width with `12px` gap. Drops to 1 column under `600px`.
- **Breakpoints:** mobile <`600px`, tablet `600px–960px`, desktop >`960px`.

*Placeholder layout — replace via `/design` bootstrap.*
<!-- END:haac-aikit:section:layout -->
