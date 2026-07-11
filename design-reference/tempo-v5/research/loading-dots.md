# Loading Dots

> "Indicate an action running in the background." (Geist frontmatter description; page title: "Loading Dots")

Source: https://vercel.com/geist/loading-dots — fetched via raw HTML + Next.js RSC flight payload (`self.__next_f.push`), decoded from the embedded MDX-compiled `Component` function (frontmatter `peek: "pagination-default"`). This is a lean component page: exactly two live demo sections plus one Best Practices accordion — no separate props/API table is rendered on the page (Geist auto-doc props tables are absent here; the only documented prop surface is what's visible in the JSX examples: `size` and `children`).

## Sections documented

- **Default** — three `LoadingDots` instances stacked vertically (`size="sm"`, `size="md"`, `size="lg"`) inside a `flex flex-col` wrapper, demonstrating the three named sizes side by side for visual comparison.
- **With text** — a single `size="md"` `LoadingDots` used as a wrapping element around a text label (`<p>Loading</p>`), demonstrating the "dots trail a text label" composition pattern (the component accepts `children` and renders them before/alongside the animated dots).
- **Best Practices** — an accordion with three subsections: "When to use", "Behavior", "Accessibility" (see below).

Demo names embedded in the code (used as `Preview name="..."` identifiers): `loading-dots-default`, `loading-dots-text`.

## API

**Import:**

```tsx
import { LoadingDots } from "@vercel/geistcn/components";
import type { JSX } from "react";
```

**Example 1 — Default (three sizes stacked):**

```tsx
export function Component(): JSX.Element {
  return (
    <div className="flex flex-col items-start justify-between gap-6 flex-initial">
      <LoadingDots size="sm" />
      <LoadingDots size="md" />
      <LoadingDots size="lg" />
    </div>
  );
}
```

**Example 2 — With text (children composition):**

```tsx
export function Component(): JSX.Element {
  return (
    <LoadingDots size="md">
      <p className="text-copy-14 text-gray-900">Loading</p>
    </LoadingDots>
  );
}
```

**Props observed:**

- `size` — enum, one of `"sm" | "md" | "lg"`. Controls the dot diameter (and implicitly the gap/spacing between dots). No numeric px prop is shown in the code examples themselves, though the Best Practices copy references a numeric `size` (dot diameter in px) as an underlying concept — treat the three named sizes as the primary public API and a numeric override as a secondary/advanced escape hatch only if actually present in the shipped component's types (not shown in any example on this page).
- `children` — optional `ReactNode`. When passed (e.g. a `<p>` label), `LoadingDots` wraps the label and the dots together as a single composed unit (label first, animated dots trailing) rather than requiring the caller to place `<LoadingDots />` after their own text node.

**Composition patterns:**

1. Bare, standalone (no children) — three dots animate alone; used when embedding directly after a verb in running copy, e.g. `Saving<LoadingDots />`.
2. Wrapping a text label as `children` — `LoadingDots` renders the label plus dots as one unit; used per the "With text" demo when you want the dots component to own the whole "Label…" composite rather than gluing it manually.

## Best practices

**When to use**

- Reach for Loading Dots for short, indeterminate in-copy waits — appended directly after a verb (`Saving…`, `Building…`), not as a page-level loading state.
- For buttons, use the button's own `loading` prop rather than nesting `LoadingDots` inside the button label.
- Pick the right primitive for the job: Skeleton for layout placeholders, Progress when you know percent-complete, Spinner for icon-sized indeterminate waits, and Loading Dots specifically for inline textual waits.

**Behavior**

- Only override `size` when the default doesn't match the surrounding type scale — don't set it reflexively.
- Keep the label attached to the dots specific to the in-flight action (`Saving`, `Deploying`, `Uploading`) so a wait that stretches past ~1 second still communicates what's happening, not just that something is happening.
- Never pair the dots with an already-completed verb (e.g. `Saved<LoadingDots />`) — the animation itself signals ongoing work, so it contradicts a past-tense label.

**Accessibility**

- Wrap the live region in a container with `aria-live="polite"` so assistive tech announces the in-progress label without yanking focus or interrupting other announcements.
- Treat the dots themselves as purely decorative — meaning lives in the adjacent text, so don't attach an `aria-label` to `LoadingDots` directly.
- Respect `prefers-reduced-motion`, and avoid stacking Loading Dots with a second animated indicator (e.g. a Spinner) on the same line — redundant motion cues add noise, not clarity.

## Design notes

- **Sizes**: three named tokens only, `sm` / `md` / `lg` — no literal pixel values are exposed in the two code demos on this page. (If reimplementing, map these to the nearest Geist type-scale-aligned dot diameters, consistent with how other Geist size enums scale, and confirm against the shipped `@vercel/geistcn` source rather than guessing.)
- **Composition class names seen in the demo wrapper markup** (page chrome, not the component itself): `flex flex-col items-start justify-between gap-6 flex-initial` for the sizes-stacked demo container.
- **Text label styling** used alongside the dots in the "With text" demo: `text-copy-14 text-gray-900` on the `<p>` — i.e. the label is set at the `copy-14` type scale in the neutral `gray-900` foreground token, not a heading or accent color. This implies Loading Dots is designed to sit inline with body-copy-level text, not display type.
- **No color-by-state tokens** are shown — the component has no visible error/warning/success variant in this page's examples; it is a single-purpose "in progress" indicator only (contrast with Status Dot, which does carry state colors).
- **Motion**: not spelled out in the extracted prose (no frame-by-frame animation timing is documented on the page itself), but the Best Practices section confirms it is a continuous/looping animation implying ongoing work, must respect `prefers-reduced-motion`, and should not be combined with another moving indicator in the same line of text.
- **Related/adjacent primitives referenced for delegation**: `Button` (has its own `loading` prop — don't nest dots inside button labels), `Skeleton` (layout placeholders), `Progress` (determinate/known-percent waits), `Spinner` (icon-sized indeterminate waits). These are the four components Geist's own docs point to as "use this instead" alternatives depending on context.
- **No separate props/API reference table exists on this page** — every prop-level fact above is inferred strictly from the two JSX code samples plus the Best Practices prose; there is no `interface LoadingDotsProps` or generated prop table in the page's flight payload.
