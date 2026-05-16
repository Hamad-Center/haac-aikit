# Scenario 03 — Build a design system from a described screenshot

## Task

Below is a detailed description of a screenshot of an existing product's UI.
Build a `DESIGN.md` file that codifies the design language captured by the
screenshot, in marker-bounded sections so every AI tool reading the repo can
produce visually-consistent work.

## The screenshot (described)

> The screenshot shows a developer-tool settings page. The overall feel is
> dense, technical, and modern — somewhere between a terminal aesthetic and
> a polished IDE.
>
> **Background:** very dark navy, almost black — `#0E1116`. Surfaces (cards,
> input fields) sit on a slightly lighter `#161B22`. Inputs have a faint
> 1px border in `#30363D`.
>
> **Text:** primary text is a near-white off-tone, `#E6EDF3`. Secondary text
> and labels are `#7D8590`. There is no other text color used.
>
> **Accent:** a vivid electric green, `#2EA043`, used only for primary action
> buttons and the active-tab indicator. Hover state of the green is a slightly
> darker `#238636`.
>
> **Destructive action color:** a warm red, `#DA3633`, only on the "Delete
> account" button and the unsaved-changes warning banner.
>
> **Typography:** the entire interface is set in `"JetBrains Mono"` with
> system monospace fallbacks. No serifs, no sans-serif. Body 14px, labels
> 12px, headings 18px and bold.
>
> **Layout:** a left sidebar of 240px width with section navigation; the
> main content area is 720px wide, centered in the remaining space. Cards
> use 1px borders, 6px border-radius, and 16px internal padding. Section
> headings inside the cards use 24px of bottom margin. The whole page has
> 32px of padding around its content.
>
> **No shadows, no gradients. No animations.** Active tab gets a 2px green
> bottom border; hover states use color changes only, never elevation.

## Output instructions

Produce the **full content of `DESIGN.md`** and nothing else. No prefatory
commentary, no markdown code-fence around your output, no closing remarks.
The first character of your reply is the first character of the file.

The file should be readable by any AI tool that loads it as context, so favor
explicit, descriptive language. The project root will commit this file alongside
`AGENTS.md`.
