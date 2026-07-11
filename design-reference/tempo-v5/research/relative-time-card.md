# Relative Time Card

> "Popover to show a given date in local time."

Source: https://vercel.com/geist/relative-time-card (fetched 2026-07-10/11, page title "Relative Time Card", meta description matches the quote above). This is a compact, single-demo reference page — Geist does not document Sizes/Types/Variants/States sections for this component; it only ships one live demo plus a Best Practices block.

## Sections documented — every section on the page

- **Default** — the only live demo/preview section. Shows a `<Button>Hover Me</Button>` wrapped in `<RelativeTimeCard date={...} side="top">`; hovering (or focusing) the trigger opens a popover/hover-card showing the given timestamp in local time (and, per the Best Practices copy, absolute UTC time alongside it). "Show code" toggle reveals the JSX source (both a light-theme and dark-theme syntax-highlighted copy of the identical snippet — these are just the two color-scheme renders of one example, not two separate demos).
- **Best Practices** — a bulleted usage/behavior/accessibility guidance block (no separate accordion sub-headers like "When to use / Behavior / Accessibility" were present in the markup for this component — it's a single flat bullet list under "Best Practices").
- Standard page chrome (not component-specific): theme switcher (system/light/dark), left sidebar with the full Geist component index, "Was this helpful?" feedback widget, Previous/Next pagers linking to neighboring components (Radio before, Scroller after).

## API — component + props + composition

Import path:

```tsx
import { Button, RelativeTimeCard } from "@vercel/geistcn/components";
```

Full minimal usage example (the only JSX example on the page, captured verbatim from the flight payload's raw code string):

```tsx
import { Button, RelativeTimeCard } from "@vercel/geistcn/components";
import type { JSX } from "react";

export function Component(): JSX.Element {
  const date = new Date();
  return (
    <>
      <RelativeTimeCard date={date.getTime()} side="top">
        <Button>Hover Me</Button>
      </RelativeTimeCard>
    </>
  );
}
```

Observed API surface (only what's visible in the one example — no other props/enums are demonstrated on this page):

- **`<RelativeTimeCard>`** (single component, no documented subcomponents like `.Trigger`/`.Content` — it wraps its child directly, Radix-popover-style)
  - `date: number` — required. Pass epoch/Unix milliseconds (`date.getTime()`), not a `Date` object and not a pre-formatted string. This is called out explicitly in Best Practices: "Pass date as a number (Unix ms or epoch)."
  - `side?: "top" | ...` — positions the popover relative to the trigger; only `"top"` is shown in the example. Given this is presumably built on a Radix Popover/HoverCard primitive, treat `side` as very likely accepting the standard Radix `side` union (`"top" | "right" | "bottom" | "left"`) even though only `"top"` appears in the captured markup — flag this as inferred, not confirmed on-page.
  - `children` — the trigger element (here a `<Button>`). Best practice: use children only to render non-time trigger labels ("Just now", "Pending", "Queued") — i.e. children is the visible trigger content, not necessarily literal button text; it can be any state label when the formatter's relative-time string wouldn't apply.
- Composition pattern: `<RelativeTimeCard date={...} side="top"><Button>...</Button></RelativeTimeCard>` — component wraps an arbitrary trigger element (button, table cell text, entity row label, etc.) and attaches hover/focus popover behavior to it.

## Best practices — paraphrased

- Use it for recent/scannable timestamps — table cells, entity rows, deploy lists, activity feeds. For anything older than 7 days shown as static prose, skip the component and just render a formatted absolute date (e.g. "Mar 14, 2026") directly instead.
- Always pass the date as a raw number (epoch ms), never a pre-formatted string, and never manually format the value yourself — the component owns formatting.
- Don't override or duplicate the built-in short relative format (e.g. "2m", "5h", "Yesterday") — it's already the canonical short form.
- Never append "ago" yourself: the formatter's own output already includes it where appropriate ("2m ago", "5h ago"), so adding "ago" again produces a doubled "2m ago ago".
- Reserve `children` for non-time state labels the formatter can't express — "Just now", "Pending", "Queued" — not for arbitrary custom-formatted timestamps.
- If a row's meaning is ambiguous without more context, prefix it with a plain label rather than relying on the component alone, e.g. "Last deploy `<RelativeTimeCard date={ts} />`".
- Don't repeat the absolute-time information elsewhere in the row/UI — the hover popover already surfaces both UTC and the viewer's local time, so restating that copy nearby is redundant.

## Design notes — concrete observable values

- No custom CSS classnames, design tokens (`--ds-*`), or material/text-style tokens were exposed in the captured markup for the component itself — the demo preview area used generic page-chrome classes (`component-preview`, grid-system utility classes) unrelated to the component's internal styling. The component's own visual tokens are compiled into `@vercel/geistcn/components` and not visible from this page's server-rendered HTML/flight payload.
- Page-level typography tokens seen in the surrounding chrome (for reference, not the component itself): `text-heading-24` / `md:text-heading-40` for the H1, `text-copy-16` / `md:text-copy-20` with `text-gray-900` and `line-height: 1.5` for the subtitle paragraph — consistent with Geist's `text-heading-*` / `text-copy-*` naming convention used elsewhere in the design system.
- Behavior is popover/hover-card style: opens on hover (and, per accessibility convention for this family of Radix-based Geist components, should also open on keyboard focus) anchored to the trigger via a `side` prop, consistent with Radix Popover/HoverCard's positioning API.
- No explicit motion/animation description, size variants, or color-by-state tokens were present on the page — this is one of Geist's leanest component pages (single demo, no Sizes/Types/Variants/States sections), so those implementation details are not publicly documented and would need to be inferred from Radix HoverCard/Popover defaults plus Geist's general "Popover" family styling (fade/scale-in transitions, subtle border + shadow "material", per Geist's usual "Materials" documented family — see the separate Materials page if pixel-parity on the popover chrome itself is required).

## Rebuild guidance for our stack

- Base it on Radix `HoverCard` (hover/focus-triggered popover semantics match the described behavior better than Popover, which is typically click-triggered) — implement `side` and `children`-as-trigger the same way Radix does (`HoverCard.Trigger` wraps children, `HoverCard.Content` renders the timestamp body).
- Internally format `date` (epoch ms) into the short relative form ("2m", "5h", "Yesterday", falling back to an absolute date past 7 days) — this logic is not shown on the page and must be authored to match the described rules (short unit, no "ago" duplication, absolute date fallback for old dates).
- Popover content should show both absolute UTC and the viewer's local time, per the Best Practices copy — exact layout/typography of that content isn't shown on the page; default to Geist's existing popover/tooltip content conventions (small mono-caps timestamp lines) until a closer visual reference is available.
