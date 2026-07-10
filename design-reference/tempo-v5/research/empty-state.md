# Empty State

> "Fill spaces when no content has been added yet, or is temporarily empty due to the nature of the feature and should be designed to prevent confusion."

Source: https://vercel.com/geist/empty-state (Vercel Geist Design System)

## Sections documented

- **Header** — component name + one-line purpose statement (quoted above).
- **Empty state Design framework** — an explanatory block (with an accompanying illustrative SVG diagram) that names four conceptual approaches a team can pick between, only two of which get a rendered code demo further down the page:
  - **Blank Slate** — basic empty state for a first-run experience.
  - **Informational** — alternative for a first-use empty state; adds inline CTAs and supplemental documentation links.
  - **Educational** — launches a contextual onboarding flow to build deeper understanding of that part of the app.
  - **Guide** — starter content that lets users interact with data and learn the system by tinkering or setting up their environment.
- **Default demo** (`empty-state-default`) — bare `EmptyState` with just an `icon`, `title`, and `description`, no actions. This is the canonical "show the component" example at the top of the page.
- **Blank slate demo** (`empty-state-blank`) — identical code/props to the default demo; the surrounding prose reframes it as "the most basic empty state should convey the state of the view" (i.e. Default and Blank Slate are the same minimal composition, just discussed under two headings).
- **Informational demo** (`empty-state-informational`) — adds children: a primary `Button` (`variant="secondary"`) and a `Link` (secondary, external), demonstrating the CTA + "learn more" pattern. Prose: "Default to showing rather than telling the value of a feature... Informational empty states will include a call to action."
- **Best Practices** (accordion-style, three subsections: When to use / Behavior / Content — note this page's "Content" subsection stands in for the more common "Accessibility" heading and folds a11y guidance into "Behavior").

## API

Package: `@vercel/geistcn/components`. Icons from `@vercel/geistcn-assets/icons`.

Exports used on this page: `EmptyState`, `EmptyStateIcon`. Composable with `Button` and `Link` as children for CTAs.

### Minimal usage (Default / Blank Slate)

```tsx
import { EmptyState, EmptyStateIcon } from '@vercel/geistcn/components';
import type { JSX } from 'react';
import { IconChartBarPeak } from '@vercel/geistcn-assets/icons';

export function Component(): JSX.Element {
  return (
    <EmptyState
      description="A message conveying the state of the product."
      icon={<EmptyStateIcon icon={<IconChartBarPeak size={32} />} />}
      title="Title"
    />
  );
}
```

### With CTAs (Informational)

```tsx
import { Button, EmptyState, EmptyStateIcon } from '@vercel/geistcn/components';
import { Link } from '@vercel/geistcn/components';
import type { JSX } from 'react';
import { IconChartBarPeak } from '@vercel/geistcn-assets/icons';

export function Component(): JSX.Element {
  return (
    <EmptyState
      description="This should detail the actions you can take on this screen, as well as why it's valuable."
      icon={<EmptyStateIcon icon={<IconChartBarPeak size={32} />} />}
      title="Title"
    >
      <Button variant="secondary">Primary Action</Button>
      <Link
        data-zone="dashboard"
        external
        href="/"
        isDifferentZone
        type="secondary"
      >
        Learn more
      </Link>
    </EmptyState>
  );
}
```

### Props observed on `EmptyState`

- `title` (string) — required-in-practice heading.
- `description` (string) — supporting sentence.
- `icon` (ReactNode) — always wrapped in `EmptyStateIcon` in every example, never passed a raw icon directly.
- `children` (ReactNode) — optional; slot for one or more action elements (`Button`, `Link`). In the Informational demo, exactly one `Button` (secondary variant) plus one `Link` (secondary type, marked `external`) are passed as siblings, rendered as the CTA row.

### `EmptyStateIcon` props observed

- `icon` (ReactNode) — the actual glyph, e.g. `<IconChartBarPeak size={32} />`. In every demo the inner icon is sized `32`. `EmptyStateIcon` acts as a wrapper/frame around the raw icon (presumably supplying the circular/tinted background chip seen in Geist's icon-chip pattern elsewhere in the system — the raw HTML/CSS for that chip is not exposed in the flight payload, only the JSX call site).

### `Link` props observed (as used inside EmptyState)

- `type="secondary"` — visual weight, mirrors `Button`'s `variant` prop naming but uses `type` instead.
- `external` (boolean) — marks the link as leaving the current context (adds affordance, e.g. external-link icon, in Geist's Link component elsewhere).
- `isDifferentZone` (boolean) — Vercel-dashboard-specific zone-boundary flag (prefetch/analytics zoning), not generally portable outside Vercel's own app shell.
- `data-zone="dashboard"` — companion attribute to `isDifferentZone`.

### `Button` props observed

- `variant="secondary"` — the CTA in the Informational demo is deliberately NOT primary; the accompanying Link is the secondary action. (No primary-variant example appears on this page.)

## Best practices (paraphrased)

**When to use**
- Choose the variant by what the user actually needs, not by habit: "no results" for a filtered list that returned zero rows; "blank slate" or "informational" for a resource the user has not created yet; "cleared" once completed work is cleared out; "permission" for role/tier-gated denials; "error" for a failed load.
- Permission-denied and tier-gated states should take over the full page when the user lands directly on a route they cannot access. Reserve a smaller inline `Note` component for the narrower case where only one tile/section inside an otherwise-accessible page is gated.
- Do not use an empty state to carry a persistent warning — empty states disappear the moment the list populates. Standing warnings belong in a `Note` component or in the page header instead.

**Behavior**
- The call-to-action must be a real, focusable `Button` or `Link`, never a `div` with an `onClick` — it has to sit in the tab order and expose a proper accessibility role.
- Limit to one primary CTA. A second, secondary CTA is only acceptable when the first action legitimately forks into two valid paths (their example: "Import Repository" vs. "Deploy Template"). Three or more CTAs is a sign something is wrong with the design.
- When the empty state appears after an async filter/search change, wrap the region in `aria-live="polite"` so assistive tech announces the new state without stealing focus.
- Do not auto-launch a walkthrough/tour from the educational variant — always pair a "Start Tour" action with an equally visible "Skip" action so the user stays in control.

**Content**
- `title` is Title Case (e.g. "No Logs Match Your Filter"). `description` is sentence case and must add information beyond the title, never just restate it.
- When quoting a user's own filter/search input back to them, use curly quotes and this exact template: `No logs match "${query}". Clear the filter to see all logs.` For multi-facet filters, use the plural template `No {Items} Match Your Filters` and suggest widening or clearing the filter.
- Onboarding/first-run bodies should name the concrete next action that creates the first item, e.g. "Push to your Git repository to create your first one."
- Tier-gated bodies follow the template `{Feature value} with the {Plan} plan.`
- The error variant should always pair its body copy with a copyable request ID and a "Try Again" button.
- CTA labels are Title Case, following a `Verb + Noun` shape. Avoid generic, context-free labels like "Get Started," "Continue," or "OK."

## Design notes

- No component-level CSS classes, design tokens (`--ds-*`, `material-*`), or pixel dimensions for the `EmptyState`/`EmptyStateIcon` render tree are exposed anywhere in the page's Next.js flight payload — the two components are shipped as compiled JS bundles (`@vercel/geistcn/components`) and the demo only shows the JSX call sites, not their internal markup/class names. Anything about internal padding, icon-chip background, border radius, or color roles must be reverse-engineered visually (e.g. via a rendered screenshot) rather than read from source on this page.
- Every icon passed into `EmptyStateIcon` in every example uses `size={32}` on the inner icon (`IconChartBarPeak` from `@vercel/geistcn-assets/icons`) — treat 32px as the icon's canonical/default size inside this component.
- The Default and Blank Slate demos are byte-for-byte identical code (`title="Title"`, generic description, no children) — the distinction between them is purely conceptual/documentation framing, not a prop or variant difference. There is no `variant` prop visible anywhere in the API surface on this page; the four conceptual "variants" (Blank Slate / Informational / Educational / Guide) plus the best-practices-mentioned ones (no-results / cleared / permission / error) appear to be achieved entirely through composition (which children/CTAs you pass, plus title/description copy) rather than a discrete `variant="..."` enum prop.
- The Informational demo's only CTA row is one secondary `Button` + one secondary `Link` — no primary-variant button example is shown on this page at all, which is a notable gap if a "primary CTA" empty state is needed; best-practices text implies a primary CTA is normal ("Cap at one primary CTA...") but the live code sample never demonstrates it.
- A hand-drawn SVG diagram (691x390 viewbox, `<g filter="url(#filter0_d_572_52081)">`, drop-shadow filter, rounded rect `rx="6"` panels) illustrates the design framework section — decorative only, not a token/spec source; skip reproducing its exact vector paths, just note the general "cards laid out with drop shadows over a light canvas" visual style consistent with other Geist illustration blocks.
- Page title / meta description strings match the one-liner quoted at the top exactly, confirming that is the canonical purpose statement to preserve verbatim in any internal port.

## Notes on extraction

- The page fetched successfully at ~236KB (2 `self.__next_f.push` script tags carrying ~110KB of decoded Next.js flight/RSC payload total).
- All three live code demos were captured verbatim via their `__rawString__` backtick literals (the plain-text source Vercel stores alongside the syntax-highlighted span markup), so the JSX above is copy-exact including the smart apostrophe (`it's` uses a Unicode right single quote in source, normalized to a plain apostrophe here for readability — flag this if literal-byte fidelity to their source ever matters).
- No sub-pages or additional linked specs were found specific to Empty State; the left nav's "Entity" (previous/next linked page) and other component names are just the global sidebar, not part of this component's own documentation.
- No 404s or slug-variant fallback was needed — `empty-state` resolved directly.
