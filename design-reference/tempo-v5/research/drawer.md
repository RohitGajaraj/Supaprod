# Drawer

> "Display content in a separate view from the existing context."

Source: https://vercel.com/geist/drawer (Geist Design System, `@vercel/geistcn/components`)

## Sections documented

- **Default** — the baseline demo: a `Button` that opens a `Drawer` containing a title paragraph and a body paragraph. Page note: "Only use a Drawer on small viewports. Shown here at any viewport for demonstration."
- **Custom height** — same structure as Default but passes an explicit `height={200}` prop to the `Drawer`, showing the drawer sized to a fixed pixel height instead of its default/content-driven height.
- **Best Practices** — an accordion with four subsections: When to use, Behavior, Content, Accessibility (see below).

No props table, no Sizes/Types/Variants/States sections, and no additional layout/edge-case demos are present on this page — it is a two-demo + best-practices page only.

## API

Import:
```tsx
import { Button, Drawer } from '@vercel/geistcn/components';
```

### `Drawer` — usage pattern (controlled, from the Default demo)
```tsx
import { Button, Drawer } from '@vercel/geistcn/components';
import { useState, type JSX } from 'react';

export function Component(): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={(): void => setOpen(true)}>Open</Button>
      <Drawer onDismiss={(): void => setOpen(false)} show={open}>
        <div className="flex flex-col items-stretch justify-start gap-2 flex-initial p-12">
          <p className="text-[18px] leading-[24px] font-semibold text-center">
            A drawer title
          </p>
          <p className="text-copy-14 text-center">Drawer body</p>
        </div>
      </Drawer>
    </>
  );
}
```

### `Drawer` — custom height (from the Custom height demo)
```tsx
import { Button, Drawer } from '@vercel/geistcn/components';
import { useState, type JSX } from 'react';

export function Component(): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={(): void => setOpen(true)}>Open</Button>
      <Drawer height={200} onDismiss={(): void => setOpen(false)} show={open}>
        <div className="flex flex-col items-stretch justify-start gap-2 flex-initial p-12">
          <p className="text-[18px] leading-[24px] font-semibold text-center">
            A drawer title
          </p>
          <p className="text-copy-14 text-center">Drawer body</p>
        </div>
      </Drawer>
    </>
  );
}
```

### Props observed
- `show: boolean` — controlled open state (rendered even when closed; visibility driven by this prop, no unmount/mount pattern shown).
- `onDismiss: () => void` — fired on any dismiss interaction (outside tap, swipe-down, Escape/back gesture per Best Practices copy); the demo wires it to `setOpen(false)`.
- `height?: number` — pixel height override for the drawer frame (demoed as `height={200}`); when omitted the drawer sizes to its default/content height.
- `children` — free-form content; the demo's convention is a flex column wrapper (`flex flex-col items-stretch justify-start gap-2 flex-initial p-12`) holding a title-styled paragraph and a body paragraph.

### Referenced but not shown in code
The Best Practices prose references additional API surface not demonstrated in the two code samples above — these are real prop/subcomponent names from the docs, worth carrying into an implementation even though no JSX example was rendered for them:
- `DrawerTitle` — a dedicated title subcomponent (the demo above substitutes a styled `<p>` instead of importing it).
- `verticalScroll` — a prop to make the drawer body scroll internally rather than the page behind it.
- `customHeight` — referenced in prose as the mechanism for capping content height (likely the same lever as the `height` prop demoed above, though the docs use both names in different places).

### Composition pattern
- Trigger (`Button`) and `Drawer` are siblings in a fragment; open state lives in the parent and is passed down as `show`, with `onDismiss` closing it.
- Drawer content is unstructured children — no required subcomponent wrapper is shown, though `DrawerTitle` exists as an optional title primitive per the Best Practices text.

## Best practices

**When to use**
- Reserve Drawer for small/mobile viewports. On desktop, use `Modal` for a blocking, centered flow, or `Sheet` for a lateral panel — don't force Drawer into a desktop layout.
- Never use Drawer for destructive-action confirmation; its dismiss affordances are lighter than a Modal's blocking dim, which undersells the stakes of delete/revoke flows. Use `Modal` for those.
- Good fit: short, single-purpose mobile interactions — one form, a filter panel, or a single primary action next to a `Cancel`.

**Behavior**
- Both tap-outside and swipe-down should dismiss by default. Only suppress them when the form inside has unsaved (dirty) input that would be lost.
- Let the body scroll inside its own frame instead of the page behind it (the `verticalScroll` prop is the lever for this).
- Only constrain height (`customHeight`/`height`) when the default height would clip the primary action — the main button and `Cancel` must always stay visible without scrolling.

**Content**
- Title should name what the specific view does ("Deployment Details", "Filter Logs") — Title Case, and never just a repeat of the page's own heading.
- Body copy is sentence case. Keep actions to one primary `Verb + Noun` button plus a literal `Cancel`; don't try to cram long destructive-consequence copy into the smaller drawer frame.

**Accessibility**
- Trap focus inside the drawer while it's open; return focus to the trigger element when it closes.
- Escape should dismiss it, and on mobile the system back gesture should work as a dismiss too — don't force users to hunt for a close button.
- Lock background scroll while open and restore it on close, specifically to avoid iOS rubber-band scroll bleeding through behind the drawer.

## Design notes

- Content wrapper class in the demo: `flex flex-col items-stretch justify-start gap-2 flex-initial p-12` — generous padding (`p-12`), vertical stack, stretched items, small gap.
- Title text style: `text-[18px] leading-[24px] font-semibold text-center` — 18px/24px semibold, centered (arbitrary pixel values, not a named type-scale token in this demo).
- Body text style: `text-copy-14 text-center` — uses the design system's `text-copy-14` token (Geist's copy/body type scale) rather than an arbitrary size, centered.
- `height` prop takes a raw number (pixels), demoed at `200`.
- No color/state tokens (`--ds-*`, `material-*`) appear in the two code samples — this page's demos don't expose the drawer chrome/backdrop styling, only the content region.
- Motion/transition behavior is not described in the code or prose beyond "swipe-down dismiss" and scroll-lock — no explicit easing/duration values are documented on this page; assume standard Geist sheet slide-up/slide-down transition conventions used elsewhere in the system (not specified here).
- No dedicated close (X) button is shown in either demo — dismissal in the samples is entirely via `onDismiss` (tap-outside / swipe / Escape / back gesture per Best Practices), not an explicit UI affordance.
