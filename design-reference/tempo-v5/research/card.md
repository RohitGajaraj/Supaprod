# Card

> "A container that groups related content and actions on a surface."

Source: https://vercel.com/geist/card (fetched 2026-07-10). Import path shown in every example: `@vercel/geistcn/components`.

## Sections documented

- **Default** — a bare `Card` wrapping a single line of text (`p-4` padding, no border/shadow/hover). Establishes the baseline unadorned surface.
- **Hover** — adds the `hoverable` boolean prop; demonstrates the interactive/hover affordance on an otherwise plain card.
- **Border** — adds `border` + `shadow` (plus `hoverable`) to show the card with a visible outline and drop shadow, the "elevated" look.
- **Border Between** — adds `borderBetween` on top of `border`/`hoverable`/`shadow`, with three stacked `<p>` children ("Option 1/2/3"). Shows horizontal divider rules rendered between vertically-stacked list-style children (the default/vertical stacking direction).
- **Border Between Vertical** — same props as above plus `direction="row"`, laying the three children out horizontally so the `borderBetween` dividers render as vertical rules instead of horizontal ones. (Section name refers to the divider orientation, not the layout direction.)
- **Secondary** — adds the `secondary` boolean prop (alongside `border`, `borderBetween`, `hoverable`, `shadow`) to show a muted/secondary surface treatment for the same three-option list layout.

Each demo has a "Show code" toggle revealing the exact JSX (captured below). No additional layout/edge-case sections (no explicit "Sizes" or "States" heading — states are folded into Hover/Secondary) and **no "Best Practices" section exists on this page** (confirmed: the page ends right after the last demo with "Was this helpful?" — no When to use / Behavior / Accessibility accordion, unlike some other Geist component pages such as Browser).

## API

**Component:** `Card` (default export from `@vercel/geistcn/components`), used as a JSX wrapper around arbitrary children.

Props observed across the six examples (all boolean flags unless noted):

- `className` — standard Tailwind class passthrough (`"p-4"` in every example; `"p-4"` combined with utility classes on children).
- `hoverable` — boolean. Enables a hover interaction/affordance state on the card surface.
- `border` — boolean. Renders a visible outline/border around the card.
- `shadow` — boolean. Adds a drop shadow (used together with `border` in every example that has it — always co-occurs with `border` in the docs, never shown alone).
- `borderBetween` — boolean. Renders divider rules between direct children (used together with `border`).
- `direction` — string enum, values seen: `"row"` (explicit). Default/unset presumably behaves as column/stacked (implied by contrast with the `direction="row"` example). Controls the axis children lay out on, and therefore the orientation of the `borderBetween` divider lines (perpendicular to the stacking axis).
- `secondary` — boolean. Applies a secondary/muted surface style variant.

No `size` prop or size enum appears anywhere in the captured examples.

### Usage snippets (verbatim from the docs, minus surrounding boilerplate)

Default:
```tsx
import { Card } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return (
    <Card className="p-4">
      <p className="text-copy-14 text-gray-900">A simple card</p>
    </Card>
  );
}
```

Hover:
```tsx
<Card className="p-4" hoverable>
  <p className="text-copy-14 text-gray-900">A simple card</p>
</Card>
```

Border:
```tsx
<Card border className="p-4" hoverable shadow>
  <p className="text-copy-14 text-gray-900">A simple card</p>
</Card>
```

Border Between:
```tsx
<Card border borderBetween className="p-4" hoverable shadow>
  <p className="text-copy-14 text-gray-900 py-2">Option 1</p>
  <p className="text-copy-14 text-gray-900 py-2">Option 2</p>
  <p className="text-copy-14 text-gray-900 py-2">Option 3</p>
</Card>
```

Border Between Vertical (row direction):
```tsx
<Card border borderBetween className="p-4" direction="row" hoverable shadow>
  <p className="text-copy-14 text-gray-900 px-2 w-full">Option 1</p>
  <p className="text-copy-14 text-gray-900 px-2 w-full">Option 2</p>
  <p className="text-copy-14 text-gray-900 px-2 w-full">Option 3</p>
</Card>
```

Secondary:
```tsx
<Card border borderBetween className="p-4" hoverable secondary shadow>
  <p className="text-copy-14 text-gray-900 py-2">Option 1</p>
  <p className="text-copy-14 text-gray-900 py-2">Option 2</p>
  <p className="text-copy-14 text-gray-900 py-2">Option 3</p>
</Card>
```

**Composition pattern:** Card is a plain container — it does not ship its own typography/heading subcomponents in these examples. Content is composed by hand with `<p>` tags styled via the `text-copy-14 text-gray-900` utility pair; when children act as a list of "options" separated by `borderBetween`, each child additionally takes `py-2` (stacked/column) or `px-2 w-full` (row) so the divider gutters line up.

## Best practices

None published for this component — the page has no Best Practices accordion (When to use / Behavior / Accessibility). When re-implementing, infer sensible defaults from the demo progression instead:

- Start from a bare `Card` (padding only, no chrome) for content that just needs a grouping surface without visual weight.
- Reach for `border` + `shadow` together (they're always paired in the docs) when the card needs to read as elevated/separated from the page background — don't apply `shadow` without `border`.
- Use `hoverable` when the card itself is the interactive/clickable unit, not when it merely contains interactive children.
- Use `borderBetween` for card-as-list patterns (option pickers, settings rows) instead of manually adding per-child borders; pick `direction="row"` when the options should sit side by side (dividers become vertical) versus the default stacked layout (dividers stay horizontal).
- Use `secondary` for a de-emphasized/nested card, e.g. a card inside a card or a lower-priority grouping, rather than inventing a custom muted background class.

## Design notes

- Padding: `p-4` (16px) on the card container in every example; child spacing uses `py-2` (8px vertical) for stacked options or `px-2` (8px horizontal) + `w-full` for row-laid-out options.
- Typography: body text inside cards uses the `text-copy-14` type-scale token (14px copy style) with `text-gray-900` for foreground color — this is the standard Geist copy-text pairing, not a card-specific token.
- No component-specific `--ds-*` CSS custom properties or `material-*` classes appeared in the captured examples (those constructs showed up in an unrelated Grid component's flight payload, not Card's) — Card's visual states are controlled purely through the boolean props (`border`, `shadow`, `hoverable`, `secondary`, `borderBetween`) rather than raw utility overrides, implying the visual treatment (border color/width, shadow depth, hover transition, secondary background) is baked into the component's internal styles and not exposed as tokens on this page.
- `border` and `shadow` are always demonstrated together, never independently — treat them as a natural pair (bordered-and-elevated) in the rebuild, though they remain separate boolean props.
- `borderBetween` divider orientation is derived, not directly configurable: it always renders perpendicular to the `direction` axis (horizontal rules when children stack in a column / default, vertical rules when `direction="row"`).
- No explicit size variants, color/intent variants beyond `secondary`, or motion/animation details were present in the docs prose (no Best Practices section to source a stated hover-transition duration) — treat hover motion as "match Geist's standard interactive-surface transition" absent a documented value.

## Notes on extraction

- The page was server-rendered directly in the initial HTML for its own prose/section headings and demo captions (parsed via `html.parser`), and the six "Show code" JSX examples were pulled from the Next.js flight payload (`self.__next_f.push([1,"..."])`, a single large chunk) by matching `__rawString__:\`...\`,children:` blocks and decoding JSON string escapes.
- The flight payload also contained a second, unrelated component's full MDX render (the **Browser** component, including its own Best Practices/When-to-use/Behavior/Accessibility text) — this is Next.js prefetching the "Next" pagination link's page data, not part of the Card page. It was identified and excluded by checking `frontmatter:{title:"Browser",...}` markers before use.
- No 404s or slug variants needed; the page fetched cleanly at ~193KB on first try.
