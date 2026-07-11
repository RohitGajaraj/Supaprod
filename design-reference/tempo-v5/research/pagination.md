# Pagination

> "Navigate to the previous or next page." — Geist Design System

Source: https://vercel.com/geist/pagination (fetched 2026-07-10/11)

This is one of Geist's smallest documented components: a single demo section
plus a Best Practices accordion. There is no Sizes / Types / Variants /
States gallery on this page — the component only ships one visual form (a
two-slot previous/next rail).

## Sections documented

- **Default** — the only demo on the page. Renders a two-item rail: a
  "Previous" slot pointing at a page titled "Home" (`href: '#'`) on the left,
  and a "Next" slot pointing at a page titled "Introduction" (`href: '#'`) on
  the right. Shown with a "Show code" toggle that reveals the JSX below.
- **Best Practices** — a bulleted accordion of usage rules (no separate
  "When to use" / "Behavior" / "Accessibility" sub-headings on this page —
  it's a single flat bullet list covering all three).

No other sections (no Sizes, Types, Variants, States, edge cases, or
composition patterns beyond the one shown) are present in the page payload.

## API

Single component, imported from the shared Geist React package:

```tsx
import { Pagination } from "@vercel/geistcn/components";
```

### Usage (the only example on the page)

```tsx
import { Pagination } from "@vercel/geistcn/components";
import type { JSX } from "react";

const prev = {
  title: "Home",
  href: "#",
};

const next = {
  title: "Introduction",
  href: "#",
};

export function Component(): JSX.Element {
  return <Pagination next={next} previous={prev} />;
}
```

### Props (inferred from the example — this is the full surface shown)

- `Pagination`
  - `previous?: { title: string; href: string }` — optional. When present,
    renders the left "Previous" slot linking to `href`, labeled with
    `title`. When omitted, the best-practices text implies the slot is
    hidden entirely (not rendered disabled/dimmed) rather than shown greyed
    out.
  - `next?: { title: string; href: string }` — optional. Same shape as
    `previous`, renders the right "Next" slot.

No other props, slots, or subcomponents are documented on this page (no
`size`, no `variant`, no icon-override prop, no numbered-page-index prop —
Pagination here is purely a sibling prev/next rail, not a numbered pager
component).

### Composition pattern

Single top-level component, no compound/subcomponent composition (no
`Pagination.Item`, `Pagination.List`, etc. shown). Both directions are
passed as plain data objects (`{ title, href }`), not as children/render
props.

## Best practices (paraphrased)

- **When to use**: reach for Pagination when navigating between sibling
  pages in a fixed sequence — docs articles, blog posts, onboarding steps.
  It is not the right pattern for revealing more items from the same
  dataset/list (use a "Show More" button or a numbered pager for that
  instead).
- **Content rules**:
  - `previous.title` / `next.title` should be the actual destination page
    name (e.g. "Deploy Hooks", "Environment Variables"), not a generic
    label.
  - Geist already renders the "Previous"/"Next" word, the directional
    chevron, and the accessible name — don't add your own arrow glyphs or
    prepend "Go to" text to the title yourself.
  - Never restate ordinal position ("Page 3 of 10") inside a title —
    Pagination is a sibling-link control, not a numbered pager, so ordinal
    language doesn't belong in the slot text.
  - Keep titles Title Case and short enough to avoid wrapping in the rail;
    since long titles truncate, front-load the most distinctive word first.
- **Behavior / empty-state rule**: when there is no sibling in a given
  direction (start or end of a sequence), omit/hide that slot rather than
  rendering it disabled — an absent slot reads cleaner than a dimmed,
  unclickable one.
- **Accessibility**: the component auto-generates an accessible name of the
  form `Go to {direction} page: {title}` for each link (i.e. it composes the
  direction word + the destination title into the aria-label), so authors
  never need to author their own aria-label or duplicate "Go to" in visible
  text.

## Design notes

- Rendered DOM/markup for the styled code samples is theme-tokenized (the
  syntax-highlighted `<pre data-theme="light">` / `<pre data-theme="dark">`
  blocks use standard Prism-like literal hex colors for tokens — e.g.
  keyword `#D73A49`/`#F97583`, plain text `#24292E`/`#E1E4E8`, string
  literal `#032F62`/`#9ECBFF` for light/dark respectively — these are the
  code-block syntax colors, not the component's own design tokens; no
  component-specific `--ds-*`/`material-*` custom property or Tailwind class
  name is exposed anywhere in the page's markup or code samples).
- No numeric sizing (px height/width), border radius, or spacing token is
  visible anywhere in the captured payload — Geist does not expose those
  values on this documentation page; the only visual facts confirmed are:
  - two-slot horizontal layout (previous on the left, next on the right)
  - each slot shows a directional chevron plus the direction word
    ("Previous" / "Next") and, presumably below or beside it, the
    destination `title` (per the rendered example: "Previous" over
    "Home", "Next" over "Introduction")
    Exact spacing/typography/color tokens for the live component itself are
    not present in the static payload — pulling them will require inspecting
    the rendered DOM/CSS directly (not available from this static HTML/RSC
    fetch) rather than relying on this page's documented code samples.
- No motion/transition behavior is described anywhere on the page.
- No responsive/breakpoint behavior documented.

## Notes / caveats for the rebuild team

- This page does not expose the component's internal class names, CSS
  variables, or exact pixel metrics — only the public prop API and usage
  guidance. To pixel-match, cross-reference a live rendered DOM inspection
  (e.g. via browser devtools) separately; this document captures everything
  the static documentation page itself contains.
- Only one JSX code example exists on the entire page (the Default demo);
  there is no Sizes/Types/Variants/States gallery to enumerate, unlike
  larger Geist components.
- Fetch was clean: HTTP 200, ~131KB HTML, single Next.js flight payload
  chunk, fully parsed — no 404s or slug variants were needed.
