# Scroller

> "Display an overflowing list of items."

Source: https://vercel.com/geist/scroller (Vercel Geist Design System). Package: `@vercel/geistcn/components`.

## Sections documented

- **Vertical** — a fixed-height (`height={220}`) container with `overflow="y"`; children are a vertically stacked flex column of fixed-size blocks (`w-64 h-64`) wider than the container, demonstrating vertical clipping/scroll only.
- **Horizontal** — `height="100%"`, `overflow="x"`, `width="100%"`; children are a flex row wrapped in a container set to `minWidth: '120%'` so it overflows the parent horizontally, demonstrating horizontal-only scroll.
- **Free** — `height={220}`, `overflow="both"`; children laid out in a CSS grid (`grid-flow-col grid-rows-2`) of 6 large tiles (`h-96 w-96`), demonstrating simultaneous x/y scrolling for content that genuinely needs both axes (e.g. long log lines in a tall list).
- **Vertical with buttons** — same vertical setup plus `withButtons`, wrapped in a `flex max-w-max flex-col` container; renders explicit scroll-affordance buttons (top/bottom) that jump to a direct child.
- **Horizontal with buttons** — same horizontal setup plus `withButtons`; renders left/right scroll buttons; children given `shrink-0` so they don't compress.
- **Best Practices** (accordion, three subsections): "When to use", "Behavior", "Accessibility" — see paraphrased rules below.

Each demo section has a live rendered preview plus a "Show code" toggle revealing the exact TSX shown in API below.

## API

Single component, no documented subcomponents.

```tsx
import { Scroller } from '@vercel/geistcn/components';
```

### Props observed in the code examples

- `height` — `number` (px, e.g. `220`) or `string` (e.g. `"100%"`). Sets the scroll viewport's fixed height.
- `width` — `string` (e.g. `"100%"`). Sets the scroll viewport's width.
- `overflow` — enum: `"y"` | `"x"` | `"both"`. Controls which axis/axes can scroll (rendered to the DOM as `data-overflow="y" | "x" | "both"` on the inner scroller element).
- `withButtons` — `boolean`. Renders a companion button cluster (rendered as a sibling `.scroller-module__buttons` block) with arrow buttons that scroll to the next/previous direct child.
- `childrenContainerClassName` — `string`. Extra className merged onto the inner children-wrapping container (used in both button examples to add `gap-4`).
- `children` — arbitrary JSX; expected to be a flat list of direct-child elements (buttons only scroll to *direct* children, per Behavior notes).

### Usage patterns (from code examples)

Vertical, no buttons, fixed height, content wider than the box:
```tsx
<Scroller height={220} overflow="y" width="100%">
  <div className="flex flex-col items-stretch justify-start gap-4 flex-initial" style={{ width: 400 }}>
    <div className="bg-gray-1000 h-64 w-64" />
    <div className="bg-gray-1000 h-64 w-64" />
  </div>
</Scroller>
```

Horizontal, full-height/full-width parent, content overflowing via `minWidth`:
```tsx
<Scroller height="100%" overflow="x" width="100%">
  <div className="flex flex-row items-stretch justify-start gap-4 flex-initial" style={{ minWidth: '120%' }}>
    <div className="bg-gray-1000 h-64 w-64" />
    {/* ...more items */}
  </div>
</Scroller>
```

Free (both axes), grid layout:
```tsx
<Scroller height={220} overflow="both" width="100%">
  <div className="grid grid-flow-col grid-rows-2 gap-4">
    {Array.from({ length: 6 }, (_, i) => (
      <div className="bg-gray-1000 h-96 w-96" key={i} />
    ))}
  </div>
</Scroller>
```

Vertical with buttons:
```tsx
<div className="flex max-w-max flex-col gap-4">
  <Scroller childrenContainerClassName="gap-4" height={220} overflow="y" withButtons>
    {Array.from({ length: 4 }, (_, i) => (
      <div className="bg-gray-1000 h-60 w-96" key={i} />
    ))}
  </Scroller>
</div>
```

Horizontal with buttons:
```tsx
<div className="flex flex-col gap-4">
  <Scroller childrenContainerClassName="gap-4" height="100%" overflow="x" width="100%" withButtons>
    {Array.from({ length: 4 }, (_, i) => (
      <div className="bg-gray-1000 h-64 w-96 shrink-0" key={i} />
    ))}
  </Scroller>
</div>
```

### DOM/markup shape (from rendered HTML, useful for re-implementation)

```
<div data-geist-scroller data-version="v1" style="width:...;height:..." class="[overlayContainer] [isHorizontal?]">
  <div data-geist-scroller-overlay class="[overlay]" />
  <div data-geist-scroller-container data-overflow="y|x|both" class="[scroller]">
    <div class="[childrenContainerClassName]">
      ...children...
    </div>
  </div>
</div>
```

`withButtons` renders a sibling `class="[buttons]"` wrapper containing the scroll-direction `<button>`s (see Design notes for their markup), placed alongside the `overlayContainer`.

## Best practices

**When to use**
- Reach for Scroller when a set of peer items needs to overflow along one axis rather than wrap or paginate: chip rows, log streams, code snippets, command palettes.
- Match the axis to the content's natural shape: vertical for stacked feeds, horizontal for chip/tile rails, and `both` ("free") only when content truly needs to scroll in two directions at once (e.g. logs with very long lines inside a tall list).
- For large paginated or virtualized data sets (more than a few hundred items), don't mount every item as a DOM node — pair Scroller with a virtualization library instead of rendering the full list.

**Behavior**
- The optional scroll buttons only know how to target immediate children of the scroll container — if items get wrapped in an extra div/layout node, the buttons lose track of what to scroll to next.
- Always pair the clipped edge with a visual cue (fade or shadow) so users can tell there's more content off-screen.
- In horizontal scrollers keep item widths and gaps uniform; inconsistent sizing breaks the scroll rhythm and reads as a bug.

**Accessibility**
- DOM order drives tab order, so author items in reading order even if the visual scroll direction differs.
- Scroll buttons must carry descriptive `aria-label`s naming both direction and content (e.g. "Scroll customer logos left") — generic "Previous"/"Next" labels aren't acceptable.
- Programmatic or keyboard focus landing on an off-screen item must scroll it into view; rely on native browser behavior for this and avoid custom focus-trap logic that could suppress it.

## Design notes

- **Package / import**: `import { Scroller } from '@vercel/geistcn/components';` (also `import type { JSX } from 'react';` in every example, TSX).
- **Markup identity attributes**: outer wrapper carries `data-geist-scroller`, `data-version="v1"`; the overlay div carries `data-geist-scroller-overlay`; the scrollable inner div carries `data-geist-scroller-container` and `data-overflow="y" | "x" | "both"` (mirrors the `overflow` prop directly).
- **CSS module classes seen in rendered output** (hashed, e.g. `scroller-module__aGa9CG__…` — hash suffix will differ per build): `overlayContainer`, `isHorizontal` (added conditionally when the scroll axis is horizontal), `overlay` (the edge-fade/shadow layer sits here, positioned absolutely over the container), `scroller` (the actual `overflow: auto/scroll` element), `buttons` (wrapper for the optional nav-button cluster).
- **Placeholder content blocks in demos**: solid fills via Tailwind `bg-gray-1000` (maps to the design token `--ds-gray-1000`), sized `h-64 w-64` (256px), `h-96 w-96` (384px), or `h-60 w-96` (240x384px) depending on demo.
- **Scroll button component**: reuses the shared Geist Button primitive (`data-geist-button`, `data-version="v1"`) at the "small" form-control size — `height: var(--geist-form-small-height)`, width matches (`w-[var(--geist-form-small-height)]`), `--geist-icon-size: 16px`, fully rounded (`!rounded-full`), icon-only (no text). Observed `aria-label` values in the live demo: `"scroll top"`, `"scroll bottom"`, `"scroll left"`, `"scroll right"` — note the Accessibility guidance above explicitly calls for *more descriptive*, content-aware labels than these generic demo defaults (e.g. name what's being scrolled, not just the direction).
- **Button color tokens** (shared Button primitive, themed variant used here): background `var(--ds-gray-1000)`, foreground `var(--ds-background-100)`, border `var(--ds-gray-400)`, hover background `var(--ds-gray-alpha-200)`; disabled state uses `var(--ds-gray-700)` text on `var(--ds-gray-100)` background. Focus ring via `var(--ds-focus-ring)` / `var(--ds-focus-color)`.
- **Transitions**: button uses `transition-[border-color,background,color,transform,box-shadow] duration-150 ease-in-out`; icon paths inside get `transition-all duration-200` (seen on other button instances on the page, shared primitive behavior — Scroller's own buttons inherit the same Button component transitions).
- **No explicit motion spec for the scroll-into-view itself** was present in the extracted code (native browser scroll / `scrollIntoView` behavior implied by the Accessibility note, not a custom animation curve).
- **Container sizing pattern**: `height`/`width` are passed straight through as inline styles on the outer `overlayContainer` div (`style="width:100%;height:220px"` etc.) — i.e. Scroller does not rely on CSS classes for sizing, it's fully controlled via props → inline style.
- **Layout wrapper classes used only in the "with buttons" demos** (author's own layout, not part of Scroller itself): `flex max-w-max flex-col gap-4` (vertical) and `flex flex-col gap-4` (horizontal), placing the button cluster and the Scroller as siblings.
