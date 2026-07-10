# Search & filtering

> Lets people narrow a long list to what they need, either everywhere at once (global
> search) or within the page they are already on (a filter bar), and always tells them
> plainly what is applied and what to do when nothing matches.
> Extension — base: Geist `Combobox`, `ClearableInput`, `Badge` (`pill` variant),
> `Command Menu`, `Checkbox`, `Button`, `EmptyState`, materials/typography/color tokens ·
> inspiration: Linear filter bar (pill grammar, `F` to add a filter), Notion Quick Find
> (recents-before-typing, `Cmd+K` global scope).

## Anatomy

Two structures share one grammar: a **global search** overlay (cross-surface, keyboard
first) and a **page filter bar** (scoped to the list already on screen). A third,
lighter shape, the **standalone search field**, is the filter bar with the pill row
omitted.

### Global search (Command Menu)

```
Trigger (in the app rail, medium 36px control)
┌───────────────────────────────────────────┐
│  Search Cadence...                   ⌘K   │
└───────────────────────────────────────────┘

Overlay (material-modal, centered, opens on click or ⌘K/Ctrl+K)
┌─────────────────────────────────────────────────┐
│ 🔍  Search PRDs, missions, agents...        esc  │  ← CommandMenuInput, 40px row
├─────────────────────────────────────────────────┤
│ Recent                                           │  ← CommandMenuGroup heading
│    Mission: Onboarding rebuild            2h ago │  ← CommandMenuItem, suffix = mono timestamp
│    PRD: Pricing tier revamp                      │
├─────────────────────────────────────────────────┤
│ PRDs                                             │  ← results grouped by entity type
│    Pricing tier revamp        matched "pricing"  │  ← matched substring in bold, not color
│ Missions                                         │
│    Build onboarding flow                    ⌘2   │  ← Kbd suffix for a direct shortcut
└─────────────────────────────────────────────────┘
   ↑↓ navigate      ↵ select      esc close
```

Parts: **trigger** (a search-styled button living in the app rail, not a text input
itself) → **overlay** (`material-modal`, `CommandMenuInput` always first and singular) →
**list** (`CommandMenuList`, holding `CommandMenuGroup`s and/or loose `CommandMenuItem`s,
optionally separated by a `CommandMenuDivider`) → **item row** (leading entity-type icon,
label with the matched run bolded, trailing suffix slot for a timestamp, a shortcut
`Kbd`, or a status icon) → **footer key hints** (optional, `↑↓` / `↵` / `esc`, rendered in
`text-label-12` + `Kbd`).

### Page filter bar

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [🔍 Search missions...]  [Status: In Review ▾ ×]  [Agent: 3 ▾ ×]  [+ Add filter]        [View: My open items ▾]  [Clear all] │
└──────────────────────────────────────────────────────────────────────────────┘
  24 results · 2 filters applied
```

Parts, left to right: **search field** (`ClearableInput`, medium, leading search icon) →
**filter pills**, one per active facet, each `Facet: value` with a chevron (opens the
facet's edit popover) and an `×` (removes the facet entirely) → **add-filter trigger**
(tertiary `Button`, `+` prefix, opens a `Combobox`/`Menu` of unused facets) → *(right-
aligned cluster)* **saved views** (a `Combobox`- or `Menu`-driven picker showing the
active view's name) → **clear all** (a tertiary/link `Button`, rendered only once at
least one filter is applied). An optional **summary line** sits directly under the bar
(`text-copy-13`, `--ds-gray-900`) stating the result count and how many filters are
active; this is the line that also carries the no-results message when the count is
zero.

### Facet edit popover (opens from a pill's chevron or the add-filter trigger)

```
┌───────────────────────────┐
│ Status                    │  ← popover header, text-label-13 text-gray-900
├───────────────────────────┤
│ ☑ In Review               │  ← Checkbox rows, 36px, for multi-value facets
│ ☐ Approved                │
│ ☐ Blocked                 │
├───────────────────────────┤
│ Clear                Done │  ← tertiary + default button, 32px
└───────────────────────────┘
```

Single-value facets (one value at a time, e.g. an owner or a date preset) use a
`Combobox`/`ComboboxList` instead of a `Checkbox` group; multi-value facets (status,
labels, agents) use stacked `Checkbox` rows inside the same `material-menu` shell.

## Variants

- **Global search (Command Menu)** — cross-entity, opened from anywhere via the trigger
  or the global shortcut. Use when people need to jump to or act on any resource in the
  product, not just the list in front of them.
- **Page filter bar** — persistent, scoped to the table/list already rendered on the
  page. Use whenever a list can plausibly grow past a single screenful and has more than
  one facet worth narrowing by (status, owner, agent, date, label).
- **Standalone search field** — a lone `ClearableInput` with no pill row, filtering the
  visible list client-side as the user types. Use for short, single-facet lists (under
  roughly 50 rows) where a full filter bar would be overhead; this is the filter bar with
  the pill cluster and add-filter trigger omitted, not a separate component.
- **Inline single-facet quick filter** — one `Combobox` (e.g. a lone "Status" dropdown)
  with no pill chrome at all, for pages with exactly one useful facet. Promote it to a
  pill the moment a second facet is needed, so the grammar stays consistent as the page
  grows.
- **Saved views** — a named, persisted combination of active filters plus the current
  sort. Rendered as a picker in the bar's right cluster; selecting one replaces the
  entire active filter set. Applying, editing, or clearing filters while a saved view is
  selected detaches from it (the picker reverts to an unnamed "Custom" state) rather than
  silently mutating the saved view.
- **Multi-value facet pill** — the pill's popover is a `Checkbox` list; the pill label
  collapses to a count once more than one value is selected (`Status: 3` rather than
  spelling out all three), so the bar never wraps just because one facet has many
  values.
- **Single-value facet pill** — the pill's popover is a `Combobox`/single-select list;
  the pill label always shows the one chosen value in full (`Owner: Priya Shah`).

## States

### Search field (`ClearableInput`, applies to global search input and the filter bar's field)

- **Default** — background `--ds-background-100`; border/ring via
  `--ds-shadow-border-small`; placeholder and leading icon `--ds-gray-700`; value text
  `--ds-gray-1000`.
- **Hover** — background steps to `--ds-gray-100`… no: keep background unchanged for
  inputs (only the border reads hover); border strengthens to `--ds-gray-500`.
- **Focus (active/typing)** — `--ds-focus-ring` (2px background + 2px
  `--ds-focus-color`, the ember hue) applied as a box-shadow ring; border unchanged. The
  clear (`×`) button fades in the moment the value is non-empty, in either state.
- **Disabled** — background `--ds-gray-100`, border via a flattened
  `--ds-shadow-border-small` at `--ds-gray-300`, text `--ds-gray-700`, cursor
  `not-allowed`; the clear button is suppressed even if a value is present (per the
  Geist `ClearableInput` disabled demo).
- **Loading** (query in flight, global search or a server-backed facet) — keep the list
  open and populated with its last-known rows or skeleton rows; show a small spinner in
  place of, or just left of, the clear button. Never collapse or blank the list while
  waiting.
- **Empty** (no character typed yet, global search only) — show `Recent` then a
  `Suggestions`/default group; never render a blank overlay.
- **Error** (the search backend failed) — a single row in the list, `--ds-red-900` text,
  a one-line reason and a "Try again" tertiary button; the input itself does not turn red
  (`errored` is a `Combobox`-level state for validation, not for a transport failure).

### Filter pill (applied facet, e.g. `Status: In Review`)

- **Default** — background `--ds-gray-200`, text `--ds-gray-1000`, chevron icon
  `--ds-gray-900`, `rounded-full` per the Geist Badge/Pill shape.
- **Hover** — background `--ds-gray-300`.
- **Active / open** (its popover is showing) — background `--ds-gray-300` held until
  close; popover itself is `material-menu`.
- **Focus** — `--ds-focus-ring`.
- **Disabled** (a facet the user cannot remove, e.g. a workspace-scoped filter forced by
  the page) — background `--ds-gray-100`, text `--ds-gray-700`, the `×` hidden, cursor
  `not-allowed`; pair it with a `Tooltip` naming why ("Scoped to this workspace") per the
  contract's disabled-pairs-with-tooltip rule. Never leave a locked pill unexplained.
- **Add-filter trigger** ("+ Add filter") — styled as `Button variant="tertiary"`
  (transparent background, `--ds-gray-200` on hover), never as a pill; it is an action,
  not an applied value.

### Saved view chip

- **Unselected / "Custom"** — same neutral gray treatment as a filter pill.
- **Selected** — `--ds-ember-100` background, `--ds-ember-900` text. This is the one
  deliberate ember moment in the whole pattern (contract §2 explicitly sanctions ember
  for "active/selected states"); only one saved view can be selected at a time, so this
  never multiplies into several simultaneous ember chips.

### Result row / result list

- **Default** — `text-label-14` for the primary label, `text-label-13`/`text-copy-13` for
  secondary metadata, `--ds-gray-900` for secondary text.
- **Matched substring highlight** — bold, not colored: nest the matched run in `<strong>`
  inside the row's `text-label-*`/`text-copy-*` class so it renders the built-in Strong
  modifier (600 weight, same color). Reserve a `--ds-gray-alpha-300` background wash
  behind the matched run as an optional secondary technique only for very dense lists
  where bold alone does not stand out; never use ember, blue, or any chromatic token to
  mark a text match, a match is not a status.
- **Hover/keyboard-highlighted row** — background `--ds-gray-100` (popover-row
  convention, `--ds-popover-row-radius` corners).
- **Selected/active row** (the row the query currently affects, e.g. inside a facet
  popover) — background `--ds-gray-200`, a leading checkmark for multi-select rows.
- **Empty / no results** — see "No-results guidance" below; renders the shared
  `EmptyState` primitive in place of the row list, not a bespoke block.
- **Error** — one row, `--ds-red-900` text, retry action, same treatment as the search
  field's error state above.

### No-results guidance

Use the shared `EmptyState` (`icon` + `title` + `description`, optional action
children), following the Geist empty-state content rules:

- Single free-text query: `title` = `No {Items} Match Your Search` (Title Case);
  `description` repeats the query back in curly quotes, e.g. `No results match
  "onboarding flow". Try a different term or clear the search.`
- Multiple active filters: `title` = `No {Items} Match Your Filters`; `description`
  suggests the fix, e.g. `Widen the date range or clear a filter to see more.`
- Always pair the message with a real, focusable action: a tertiary "Clear filters" (or
  "Clear search") `Button`, never a bare instruction with nothing to click.
- Wrap the region in `aria-live="polite"` so the new state is announced without stealing
  focus, since it appears after an async filter change.

## Interaction model

### Pointer

- Click the search field to focus it; click a filter pill to open its edit popover;
  click a pill's `×` to remove that facet outright (no popover); click "Add filter" to
  open the facet picker; click outside any open popover/overlay to close it (standard
  Combobox/Menu dismissal).
- Click the saved-views chip to open a picker of saved combinations; selecting one
  replaces the whole active filter set in one action.

### Keyboard

Global search:

| Key | Effect |
| --- | --- |
| `Cmd+K` / `Ctrl+K` | Open the overlay from anywhere in the app (reserved globally; no page-level field may reuse this binding). |
| Typing | Narrows the list; empty input shows Recent/Suggestions, never a blank list. |
| `↑` / `↓` | Move the highlighted item. |
| `Enter` | Activate the highlighted item. |
| `Esc` | Close the overlay; focus returns to whatever had it before opening. |
| `Backspace` on an empty input (paged mode) | Pop back one page rather than doing nothing. |

Filter bar:

| Key | Effect |
| --- | --- |
| `Tab` / `Shift+Tab` | Moves between: search field → each pill (one stop each) → add-filter → saved views → clear all → into the list/table. |
| `Enter` / `Space` on a focused pill | Opens that pill's popover. |
| `Delete` / `Backspace` on a focused pill (popover closed) | Removes that filter directly, mirroring the `×` click. |
| Inside an open popover | Standard `Combobox`/`Checkbox` navigation: `↑`/`↓` between options, `Space` toggles a checkbox row, `Enter` selects a single-value option, `Esc` closes the popover and returns focus to the pill. |
| `Esc` inside the search field | Clears it (built-in `ClearableInput` behavior; do not add a redundant handler on top of it). |

### Screen reader

- Global search overlay follows the combobox/listbox pattern: `role="combobox"` on the
  input, `aria-expanded`, `aria-controls` pointing at the list, `aria-activedescendant`
  tracking the highlighted item.
- The filter bar is a labelled region, e.g. `aria-label="Filters for Missions"`, so
  assistive tech announces the scope before the controls inside it.
- Each pill announces as `"{Facet}: {value}, button, collapsed/expanded"`.
- The result count is a live region (`aria-live="polite"`) so it narrates as the list
  narrows, without moving focus.
- Every keyboard shortcut shown in the UI (the overlay's footer hints, a `Kbd` suffix on
  a fast-path item) is rendered through the `Kbd` component so it is announced as a label,
  not swallowed as decorative text.

### Motion

- Facet popovers, the add-filter menu, and the saved-views picker: `material-menu`,
  `--ds-motion-popover-timing` easing, `--ds-motion-popover-duration` (200ms).
- The global search overlay: `material-modal` (or `material-fullscreen` on mobile,
  matching the Modal-to-Dialog swap Geist documents for `Combobox`-in-`Modal`),
  `--ds-motion-overlay-timing`, `--ds-motion-overlay-duration` (300ms), scaling in from
  `--ds-motion-overlay-scale` (0.96).
- Adding or removing a pill: a short (≤200ms), swift-eased opacity/width transition so
  the row does not jump; this is baseline motion law, not the surface's one allotted
  personality touch, so it needs no special sign-off.
- Everything above gates on `prefers-reduced-motion`: popovers and the overlay open/close
  instantly, pills appear/disappear with no transition.

## Responsive behavior

- **Desktop** — full pill row inline; search field holds a fixed width; saved views and
  clear-all sit right-aligned in the same row via `justify-between`.
- **Tablet** (narrower app shell, sidebar still visible) — pills wrap to a second line
  once the row runs out of width (matching the common SaaS filter-bar convention rather
  than truncating or hiding pills); the saved-views picker collapses from a labelled chip
  to an icon-plus-chevron trigger to save width. Use Tailwind's `sm`/`md`/`lg`
  breakpoints for this; no bespoke breakpoint tokens exist in the token set, so do not
  invent pixel values beyond what Tailwind already provides.
- **Mobile** — the pill row and add-filter trigger collapse behind one tertiary "Filters"
  button carrying a count badge (e.g. "Filters (2)"); tapping it opens a `Drawer`
  (`material-large`, or `material-fullscreen` for a bottom sheet that takes the full
  height) with every facet stacked full width, `Checkbox` groups and `Combobox`es in
  place of pills, and "Clear all" / "Apply" actions pinned to the drawer's footer. The
  search field itself stays visible and full width above the fold, since search is the
  primary affordance and filters are secondary on small screens. Global search becomes a
  full-screen `material-fullscreen` overlay instead of a centered modal.

## Accessibility

- Roles: `role="combobox"` + `aria-expanded` + `aria-controls` + `aria-activedescendant`
  on every text-driven picker (global search input, single-value facet Combobox);
  `role="listbox"`/`role="option"` inside the popped-open list; native
  `<fieldset>`/`<legend>` around multi-value `Checkbox` groups inside a facet popover.
- Focus order: search field, then each pill left to right, then add-filter, then saved
  views, then clear-all, then into the list/table content; opening any popover traps
  focus inside it and returns focus to the trigger on close (same contract as `Combobox`
  nested in a `Modal`).
- Contrast: pill text (`--ds-gray-1000` on `--ds-gray-200`) and the selected saved-view
  chip (`--ds-ember-900` on `--ds-ember-100`) both sit in the role model's accessible
  900/1000-on-100/200 pairing; never drop to a lower step for "quieter" chrome.
- A pill's chevron is a supporting glyph, not the sole signal that it opens something,
  per the identity layer's icon-pairs-with-text rule; the visible `Facet: value` label
  carries the meaning.
- The result count and the no-results swap are both `aria-live="polite"`, so neither
  yanks focus away from wherever the person is typing.
- Reduced motion: every open/close and pill add/remove above collapses to an instant
  state change (no scale, no fade, no width transition) when `prefers-reduced-motion` is
  set.

## Tokens used

| Token / class | Role in this pattern |
| --- | --- |
| `--ds-background-100` | Search field, popover, and overlay fill. |
| `--ds-gray-100` | Disabled search field fill; hovered result/popover row. |
| `--ds-gray-200` | Filter pill default fill; selected result row; hovered pill. |
| `--ds-gray-300` | Hovered/open filter pill fill; disabled pill border. |
| `--ds-gray-400` / `--ds-gray-500` | Search field border, default/hover. |
| `--ds-gray-700` | Placeholder text, leading icons, secondary metadata, disabled text. |
| `--ds-gray-900` | Pill chevron, summary line text, secondary result copy. |
| `--ds-gray-1000` | Pill label text, primary result label, value text. |
| `--ds-gray-alpha-300` | Optional background wash behind a matched substring in dense lists. |
| `--ds-ember-100` / `--ds-ember-900` | Selected saved-view chip only. |
| `--ds-red-900` | Error row text (search failure, list load failure). |
| `--ds-focus-ring` / `--ds-focus-color` | Focus state on the search field, pills, and popover rows. |
| `--ds-shadow-border-small` | Search field and pill border/ring. |
| `--ds-shadow-menu` / `material-menu` | Facet popover, add-filter menu, saved-views picker. |
| `--ds-shadow-modal` / `material-modal` | Global search overlay (desktop). |
| `--ds-shadow-fullscreen` / `material-fullscreen` | Global search overlay and filter drawer (mobile). |
| `--ds-radius-small` | Pill and popover-row corners. |
| `--ds-radius-medium` | Popover and overlay corners. |
| `--ds-motion-timing-swift` | Every transition in this pattern. |
| `--ds-motion-popover-timing` / `--ds-motion-popover-duration` | Facet popover, add-filter menu, saved-views picker open/close (200ms). |
| `--ds-motion-overlay-timing` / `--ds-motion-overlay-duration` / `--ds-motion-overlay-scale` | Global search overlay open/close (300ms, scale from 0.96). |
| `--ds-size-small` / `--ds-size-medium` | Popover footer buttons (32px) and the search field/pills (36px default). |
| `--ds-popover-padding` / `--ds-popover-row-height` / `--ds-popover-row-radius` / `--ds-popover-row-padding` | Facet popover interior and its option rows. |
| `--geist-gap-quarter` (8px) | Gap between the search field, pills, and add-filter trigger. |
| `--geist-gap-half` (12px) | Gap between the left cluster and the right cluster's own elements. |
| `--geist-gap-section` (32px) | Space between the filter bar and the list/table it governs. |
| `--ds-z-menu` / `--ds-z-modal` / `--ds-z-drawer` | Stacking for the facet popover, global search overlay, and mobile filter drawer respectively. |
| `text-label-14` | Pill labels, search field value text. |
| `text-label-13` | Popover header, secondary result metadata. |
| `text-label-13-mono` / `text-label-12-mono` | Ids, timestamps, and shortcut hints in result rows. |
| `text-copy-13` | Summary line ("24 results · 2 filters applied"), no-results description. |
| `text-copy-14` | No-results description when more room is available (e.g. inside a full drawer). |
| `text-button-14` | Add-filter, clear-all, and popover footer buttons. |

## Implementation guidance

- **Radix primitive mapping** — global search: `cmdk` (Command) inside a Radix `Dialog`,
  matching the project's existing `src/components/ui/command.tsx`. Facet dropdowns and
  the saved-views picker: Radix `Popover` as the shell, with either the same `cmdk` list
  (single-value, typeable facets) or a plain `Checkbox` list (multi-value facets) as
  content. Pills: a native `<button>` styled with the `badgeVariants({ variant: 'pill' })`
  class factory from the Badge spec, never a static `Badge` (Badge itself must stay
  non-interactive, per the Geist Badge best practices, so an applied filter is always a
  Pill, not a Badge with an `onClick` bolted on). Search field: extend Radix-free native
  `<input>` the way `ClearableInput` does (controlled value + a discrete `onClear`
  handler, Escape-to-clear built in). No-results: the shared `EmptyState` primitive.
- **shadcn/ui structure** — the repo already has `src/components/ui/command.tsx`,
  `badge.tsx`, `checkbox.tsx`, `input.tsx`, and `popover.tsx`; this pattern composes them
  rather than replacing them. Two are still missing and should be added as thin
  compositions, not new primitives from scratch: `src/components/ui/clearable-input.tsx`
  (wraps `input.tsx` with a clear button and `onClear`) and
  `src/components/ui/combobox.tsx` (wraps `popover.tsx` + `command.tsx` into the
  single-value typeahead pattern). Note that today's `badge.tsx` is still the pre-Tempo
  shadcn default (plain `bg-primary`/`bg-secondary` classes, no `--ds-*` tokens, no `pill`
  variant) — porting it to the token system and adding the `pill` variant is a
  prerequisite for this pattern, tracked as part of the Tempo porting phase, not built
  ad hoc inside a feature branch.
- **Component file placement** — `src/components/ui/filter-pill.tsx` (the pill button,
  `badgeVariants` + chevron + remove affordance), `src/components/ui/search-filter-bar.tsx`
  (the composed bar: search field, pill row, add-filter trigger, saved views, clear all,
  summary line), `src/components/ui/global-search.tsx` (the Command Menu overlay + its
  `Cmd+K`/`Ctrl+K` listener, mounted once in the authenticated app shell, not per page).
- **Composition with existing Cadence code** — global search queries across surfaces via
  one server function (e.g. `src/lib/search.functions.ts`) returning grouped results by
  entity type (PRDs, missions, agents, traces); debounce the free-text query 150 to 250ms
  before firing it, and keep client-side highlighting instant regardless of debounce.
  Page filter bars follow the existing `<domain>.functions.ts` ↔
  `_authenticated.<domain>.tsx` pairing: the active filters become part of the
  `useQuery` `queryKey` for that domain's list query (e.g. discovery, roadmap, traces),
  so applying or clearing a pill just changes the key and lets TanStack Query refetch;
  do not maintain a second, parallel filter-state store outside the query key. Saved
  views are a named snapshot of that same filter-state shape, persisted per
  user-and-surface; treat them as data, not as a second source of truth for what filters
  currently mean.

## Usage examples

### 1. Global search from the app rail

```tsx
import {
  CommandMenu,
  CommandMenuInput,
  CommandMenuList,
  CommandMenuGroup,
  CommandMenuItem,
  CommandMenuDivider,
  Button,
} from "@/components/ui";
import { useState } from "react";

function GlobalSearch() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="secondary"
        size="medium"
        onClick={() => setOpen(true)}
        aria-label="Search Cadence"
        className="w-60 justify-between"
      >
        <span className="text-label-14 text-gray-700">Search Cadence...</span>
        <kbd className="text-label-12-mono text-gray-700">Ctrl K</kbd>
      </Button>

      <CommandMenu open={open} setOpen={setOpen}>
        <CommandMenuInput placeholder="Search PRDs, missions, agents..." />
        <CommandMenuList>
          <CommandMenuGroup heading="Recent">
            <CommandMenuItem callback={() => navigateToMission("m_204")}>
              Mission: Onboarding rebuild
            </CommandMenuItem>
          </CommandMenuGroup>
          <CommandMenuDivider />
          <CommandMenuGroup heading="PRDs">
            <CommandMenuItem callback={() => navigateToPrd("prd_88")}>
              Pricing tier revamp
            </CommandMenuItem>
          </CommandMenuGroup>
        </CommandMenuList>
      </CommandMenu>
    </>
  );
}
```

### 2. Page filter bar on the Missions list

```tsx
import { ClearableInput, FilterPill, Button, Combobox } from "@/components/ui";

function MissionsFilterBar({ filters, setFilters, savedView, results }: Props) {
  const activeCount = Object.keys(filters).length;

  return (
    <div className="flex flex-col gap-2" role="search" aria-label="Filters for missions">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ClearableInput
            aria-label="Search missions"
            placeholder="Search missions..."
            value={filters.query ?? ""}
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
            onClear={() => setFilters({ ...filters, query: undefined })}
          />

          {filters.status && (
            <FilterPill
              label="Status"
              value={filters.status.length > 1 ? `${filters.status.length}` : filters.status[0]}
              onRemove={() => setFilters({ ...filters, status: undefined })}
            >
              {/* Checkbox list content rendered inside the pill's popover */}
            </FilterPill>
          )}

          <Button variant="tertiary" size="small" prefix="+">
            Add filter
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Combobox aria-label="Saved views" placeholder="My open items" size="small">
            {/* ComboboxOption per saved view */}
          </Combobox>
          {activeCount > 0 && (
            <Button variant="tertiary" size="small" onClick={() => setFilters({})}>
              Clear all
            </Button>
          )}
        </div>
      </div>

      <p className="text-copy-13 text-gray-900" aria-live="polite">
        {results.length} results{activeCount > 0 ? ` · ${activeCount} filters applied` : ""}
      </p>
    </div>
  );
}
```

### 3. Standalone search field on the Guardrails list

```tsx
import { ClearableInput, EmptyState, EmptyStateIcon } from "@/components/ui";
import { IconShield } from "lucide-react";

function GuardrailsSearch({ query, setQuery, visibleRows }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <ClearableInput
        aria-label="Search guardrails"
        placeholder="Search guardrails by name..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {visibleRows.length === 0 && (
        <div aria-live="polite">
          <EmptyState
            icon={<EmptyStateIcon icon={<IconShield size={32} />} />}
            title="No Guardrails Match Your Search"
            description={`No results match "${query}". Try a different term or clear the search.`}
          >
            <Button variant="tertiary" onClick={() => setQuery("")}>
              Clear search
            </Button>
          </EmptyState>
        </div>
      )}
    </div>
  );
}
```

## Do / Don't

- **Do** use the interactive `pill` variant (`badgeVariants({ variant: 'pill' })`) for
  every applied filter; **don't** attach an `onClick` to a static `Badge` — Badge must
  stay non-interactive per its own contract.
- **Do** repeat the user's own query back in no-results copy, exactly:
  `No results match "{query}".`; **don't** ship a generic, unspecific "No results found."
- **Do** keep the global search list populated with Recent/Suggestions before any
  character is typed; **don't** render a blank overlay on open.
- **Do** trap focus inside an open popover or overlay and return it to the trigger on
  close; **don't** let Tab leak out to the page behind an open Command Menu.
- **Do** keep every filter pill gray, reserving ember only for the single selected saved
  view; **don't** color multiple simultaneous pills ember, that is several brand moments
  at once and fails the grayscale/restraint test.
- **Do** build the facet popover from `material-menu`; **don't** hand-roll a border,
  shadow, and radius combination for it.
- **Do** wrap the result count and the no-results swap in `aria-live="polite"`;
  **don't** let an async filter change happen silently for screen-reader users.
- **Do** keep `Cmd+K`/`Ctrl+K` reserved for global search alone; **don't** bind it to a
  page-level search field, even one that feels similarly important.
- **Do** pair a disabled/locked filter pill with a `Tooltip` naming why it is locked;
  **don't** leave an unexplained greyed-out pill sitting in the bar.
- **Do** write pill labels, placeholders, and empty-state copy in plain sentence or Title
  Case per the humanized-output law; **don't** use mono-caps, exclamation points, or
  AI-cliché phrasing ("Oops! Nothing here") anywhere in this pattern's strings, and never
  an em or en dash inside them.
- **Do** stack at most one floating surface at a time (a facet popover opening from a
  pill inside an already-open drawer is fine, but never two independent overlays open
  side by side); **don't** open the global search overlay on top of an already-open facet
  popover.
