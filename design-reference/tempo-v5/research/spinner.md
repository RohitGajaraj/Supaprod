# Spinner

> "Indicate an action running in the background. Unlike the loading dots, this should generally be used to indicate loading feedback in response to a user action, like for buttons, pagination, etc."

Source: https://vercel.com/geist/spinner (fetched 2026-07-10/11, page rendered ~227KB, single Next.js flight payload chunk).

## Sections documented

- **Default** — a single `<Spinner />` at its default size, shown mid-spin with a "Loading..." label alongside it. Demonstrates the bare, zero-prop usage.
- **Sizes** — seven `<Spinner size="..." />` instances rendered side by side (`sm`, `md`, `lg`, `xl`, `2xl`, `3xl`, `4xl`), laid out in a `flex items-end gap-4` row so the different diameters align at the baseline.
- **Colors** — four labeled rows (`Default:`, `Red:`, `Green:`, `Blue:`) each pairing a `w-24` label span with a `<Spinner />`, showing color is controlled purely via Tailwind text-color utility classes passed through `className` (no dedicated `color` prop).
- **Best Practices** (accordion) — three subsections: "When to use", "Behavior", "Accessibility" (paraphrased below).

Every demo section on the page has a "Show code" toggle backed by a raw `tsx` source string embedded in the page's Next.js flight payload (`__rawString__` / syntax-highlighted spans) — no code was hidden or unavailable.

## API

Single component, imported from the shared Geist component package:

```tsx
import { Spinner } from "@vercel/geistcn/components";
```

### Props observed in the examples

- `size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl"` — the only size enum shown; no default size value is spelled out in code (the "Default size" demo renders `<Spinner />` with no `size` prop, implying an internal default distinct from the seven explicit sizes above, or overlapping with one of them, e.g. `md`).
- `className?: string` — used both for color and general style overrides. There is no `color` prop; color is done entirely via Tailwind text-color utilities on `className` (the spinner's stroke/fill presumably reads `currentColor` or an equivalent CSS custom property tied to `text-*`).
- No `label`, `aria-label`, or `busy` prop appears in any example — accessibility is handled by the consuming component (see Best Practices → Accessibility), not by a Spinner-owned prop.

### Usage snippets (verbatim from "Show code")

**Default:**

```tsx
import { Spinner } from "@vercel/geistcn/components";
import type { JSX } from "react";

export function Component(): JSX.Element {
  return <Spinner />;
}
```

**Sizes:**

```tsx
import { Spinner } from "@vercel/geistcn/components";
import type { JSX } from "react";

export function Component(): JSX.Element {
  return (
    <div className="flex items-end gap-4">
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" />
      <Spinner size="xl" />
      <Spinner size="2xl" />
      <Spinner size="3xl" />
      <Spinner size="4xl" />
    </div>
  );
}
```

**Colors:**

```tsx
import { Spinner } from "@vercel/geistcn/components";
import type { JSX } from "react";

export function Component(): JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <span className="w-24">Default:</span>
        <Spinner />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-24">Red:</span>
        <Spinner className="text-red-700" />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-24">Green:</span>
        <Spinner className="text-green-700" />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-24">Blue:</span>
        <Spinner className="text-blue-700" />
      </div>
    </div>
  );
}
```

### Composition patterns implied by the docs (not shown in code, stated in prose)

- `Button` has its own `loading` prop that internally renders/aligns a `Spinner` — don't nest a raw `<Spinner />` inside a button manually; set `loading` on `Button` instead.
- Sibling components to reach for instead of Spinner, per the guidance: `Skeleton` (known layout, async fill), `LoadingDots` (inline copy), `Progress` (determinate/known total work).

## Best practices (paraphrased)

**When to use**

- Reach for Spinner on short, indeterminate, single-action waits — roughly 1-3 seconds: form submits, an inline icon-triggered refresh, a single row's retry action.
- Let `Button`'s `loading` prop own the spinner for submit buttons rather than hand-placing a `Spinner` inside button markup — it keeps size and busy-state semantics consistent.
- Pick a different primitive when the shape of the wait differs: `Skeleton` for filling a layout whose structure you already know, `LoadingDots` for waits that sit inline in a sentence, `Progress` when you can report actual completion percentage.

**Behavior**

- Only mount the Spinner once the async action has actually started; don't pre-render it and toggle visibility with CSS, since a hidden-but-mounted spinner can be caught mid-rotation and looks janky the instant it appears.
- For any wait that might run past about a second, pair the spinner with short state-naming copy ("Verifying...", "Deploying...") so the user knows what they're waiting on, not just that something is loading.
- Size the Spinner relative to the adjacent text or icon it sits next to, not the width/height of its parent container — it's a typographic/icon-scale element, not a layout-filling one.

**Accessibility**

- Put `aria-busy="true"` on the wrapping element of whatever action is in flight, so assistive tech announces the busy-state transition.
- Keep the original trigger (e.g. the button) focusable throughout the load; don't swap it out for a separate detached spinner element, which would drop keyboard focus.
- Respect `prefers-reduced-motion` and avoid layering extra animation effects on top of the spin itself.

## Design notes

- **Sizes:** seven discrete size steps exposed via enum: `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`, `4xl`. Exact pixel values are not printed anywhere in the page's markup/text/code — they live inside the compiled `@vercel/geistcn` component styles, not in the docs page itself. Demo row uses `flex items-end gap-4` (16px gap, Tailwind `gap-4`) to line up baselines across sizes.
- **Color mechanism:** no `color` enum prop exists. Color is entirely `className`-driven via Tailwind text-color utilities: `text-red-700`, `text-green-700`, `text-blue-700` demoed; the unstyled default presumably resolves to a neutral/foreground token (likely `currentColor` inheriting from ambient text color, consistent with an SVG `stroke="currentColor"` or similar implementation, though the actual SVG/CSS internals are not exposed in the docs page — only the public className contract is documented).
- **No visible design tokens** (`--ds-*`, `material-*`, `text-label-14`, etc.) appear anywhere in the visible prose, code samples, or plain-text extraction for this page — Spinner's docs surface is unusually thin on token references compared to components with denser anatomy sections; only the Tailwind-level `text-{color}-{shade}` classes are shown.
- **Motion:** described only in prose, not with concrete timing values — "spins" continuously while mounted; guidance to honor `prefers-reduced-motion` implies the underlying implementation should gate/replace the rotation animation under that media query, but no duration/easing curve is stated in the docs.
- **Layout composition in demos:** labeled rows use `w-24` (96px) fixed-width label spans + `flex items-center gap-4` to align the label and spinner; the outer wrapper for the Colors demo is `flex flex-col gap-4`.
- **Package import path:** `@vercel/geistcn/components` (note: `geistcn`, not `geist` — likely the shadcn-style code-distribution package backing Geist's own site, distinct from any raw `@vercel/geist` icon/asset package).

## Notes on fetch / extraction

- No 404s or slug variants needed — `https://vercel.com/geist/spinner` resolved directly and cleanly, 227KB HTML.
- All three "Show code" examples were present as both syntax-highlighted JSX (broken into per-token spans) and as a raw un-highlighted `__rawString__` template literal in the same flight payload chunk — the raw strings were used verbatim above for accuracy.
- The page's left-nav component list was also captured in passing (visible in the plain-text dump) and confirms `Spinner` sits alphabetically between `Snippet` and `Split Button` in Geist's Components section — not otherwise relevant to this component's spec.
- Cached raw files kept for reference: `.cache/spinner.html` (raw fetch), `.cache/spinner_text.txt` (stripped visible text), `.cache/spinner_flight.txt` (decoded flight payload).
