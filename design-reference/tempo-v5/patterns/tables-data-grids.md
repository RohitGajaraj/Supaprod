# Tables & data grids

> Structured rows of comparable records (specs, runs, violations, agents) that let a person scan, compare, sort, select, and act on many items in one view.
> Extension — base: Geist Card (container material), Checkbox, Badge (status color roles + Pill), Dots Menu, Context Menu, Button, Tooltip, Empty State, Error, plus the color/typography/materials/spacing token layer · inspiration: Linear issue lists, Notion databases (principles only, re-expressed in Tempo's own vocabulary).

## Anatomy

A table/data grid is a stack of four horizontal bands inside one `material-base` (or `material-small`) container with `overflow: hidden` so the flat rows don't poke past the container's 6px corner radius:

1. **Toolbar** (optional) — search input + a view-density switcher + a column-visibility trigger. Deep filtering belongs to the separate search-and-filtering pattern; this table only hosts the density/column controls locally and composes with that pattern for anything more.
2. **Bulk action bar** (conditional) — replaces the toolbar's right-hand side the instant selection count > 0. Shows the count ("3 selected") plus one primary action and up to two secondary/tertiary actions; more than that collapses into a Dots Menu, per the >2-sibling-actions rule.
3. **Header row** — one cell per column: an optional leading checkbox cell (select-all), then column headers (label + optional sort chevron), ending in a blank actions-column header. Sticky to the top of the table's own scroll container when that container scrolls independently of the page.
4. **Body rows** — one row per record. Each row is a horizontal sequence of typed cells (see Column types below), terminated by a right-aligned, on-hover-revealed Dots Menu.
5. **Footer** — row count summary ("Showing 1 to 20 of 143") and pagination controls, or a "Load more" trigger for infinite lists.

```
┌──────────────────────────────────────────────────────────────────────┐
│ [Search…]        [Density ▾] [Columns ▾]                              │  ← toolbar (hidden once selection > 0)
│ 3 selected                          [Archive]  [Export]        ⋯      │  ← bulk action bar (replaces the row above)
├──────────────────────────────────────────────────────────────────────┤
│ ☐   Title                Owner        Status        Updated      ⋯    │  ← sticky header row
├──────────────────────────────────────────────────────────────────────┤
│ ☐   Auth revamp          R. Gajaraj   ● Building     2h ago       ⋯    │  ← body row (comfortable, 36px)
│ ☑   Billing v2           R. Gajaraj   ○ Blocked      1d ago       ⋯    │  ← selected row (ember wash)
├──────────────────────────────────────────────────────────────────────┤
│ Showing 1 to 20 of 143                        ‹  1  2  3 … 8  ›       │  ← footer
└──────────────────────────────────────────────────────────────────────┘
```

### Column types

- **Text** — the primary or secondary label for the record. `text-label-14` (primary column) or `text-label-13` (secondary columns), color `--ds-gray-1000` (primary) or `--ds-gray-900` (secondary). Single line, `text-overflow: ellipsis`, wrapped in a Tooltip (`material-tooltip`) that only mounts when the rendered text is actually clipped (measure on mount/resize, not unconditionally).
- **Mono** — ids, slugs, paths, hashes, durations: `text-label-13-mono` or `text-label-12-mono` in compact density, color `--ds-gray-900`. Long ids/hashes use **middle truncation** ("`8f21ab…9c04`") rather than end truncation, so the more-distinguishing tail stays visible — a token-consistent stance we're extrapolating in the absence of a dedicated `middle-truncate` spec (flagged for a future research pass). Pair `text-tabular` on any column showing changing numeric values (durations, counts) so digits don't jitter the column width on refresh.
- **Status** — a Status Dot (small filled circle, `currentColor` set to the status hue's `600` step, ~8px, no border) always paired with a text label, or a subtle Badge per `badge.md`'s documented color-to-meaning map (`green` healthy/success, `red` error, `amber` warning, `blue` informational, `gray` neutral). Status Dot's exact geometry has no dedicated Geist research page yet; the sizing above is an informed extrapolation from Badge's icon-size ramp, not a verified source value — treat as provisional until a `status-dot.md` spec exists.
- **Actions** — a Dots Menu (`iconSize={18}` default, dropping to `12`/`10` only in compact density) right-aligned in its own narrow column. Hidden at `opacity: 0` by default, `opacity: 1` on row hover, row focus-within, or touch (never hidden for keyboard/touch users — see States).
- **Time** — a relative label ("2h ago") in `text-label-13` `--ds-gray-900`, `text-tabular`. The exact absolute timestamp is always available via the native `title` attribute and, on hover/focus, a Tooltip showing the absolute stamp in `text-label-13-mono`. No dedicated `relative-time-card` spec exists yet either; this is the minimal contract-consistent fallback until one is written.

## Variants

- **Density** — `compact` (32px rows), `comfortable` (36px rows, default), `spacious` (40px+ rows, auto-height for a two-line cell). Each density snaps to the matching `--ds-size-small/medium/large` control height so a row's inline checkbox/button never breaks the 32/36/40 grid. Header height matches body row height for the active density.
- **Selection mode** — `none` (browse-only, no checkbox column: telemetry/read-only lists like Traces) vs `multi-select` (checkbox column + bulk action bar). Never render a checkbox column with nothing to bulk-act on.
- **Sortable columns** — each column independently declares itself sortable or static; a table can mix both in the same header row.
- **Grouped rows** — an optional secondary sticky bar beneath the column header per group ("Building (4)", "Blocked (2)"), inspired by Linear's status-grouped issue list. Group bars sit at `--ds-gray-100` background, `text-label-13` `--ds-gray-900`, and stick independently of the column header when both are present (column header sticks first, group bar sticks just beneath it).
- **Sticky vs inline header** — sticky is the default whenever the table's body scrolls inside its own bounded container (`ScrollArea` or `overflow-y-auto` region); drop stickiness for a short table that fits one viewport and instead lets the whole page scroll past it, to avoid double sticky bars stacking on the page.
- **Responsive card collapse** — below the tablet breakpoint, the table's row structure is replaced by a stacked list of Cards, one per record (see Responsive behavior).

## States

| State                        | Trigger                                 | Tokens                                                                                                                                                                                                                                                                |
| ---------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Row default                  | resting                                 | background transparent (inherits container's `--ds-background-100`); text `--ds-gray-1000` (primary col) / `--ds-gray-900` (secondary/mono col); 1px bottom divider `--ds-gray-400`                                                                                   |
| Row hover                    | pointer over row                        | background `--ds-gray-100`; Dots Menu fades to `opacity: 1`; cursor `pointer` only if the row itself navigates                                                                                                                                                        |
| Row active/pressed           | mousedown on row                        | background `--ds-gray-200`                                                                                                                                                                                                                                            |
| Row selected                 | checkbox checked                        | background `--ds-ember-100`; 2px left accent bar `--ds-ember-600`; checkbox fill follows the checked token below. Hover on a selected row layers `--ds-gray-alpha-400` over the ember wash rather than swapping to plain gray, so selection stays visible under hover |
| Checkbox unchecked, enabled  | default                                 | box `--ds-background-100` fill, border `--ds-gray-700`                                                                                                                                                                                                                |
| Checkbox checked, enabled    | toggled on                              | fill + border `--ds-gray-1000` (per `checkbox.md`); a selected row's own ember wash is a separate signal layered underneath, the checkbox glyph itself stays neutral gray for contrast                                                                                |
| Checkbox hover (unchecked)   | pointer over box                        | background `--ds-gray-200`                                                                                                                                                                                                                                            |
| Row/checkbox focus-visible   | keyboard focus                          | `box-shadow: var(--ds-focus-ring)` (2px background + 2px `--ds-focus-color`, ember hue)                                                                                                                                                                               |
| Disabled row                 | record the viewer can't act on          | text dims to `--ds-gray-700`; checkbox (if present) `--ds-gray-100` bg / `--ds-gray-500` border, non-interactive; Dots Menu disabled entirely and paired with a Tooltip naming why                                                                                    |
| Sortable header, hover       | pointer over column label               | text `--ds-gray-1000`, chevron fades in at `--ds-gray-700`                                                                                                                                                                                                            |
| Sortable header, active sort | column is the current sort key          | chevron solid `--ds-gray-1000` (direction indicates asc/desc), label text `--ds-gray-1000`                                                                                                                                                                            |
| Loading                      | data in flight                          | header stays; body replaced by 5 to 8 skeleton rows matching the active density's row height, `--ds-gray-200` fill, pulse animation gated on `prefers-reduced-motion` (falls back to a static `--ds-gray-200` fill, no pulse)                                         |
| Empty (nothing created yet)  | zero records, no filter active          | rows replaced by an `EmptyState` composition inside the same container: icon (32px, `EmptyStateIcon` chip), `text-heading-16` title (Title Case), `text-copy-14` `--ds-gray-900` description, optional one primary + one secondary CTA                                |
| Empty (filtered to zero)     | zero records, a filter/search is active | same `EmptyState` shape, copy follows the exact template: `No {items} match "{query}". Clear the filter to see all.` Wrap the swap in `aria-live="polite"`                                                                                                            |
| Error                        | the fetch failed                        | rows replaced by an `Error` composition: specific title ("Couldn't load guardrail runs", never "Something went wrong"), message, a monospace request id inside a collapsed `<details>`, and a "Try again" button                                                      |

## Interaction model

**Pointer.** Clicking a row navigates to its detail view when the table is a browse list; clicking the checkbox toggles selection without triggering navigation (`stopPropagation`); clicking a sortable header cycles that column ascending → descending → unsorted and resets any other column's sort; clicking the Dots Menu opens the row's action menu; Shift+Click extends a selection range from the last-clicked row; Cmd/Ctrl+Click toggles a single row without clearing the rest of the selection.

**Keyboard — two tiers by interactivity:**

- **Static table** (no selection, no sortable columns, e.g. a small read-only summary): plain `<table>` semantics. Tab moves sequentially through whatever interactive elements exist inside cells (links, a lone action button), in DOM order. No custom key handling needed.
- **Data grid** (selection and/or sortable columns and/or a Dots Menu): follow the WAI-ARIA APG grid pattern with `role="grid"` on the table, `role="row"` on each row, `role="columnheader"` / `role="gridcell"` on cells, and roving `tabindex` (exactly one cell is `tabindex="0"` at a time; the rest are `-1`).
  - `Tab` / `Shift+Tab` — enter and leave the grid as a single stop (lands on the last-focused cell, or the first cell on first entry).
  - `Arrow Up` / `Arrow Down` — move the active cell one row up/down, same column.
  - `Arrow Left` / `Arrow Right` — move the active cell one column left/right.
  - `Home` / `End` — jump to the first/last cell in the current row.
  - `Ctrl+Home` / `Ctrl+End` — jump to the first/last cell in the whole grid.
  - `Space` — toggle the focused row's checkbox (data grid with selection).
  - `Enter` — activate the focused cell's primary control (open a link, open the Dots Menu, trigger the sort on a header cell).
  - `Shift+Arrow Up/Down` — extend a range selection from the last toggled row.
  - `Cmd/Ctrl+A` — select all currently loaded rows.
  - `Escape` — clear an open row menu, or clear the active cell's focus ring back to the row if a menu is open.

**Screen reader.** `aria-rowcount` / `aria-colcount` on the grid when the list is server-paginated, so assistive tech can announce "row 4 of 143" even though only 20 rows are in the DOM. Each sortable `columnheader` carries `aria-sort="ascending" | "descending" | "none"`. Selected rows carry `aria-selected="true"`. The bulk action bar's appearance and the live selection count are announced via a visually-hidden `aria-live="polite"` region ("3 rows selected"). The loading body carries `aria-busy="true"` with a visually-hidden "Loading rows" announcement at the point the skeleton mounts, not repeated per skeleton row.

**Motion.** All transitions use `--ds-motion-timing-swift`. Row background/border color changes (hover, active, selected) animate over roughly 150 to 200ms, in the same family as Button/Dots Menu's own interactive-surface transition. A sort chevron flips 180 degrees over 150ms on direction change (snaps instantly under `prefers-reduced-motion`, no rotation animation). The bulk action bar's appearance reuses the popover timing (`--ds-motion-popover-duration`, 200ms, swift easing) but animates opacity + a 4px vertical translate rather than the 0.96 scale reserved for floating popovers, since it's inline toolbar chrome, not an overlay. Newly appended rows (pagination "load more") may fade in over 150ms; skip that fade entirely under `prefers-reduced-motion` and just appear.

## Responsive behavior

- **Desktop (roughly ≥1024px).** Full column set, sticky header, comfortable density by default, all column types visible.
- **Tablet (roughly 768 to 1023px).** Drop the lowest-priority secondary columns first (fold them into the Dots Menu's row detail, or behind a "Columns" toggle in the toolbar) before shrinking anything. If the remaining columns still don't fit, wrap the table body in a horizontally scrolling region (the existing `ScrollArea` primitive) and pin the actions column to the right edge with an explicit `--ds-background-100` fill plus a 1px `--ds-gray-400` left divider, so scrolled content never bleeds through behind it.
- **Mobile (below roughly 768px).** Collapse rows into a stacked list of Cards (`material-small`, one record per Card): the primary text becomes the card's heading line (`text-label-14`, `--ds-gray-1000`); one or two secondary fields render as label/value pairs beneath (`text-copy-13`, `--ds-gray-900`); status renders as a Badge in the card's top-right corner; actions collapse to a single Dots Menu in the same corner (or a full-width row of up to two buttons only if there are two or fewer actions, per the >2-actions-becomes-menu rule). Selection checkboxes, when active, sit at the card's leading edge. Column headers disappear entirely in this view; sorting moves to a single "Sort by" trigger (a Select or small popover) placed above the list. Sticky header is dropped, since there is no header row to stick.

## Accessibility

- Use `role="grid"` with roving `tabindex` only when the table is genuinely interactive (sortable and/or selectable and/or per-row actions beyond a plain link); a purely informational table stays a native `<table>` to avoid over-complicating its semantics.
- Focus order: toolbar controls, then column headers left to right, then the first row's cells left to right (checkbox → text/mono/status/time columns → actions), then `Down Arrow` into subsequent rows, then the footer/pagination last.
- `--ds-gray-1000` primary text on `--ds-background-100` and `--ds-gray-900` secondary text both meet the accessible-contrast bar the Geist gray scale is built to (per the token source comment: scales are constructed for accessible text/icon contrast at the 900/1000 steps).
- Never let status color alone carry the signal: every Status Dot and every status Badge ships with a legible text label alongside it, per Badge's own best-practice guidance.
- A disabled row's checkbox or Dots Menu is always paired with a Tooltip that names the concrete reason it's unavailable, matching the disabled-control ↔ explaining-Tooltip contract pairing.
- `prefers-reduced-motion` disables the hover/active color-transition duration (treat as instant), skips the sort-chevron rotation (snap to the new direction), and skips the new-row fade-in (rows simply appear).

## Tokens used

| Token                                                                          | Used for                                                                                                                    |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `--ds-background-100`                                                          | Table container fill; pinned background behind a sticky actions column                                                      |
| `--ds-background-200`                                                          | Grouped-row section bar alternative fill (used sparingly, never as decorative zebra striping)                               |
| `--ds-gray-100`                                                                | Row hover background; checkbox unchecked-hover background; grouped-row section bar background                               |
| `--ds-gray-200`                                                                | Row active/pressed background; sortable-header active background; checkbox hover fill reference                             |
| `--ds-gray-300`                                                                | Stronger pressed-state reference on dense interactive header controls                                                       |
| `--ds-gray-400`                                                                | Row divider hairlines; header bottom border; sticky actions-column left divider                                             |
| `--ds-gray-500`                                                                | Disabled checkbox border                                                                                                    |
| `--ds-gray-600`                                                                | Disabled, checked checkbox fill                                                                                             |
| `--ds-gray-700`                                                                | Disabled row/cell text; disabled Dots Menu text; resting sort-chevron color                                                 |
| `--ds-gray-900`                                                                | Secondary/mono column text; time column text; column header label text; empty/error description text                        |
| `--ds-gray-1000`                                                               | Primary column text; checked checkbox fill; active sort-chevron/header text                                                 |
| `--ds-gray-alpha-400`                                                          | Hover wash layered over an already-selected (ember) row                                                                     |
| `--ds-ember-100`                                                               | Selected row background wash                                                                                                |
| `--ds-ember-600`                                                               | Selected row left accent bar                                                                                                |
| `--ds-focus-ring` / `--ds-focus-color` / `--ds-focus-ring-outline`             | Keyboard focus on rows, cells, checkboxes, header sort triggers, Dots Menu trigger                                          |
| `--ds-green-600/700/800/200/900`                                               | Status success (Dot solid / Badge solid `800` fill / Badge subtle `200` fill + `900` text)                                  |
| `--ds-red-*` (same step pattern)                                               | Status error                                                                                                                |
| `--ds-amber-*` (same step pattern)                                             | Status warning                                                                                                              |
| `--ds-blue-*` (same step pattern)                                              | Status informational                                                                                                        |
| `text-label-14`                                                                | Primary column text, comfortable/spacious density                                                                           |
| `text-label-13`                                                                | Secondary column text; compact-density primary column; column header labels                                                 |
| `text-label-12`                                                                | Compact-density secondary column text                                                                                       |
| `text-label-13-mono` / `text-label-12-mono`                                    | Mono column values (ids, slugs, paths, durations) at comfortable/compact density                                            |
| `text-copy-13` / `text-copy-14`                                                | Empty/error body copy; mobile card secondary field values                                                                   |
| `text-heading-16`                                                              | Empty-state / error title inside a contained (non-full-page) table region                                                   |
| `text-button-14`                                                               | Bulk action bar and empty-state CTA button labels                                                                           |
| `text-tabular`                                                                 | Any column with changing numeric values (durations, counts, timestamps)                                                     |
| `material-base` / `material-small`                                             | Table container elevation                                                                                                   |
| `material-menu`                                                                | Dots Menu / Context Menu popover surface                                                                                    |
| `material-tooltip`                                                             | Truncated-text tooltip; absolute-time tooltip; disabled-control explainer                                                   |
| `--ds-radius-small`                                                            | Table container corner radius (paired with `overflow: hidden`)                                                              |
| `--ds-size-small` / `--ds-size-medium` / `--ds-size-large`                     | Row height per density mode (compact/comfortable/spacious) and every inline control (checkbox hit area, pagination buttons) |
| `--geist-space` / `--geist-space-2x` / `--geist-space-3x` / `--geist-space-4x` | Cell horizontal/vertical padding per density mode                                                                           |
| `--geist-gap-quarter` / `--geist-gap-half` / `--geist-gap`                     | Toolbar and bulk-action-bar internal spacing                                                                                |
| `--ds-motion-timing-swift`                                                     | All row/header/menu transitions                                                                                             |
| `--ds-motion-popover-duration` / `--ds-motion-popover-timing`                  | Bulk action bar appearance; Dots Menu open/close                                                                            |
| `--ds-z-menu`                                                                  | Dots Menu / Context Menu popover stacking                                                                                   |
| `--ds-page-width`                                                              | Containing page's max width (the table itself stretches to its container)                                                   |

## Implementation guidance

- **Selection checkbox** — `@radix-ui/react-checkbox` (already a dependency) via the existing `src/components/ui/checkbox.tsx`. Retheme its default/hover/checked/disabled fills to the `--ds-gray-*` steps and `--ds-focus-ring` documented above. Note the DOM shape differs from Geist's own raw implementation described in `checkbox.md` (Radix drives state through `data-state="checked"|"unchecked"|"indeterminate"` on the control itself, not a hidden native input plus `peer-*` selectors) — target the same token values, not the same selector mechanism.
- **Sortable header trigger** — a plain unstyled `<button>` inside the `<th>`/`columnheader` cell; no dedicated Radix primitive is needed. Use a lucide `ChevronUp` / `ChevronDown` / `ChevronsUpDown` icon at 14px, colored per the States table above.
- **Row actions** — `@radix-ui/react-dropdown-menu` (already a dependency) via the existing `src/components/ui/dropdown-menu.tsx`, retheme the trigger to the Dots Menu spec (18px icon default, 32px square hit area, tertiary-fill family, `--ds-gray-100`/`--ds-gray-400` disabled tokens).
- **Optional right-click row actions** — `@radix-ui/react-context-menu` (already a dependency) via `src/components/ui/context-menu.tsx`, mirroring the exact same action set as the Dots Menu; never make the context menu the only way to reach an action.
- **Horizontal scroll / sticky actions column** — `@radix-ui/react-scroll-area` via `src/components/ui/scroll-area.tsx`.
- **Loading skeleton** — retheme `src/components/ui/skeleton.tsx` off its current pre-Tempo `bg-primary/10` class to `bg-[var(--ds-gray-200)]`, keep `animate-pulse` gated behind a `prefers-reduced-motion` check (swap to a static fill, no pulse, when the user has that preference set).
- **Empty / error states** — compose from the documented `EmptyState`/`EmptyStateIcon` and `Error` API shapes (see `research/empty-state.md`, `research/error.md`) once their Tempo-native implementations land in `src/components/ui/`; until then, hand-assemble the same shape (icon, title, description, optional CTA) inline rather than inventing a divergent structure.
- **Pagination** — retheme the existing `src/components/ui/pagination.tsx` (already shadcn-shaped) to consume the `--ds-*` tokens; each page control snaps to `--ds-size-small` (32px) by default in the footer row.
- **File placement** — keep the low-level primitives in the existing flat `src/components/ui/table.tsx` (Table/TableHeader/TableBody/TableRow/TableHead/TableCell). Build the composed data-grid pattern (density switcher, bulk action bar, sortable header cell, row-selection wiring) as a new `src/components/ui/data-table/` subfolder rather than duplicating table primitives per page.
- **State management** — no headless table library is installed (`@tanstack/react-table` is not a dependency). Keep sort/page/selection as local component state, or lift sort and page into the TanStack Query key (`queryKey: ['prds', { sort, page }]`) per the existing `src/lib/<domain>.functions.ts` ↔ route pairing convention. Do not add a new table library for this without a founder decision — the existing server-function + Query pattern already covers sort/paginate/filter for every list surface in the app.

## Usage examples

**1. PRDs list (`/prds`) — text + mono + status + time + selection + bulk actions**

```tsx
<div className="material-base overflow-hidden">
  <DataTableToolbar>
    <SearchInput placeholder="Search specs" />
    <DensitySwitcher value={density} onChange={setDensity} />
  </DataTableToolbar>

  {selectedIds.length > 0 && (
    <DataTableBulkBar count={selectedIds.length}>
      <Button variant="secondary" className="text-button-14">
        Archive
      </Button>
      <Button variant="tertiary" className="text-button-14">
        Export
      </Button>
    </DataTableBulkBar>
  )}

  <Table role="grid" aria-rowcount={total}>
    <TableHeader>
      <TableRow>
        <TableHead className="w-8">
          <Checkbox aria-label="Select all" />
        </TableHead>
        <SortableHead column="title">Title</SortableHead>
        <TableHead className="text-label-13 text-[var(--ds-gray-900)]">Owner</TableHead>
        <TableHead className="text-label-13 text-[var(--ds-gray-900)]">Status</TableHead>
        <SortableHead column="updatedAt">Updated</SortableHead>
        <TableHead aria-hidden />
      </TableRow>
    </TableHeader>
    <TableBody aria-busy={isLoading}>
      {prds.map((prd) => (
        <TableRow key={prd.id} aria-selected={selectedIds.includes(prd.id)}>
          <TableCell>
            <Checkbox aria-label={`Select ${prd.title}`} checked={selectedIds.includes(prd.id)} />
          </TableCell>
          <TableCell className="text-label-14 text-[var(--ds-gray-1000)]">{prd.title}</TableCell>
          <TableCell className="text-label-13 text-[var(--ds-gray-900)]">{prd.owner}</TableCell>
          <TableCell>
            <StatusBadge status={prd.status} />
          </TableCell>
          <TableCell
            className="text-label-13 text-[var(--ds-gray-900)] text-tabular"
            title={prd.updatedAtIso}
          >
            {prd.updatedAtRelative}
          </TableCell>
          <TableCell className="text-right">
            <DotsMenu
              items={[
                { label: "Open spec" },
                { label: "Duplicate spec" },
                { label: "Archive spec" },
              ]}
            />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>

  <DataTableFooter total={total} page={page} onPageChange={setPage} />
</div>
```

**2. Agent traces (`/traces`) — mono-heavy, read-only, no selection**

```tsx
<div className="material-base overflow-hidden">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead className="text-label-13 text-[var(--ds-gray-900)]">Run</TableHead>
        <TableHead className="text-label-13 text-[var(--ds-gray-900)]">Agent</TableHead>
        <TableHead className="text-label-13 text-[var(--ds-gray-900)]">Status</TableHead>
        <TableHead className="text-label-13 text-[var(--ds-gray-900)]">Duration</TableHead>
        <TableHead aria-hidden />
      </TableRow>
    </TableHeader>
    <TableBody>
      {traces.map((run) => (
        <TableRow key={run.id}>
          <TableCell className="text-label-13-mono text-[var(--ds-gray-900)]">
            {middleTruncate(run.id, 6, 4)}
          </TableCell>
          <TableCell className="text-label-14 text-[var(--ds-gray-1000)]">
            {run.agentName}
          </TableCell>
          <TableCell>
            <StatusDot status={run.status} label={run.statusLabel} />
          </TableCell>
          <TableCell className="text-label-13-mono text-tabular text-[var(--ds-gray-900)]">
            {run.durationMs}ms
          </TableCell>
          <TableCell className="text-right">
            <DotsMenu items={[{ label: "View trace" }, { label: "Copy run id" }]} />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</div>
```

**3. Guardrail violations (`/guardrails`) — severity status, bulk acknowledge, empty and error states**

```tsx
{
  error ? (
    <ErrorBlock
      title="Couldn't load guardrail runs"
      message={error.message}
      requestId={error.requestId}
      onRetry={refetch}
    />
  ) : violations.length === 0 ? (
    <EmptyState
      icon={<EmptyStateIcon icon={<ShieldCheck size={32} />} />}
      title="No violations right now"
      description="Guardrail checks are passing across every connected source."
    />
  ) : (
    <div className="material-base overflow-hidden">
      {selectedIds.length > 0 && (
        <DataTableBulkBar count={selectedIds.length}>
          <Button variant="default" className="text-button-14">
            Acknowledge selected
          </Button>
        </DataTableBulkBar>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8">
              <Checkbox aria-label="Select all" />
            </TableHead>
            <TableHead className="text-label-13 text-[var(--ds-gray-900)]">Rule</TableHead>
            <TableHead className="text-label-13 text-[var(--ds-gray-900)]">Severity</TableHead>
            <TableHead className="text-label-13 text-[var(--ds-gray-900)]">Detected</TableHead>
            <TableHead aria-hidden />
          </TableRow>
        </TableHeader>
        <TableBody>
          {violations.map((v) => (
            <TableRow key={v.id}>
              <TableCell>
                <Checkbox aria-label={`Select ${v.ruleName}`} />
              </TableCell>
              <TableCell className="text-label-14 text-[var(--ds-gray-1000)]">
                {v.ruleName}
              </TableCell>
              <TableCell>
                <Badge variant={v.severity === "high" ? "red" : "amber"} contrast="low">
                  {v.severityLabel}
                </Badge>
              </TableCell>
              <TableCell
                className="text-label-13 text-[var(--ds-gray-900)] text-tabular"
                title={v.detectedAtIso}
              >
                {v.detectedAtRelative}
              </TableCell>
              <TableCell className="text-right">
                <DotsMenu items={[{ label: "View details" }, { label: "Acknowledge" }]} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

## Do / Don't

**Do**

- Do map every density mode onto the 32/36/40 control-size ramp so a row's inline checkbox or button never breaks the height grid.
- Do keep the checkbox column absent entirely when a table has no bulk action to offer.
- Do use gray for all default/hover/border chrome, and reserve ember for the selected-row wash, its accent bar, and the focus ring only.
- Do pair every status signal with a legible text label; a colored dot or badge is never the only carrier of meaning.
- Do sticky the header only when the table's own body scrolls independently; skip it when a short table just scrolls with the page.
- Do collapse to stacked cards below the tablet breakpoint instead of shrinking text or force-fitting every column into a horizontal squeeze.
- Do gate every hover/active/sort/skeleton transition on `prefers-reduced-motion`.
- Do give a disabled row's checkbox or action menu a Tooltip that names the concrete reason.

**Don't**

- Don't zebra-stripe rows for decoration. Tonal variation must carry meaning; use the `--ds-gray-400` hairline divider instead.
- Don't stack two materials on the table container (for example `material-base` plus a hand-rolled extra border). Pick exactly one preset.
- Don't invent a new brand color for "selected." No blue, no purple: selection is ember's job under the color law.
- Don't make Context Menu (right-click) the only way to reach a row action; always expose the same action through the visible Dots Menu too.
- Don't replace the whole table with a spinner while loading. Use row-shaped skeletons so the layout doesn't jump once real data lands.
- Don't add a second personality touch on top of the ember selected-row accent. That accent is functional (a selection indicator), not decorative flourish, and it is the only touch this pattern is allowed.
- Don't write apologetic empty-state copy ("Oops, nothing here yet") or vague CTA labels ("Learn more") when a specific action exists ("View guardrail run"). No em or en dashes in any rendered UI string.
