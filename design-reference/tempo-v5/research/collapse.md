# Collapse

> "A set of headings, vertically stacked, that each reveal an related section of content. Commonly referred to as an accordion."

Source: https://vercel.com/geist/collapse — fetched as static Next.js flight-rendered HTML (page title "Collapse"; ~197KB raw HTML, ~95KB decoded flight payload). No 404s, no slug variants needed. Small reference page: 4 demo sections + a "Best Practices" accordion with four subsections (When to use / Behavior / Content / Accessibility).

## Sections documented

- **Default** — a `CollapseGroup` with two `Collapse` items ("Question A", "Question B"), both closed by default. Shows the base group + single-panel composition.
- **Expanded** — same two-item group, but the second `Collapse` ("Question B") carries `defaultExpanded`, showing the initial-open state.
- **Multiple** — same two-item content, but `CollapseGroup` carries the `multiple` prop, allowing more than one panel open at once (vs. the default accordion-style single-open behavior).
- **Small** — a standalone `Collapse` (not inside a group) with `size="small"`, showing the compact size variant.
- **Best Practices** (accordion, four subsections — see below).

Each section has a rendered live preview plus a "Show code" toggle revealing the exact JSX (captured below).

## API

### `Collapse` + `CollapseGroup` (from `@vercel/geistcn/components`)

Props observed in the example code:
- `CollapseGroup`
  - `multiple` (boolean, optional) — allow more than one child `Collapse` open simultaneously. Omitted = only one panel open at a time (accordion behavior).
- `Collapse`
  - `title` (string, required in group usage) — the heading/trigger label.
  - `defaultExpanded` (boolean, optional) — panel starts open.
  - `size` ("small" | default, optional) — compact vs. default control size. Only `"small"` was shown explicitly; default size has no explicit prop value in the examples.
  - Children — arbitrary JSX content rendered inside the panel (in every example, a `<p className="text-copy-16 mb-4">`).
  - Can be used standalone (no `CollapseGroup` wrapper) for a single independent panel, as in the Small-size example.

**Default (group, both closed):**

```tsx
import { Collapse, CollapseGroup } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return (
    <CollapseGroup>
      <Collapse title="Question A">
        <p className="text-copy-16 mb-4">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat.
        </p>
      </Collapse>
      <Collapse title="Question B">
        <p className="text-copy-16 mb-4">
          Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
          dolore eu fugiat nulla pariatur.
        </p>
      </Collapse>
    </CollapseGroup>
  );
}
```

**Expanded (second item starts open via `defaultExpanded`):**

```tsx
import { Collapse, CollapseGroup } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return (
    <CollapseGroup>
      <Collapse title="Question A">
        <p className="text-copy-16 mb-4">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat.
        </p>
      </Collapse>
      <Collapse defaultExpanded title="Question B">
        <p className="text-copy-16 mb-4">
          Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
          dolore eu fugiat nulla pariatur.
        </p>
      </Collapse>
    </CollapseGroup>
  );
}
```

**Multiple (more than one panel can be open at once):**

```tsx
import { Collapse, CollapseGroup } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return (
    <CollapseGroup multiple>
      <Collapse title="Question A">
        <p className="text-copy-16 mb-4">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat.
        </p>
      </Collapse>
      <Collapse title="Question B">
        <p className="text-copy-16 mb-4">
          Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
          dolore eu fugiat nulla pariatur.
        </p>
      </Collapse>
    </CollapseGroup>
  );
}
```

**Small (standalone `Collapse`, no group wrapper, `size="small"`):**

```tsx
import { Collapse } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return (
    <Collapse size="small" title="Question A">
      <p className="text-copy-16 mb-4">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
        veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
        commodo consequat.
      </p>
    </Collapse>
  );
}
```

## Best practices

**When to use**
- Reach for Collapse only for optional, advanced, or repetitive content most users skip on most visits (FAQ entries, advanced settings, a request-payload preview) — not for primary content.
- Don't collapse top-level page structure that every user needs to read; use normal headed sections instead, or collapsing it hides what the page is actually about.
- Use a single `Collapse` for one optional block; use `CollapseGroup` for a related set of them. If the items are actually sibling views rather than optional drill-downs, use Tabs instead.

**Behavior**
- Default to closed unless a first-time visitor must read the content before they can act.
- Inside a `CollapseGroup`, keep single-open (accordion) behavior when items are mutually exclusive; opt into `multiple` only when the items are independent of each other.
- Always animate the open/close transition — an instant jump-cut makes the page feel like it teleported.
- Cap nesting at one level. Two-level nesting hides too much content and breaks the keyboard tab order.

**Content**
- Title-case the heading and name the topic, not the action ("Advanced Settings", not "Show Advanced Settings").
- Write the body as sentence-case prose with normal section formatting — treat the panel as a small page, not a tooltip.
- Never bury a primary destructive action inside a closed Collapse; it forces a double-click just to reach the warning.

**Accessibility**
- The trigger renders as a real `<button>` carrying `aria-expanded` (flips on toggle) and `aria-controls` pointing at the panel's id.
- Enter and Space toggle the panel; no other key is bound globally. Arrow keys are left free to move focus within the panel's own content.
- Keep the panel content in the DOM even while closed (hide via `hidden` or visibility, not by unmounting) so in-page search / find-in-page still matches it. Reserve lazy-rendering for genuinely expensive content only.

## Design notes

- Import path: `@vercel/geistcn/components`, exports `Collapse` and `CollapseGroup`.
- Panel body copy in every example uses the `text-copy-16 mb-4` utility classes (16px body text, bottom margin for spacing) — no other token classes are visible on the trigger/heading itself in the captured markup (styling for the heading/chevron/panel chrome is internal to the component, not exposed in the usage snippets).
- Size variant observed: `size="small"` (compact control) vs. the implicit default size — only two sizes are demonstrated; no `"large"` or `"medium"` variant appears anywhere in the payload.
- Group-level toggle prop: `multiple` (boolean) on `CollapseGroup` controls whether more than one child panel can be expanded simultaneously; its absence enforces single-open (classic accordion) behavior.
- Item-level state prop: `defaultExpanded` (boolean) on `Collapse` sets initial open state (uncontrolled).
- No `disabled` prop, no explicit icon/chevron prop, no ARIA attribute overrides, and no animation-duration/easing tokens appear anywhere in the captured JSX or prose — confirmed by exhaustive keyword search of the decoded flight payload (`disabled`, `icon`, `chevron`, `duration`, `ease`, `role=`, `id=` all zero or unrelated hits, `aria-` only appears inside the Best Practices prose describing `aria-expanded`/`aria-controls`, not as literal props in the demo code). Motion is described only qualitatively ("animate the open/close transition") — no concrete timing value is disclosed on this page.
- The trigger is implemented as a real `<button>` per the accessibility notes; the panel is identified by an id that `aria-controls` references.
