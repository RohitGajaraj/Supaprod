# Onboarding & empty states

> Teach a surface what it is for the moment it has nothing to show, and carry a new
> workspace from zero to its first real result without ever making the user feel lost or
> scolded.
> Extension — base: Geist `EmptyState` / `EmptyStateIcon`, `Card`, `Collapse` /
> `CollapseGroup`, `Checkbox`, the `Button` variant set, `material-small` /
> `material-fullscreen`, the dialogs-drawers-sheets Fullscreen-takeover contract ·
> inspiration: Arc Browser's first-run warmth (an emotionally considered opening moment,
> a short choice-driven setup with an always-visible skip, and the idea that many small
> considered details compound into "this feels special" more than any single flashy
> effect), Notion's template gallery and onboarding checklist (teach the core mechanic
> inside the real, empty canvas rather than in a separate tutorial; narrow an overwhelming
> catalog down to a small personalized starting set; keep a living, persistent checklist
> of concrete actions as the onboarding spine instead of one-time abstract "get started"
> copy) — principles only, restated in our own words, never their assets or copy.

## Anatomy

Three distinct constructs share one visual language. Pick the lightest one that earns the
moment, same governing idea as the dialogs-drawers-sheets pattern's surface ladder.

**1. Empty state** — a static content region, no navigation of its own:

```
┌─────────────────────────────────────────────┐
│                                               │
│               [ Icon chip / one small        │  ← Icon (Geist EmptyStateIcon shape,
│                 grid-born illustration ]      │     32px inner icon) OR one small
│                                               │     geometric composition — never both
│                     Title                     │  ← Headline: text-heading-20/16, OR
│                                               │     the one Geist Pixel moment allowed
│         Supporting instruction sentence       │     on this screen (max once/screen)
│                                               │  ← Instruction: text-copy-14, states the
│           Takes about 2 minutes               │     next concrete action, never an apology
│                                               │  ← Time estimate (optional): small
│    [ Primary action ]      Learn more →       │     text-label-13 + clock glyph chip
│                                               │  ← CTA row: 1 primary Button max, 1
└─────────────────────────────────────────────┘     secondary Link only if the action
                                                     genuinely forks two valid paths
```

**2. Welcome sequence** (first-run only, once per workspace/account) — a bounded,
multi-step takeover, reusing the Fullscreen-takeover / Modal surface contract from
`patterns/dialogs-drawers-sheets.md`, never a bespoke overlay:

```
┌──────────────────────── material-fullscreen ─────────────────────────┐
│  ●──○──○──○                                                Skip      │ ← step dots (progress,
│                                                                       │   not decoration) + a
│              (illustration, or the one Pixel headline)               │   plain-words Skip,
│                       Step headline                                  │   always present
│                  Step instruction sentence                           │
│                                                                       │
│              [ step-specific content / controls ]                    │
│                                                                       │
│                                        Back        Next / Finish     │ ← footer, mirrors the
└───────────────────────────────────────────────────────────────────────┘   dialog footer anatomy
```

**3. Onboarding checklist** — a persistent, collapsible card that survives across
sessions until its work is done, the spine of progressive multi-step setup:

```
┌────────────────────── material-small (bordered Card) ───────────────────────┐
│ Get your workspace ready                                    3 of 5 done     │ ← header + counter
│ ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░  (progress meter)                              │ ← progress bar
├──────────────────────────────────────────────────────────────────────────────┤
│ ✓  Connect a data source                                                     │ ← done row
│ ✓  Invite your team                                                         │
│ ○  Create your first PRD                                        2 min   →   │ ← upcoming row
│ ○  Run your first build                                         5 min   →   │
├──────────────────────────────────────────────────────────────────────────────┤
│ ▸ Advanced (2)                                                              │ ← Collapse trigger,
│     ○  Configure SSO                                                       │   progressive
│     ○  Set spend limits                                                    │   disclosure group
└──────────────────────────────────────────────────────────────────────────────┘
```

The three constructs compose: a welcome sequence's final step may hand off directly into
an onboarding checklist card placed on Today; an empty state's primary CTA may be the
first unstarted row of that same checklist.

## Variants

| Variant                                     | Composition                                                                                                           | When to use                                                                                                                                                                                                                                           |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Blank slate**                             | Icon/illustration + title + description, no children                                                                  | A surface that is already useful with nothing in it and needs no setup (per `research/empty-state.md`'s own framing, Blank Slate and the plain Default demo are the same minimal composition). Use for a genuinely optional, low-stakes empty region. |
| **Informational**                           | Blank slate + one primary `Button` and, only when a second valid path exists, one secondary `Link`                    | The default choice for any first-use surface where a single action creates the first item ("Connect a data source", "Create your first PRD"). Description names the concrete next action, not generic praise.                                         |
| **Guided (checklist-nested)**               | Informational shape, but the CTA row is replaced by an embedded Onboarding checklist (2)                              | A surface whose setup is genuinely multi-step (more than one action needed before the surface is useful) — nest the checklist rather than stacking three-plus CTAs, which `research/empty-state.md`'s own best practice flags as a design smell.      |
| **No-results**                              | Blank slate shape, title names the filter in curly quotes, secondary action clears/widens it, no primary "create" CTA | A filtered list or search that returned zero rows. Follow the template from `research/empty-state.md`: `No {Items} match "${query}". Clear the filter to see all {items}.`                                                                            |
| **Cleared / all-done**                      | Blank slate shape, positive framing, optionally the one ember completion glow (contract §8 personality touch)         | A queue/inbox that reached zero because work finished, not because nothing was ever there. Never reuses the "no-results" copy shape — completion is good news, say so.                                                                                |
| **Permission / tier-gated**                 | Full-page empty state (not the smaller inline Note), body follows `{Feature value} with the {Plan} plan.`             | A route the user cannot access at all. Reserve the narrower inline `Note` component (outside this pattern's scope) for a single gated tile inside an otherwise-accessible page.                                                                       |
| **Error**                                   | Blank slate shape, body pairs with a copyable request id and a "Try Again" Button                                     | A failed load, not a genuine empty state — the content exists but couldn't be fetched.                                                                                                                                                                |
| **Welcome sequence (3)**                    | Fullscreen takeover or centered Modal, 2 to 5 steps, always skippable                                                 | Once per workspace/account, at creation. Use Fullscreen for 3+ steps with real content (choices, connections); use a Modal (Medium) for 1 to 2 lightweight choices. Never re-triggers itself once completed or skipped.                               |
| **Onboarding checklist (3)**                | Persistent Card on Today, rows map 1:1 to concrete actions                                                            | Setup that reasonably spans more than one session. Replaces the welcome sequence once the user is past the very first moment; the two are sequential, never simultaneous.                                                                             |
| **Progressive disclosure (advanced group)** | A `Collapse` (or `CollapseGroup` item) nested at the bottom of a checklist or a settings/setup form                   | Optional, expert, or rarely-needed steps (SSO, spend limits, custom domains) that would overwhelm the primary happy path if shown inline. Per `research/collapse.md`: default closed, cap nesting at one level.                                       |

## States

**Empty state**

| State                                                    | Applies to               | Tokens                                                                                                                                                                                   |
| -------------------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default                                                  | Icon chip                | background `--ds-gray-100`, icon `--ds-gray-900`                                                                                                                                         |
| Default                                                  | Title                    | `--ds-gray-1000` on `--ds-background-100`                                                                                                                                                |
| Default                                                  | Description              | `--ds-gray-900`                                                                                                                                                                          |
| Default                                                  | Time estimate chip       | `--ds-gray-900` text on transparent, 16px clock glyph same color                                                                                                                         |
| Hover / active / focus / disabled / loading (CTA button) | Primary/secondary Button | Owned entirely by `research/button.md`'s own Button treatment — this pattern positions the button, it never restyles it                                                                  |
| Loading (async region, e.g. mid-filter)                  | Whole region             | Flat `--ds-gray-100` placeholder blocks at the real content's proportions, no shimmer (retired system-wide); swap to the settled empty/populated state the instant the response resolves |
| Empty → appearing after an async change                  | Whole region             | Wrap in `aria-live="polite"` so it announces without stealing focus (see Interaction model)                                                                                              |
| Error                                                    | Body + icon              | icon `--ds-red-900`, request-id text `--ds-gray-900` in `text-label-13-mono`, "Try Again" Button variant `error` per `research/button.md`                                                |

**Welcome sequence**

| State    | Applies to                                         | Tokens                                                                                                                                                                              |
| -------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default  | Step dot, upcoming                                 | 6px circle, border only `--ds-gray-400`, transparent fill                                                                                                                           |
| Default  | Step dot, current                                  | fill `--ds-gray-1000`                                                                                                                                                               |
| Default  | Step dot, completed                                | fill `--ds-gray-1000`, smaller checkmark glyph knocked out in `--ds-background-100`                                                                                                 |
| Focus    | Step dot / Skip / Back / Next                      | `--ds-focus-ring-outline`                                                                                                                                                           |
| Loading  | Next/Finish button, async step (e.g. provisioning) | `loading` prop per `research/button.md`; Back and Skip stay disabled while it resolves so the user can't abandon a request mid-flight                                               |
| Error    | Step body, e.g. a failed connector OAuth           | inline banner, background `--ds-red-100`, border `--ds-red-400`, text/icon `--ds-red-900` — same recipe as the dialogs-drawers-sheets Error state, kept identical across the system |
| Disabled | Next, until the step's required input is present   | Owned by Button's own disabled treatment; always paired with a Tooltip naming what's missing                                                                                        |

**Onboarding checklist**

| State                                        | Applies to                            | Tokens                                                                                                                                                                                                                                                                                                                                        |
| -------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default, upcoming row                        | Row background / status glyph / label | row background transparent; status circle border `--ds-gray-700`, no fill (mirrors Checkbox's unchecked-enabled recipe); label `--ds-gray-1000` in `text-label-14`                                                                                                                                                                            |
| Hover, upcoming row                          | Row background                        | `--ds-gray-100`                                                                                                                                                                                                                                                                                                                               |
| Active/pressed, upcoming row                 | Row background                        | `--ds-gray-200`                                                                                                                                                                                                                                                                                                                               |
| Focus, row (as a link/button)                | Row outline                           | `--ds-focus-ring-outline`                                                                                                                                                                                                                                                                                                                     |
| Done row                                     | Status glyph / label                  | status circle fills `--ds-gray-1000` with border `--ds-gray-1000`; checkmark path knocked out in `--ds-background-100` (our substitute for Geist's internal `--geist-background` reference, since that token isn't in our set — same knockout effect, our own equivalent); label dims to `--ds-gray-900` (still legible, never strikethrough) |
| Disabled row (prerequisite not met)          | Status glyph / label / row            | background `--ds-gray-100`, border `--ds-gray-500`, label `--ds-gray-700` — mirrors Checkbox's disabled-unchecked recipe exactly; always paired with a Tooltip naming the prerequisite (per `research/checkbox.md`'s own best practice)                                                                                                       |
| Loading row (system verifying completion)    | Status glyph                          | glyph replaced by a small spinner, label unchanged                                                                                                                                                                                                                                                                                            |
| Error row (attempted action failed)          | Status glyph / row                    | border `--ds-red-400`, glyph `--ds-red-900`, inline "Retry" affordance replaces the chevron                                                                                                                                                                                                                                                   |
| Progress meter                               | Track / fill                          | track `--ds-gray-200`; fill `--ds-gray-1000` by default. On the single transition to 100%, the fill may pulse to `--ds-ember-600` once — the contract's own sanctioned "ember glow on a completed run" personality touch, never repeated and never the resting color                                                                          |
| Collapse trigger ("Advanced")                | Default / hover / focus               | Follows `research/collapse.md`'s own trigger treatment; chevron rotates on toggle                                                                                                                                                                                                                                                             |
| Empty (all rows done, group about to retire) | Whole card                            | Collapses to a single dismissible "All set" row per the Cleared/all-done empty-state variant, then removes itself — never lingers as a permanent 100% trophy case                                                                                                                                                                             |

## Interaction model

**Pointer**

- Click a checklist row (or its full-row hit target) navigates to the surface/action that
  completes it. Click the trailing chevron area only if the row itself isn't the whole
  target — prefer making the entire row clickable.
- Click the small trailing checkbox-shaped affordance, where a row supports manual
  completion (steps the system cannot detect on its own, e.g. "Read the getting-started
  guide"), toggles it directly without navigating away. This is the one place a real
  `Checkbox` primitive backs the visual, per `research/checkbox.md`.
- Click "Advanced" (or any `Collapse` trigger) expands/collapses that group in place;
  never navigates.
- Click a welcome-sequence step dot only jumps to an already-reached step (never ahead of
  the furthest step completed).
- Click Skip exits the welcome sequence immediately, marks it dismissed (distinct from
  completed), and never re-forces itself; the same setup remains reachable afterward from
  the onboarding checklist or Engine Room.
- Click an empty state's primary CTA performs the action; the optional secondary Link only
  ever appears when the primary action legitimately forks into two valid paths (per
  `research/empty-state.md`: never a third CTA).

**Keyboard**

| Key                 | Effect                                                                                                                                                                                                                                         |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Tab` / `Shift+Tab` | Move focus between chip → title → description → CTA row (empty state); between step content's own controls, then Back/Skip/Next (welcome sequence); between checklist rows top to bottom, then the Advanced trigger and its rows once expanded |
| `Enter` / `Space`   | Activates the focused Button, Link, checklist row, or Collapse trigger; toggles a manual-complete row's Checkbox                                                                                                                               |
| `Escape`            | Welcome sequence only: same effect as Skip, routed through the dialogs-drawers-sheets unsaved-changes guard if the current step holds dirty input; no effect on an empty state or checklist card (neither is a dismissible surface)            |
| `Home` / `End`      | If the step indicator is implemented as a tab-like control, jumps to the first / furthest-reached step                                                                                                                                         |
| Arrow keys          | Not globally bound anywhere in this pattern (matches `research/collapse.md`'s own choice to leave arrow keys free for content navigation)                                                                                                      |

**Screen-reader behavior**

- Empty state: title is a real heading element at the correct level for its surface
  (never just styled text); when the region appears after an async change (filter, first
  load), the wrapping element carries `aria-live="polite"` so assistive tech announces the
  new state without moving focus, per `research/empty-state.md`'s own Behavior guidance.
- Welcome sequence: `role="dialog"` `aria-modal="true"` (or the mobile Drawer's own
  equivalent), `aria-labelledby` the current step's headline — identical contract to
  `patterns/dialogs-drawers-sheets.md`. Step dots expose `aria-current="step"` on the
  active one.
- Onboarding checklist: rows render as a real list (`<ul>`/`<li>` or `role="list"`); each
  row's status is exposed as text, not glyph-only ("Completed: Connect a data source" /
  "Not started: Invite your team"), so it survives without color or icon. The "3 of 5
  done" counter lives in its own `aria-live="polite"` region so completing a row announces
  the new count without stealing focus from wherever the user's action actually happened.
  Collapsed "Advanced" rows stay in the DOM (hidden, not unmounted) per
  `research/collapse.md`'s own accessibility note, so in-page search still finds them.

**Motion**

- Welcome sequence open/close (as a Fullscreen takeover or Modal): identical to
  `patterns/dialogs-drawers-sheets.md` — scale from `--ds-motion-overlay-scale` (0.96),
  `--ds-motion-overlay-timing` (`--ds-motion-timing-swift`),
  `--ds-motion-overlay-duration` (0.3s).
- Step-to-step content transition inside an open welcome sequence: a lighter
  micro-interaction, `--ds-motion-timing-swift` capped at the contract's 200ms
  micro-interaction ceiling — content crossfades/slides, never the whole surface
  re-scaling.
- Checklist row completing: the checkmark glyph draws in on `--ds-motion-timing-swift`,
  ≤200ms (micro-interaction budget). The optional ember completion pulse on the progress
  meter uses the same timing, once, never looping.
- Progressive-disclosure expand/collapse: `research/collapse.md` doesn't publish its own
  duration, so default to `--ds-motion-popover-timing` / `--ds-motion-popover-duration`
  (200ms) to keep it inside the system's one easing family rather than inventing a new
  value.
- `prefers-reduced-motion`: every transition above degrades to an instant state change or,
  where a crossfade is unavoidable, a plain opacity change capped at 150ms — matching the
  reduced-motion rule already set in `patterns/dialogs-drawers-sheets.md`.

## Responsive behavior

- **Desktop**: Welcome sequence renders as Fullscreen takeover (3+ content-rich steps) or
  a centered Medium Modal (1 to 2 lightweight choices), per the dialogs-drawers-sheets size
  ladder. Onboarding checklist docks as a card at Today's normal content width. Empty
  states center within their surface's content region; description text wraps at roughly
  440px so line length stays readable regardless of the surface's own width.
- **Tablet**: Same components; the checklist card spans the full available column width
  rather than shrinking its rows. Welcome sequence Modal narrows one step down the size
  ladder before promoting to Fullscreen.
- **Mobile**: Welcome sequence collapses from Modal/Fullscreen to a bottom-anchored Drawer,
  one step per screen, following the exact same "swap the component, don't restyle it"
  rule as `patterns/dialogs-drawers-sheets.md`. Onboarding checklist collapses to a compact
  summary row (progress bar + "3 of 5" counter + chevron) that opens the full row list in
  a Drawer on tap, rather than rendering every row inline. Empty-state illustrations are
  the first thing dropped if vertical space is tight; title, description, and the CTA row
  are never dropped.

## Accessibility

- Roles and labeling: see Interaction model's "Screen-reader behavior" above — this is the
  difference between a screen-reader user knowing setup is 3-of-5 done versus hearing
  nothing change at all.
- Focus order: chip/illustration is decorative and `aria-hidden`; heading first,
  description second, CTA row last (empty state). Checklist header/progress announces
  before the rows; rows follow visual top-to-bottom order; the Advanced group's rows join
  the tab order only once expanded, immediately after the trigger.
- Contrast: title text uses `--ds-gray-1000` on `--ds-background-100`, description and
  upcoming-row labels use `--ds-gray-900` — both are the system's own pre-validated
  accessible pairings from the color role model; don't introduce a third gray for this
  pattern's text.
- Every CTA, Link, checklist row, and Collapse trigger keeps the standing focus ring
  (`--ds-focus-ring-outline`) — never remove it for a "cleaner" look.
- `prefers-reduced-motion` handling is mandatory across all three constructs, not optional
  polish — see Motion above.
- Icon-only affordances (a manual-complete checkbox with no visible label, a chevron-only
  Collapse trigger reused elsewhere) require `aria-label` exactly as `research/button.md`
  and `research/checkbox.md` already mandate for their own components.

## Tokens used

| Token                                                                      | Role in this pattern                                                                                                                   |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `--ds-background-100`                                                      | Page/card surface fill; also the checkmark knockout color on a done checklist row                                                      |
| `--ds-background-200`                                                      | Rare subtle differentiation only, e.g. a card-in-card nested group                                                                     |
| `--ds-gray-100`                                                            | Icon chip fill; row hover background; disabled-row background                                                                          |
| `--ds-gray-200`                                                            | Row active/pressed background                                                                                                          |
| `--ds-gray-400`                                                            | Upcoming step-dot border                                                                                                               |
| `--ds-gray-500`                                                            | Disabled-row border (mirrors Checkbox's disabled-unchecked recipe)                                                                     |
| `--ds-gray-700`                                                            | Disabled-row label/status color; upcoming-row status circle border                                                                     |
| `--ds-gray-900`                                                            | Description text; secondary/done-row label text; icon chip glyph color                                                                 |
| `--ds-gray-1000`                                                           | Title text; current/completed step-dot fill; done-row status fill and default progress-meter fill                                      |
| `--ds-gray-alpha-400`                                                      | Card outer hairline when composed over an unknown background                                                                           |
| `--ds-ember-600`                                                           | The one sanctioned personality touch: a single non-repeating glow on the progress meter at 100% completion                             |
| `--ds-red-100`                                                             | Error banner wash (welcome-sequence step error)                                                                                        |
| `--ds-red-400`                                                             | Error banner border; error-row border                                                                                                  |
| `--ds-red-900`                                                             | Error text/icon, request-id error state, error-row glyph                                                                               |
| `--ds-focus-ring-outline`                                                  | Focus state on every interactive element in this pattern                                                                               |
| `--ds-z-modal` / `--ds-z-drawer`                                           | Welcome sequence stacking context (Modal/Fullscreen vs. mobile Drawer), inherited from `patterns/dialogs-drawers-sheets.md`            |
| `--ds-motion-timing-swift`                                                 | Easing for every transition in this pattern                                                                                            |
| `--ds-motion-overlay-scale` (0.96) / `--ds-motion-overlay-duration` (0.3s) | Welcome-sequence open/close                                                                                                            |
| `--ds-motion-popover-duration` (0.2s)                                      | Progressive-disclosure expand/collapse (borrowed for consistency, since Collapse's own duration isn't published)                       |
| `--ds-radius-small` / `--ds-shadow-border-small` (via `material-small`)    | Onboarding checklist card chrome                                                                                                       |
| `--ds-radius-large` / `--ds-shadow-fullscreen` (via `material-fullscreen`) | Welcome-sequence Fullscreen-takeover chrome                                                                                            |
| `text-heading-20` / `text-heading-16`                                      | Empty-state title; welcome-sequence step headline (Sans, unless the one Pixel moment is used instead)                                  |
| `--font-pixel`                                                             | The single allowed Geist Pixel headline per screen (empty-state title or welcome-sequence opening step only, never both on one screen) |
| `text-copy-14`                                                             | Description / instruction sentences throughout                                                                                         |
| `text-label-14`                                                            | Checklist row labels                                                                                                                   |
| `text-label-13`                                                            | Time-estimate chip text                                                                                                                |
| `text-label-13-mono` + `.text-tabular`                                     | The "3 of 5" progress counter (technical/numeric content per the contract's Mono law)                                                  |
| `text-button-14`                                                           | CTA labels, inherited from Button                                                                                                      |
| `--geist-space-4x` (16px)                                                  | Card padding                                                                                                                           |
| `--geist-space-6x` (24px)                                                  | Section gaps between empty-state parts, welcome-sequence step padding                                                                  |
| `--geist-gap-half` (12px)                                                  | Row-to-row gap inside the checklist                                                                                                    |
| `--geist-gap-quarter` (8px)                                                | Icon-to-label gaps, status-glyph-to-text gaps                                                                                          |
| `--ds-size-medium` (36px)                                                  | Baseline checklist-row height, borrowed from the control-height rhythm for list-density consistency                                    |

## Implementation guidance

**Radix / primitive mapping**

- Welcome sequence → `@radix-ui/react-dialog` (Fullscreen/Modal) on desktop, `vaul`'s
  `Drawer` on mobile — the exact same primitives and responsive swap rule as
  `src/components/ui/dialog.tsx` / `src/components/ui/drawer.tsx` in
  `patterns/dialogs-drawers-sheets.md`. Don't introduce a second dialog primitive for this
  surface.
- Step controller → a plain controlled step index is enough for most sequences; if the
  step dots need to be independently focusable/jumpable, back them with
  `@radix-ui/react-tabs` in unstyled mode purely for its built-in
  `aria-selected`/keyboard-arrow wiring, styled to match the dot anatomy above rather than
  a tab strip.
- Onboarding checklist card → our Tempo `Card` reimplementation (per `research/card.md`),
  styled through `material-small` rather than Geist's own opaque internal border/shadow
  (contract §4: materials, never hand-rolled chrome). Rows are a plain `<ul>`/`<li>`, each
  wrapping a `Link`/`button` for the whole-row hit target.
- Manual-complete row affordance → `@radix-ui/react-checkbox`, matching
  `src/components/ui/checkbox.tsx` and the exact token recipe documented in
  `research/checkbox.md`.
- Progress meter → `@radix-ui/react-progress`, giving `aria-valuenow`/`aria-valuemax` for
  free; style the track/fill with the tokens above, never a hand-rolled `<div>` bar.
- Progressive disclosure → `@radix-ui/react-accordion` backing `src/components/ui/collapse.tsx`
  (`Collapse`/`CollapseGroup`), matching `research/collapse.md`'s API (`title`,
  `defaultExpanded`, `size`, `CollapseGroup`'s `multiple`).
- Empty state → no primitive needed; it's a static composed region. Add
  `aria-live="polite"` by hand on the wrapper only when the region can appear after an
  async change.

**shadcn/ui structure and file placement**

- `src/components/ui/empty-state.tsx` — exports `EmptyState`, `EmptyStateIcon`, mirroring
  Geist's flat API (`title`, `description`, `icon`, `children` for the CTA row).
- `src/components/ui/onboarding-checklist.tsx` — exports `OnboardingChecklist`,
  `OnboardingChecklistItem`; composes `Card` (via `material-small`), `Progress`, and
  `Collapse` for the Advanced group.
- `src/components/ui/welcome-sequence.tsx` — exports `WelcomeSequence`,
  `WelcomeSequenceStep`; composes the existing `dialog.tsx`/`drawer.tsx` shells from
  `patterns/dialogs-drawers-sheets.md` rather than a new dialog implementation.
- New shared primitives this pattern needs but may not yet exist: `card.tsx` (per
  `research/card.md`), `collapse.tsx` (per `research/collapse.md`), `checkbox.tsx` (per
  `research/checkbox.md`), `progress.tsx` (a thin wrapper over Radix Progress). Check
  `src/components/ui/` before adding any of these — reuse if already present from another
  pattern's build-out.

**Composition with existing Supaprod code**

- Placement follows the surface-placement rubric in
  `docs/conventions/home-and-today-ia.md`: the Onboarding checklist lives on Today only
  while incomplete. Once every row is done it collapses to a single "All set" row (the
  Cleared/all-done empty-state variant) and then removes itself — it never lingers as a
  permanent 100%-complete trophy case.
- The welcome sequence is triggered once, gated by an onboarding-state check in the
  `_authenticated` route loader (e.g. an `is_onboarded` flag surfaced from a new
  `onboarding.functions.ts` module exposing `getOnboardingState` /
  `completeOnboardingStep`, consumed via TanStack Query) — the same server-function-plus-route
  pairing convention used everywhere else in the app.
- Advanced/expert checklist rows (Configure SSO, Set spend limits) are exactly the
  machinery the engine-room doctrine keeps behind progressive disclosure — collapsed by
  default, never inline in the first-five-steps happy path.

## Usage examples

**1. Welcome sequence at workspace creation**

```tsx
import { useState } from "react";
import { WelcomeSequence, WelcomeSequenceStep } from "@/components/ui/welcome-sequence";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/hooks/use-onboarding";

function FirstRunSequence() {
  const [step, setStep] = useState(0);
  const { completeOnboarding, skipOnboarding, isProvisioning } = useOnboarding();
  const steps = ["welcome", "connect-source", "invite-team"] as const;

  return (
    <WelcomeSequence step={step} stepCount={steps.length} onSkip={skipOnboarding}>
      <WelcomeSequenceStep
        headline="Welcome to Supaprod"
        pixelHeadline
        description="Set up your workspace in about three minutes."
      >
        <Button onClick={() => setStep(1)}>Get started</Button>
      </WelcomeSequenceStep>

      <WelcomeSequenceStep
        headline="Connect your first data source"
        description="Supaprod reads from your repository to keep everything grounded in real work."
      >
        <ConnectSourcePicker onConnected={() => setStep(2)} />
      </WelcomeSequenceStep>

      <WelcomeSequenceStep
        headline="Invite your team"
        description="Add teammates now, or skip and invite them later from Settings."
      >
        <Button loading={isProvisioning} onClick={completeOnboarding}>
          Finish setup
        </Button>
      </WelcomeSequenceStep>
    </WelcomeSequence>
  );
}
```

**2. Informational empty state on Discover before the first sync**

```tsx
import { EmptyState, EmptyStateIcon } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/button-link";
import { IconDatabase } from "lucide-react";

function DiscoverEmptyState() {
  return (
    <EmptyState
      icon={<EmptyStateIcon icon={<IconDatabase size={32} />} />}
      title="Nothing to discover yet"
      description="Connect a repository so Supaprod can start surfacing real signal here."
      timeEstimate="Takes about 2 minutes"
    >
      <Button onClick={openConnectSourceDialog}>Connect a data source</Button>
      <LinkButton type="secondary" external href="/docs/discovery">
        Learn how Discover works
      </LinkButton>
    </EmptyState>
  );
}
```

**3. Onboarding checklist on Today with a collapsed Advanced group**

```tsx
import { OnboardingChecklist, OnboardingChecklistItem } from "@/components/ui/onboarding-checklist";
import { Collapse } from "@/components/ui/collapse";

function TodayOnboardingChecklist({ state }: { state: OnboardingState }) {
  if (state.completed) return null;

  return (
    <OnboardingChecklist
      title="Get your workspace ready"
      doneCount={state.doneCount}
      totalCount={state.totalCount}
    >
      <OnboardingChecklistItem done={state.hasSource} label="Connect a data source" href="/sync" />
      <OnboardingChecklistItem
        done={state.hasTeam}
        label="Invite your team"
        href="/settings/team"
      />
      <OnboardingChecklistItem
        done={state.hasFirstPrd}
        label="Create your first PRD"
        href="/prds/new"
        timeEstimate="2 min"
      />
      <OnboardingChecklistItem
        done={state.hasFirstBuild}
        label="Run your first build"
        href="/build"
        timeEstimate="5 min"
        disabled={!state.hasFirstPrd}
        disabledReason="Create your first PRD before running a build."
      />

      <Collapse title={`Advanced (${state.advancedCount})`} size="small">
        <OnboardingChecklistItem
          done={state.hasSso}
          label="Configure SSO"
          href="/settings/security"
        />
        <OnboardingChecklistItem
          done={state.hasSpendLimits}
          label="Set spend limits"
          href="/settings/billing"
        />
      </Collapse>
    </OnboardingChecklist>
  );
}
```

## Do / Don't

- Do write the empty-state description as the concrete next action, never an apology or a
  restatement of the title.
- Do cap an empty state at one primary CTA, adding a secondary Link only when the action
  truly forks into two valid paths.
- Do always pair a welcome sequence with a visible, working Skip — never trap a user inside
  a mandatory tour with no way out.
- Do keep the onboarding checklist honest: a row only shows done once the system has
  actually verified it, never optimistically.
- Do collapse advanced/expert steps into the Progressive-disclosure group by default; only
  a first-time visitor's true happy-path steps stay inline.
- Do let the checklist retire itself the moment it's fully done, via the Cleared/all-done
  empty-state shape, rather than leaving a permanent 100% badge on Today.
- Do wrap an empty state that can appear after an async change (filter, search) in
  `aria-live="polite"`.
- Don't invent a stock illustration, gradient-as-decor, or emoji for the empty-state icon —
  it's either the plain 32px icon chip or one small grid-born geometric composition, never
  both, never a third style.
- Don't use an empty state to carry a persistent warning; that belongs in a page-level Note
  or header instead — empty states vanish the moment content arrives.
- Don't re-trigger a completed or skipped welcome sequence; the same setup stays reachable
  from the checklist or Engine Room instead.
- Don't use more than one Geist Pixel headline on the same screen, and never use it for
  body copy or a checklist row label.
- Don't spend more than the one sanctioned personality touch (the ember completion glow)
  anywhere in this pattern — no second glow, no shimmer, no bounce.
- Don't disable a checklist row without a Tooltip naming the missing prerequisite — an
  unexplained locked row reads as broken, not intentional.
- Don't unmount a collapsed Advanced group's content; hide it so in-page search and
  screen-reader "find" still reach it.
