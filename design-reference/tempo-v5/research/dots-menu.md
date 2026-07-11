# Dots Menu

> "An overflow menu triggered by a three-dot icon that reveals additional actions in a dropdown."

Source: https://vercel.com/geist/dots-menu (fetched 2026-07-10/11, server-rendered HTML + Next.js flight payload).

## Sections documented

- **Default** — a `DotsMenu` with three `MenuItem` children (`View Build Logs`, `View Projects`, `View Analytics`); the baseline overflow-menu trigger + dropdown.
- **Sizes** — three `DotsMenu` instances side by side (`flex items-start gap-6`) demonstrating the `iconSize` prop at `10`, `12`, and `18` — each with the same three menu items, showing the trigger icon scaling while the button hit-area stays constant.
- **Disabled** — the whole `DotsMenu` passed `disabled`, rendering the trigger button non-interactive (native `disabled=""` attribute + `aria-disabled` style hooks) while all three items remain in the markup.
- **Disabled Menu Item** — an enabled `DotsMenu` where a single `MenuItem` (`View Projects`) carries `disabled`, showing per-item disabling independent of the trigger.

No "Best Practices" accordion (When to use / Behavior / Accessibility) is present on this page — unlike some other Geist component pages, `dots-menu` ships with only the four demo sections above and no prose guidance block. Confirmed absent by full-text search of both the static HTML and the flight payload.

Adjacent pages in the sidebar nav: previous = **Destructive Action Modal**, next = **Drawer** (component list also includes a separate **Menu** and **Context Menu** — Dots Menu is a preset trigger+menu pairing built on the same underlying menu primitive).

## API

Import path: `@vercel/geistcn/components`.

```tsx
import { DotsMenu, MenuItem } from "@vercel/geistcn/components";
```

### `<DotsMenu>` (the trigger + dropdown wrapper)

Props observed across the four examples:

| Prop       | Type / values seen            | Effect                                                                                                                        |
| ---------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `children` | one or more `<MenuItem>`      | populates the dropdown list                                                                                                   |
| `iconSize` | `10 \| 12 \| 18` (numeric px) | size of the three-dot glyph inside the trigger button; button footprint itself does not resize                                |
| `disabled` | boolean                       | disables the whole trigger button (native `disabled` attribute renders on the underlying `<button>`; blocks opening the menu) |

### `<MenuItem>` (dropdown row)

| Prop       | Type / values seen | Effect                                                                |
| ---------- | ------------------ | --------------------------------------------------------------------- |
| `children` | string / node      | the item's label text                                                 |
| `disabled` | boolean            | disables that single row while the rest of the menu stays interactive |

### Usage snippets (as shown on the page)

**Default:**

```tsx
import { DotsMenu, MenuItem } from "@vercel/geistcn/components";
import type { JSX } from "react";

export function Component(): JSX.Element {
  return (
    <DotsMenu>
      <MenuItem>View Build Logs</MenuItem>
      <MenuItem>View Projects</MenuItem>
      <MenuItem>View Analytics</MenuItem>
    </DotsMenu>
  );
}
```

**Sizes:**

```tsx
import { DotsMenu, MenuItem } from "@vercel/geistcn/components";
import type { JSX } from "react";

export function Component(): JSX.Element {
  return (
    <div className="flex items-start gap-6">
      <DotsMenu iconSize={10}>
        <MenuItem>View Build Logs</MenuItem>
        <MenuItem>View Projects</MenuItem>
        <MenuItem>View Analytics</MenuItem>
      </DotsMenu>
      <DotsMenu iconSize={12}>
        <MenuItem>View Build Logs</MenuItem>
        <MenuItem>View Projects</MenuItem>
        <MenuItem>View Analytics</MenuItem>
      </DotsMenu>
      <DotsMenu iconSize={18}>
        <MenuItem>View Build Logs</MenuItem>
        <MenuItem>View Projects</MenuItem>
        <MenuItem>View Analytics</MenuItem>
      </DotsMenu>
    </div>
  );
}
```

**Disabled (whole trigger):**

```tsx
import { DotsMenu, MenuItem } from "@vercel/geistcn/components";
import type { JSX } from "react";

export function Component(): JSX.Element {
  return (
    <DotsMenu disabled>
      <MenuItem>View Build Logs</MenuItem>
      <MenuItem>View Projects</MenuItem>
      <MenuItem>View Analytics</MenuItem>
    </DotsMenu>
  );
}
```

**Disabled Menu Item (single row):**

```tsx
import { DotsMenu, MenuItem } from "@vercel/geistcn/components";
import type { JSX } from "react";

export function Component(): JSX.Element {
  return (
    <DotsMenu>
      <MenuItem>View Build Logs</MenuItem>
      <MenuItem disabled>View Projects</MenuItem>
      <MenuItem>View Analytics</MenuItem>
    </DotsMenu>
  );
}
```

### Composition pattern

`DotsMenu` is a self-contained trigger-and-popover pair (not split into a separate `Trigger`/`Content`/`Item` compound-component API the way Radix's own primitives are). You render it once with `MenuItem` children directly inside — no separate "open" state, portal, or content wrapper to manage; it owns its own open/closed state internally (confirmed by `aria-expanded="false"` / `data-is-open="false"` toggling on the trigger button and `data-state="closed"` on the popover region).

## Best practices

No dedicated guidance block ships with this page. Reading the demo set and markup, the implied rules are:

- Use it as a low-emphasis "..." overflow trigger for secondary/tertiary actions on a row, card, or toolbar — not as a primary action button.
- Default icon size (18px glyph inside a 32px button) is the standard density; drop to 12px or 10px only in visually denser contexts (e.g. inside a compact table row) where a full-size trigger would crowd the layout — the button's clickable footprint does not shrink with the icon, so hit-area/accessibility is preserved at every size.
- Disable the entire menu (`disabled` on `DotsMenu`) when none of its actions apply in the current state (e.g. no permissions); disable an individual `MenuItem` when only one specific action is currently unavailable (e.g. "View Analytics" needs data that doesn't exist yet) while the rest of the menu stays usable.
- Because it is keyboard- and ARIA-wired out of the box (`aria-haspopup`, `aria-expanded`, `aria-controls`, `aria-label="Menu"` by default), no extra accessibility wiring is needed beyond supplying meaningful `MenuItem` labels — don't override the default `aria-label` unless the trigger needs page-specific disambiguation (e.g. "Actions for Project X").

## Design notes

Concrete values pulled from the rendered demo markup (light DOM, not just prose):

- **Trigger button ("legacy/dots-menu" testid)**
  - Height: `32px` (`--height:32px`, `h-[32px]`), width bound to `var(--geist-form-small-height)` (square small-form-control sizing), padding `!px-0` / `[--x-padding:6px]`.
  - Shape: `rounded-md`.
  - Style family: `geist-new-themed geist-new-tertiary geist-new-tertiary-fill` — i.e. it is built on the tertiary-fill button variant (`bg-transparent`, `text-[var(--themed-bg,_var(--ds-gray-1000))]`), not a bespoke component skin.
  - Hover: `data-hover:bg-[var(--themed-hover-bg,_hsl(0,_0%,_22%))]` in light, `dark-theme:data-hover:bg-[var(--themed-hover-bg,_hsl(0,_0%,_80%))]` in dark — i.e. hover fill is a near-black/near-white wash depending on theme, not a brand color.
  - Focus: `data-[focus]:shadow-[var(--ds-focus-ring)]` — standard Geist focus ring token, no custom outline.
  - Disabled state: native `disabled=""` attribute plus `disabled:cursor-not-allowed disabled:text-[var(--ds-gray-700)] disabled:bg-[var(--ds-gray-100)]` (and mirrored `aria-disabled:*` classes for the aria-driven disabled path) — text goes to `--ds-gray-700`, background to `--ds-gray-100`, border pinned to `--ds-gray-400`.
  - Icon wrapper: `size-4 inline-flex ... text-[var(--ds-gray-1000)]` containing an inline SVG, `viewBox="0 0 16 16"`, default rendered `height="18" width="18"` (matches the `iconSize` default demonstrated on the page — 18 was one of the three size options and matches the default trigger render).
  - Icon glyph: three filled circles (the "kebab"/three-dot path), each `r=1.5` in the 16x16 viewbox, evenly spaced — a horizontal (not vertical) three-dot ellipsis glyph.
  - `data-geist-dots-menu=""` and `data-geist-menu-button=""` are the component's own markup hooks (grep-able for QA/e2e selectors).
  - ARIA: `aria-haspopup="true"`, `aria-expanded` toggles `false`/`true`, `aria-controls` points at the generated menu id, default `aria-label="Menu"`, `data-is-open` mirrors open state.
- **Sizes demo layout**: three triggers laid out with `flex items-start gap-6` (24px gap, top-aligned) — confirms `iconSize` is a purely visual glyph-scale prop, not a spacing/layout prop.
- **State transitions**: `transition-[border-color,background,color,transform,box-shadow] duration-[time:150ms] ease-in-out` — all interactive state changes (hover/focus/press) animate over 150ms ease-in-out, consistent with the rest of Geist's button family.
- **Popover/menu**: the dropdown content area uses `data-popover-area="true"` and `data-state="closed"|"open"` (Radix-style state attribute), confirming the underlying primitive is a standard Radix popover/menu wrapped by the `DotsMenu` preset rather than a fully custom implementation.
- **Color tokens used**: `--ds-gray-1000` (icon/base text), `--ds-gray-700` (disabled text), `--ds-gray-100` (disabled bg), `--ds-gray-400` (disabled border), `--ds-gray-alpha-200` (hover border/bg tint), `--ds-focus-ring` (focus ring) — all standard `--ds-*` design tokens, no component-specific custom properties beyond the two locals (`--x-padding`, `--height`, `--spinner-size`, `--geist-icon-size`) inherited from the shared button primitive.
- No dedicated "Best Practices" prose block ships on this page (see Sections above) — the Design notes above are inferred entirely from live markup/classes, not paraphrased guidance text.
