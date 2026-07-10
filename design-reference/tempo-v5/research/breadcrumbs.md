# Breadcrumbs

> "Navigation aid that shows the user's location within a site's hierarchy, with text and menu variants."

Source: https://vercel.com/geist/breadcrumbs — fetched as static Next.js flight-rendered HTML (page title "Breadcrumbs"; ~162KB raw HTML, ~70KB decoded flight payload). No 404s, no slug variants needed. This is a small reference page: 3 demo sections, no "Best Practices" accordion (unlike some other Geist component pages — confirmed absent by grepping the decoded flight payload for "best practices" / "when to use" / "accessibility" / "behavior", all zero hits).

## Sections documented

- **Default** — shows both `Breadcrumb` display types side by side: `type="text"` (plain inline trail) and `type="menu"` (each crumb rendered as a dropdown-trigger-capable item), each with three `BreadcrumbItem`s ("Home", "Dashboard", "Overview").
- **Active** — a `Breadcrumb` (default type) with the middle item marked `active` (the current/current-page crumb — "Dashboard").
- **Disabled** — a `Breadcrumb` (default type) with the middle item marked `disabled` (a non-interactive crumb — "Dashboard").

Each section has a rendered live preview plus a "Show code" toggle revealing the exact JSX below.

## API

### `Breadcrumb` + `BreadcrumbItem` (from `@vercel/geistcn/components`)

```tsx
import { Breadcrumb, BreadcrumbItem } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      <Breadcrumb type="text">
        <BreadcrumbItem>Home</BreadcrumbItem>
        <BreadcrumbItem>Dashboard</BreadcrumbItem>
        <BreadcrumbItem>Overview</BreadcrumbItem>
      </Breadcrumb>
      <Breadcrumb type="menu">
        <BreadcrumbItem>Home</BreadcrumbItem>
        <BreadcrumbItem>Dashboard</BreadcrumbItem>
        <BreadcrumbItem>Overview</BreadcrumbItem>
      </Breadcrumb>
    </div>
  );
}
```

**Active state:**

```tsx
import { Breadcrumb, BreadcrumbItem } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return (
    <Breadcrumb>
      <BreadcrumbItem>Home</BreadcrumbItem>
      <BreadcrumbItem active>Dashboard</BreadcrumbItem>
      <BreadcrumbItem>Overview</BreadcrumbItem>
    </Breadcrumb>
  );
}
```

**Disabled state:**

```tsx
import { Breadcrumb, BreadcrumbItem } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return (
    <Breadcrumb>
      <BreadcrumbItem>Home</BreadcrumbItem>
      <BreadcrumbItem disabled>Dashboard</BreadcrumbItem>
      <BreadcrumbItem>Overview</BreadcrumbItem>
    </Breadcrumb>
  );
}
```

**Composition & props observed:**

- `Breadcrumb` — the trail container/wrapper. Renders its `BreadcrumbItem` children with separators between them (separator glyph/markup not present in the static HTML — it's produced by the live component render, which this page loads into a lazy preview slot rather than shipping in the initial payload).
  - `type`: `"text" | "menu"` — optional prop, defaults to a plain trail (equivalent to `"text"`) when omitted (the Active/Disabled examples don't pass `type` at all). `"text"` renders each crumb as plain inline text/links; `"menu"` renders each crumb as a trigger capable of opening a dropdown menu of sibling/child pages at that level (the standard breadcrumb-with-overflow-menu pattern).
- `BreadcrumbItem` — a single crumb. Takes plain text children (no icon/leading-element prop observed in these examples).
  - `active`: boolean prop — marks the crumb representing the current page. Only one item carries this in the example (the last non-terminal item shown, "Dashboard" — note the example nests it as the *middle* item, not necessarily meaning only the last item may be active; it simply demonstrates the prop on one item).
  - `disabled`: boolean prop — marks a crumb as non-interactive (no navigation), still rendered but visually and functionally inert.
  - No `href`/`onClick` prop is shown in any example — link/navigation wiring is not demonstrated on this page (crumbs may default to plain text or the wiring is elided from the minimal demo source).

No other subcomponents (e.g. a separate `BreadcrumbSeparator`, `BreadcrumbMenu`, `BreadcrumbEllipsis`) are referenced in any of the three source snippets — `Breadcrumb` + `BreadcrumbItem` is the complete public surface shown on this page.

## Best practices

The page does not include a Best Practices / When to use / Behavior / Accessibility accordion (verified absent in the decoded flight payload — this component's doc page is intentionally minimal, just the three demos above). Reasonable inferred rules from the API shape and standard breadcrumb conventions, to be validated against Geist's own usage elsewhere if a governing doc surfaces later:

- Use `type="menu"` when any level in the hierarchy has meaningful siblings a user might want to jump to (e.g. sibling projects/pages); use plain `type="text"` when the trail is a strict, non-branching path.
- Mark exactly the current page's crumb `active` so users get a clear "you are here" signal; don't make it a clickable link to itself.
- Reserve `disabled` for a crumb that exists for context but has no destination (e.g. a placeholder level with no landing page) rather than removing it from the trail.

## Design notes

- Package: `@vercel/geistcn/components` (the shadcn-style Geist component package used across these doc pages), imported alongside `import type { JSX } from 'react'` and typed as `JSX.Element`.
- Two named exports used together: `Breadcrumb` (container, `type` prop) and `BreadcrumbItem` (leaf, `active`/`disabled` boolean props).
- The Default section wraps both `Breadcrumb` demos in `<div className="flex flex-col gap-4">` — i.e. a plain Tailwind flex column with `gap-4` (1rem) is the doc page's own layout scaffold for stacking two live previews, not part of the component itself.
- No `--ds-*` custom-property tokens, `material-*`, or `text-label-*` class names are present in the static HTML for this page — the actual rendered breadcrumb markup (separators, spacing, colors, menu trigger affordance, hover/focus states) is produced by a client-loaded live preview (referenced only by opaque `name="breadcrumbs-default" | "breadcrumbs-active" | "breadcrumbs-disabled"` preview keys) rather than shipped in the initial flight payload, so no concrete pixel sizes, radii, or color tokens could be captured for this component from this fetch. Re-fetching with a browser-driven tool (Playwright/Chrome) and inspecting the live DOM would be needed to pull exact separator glyph, spacing, and color-token values.
- Syntax-highlighted code blocks are duplicated per section for light and dark theme (`data-theme="light"` / `data-theme="dark"`), each with its own color palette (e.g. light: `import`/`from` in `#D73A49`, punctuation `#24292E`, strings `#032F62`; dark: `import`/`from` in `#F97583`, punctuation `#E1E4E8`, strings `#9ECBFF`) — standard GitHub-light/GitHub-dark-ish token colors for the `rehype-pretty-code` renderer, not Geist design tokens per se.
