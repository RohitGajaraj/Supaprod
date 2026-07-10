# Context Card

> Vercel's own one-line tag for this page is literally the word **"Tooltip"** (`frontmatter.description: "Tooltip"`, rendered verbatim as the subtitle under the `<h1>Context Card</h1>`). There is no other prose intro — the page treats Context Card as a member of the Tooltip family: a hover/focus-revealed panel, just carrying richer entity content than a one-line tooltip.

Source: https://vercel.com/geist/context-card (fetched 2026-07-10/11, 182KB static HTML, RSC flight payload parsed for code + copy).

## Sections documented

- **Default** — one row of four `ContextCardTrigger` instances, each wrapping a `<span>` trigger, demonstrating the four `side` placements: `top`, `bottom`, `left`, `right`. Each uses the same `content` string ("The Evil Rabbit Jumped over the Fence").
- **Alignment** — one row of three `ContextCardTrigger` instances wrapping `Button` triggers, demonstrating the three `align` values: `start`, `center`, `end`, all with `side="bottom"`. Prose line: "Use `align` to position the card at the start, center, or end of the trigger."
- **Best Practices** — an accordion-style block with four subsections: **When to use**, **Behavior**, **Content**, **Accessibility** (see below). No separate "States" or "Sizes" sections exist on this page — Context Card is documented as a single-size, content-driven component whose only documented variance is placement (`side`) and alignment (`align`).

No other demo sections (no Types, Sizes, States, or edge-case blocks) are present in the flight payload — the page is intentionally minimal for this component.

## API

Single exported component: **`ContextCardTrigger`**, imported from `@vercel/geistcn/components`.

```tsx
import { ContextCardTrigger } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return (
    <div className="flex flex-row items-stretch justify-around flex-initial">
      <div className="flex flex-col items-center justify-center flex-initial">
        <ContextCardTrigger
          content="The Evil Rabbit Jumped over the Fence"
          side="top"
        >
          <span>Top</span>
        </ContextCardTrigger>
      </div>
      <div className="flex flex-col items-center justify-center flex-initial">
        <ContextCardTrigger
          content="The Evil Rabbit Jumped over the Fence"
          side="bottom"
        >
          <span>Bottom</span>
        </ContextCardTrigger>
      </div>
      <div className="flex flex-col items-center justify-center flex-initial">
        <ContextCardTrigger
          content="The Evil Rabbit Jumped over the Fence"
          side="left"
        >
          <span>Left</span>
        </ContextCardTrigger>
      </div>
      <div className="flex flex-col items-center justify-center flex-initial">
        <ContextCardTrigger
          content="The Evil Rabbit Jumped over the Fence"
          side="right"
        >
          <span>Right</span>
        </ContextCardTrigger>
      </div>
    </div>
  );
}
```

```tsx
import { ContextCardTrigger, Button } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return (
    <div className="flex gap-4 items-center justify-center">
      <ContextCardTrigger
        align="start"
        content="Start alignment positions the card at the beginning edge."
        side="bottom"
      >
        <Button>Start</Button>
      </ContextCardTrigger>
      <ContextCardTrigger
        align="center"
        content="Center alignment positions the card in the middle."
        side="bottom"
      >
        <Button>Center</Button>
      </ContextCardTrigger>
      <ContextCardTrigger
        align="end"
        content="End alignment positions the card at the ending edge."
        side="bottom"
      >
        <Button>End</Button>
      </ContextCardTrigger>
    </div>
  );
}
```

### Props observed (from the two code examples — this is the full documented surface)

`ContextCardTrigger`:
- `content: string` — required. The panel body. Both examples pass a plain string, not a JSX node, so the documented API is text-first (metadata-row markup, per Best Practices, would presumably go here as richer children/markup, but the demo page only shows a plain string).
- `side: "top" | "bottom" | "left" | "right"` — placement of the panel relative to the trigger. Same enum shape as a standard Radix `Popover`/`Tooltip` `side` prop.
- `align: "start" | "center" | "end"` — alignment along the cross-axis of the chosen side. Same enum shape as a standard Radix `align` prop.
- `children: ReactNode` — the trigger element. Demonstrated wrapping a bare `<span>` and a `Button`, implying it works with arbitrary inline or interactive elements (i.e. it's an `asChild`/wrapper pattern, consistent with other Geist components built on Radix primitives).

No `open`/`onOpenChange` (controlled-state), `delayDuration`, `sideOffset`, or `disabled` props appear anywhere in the payload — either undocumented on this page or inherited silently from an underlying Radix primitive. Composition pattern: `Button` (also from `@vercel/geistcn/components`) is used directly as a child, confirming Context Card composes with other Geist components as its trigger without special wrapping.

## Best practices

Paraphrased from the page's four Best Practices subsections:

**When to use**
- Use it to surface entity metadata (user, deployment, project, API key, etc.) on hover/focus — typically triggered from a name link or avatar inside dense data (tables, lists).
- If you only need a single line of "why" text with no structured metadata, use Tooltip instead. If the content is long-form, editable, or needs to persist, route to a Drawer or a full detail page instead.
- Never put destructive actions inside it — since it can dismiss the moment the cursor leaves, a user could lose track of a destructive action before committing to it.

**Behavior**
- Opens on hover and keyboard focus; closes on cursor exit or blur. Keep roughly a 150ms open delay so it doesn't flash during a fast mouse sweep across a table/list.
- Limit interactive content to a single primary action (e.g. "View Project", "Open Settings"). More than one CTA turns it into a menu — use the Menu component for that case instead.
- Don't nest a Context Card inside a Tooltip or another Context Card — the second overlay layer will steal focus and trap keyboard users.

**Content**
- Lead with the entity name as a Title Case heading, with one identifying line underneath in sentence case (team slug, owner, deployment URL).
- Follow with 2 to 4 metadata rows shaped as `Label: value`. Labels are Title Case noun phrases ("Last Active", "Created", "Plan"); values follow standard table-cell formatting rules. Use an em dash (—) for unknown values — never "N/A" or "null".
- Don't repeat information the trigger already displays (e.g. don't re-show a deployment URL as the card's first line if the row it's attached to already shows it).

**Accessibility**
- The trigger must keep its own accessible name — the card is supplementary, not a replacement for it.
- Card content must be reachable by keyboard once the trigger has focus. Escape closes the card and returns focus to the trigger.

## Design notes

- No visible custom design tokens (no `--ds-*`, no `material-*`, no `text-label-*` classes) appear anywhere in this component's code examples or markup — unlike richer Geist pages, Context Card's own demo code uses only plain Tailwind layout utilities (`flex`, `flex-row`/`flex-col`, `items-center`, `items-stretch`, `justify-around`, `justify-center`, `gap-4`, `flex-initial`). This suggests the component's internal visual styling (radius, border, shadow, colors) is fully encapsulated inside `@vercel/geistcn/components` and not exposed/overridden via className in these examples — treat the demo markup as composition-only, not a styling reference.
- Enum surface is exactly two axes: `side` (top/bottom/left/right — 4 values) and `align` (start/center/end — 3 values), mirroring the standard Radix Popover/Tooltip positioning contract. No size variants, no visual/tone variants, no documented state props (loading/error/disabled) on this page.
- Motion: only one concrete timing value is documented — approximately 150ms as the entry (open) delay, explicitly to avoid flashing during fast cursor sweeps over dense UI (tables/lists). No exit-duration or easing values are given.
- Content model: fixed shape — one heading line (entity name, Title Case) + one identifying subline (sentence case) + 2 to 4 `Label: value` metadata rows + at most one primary CTA. Unknown values render as an em dash (—), never "N/A"/"null" — this is a concrete, enforceable formatting rule for a re-implementation.
- Interaction model: hover-or-focus open, blur-or-cursor-exit close, Escape closes and returns focus to trigger — i.e. build it on top of a Radix `Popover`/`HoverCard`-style primitive with `openDelay`/`closeDelay`, not a bespoke hover handler.
- Composability confirmed in code: Geist's own `Button` component is used unmodified as a `ContextCardTrigger` child, and a bare `<span>` also works — so the wrapper should not impose a required element type on its trigger child (`asChild`-style forwarding).
