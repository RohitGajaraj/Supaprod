# Banner

> "A prominent message that spans the full width of its container to announce important information."

Source: https://vercel.com/geist/banner (Geist Design System, package `@vercel/geistcn/components`)

## Sections documented

The page is minimal — only one demo section exists (no Sizes / Types / Variants / States sections, and no Best Practices accordion were present in the page payload):

- **Default** — the only demo. Shows a full-width message bar containing a bold lead-in phrase (`<b>Big News</b>`) followed by plain text, plus a trailing action link ("Read more") that navigates via an `href`. Rendered with a "Show code" toggle revealing the JSX source.

Notably absent from this component's page (unlike most other Geist components): no "Sizes", "Types"/"Variants", "States" sections, and no "Best Practices" (When to use / Behavior / Accessibility) accordion. Treat Banner as a single-variant, low-configuration primitive in Geist's own system — our re-implementation should not over-engineer variant surface area beyond what's below.

## API

### `Banner` (default export from `@vercel/geistcn/components`)

```tsx
import { Banner } from "@vercel/geistcn/components";
import type { JSX } from "react";

export function Component(): JSX.Element {
  return (
    <Banner button={{ href: "#", content: "Read more" }} className="p-4">
      <b>Big News</b> – New components finally available
    </Banner>
  );
}
```

Observed props (this is the full prop surface shown anywhere on the page):

- `children` (`ReactNode`) — the message content. Free-form JSX; the example bolds the lead-in via a native `<b>` tag, not a dedicated "kicker"/"label" subcomponent.
- `button` (`object`, optional) — describes the trailing call-to-action rendered as a link/button:
  - `href` (`string`) — destination URL for the action.
  - `content` (`string`) — the action's visible label (example: `"Read more"`).
- `className` (`string`, optional) — standard escape hatch for layout overrides; example passes `"p-4"` (Tailwind padding utility) directly through.

No subcomponents are documented (no `Banner.Icon`, `Banner.Action`, etc. — everything is expressed through the two props plus `children`).

### Composition pattern

Banner is used as a single self-closing-content component, not a compound/slot pattern:

```tsx
<Banner button={{ href: "#", content: "Read more" }} className="p-4">
  <b>Big News</b> – New components finally available
</Banner>
```

Bold/emphasis inside the message is done with a plain `<b>` element rather than a styled sub-component — Banner's own CSS targets `b` descendants directly (see Design notes).

## Best practices

No "Best Practices" accordion (When to use / Behavior / Accessibility) was present on this page at capture time — unlike most other Geist components, Banner ships without documented usage guidance. Recommended defaults to carry into our implementation, inferred from the demo and Geist's general conventions elsewhere in the system:

- Use Banner for one prominent, page/section-level announcement (product news, incidents, promos) — not for transient or per-item notices; that's what Toast/Note are for.
- Keep the message to a single short line: a bold lead-in phrase plus a plain continuation clause, optionally paired with one action link.
- Only one action is supported by the API (`button.href` + `button.content`) — don't try to stack multiple CTAs inside a Banner.
- Because it spans "the full width of its container," place it as a top-level block (e.g. above page content or nav) rather than nested inside a constrained card — width is inherited from the parent, so wrap it in a full-bleed container when full-viewport behavior is wanted.
- Since no dismiss/close affordance is exposed in the API, treat Banner as a persistent/static message; if dismissibility is needed, that behavior isn't part of this primitive and would need to be built by the consumer (e.g. conditionally rendering it).

## Design notes

Captured from the live SSR markup of the "Default" demo on the docs page (this is Geist's own docs-site chrome reusing the Banner-shaped component for its "New components" callout, so treat these as representative, real observed values rather than the library's internal source):

- **Responsive layout switch**: the demo renders two markup variants gated by Tailwind breakpoints — a compact pill/button form for small viewports (`lg:!hidden`) and a full bar for `hidden lg:flex` (desktop, `≥1024px`). This suggests Banner (or its host container) collapses to a smaller pressable pill below the `lg` breakpoint and expands to a full-width bar at `lg` and above.
- **Desktop bar container**: `max-w-[1080px] w-full … flex items-center justify-center gap-3 p-4` — content is centered with `gap-3` (12px) between message and action, capped at 1080px, with `p-4` (16px) padding all sides (this matches the `className="p-4"` passed in the JSX example).
- **Bold-text styling rule**: `[&_b]:text-[var(--ds-gray-1000)] [&_b]:font-semibold` — any `<b>` inside Banner is force-styled to the darkest gray token (`--ds-gray-1000`) at `font-semibold`, regardless of surrounding text color. This is the mechanism for the "Big News" emphasis in the example.
- **Body text**: `<p class="text-copy-16 text-gray-900">` — message paragraph uses the `text-copy-16` type scale (16px body copy) and `--ds-gray-900` color for the non-bold portion.
- **Action link/button (desktop "Read more")**: rendered as `<a role="link">` (via React Aria press handling, `data-react-aria-pressable`), styled as a pill-shaped mini-button:
  - `!rounded-full` — fully rounded pill shape.
  - `[--height:32px]` — 32px control height.
  - `[--x-padding:6px]` with `!px-(--geist-gap-half)` — compact horizontal padding token.
  - Colors via themed CSS custom properties: `--themed-bg: var(--ds-background-100)`, `--themed-fg: var(--ds-gray-1000)`, `--themed-border: var(--ds-gray-400)`, hover `--themed-hover-bg: var(--ds-gray-alpha-200)`.
  - `shadow-[0_0_0_1px_var(--themed-border,transparent)]` plus `shadow-[var(--ds-shadow-border-small)]` — a 1px inset border simulated via box-shadow (Geist's standard bordered-control technique) rather than a literal `border`.
  - Focus state: `data-[focus]:shadow-[var(--ds-focus-ring)]` — swaps to the shared focus-ring shadow token, no `transition` on focus (`data-[focus]:transition-none`) for instant focus feedback.
  - Font size via `text-(length:--geist-form-small-font)` — ties to the form-control small-text scale rather than a fixed px value.
  - Icon: a 16x16 chevron-right `svg` (`data-slot="geist-icon"`) trails the label text, sized via `--geist-icon-size:16px` and `size-(--ds-control-decoration-size)`.
  - Disabled/aria-disabled states swap to `--ds-gray-700` text on `--ds-gray-100` background and drop the border variable.
- **Compact/mobile pill variant**: same button styling primitives (`rounded-full`, `h-[32px]`) but content is truncated: `<span class="truncate inline-block px-1.5">` wraps the bolded message so it can ellipsis on narrow viewports, with the trailing chevron icon appended after via a second `<span>` (`ml-1 shrink-0 mr-0.5`).
- **Section chrome around the demo** (docs-site scaffolding, not part of Banner itself): the preview sits inside `rounded-lg border border-gray-alpha-400 bg-background-100`, with the code block below toggled via a "Show code" control, and the raw JSX rendered through a syntax highlighter using GitHub-light-ish token colors (`#D73A49` keywords, `#22863A`/`#9ECBFF` strings, `#24292E` body — light theme; `#F97583` keywords, `#9ECBFF` strings, `#E1E4E8` body — dark theme). These are the shared code-block theme tokens, not Banner-specific.
- **No literal `.banner`/`data-geist-banner` class or attribute was found** in the captured HTML — the actual `@vercel/geistcn` `Banner` component itself is client-rendered from a bundled chunk (`I[…]` reference in the RSC flight payload) rather than emitting a stable, greppable class name in this docs-page SSR; the styling observed above comes from the _docs-site's own_ full-width banner using the same visual language, and should be treated as a faithful stand-in for the real component's classes, not a literal export.

## Notes on capture

- Page fetched cleanly (~123KB, single `self.__next_f.push` RSC flight chunk containing MDX frontmatter + all page content).
- `frontmatter` object in the flight payload confirms: `title: "Banner"`, `description: "A prominent message that spans the full width of its container to announce important information."`, `peek: "banner-default"`.
- Only one `<h2>` ("Default") and one `component-preview` block exist in the payload — verified by regex scan, not just visual absence.
- No "Best Practices" text, no "When to use"/"Behavior"/"Accessibility" strings anywhere in the decoded flight payload — this component's docs page genuinely ships without that section (unlike richer components in the system).
- No sub-page links (e.g. no linked "Banner examples" or separate spec page) were found on this page.
