# Load More Button

> "A full-width button used to append more items to a paginated list, with loading and styling variants."

Source: https://vercel.com/geist/load-more-button (Geist Design System, component group: Components, alphabetically between "Loading Dots" and "Menu")

## Sections documented

- **Default** — a plain `LoadMoreButton` with the default label "Load More"; full-width, standard border radius and gap treatment.
- **Loading** — `loading` prop set; button renders "Loading..." as its label alongside a loading-dots indicator (the "Loading Dots" component is the linked sibling primitive used for this state), presumably non-interactive while loading.
- **No Gap** — `noGap` prop; removes whatever default spacing/margin the button normally reserves around itself (used when the button must sit flush against adjacent list items with no gap above it).
- **No Border Radius** — `noBorderRadius` prop; renders the button with square corners, for use when it's flush against a container that has no rounded corners (e.g. bottom of a bordered card/table).
- **Custom Text** — demonstrates that the button's label is just its children; shown with the string "Show More Results" instead of the default "Load More", proving the label is fully overridable via `children`.

No "Best Practices" (When to use / Behavior / Accessibility) accordion is present on this page — confirmed absent from both the rendered HTML and the Next.js flight payload. The only prose on the page is the one-line component description above.

## API

Single component, no documented subcomponents.

```tsx
import { LoadMoreButton } from '@vercel/geistcn/components';
```

### Props (all seen in the live code examples)

- `children` — `ReactNode`. The button's label text. Every example passes it explicitly; the page's convention default label is `"Load More"`.
- `loading` — `boolean` (boolean attribute, passed with no value: `loading`). Puts the button into its loading state; the demo also swaps `children` to `"Loading..."` at the same time, implying the component does not auto-swap the label text itself.
- `noGap` — `boolean` (boolean attribute: `noGap`). Removes the default outer gap/margin.
- `noBorderRadius` — `boolean` (boolean attribute: `noBorderRadius`). Removes corner rounding.

### Usage snippets (from the page, verbatim)

Default:
```tsx
import { LoadMoreButton } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return <LoadMoreButton>Load More</LoadMoreButton>;
}
```

Loading:
```tsx
import { LoadMoreButton } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return <LoadMoreButton loading>Loading...</LoadMoreButton>;
}
```

No Gap:
```tsx
import { LoadMoreButton } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return <LoadMoreButton noGap>Load More</LoadMoreButton>;
}
```

No Border Radius:
```tsx
import { LoadMoreButton } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return <LoadMoreButton noBorderRadius>Load More</LoadMoreButton>;
}
```

Custom Text:
```tsx
import { LoadMoreButton } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return <LoadMoreButton>Show More Results</LoadMoreButton>;
}
```

### Composition pattern

- Package: `@vercel/geistcn/components` (the "geistcn" shadcn-flavored distribution of Geist — not a plain `@vercel/geist` import).
- Import is always a single named import, `LoadMoreButton`, with no companion parts (no `.Root`/`.Icon`/`.Label` subcomponents documented).
- All boolean props are passed as bare JSX boolean attributes (`loading`, `noGap`, `noBorderRadius`), never `loading={true}` — consistent with the rest of Geist's prop conventions.
- The component is meant to be dropped at the bottom of a list/feed as the sole action; it is full-width by default (per the one-liner: "A full-width button").

## Best practices

Not documented on this page — Vercel did not ship a Best Practices / When-to-use / Behavior / Accessibility accordion for Load More Button (unlike some other Geist components that have one). The bullets below are our own inference from the prop surface and naming, not sourced from the page — flag them as inferred when reusing:

- Use it as the single, full-width action at the end of a paginated/infinite list, not as a general-purpose button.
- Swap its label and toggle `loading` together when a fetch is in flight; don't leave stale "Load More" text showing during a request.
- Reach for `noGap` / `noBorderRadius` only when the button is composed directly against another bordered/rounded container (e.g. the last row of a table or list) and needs to look seamless with it.
- Keep the label short and outcome-oriented; the component accepts arbitrary text (see "Show More Results") so match the surrounding content's terminology instead of hard-coding "Load More" everywhere.

## Design notes

Concrete, observable facts pulled from the page's live code/demo. Exact tokens, pixel sizes, and colors are not exposed in the static markup or flight payload — the page renders through compiled Geist CSS classes not visible in a static fetch, so this is everything actually observable, not a token dump:

- **Full-width by default** — stated explicitly in the one-line description; there's no `fullWidth`-style prop, so full width is baseline behavior, opted out of only via the consumer's own wrapper/layout.
- **Boolean-attribute API surface** — three independent modifier flags (`loading`, `noGap`, `noBorderRadius`), each demonstrated in isolation (not combined) on the page.
- **Loading state pairs with a separate "Loading Dots" component** — the sidebar component list places "Loading Dots" immediately after "Load More Button"; the Loading demo's label is plain text ("Loading...") with the implication that a dots indicator renders alongside/inside the button during the loading state. No dot markup/animation detail is exposed in the static HTML.
- **No color/size/radius token values are present in the fetched HTML** — the Next.js flight payload only carries syntax-highlighted code strings (generic Shiki/rehype-pretty-code highlighter colors like `#F97583` for keywords, `#9ECBFF` for strings — these are theme colors for the code block, NOT component design tokens) plus the plain-text demo labels. No `--ds-*` / `material-*` / `text-label-*` class names appear anywhere on this component's page.
- **Variants are additive modifiers, not a closed enum** — unlike components with a `variant="primary"|"secondary"` prop, Load More Button's demoed states (Default, Loading, No Gap, No Border Radius, Custom Text) are independent boolean toggles plus free-form children, not a named variant set.

### Gaps that would need a live browser session to fill

- Exact pixel height/padding of the button, corner radius value when rounded, and gap size when not suppressed.
- The literal CSS custom properties / utility class names Geist compiles to (e.g. `--ds-gray-*`, `material-*`) — none appear in the server-rendered HTML or flight payload for this page.
- Disabled-state styling/behavior (not demonstrated on the page at all — may not be a distinct state from `loading`).
- Exact loading-dots animation (timing/easing), since Loading Dots is a separate, unexpanded component on this page.
