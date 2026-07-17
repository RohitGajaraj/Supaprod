# Iconography & illustration (identity layer)

> The layer that makes a screen unmistakably Supaprod without adding a single pixel of
> decoration: a disciplined lucide icon system, a grid-born geometric illustration
> recipe, the pixel monogram and wordmark, and a short, capped catalog of personality
> touches. Every part of this pattern is restraint expressed as a recipe, not a license
> to add more art.
>
> Extension — base: Button (`svgOnly` + `aria-label`), EmptyState / EmptyStateIcon,
> AvatarWithIcon, the color / typography / materials tokens, Geist Pixel · inspiration:
> Arc Browser (subtle personality confined to floating-surface motion, never to static
> chrome) and Anthropic's product surfaces (geometric restraint, sparse chromatic accent,
> generous neutral space) — principles paraphrased in our own words below, never their
> assets, marks, or copy.

## Anatomy — the parts, named, with layout relationships

This pattern covers four families. Each has its own anatomy; together they are "the
identity layer" — everything in DESIGN-TEMPO.md §8.

**1. Icon glyph** (lucide)

```
┌ bounding box: 16px (default) or 20px (headers/nav) ┐
│                                                     │
│   stroke: 1.5px, round joins, outline only          │
│   viewBox 0 0 24 24 (lucide native) scaled to fit   │
│                                                     │
└─────────────────────────────────────────────────────┘
        │
        ▼ optional pairing (the common case)
┌ icon + label row ───────────────────────────────────┐
│  [icon 16px]  gap 8px (--geist-space-2x)  Label text │   ← icon color = label's text color
└───────────────────────────────────────────────────────┘
        │
        ▼ optional container (icon-only)
┌ icon-only control ───────────────────────────────────┐
│  32/36/40px control box, icon centered, aria-label    │  ← the box is the hit target,
│  set on the control itself, never the bare glyph      │     never the glyph alone
└───────────────────────────────────────────────────────┘
```

An icon is never a freestanding interactive element. It is either decorative content
inside something else (a label row, a card header, a table cell) or it is the sole
visible content of a real `Button`/`ButtonLink` with `svgOnly` + `aria-label` — there is
no third shape.

**2. Grid-born illustration composition**

```
┌ canvas (cropped fragment of a larger implied grid, not a closed sticker) ─┐
│  ┆       ┆       ┆                                                        │
│  ┆       ┆       ▪ ← pixel glyph (Geist Pixel Square), --ds-gray-1000     │
│┄┄┼┄┄┄┄┄┄┄┼┄┄┄┄┄┄┄┼┄┄  1px gridlines, --ds-gray-400, evenly spaced          │
│  ┆       ┆       ┆      on a --geist-space rhythm (16 or 24px cells)      │
│  ┆   ▮ ← the ONE ember accent (≤10% of the composition's area)            │
│  ┆       ┆       ┆                                                        │
└────────────────────────────────────────────────────────────────────────────┘
```

Parts: the **canvas** (a bounded region, deliberately cropped at its edges rather than
framed — the grid should read as a fragment of a bigger system, not a closed picture);
**gridlines** (1px solid `--ds-gray-400`, never a border around the whole canvas — only
the internal rule lines); **pixel glyphs** (one to three Geist Pixel Square characters —
a numeral, a letter, or a simple glyph shape — sitting on grid intersections, colored
`--ds-gray-900`/`-1000`, never chromatic); and the **ember accent** (exactly one small
mark — a filled cell, a short line segment, a single glyph — recolored to
`--ds-ember-600`/`-700`, capped at roughly a tenth of the composition's visual weight).
No other color appears in a grid-born composition.

**3. Wordmark + monogram lockup**

```
┌ clear space = monogram's own width (w), on all four sides ─────────────┐
│  w                                                                w    │
│ ┌───┐                                                                 │
│w│ C │  Supaprod            ← horizontal lockup: monogram + wordmark    │
│ └───┘  (Geist Sans 600, tight tracking)                               │
│  w                                                                w    │
└─────────────────────────────────────────────────────────────────────────┘

┌ w ┐
│ C │  ← monogram alone: collapsed nav rail, favicon, loading state
└───┘     (Geist Pixel Square glyph, fixed square aspect, no lockup text)
```

The monogram is a single Geist Pixel Square glyph rendered as a fixed square. The
wordmark is the literal word "Supaprod" set in Geist Sans 600 with tight tracking (the
same tracking curve the heading classes use at that size — see Tokens). Clear space
around either the monogram alone or the full lockup equals the monogram's own width on
every side; nothing (a border, another control, page padding that reads as tighter than
this) may intrude inside that margin.

**4. Personality-touch instance**

One sanctioned touch, once per surface, chosen from exactly three:

```
Pixel numeral        Ember completion glow       Springy palette settle
┌────────┐            ┌──────────────┐             ┌──────────────────┐
│   42   │ ← Geist     │ ▓▓▓▓▓▓▓▓▓▓  │ ← soft ember  │  ╱‾‾‾‾‾‾‾‾‾‾╲   │ ← overlay
│        │   Pixel     │  (finished   │   glow, edge  │ │  scale-in  │ │   scales from
└────────┘   Square     │   run card)  │   only, not   │  ╲__________╱  │   0.96 → 1 with
             glyph                        a full fill                    a slight swift-
                                                                          easing overshoot
```

## Variants — every sanctioned variant and when to use each

**Icon variants**

| Variant                                    | When to use                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Labeled icon** (icon + text, same color) | The default pairing — nav items, buttons with visible text, list-row leading icons, card metadata.                                                                                                                                                                                                                            |
| **Standalone decorative icon**             | An icon that reinforces meaning already carried by adjacent text (a chevron on a disclosure row, a small status glyph in a table cell) and needs no independent announcement — mark it `aria-hidden`.                                                                                                                         |
| **Icon-only control**                      | A control whose action is unambiguous from context and space is tight (toolbar buttons, a close affordance, a card's overflow trigger). Always a real `Button`/`ButtonLink` with `svgOnly` + `aria-label`, never a bare `<svg onClick>`.                                                                                      |
| **Icon chip**                              | The 32px icon inside a tinted/background tile, used once per `EmptyState` (`EmptyStateIcon`'s own canonical sizing) or inside `AvatarWithIcon` (14px icon, `iconBackground`, `color="gray-900"`) for a system-generated "avatar." Never invent a second chip treatment — reuse whichever of these two the surface already is. |
| **Status icon**                            | A small (12 to 14px) icon colored by status role — green for success, red for error, amber for warning — used only where the icon _is_ the status (a run's outcome glyph in a timeline), never as color-for-decoration on an otherwise-neutral icon.                                                                          |

**Illustration composition variants**

| Variant                                 | When to use                                                                                                                                                                                                                               |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Micro composition** (~48 to 64px)     | Inline beside a stat, a card header, or a small panel — a hint of the grid language, not a scene.                                                                                                                                         |
| **Compact composition** (~96 to 160px)  | The default empty-state illustration; sized to sit where `EmptyStateIcon` would otherwise sit, but as a small grid-born fragment instead of a single glyph-in-a-chip when the moment deserves more presence (first-run, a cleared queue). |
| **Feature composition** (~240 to 400px) | Launch screens, feature-announcement panels, onboarding hero moments — the only case where the grid-born recipe is allowed to take up serious canvas, and still capped at one per screen.                                                 |

**Logo & wordmark variants**

| Variant                                     | When to use                                                                                                                                                                                                                                                           |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Monogram only**                           | Collapsed nav rail, favicon, browser tab, a loading/splash moment, anywhere the full wordmark would not fit or would repeat a wordmark already on screen.                                                                                                             |
| **Horizontal lockup** (monogram + wordmark) | Expanded nav rail header, marketing/landing header, the sign-in screen, any first-touch surface that should say the product's name once.                                                                                                                              |
| **Wordmark only**                           | Rare — dense text contexts (a legal footer line, an email signature) where the monogram would add width without adding recognition. Only sanctioned lockup shapes are these three; do not invent a stacked/vertical lockup without a founder decision (see Do/Don't). |

**Personality-touch variants** (pick at most one per surface)

| Variant                    | When to use                                                                                                                                                                                                                             |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Pixel numeral**          | A single number is the moment's whole point — an onboarding step count, a big milestone figure, an empty-state "0" that will become a real count. Render that one numeral in Geist Pixel Square; everything around it stays Geist Sans. |
| **Ember completion glow**  | A run, build, or job just finished successfully and the surface wants one beat of warmth to mark it — a soft ember-tinted glow at the edge of the card that reported it, never a full ember fill.                                       |
| **Springy palette settle** | Any floating surface's open transition (command palette, a spotlight-style search, a launch dialog) — the swift easing's built-in slight overshoot on `--ds-motion-overlay-scale`, not a separate bespoke bounce.                       |

## States — default/hover/active/focus/disabled/loading/empty/error

| State                      | Applies to                                                               | Tokens                                                                                                                                                                                                                                                                               |
| -------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Default**                | Labeled/standalone icon                                                  | Color inherits its pairing's text color: `--ds-gray-900` (secondary text pairing) or `--ds-gray-1000` (primary text pairing); stroke `1.5px`; size `16px` (`20px` in headers/nav).                                                                                                   |
| **Default (brand/active)** | An icon marking the active nav item, a selected row, or a brand moment   | Color `--ds-ember-600` (dark) / `--ds-ember-700` (light) — the only case an icon may take the brand hue.                                                                                                                                                                             |
| **Hover**                  | Icon-only control                                                        | Inherits the underlying `Button` variant's own hover fill/border step (see `button.md`); the glyph itself never changes color or weight on hover, only its container does.                                                                                                           |
| **Active (pressed)**       | Icon-only control                                                        | Inherits the underlying `Button` variant's active step; same rule — the container moves, the glyph does not.                                                                                                                                                                         |
| **Focus**                  | Icon-only control, any focusable lockup that doubles as a home link      | `--ds-focus-ring` (2px background + 2px ember ring) on the control box, never drawn around the bare glyph.                                                                                                                                                                           |
| **Disabled**               | Icon-only control                                                        | Inherits the underlying `Button`'s disabled treatment (reduced-contrast fill/text per `button.md`); pair with a `Tooltip` explaining why, per the cross-component contract in DESIGN-TEMPO.md §7.                                                                                    |
| **Loading**                | A grid-born composition standing in for content that has not arrived yet | Do not animate the gridlines or pixel glyphs as a skeleton — a static composition is itself the "nothing here yet" signal. If the surface needs a loading state, use the ordinary `Skeleton` primitive instead and hold the illustration for the true empty/zero state that follows. |
| **Empty**                  | Grid-born composition inside an `EmptyState`                             | One composition per whole empty state (never one per row/tile within it); paired with plain-words `title`/`description` per `empty-state.md`'s own content rules.                                                                                                                    |
| **Error**                  | Icon inside an error/status row                                          | Status icon recolored to `--ds-red-700`/`-800`/`-900` per theme, paired with the error text — never the grid-born illustration recipe, which is reserved for empty/first-run/celebratory moments, not failure.                                                                       |

## Interaction model — pointer, keyboard, screen-reader, motion

**Pointer**

- A labeled or standalone icon is never its own hit target — the hit target is whatever
  it sits inside (the row, the button, the card).
- An icon-only control's hit target is the full 32/36/40px control box, not the glyph's
  own visual bounds — a person aiming slightly off the drawn stroke still lands the
  click, per the standard control-size grid in DESIGN-TEMPO.md §5.
- A grid-born illustration is inert. If a surface wants the composition itself to be
  clickable (rare), wrap it in a real link/button and give that wrapper the interactive
  states above — never attach a click handler to the SVG/illustration alone.
- The monogram/wordmark lockup is clickable only when it functions as "go home" (nav
  rail header, marketing header) — then it is a real `Link`, not a styled `<div>`.

**Keyboard** (full map)

| Key                 | Where                                         | Effect                                                                                                                                                                                                                                                |
| ------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Tab` / `Shift+Tab` | Page                                          | Reaches every icon-only control as one stop (it is a real `Button`); reaches the monogram/wordmark lockup as one stop when it is a home link; skips standalone decorative icons and grid-born illustrations entirely — they are not in the tab order. |
| `Enter` / `Space`   | A focused icon-only control or lockup-as-link | Activates it.                                                                                                                                                                                                                                         |
| `Escape`            | N/A to this pattern directly                  | No illustration/icon in this pattern owns its own dismiss behavior; escape handling belongs to whatever overlay a personality touch might be riding inside (e.g. the command palette itself — see `command-palette.md`).                              |

**Screen reader**

- Decorative and standalone icons: `aria-hidden="true"`, always — the adjacent text or
  the control's own `aria-label` already carries the meaning.
- Icon-only controls: `aria-label` naming the action and its target ("Copy deployment
  URL," not "Copy" or "Icon"), per `button.md`'s own validator-enforced rule. Never set
  `aria-label` on a control that also has visible text.
- Grid-born illustrations: the composition itself is `aria-hidden="true"` (or
  `role="presentation"`); the real content a screen reader announces is the empty
  state's own `title`/`description` text sitting beside it, per `empty-state.md`.
- Monogram/wordmark: when it functions as a home link, the link carries an `aria-label`
  of `"Supaprod, go to home"` (or equivalent) rather than relying on the pixel glyph's
  shape, since a pixel-rendered "C" is not reliably announced as a letter by every
  screen reader.
- A pixel numeral used as a personality touch is still real text content (the actual
  digits), never an image — so it is announced normally with no extra `aria-*`.
- An ember completion glow adds no new information a screen reader must announce beyond
  whatever already-existing status text ("Build succeeded") triggered it; the glow is
  purely visual reinforcement, not an independent event.

**Motion**

- **Springy palette settle**: the overlay's own open transition — scale from
  `--ds-motion-overlay-scale` (0.96) to 1, `--ds-motion-overlay-timing`
  (`--ds-motion-timing-swift`), `--ds-motion-overlay-duration` (0.3s). This is not a
  bespoke animation to build; it is simply `command-palette.md`'s (or any
  `material-modal`/`material-fullscreen` surface's) existing open transition, and using
  that overlay is what satisfies the "personality touch" budget for that surface — do
  not stack a second bounce on top of it.
- **Ember completion glow**: a gentle opacity transition (in, hold briefly, fade out)
  using `--ds-motion-timing-swift` at a short, popover-scale duration
  (`--ds-motion-popover-duration`, 200ms, repeated once); never a looping pulse, never a
  full-fill flash.
- **Pixel numeral**: no bespoke entrance animation is required — it can simply appear
  with whatever the surrounding content's own entrance is (a fade, a route transition).
  If a count-up is used, gate its duration modestly and treat it exactly like any other
  micro-interaction ceiling (≤200ms per digit step, not a slot-machine effect).
- **Reduced motion**: every motion above degrades to its instant end state under
  `prefers-reduced-motion` — the palette appears at scale 1 with no overshoot, the glow
  still appears but without the fade transition (a brief static tint instead), and any
  numeral count-up becomes a direct render of the final value.

## Responsive behavior — desktop/tablet/mobile

- **Desktop**: icons render at their full 16px (body/label pairings) or 20px
  (headers/nav) sizes; icon-only controls sit at the medium (36px) control size by
  default, large (40px) where a toolbar is otherwise sparse; grid-born compositions may
  reach their full feature size (240 to 400px) in hero/launch placements; the horizontal
  lockup is the default header treatment.
- **Tablet**: unchanged icon sizing; icon-only controls may drop from large to medium
  where header real estate tightens; compact and micro compositions are unaffected,
  feature compositions may crop further into the frame (the recipe already treats
  cropping as intentional, so a tighter tablet canvas reads as consistent, not broken).
- **Mobile**: icon-only controls step up to the large (40px) control size for a
  comfortable tap target even though the glyph itself stays 16 to 20px; the horizontal
  lockup collapses to the monogram alone in any header that is otherwise tight (a
  primary nav bar, a modal titlebar); feature-size illustrations either shrink to
  compact size or are omitted on the smallest viewports rather than being crammed in —
  per the identity-layer budget, losing the illustration costs nothing, losing legibility
  does.

## Accessibility — roles/aria, focus order, contrast, reduced motion

- **Roles**: icon-only controls are real `<button>`/`<a>` elements (via `Button`/
  `ButtonLink`), never a styled `<div>` with a click handler. Grid-born illustrations and
  standalone icons carry `aria-hidden="true"` or `role="presentation"` — they are never
  given a false `role="img"` with no real label, and never left as an unlabeled focusable
  element.
- **Focus order**: an icon-only control or a home-linking lockup takes exactly one tab
  stop, in its natural DOM position; nothing in this pattern introduces a second,
  redundant stop for the same action (e.g. no separate focusable wrapper around an
  already-focusable `Button`).
- **Contrast**: icon color inherits its pairing's already-validated text-role step
  (`--ds-gray-900`/`-1000` against `--ds-background-100` in both themes), so it clears
  contrast by construction. The one ember accent inside a grid-born composition is
  decorative, not information-bearing on its own — the composition's meaning always
  comes from the empty-state's real title/description text, so a viewer who cannot
  perceive the ember accent loses nothing functional, only a flourish. Status icons
  (green/red/amber) are always paired with status text, never color-only.
- **Reduced motion**: covered in Interaction model above; nothing in this pattern is
  motion-dependent for comprehension — every personality touch is additive polish on top
  of content that is already legible and complete without it.

## Tokens used

| Token / class                                                                         | Role in this pattern                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--ds-gray-400`                                                                       | Grid-born illustration gridlines (1px).                                                                                                                                                                                                                                      |
| `--ds-gray-900`                                                                       | Default icon color (secondary-text pairing); pixel-glyph color in illustrations; empty-state description text.                                                                                                                                                               |
| `--ds-gray-1000`                                                                      | Primary icon color (primary-text pairing); pixel-glyph color where the glyph is the emphasis; wordmark text color.                                                                                                                                                           |
| `--ds-gray-alpha-100`…`-400`                                                          | Optional icon-chip background wash where a chip sits over an unknown surface (mirrors `AvatarWithIcon`'s own `iconBackground`).                                                                                                                                              |
| `--ds-ember-600` / `-700`                                                             | The one sanctioned chromatic accent: active/brand-state icon color (dark/light), the single accent mark in a grid-born composition, the ember completion glow's tint.                                                                                                        |
| `--ds-ember-800` / `-900`                                                             | Ember glow's stronger inner tone where a two-stop gradient-free tint needs a second step (still capped to the glow region only, never a fill).                                                                                                                               |
| `--ds-red-700`/`-800`/`-900`, `--ds-green-700`/`-800`/`-900`, `--ds-amber-700`/`-800` | Status-icon color, paired with status text only — never used for decoration or as a chart/series color (see `dashboards-stat-cards.md`'s own reservation rule).                                                                                                              |
| `--ds-focus-ring`                                                                     | Focus state on any icon-only control or home-linking lockup.                                                                                                                                                                                                                 |
| `--font-sans`                                                                         | Wordmark text, all icon-adjacent labels.                                                                                                                                                                                                                                     |
| `--font-pixel` (Geist Pixel Square)                                                   | Monogram glyph; pixel-glyph marks inside grid-born illustrations; the pixel-numeral personality touch.                                                                                                                                                                       |
| `.text-heading-*` sizes (32/40/48/56/64/72)                                           | Borrow the nearest size for a pixel numeral's font-size/line-height so it sits on the same vertical rhythm as headings, applying `--font-pixel` as the family override rather than inventing a new size (see Implementation guidance — no `.text-pixel-*` class exists yet). |
| `--geist-space-2x` (8px)                                                              | Gap between an icon and its paired label.                                                                                                                                                                                                                                    |
| `--geist-space-4x` / `-6x` (16px / 24px)                                              | Grid-cell rhythm inside a grid-born illustration canvas.                                                                                                                                                                                                                     |
| `--ds-size-small`/`-medium`/`-large` (32/36/40px)                                     | Icon-only control box, mobile bumping to `-large` for tap-target comfort.                                                                                                                                                                                                    |
| `material-base` / `material-small`                                                    | Icon-chip container background, where a chip is used outside `EmptyStateIcon`'s own built-in treatment.                                                                                                                                                                      |
| `--ds-motion-timing-swift`                                                            | Ember glow fade; the palette settle's easing (inherited from the overlay it rides).                                                                                                                                                                                          |
| `--ds-motion-overlay-scale` / `-timing` / `-duration`                                 | The springy palette settle (0.96 → 1, 300ms).                                                                                                                                                                                                                                |
| `--ds-motion-popover-duration` (200ms)                                                | Ember completion glow's fade timing.                                                                                                                                                                                                                                         |

## Implementation guidance

- **Radix primitive mapping**: none of the four families needs its own Radix primitive —
  icons and illustrations are leaf presentational content composed _inside_ components
  that already have their primitives (`Button` on `@radix-ui/react-slot` /native button,
  `EmptyState`'s own composition, `Popover`/`Dialog` for whatever surface a personality
  touch rides). Do not wrap a plain icon in a new interactive primitive; if it needs to be
  clickable, it belongs inside an existing `Button`/`Link`, not a new one-off element.
- **shadcn/ui structure**: this repo has no icon/logo/illustration primitives yet
  (`src/components/ui/` currently has no `icon.tsx`; the only existing brand-mark
  component is `src/components/connections/ProviderLogo.tsx`, which is a third-party
  connector logo, not the Supaprod identity itself). Add:
  - `src/components/ui/icon.tsx` — a thin wrapper around a passed-in `lucide-react`
    component that pins `size` (16 default, 20 via a `size="header"` prop) and
    `strokeWidth={1.5}` so no call site can drift from the spec by passing raw props to
    a bare lucide import. Existing call sites that already import lucide icons directly
    are not required to migrate in one pass, but any new icon usage should go through
    this wrapper.
  - `src/components/brand/monogram.tsx` — the Geist Pixel Square "C" glyph, a fixed
    square box, accepting only a `size` prop; no color prop beyond the sanctioned
    gray-1000/ember pair.
  - `src/components/brand/wordmark.tsx` — the "Supaprod" text mark in `--font-sans` 600,
    tight tracking; accepts no color override beyond the same pair.
  - `src/components/brand/logo-lockup.tsx` — composes `Monogram` + `Wordmark` with the
    clear-space rule baked in as padding equal to the monogram's own rendered width, plus
    a `variant="horizontal" | "monogram-only" | "wordmark-only"` prop mapping to the three
    sanctioned variants above.
  - `src/components/brand/grid-illustration.tsx` — the grid-born composition primitive:
    props for `size="micro" | "compact" | "feature"`, an array of pixel-glyph placements
    (grid coordinate + character), and at most one `accent` coordinate rendered in ember.
    The component itself enforces the "one accent" rule by accepting a single `accent`
    prop, not an array — if a caller needs more than one accent mark, that is a signal to
    simplify the composition, not extend the prop.
  - `src/components/brand/pixel-numeral.tsx` — renders a number in `--font-pixel` at a
    size matching one of the existing `.text-heading-*` steps (passed as a `scale` prop
    mapping to `32 | 40 | 48 | 56 | 64 | 72`), so no component invents its own font-size.
- **Ember completion glow**: not a new component — a `glow` boolean/variant added to
  whatever card or row already renders the finished run/build (e.g. the relevant timeline
  or run-status card), applying a bordered ember-tinted box-shadow wash confined to that
  element's own edge, gated on `prefers-reduced-motion` for its fade-in/out.
- **Springy palette settle**: not a new component either — it is already the behavior of
  `material-modal`/`material-fullscreen` overlays (`src/components/ui/dialog.tsx`,
  `command.tsx`'s `CommandDialog`). Confirm the surface actually rides one of those
  materials rather than a hand-rolled transition before counting it as this pattern's
  personality touch.
- **Composition with existing Supaprod code**: `EmptyState`/`EmptyStateIcon` usage stays
  exactly as documented in `empty-state.md` for the plain icon-in-chip case; reach for
  `GridIllustration` only when a first-run or celebratory empty state has earned the
  extra presence, and never both an `EmptyStateIcon` and a `GridIllustration` in the same
  empty state — pick one.

## Usage examples

**1. A settings-row icon pairing (labeled icon, default color)**

```tsx
import { Icon } from "@/components/ui/icon";
import { Bell } from "lucide-react";

<div className="flex items-center gap-2">
  <Icon icon={Bell} className="text-[var(--ds-gray-900)]" />
  <span className="text-label-14">Notification preferences</span>
</div>;
```

**2. An icon-only overflow control on a card (icon-only, accessible)**

```tsx
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { MoreHorizontal } from "lucide-react";

<Button variant="tertiary" size="small" svgOnly aria-label="More actions for this mission">
  <Icon icon={MoreHorizontal} />
</Button>;
```

**3. A first-run empty state with a compact grid-born illustration**

```tsx
import { EmptyState } from "@/components/ui/empty-state";
import { GridIllustration } from "@/components/brand/grid-illustration";

<EmptyState
  title="No missions yet"
  description="Start your first mission to see it appear here."
  icon={
    <GridIllustration size="compact" glyphs={[{ x: 1, y: 1, char: "M" }]} accent={{ x: 2, y: 2 }} />
  }
>
  <Button>Start a mission</Button>
</EmptyState>;
```

**4. A nav rail header lockup, collapsing on mobile**

```tsx
import { LogoLockup } from "@/components/brand/logo-lockup";

<LogoLockup
  variant={isCollapsedOrMobile ? "monogram-only" : "horizontal"}
  aria-label="Supaprod, go to home"
  asChild
>
  <Link to="/today" />
</LogoLockup>;
```

**5. A finished-run card with the ember completion glow, and a pixel-numeral step count elsewhere on the same screen (not both — one touch per surface)**

```tsx
// Runs list — the glow lives here.
<RunCard status="succeeded" glow />;

// Onboarding header on a DIFFERENT surface — a pixel numeral, its own budget.
import { PixelNumeral } from "@/components/brand/pixel-numeral";

<div className="flex items-center gap-3">
  <PixelNumeral value={2} scale={48} />
  <span className="text-copy-16">of 4 steps</span>
</div>;
```

## Do / Don't

**Do**

- Keep every icon lucide, outline-only, 1.5px stroke, 16px default / 20px in headers and
  nav — one treatment, everywhere.
- Pair an icon with a visible label whenever one is possible; reach for `svgOnly` +
  `aria-label` only when space truly forces an icon-only control.
- Let an icon's color follow the text color of whatever it's paired with; reserve ember
  for brand/active states only.
- Build illustrations only from the system's own primitives: 1px gray-400 gridlines,
  Geist Pixel glyphs, one ember accent capped at roughly a tenth of the composition.
- Keep the monogram's clear space equal to its own width, on every surface, without
  exception.
- Cap personality touches at one per surface, and cut one on sight if it competes with
  legibility, density, or calm.
- Gate every glow, settle, and count-up on `prefers-reduced-motion`.

**Don't**

- Don't use filled or duotone icon styles, mixed stroke weights, or a second icon set
  alongside lucide — one library, one treatment.
- Don't recolor an icon or the monogram to anything outside gray-1000/gray-900/ember;
  don't resurrect the retired Butterfly mark in any surface, asset, or favicon.
- Don't reach for stock illustration styles, gradients-as-decor, emoji, isometric scenes,
  mascots, or photography anywhere in the product — the grid-born recipe is the only
  sanctioned illustration language.
- Don't give a grid-born composition more than one ember accent, and don't let the ember
  accent creep past a small fraction of the frame — if it starts reading as a colored
  picture instead of a neutral diagram with one warm mark, pull it back.
- Don't stack two personality touches on one surface (e.g. a pixel numeral inside a
  glowing card that also has a springy entrance) — pick the single touch that surface
  earns.
- Don't invent a new pixel-font size or a stacked/vertical logo lockup on your own
  judgment — extend `.text-heading-*`-anchored sizing and the three sanctioned lockup
  shapes, and escalate anything beyond that for a founder decision (see Notes on gaps).
- Don't attach interactivity directly to a bare icon or illustration SVG — every
  clickable identity-layer element is a real `Button`/`Link` underneath.
