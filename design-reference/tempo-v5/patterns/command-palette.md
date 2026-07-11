# Command palette

> Give people one fast, keyboard-first surface that finds anything and runs anything in
> Cadence, without their hands leaving the keyboard or their place on the page getting lost.
> Extension — base: Geist `CommandMenu`, `CommandMenuInput`, `CommandMenuList`,
> `CommandMenuGroup`, `CommandMenuItem`, `CommandMenuDivider`, `CommandMenuPage`, `Kbd`,
> `Button`, `EmptyState`, the materials/typography/color tokens · inspiration: Linear's
> command menu (page-stack drill-down, stable per-group ranking, sequential "go to" letter
> chords) and Arc's command bar (blending find and act in one field, adaptive suggestions
> before a character is typed) — principles paraphrased in our own words, never their
> assets or copy.

## Anatomy

The palette is one overlay that can hold many pages. A page is whatever is currently
loaded into the list; opening the root palette loads the root page, and selecting certain
rows pushes a new page onto the same overlay instead of opening a second surface.

```
Trigger (optional — a search-styled Button in the app rail; the global ⌘K/Ctrl+K
shortcut works with no visible trigger at all once the listener is mounted)
        │
        ▼
Overlay (material-modal, centered, desktop/tablet — material-fullscreen, mobile)
┌──────────────────────────────────────────────────────────────────┐
│ 🔍  Search or type a command…                              esc   │  ← Input row (40px)
├──────────────────────────────────────────────────────────────────┤
│ Recent                                                            │  ← Group heading
│    📄  PRD: Pricing tier revamp                        12m ago    │  ← Row (icon+label+suffix)
│    ⚙   Mission: Onboarding rebuild                                │
├──────────────────────────────────────────────────────────────────┤
│ Create                                                            │  ← action rows
│    ＋  New mission                                        ⌘⇧M    │
│    ＋  New PRD                                                    │
├──────────────────────────────────────────────────────────────────┤
│ Go to                                                             │  ← navigation rows
│    →  Today                                                 G T   │
│    →  Discover                                               G D  │
│    →  Switch workspace                                         ›  │  ← drills into a page
├──────────────────────────────────────────────────────────────────┤
│ PRDs                                    (appears once query ≠ "")  │
│    📄  Pricing tier revamp             matched "pricing"           │
└──────────────────────────────────────────────────────────────────┘
     ↑↓ Navigate        ↵ Select        esc Close                     ← footer key-hint bar
```

Nested page (after selecting "Switch workspace"):

```
┌──────────────────────────────────────────────────────────────────┐
│ ‹   Search workspaces…                                     esc   │  ← back chevron replaces
├──────────────────────────────────────────────────────────────────┤     the search icon
│ Workspaces                                                        │
│    ●  Acme (current)                                        ✓     │  ← ember checkmark = current
│    ○  Beta Labs                                                    │
├──────────────────────────────────────────────────────────────────┤
│  ⌫ Back        ↑↓ Navigate        ↵ Select        esc Close        │
└──────────────────────────────────────────────────────────────────┘
```

Named parts:

- **Trigger** — a search-styled `Button variant="secondary" size="medium"` living in the
  app rail (see `search-filtering.md`'s Global search variant for the exact trigger
  anatomy). Purely optional: any surface may open the palette straight off the global
  shortcut with no persistent visible trigger, and a scoped instance (see Variants) is
  usually opened from an ordinary in-context `Button`, not a search-styled one.
- **Overlay** — the floating shell. `material-modal` on desktop/tablet (12px radius,
  centered); `material-fullscreen` on mobile (16px radius, edge to edge). Width and
  height limits live in Responsive behavior.
- **Input row** — always the first and only text field, always present on every page
  (root or nested). Leading slot holds either a search icon (root/leaf page) or a back
  chevron (any nested page, also clickable as a pointer alternative to Backspace).
  Placeholder always names what is being searched and ends in an ellipsis (e.g. "Search
  or type a command…", "Search workspaces…") — never a bare "Search…". Trailing slot
  holds the `esc` key hint on desktop/tablet (hidden on mobile, see Responsive behavior).
- **Result list** — the scrollable region holding every group, loose row, and divider for
  the current page only. Height caps out well short of the viewport (see Responsive
  behavior) so it never forces the whole overlay to grow past a comfortable reading size.
- **Group** — a labeled cluster of rows. Heading is Title Case, one or two words
  ("Recent", "Create", "Go to", or an entity type like "PRDs"), rendered `text-label-13`
  `--ds-gray-900`, never itself interactive or focusable.
- **Row** — one actionable line: a leading 16px icon slot (entity-type glyph for a result,
  a plus for Create, an arrow for Go to), the label (`text-label-14`, `--ds-gray-1000`,
  with the matched substring bolded when filtering), an optional one-line secondary
  description underneath (`text-copy-13`, `--ds-gray-900`, used sparingly — only when the
  label alone is ambiguous), and a trailing suffix slot for a `Kbd` shortcut, a relative
  timestamp (mono), a status/check icon, or a drill-in chevron.
- **Divider** — a plain hairline rule separating loose rows from a group, or one group
  from the next, exactly as Geist's `CommandMenuDivider` demo shows; purely visual, no
  semantics of its own.
- **Page stack** — not a rendered element but the model behind nested pages: each entry
  is `{ id, label, placeholder, rows-or-fetcher }`. There is no visible breadcrumb; the
  input's placeholder is the only on-screen sign of which page is active, matching
  Geist's own guidance that a page just renames the input's scope.
- **Footer key-hint bar** — a thin strip under the list, `text-label-12` paired with
  `Kbd`, always showing `↑↓ Navigate`, `↵ Select`, `esc Close`; `⌫ Back` is appended only
  while a nested page is active.

## Variants

- **Root palette (global)** — the one true instance, mounted once in the authenticated
  shell and opened from anywhere via `Cmd+K` / `Ctrl+K`. Its root page holds Recent,
  Create, Go to, then query-scoped entity result groups. This is the palette Cadence
  ships by default; every other variant below reuses the same component, never a
  parallel implementation.
- **Nested page (sub-palette)** — pushed onto the same overlay when a row's job is to
  narrow scope rather than act immediately (choosing a workspace, assigning an owner,
  changing a status). Always offers Back (`⌫` on empty input, or the back chevron);
  closing the whole palette from a nested page still takes `Esc`, exactly as Geist
  documents for `CommandMenu` (Escape always closes the entire menu, it does not just
  pop one page).
- **Scoped contextual palette** — opened from inside one surface's own trigger (e.g. a
  Mission detail view's "Actions" `Button`) rather than the global shortcut, and starts
  already narrowed to that surface's own rows (Approve, Send back, Reassign, Archive) with
  no Recent/Create/Go to groups. Its own first page acts as that instance's root: Backspace
  on an empty input and `Esc` both simply close it, since there is nothing beneath it to
  pop back to. Use this only when the action set is genuinely local to one record; if the
  same actions are also useful from anywhere else, add them to the global palette's
  Create/Go to groups instead of forking a second component.
- **Inline quick-create shortcut (optional)** — not a separate UI surface, a filtering
  behavior on the root palette's own input: typing a Create row's leading word (e.g.
  "new") ranks every Create row to the top via the ordinary fuzzy match, so power users
  never need to browse to the Create group by eye. This is a consequence of the scoring
  model below, not a feature to build separately.

## States

### Overlay / backdrop

- **Default** — `material-modal` (desktop/tablet) or `material-fullscreen` (mobile);
  backdrop `--ds-overlay-backdrop-color` at `--ds-overlay-backdrop-opacity` (0.8).
- **Opening / closing** — see Interaction model → Motion.

### Input row

- **Default** — background `--ds-background-100`; ring `--ds-shadow-border-small`;
  leading icon and placeholder `--ds-gray-700`; typed value `--ds-gray-1000`.
- **Hover** — background unchanged (inputs never shift background on hover per the
  system-wide rule); no visual change beyond the native cursor, since the input is
  focused the instant the overlay opens.
- **Focus** — the palette autofocuses the input the moment it opens, so "focus" is
  effectively the resting state for as long as the overlay is open; `--ds-focus-ring`
  still applies as the visible ring.
- **Disabled** — not applicable; an input row is never disabled, only the whole trigger
  that opens it can be (e.g. a scoped palette's trigger while its record is still
  loading) — follow `research/button.md`'s disabled treatment for that trigger.

### Row

- **Default** — transparent background; icon and label colors per Anatomy.
- **Hover / keyboard-highlighted** — background `--ds-gray-100` (the shared popover-row
  hover convention), `--ds-popover-row-radius` corners; keyboard highlighting and pointer
  hover are visually identical, only one row is highlighted at a time regardless of input
  method.
- **Active (mouse down, pre-release)** — background steps to `--ds-gray-200` for the
  brief pressed instant, matching the general control press convention; this state is
  transient and does not need its own token beyond the one already used for "selected."
- **Disabled** (an action unavailable in the current context, e.g. "Deploy" with no
  deploy target configured) — text `--ds-gray-700`, icon `--ds-gray-700`, no hover
  background, cursor `not-allowed`; pair it with a one-line inline description under the
  label explaining why (the row already has room for that secondary line — reach for a
  `Tooltip` instead only if the row is too narrow to fit one, e.g. on mobile).
- **Selected / current** (a nested single-select page only, e.g. the active workspace in
  Switch workspace) — a trailing checkmark icon in `--ds-ember-900`, per the contract's
  sanction of ember for genuine selection state; the row's background and text stay
  neutral, only the check glyph carries the ember. Never wash the whole row in ember for
  this — one small glyph is the entire signal.

### Loading (a server-backed group's results are in flight, e.g. cross-entity search)

- Keep every already-loaded group visible; the loading group alone renders flat
  `--ds-gray-100` placeholder rows at the real rows' proportions (no shimmer, shimmer is
  retired system-wide) or a small inline spinner beside that group's heading. Never blank
  or collapse the whole list while one group is still loading.

### Empty query (pre-type, root palette)

- Never render a blank list. Populate the root page with Recent (if any recents exist),
  then Create, then Go to, in that fixed order — this is the default, useful-before-typing
  state Geist's own Best Practices calls for.
- If there are no recents yet (a brand-new account), simply omit the Recent group rather
  than showing an empty one with a heading and nothing under it.

### No matches (post-type, nothing scores above the cutoff in any group)

- Render the shared `EmptyState` in place of the result list: `title` = `No Commands
Match Your Search`, `description` repeats the query in curly quotes, e.g. `No commands
match "delete billing". Try a different term.` Always keep the input itself editable
  and focused underneath, this is not a dead end.
- Wrap the swap in `aria-live="polite"` so it announces without stealing focus, same as
  `search-filtering.md`'s no-results guidance (this pattern and that one share the same
  underlying primitive and the same empty-state convention).

### Error (a query-backed group's request fails)

- One row inside that group, `--ds-red-900` text, a short reason, and a "Try again"
  tertiary button; every other group and the static Create/Go to rows stay usable, a
  transport failure in one source never takes down the whole palette.

## Interaction model

### Pointer

- Click the trigger (or press the global shortcut) to open; click any row to activate it
  according to its kind (see the row-kind table below); click the back chevron to pop one
  page; click outside the overlay, or press the visible `esc`/close affordance on mobile,
  to dismiss.
- Never open a second floating surface on top of an already-open palette. When a Create
  row's job is to open a fuller creation form than one line can hold, close the palette
  first and then open that Modal/Sheet — the two never stack (contract §4 and the
  `dialogs-drawers-sheets.md` one-floating-surface rule both apply here).

### Row kinds and what Enter does

Every row is one of three kinds; the kind decides what selecting it does, never the
group it happens to sit in (a Create-kind row could in principle surface inside a
query-scoped group too, if it scores high enough):

| Kind           | Example labels                                            | On select                                                                                                                                                                                                               |
| -------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Action**     | "Deploy Project", "Approve request", "Invite team member" | Runs immediately and closes the palette. Label is a Title Case verb phrase naming the action, never how it works.                                                                                                       |
| **Navigation** | "Today", "Discover", "Plan", "Build", "Brain"             | Routes to that destination and closes the palette. Label names the destination itself, never "Go to {X}" as the label text (the group heading "Go to" already supplies that verb, so the row itself just says "Today"). |
| **Create**     | "New mission", "New PRD"                                  | Closes the palette, then opens that domain's existing creation entry point (the same one its own "New X" button already uses elsewhere in the product — never a second, parallel creation path).                        |
| **Drill-in**   | "Switch workspace", "Assign to…"                          | Pushes a new page onto the stack; the palette stays open, focus stays in the input, the input clears and its placeholder updates to the new page's scope.                                                               |

### Keyboard

| Key                                           | Effect                                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Cmd+K` / `Ctrl+K`                            | Opens the root palette from anywhere. Reserved globally — no page-level search field, filter bar, or scoped palette may reuse this binding (contract already enforces this for the `search-filtering.md` global search variant; it is the same shortcut).                                                                                                                                                       |
| Typing                                        | Narrows the current page's rows. Client-side groups (Create, Go to, Recent) filter instantly; server-backed entity groups debounce 150 to 250ms, matching `search-filtering.md`.                                                                                                                                                                                                                                |
| `↑` / `↓`                                     | Moves the highlighted row within the current page, clamped at the first/last row (no wraparound).                                                                                                                                                                                                                                                                                                               |
| `Enter`                                       | Activates the highlighted row per its kind, above.                                                                                                                                                                                                                                                                                                                                                              |
| `Backspace` on an empty input                 | Pops back one page. At the true root (or at a scoped instance's own first page) this has no effect, since there is nothing to pop back to.                                                                                                                                                                                                                                                                      |
| `Esc`                                         | Closes the whole palette outright, from any page, and returns focus to the trigger. It never just pops one page, matching Geist's own documented behavior.                                                                                                                                                                                                                                                      |
| `1`-`9` (optional acceleration)               | May jump straight to the first through ninth visible row without arrowing down to it, mirroring a convention some fast command palettes use for their default pre-query suggestions. Sanctioned but optional; if implemented, restrict it to the pre-query Recent/Create/Go to rows only, so it never collides with typing a literal digit into a search query.                                                 |
| A "go to" row's own chord (e.g. `G` then `T`) | A sequential two-key shortcut, distinct from a simultaneous chord like `⌘K`: press `G`, release, then press the destination's letter. Only wire this for the static Go to group's own rows, shown in the row's `Kbd` suffix exactly as the two keys in sequence. This is a judgment call carried over from Linear's convention, paraphrased; it is optional polish, not required for the pattern to be correct. |

### Screen reader

- The overlay is `role="dialog"` `aria-modal="true"` (or the palette's underlying `cmdk`
  - Radix Dialog composition, which already provides this).
- The input is `role="combobox"`, `aria-expanded="true"` while open, `aria-controls`
  pointing at the list, `aria-activedescendant` tracking the highlighted row's id. Real
  DOM focus stays on the input at all times; arrow keys move the virtual highlight, they
  never move focus onto a row element.
- The list is `role="listbox"`; each row is `role="option"`; each group is `role="group"`
  with `aria-labelledby` pointing at its heading text.
- Announce page changes: when a drill-in row is activated, an `aria-live="polite"` region
  states the new scope (e.g. "Now searching workspaces") so a screen-reader user knows the
  input's meaning changed even though its visible placeholder is the only sighted cue.
- The result count / no-matches swap is `aria-live="polite"`, identical to
  `search-filtering.md`'s rule, since both surfaces share the same primitive.
- Every shortcut hint shown in a row's suffix or the footer key-hint bar renders through
  the shared `Kbd` component so assistive tech announces it as a label ("Command K"),
  never as raw, ambiguous glyph text.

### Motion

- **Open / close** — `material-modal` entrance: scale in from `--ds-motion-overlay-scale`
  (0.96) to 1 while fading in, `--ds-motion-overlay-timing` (`--ds-motion-timing-swift`),
  `--ds-motion-overlay-duration` (0.3s); reverse on close. Mobile's `material-fullscreen`
  variant uses the same timing/duration but a translate-up rather than a scale, matching
  the Sheet/Drawer axis convention from `dialogs-drawers-sheets.md`.
- **Page push / pop** — Geist's own `command-menu` documentation gives no motion spec for
  this (its Best Practices cover only focus-trap and page-stack semantics, not animation),
  so this is a Tempo judgment call, not a lifted spec: a swift, `--ds-motion-popover-timing`
  /`--ds-motion-popover-duration` (200ms) crossfade, with a small 4 to 8px horizontal shift
  in the direction of travel (push moves left, pop moves right). It stays well inside the
  motion law's "micro-interactions ≤ 200ms" ceiling and never touches the overlay's own
  scale, only the list content swaps.
- `prefers-reduced-motion`: the overlay opens/closes with an instant state change (no
  scale, no translate, backdrop still fades since a pure visibility snap on the backdrop
  reads as a flash); page push/pop swaps instantly with no crossfade or shift.

## Responsive behavior

- **Desktop** — `material-modal`, centered, fixed width in the 560 to 640px range (640px
  for the root palette given it carries the most groups; 480 to 560px is enough for a
  scoped or nested page with fewer rows). List height caps around 60vh of viewport so the
  overlay never dominates a short window; the list scrolls internally past that cap.
- **Tablet** — same shell and behavior as desktop; width clamps to roughly 90% of the
  viewport only once the viewport itself is narrower than the desktop width band, per
  Tailwind's existing breakpoints (no bespoke breakpoint token exists in the token set, so
  none is invented here).
- **Mobile** — `material-fullscreen`, edge to edge, matching the same Modal-to-Fullscreen
  swap `search-filtering.md` documents for its global search variant (this is the same
  swap, not a second one). The input row pins to the top under the safe area; the `esc`
  hint in its trailing slot is replaced by a visible "Cancel" tertiary `Button` or a
  close "×" since there is no physical Escape key; the footer key-hint bar is hidden
  entirely (arrow/enter hints are meaningless without a keyboard) and replaced by nothing
  — the list simply fills the remaining height. Row hit targets grow to a 44px minimum tap
  area via extra vertical padding on the existing 36px row, rather than changing the row's
  visual height or radius tokens.

## Accessibility

- Roles: `role="dialog"`/`aria-modal="true"` on the overlay, `role="combobox"` on the
  input with `aria-expanded`/`aria-controls`/`aria-activedescendant`, `role="listbox"` on
  the list, `role="option"` on each row, `role="group"` + `aria-labelledby` on each group.
- Focus order: focus moves to the input the instant the overlay opens and never leaves it
  while the overlay is open (highlighting is virtual, via `aria-activedescendant`, not real
  DOM focus movement); on close, focus returns to whatever triggered the palette, never
  left floating on `<body>`.
- Contrast: row label `--ds-gray-1000` on `--ds-background-100`, secondary description
  `--ds-gray-900` on the same background, group heading `--ds-gray-900` — all three are
  the role model's pre-validated accessible pairings; the matched-substring highlight is
  bold weight, never a lower-contrast color swap.
- Every `Kbd` suffix and footer hint is real, announced content, not a decorative glyph
  baked into the label string.
- The no-matches swap and any page-change announcement are both `aria-live="polite"`, so
  neither yanks focus away from the input mid-type.
- `prefers-reduced-motion` is honored for every open/close and page transition, see Motion
  above; this is mandatory, not a nice-to-have.

## Tokens used

| Token / class                                                           | Role in this pattern                                                                                                                            |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `--ds-background-100`                                                   | Overlay surface fill, input fill.                                                                                                               |
| `--ds-gray-100`                                                         | Hovered/keyboard-highlighted row background; loading placeholder blocks; disabled row (no bg change, listed for completeness of the role band). |
| `--ds-gray-200`                                                         | Momentary pressed-row background.                                                                                                               |
| `--ds-gray-400` / `--ds-gray-500`                                       | Input ring, default/hover.                                                                                                                      |
| `--ds-gray-700`                                                         | Placeholder text, leading search/back icon, disabled row text and icon.                                                                         |
| `--ds-gray-900`                                                         | Group heading text, secondary row description, matched-substring base color (bolded, not recolored).                                            |
| `--ds-gray-1000`                                                        | Primary row label text, typed input value.                                                                                                      |
| `--ds-gray-alpha-300`                                                   | Optional background wash behind a matched substring in very dense result groups only (mirrors `search-filtering.md`'s rule).                    |
| `--ds-ember-900`                                                        | Selected/current-item checkmark on a nested single-select page only.                                                                            |
| `--ds-red-900`                                                          | Error-row text and retry affordance.                                                                                                            |
| `--ds-focus-ring` / `--ds-focus-color`                                  | Input's visible focus ring.                                                                                                                     |
| `--ds-overlay-backdrop-color` / `--ds-overlay-backdrop-opacity`         | Backdrop behind the overlay (0.8).                                                                                                              |
| `--ds-shadow-border-small`                                              | Input ring.                                                                                                                                     |
| `material-modal` / `--ds-shadow-modal`                                  | Overlay shell, desktop/tablet.                                                                                                                  |
| `material-fullscreen` / `--ds-shadow-fullscreen`                        | Overlay shell, mobile.                                                                                                                          |
| `--ds-radius-small`                                                     | Row corner radius (`--ds-popover-row-radius`).                                                                                                  |
| `--ds-radius-medium`                                                    | Overlay corner radius (via `material-modal`).                                                                                                   |
| `--ds-motion-timing-swift`                                              | Every transition in this pattern.                                                                                                               |
| `--ds-motion-overlay-scale` / `-timing` / `-duration`                   | Overlay open/close (0.96 scale, 300ms).                                                                                                         |
| `--ds-motion-popover-timing` / `-duration`                              | Page push/pop crossfade (200ms).                                                                                                                |
| `--ds-size-large` (40px)                                                | Input row height.                                                                                                                               |
| `--ds-popover-padding` / `-row-height` / `-row-radius` / `-row-padding` | List interior padding and each row's box model (6px padding, 36px rows, 6px radius, 8px horizontal row padding).                                |
| `--ds-z-modal`                                                          | Overlay stacking context.                                                                                                                       |
| `--geist-gap-quarter` (8px)                                             | Icon-to-label gap inside a row; row-to-suffix gap.                                                                                              |
| `--geist-gap-half` (12px)                                               | Gap between the footer bar's key-hint groups.                                                                                                   |
| `text-label-14`                                                         | Row primary label.                                                                                                                              |
| `text-label-13`                                                         | Group heading.                                                                                                                                  |
| `text-label-12`                                                         | Footer key-hint copy.                                                                                                                           |
| `text-label-13-mono` / `text-label-12-mono`                             | Relative timestamps and `Kbd` shortcut glyphs in a row's suffix or the footer.                                                                  |
| `text-copy-13`                                                          | Row secondary description line; no-matches description.                                                                                         |
| `text-button-14`                                                        | Any `Button` composed into this pattern (mobile "Cancel," a retry button, a scoped trigger).                                                    |

## Implementation guidance

- **Radix / cmdk mapping** — `cmdk`'s `Command` primitive inside a Radix `Dialog`, exactly
  the shape already wired in `src/components/ui/command.tsx` (`Command`, `CommandDialog`,
  `CommandInput`, `CommandList`, `CommandGroup`, `CommandItem`, `CommandSeparator`,
  `CommandShortcut`). That file today still carries pre-Tempo Tailwind defaults
  (`bg-popover`, `text-sm`, `text-muted-foreground`, `bg-accent`) instead of `--ds-*`
  tokens and Tempo type classes — porting it is a prerequisite for this pattern, same
  porting-phase note already logged in `search-filtering.md` for `badge.tsx`, not
  something to restyle ad hoc inside a feature branch.
- **The missing `Kbd` primitive** — no `src/components/ui/kbd.tsx` exists yet, and no
  dedicated Geist `research/kbd.md` or `keyboard-input.md` spec exists in this repo's
  survey either. Build it from the two references that do exist: `command-menu.md`'s
  Accessibility rule ("render each item's keyboard shortcut using a `Kbd` slot so it's
  both visually discoverable and announced as a label"), and the concrete class pairing
  `search-filtering.md` already ships in its usage example
  (`<kbd className="text-label-12-mono text-gray-700">Ctrl K</kbd>`). Extend today's
  `CommandShortcut` (a plain ad hoc `<span>`) into a real shared `Kbd` component with that
  exact styling, and reuse it everywhere a shortcut is shown, not just here.
- **Nested pages** — `cmdk` has no built-in multi-page primitive; hold the page stack as
  local state, one entry per page (`{ id, label, placeholder, rows or a fetcher }`).
  Render `CommandList`'s content from the top of the stack only; wire `Backspace` on an
  empty `CommandInput` (check `value === "" && key === "Backspace"` in `onKeyDown`) to pop
  the stack; clear the input's text value on every push and pop so a stale query never
  leaks into an unrelated page.
- **Reconciling with `search-filtering.md`** — that pattern's "Global search (Command
  Menu)" variant and `global-search.tsx` file name are this pattern's own canonical
  mounted instance, not a second component. `search-filtering.md` describes the
  entity-search half of the same palette; this doc adds the Create/Go to groups, row
  kinds, nested pages, and scoring rules that make it a full command palette rather than
  a search box. Build one `src/components/ui/command-palette.tsx` (the page-stack state,
  the Recent source, the Create/Go to static rows, the scoring logic below) and mount it
  once, wherever `search-filtering.md` says to mount `global-search.tsx` — do not create
  two competing files for one overlay.
- **Component file placement** — `src/components/ui/command.tsx` (existing `cmdk`
  primitives, ported to tokens), `src/components/ui/kbd.tsx` (new, shared), and
  `src/components/ui/command-palette.tsx` (new, the Cadence-specific composed instance:
  page stack, recents, static Create/Go to rows, the global `Cmd+K`/`Ctrl+K` listener),
  mounted once in the authenticated app shell, never re-mounted per route.
- **Recents source** — a small capped list (roughly the last 5 to 8 visited or created
  resources), most-recent-first, kept client-side (e.g. `localStorage` or a lightweight
  session store) rather than a server round-trip; update it on navigation and on
  successful creation, and drop the group entirely once it is empty rather than rendering
  an empty heading.
- **Create rows** — wire each one directly to the same server function or mutation its
  own domain's existing "New X" entry point already calls (e.g. the same creation path
  `prds`/`discovery.functions.ts` or the matching mission-creation call already uses) —
  never fork a second creation code path just because the palette is a different entry
  point into it.
- **Go to rows** — a static list matching the product's own IA (Today, Discover, Plan,
  Build, Brain, plus the one Engine Room door), per `engine-room-doctrine.md`'s
  five-destinations-plus-one-door model; add a "Switch workspace" drill-in row fed by the
  same workspace list already powering the account switcher, rather than a new data
  source.
- **Entity search groups** — reuse the same `src/lib/search.functions.ts` server function
  `search-filtering.md` already specifies, grouped by entity type (PRDs, missions, agents,
  traces), debounced 150 to 250ms.
- **Scoring hints** — pre-query, there is nothing to score: Recent stays most-recent-first,
  Create and Go to stay in their fixed, hand-authored order, and groups render in the
  fixed sequence Recent → Create → Go to. Post-query, let `cmdk`'s own fuzzy match decide
  order inside each group, but keep the groups themselves in a fixed priority so the whole
  list does not visibly reshuffle on every keystroke: an exact or prefix match in Create or
  Go to outranks a fuzzy entity match (typing "new" should surface "New mission" and "New
  PRD" above any entity that merely contains "new" in its name), and within an entity
  group, tie-break equally-scored rows by recency (a PRD opened yesterday outranks one
  opened three months ago at an otherwise equal match score). This stability rule is a
  judgment call carried over from how fast command palettes generally behave, paraphrased
  in our own words; it is not a literal Geist or `cmdk` API contract.

## Usage examples

### 1. Root palette mounted once in the authenticated shell

```tsx
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import { FileText, Settings, Plus, ArrowRight } from "lucide-react";
import { useCommandPalette } from "@/hooks/use-command-palette";

function GlobalCommandPalette() {
  const { open, setOpen, page, pushPage, popPage, recents, query, setQuery, results } =
    useCommandPalette();

  return (
    <Command.Dialog open={open} onOpenChange={setOpen} className="material-modal">
      <CommandInput
        placeholder={page.placeholder}
        value={query}
        onValueChange={setQuery}
        onKeyDown={(e) => {
          if (e.key === "Backspace" && query === "") popPage();
        }}
      />
      <CommandList>
        {page.id === "root" && recents.length > 0 && (
          <CommandGroup heading="Recent">
            {recents.map((item) => (
              <CommandItem key={item.id} onSelect={() => item.open()}>
                <FileText size={16} className="text-gray-900" />
                <span className="text-label-14">{item.label}</span>
                <span className="ml-auto text-label-12-mono text-gray-700">
                  {item.relativeTime}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {page.id === "root" && (
          <>
            <CommandGroup heading="Create">
              <CommandItem onSelect={() => createMission()}>
                <Plus size={16} className="text-gray-900" />
                <span className="text-label-14">New mission</span>
                <Kbd className="ml-auto">Cmd Shift M</Kbd>
              </CommandItem>
              <CommandItem onSelect={() => createPrd()}>
                <Plus size={16} className="text-gray-900" />
                <span className="text-label-14">New PRD</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Go to">
              <CommandItem onSelect={() => navigateTo("today")}>
                <ArrowRight size={16} className="text-gray-900" />
                <span className="text-label-14">Today</span>
                <Kbd className="ml-auto">G T</Kbd>
              </CommandItem>
              <CommandItem
                onSelect={() =>
                  pushPage({
                    id: "switch-workspace",
                    label: "Workspaces",
                    placeholder: "Search workspaces…",
                  })
                }
              >
                <Settings size={16} className="text-gray-900" />
                <span className="text-label-14">Switch workspace</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}

        {query !== "" &&
          results.map((group) => (
            <CommandGroup key={group.entityType} heading={group.entityType}>
              {group.rows.map((row) => (
                <CommandItem key={row.id} onSelect={() => row.open()}>
                  <FileText size={16} className="text-gray-900" />
                  <span
                    className="text-label-14"
                    dangerouslySetInnerHTML={{ __html: row.highlightedLabel }}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
      </CommandList>
    </Command.Dialog>
  );
}
```

### 2. Nested page — switching workspaces with a selected-state checkmark

```tsx
import { CommandGroup, CommandItem } from "@/components/ui/command";
import { Check, Circle } from "lucide-react";

function WorkspaceListPage({ workspaces, currentId, onSelect }: WorkspacePageProps) {
  return (
    <CommandGroup heading="Workspaces">
      {workspaces.map((workspace) => (
        <CommandItem key={workspace.id} onSelect={() => onSelect(workspace.id)}>
          <Circle size={16} className="text-gray-900" />
          <span className="text-label-14">
            {workspace.name}
            {workspace.id === currentId && <span className="text-gray-900"> (current)</span>}
          </span>
          {workspace.id === currentId && <Check size={16} className="ml-auto text-ember-900" />}
        </CommandItem>
      ))}
    </CommandGroup>
  );
}
```

### 3. Scoped contextual palette from a Mission detail view

```tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

function MissionActionsPalette({ mission }: { mission: Mission }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="tertiary" size="small" onClick={() => setOpen(true)}>
        Actions
      </Button>
      <Command.Dialog open={open} onOpenChange={setOpen} className="material-modal">
        <CommandInput placeholder={`Search actions for ${mission.name}…`} />
        <CommandList>
          <CommandGroup heading="Mission actions">
            <CommandItem onSelect={() => approveMission(mission.id)}>
              <span className="text-label-14">Approve</span>
            </CommandItem>
            <CommandItem onSelect={() => sendBackMission(mission.id)}>
              <span className="text-label-14">Send back</span>
            </CommandItem>
            <CommandItem onSelect={() => archiveMission(mission.id)}>
              <span className="text-label-14">Archive</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command.Dialog>
    </>
  );
}
```

## Do / Don't

- Do mount exactly one global palette instance app-wide; don't build a second file or a
  second `Cmd+K` listener alongside it.
- Do reserve `Cmd+K` / `Ctrl+K` for opening the root palette alone; don't let a nested
  page, a scoped instance, or any page-level search field rebind it.
- Do close the palette before opening a Create row's own fuller Modal/Sheet; don't stack
  that creation surface on top of a still-open palette.
- Do keep the pre-query root page populated with Recent, Create, and Go to; don't show a
  blank list before the first character is typed.
- Do write Action and Create labels as Title Case verb phrases ("Deploy Project", "New
  mission") and Navigation labels as the bare destination name ("Today," not "Go to
  Today"); don't blend the two phrasings.
- Do bold the matched substring in a result row; don't recolor it with ember, blue, or any
  chromatic token, a text match is not a status.
- Do reserve ember for a genuine selected/current marker inside a nested single-select
  page; don't tint an entire row, group, or the overlay itself ember.
- Do keep real DOM focus on the input at all times, moving only the virtual
  `aria-activedescendant` highlight with the arrow keys; don't move focus onto each row as
  the user navigates.
- Do return focus to whatever triggered the palette on close; don't leave focus stranded
  on `<body>`.
- Do render every shortcut hint, in a row's suffix or the footer bar, through the shared
  `Kbd` component; don't bake a shortcut into a plain, unlabeled text string.
- Do let `Backspace` on an empty input pop one page back; don't let it silently do nothing
  on any page except a true root.
- Do gate the overlay's open/close and every page transition on `prefers-reduced-motion`;
  don't skip that check because a page-swap crossfade feels minor.
- Do keep the footer key-hint bar factual and short (arrows, enter, esc, back only); don't
  decorate it with an exclamation point or a cute phrase, per the humanized-output law, and
  never an em or en dash inside any row label, placeholder, or empty-state string.
