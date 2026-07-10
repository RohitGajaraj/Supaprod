# Show More

> "Styling component to show expanded or collapsed content." (page h1 subtitle)

Source: https://vercel.com/geist/show-more · package: `@vercel/geistcn/components` · export: `ShowMore`

## Sections documented

- **Default** — the base `ShowMore` trigger in its collapsed state, wired to local `useState` so clicking toggles `expanded`. Demo id: `show-more-default`.
- **Expanded** — the same component rendered with `expanded` forced `true`, showing the toggled/expanded visual state (label + icon flip). Demo id: `show-more-expanded`.
- **No border** — the `noBorder` variant, which drops the component's default border/divider for use in contexts where the surrounding container already provides a boundary. Demo id: `show-more-no-border`.
- **Best Practices** — a single accordion of five guidance bullets covering when to use it vs. Pagination/Collapse, row-count judgment, labeling with counts, avoiding mid-flow collapse, DOM/lazy-load strategy, and the accessibility contract (see below).

No separate "Sizes", "Types", or "States" sections are documented for this component — it is a small, single-purpose control with just the two boolean props exercised above (`expanded`, `noBorder`).

## API

Component: **`ShowMore`** (default export from `@vercel/geistcn/components`).

Props observed in the example code:
- `expanded: boolean` — controlled flag for the current disclosure state. Consumer owns the state (`useState`) and flips it in the `onClick` handler; the component itself does not manage expand/collapse state internally.
- `onClick: () => void` — click handler on the trigger; typical usage toggles the boolean (`() => setExpanded(!expanded)`).
- `noBorder?: boolean` — when present, removes the component's default top border/divider.

Usage patterns (verbatim minimal examples from the docs):

```tsx
// Default — controlled toggle
import { ShowMore } from '@vercel/geistcn/components';
import { useState, type JSX } from 'react';

export function Component(): JSX.Element {
  const [expanded, setExpanded] = useState(false);

  return (
    <ShowMore expanded={expanded} onClick={() => setExpanded(!expanded)} />
  )
}
```

```tsx
// Expanded — forced-open state for visual reference
import { ShowMore } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return <ShowMore expanded />;
}
```

```tsx
// No border — drop the divider when the parent container already frames the list
import { ShowMore } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return <ShowMore noBorder />;
}
```

Composition: `ShowMore` is meant to sit as the last row/element under a truncated list or block (recent activity, repo branches, attached resources) — it is a single self-contained trigger, not a wrapper around children; the list content above it is rendered/hidden by the consumer based on the same `expanded` state that's passed into the component.

## Best practices (paraphrased)

- Reach for `ShowMore` specifically for progressive disclosure of one long list or block (e.g. recent activity, branches, attached resources). If you have multiple pages of the same data set, use Pagination instead; if you're hiding an optional section rather than truncating a list, use Collapse instead.
- Don't over-truncate: show enough rows before the cutoff (roughly 5-10) that the user can tell what kind of list it is. Cutting off after only 1-2 items makes the control feel like decoration rather than a real affordance.
- Always pair the trigger label with the hidden-item count so the user can gauge the cost of expanding — e.g. "Show 12 More" collapsed, "Show Less" once expanded — and keep both labels in Title Case.
- Treat expand/collapse as a one-way action within a single reading flow: don't auto re-collapse a list the user just expanded, since that yanks the rows they were reading back out of view.
- For small hidden-row counts, keep them in the DOM (just visually hidden) so browser find-in-page still works; only lazy-load/fetch the extra rows when the full dataset is large enough that rendering it up front would hurt initial page performance.
- Accessibility contract: the trigger must be a real `<button>` carrying `aria-expanded` (reflecting the boolean state) and `aria-controls` (pointing at the id of the list it toggles). After expanding, move keyboard/screen-reader focus to the first newly revealed row so users land in the new content rather than staying stranded on the button.

## Design notes

- Frontmatter metadata for the page: `title: "Show more"`, `description: "Styling component to show expanded or collapsed content."`, `peek: "switch-default"` (this `peek` value looks like a copy/paste leftover from the Switch component's docs and is not evidence of a real relationship between the two components).
- No distinct pixel/size/radius/token values are exposed in the captured payload — the only two variant-affecting props visible are the boolean `expanded` (drives label + icon flip between "Show More"/"Show Less" per the best-practices copy) and the boolean `noBorder` (removes a border/divider, implying the default state renders with one, presumably a top border consistent with Geist's row-divider convention elsewhere in the system).
- No `--ds-*` custom-property names, Tailwind class names, or color tokens are visible in the flight payload for this component's own rendering (the CSS is compiled/scoped and not present in this SSR chunk) — for exact colors/spacing/radius, cross-reference the live rendered DOM (this research was headless per instructions, so no computed styles were captured) or the neighboring Pagination/Collapse component pages, which are called out here as the components' closest siblings.
- Motion: not described in the captured text; no transition/duration/easing values appear in the docs prose or example code.
- The docs explicitly position `ShowMore` relative to two other Geist components for choosing the right disclosure pattern: **Pagination** (multiple pages of the same data set) and **Collapse** (an optional section, not a truncated list).
