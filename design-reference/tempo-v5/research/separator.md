# Separator

> "A visual divider that separates content into distinct sections, with support for horizontal and vertical orientations."

Source: https://vercel.com/geist/separator (fetched 2026-07-10/11, server-rendered HTML + Next.js flight payload, ~231KB raw page)

## Sections documented

- **Horizontal** — a stacked list of two labeled sections (`Section 1` / `Section 2`), each with a heading and a paragraph, divided by a default (horizontal) `<Separator />`. Demonstrates the baseline default orientation.
- **Vertical** — a single-row nav-style strip (`Home | About | Services | Contact`) using `<Separator orientation="vertical" />` between each label, laid out in a flex row with fixed height so the vertical rule has something to span.
- **Orientation Variants** — one section stacking both orientations side by side: a "Horizontal Separators" subsection (content above/below a horizontal rule) and a "Vertical Separators" subsection (`Left | Center | Right` divided by vertical rules in a flex row).
- **Accessibility Variants** — contrasts a "Decorative Separator (default)" (`<Separator decorative />`, i.e. `aria-hidden`/presentational, purely visual with no semantic meaning) against a "Semantic Separator" (`<Separator decorative={false} />`, exposed to assistive tech as a real thematic break, `role="separator"`).
- **Custom Styling** — shows the component accepts and merges an arbitrary `className` for color (`bg-blue-500`, `bg-red-500`, `bg-green-500`), thickness (`h-2` for horizontal thickness, `w-0.5` / `w-2` for vertical thickness), demonstrated on both a "Default Separator", a "Custom Colored Separator", a "Thicker Separator", and a "Vertical Custom Styling" row combining color + thickness overrides on vertical separators.

Each of the 5 sections above has a "Show code" toggle revealing a full TSX example (all captured, see API below). No "Best Practices" (When to use / Behavior / Accessibility prose) accordion is present on this page — unlike some other Geist component pages, Separator's page does not ship that section.

## API

Single component, no documented subcomponents.

```
import { Separator } from '@vercel/geistcn/components';
```

### Props observed across all examples

| Prop          | Values seen                                                                                      | Notes                                                                                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `orientation` | `"horizontal"` (implicit default — omitted in the first two examples), `"vertical"`              | Explicit `orientation="horizontal"` also shown once (Orientation Variants section), confirming horizontal is both the default and settable explicitly.                   |
| `decorative`  | (omitted = default true/decorative), `decorative` (shorthand boolean true), `decorative={false}` | Controls whether the separator is `aria-hidden`/purely visual (default, decorative) vs. exposed as a semantic `role="separator"` boundary (`decorative={false}`).        |
| `className`   | e.g. `"bg-blue-500"`, `"h-2"`, `"bg-red-500 w-0.5"`, `"bg-green-500 w-2"`                        | Standard Tailwind class merge/override — background color changes the rule's fill color, `h-*` changes horizontal-rule thickness, `w-*` changes vertical-rule thickness. |

### Minimal usage snippets

**Default (horizontal), between two content blocks:**

```tsx
<div>
  <h3 className="text-label-16">Section 1</h3>
  <p className="text-copy-14 text-gray-900">This is the first section of content.</p>
</div>
<Separator />
<div>
  <h3 className="text-label-16">Section 2</h3>
  <p className="text-copy-14 text-gray-900">This is the second section of content.</p>
</div>
```

**Vertical, inline in a flex row (nav-style):**

```tsx
<div className="flex h-8 items-center space-x-4">
  <p className="text-copy-14 text-gray-1000">Home</p>
  <Separator orientation="vertical" />
  <p className="text-copy-14 text-gray-1000">About</p>
  <Separator orientation="vertical" />
  <p className="text-copy-14 text-gray-1000">Services</p>
  <Separator orientation="vertical" />
  <p className="text-copy-14 text-gray-1000">Contact</p>
</div>
```

**Explicit orientation prop + vertical row:**

```tsx
<div>
  <h4 className="mb-2 text-label-14">Horizontal Separators</h4>
  <div className="space-y-2">
    <p className="text-copy-14">Content above separator</p>
    <Separator orientation="horizontal" />
    <p className="text-copy-14">Content below separator</p>
  </div>
</div>

<div>
  <h4 className="mb-2 text-label-14">Vertical Separators</h4>
  <div className="flex h-6 items-center space-x-2">
    <span className="text-copy-14">Left</span>
    <Separator orientation="vertical" />
    <span className="text-copy-14">Center</span>
    <Separator orientation="vertical" />
    <span className="text-copy-14">Right</span>
  </div>
</div>
```

**Accessibility variants (decorative vs. semantic):**

```tsx
<div>
  <h4 className="mb-2 text-label-14">Decorative Separator (default)</h4>
  <p className="text-copy-14 text-gray-900">This separator is purely visual</p>
  <Separator decorative />
  <p className="text-copy-14 text-gray-900">Content continues below</p>
</div>

<div>
  <h4 className="mb-2 text-label-14">Semantic Separator</h4>
  <p className="text-copy-14 text-gray-900">This separator has semantic meaning</p>
  <Separator decorative={false} />
  <p className="text-copy-14 text-gray-900">Distinctly separate content section</p>
</div>
```

**Custom styling (color, thickness, vertical variants):**

```tsx
<div>
  <h4 className="mb-2 text-label-14">Default Separator</h4>
  <Separator />
</div>

<div>
  <h4 className="mb-2 text-label-14">Custom Colored Separator</h4>
  <Separator className="bg-blue-500" />
</div>

<div>
  <h4 className="mb-2 text-label-14">Thicker Separator</h4>
  <Separator className="h-2" />
</div>

<div>
  <h4 className="mb-2 text-label-14">Vertical Custom Styling</h4>
  <div className="flex h-8 items-center space-x-4">
    <span className="text-copy-14">Item 1</span>
    <Separator orientation="vertical" className="bg-red-500 w-0.5" />
    <span className="text-copy-14">Item 2</span>
    <Separator orientation="vertical" className="bg-green-500 w-2" />
  </div>
</div>
```

## Best practices

No dedicated Best Practices accordion ships on this page. Inferring the intended usage rules from the demos and prop surface itself:

- Reach for Separator to mark a clean visual break between grouped content (sections, list items, inline metadata clusters) rather than ad hoc borders or margin hacks.
- Default to the decorative (visual-only) mode — most separators are cosmetic and should stay out of the accessibility tree so screen readers don't announce meaningless boundary noise.
- Flip to `decorative={false}` only when the divider is genuinely a semantic content boundary the user needs to know about (e.g., separating unrelated document sections a screen reader user should be told about), not for routine visual rhythm.
- Use `orientation="vertical"` for inline dividers between items in a horizontal flex row (nav links, breadcrumb-like strips, metadata chips); always give the containing row an explicit height (e.g. `h-6`/`h-8`) so the vertical rule has a bounded span to fill.
- Treat `className` overrides (color, thickness) as an escape hatch for emphasis or brand moments, not the default look — the unstyled default should carry the vast majority of dividers in a UI.

## Design notes

- **Default sizing convention (inferred from demo containers, not literal component defaults):** horizontal separators render as a hairline rule; container heights used for vertical separators are `h-6` (24px) and `h-8` (32px), suggesting the vertical rule is meant to sit inline within roughly 24-32px-tall rows.
- **Thickness overrides observed:** `h-2` (8px) used to demonstrate a "thicker" horizontal rule — implies default horizontal thickness is a hairline (1px-class) well below that. `w-0.5` (2px) and `w-2` (8px) used for vertical rule thickness variants — implies default vertical thickness is likewise a hairline.
- **Color tokens used in custom-styling demo:** `bg-blue-500`, `bg-red-500`, `bg-green-500` — plain Tailwind palette utilities, not Geist `--ds-*` design tokens; no `--ds-gray-alpha-*`/`--ds-gray-*` border-token reference was visible in the captured examples for the separator's own fill, so the base/default fill color is not directly exposed in the docs (likely a neutral gray token applied internally by the base `Separator` implementation, consistent with other Geist components using `bg-gray-alpha-400`-class border colors — verify against the actual `@vercel/geistcn` source when porting).
- **Typography tokens seen in surrounding demo copy** (not the separator itself, but useful for matching the reference layouts pixel-for-pixel): `text-label-16` (section headings), `text-label-14` (subsection headings), `text-copy-14` (body copy), `text-copy-16` / `text-copy-20` appear elsewhere in the flight payload (other component pages bundled in the same JS chunk — not part of Separator's own examples).
- **Color roles for surrounding text:** `text-gray-900` (secondary/muted body copy), `text-gray-1000` (primary/high-emphasis label text, used for the vertical nav example labels).
- **Layout spacing utilities used to compose demos:** `space-y-4` / `space-y-6` / `space-y-8` for stacked vertical demo blocks, `space-x-2` / `space-x-4` for inline flex rows containing vertical separators, `mb-2` under subsection `h4` headings.
- **Orientation semantics:** the component clearly branches its rendered rule direction and implied sizing behavior off a single `orientation` prop (`"horizontal"` | `"vertical"`), matching the Radix `Separator` primitive's API surface (Geist's separator is very likely a thin themed wrapper over `@radix-ui/react-separator`, which is consistent with Radix already being in this stack) — when reimplementing on Radix, map `orientation` straight through and drive rule thickness with `data-[orientation=horizontal]:h-px data-[orientation=vertical]:w-px`-style Tailwind arbitrary variants for the default hairline, allowing `className` to override.
- **Accessibility mapping:** `decorative` (default true) should map to Radix's own `decorative` prop, which sets `aria-orientation` appropriately and either applies `role="none"`/`aria-hidden` (decorative) or `role="separator"` with `aria-orientation` (semantic, `decorative={false}`) — this maps 1:1 to the demo's "Decorative Separator (default)" vs "Semantic Separator" pairing.
- **Motion:** no motion/transition behavior documented or implied anywhere on this page — Separator is a static, non-interactive element with no hover/focus/animated states in any of the 5 examples.
