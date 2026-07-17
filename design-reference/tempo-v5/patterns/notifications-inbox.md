# Notifications & inbox

> Tell the user something happened, at the volume the moment deserves: a Toast for
> something they just caused, an inline Note for a fact tied to one section, a Banner for a
> page-wide condition everyone needs to see, an Inbox for anything they should be able to
> come back to later.
> Extension — base: Geist `Banner`, `Badge` (+ its `Status Dot` guidance), `Collapse` /
> `CollapseGroup`, `DotsMenu`, `EmptyState`, the `material-menu` / `material-small` presets,
> `--ds-z-toast` / `--ds-z-menu` layering, the `Button` variant set · inspiration: Linear's
> inbox (paraphrased principle: one durable list of everything that needs your attention,
> grouped and triaged rather than a firehose of popups), Vercel's own deployment-toast
> pattern (paraphrased principle: a toast reports on work the user just started and offers
> one direct way to see more, not a dead-end confirmation).

## Anatomy

Four surfaces share one job (report state) and escalate in permanence. Toast and Inline
Note are single-part messages; Banner has a fixed two-part shape (message + one action);
Inbox is the only compound, multi-part surface.

**Toast** (one instance; multiple stack):

```
┌──────────────────────────────────────────────┐
│ [●] Title                              [ X ]  │  ← icon (severity) · title · dismiss
│     One line of supporting detail             │  ← description (optional, 1–2 lines)
│                              [Action] [Undo]   │  ← 0–2 text actions, right-aligned
└──────────────────────────────────────────────┘
```

**Inline note** (lives inside a form, card, or section — not full width of the page):

```
┌──────────────────────────────────────────────┐
│ [●] Message, sentence case.  [Action link]    │  ← icon · copy · optional single action
└──────────────────────────────────────────────┘
```

**Banner** (spans the full width of its container; page or section level):

```
┌────────────────────────────────────────────────────────────────┐
│  [●]  Bold lead-in — plain continuation clause.   [Action  →]  │
└────────────────────────────────────────────────────────────────┘
```

**Inbox / notification center** (trigger + panel; the only surface with read/unread state
and grouping):

```
Trigger:  [ 🔔 •3 ]                         ← bell icon button, unread-count Badge (top nav)

Panel (material-menu, 360–400px):
┌──────────────────────────────────────────────┐
│ Notifications        All  Unread   Mark all read │  ← header: title · filter tabs · action
├──────────────────────────────────────────────┤
│ Today                                          │  ← digest group header (date bucket)
│  ○ [icon] Title line               2m  [⋯]    │  ← unread row: dot · icon · title · time · menu
│    Supporting detail, one line truncated       │
│  ● [icon] 3 build failures in Payments   1h    │  ← grouped/digest row (collapsed count)
│    ⌄ expand to see each                        │
│ Earlier                                        │  ← next digest group header
│  ● [icon] Title line                    Yesterday│  ← read row (no dot, no wash)
├──────────────────────────────────────────────┤
│ View all notifications                         │  ← footer link to the full inbox route
└──────────────────────────────────────────────┘
```

Row anatomy (every row, read or unread, grouped or single):

```
[unread dot?] [source icon/avatar] Title (1 line, truncated)         [timestamp] [⋯ DotsMenu]
              Supporting detail (1–2 lines, truncated)
              [inline action(s), text-button-14, 0–2 max]
```

## Variants

**The severity ladder** — pick by asking two questions: _did the user just cause this?_
and _does it belong to the whole page, or one thing on it?_

| Surface         | Caused by the user?                                                | Scope                                                     | Lifetime                                                                       | Use for                                                                                                                                                 |
| --------------- | ------------------------------------------------------------------ | --------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Toast**       | Yes, almost always                                                 | Global (floats above everything)                          | Transient — auto-dismisses (see Interaction model)                             | Confirming an action the user just took: saved, sent, connected, deleted-with-Undo.                                                                     |
| **Inline note** | Sometimes                                                          | One section, form, or card                                | Persistent until the underlying condition changes or the user dismisses it     | A fact tied to the thing it sits next to: "This connector needs re-authorization," a field-level validation summary, a stale-data caveat under a chart. |
| **Banner**      | No                                                                 | The whole page, or a whole section of it                  | Persistent — no auto-dismiss, no per-item close (see Design source note below) | A condition every visitor to this page should know: an incident, a maintenance window, a plan-limit warning, a product announcement.                    |
| **Inbox**       | No, usually something async (an agent run, a teammate, a schedule) | Account/workspace-wide, independent of the current screen | Durable — persists across sessions until read/acted on                         | Anything the user should be able to come back to: approval requests, run completions they weren't watching, mentions, digest summaries.                 |

Geist's own Banner page ships exactly one variant with no size/type/state matrix (see
`research/banner.md`) — do not invent a `variant="warning"` Banner prop or a stackable
multi-Banner system. If more than one page-wide condition is true at once, that is itself
a signal to consolidate into one message, not to stack a second Banner.

**Toast variants** (severity communicated by leading icon + text color, never fill color —
see States):

| Variant | Icon color        | When                                                                                                                 |
| ------- | ----------------- | -------------------------------------------------------------------------------------------------------------------- |
| Neutral | `--ds-gray-900`   | Generic confirmation with no positive/negative charge ("Copied," "Settings saved")                                   |
| Success | `--ds-green-900`  | The action completed as intended                                                                                     |
| Warning | `--ds-amber-900`  | Completed, but with a caveat the user should register                                                                |
| Error   | `--ds-red-900`    | The action failed                                                                                                    |
| Loading | spinner, no color | A promise-backed toast tracking an in-flight action (see Interaction model); resolves into Success or Error in place |

**Inline note variants** — same five-way palette as Toast (Neutral/Success/Warning/Error,
plus Loading only rarely — most inline notes are static facts, not progress trackers).

**Inbox variants**:

- **Popover panel** (default) — opened from the bell trigger in the top nav/rail; `material-menu`,
  closes on outside click or Escape, does not change the route.
- **Full inbox route** (`/inbox` or equivalent) — same header/list/row anatomy, no panel
  chrome, full page width up to `--ds-page-width`; this is where "View all notifications"
  in the panel footer lands, and where filters/search get room to breathe.
- **Digest row** (grouped) — multiple same-type events inside one time bucket collapse into
  one row ("3 build failures in Payments service") using `Collapse` to reveal the
  individual events on demand, rather than each posting its own row (see Interaction
  model, "Digest grouping").

## States

| State                   | Applies to                                                                                       | Tokens                                                                                                                                                                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Default                 | Toast/Note surface                                                                               | `--ds-background-100` fill, `material-small` (Toast, Inbox panel rows use `--ds-popover-row-radius`)                                                                                                                                                                           |
| Default                 | Banner surface                                                                                   | `--ds-background-100` fill, `--ds-shadow-border-small` (1px border via shadow, per `research/banner.md`)                                                                                                                                                                       |
| Hover                   | Inbox row                                                                                        | background `--ds-gray-100` → the popover-row hover convention (matches `--ds-popover-row-height`/`radius`)                                                                                                                                                                     |
| Hover                   | Toast/Note/Banner inline action (text link or `tertiary` button)                                 | per `research/button.md`'s tertiary hover: background `--ds-gray-alpha-200`                                                                                                                                                                                                    |
| Active                  | Inbox row (pressed)                                                                              | background `--ds-gray-200`                                                                                                                                                                                                                                                     |
| Focus                   | Any interactive element inside these surfaces (dismiss X, action button/link, row, bell trigger) | `--ds-focus-ring` (never removed; see Accessibility)                                                                                                                                                                                                                           |
| Disabled                | Toast/Note action mid-request                                                                    | Button's own disabled treatment (`research/button.md`); the toast itself never disables as a whole — only its action does                                                                                                                                                      |
| Loading                 | Toast (promise-backed)                                                                           | Spinner replaces the severity icon; description text may update in place ("Deploying…" → "Deployed") without the toast re-entering (no re-animated entrance)                                                                                                                   |
| Empty                   | Inbox panel/route, zero notifications                                                            | One `EmptyState` composition (`research/empty-state.md`): icon + title ("You are all caught up.") + description; no CTA needed unless the workspace has zero notification sources connected yet, in which case add the one relevant secondary action (e.g. "Connect a source") |
| Error                   | Inbox failing to load                                                                            | Inline load-failure treatment inside the panel body: text `--ds-red-900`, one-line message, a `tertiary` "Retry" action — do not collapse the whole panel or silently show stale data                                                                                          |
| Unread (Inbox row only) | Row not yet opened/acknowledged                                                                  | Background wash `--ds-gray-100`; title text `--ds-gray-1000` (up from the read state's `--ds-gray-900`) rendered `<strong>`; a small (6px) solid `--ds-gray-1000` dot leading the row. **Deliberately neutral, not ember** — see Do/Don't for why.                             |
| Read (Inbox row)        | Row opened/acknowledged                                                                          | No background wash; title `--ds-gray-900`, regular weight; no leading dot                                                                                                                                                                                                      |

## Interaction model

**Pointer**

- **Toast**: appears without requiring a click; hovering (or focusing, via keyboard) any
  toast in the stack pauses its auto-dismiss timer for every visible toast, resuming on
  mouseleave/blur. Clicking an action button executes it, then the toast dismisses.
  Clicking the `X` dismisses without acting. Clicking the toast body outside an action
  does nothing destructive by default (some toasts may route to the relevant screen if the
  whole toast is framed as a link — reserve that for cases with no other action, never mix
  a body-click navigation with a competing action button in the same toast).
- **Toast queueing**: stack newest-on-top, cap visible toasts at **3** on desktop / **2** on
  mobile; beyond the cap, collapse older ones behind a "+N more" affordance rather than
  growing the stack indefinitely. Identical repeated messages (e.g. five failed syncs of
  the same connector within a few seconds) coalesce into one toast with a count ("Sync
  failed ×5") instead of stacking five — this is the toast-level analog of Inbox's digest
  grouping, and prevents a runaway agent loop from flooding the screen.
- **Destructive-confirmation toast** (contract §7.3 cross-component rule): a destructive
  action that supports Undo (e.g. deleting a single item from a list, not a
  Destructive-action-modal-gated action) confirms via a Toast with an "Undo" action and a
  visible duration long enough to react (see timings below) — it does not open a second
  modal to confirm the confirmation.
- **Inline note**: static; dismiss (if dismissible) removes it from the DOM after a short
  height-collapse, never a hard cut. A note tied to a live condition (e.g. "connector needs
  reauthorization") reappears if the condition recurs — dismissal is a UI acknowledgment,
  not a permanent mute of the underlying state.
- **Banner**: no dismiss affordance in Geist's own API (`research/banner.md` — no `onClose`
  prop documented); treat it as persistent for as long as its condition holds. If a specific
  Banner instance genuinely needs dismissibility (e.g. a one-time announcement), that is
  consumer-side state (don't render it once acknowledged), not a prop the primitive exposes.
- **Inbox trigger**: click/tap toggles the panel; badge count updates optimistically the
  moment a row is marked read, not only after the next fetch.
- **Inbox row**: click opens/acts on the notification (navigates to the relevant record or
  expands inline, depending on type) and marks it read in the same interaction — reading
  IS acknowledging, there is no separate "mark read" click for a single row. The row's
  trailing `DotsMenu` (`research/dots-menu.md`) carries secondary per-row actions that don't
  belong on the click path itself (e.g. "Mark unread," "Mute this source," "Copy link").
- **Digest grouping**: a grouped row's chevron expands in place (via `Collapse`, single-open
  within that group's own list, not tied to sibling groups) to show the individual events
  that were collapsed; collapsing back never loses the read/unread state of the individual
  items inside.

**Toast timing** (severity sets the default; any toast with a destructive Undo or a
required decision extends past its severity default):

| Variant                         | Default duration          | Notes                                                                |
| ------------------------------- | ------------------------- | -------------------------------------------------------------------- |
| Neutral / Success               | 4s                        |                                                                      |
| Warning                         | 6s                        | Longer — the caveat needs a beat to register                         |
| Error                           | Until dismissed           | Never auto-dismiss a failure; the user must see it was seen          |
| Undo (destructive-confirmation) | 5–6s                      | Long enough to read + decide; collapses the Undo window once elapsed |
| Loading (promise)               | Until the promise settles | Then transitions in place to its Success/Error duration              |

**Keyboard**

| Key               | Surface                   | Effect                                                                                                                                                                           |
| ----------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Tab`             | Toast stack               | Moves focus into the newest toast's first actionable element only if the user tabs toward it in natural document order; toasts never steal focus on appear                       |
| `Escape`          | Toast (focused)           | Dismisses the focused toast                                                                                                                                                      |
| `Escape`          | Inbox panel (open)        | Closes the panel, focus returns to the bell trigger                                                                                                                              |
| `Enter` / `Space` | Bell trigger              | Opens/closes the panel                                                                                                                                                           |
| `↑` / `↓`         | Inbox panel (open)        | Moves the active-row highlight through the row list, wrapping at the top/bottom of the loaded list (not across into the header/footer)                                           |
| `Enter`           | Inbox row (active)        | Opens/acts on that row, same as a click                                                                                                                                          |
| `→`               | Inbox digest row (active) | Expands the group (mirrors `Collapse`'s own Enter/Space toggle — arrow-right added as an inbox-specific convenience since these rows are inside an already-arrow-navigable list) |
| `Tab`             | Inbox row (active)        | Moves into that row's `DotsMenu`, not to the next row — arrow keys own row-to-row movement inside the panel, Tab owns drilling into one row's controls                           |

**Screen-reader behavior**

- Toast container: `aria-live="polite"`, `role="status"` for Neutral/Success/Warning/Loading;
  `aria-live="assertive"`, `role="alert"` for Error and for a destructive-confirmation Undo
  toast (the one case where an assertive interruption is earned — the window to act is
  short).
- Inline note: `role="status"` (Neutral/Success/Warning) or `role="alert"` (Error) matching
  its color variant.
- Banner: `role="region"` with an `aria-label` naming its purpose (e.g. `aria-label="Product
announcement"`) — it's persistent chrome, not a live-region interruption.
- Inbox bell trigger: `aria-haspopup="dialog"` (or `"menu"` if implemented on a menu
  primitive), `aria-expanded`, and an `aria-label` that includes the live count, e.g.
  `aria-label="Notifications, 3 unread"` — never rely on the visual Badge number alone.
- Inbox panel: `role="dialog"` with `aria-labelledby` on the "Notifications" header text (or
  `role="menu"`/rows-as-`menuitem` if built on a menu primitive — pick one primitive and
  keep row semantics consistent, don't mix dialog and menu roles in the same tree).

**Motion**

- Toast enter/exit: slides in along its stack axis (from the edge it's anchored to) while
  fading in, timed with `--ds-motion-popover-timing` over `--ds-motion-popover-duration`
  (0.2s) — Toast is a floating, momentary surface so it uses the popover timing pair, not
  the heavier overlay pair reserved for Modal/Sheet/Drawer. Stack reflow (a dismissed toast's
  neighbors sliding up to fill the gap) animates on the same timing.
- Inline note enter (condition becomes true): fades in, no slide. Dismiss: height-collapses
  over the same popover duration, then fades the last sliver — never an instant clip.
- Banner: no entrance/exit motion is documented on the source component (`research/banner.md`
  found no animation classes) — render it as static chrome that is simply present or absent
  in the DOM; do not add motion Geist itself doesn't specify here.
- Inbox panel open/close: `material-menu`'s standard popover motion — scale from
  `--ds-motion-overlay-scale` (0.96) to 1 while fading in, `--ds-motion-popover-timing` over
  `--ds-motion-popover-duration` (0.2s), matching every other popover in the system (see
  `research/dots-menu.md`, `research/context-menu.md`).
- Digest row expand/collapse: standard `Collapse` behavior — always animated, never an
  instant jump-cut (per `research/collapse.md`'s own Best Practices).
- `prefers-reduced-motion`: every slide/scale/collapse above becomes a plain opacity
  crossfade capped at 150ms; nothing here ever depends on motion to convey meaning (severity
  is icon + color + text, never "the thing that slid in fastest").

## Responsive behavior

- **Desktop**: Toasts stack bottom-right, cap 3 visible. Inbox opens as a `material-menu`
  popover (360–400px) anchored under the bell trigger in the top nav. Banner spans the full
  container width with message + action on one line.
- **Tablet**: Same as desktop down to the point where the Inbox popover's fixed width would
  crowd the viewport — at that breakpoint widen it to a comfortable fraction of the
  viewport rather than shrinking row content. Toast stack and cap stay the same as desktop.
- **Mobile**: Toasts stack top-center (below any fixed header/safe area) instead of
  bottom-right, cap drops to **2** visible. Inbox swaps the popover for a full Drawer (per
  `patterns/dialogs-drawers-sheets.md` — swap the component, don't restyle the popover to
  look like a drawer), bottom-anchored, content-height with internal scroll. Banner follows
  its own documented responsive rule directly (`research/banner.md`): below the `lg`
  breakpoint (1024px) it collapses from the full message-plus-action bar into a compact,
  truncating pill (message ellipsizes, action becomes a trailing chevron) rather than
  wrapping onto a second line.

## Accessibility

- Toast, Inline note, and Banner never depend on color alone: each pairs its severity color
  with a distinct icon shape (not just a recolored circle) and a text label that reads
  correctly with color removed (grayscale test, contract §11).
- Toast and Inbox notifications are announced, not just displayed — see the `aria-live`/role
  mapping above. A toast that only shows a color chip with no text (no icon-only, no
  color-only toast) is not sanctioned; every toast carries a title string.
- Focus order: Toast/Note/Banner actions are reachable via `Tab` in normal document order;
  none of the three ever traps focus (only Modal/Sheet/Drawer do, per
  `patterns/dialogs-drawers-sheets.md`) — a toast that appears while the user is mid-typing
  in a form must never yank focus away from that field.
- Inbox panel: focus moves into the panel's first row (or its "All/Unread" filter tabs, if
  present) on open; on close, focus returns to the bell trigger, matching the Modal/Sheet
  focus-return convention.
- Contrast: severity text (`--ds-green-900` / `--ds-amber-900` / `--ds-red-900` / neutral
  `--ds-gray-900`) on `--ds-background-100` are the system's pre-validated accessible
  pairings — never introduce a lighter tint of these for "subtlety," and never place
  severity-colored text directly on a same-hue wash below the 900 step (i.e. don't put
  `--ds-red-900` text on `--ds-red-900` background; if a tinted background is wanted, pair
  it with the 100/200 wash per the badge "subtle" pattern in `research/badge.md`).
- Unread indicator: the dot alone is `aria-hidden` — unread state is additionally exposed via
  the row's accessible name (e.g. prefixed "Unread: " for a screen reader, or an
  `aria-current`/`data-unread` state consumed by the row's label) so screen-reader users
  don't rely on a decorative dot for meaning.
- `prefers-reduced-motion` is mandatory across all four surfaces, per Motion above.

## Tokens used

| Token                                                                          | Role in this pattern                                                                                                                                                |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--ds-background-100`                                                          | Toast/Note/Banner/Inbox-panel fill                                                                                                                                  |
| `--ds-gray-100`                                                                | Inbox row hover background; unread row wash                                                                                                                         |
| `--ds-gray-200`                                                                | Inbox row active/pressed background                                                                                                                                 |
| `--ds-gray-alpha-200`                                                          | Toast/Note/Banner inline tertiary-action hover background                                                                                                           |
| `--ds-gray-900`                                                                | Read-row title text; neutral toast/note icon and secondary text                                                                                                     |
| `--ds-gray-1000`                                                               | Unread-row title text (`<strong>`); unread indicator dot fill                                                                                                       |
| `--ds-gray-700`                                                                | Digest group header text (e.g. "Today," "Earlier")                                                                                                                  |
| `--ds-blue-900`                                                                | (Reserved — informational-only content inside a note/banner message, e.g. a plain link; not a Toast/Note severity color in this pattern's default five-way palette) |
| `--ds-green-900`                                                               | Success toast/note icon + text                                                                                                                                      |
| `--ds-amber-900`                                                               | Warning toast/note icon + text                                                                                                                                      |
| `--ds-red-900`                                                                 | Error toast/note icon + text; inbox load-failure text                                                                                                               |
| `--ds-red-100` / `--ds-red-200`                                                | Error/warning subtle background wash, when a tinted note/banner background is used (badge "subtle" pattern)                                                         |
| `--ds-shadow-border-small`                                                     | Banner's 1px border-as-shadow; Toast surface elevation (`material-small`)                                                                                           |
| `--ds-shadow-menu`                                                             | Inbox panel elevation (`material-menu`)                                                                                                                             |
| `--ds-radius-small`                                                            | Toast/Note corner radius (`material-small`)                                                                                                                         |
| `--ds-radius-medium`                                                           | Inbox panel corner radius (`material-menu`)                                                                                                                         |
| `--ds-popover-padding` / `--ds-popover-row-height` / `--ds-popover-row-radius` | Inbox panel internal list rhythm                                                                                                                                    |
| `--ds-z-toast` (5000)                                                          | Toast stacking context — above Modal/Sheet/Drawer, exempt from the one-floating-surface rule                                                                        |
| `--ds-z-menu` (2001)                                                           | Inbox popover stacking context                                                                                                                                      |
| `--ds-focus-ring`                                                              | Focus state on every interactive element across all four surfaces                                                                                                   |
| `--ds-motion-timing-swift`                                                     | Shared easing for every transition in this pattern                                                                                                                  |
| `--ds-motion-popover-duration` (0.2s)                                          | Toast enter/exit; Inbox panel open/close                                                                                                                            |
| `--ds-motion-overlay-scale` (0.96)                                             | Inbox panel entrance scale-from value                                                                                                                               |
| `text-heading-16`                                                              | Inbox panel header title ("Notifications")                                                                                                                          |
| `text-label-14`                                                                | Toast/Note title; Inbox row title                                                                                                                                   |
| `text-copy-14` / `text-copy-13`                                                | Toast/Note/Banner description; Inbox row supporting detail                                                                                                          |
| `text-label-12`                                                                | Digest group header; Inbox row timestamp (paired with `text-label-12-mono` for the numeral-heavy relative time, e.g. "2m")                                          |
| `text-button-14`                                                               | Toast/Note/Banner/Inbox-row inline text actions                                                                                                                     |
| `--geist-gap-quarter` (8px)                                                    | Icon-to-text gap inside a Toast/Note/Banner/row                                                                                                                     |
| `--geist-gap-half` (12px)                                                      | Inter-element gap inside a Toast body (title-to-description, description-to-actions)                                                                                |

## Implementation guidance

**Toast**

- Already wired: `src/components/ui/sonner.tsx` wraps the `sonner` package — this is the
  sanctioned queueing/stacking engine (it owns the stack cap, pause-on-hover, and promise
  API already; don't hand-roll a second toast queue). Restyle its `toastOptions.classNames`
  to consume Tempo tokens instead of the current shadcn defaults (`bg-background`,
  `border-border`, `shadow-lg`) — swap in `material-small`'s radius/shadow and the
  severity-icon-plus-`text-gray-900/-red-900/-green-900/-amber-900` text treatment above.
  Coalescing repeated identical toasts and the "+N more" collapse are call-site logic (key
  the toast by a stable id derived from the message, call `toast.dismiss()`/re-invoke with
  an updated count instead of pushing a new one) — sonner supports updating a toast in
  place by id, use that rather than building a separate dedupe layer.
- Destructive-confirmation Undo toast: a thin wrapper around `sonner`'s `toast()` call, e.g.
  `src/lib/notifications/undo-toast.ts` exporting a `showUndoToast({ message, onUndo })`
  helper so every destructive-with-Undo call site (list-item delete, etc.) gets the same
  duration/action shape without re-deriving it per feature.

**Inline note**

- Restyle `src/components/ui/alert.tsx` (currently a generic shadcn `Alert` with
  `border-destructive`/`bg-background` Tailwind defaults) into the Tempo Note: swap its
  `variant` CVA map to the five-way severity palette above (icon + text color per variant,
  no filled background by default; the `-subtle` wash is opt-in via a `tone="subtle"` prop
  mirroring Badge's `contrast="low"` convention) and consume `text-copy-14` for
  `AlertDescription`. Keep the existing `role="alert"` on the root and add the
  `role="status"` swap for non-error variants per Accessibility above.

**Banner**

- New file: `src/components/ui/banner.tsx`. Match Geist's flat prop surface exactly —
  `children` (message, with `<strong>` for the bold lead-in, not a bespoke kicker
  subcomponent) and an optional `action: { href: string; label: string }` (renamed from
  Geist's `button.content` to `action.label` only for internal naming consistency with this
  repo's other action-prop conventions — the shape is otherwise identical: one link, full
  width, no dismiss). Implement the responsive collapse (full bar ≥1024px, truncating pill
  below it) as two conditionally-rendered inner layouts sharing one `Banner` wrapper, per
  `research/banner.md`'s Design notes, rather than pure CSS truncation — the mobile form
  genuinely swaps markup (message wraps in a `<span className="truncate">`, action becomes
  icon-only chevron).

**Inbox / notification center**

- New directory: `src/components/notifications/` — `notification-bell.tsx` (trigger: icon
  button + `Badge` for the unread count, `variant="inverted"` or a plain solid `--ds-gray-1000`
  fill per the Badge color matrix, sized `sm`), `notification-panel.tsx` (the popover shell,
  built on `@radix-ui/react-popover` — already available via the pattern used in
  `dropdown-menu.tsx`/`context-menu.tsx` — using `material-menu` for its surface),
  `notification-row.tsx` (single-row anatomy incl. the trailing `DotsMenu`, reusing
  `src/components/ui/dropdown-menu.tsx` for that row-level overflow menu rather than
  building a new one), `notification-digest-row.tsx` (grouped row built on
  `Collapse`/`CollapseGroup` semantics — a local single-open toggle is enough; the existing
  `src/components/ui/collapsible.tsx`-style Radix primitive if present, otherwise a minimal
  local implementation matching `research/collapse.md`'s Enter/Space + `aria-expanded`
  contract).
- Server logic pairs with a `src/lib/notifications.functions.ts` module (TanStack server
  functions): `listNotifications` (paginated, returns items pre-grouped into digest buckets
  server-side so the client never re-derives "Today"/"Earlier" from raw timestamps),
  `markRead`, `markAllRead`, `getUnreadCount` — consumed from
  `notification-panel.tsx`/the `/inbox` route via `useQuery`/`useMutation`, following the
  existing `prds` ↔ `discovery.functions.ts` pairing convention in this repo.
- Full inbox route: `src/routes/_authenticated.inbox.tsx`, reusing `notification-row.tsx`
  and `notification-digest-row.tsx` at full page width (no `material-menu` wrapper needed —
  the page background already provides the surface).

**Where these compose with existing Supaprod code**

- Destructive `Button` → confirming Toast is already a named cross-component contract
  (contract §7); any new destructive, undo-able action wires through
  `showUndoToast` above rather than a bespoke inline confirmation.
- The notification bell stays permanently visible in the top nav/rail — per the Engine-Room
  doctrine's calm-front law, this is a primary feedback channel, not machinery, so it is
  never tucked behind the Engine Room door. Granular preferences (which event types
  generate a notification vs. an email vs. nothing) belong in Settings, not inside the
  panel itself — the panel's own header only ever carries a filter (All/Unread) and "Mark
  all read," never a settings gear.

## Usage examples

**1. Toast — an agent run finishes while the user is elsewhere in the product**

```tsx
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

function onBuildComplete(build: { id: string; serviceName: string }) {
  toast.success(`${build.serviceName} deployed`, {
    description: "All checks passed.",
    action: {
      label: "View build",
      onClick: () => navigate(`/build/${build.id}`),
    },
  });
}
```

**2. Inline note — a connector needs re-authorization, shown under its row in Settings**

```tsx
import { Alert, AlertDescription } from "@/components/ui/alert";

function ConnectorRow({ connector }: { connector: Connector }) {
  return (
    <div className="flex flex-col gap-2">
      <ConnectorHeader connector={connector} />
      {connector.needsReauth && (
        <Alert variant="warning" className="text-copy-14">
          <AlertDescription>
            Supaprod lost access to <strong>{connector.name}</strong>.{" "}
            <a href={connector.reauthUrl} className="text-button-14">
              Reconnect
            </a>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
```

**3. Inbox — grouped approval requests in the PM Chief of Staff panel**

```tsx
import { NotificationBell } from "@/components/notifications/notification-bell";
import { NotificationPanel } from "@/components/notifications/notification-panel";
import { NotificationDigestRow } from "@/components/notifications/notification-digest-row";
import { useNotifications } from "@/lib/notifications.functions";

function TopNavNotifications() {
  const { data, markRead, markAllRead } = useNotifications();

  return (
    <NotificationPanel
      trigger={<NotificationBell unreadCount={data?.unreadCount ?? 0} />}
      onMarkAllRead={markAllRead}
    >
      {data?.groups.map((group) => (
        <section key={group.label}>
          <h3 className="text-label-12 text-gray-700">{group.label}</h3>
          {group.items.map((item) =>
            item.kind === "digest" ? (
              <NotificationDigestRow key={item.id} item={item} onOpen={markRead} />
            ) : (
              <NotificationRow key={item.id} item={item} onOpen={markRead} />
            ),
          )}
        </section>
      ))}
    </NotificationPanel>
  );
}
```

## Do / Don't

- Do pick the surface by cause-and-scope, not by how urgent the message feels: something
  the user just did → Toast; a fact about one section → Note; a condition for the whole
  page → Banner; anything they might want later → Inbox.
- Do cap the toast stack and coalesce repeats — a runaway agent or sync loop must never be
  able to fill the screen with toasts.
- Do keep Banner to Geist's own flat shape: one message, one optional action, no dismiss, no
  variant matrix. If a second concurrent page-wide condition shows up, consolidate the
  message rather than stacking a second Banner.
- Do let reading an Inbox row double as marking it read; don't force a separate
  confirmation click just to clear the unread state.
- Do use `Collapse` semantics (always-animated, Enter/Space, `aria-expanded`) for digest
  rows — never an instant, unannounced expand.
- Don't use a Toast for anything that needs more than one click to resolve — if it needs a
  decision, route it to the Inbox or open the relevant surface directly; a Toast that
  requires reading a paragraph has already failed at being a Toast.
- Don't auto-dismiss an Error toast, and don't auto-dismiss a destructive Undo toast before
  its full window elapses.
- Don't use ember for the unread indicator dot or any severity color. Ember is reserved for
  brand/CTA/focus/selected states (contract §2); an unread marker is a neutral wayfinding
  cue, not a brand moment, so it stays `--ds-gray-1000`. (Several inspiration products use
  their single brand hue here — Tempo deliberately does not, to protect the "one ember
  moment per view" restraint budget. Flag if the founder wants to revisit this.)
- Don't rely on color alone anywhere in this pattern — pair every severity with a distinct
  icon and a legible text label (grayscale test).
- Don't trap focus in a Toast, Note, or Banner, and don't let a Toast appearing mid-typing
  steal focus from the active field.
- Don't add a shimmer sweep or invent a new motion curve for any of these four surfaces —
  shimmer is retired system-wide, and every animation here traces to
  `--ds-motion-timing-swift` plus the popover duration token.
