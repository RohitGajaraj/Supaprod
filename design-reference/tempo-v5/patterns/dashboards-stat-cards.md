# Dashboards & stat cards

> A dashboard is a row of numbers a person can trust at a glance, plus the charts that back
> them up when a number needs explaining. This pattern defines the stat tile, the grid that
> holds a row of them, the chart card that sits underneath, and the shared filter row that
> keeps every number on the same time slice.
>
> Extension — base: Card, Description, Context Card, the `--ds-*` color/typography/materials
> tokens · inspiration: Stripe overview, Vercel analytics (principles only, re-derived below,
> never their markup or copy).

## Anatomy — the parts, named, with layout relationships

A dashboard section has three tiers, always in this order top to bottom: **filter row** →
**stat tile grid** → **chart cards**. All three share one time slice; nothing scopes itself.

```
┌ filter row ─────────────────────────────────────────────────────────────┐
│  [ Last 30 days ▾ ]                              (left-aligned, alone)  │
└───────────────────────────────────────────────────────────────────────┘

┌ stat tile grid — geist-gap (24px) between tiles ─────────────────────────┐
│ ┌─ stat tile ──────────┐ ┌─ stat tile ──────────┐ ┌─ stat tile ────────┐│
│ │ Active workspaces  ⓘ │ │ Agent runs           │ │ Spend this period  ││
│ │                      │ │                      │ │                    ││
│ │ 1,284                │ │ 12.9K        ▲ 8.1%   │ │ $4.2M      ▼ 2.4%  ││
│ │                      │ │ ▁▂▃▅▆▇█▇█▆▇▇          │ │ ▂▂▃▃▄▅▆▆▇█▇▇        ││
│ └──────────────────────┘ └──────────────────────┘ └────────────────────┘│
└───────────────────────────────────────────────────────────────────────┘

┌ chart card — geist-gap-section (32px) below the grid ───────────────────┐
│  Runs over time                                    [ Last 30 days ▾ ]   │  <- header row
│  ─────────────────────────────────────────────────────────────────────  │
│  │                                                                       │
│  │     ╱╲          ╱╲╲                                                  │  <- plot area
│  │  ╱╲╱  ╲    ╱╲  ╱   ╲                                                 │
│  │ ╱      ╲__╱  ╲╱                                                      │
│  └───────────────────────────────────────────────────────────────────── │
│  ■ Builds  ■ Reviews  ■ Deploys  ■ Rollbacks       (legend, ≥2 series)   │
└───────────────────────────────────────────────────────────────────────┘
```

**Stat tile parts** (top to bottom, left to right within a row):

- **Label** — the metric's name, sentence case, no trailing colon. Sits in the tile's header
  row, paired optionally with:
  - an **info affordance** (14px lucide `Info`, gray-800) that opens a one-sentence
    clarification on hover/focus — this is a `Tooltip` for a single plain sentence, or a
    `ContextCardTrigger` when the clarification needs 2 to 4 metadata rows (per
    `context-card.md`'s own scope rule: one line of "why" stays a Tooltip, structured
    metadata is a Context Card);
  - an optional **overflow affordance** (dots menu) only when the tile has more than one
    secondary action (export this metric, change its comparison period) — a single action
    goes inline as a tertiary link instead of a menu.
- **Value** — the headline number, Sans semibold, auto-compact (`1,284` / `12.9K` / `$4.2M`),
  set in proportional figures (never `text-tabular` at this size — see Tokens and Do/Don't).
- **Delta** (optional) — a signed comparison against a named prior period (`+8.1%`, not a bare
  `8.1%`), paired with a direction icon (`ArrowUp`/`ArrowDown`, 12px) and colored by
  direction crossed with whether up is good for that metric (see States).
- **Trend** (optional) — a 12-point sparkline, no axes, no gridlines, the closed history in
  the de-emphasis gray and the still-open current period in the metric's own accent (see
  Variants and Interaction model).
- **Meter** (optional, replaces Trend on goal-attainment tiles) — a single horizontal track
  showing progress toward a named target (budget consumed, quota used).

The whole tile sits on a `Card`-shaped surface (`border` + `shadow`, matching the "elevated"
pairing `card.md` always demonstrates them together). Treat label + value as one
`Description`-shaped `<dt>`/`<dd>` pair (per `description.md`'s own DOM contract) and hang
delta/trend off the same `<dd>` as additional content, so a screen reader still announces one
coherent key/value unit, not four disconnected fragments.

**Stat tile grid**: a CSS grid, `--geist-gap` (24px) between tiles both axes, tiles equal
width, no more than 4 to 6 tiles per row before they demote to a compact list (see Variants).
One tile may be a **hero figure** — the single number the dashboard leads with, set larger
(`text-heading-48` or `56`) than its siblings, at most once per view.

**Chart card**: a `Card` (`border` + `shadow`) with a header row (chart title, `text-label-14`
`strong` or `text-heading-14`, left; an optional per-chart time-range override, right — only
when this one chart legitimately needs a different slice than the rest of the page, which
should be rare, see Interaction model), a plot area built to the `dataviz` skill's mark specs
(thin marks, 2px surface gaps, hairline gray gridlines), and a legend row when the chart plots
two or more series.

**Filter row**: one row, left-aligned, above the grid and every chart card it scopes. Leads
with the time-range picker; additional dimension filters (workspace, agent, surface) sit to
its right in the same row. Never per-chart, never inside a chart card, unless that chart is
deliberately showing a different slice (then it gets its own visually distinct filter row
inside its own card, so the exception reads as intentional).

## Variants — every sanctioned variant and when to use each

| Variant | When to use |
| --- | --- |
| **Simple stat tile** (label + value only) | A metric with no meaningful comparison period yet (a brand-new metric, a lifetime total) or where a delta would be noise. |
| **Stat tile with delta** | Any metric a viewer will ask "is this good or bad compared to before" — the default for periodic dashboards. |
| **Stat tile with trend** | A metric whose shape over the period matters as much as its current value (spend, usage, error rate) — add the 12-point sparkline. |
| **Stat tile with meter** | A metric measured against a fixed target (budget cap, seat quota, guardrail threshold) — replace the sparkline with a Meter; keep the delta only if the target itself changed period over period. |
| **Drill-in stat tile** | The metric has a real detail view (a breakdown table, a per-item list) worth navigating to. Wrap the tile in a real link (see Interaction model), add `hoverable`, and end the value row with a 14px chevron. Never make a tile look clickable without a destination. |
| **Hero figure** | The one number the whole dashboard is organized around (this period's total spend, this month's shipped missions). Exactly one per view, sized up, always first in reading order. |
| **Compact stat row** | Secondary metrics that do not deserve their own tile — render as a dense `Description` list (2 to 4 `Label: value` rows) inside a lower-priority card or a chart card's own header, instead of spawning more tiles that push the primary row below the fold. |
| **Line/area chart card** | Trend over time, one or more series. Area fill only as a ~10% wash under a line, never a solid block competing with the line itself. |
| **Bar/column chart card** | Comparison across a small number of categories at one point in time, or a stacked breakdown of one total. |
| **Multi-series chart card with legend + filter** | Two to four named series sharing one chart; the legend doubles as a toggle so a viewer can isolate one series without leaving the card. |
| **Drill-in chart card** | Clicking a mark opens a `ContextCardTrigger` preview (entity name, one identifying line, 2 to 4 metadata rows, one primary action) before committing to full navigation — never a bare click straight to a new page with no preview, and never a destructive action reachable from that preview. |

## States — default/hover/active/focus/disabled/loading/empty/error

All values below apply to both themes by token name; the resolved hex differs per theme
automatically because the tokens do.

| State | Applies to | Tokens |
| --- | --- | --- |
| **Default** | Static (non-drill-in) tile/card | Surface via `material-small` (`background: var(--ds-background-100)`, `box-shadow: var(--ds-shadow-border-small)`); label `text-label-13` on `--ds-gray-900`; value `text-heading-32`/`40` on `--ds-gray-1000`. |
| **Default (interactive)** | Drill-in tile | Same surface, but its own fill rides the component-background role instead of the plain page fill: `--ds-gray-100` (dark) / `--ds-gray-100` (light) so there is a wash to lift from on hover. Border `--ds-gray-400`. |
| **Hover** | Drill-in tile, chart mark, legend swatch, filter row control | Tile fill steps `--ds-gray-100` → `--ds-gray-200`; border `--ds-gray-400` → `--ds-gray-500`; a material-tier shadow bump is not needed, the fill/border step is enough. Chart mark: slight lighten via the mark's own hue one step up its ramp, per `dataviz`'s "the hovered mark lifts." |
| **Active (pressed)** | Drill-in tile, filter row control | Fill `--ds-gray-300`; border `--ds-gray-600`. |
| **Focus** | Any keyboard-reachable element (drill-in tile as one stop, time-range trigger, legend toggle, "view as table" link) | `--ds-focus-ring` (2px background ring + 2px ember ring). Never removed, never replaced with a color-only outline. |
| **Disabled / not connected** | A tile whose data source has not been connected yet | Value slot replaced by a plain-words instruction ("Connect a source to see this metric"), text `--ds-gray-700`; no hover state; the tile is not a link. Pairs with a single secondary Button ("Connect"), never the tile itself pretending to be clickable. |
| **Loading** | Any tile/chart while its query is in flight (first load, not a refetch) | Value/label/sparkline replaced by rounded-rect placeholders in `--ds-gray-200` (dark) / `--ds-gray-200` (light), sized to the real content's box so nothing reflows when data arrives. A gentle opacity pulse using `--ds-motion-timing-swift` is optional and must fall back to a static block under `prefers-reduced-motion`. |
| **Loading (refetch)** | A tile/chart re-querying after a filter change | The previous render stays on screen at reduced opacity (~60%) — no skeleton, no layout jump, no flash — until the new data resolves, per `dataviz`'s refetch rule. |
| **Empty** | A metric that legitimately has no data yet for the selected range | An instruction, not an apology ("No runs in this period yet"), `text-copy-14` `--ds-gray-900`. At most one small geometric illustration per whole dashboard (identity layer budget), never one per tile. |
| **Error** | The query failed | Value slot replaced by "Couldn't load this metric" (`text-label-13`, `--ds-gray-900`) plus a tertiary "Try again" control (32px, small); do not recolor the tile border red — the failure is communicated in text and the retry affordance, not by alarming the whole card. |

## Interaction model — pointer, keyboard, screen-reader, motion

**Pointer**

- A drill-in tile is one hit target (the whole card), not three (label, value, chevron
  separately) — hovering anywhere on it lifts the tile and shows the pointer as a link cursor.
- Chart marks follow `dataviz`'s interaction spec: a crosshair tracks the pointer on line/area
  charts and snaps to the nearest X; bars, columns, and cells are each their own hit target
  with a `pointermove`/hover tooltip. The tooltip's value is the strong element, the series
  name secondary.
- A legend swatch is clickable: it toggles that series on the chart it belongs to. It never
  repaints the remaining series a different hue when one is hidden — the fixed categorical
  order is per-series-identity, not per-visible-slot.
- Clicking a chart mark on a drill-in chart card opens a `ContextCardTrigger`-style preview
  first (per `context-card.md`'s own behavior spec: opens on hover or focus with a ~150ms
  delay, one primary action, never a destructive one); its single primary action is what
  navigates onward.

**Keyboard** (full map)

| Key | Where | Effect |
| --- | --- | --- |
| `Tab` / `Shift+Tab` | Page | Moves between: filter row controls → each stat tile (one stop per tile, whether or not it is a link) → "view as table" link (if the chart card has one) → each chart's focusable mark proxies → legend toggles → next chart card. |
| `Enter` / `Space` | A drill-in tile, a legend toggle, a menu trigger | Activates it (navigates, toggles the series, opens the menu). |
| `Arrow Left` / `Arrow Right` | Focus inside a chart's mark proxies | Moves focus to the previous/next data point, revealing the same tooltip shown on hover (per `dataviz`: same details on focus as on hover). |
| `Arrow Down` / `Arrow Up` | Open time-range menu | Moves through preset rows. |
| `Home` / `End` | Open time-range menu | Jumps to the first/last preset row. |
| `Escape` | Any open menu, popover, or context-card preview | Closes it and returns focus to its trigger. |

**Screen reader**

- A stat tile announces as one definition-list entry: label, then value, then delta read as a
  full sentence ("Agent runs: 12.9 thousand, up 8.1 percent from the prior 30 days") — not as
  three separately-tabbed fragments.
- A chart exposes an `aria-label` (or `aria-describedby`) summarizing the shape in words
  ("Line chart of agent runs over the last 30 days, trending up") plus a genuinely reachable
  **table view** toggle so every plotted value is available without hovering or sight-reading
  a curve.
- The info affordance's tooltip/context-card content is reachable via the same focus path as
  its trigger, per `context-card.md`'s own accessibility rule.

**Motion**

- Tile hover/lift and menu/context-card open use `--ds-motion-timing-swift`
  (`cubic-bezier(.175,.885,.32,1.1)`).
- The time-range popover and any context-card preview use `--ds-motion-popover-duration`
  (200ms); a full drawer fallback on mobile uses `--ds-motion-overlay-duration` (300ms,
  scale from `--ds-motion-overlay-scale` 0.96).
- Everything above is gated on `prefers-reduced-motion`: skip the hover lift's transform, the
  skeleton pulse, and the overlay's scale-in, keeping only the opacity/position end state.

## Responsive behavior — desktop/tablet/mobile

- **Desktop** (roughly ≥1024px): stat tile grid at up to 4 to 6 columns; chart cards can sit
  two-up for related pairs or full-width for a primary trend; the filter row stays inline,
  time-range trigger and any secondary dimension filters in one row.
- **Tablet** (roughly 768 to 1023px): stat tile grid drops to 2 columns (wrapping a 4-tile row
  into two rows); chart cards go full-width, one per row; the time-range trigger may lose its
  text label down to an icon-only 36px button if the row is tight, but keeps its `aria-label`.
- **Mobile** (roughly <768px): stat tile grid collapses to a single column, tiles stacked in
  priority order (hero figure first); chart cards stay full-width; the time-range picker's
  popover becomes a bottom-sheet `Drawer` (read `drawer.md` before building this fallback)
  instead of a small anchored popover, since a thumb needs a bigger, list-shaped target than a
  desktop popover gives it; chart tooltips switch from hover to tap-to-reveal (tap again or tap
  elsewhere to dismiss), and the Y-axis thins its tick labels rather than shrinking their text.

## Accessibility — roles/aria, focus order, contrast, reduced motion

- **Roles**: a static stat tile is a plain `<dl>`/`<dt>`/`<dd>` pair (per `description.md`);
  a drill-in tile is that same pair wrapped in a real `<a>` (a router `Link`, not a `<div
  onClick>`) so it has native link semantics, is reachable by "jump to links," and supports
  cmd/ctrl-click and middle-click open-in-new-tab for free. A chart's plot area takes
  `role="img"` with a descriptive `aria-label`; its accompanying table view is a real
  `<table>`, not a styled grid of `<div>`s.
- **Focus order** follows the reading order in the anatomy sketch: filter row, then each stat
  tile left to right/top to bottom, then each chart card's own controls (time-range override
  if present, "view as table," then its marks), then its legend.
- **Contrast**: value text (`--ds-gray-1000`) and label text (`--ds-gray-900`) both clear body
  text contrast against `--ds-background-100` in both themes by construction (they are the
  system's own text-role steps). Chart mark colors are validated separately — see Tokens used
  below for the exact checked values; a chart that ships a fifth or later ad hoc hue without
  re-running the validator is a contract violation, not a style choice.
- **Reduced motion**: every transform/scale/pulse above degrades to an instant state change;
  color and text changes (hover fill step, focus ring) still apply since they carry no motion.

## Tokens used

| Token / class | Role in this pattern |
| --- | --- |
| `--ds-background-100` | Page fill and the default (non-interactive) tile/card surface. |
| `--ds-gray-100` / `-200` / `-300` | Interactive tile fill: default / hover / active. |
| `--ds-gray-400` / `-500` / `-600` | Interactive tile border: default / hover / active. |
| `--ds-gray-700` | Disabled/not-connected tile text. |
| `--ds-gray-800` | Info-affordance icon color. |
| `--ds-gray-900` | Label text, delta series-name text, empty/error message text. |
| `--ds-gray-1000` | Value text, primary body text. |
| `--ds-gray-alpha-100`…`900` | Optional overlay washes where layering over an unknown chart background (e.g. a hovered mark's lighten). |
| `--ds-green-700`/`800`/`900` | Delta color when the direction is good for that metric. |
| `--ds-red-700`/`800`/`900` | Delta color when the direction is bad for that metric; error-state icon. |
| `--ds-amber-700`/`800` | Meter fill nearing its cap (warning zone), never a chart series color. |
| `--ds-teal-700` | Categorical slot 1 (light: `#00a694`, dark: `#00a794`) and the default single-hue sequential ramp. Validated with `dataviz`'s `validate_palette.js`: PASS on lightness band, chroma floor, adjacent-pair CVD, and contrast vs. `--ds-background-100`/`#fff` in both modes. |
| `--ds-purple-700` | Categorical slot 2 (light `#9f00f4`, dark `#9440d5`). Same validation pass. |
| `--ds-pink-700` | Categorical slot 3 (light `#f22782`, dark `#f12b82`). Same validation pass; also the "positive" pole of a diverging pair. |
| `--ds-blue-700` | Categorical slot 4 (light `#0070f7`, dark `#0071f6`). Same validation pass; also the "negative" pole of a diverging pair. **Known weak axis**: slot 2 (purple) and slot 4 (blue) are not adjacent in the fixed order and pass together there, but fail a non-adjacent (`--pairs all`) check under deuteranopia in light mode — see Do/Don't. |
| `--ds-focus-ring` | Focus state on every interactive element in this pattern. |
| `--ds-shadow-border-small` / `.material-small` | Stat tile and chart card surface (radius + border + shadow preset). |
| `--ds-radius-medium` / `.material-menu` | Time-range popover and any context-card preview shell. |
| `--ds-motion-timing-swift` | Hover lift, popover/context-card open easing. |
| `--ds-motion-popover-duration` / `--ds-motion-overlay-duration` / `--ds-motion-overlay-scale` | Popover timing; mobile drawer fallback timing. |
| `--ds-size-medium` (36px) | Time-range trigger, retry button, any inline control in the filter row. |
| `--ds-popover-padding` / `-row-height` / `-row-radius` / `-row-padding` | Time-range preset list anatomy. |
| `--geist-gap` (24px) | Gap between stat tiles, both axes. |
| `--geist-gap-section` (32px) | Gap between the stat tile grid and the chart cards below it. |
| `--geist-space-4x` (16px) | Card internal padding (`p-4`, matching `card.md`'s own examples). |
| `--geist-space-2x` (8px) | Vertical rhythm between a tile's label/value/delta/trend rows. |
| `--ds-page-width` (1400px) | Outer content width the whole dashboard section sits inside. |
| `.text-heading-48` / `56` | Hero figure value. |
| `.text-heading-32` / `40` | Standard stat tile value. |
| `.text-heading-14` / `.text-label-14` (strong) | Chart card title. |
| `.text-label-13` | Stat tile label, delta text. |
| `.text-label-12` | Axis tick labels, legend labels. |
| `.text-copy-14` / `13` | Empty/loading/error messages, table-view cell text. |
| `.text-tabular` | Table-view and axis-tick numbers only — never the stat tile's own headline value (see Do/Don't). |

## Implementation guidance

- **Radix primitive mapping**: time-range picker on `@radix-ui/react-popover` (or the same
  primitive backing Geist's `Combobox`/`Command Menu` if the preset list should be filterable)
  with an internal listbox; drill-in chart preview on `@radix-ui/react-hover-card` (Context
  Card's own underlying primitive per its documented open/close behavior); the mobile
  time-range fallback on `@radix-ui/react-dialog` via the existing `Drawer` wrapper; tooltips
  on `@radix-ui/react-tooltip`. The stat tile itself needs no Radix primitive when static (it's
  a `<dl>`) and needs only a router `Link` when it is a drill-in tile.
- **shadcn/ui structure**: mirror the existing `src/components/ui/` file-per-primitive
  convention. Concretely:
  - `src/components/ui/stat-tile.tsx` — the `<dl>`/`<dt>`/`<dd>` tile with `label`, `value`,
    optional `delta`, optional `trend` or `meter`, optional `href` (switches it to the
    drill-in variant).
  - `src/components/ui/stat-grid.tsx` — a thin grid wrapper applying the `--geist-gap` rhythm
    and the 4/2/1-column responsive collapse, so no screen hand-rolls its own grid classes.
  - `src/components/ui/chart-card.tsx` — `Card` + header row (title, optional per-chart
    time-range slot) + a `ChartContainer` body (reuse the existing `src/components/ui/chart.tsx`
    Recharts wrapper) + legend row.
  - `src/components/ui/time-range-picker.tsx` — the shared filter-row control; on mobile it
    renders through the existing `Drawer` primitive instead of its own popover.
  - `src/components/ui/sparkline.tsx` — a tiny axis-less `LineChart` for the tile trend, built
    on the same Recharts wrapper as `chart-card.tsx` so both share one theming path.
  - **Retool, don't recreate, the Meter**: `src/components/ui/progress.tsx` already wraps
    `@radix-ui/react-progress` but still styles itself with the pre-Tempo `bg-primary` utility.
    Extend it (or add a `meter` variant) so its track and fill consume `--ds-gray-*`/status
    tokens per the States table above, rather than starting a second progress component.
- **Feeding the categorical colors into the chart wrapper**: `src/components/ui/chart.tsx`'s
  `ChartConfig` accepts a `color` per series key. Point each series at the same token the
  project's Tailwind config already maps to (matching `card.md`'s own examples, which use
  plain `text-gray-900` rather than raw `var(--ds-gray-900)`) — e.g. `color: "var(--ds-teal-700)"`
  for slot 1. Because the token itself already resolves per `[data-theme]`, no separate
  light/dark entry in `ChartConfig`'s `theme` object is needed.
- **Composition with existing Cadence code**: follow the two-file lockstep convention — a
  dashboard route (e.g. `src/routes/_authenticated.analytics.tsx`) pulls its stat/chart data
  through a matching `src/lib/<domain>.functions.ts` server function via `useQuery`, keyed so a
  filter-row change invalidates every stat tile and chart card in one re-render (the shared
  slice, per the Anatomy section). Do not give an individual `StatTile` its own independent
  query for the same metric another tile on the same screen already fetches.

## Usage examples

**1. Analytics overview (`/analytics`) — KPI row with a hero figure, feeding a trend chart**

```tsx
<StatGrid>
  <StatTile
    label="Spend this period"
    value="$4.2M"
    delta={{ direction: "down", value: "2.4%", good: true }}
    hero
  />
  <StatTile
    label="Active workspaces"
    value="1,284"
  />
  <StatTile
    label="Agent runs"
    value="12.9K"
    delta={{ direction: "up", value: "8.1%", good: true }}
    trend={runsTrend}
  />
  <StatTile
    label="Guardrail blocks"
    value="37"
    delta={{ direction: "up", value: "3", good: false }}
  />
</StatGrid>

<ChartCard title="Runs over time">
  <TimeRangePicker value={range} onChange={setRange} />
  <ChartContainer config={runsChartConfig}>
    <LineChart data={runsSeries}>
      <CartesianGrid vertical={false} stroke="var(--ds-gray-400)" />
      <Line dataKey="builds" stroke="var(--ds-teal-700)" strokeWidth={2} dot={false} />
      <Line dataKey="reviews" stroke="var(--ds-purple-700)" strokeWidth={2} dot={false} />
      <Line dataKey="deploys" stroke="var(--ds-pink-700)" strokeWidth={2} dot={false} />
      <Line dataKey="rollbacks" stroke="var(--ds-blue-700)" strokeWidth={2} dot={false} />
    </LineChart>
  </ChartContainer>
</ChartCard>
```

**2. Admin AI costs (`/admin/ai-costs`) — drill-in stat tiles into a per-surface breakdown**

```tsx
<StatGrid>
  {surfaces.map((s) => (
    <StatTile
      key={s.id}
      label={s.name}
      value={formatCurrency(s.spend)}
      delta={{ direction: s.trendDirection, value: s.trendPct, good: false }}
      href={`/admin/ai-costs/${s.id}`}
    />
  ))}
</StatGrid>
```

Each tile renders as a real link; hovering lifts the whole card (`--ds-gray-100` →
`--ds-gray-200`), and the value's own delta stays red/green by direction, never by the
tile's own categorical slot (spend per surface is a status judgment, not series identity).

**3. Budgets (`/budgets`) — a meter tile for quota consumption**

```tsx
<StatTile
  label="Monthly build budget"
  value="$8,400 of $12,000"
>
  <Meter value={70} warningAt={85} criticalAt={100} />
</StatTile>
```

The Meter's track is a lighter step of the same ramp as its fill (per `dataviz`'s meter
spec), stepping from `--ds-gray-*` (healthy) through `--ds-amber-700` (warning zone) to
`--ds-red-700` (over budget) as `value` crosses each threshold — never through the
categorical teal/purple/pink/blue order, which has no "this is bad" meaning to lend.

## Do / Don't

**Do**

- Keep the categorical order fixed: teal → purple → pink → blue, slot 1 through 4, never
  reassigned when a legend filter changes which series are visible.
- Compose every stat tile's label/value pair on `Description`'s own `<dl>`/`<dt>`/`<dd>`
  contract; add delta/trend as extra content inside the same `<dd>`.
- Reserve green/red/amber for status meaning only (delta direction, meter zones, guardrail
  health) — never as a chart's series-identity color.
- Run `validate_palette.js` before shipping any new chart color order, and again with
  `--pairs all` before using these hues on a scatter, bubble, or small-multiples layout.
- Keep exactly one hero figure per dashboard, and keep every stat tile's headline value in
  proportional figures — save `text-tabular` for table cells and axis ticks.
- Let one time-range picker scope every tile and chart beneath it; give a single chart its
  own override only when it is genuinely showing a different slice.
- Gate every hover lift, skeleton pulse, and overlay scale-in on `prefers-reduced-motion`.

**Don't**

- Don't spend the brand's one ember accent on a data series — ember is the CTA/selection/
  focus color; a "series 4" in ember breaks both the one-ember-per-view law and the reserved-
  status-color law in the same stroke.
- Don't ship a dual-axis chart (two y-scales on one plot) to fit two differently-scaled
  metrics onto one card — split into two charts, small multiples, or index both to a common
  base instead.
- Don't treat purple and blue as safe neighbors once a filter could leave them as the only
  two visible series: they pass the adjacent-pair check in the fixed order but fail a
  non-adjacent check under deuteranopia in light mode. If a legend toggle can strand those
  two alone, add a direct label or a texture fill as the mandatory relief, don't rely on hue.
- Don't label every point on a sparkline or trend line — only the endpoint or the one value
  the tile is about; a number crowding every pixel goes unread.
- Don't give every tile in a KPI row its own empty-state illustration; the identity layer's
  one-composition-per-surface budget covers the whole dashboard, not each tile.
- Don't hide a value behind hover-only: every stat and every chart mark must also reach a
  screen reader and a keyboard user through focus, and every chart needs a real table view
  underneath it.
- Don't build a card's chrome by hand (a one-off border + shadow + radius combination) —
  every stat tile and chart card is a `material-small` surface, full stop.
