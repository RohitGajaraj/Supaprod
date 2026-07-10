# Note

> "Display text that requires attention or provides additional information."

Source: https://vercel.com/geist/note (fetched 2026-07-10/11, server-rendered HTML + Next.js flight payload, ~538KB).

## Sections documented

- **Default** — three sizes side by side: `size="small"`, default (no size prop), `size="large"`. Shows the base note with only body text, no label/action.
- **Action** — a Note with a single inline CTA passed via the `action` prop (a small `Button`, e.g. "Upgrade"). Two examples: short body text, and a long body text that wraps to two+ lines, demonstrating the Note grows in height to fit wrapped copy while the action stays aligned.
- **Success** — `type="success"` in three configurations: plain, with `action`, and with `action` + inline `Link` ("Check the documentation to learn more.").
- **Error** — `type="error"`, same three configurations as Success (plain / with action / with action + link).
- **Warning** — `type="warning"`, same three configurations.
- **Secondary** — `type="secondary"`, same three configurations.
- **Violet** — `type="violet"`, same three configurations.
- **Cyan** — `type="cyan"`, same three configurations.
- **Disabled** — `disabled` combined with `fill` and `type="warning"`; two examples (plain warning copy, and warning + inline link copy) showing the disabled+filled visual treatment.
- **Types × label (three sub-demos in one section)**:
  - **Default label** — iterates every `UseTypeTypes` value (`secondary`, `tertiary`, `warning`, `success`, `default`, `alert`, `error`, `lite`, `ghost`, `alert` again, `violet`, `cyan`, `rotate-ccw`) rendering both a plain `<Note type={t}>` and a `<Note fill type={t}>` for each, using the type's own default icon/label.
  - **Custom label** — same type loop, but each Note additionally passes `label={t}` to override the auto label with the raw type string as text.
  - **No label** — same type loop with `label={false}` to suppress the label/icon entirely, for both plain and `fill` variants.
- **Best Practices** (accordion, three subsections: *When to use*, *Behavior*, *Content* — no separate Accessibility subsection appears on this page).

## API

### `Note` (from `@vercel/geistcn/components`)

Props observed across the examples:

- `size?: 'small' | 'medium' (default) | 'large'` — only shown in the Default section; no `size` prop appears once `type`/`fill`/`label` demos start (those default to medium).
- `type?: UseTypeTypes` — a shared enum type also used elsewhere in Geist (`UseTypeTypes` imported from `@vercel/geistcn/utils/use-type`). Observed values: `'default'` (omitting the prop), `'secondary'`, `'tertiary'`, `'success'`, `'error'`, `'warning'`, `'alert'`, `'lite'`, `'ghost'`, `'violet'`, `'cyan'`, plus a `'rotate-ccw'` value used in the demo loop (an icon-name-shaped type, likely for testing/edge-case coverage rather than a real semantic type — treat with caution, may be a demo artifact).
  - Docs explicitly note: **no `type="info"`** — omit `type` for the default info icon, or use `type="secondary"` for neutral copy.
- `fill?: boolean` — renders a solid/filled background variant instead of the default subtle/outlined treatment. Demonstrated for every `type`.
- `disabled?: boolean` — shown combined with `fill` and `type="warning"`; visually mutes the note (and presumably disables its `action`).
- `label?: string | false` — overrides the type's default label text; `false` hides the label (and its icon) altogether.
- `action?: ReactNode` — a single inline CTA slot, populated with `<Button size="small">Upgrade</Button>` in every example. Docs are explicit: **one action only**, never a second button.
- `children: ReactNode` — the body copy; can contain inline `Link` elements (`@vercel/geistcn/components`, rendered with `data-zone="same" href="..."`).

### Composition patterns

```tsx
import { Note } from '@vercel/geistcn/components';

<Note size="small">A small note.</Note>
<Note>A default note.</Note>
<Note size="large">A large note.</Note>
```

```tsx
import { Button, Note } from '@vercel/geistcn/components';

<Note action={<Button size="small">Upgrade</Button>}>
  This note details some information.
</Note>
```

```tsx
import { Button, Link, Note } from '@vercel/geistcn/components';

<Note type="success">This note details some success information.</Note>

<Note action={<Button size="small">Upgrade</Button>} type="success">
  This note details some success information.
</Note>

<Note action={<Button size="small">Upgrade</Button>} type="success">
  This note details some success information. Check{' '}
  <Link href="/geist#">the documentation</Link>{' '}
  to learn more.
</Note>
```

(Identical three-tier pattern repeats for `type="error"`, `"warning"`, `"secondary"`, `"violet"`, `"cyan"`.)

```tsx
// Disabled + filled
<Note action={<Button size="small">Upgrade</Button>} disabled fill type="warning">
  This note details a warning.
</Note>
```

```tsx
// Full type/label/fill matrix
import { Fragment, type JSX } from 'react';
import { Note } from '@vercel/geistcn/components';
import type { UseTypeTypes } from '@vercel/geistcn/utils/use-type';

const types: UseTypeTypes[] = [
  'secondary', 'tertiary', 'warning', 'success', 'default',
  'alert', 'error', 'lite', 'ghost', 'alert', 'violet', 'cyan', 'rotate-ccw',
];

// Default label (uses the type's own icon/label)
<Note type={t}>This is a note of type `{t}`.</Note>
<Note fill type={t}>This is a fill note of type `{t}`.</Note>

// Custom label (overrides the label text)
<Note label={t} type={t}>This is a note of type `{t}`.</Note>
<Note fill label={t} type={t}>This is a fill note of type `{t}`.</Note>

// No label (suppresses label + icon)
<Note label={false} type={t}>This is a note of type `{t}`.</Note>
<Note fill label={false} type={t}>This is a fill note of type `{t}`.</Note>
```

## Best practices (paraphrased)

**When to use**
- Reach for Note when feedback is inline and contextual — attached directly to the field, card, or section it explains (e.g. a region-change warning sitting right above the region picker, a rate-limit note beside a usage gauge).
- Escalate to a different component when the message isn't inline: use Banner for page-level/system-wide messages that need a CTA, Toast for a transient one-off acknowledgment, and Modal when the user must confirm something destructive.
- Pick `type` by what the message means, not by vibe: `error` for something the user must fix, `warning` for a consequence they should acknowledge, `success` for a check that passed, `secondary` for neutral/informational copy.

**Behavior**
- Treat a Note as persistent state, not a toast — it should stay visible until the underlying condition actually changes. Don't bolt on a dismiss control; a close button competes with the message itself.
- Cap it at one Note per concept/section. If a card ends up with three stacked Notes, that's a sign the page's information architecture needs fixing, not that the Notes need trimming.
- The `action` slot is for exactly one inline CTA — never pair it with a second button.

**Content**
- `label` should be a tight 1-2 word, Title Case topic tag (e.g. "Region Change", "Rate Limit", "Plan Limit") — avoid filler openers like "Heads Up", "FYI", or literally "Note".
- The body (`children`) should be one active-voice sentence that states the actual impact (e.g. "Changing this region restarts all functions.") rather than hedging or describing the situation passively.
- There's no `info` type — leave `type` unset to get the default info icon, or use `type="secondary"` for neutral copy that still wants the muted styling.
- Punctuation rule: short label fragments take no trailing period; full sentences in the body do.

## Design notes

- **Sizes**: `small` / default (medium) / `large` — no literal px values were exposed in the fetched markup (classnames are hashed/CSS-in-JS), but the three-size demo confirms a discrete small/medium/large scale consistent with other Geist controls.
- **Type palette observed via CSS custom properties present on the page** (shared Geist design tokens, not necessarily Note-exclusive): `--ds-amber-800`, `--ds-amber-900` (warning), `--ds-red-900` (error), `--ds-blue-300` / `--ds-blue-700` / `--ds-blue-900` (info/secondary-ish blues), `--ds-gray-100/200/400/700/900/1000` and `--ds-gray-alpha-100/200/400/500/600` (neutral/secondary/lite/ghost surfaces), `--ds-background-100`, `--ds-shadow-border` / `--ds-shadow-border-small` (the outlined/default Note's border), `--ds-focus-color` / `--ds-focus-ring` (focus state, relevant if the Note or its action button is focusable), `--ds-size-small` / `--ds-size-medium` / `--ds-size-large` (control-size tokens, line up with the `size` prop).
- **Typography classes seen on the page**: `text-copy-13/14/16/20` (body copy sizes), `text-label-12` (the label tag), `text-heading-16/20/24/40` (used elsewhere on the doc page, not confirmed Note-specific), `text-gray-700/900/1000` (body/label color roles).
- **`type` set is large** (11+ semantic values: default, secondary, tertiary, success, error, warning, alert, lite, ghost, violet, cyan) — more than the classic 4 (info/success/warning/error) alert palette; `violet` and `cyan` read as "brand/accent" notes rather than status notes, `lite` and `ghost` as lower-emphasis neutral variants, `tertiary` as an additional muted step below `secondary`.
- **`fill` is a binary modifier** orthogonal to `type` — every type has both an outlined (default) and a solid/filled rendering, doubling the visual matrix (11 types x 2 fill states x 3 label states demoed).
- **`disabled` was only demonstrated combined with `fill` and `type="warning"`** — implies disabled likely mutes opacity/color and disables the `action` button; not shown in an outlined (non-fill) state on this page.
- **Label/icon coupling**: the default label is tied one-to-one with `type` (each type ships its own icon + default label text); `label={string}` swaps only the text while keeping the type's icon; `label={false}` removes both icon and text, leaving pure body copy.
- **Action button convention**: every action example uses `<Button size="small">`, implying the Note's action slot is designed for the small Button size specifically (not default/large).
- **Inline links** inside Note body copy use `data-zone="same"` on the `Link` component — a routing/analytics attribute rather than a visual one, but worth preserving if porting the `Link` primitive too.
- No motion/transition behavior was described in the prose (no fade-in/dismiss animation documented) — consistent with the "persistent, no dismiss control" behavior rule above.
