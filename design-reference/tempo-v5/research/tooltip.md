# Tooltip

> "A set of headings, vertically stacked, that each reveal an related section of content." — (note: this is a stale/copy-pasted meta description from the Accordion component; the actual page content is entirely about Tooltip — a small floating label that appears near a trigger element on hover/focus to add context.)

## Sections documented

- **Default** — four `Tooltip` instances around a row of triggers labeled Top / Bottom / Left / Right, one per `position` value, each showing the same sample text ("The Evil Rabbit Jumped over the Fence"). Demonstrates the four cardinal `position` values and default hover-delay behavior.
- **No delay** — same Top/Bottom/Left/Right layout but every `Tooltip` passes `delay={false}`, showing the tooltip appears immediately instead of after the default entry delay.
- **Box align** — a 3x3 grid of labeled triggers (Bottom/Left, Bottom/Center, Bottom/Right, Left/Left, Left/Center, Left/Right, Right/Left, Right/Center, Right/Right) demonstrating the `boxAlign` prop (`left` / unset=center / `right`) combined with each `position`, i.e. how the tooltip box aligns relative to its anchor along the perpendicular axis.
- **Custom content** — Top/Bottom/Left/Right row where `text` is passed as JSX (a fragment containing `<b>` and `<i>` inline elements) instead of a plain string, showing the tooltip body accepts rich/formatted content.
- **Custom type** — Top/Bottom/Left/Right row where each `Tooltip` sets a `type` prop (`success`, `error`, `warning`, and presumably a fourth/default variant) to recolor the tooltip per semantic status.
- **Components** — a row showing the trigger element can be any interactive component, not just plain text/spans: a `Button` (`size="small"`), a `Badge` (`size="sm"`), a `Spinner`, and a `span` whose tooltip `text` itself contains a `Kbd` component (rendering "Search" + a `/` keyboard-shortcut chip). Demonstrates composing Tooltip with other Geist primitives both as the trigger and inside the tooltip body.
- **Other** — two edge-case triggers: "No tip indicator" (`tip={false}`, removes the little pointer/caret triangle) and "No center text" (`center={false}`, changes text alignment/positioning behavior for longer tooltip copy — sample text is deliberately longer: "The Evil Rabbit Jumped over the Fence multiple times.").
- **Best Practices** (accordion, four subsections): **When to use**, **Behavior**, **Content**, **Accessibility** — see paraphrased rules below.

## API

Import:
```tsx
import { Tooltip } from '@vercel/geistcn/components';
```

Composable helper components used alongside it in examples: `Button`, `Badge`, `Spinner`, `Kbd` (all from the same `@vercel/geistcn/components` package).

### Props observed (all on `<Tooltip>`)

| Prop | Type / values seen | Default (inferred) | Effect |
|---|---|---|---|
| `text` | `string \| ReactNode` (JSX fragment with inline `<b>`/`<i>`/`<Kbd>` allowed) | — (required) | The tooltip body content. |
| `position` | `"top" \| "bottom" \| "left" \| "right"` | `"top"` (omitted in the first "Top" example) | Which side of the trigger the tooltip renders on. |
| `boxAlign` | `"left" \| "right"` (omitted = center) | center | Aligns the tooltip box along the axis perpendicular to `position` (e.g. for `position="bottom"`, `boxAlign="left"` shifts the box to align its left edge, `boxAlign="right"` to the right, omitted = centered). |
| `delay` | `boolean` | `true` (default entry delay active) | `delay={false}` removes the default hover-open delay so the tooltip appears immediately. |
| `type` | `"success" \| "error" \| "warning"` (+ implied default/neutral) | default/neutral | Recolors the tooltip to communicate semantic status. |
| `tip` | `boolean` | `true` | `tip={false}` hides the small pointer/caret indicator connecting the tooltip box to the trigger. |
| `center` | `boolean` | `true` | `center={false}` changes text alignment/box centering behavior, used for longer tooltip strings. |

### Usage snippets

Basic four-position usage:
```tsx
<Tooltip text="The Evil Rabbit Jumped over the Fence">
  <span>Top</span>
</Tooltip>
<Tooltip position="bottom" text="The Evil Rabbit Jumped over the Fence">
  <span>Bottom</span>
</Tooltip>
<Tooltip position="left" text="The Evil Rabbit Jumped over the Fence">
  <span>Left</span>
</Tooltip>
<Tooltip position="right" text="The Evil Rabbit Jumped over the Fence">
  <span>Right</span>
</Tooltip>
```

No delay:
```tsx
<Tooltip delay={false} text="The Evil Rabbit Jumped over the Fence">
  <span>Top</span>
</Tooltip>
<Tooltip delay={false} position="bottom" text="The Evil Rabbit Jumped over the Fence">
  <span>Bottom</span>
</Tooltip>
```

Box align (3x3 matrix, pattern repeats for `position="left"` and `position="right"`):
```tsx
<Tooltip boxAlign="left" position="bottom" text="The Evil Rabbit Jumped over the Fence">
  <span>Bottom/Left</span>
</Tooltip>
<Tooltip position="bottom" text="The Evil Rabbit Jumped over the Fence">
  <span>Bottom/Center</span>
</Tooltip>
<Tooltip boxAlign="right" position="bottom" text="The Evil Rabbit Jumped over the Fence">
  <span>Bottom/Right</span>
</Tooltip>
```

Custom content (rich JSX `text`):
```tsx
<Tooltip
  text={
    <>
      The <b>Evil Rabbit</b> Jumped over the <i>Fence</i>.
    </>
  }
>
  <span>Top</span>
</Tooltip>
```

Custom type:
```tsx
<Tooltip text="The Evil Rabbit Jumped over the Fence" type="success">
  <span>Top</span>
</Tooltip>
<Tooltip position="bottom" text="The Evil Rabbit Jumped over the Fence" type="error">
  <span>Bottom</span>
</Tooltip>
<Tooltip position="left" text="The Evil Rabbit Jumped over the Fence" type="warning">
  <span>Left</span>
</Tooltip>
```

Composed with other components (trigger and/or body):
```tsx
import { Badge, Button, Spinner, Tooltip, Kbd } from '@vercel/geistcn/components';

<Tooltip position="bottom" text="The Evil Rabbit Jumped over the Fence">
  <Button size="small">Bottom</Button>
</Tooltip>
<Tooltip position="left" text="The Evil Rabbit Jumped over the Fence">
  <Badge size="sm">LEFT</Badge>
</Tooltip>
<Tooltip position="right" text="The Evil Rabbit Jumped over the Fence">
  <Spinner />
</Tooltip>
<Tooltip
  text={
    <>
      Search
      <Kbd>/</Kbd>
    </>
  }
>
  <span>Shortcut</span>
</Tooltip>
```

No tip / no center:
```tsx
<Tooltip text="The Evil Rabbit Jumped over the Fence" tip={false}>
  No tip indicator
</Tooltip>
<Tooltip center={false} text="The Evil Rabbit Jumped over the Fence multiple times.">
  No center text
</Tooltip>
```

## Best practices (paraphrased)

**When to use**
- A tooltip explains *why* something exists or a constraint on it, not *what* it is — the visible label already names the thing; the tooltip adds the limit, scope, or rule.
- If you need an entity preview with structured metadata (avatar + a few facts + an optional action), reach for a Context Card instead of overloading a Tooltip.
- If the content is long-form or needs to persist (survive a mouse-leave), use a Drawer or navigate to a page rather than cramming it into a Tooltip.
- Lifecycle badges (Alpha / Experimental / Beta / Early Access) should use a Tooltip to spell out the concrete limits attached to that stage — API stability, SLA, support commitment, pricing, data retention — not just restate the badge word.

**Behavior**
- Opens on both mouse hover and keyboard focus (not hover-only) — this is required for keyboard accessibility.
- Default open delay is about 150ms; keep it, since a delay-less tooltip flickers annoyingly as a mouse sweeps across the screen (the `delay={false}` variant should be an intentional exception, not the default).
- Never wrap a labeled form Input directly in a Tooltip — the hover/focus target ends up being the `<label>` element, not the input, and the tooltip text collides with the label for assistive tech. Instead attach the Tooltip to a separate icon-button placed next to the field.
- Keep any primary/critical action outside of a Tooltip's hover-only surface — touch-only users have no hover state and can never reach it.

**Content**
- Keep it to one short sentence or fragment; use sentence case; drop the trailing period if it's a single fragment.
- Don't restate the visible label (e.g. a "Rate Limit" button doesn't need a tooltip that just says "Rate Limit") and don't describe the interaction itself (e.g. "Click to override").
- Lifecycle tooltips follow the template `{Label}: {one-line meaning}. {Specific limit}.` — and if a feature is both a lifecycle stage and paid, fold both facts into one tooltip rather than stacking two separate badges.

**Accessibility**
- An icon-only trigger must still carry its own `aria-label` naming the action — the Tooltip's visible text is supplementary context, it is not a substitute for the accessible name.
- Escape dismisses the open tooltip and returns keyboard focus to the trigger element.

## Design notes

- No raw `--ds-*` CSS custom-property names or `material-*` classnames appear anywhere in the rendered markup or the code examples for this page — the demo markup only uses plain Tailwind-style utility classes (`flex relative min-w-px max-w-full flex-row flex-wrap flex-1`, etc.) for the *layout scaffolding* around each demo, not for the Tooltip component's own internals, so no token values could be recovered this way (page renders the compiled component as a black box, not its internal class names/styles).
- Positions are the four cardinal directions only: `top` (default), `bottom`, `left`, `right` — no diagonal/corner placements.
- `boxAlign` (`left`/center/`right`) is only demonstrated combined with `bottom`, `left`, and `right` positions (a 3x3 matrix in the page), implying it's most meaningful perpendicular to the anchor's placement axis; not shown paired with `position="top"` in the examples (may still be valid).
- `type` semantic variants confirmed in code: `success`, `error`, `warning` (plus an implicit default/neutral gray/black tooltip used in every other demo that doesn't pass `type`).
- `tip` (default `true`) controls a small caret/pointer indicator connecting the box to the trigger — can be suppressed with `tip={false}`.
- `center` (default `true`) affects text centering/box behavior for longer copy; the "No center text" demo pairs `center={false}` with noticeably longer sample text ("...multiple times.") suggesting default centering can look odd on multi-word/longer strings and left/start-aligned text reads better there.
- Sample copy used consistently across almost every demo: "The Evil Rabbit Jumped over the Fence" — a stock Vercel/Geist placeholder sentence reused throughout their design-system docs (also seen on other Geist component pages), not specific to Tooltip.
- Trigger element is fully generic — `<span>`, `<Button size="small">`, `<Badge size="sm">`, `<Spinner />`, and plain text children were all shown working as the trigger, confirming Tooltip wraps arbitrary children rather than requiring a specific element type.
- Tooltip body content (`text`) accepts not just strings but full JSX — inline formatting (`<b>`, `<i>`) and even other components (`<Kbd>/</Kbd>` for a keyboard-shortcut chip) were demonstrated inside `text`.
- No explicit pixel sizes, radii, animation-duration values, or color hex/token values were present anywhere in the fetched HTML/flight payload for this component — Vercel's docs render the actual compiled Tooltip via its real component library rather than exposing its internal styles in the page source, so those specifics were not recoverable via static fetch (would require a live browser + computed-style inspection to pull exact px/radius/motion-curve values).

## Notes for re-implementation

- No 404 encountered; page fetched cleanly (~386KB HTML, matches expected server-rendered size range).
- The page's `<meta name="description">` is a stale copy of the Accordion component's blurb ("A set of headings, vertically stacked...") — almost certainly a CMS/copy bug on Vercel's side, not something to reproduce; treat this file's own one-line purpose in the header above as informational, not literal Tooltip guidance.
- No separate sub-pages were linked specifically for Tooltip beyond the standard Foundations / Components sidebar (Avatar, Badge, ... Tooltip, Video, etc.) — nothing additional to follow up on.
- Exact motion timing beyond "~150ms entry delay" (mentioned in prose) and exact color/spacing tokens are not present in static HTML; would need a live-rendered inspection (Playwright/Chrome DevTools) to pull computed CSS if pixel-perfect values are required beyond what's captured above.
