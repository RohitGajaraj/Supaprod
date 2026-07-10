# Error Card

> "A card used to communicate an error state with a title and message."

Source: https://vercel.com/geist/error-card (Geist Design System, Vercel). Page fetched 2026-07-10/11; the raw HTML is server-rendered plus a Next.js flight payload (`self.__next_f.push`) carrying the syntax-highlighted code examples. This is a very minimal Geist doc page — no variant matrix, no props table, and no "Best Practices" accordion are present on the live page (unlike richer components such as Badge or Modal). Everything documented below is everything the page contains.

## Sections documented

- **Default** — the only demo section on the page. Renders one `ErrorCard` with a `title` and a `message`, behind a "Show code" toggle (`Preview name="error-card-default"`). No Sizes, Types, Variants, States, or layout sections exist for this component on the live page.
- **Was this helpful? / Give feedback** — the standard page-footer feedback widget (thumbs up/down, comment box), not component-specific.
- **Prev/Next pager** — site chrome linking to the adjacent sidebar entries ("Error" before, "Feedback" after in the components list).

No "Best Practices" (When to use / Behavior / Accessibility) accordion exists on this page — Error Card is one of the sparser Geist entries, documented by a single default example only.

## API

Single import, no subcomponents:

```tsx
import { ErrorCard } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return (
    <ErrorCard
      message="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod"
      title="No credits left"
    />
  );
}
```

**Props observed (only two, both string):**
- `title: string` — short heading (example: `"No credits left"`).
- `message: string` — longer descriptive body text (example: `"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod"`).

No other props (`onRetry`, `retry`, `action`, `variant`, `size`, `digest`, `reset`) appear anywhere in the page's flight payload — confirmed by exhaustive search of the decoded JSX tree. This strongly suggests `ErrorCard` in the current Geist registry is a presentational, single-composition component: title + message only, no built-in action/retry slot and no size/variant enum. (If a richer API exists in the underlying `@vercel/geistcn` package beyond what this doc page shows, it is not reflected on the public page and should be treated as undocumented here.)

There is no compound/sub-component pattern (no `ErrorCard.Title`, `ErrorCard.Action`, etc.) — it is a flat component taking both strings directly.

## Best practices

Not published for this component. (Contrast with other Geist components that carry a When to use / Behavior / Accessibility accordion — Error Card has none live on the page as of this fetch.) Recommended fallback guidance for our own implementation, inferred from the naming and the single example shown:

- Use it for a self-contained error/empty-state block inside a page or panel (e.g., "No credits left"), not for transient toasts — Geist has a separate `Toast` component for that.
- Keep `title` short (a few words, states the failure) and `message` as the one-sentence explanation/next step.
- Because there's no built-in action prop, any "Retry" / "Upgrade" button is composed by the caller alongside the card, not passed as a prop.
- Treat it as a leaf/display component: no documented internal state, so accessibility responsibility (focus management, live-region announcement on appearance) sits with the caller.

## Design notes

- Registry/package: `@vercel/geistcn/components` (the `geistcn` CLI-installable Geist port used across these docs, distinct from any internal Vercel-only package).
- Component slug/preview id: `error-card-default`.
- No CSS custom properties (`--ds-*`), token classes (`material-*`, `text-label-14`, etc.), pixel sizes, radii, or state colors are exposed anywhere in the page's HTML, metadata, or flight payload — the actual visual rendering happens inside a live preview iframe/sandbox that this static fetch does not include, and Geist does not inline the compiled class names into the docs page markup for this component. No motion behavior is described either.
- Practical implication for pixel-close re-implementation: this doc page alone is insufficient for exact visual specs (colors, radius, spacing, font sizes). To get concrete token values, the "Show code" for the compiled/rendered output would need to be diffed against a real browser render of the preview iframe (out of scope here since this pass was headless/no-browser), or the same values should be reverse-derived from the shared Geist Card/Banner primitives (Error Card likely composes the base `Card` primitive with an error-role text/icon treatment) which do have token docs on their own pages.
- Page metadata confirms the one-line description used both as page subtitle and OpenGraph description: "A card used to communicate an error state with a title and message."
