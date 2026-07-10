# Grid

> "Display elements in a grid layout."

Source: https://vercel.com/geist/grid (Geist Design System). Package: `@vercel/geistcn/components`.

## Sections documented

1. **Grid (default)** — `grid-default`. A non-responsive grid with no cells: just the `Grid` guide lines rendered inside a `GridSystem`, no `GridCell` children. Demonstrates the bare guide mesh (columns x rows) with `debug` mode on and `height="preserve-aspect-ratio"`.
2. **Basic grid** — `grid-basic`. A non-responsive single grid with auto-flowing cell configuration: 6 `GridCell`s (labeled 1-6) auto-placed into a 3-column x 2-row grid, no explicit `column`/`row` props — cells just flow in document order.
3. **Solid cells** — `grid-solid`. Demonstrates the `solid` prop on `GridCell`: cells that span multiple grid tracks (e.g. `column="1/3"`) use `solid` to occlude/paint over the guide lines they overlap, versus a non-solid cell which lets guides show through.
4. **Responsive grid** — `grid-responsive`. `Grid` with responsive `rows` and `columns` object props (`{ sm, md, lg }`) so the same 6 auto-flowed cells reflow from 1 column (mobile) to 2 (tablet) to 3 (desktop).
5. **Responsive Grid with responsive guide clipping cells** — `grid-responsive-cells`. Same responsive breakpoint pattern as #4, but the individual `GridCell`s also take responsive `column`/`row` objects plus `solid`, so cell spans and guide-clipping change per breakpoint, not just the track count.
6. **Grid with hidden row guides** — `grid-hidden-row-guides`. `hideGuides="row"` on `Grid` removes the horizontal guide lines, leaving only vertical column guides visible.
7. **Grid with hidden column guides** — `grid-hidden-column-guides`. `hideGuides="column"` removes vertical guide lines, leaving only horizontal row guides visible.
8. **Grid with overlaying cells** — `grid-overlaying-cells`. Cells that overlay one another in various states across a 12-column x 3-row grid: mixes `solid` occluding cells, non-solid overlapping cells, and a long-text cell, showing z-ordering/overlap behavior.
9. **Specific Grid with Guide Clipping** — `grid-guide-clipping`. Guide clipping enabled on specific cells only (via `solid` on select cells in a 3x4 grid) rather than globally, showing how individual cells can locally occlude the guide mesh while others don't.
10. **Grid with cross** — `grid-with-cross`. Introduces `GridCross`, a marker component placed at explicit `column`/`row` intersections (the four corners of the visible grid) to mark guide intersections explicitly, alongside 6 auto-flowed `GridCell`s.
11. **Dashed grid with cross** — `grid-dashed-with-cross`. `dashedGuides` prop on `GridSystem` switches the guide line style to dashed; combined with 4 `GridCross` markers at the 4 corners of a single 1x1 cell and one `GridCell` ("Content here").
12. **Dashed grid with grid page** — `grid-dashed-with-grid-page`. Introduces `GridPage`, a wrapping component around `GridSystem` (rather than `GridSystem` used standalone/inline), for a full-page dashed-guide grid with the same cross-marker + single-cell composition as #11.

## API

Components: `GridSystem` (root/provider), `GridPage` (page-level wrapper around `GridSystem`), `Grid` (the guide mesh + auto-cell-flow container), `GridCell` (a cell placed within `Grid`), `GridCross` (a marker at a specific guide intersection).

All exported from `@vercel/geistcn/components`.

### `GridSystem` props (boolean/config, observed)
- `debug` — boolean. Turns on a debug rendering mode (seen paired with a guides-only, cell-less `Grid`).
- `guideWidth={number}` — numeric guide line thickness/weight (e.g. `1`).
- `unstable_useContainer` — boolean flag (unstable API) that switches the grid to container-query-based responsive sizing instead of viewport breakpoints. Present on nearly every demo except the two `GridPage`-wrapped / plain responsive-breakpoint demos.
- `dashedGuides` — boolean. Renders guides as dashed lines instead of solid.

### `GridPage`
- Wraps `GridSystem` for full-page-level grid usage (composition, no unique props observed beyond children).

### `Grid` props
- `columns={number}` — fixed column count (e.g. `3`, `5`, `12`).
- `columns={{ sm, md, lg }}` — responsive column counts per breakpoint object.
- `rows={number}` — fixed row count.
- `rows={{ sm, md, lg }}` — responsive row counts per breakpoint object.
- `height="preserve-aspect-ratio"` — sizes the grid's height to preserve a 1:1-ish aspect per cell/track rather than filling a container.
- `hideGuides="row" | "column"` — hides guides along one axis only (string enum, single-axis value).

### `GridCell` props
- `column={string | number}` — track placement. Accepts a single track index (`"1"`, `1`) or a span range string `"start/end"` (e.g. `"1/3"`, `"3/10"`, `"11/13"`, `"7/12"`, negative-index end supported: `"1/-1"`).
- `row={string | number}` — same shape as `column`, for the row axis.
- `column={{ sm, md, lg }}` / `row={{ sm, md, lg }}` — responsive per-breakpoint placement objects, values can mix bare numbers and span strings across breakpoints.
- `solid` — boolean. Paints an opaque fill so the cell occludes/clips the guide lines it overlaps; omit it to let guides render visibly through the cell.
- children — arbitrary content (numbers, short labels, or long paragraph text in the overlaying-cells demo).

### `GridCross` props
- `column={number}` — the column-guide index to mark.
- `row={number}` — the row-guide index to mark.
- No children; it's a point marker at a guide intersection, not a cell.

### Composition patterns (JSX usage)

Guides-only grid (no cells):
```tsx
import { Grid, GridSystem } from '@vercel/geistcn/components';

<GridSystem debug guideWidth={1} unstable_useContainer>
  <Grid columns={5} height="preserve-aspect-ratio" rows={2} />
</GridSystem>
```

Auto-flowing cells:
```tsx
import { Grid, GridSystem, GridCell } from '@vercel/geistcn/components';

<GridSystem guideWidth={1} unstable_useContainer>
  <Grid columns={3} rows={2}>
    <GridCell>1</GridCell>
    {/* ...up to 6 */}
  </Grid>
</GridSystem>
```

Explicit spans with guide occlusion:
```tsx
<GridSystem guideWidth={1} unstable_useContainer>
  <Grid columns={3} rows={2}>
    <GridCell column="1/3" row="1" solid>1 + 2</GridCell>
    <GridCell>3</GridCell>
    <GridCell>4</GridCell>
    <GridCell column="2/4" row="2" solid>5 + 6</GridCell>
  </Grid>
</GridSystem>
```

Responsive breakpoints on both `Grid` and `GridCell`:
```tsx
<GridSystem unstable_useContainer>
  <Grid columns={{ sm: 1, md: 2, lg: 3 }} rows={{ sm: 6, md: 3, lg: 2 }}>
    <GridCell
      column={{ sm: '1', md: '1/3' }}
      row={{ sm: '1/3', md: 1 }}
      solid
    >
      1 + 2
    </GridCell>
    {/* ... */}
  </Grid>
</GridSystem>
```

Single-axis guide hiding:
```tsx
<GridSystem unstable_useContainer>
  <Grid columns={12} height="preserve-aspect-ratio" hideGuides="row" rows={3} />
</GridSystem>
```
(and `hideGuides="column"` for the vertical-guide-hidden variant)

Cross markers at guide intersections:
```tsx
import { Grid, GridCell, GridCross, GridSystem } from '@vercel/geistcn/components';

<GridSystem guideWidth={1} unstable_useContainer>
  <Grid columns={3} rows={2}>
    <GridCross column={1} row={1} />
    <GridCross column={4} row={1} />
    <GridCross column={4} row={3} />
    <GridCross column={1} row={3} />
    <GridCell>1</GridCell>
    {/* ...up to 6 */}
  </Grid>
</GridSystem>
```

Dashed guides + `GridPage` full-page composition:
```tsx
import { Grid, GridCell, GridCross, GridPage, GridSystem } from '@vercel/geistcn/components';

<GridPage>
  <GridSystem dashedGuides guideWidth={1}>
    <Grid columns={1} rows={1}>
      <GridCross column={1} row={1} />
      <GridCross column={2} row={2} />
      <GridCross column={2} row={1} />
      <GridCross column={1} row={2} />
      <GridCell>Content here</GridCell>
    </Grid>
  </GridSystem>
</GridPage>
```

## Best practices

**When to use**
- Reach for `Grid` when you actually want the two-dimensional guide/cell structure to be a visible design element — marketing pages, docs landing pages, feature-breakdown sections where rule lines and cell borders read as intentional layout, not just spacing.
- For ordinary responsive content grids (card grids, list layouts) where the guide lines wouldn't be shown, skip `Grid` and use plain Tailwind `grid grid-cols-*` utilities — `Grid` is overkill without visible guides.
- Avoid stacking `Grid` inside `Grid` more than one level deep; overlapping guide meshes read as noise and break the cell-span math.

**Behavior**
- Always define `columns` and `rows` for all three breakpoints (`sm`/`md`/`lg`) so cell placement reflows predictably rather than jumping unpredictably between device sizes.
- Apply `solid` to any `GridCell` that needs an opaque background over the guides beneath it; without `solid`, guides show through the cell by default.
- Only hide row or column guides when removing them genuinely clarifies the layout (e.g. a single-axis hero band); if you find yourself hiding both axes, that's a signal to drop down to a plain Tailwind grid instead.

**Accessibility**
- Guides are purely decorative — hide them from assistive tech with `aria-hidden="true"` and keep all real semantics on the cell content itself.
- If cells become interactive/tappable, give each one its own visible focus ring and make sure tab order follows reading order, not DOM/z-order.
- Verify guide-line contrast in both light and dark themes; the shipped default tokens are tuned for this, but any custom guide color can slip under the 3:1 minimum contrast ratio.

## Design notes

- No CSS custom-property tokens (`--ds-*`), `material-*` classes, or other design tokens were exposed in the page's rendered markup or flight payload — the guide/cell rendering (line weight, color, dash pattern) is implemented inside the `@vercel/geistcn` package itself, not inlined in this doc page. Only structural class hooks were visible: `component-preview` (wraps each demo block) and `line` (per code-line span in the syntax-highlighted snippet blocks).
- `guideWidth` is a plain numeric prop (pixel-like weight, e.g. `1`) controlling guide line thickness — no other numeric scale exposed.
- `unstable_useContainer` is explicitly named as an unstable API — it swaps the grid's responsive strategy from viewport breakpoints to container queries; used in 9 of the 12 demos (all except the two `hideGuides` demos' surrounding context differs only by that flag being present too, and the two `GridPage`-wrapped demos which render full-page rather than container-scoped).
- `height="preserve-aspect-ratio"` is a string-literal enum value (only one value observed) that ties grid height to its column/row aspect instead of stretching to fill a parent.
- `hideGuides` is a two-value string enum: `"row"` | `"column"` — no `"both"`/`"all"` value was demonstrated (best-practices text explicitly says hiding both axes means you should use a plain grid instead, implying the component intentionally doesn't offer a combined-hide shorthand).
- `column`/`row` span syntax mirrors CSS grid line syntax as a string: `"start/end"` (1-indexed), and supports the CSS grid negative-index convention for "last line" (`"1/-1"` seen spanning full height in the overlaying-cells demo).
- `dashedGuides` toggles solid-line guides to a dashed style; demonstrated only in the two final "cross" demos alongside `GridCross` markers, suggesting dashed guides are the intended pairing when marking explicit intersections rather than dense cell layouts.
- `GridCross` is a zero-content point marker (`column`, `row` numeric props only) used to explicitly flag the 4 corner intersections of a 1x1 grid in the last two demos — distinct from `GridCell`, which always has visible children and participates in cell layout/solid-fill.
- `GridPage` only appears in the very last demo, wrapping `GridSystem` (rather than `GridSystem` being used top-level as in all other demos) — implying `GridPage` is the recommended root wrapper specifically for full-page-scoped grid usage, while bare `GridSystem` suffices for inline/component-scoped demos.
- No explicit motion/transition behavior was described anywhere in the prose or code for this component — Grid appears to be a static layout primitive with no animated states.
