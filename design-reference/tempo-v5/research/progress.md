# Progress

> "Display progress relative to a limit or related to a task."

## Sections documented

- **Default** — a bare `<Progress value={30} />` with no other props; establishes the default `max` of 100 and default styling (foreground-colored fill, default height/width).
- **Custom max** — `<Progress max={40} value={30} />`; shows the bar computes percentage from `value / max` rather than assuming a 0-100 scale.
- **Dynamic colors** — an interactive demo (`useState`) with Increase/Decrease buttons driving `value` from 0-100 in steps of 10, paired with a `colors` prop that maps numeric thresholds to CSS color tokens so the fill recolors live as the value crosses each breakpoint.
- **Themed** (page nav labels it "Types" in prose, but the on-page group heading is effectively themed variants) — four stacked bars using the `type` prop: `success`, `error`, `warning`, `secondary`, each at a different `value`, showing the semantic color palette.
- **With Stops** — a single bar with a `stops` array of ten `{ value, tooltip }` objects (10% through 95%), demonstrating tick markers along the track that surface a tooltip, for labeling multi-stage/checkpoint progress.
- **Widths** — five bars at the same `value={60}` with `width` set to `100`, `200`, `300` (px numbers) and `"50%"`, `"100%"` (percentage strings), showing the bar accepts either a fixed pixel width or a fluid percentage width.
- **Heights** — four bars at the same `value={60}` with `height` set to `4`, `10`, `50`, `200` (px numbers), showing the track/fill scale together as a single rounded pill shape at any thickness.

## API

Import path: `@vercel/geistcn/components`.

```tsx
import { Progress } from "@vercel/geistcn/components";
```

### `Progress` props observed in examples

- `value: number` — current progress amount (required in every example).
- `max?: number` — the ceiling the percentage is computed against (`value / max`); defaults to 100 when omitted (seen implicitly in the Default example).
- `type?: 'success' | 'error' | 'warning' | 'secondary'` — semantic fill color variant. (A neutral/default/primary type is implied since `type` is omitted in the Default and Custom-max examples and still renders a bar — likely `default`/`primary`, not shown explicitly as a named literal in the captured code.)
- `colors?: Record<number, string>` — maps threshold values (as object keys, e.g. `0`, `25`, `50`, `75`, `100`) to CSS color values/tokens (`var(--geist-foreground)`, `var(--geist-error)`, `var(--geist-warning)`, `var(--geist-highlight-pink)`, `var(--geist-success)`). The fill's color switches to the color of the highest threshold key that `value` has reached/passed. This is an alternative to the fixed `type` prop for continuous, breakpoint-driven coloring.
- `stops?: Array<{ value: number; tooltip: string; ariaLabel?: string }>` — renders tick markers on the track at each `value`; hovering/focusing a stop shows its `tooltip` text. Per the accessibility notes, each stop should carry its own `ariaLabel` so screen readers can navigate stops individually (e.g. "Build complete", "Tests complete").
- `width?: number | string` — pixel number (`100`, `200`, `300`) or CSS string (`"50%"`, `"100%"`) controlling the bar's rendered width; unset presumably defaults to `100%` of the container or an intrinsic width.
- `height?: number` — pixel thickness of the track/fill (`4`, `10`, `50`, `200` all demoed); the shape stays a full-height rounded pill/track at every thickness tested.

### Composition patterns

- Progress is typically wrapped in a `flex flex-col` (or `flex-row` for controls) container with Tailwind utility classes (`gap-6`, `gap-4`, `items-start`, `items-stretch`, `justify-start`, `flex-initial`) — it does not manage its own external layout/spacing.
- The Dynamic colors demo composes `Progress` with the Geist `Button` component (`size="small"`, `variant="secondary"` for the decrement action) to drive state — showing Progress is a controlled, purely presentational component driven by external `value` state (no internal timers/animation loop of its own beyond visual transition on value change).

### Minimal usage snippets

```tsx
// Default
<Progress value={30} />

// Custom max
<Progress max={40} value={30} />

// Dynamic colors (threshold-based recoloring)
<Progress
  colors={{
    0: 'var(--geist-foreground)',
    25: 'var(--geist-error)',
    50: 'var(--geist-warning)',
    75: 'var(--geist-highlight-pink)',
    100: 'var(--geist-success)',
  }}
  value={value}
/>

// Themed / semantic types
<Progress type="success" value={100} />
<Progress type="error" value={10} />
<Progress type="warning" value={40} />
<Progress type="secondary" value={70} />

// With stops (checkpoint ticks + tooltips)
<Progress
  value={30}
  type="success"
  stops={[
    { value: 10, tooltip: '10%' },
    { value: 20, tooltip: '20%' },
    // ... up to 95
  ]}
/>

// Widths
<Progress value={60} width={100} />
<Progress value={60} width="50%" />

// Heights
<Progress value={60} height={4} />
<Progress value={60} height={200} />
```

## Best practices

- **When to use:** reach for Progress only when there's a real, knowable total — file uploads, a multi-step setup wizard, build/CI steps, batch deletions. It's the "determinate work" component, not a generic "something is happening" indicator.
- **Pick the right sibling component:** for short indeterminate waits (roughly 1-3 seconds) use Spinner instead; for inline status text like "Saving" use Loading Dots instead; for progress against a quota/ratio (health-style reading) use Gauge instead — Gauge reads as a circular health indicator, Progress reads as linear completion.
- **Always pass a real `max`:** derive it from actual data (`max={files.length}`), never hardcode `100` as a stand-in ceiling — the bar's percentage math depends on the true `value / max` ratio.
- **Keep color thresholds consistent:** if you use `colors` for threshold-driven recoloring, the breakpoints should match whatever warning thresholds are already surfaced elsewhere in the UI (e.g. a quota warning banner), so the bar's color change isn't the only place that threshold is meaningful.
- **Use stops only for genuine multi-stage work:** each stop should carry a visible label next to the bar (e.g. "Step 2 of 4 - Building") — an unlabeled stop is just visual noise, not information.
- **Pair the bar with real copy, always:** the bar alone never explains itself — write out what's progressing and in what units ("Uploading 12 of 30 files", "Building - 1.2 GB / 4 GB"). Don't rely on a bare percentage for long operations; name the operation in the surrounding text instead ("Building deployment...").
- **Handle completion as a state transition, not a bar tweak:** once the bar reaches 100%, don't just leave it full with "successfully"/"complete" appended — swap the whole thing out for a proper completion UI (toast, success row, redirect).
- **Accessibility is not optional:** the component sets `role="progressbar"` plus `aria-valuemin`/`aria-valuemax`/`aria-valuenow` itself, but you must still supply an accessible name — either `aria-label` on the wrapper or a sibling `<label>` tied via `aria-labelledby`. Throttle how often you push new `aria-valuenow` values (roughly once per second) so screen readers aren't flooded on fast-moving uploads. When using `stops`, give each one its own `ariaLabel` so the checkpoints are independently announced/navigable.

## Design notes

- **Track/fill shape:** the track is a full-height rounded "pill" at every tested thickness (4px through 200px) — border radius scales with height rather than staying fixed, i.e., it's always a stadium/pill shape, not a fixed-radius rounded rect.
- **Widths supported:** fixed pixel values (100px, 200px, 300px demoed) or fluid percentage strings (`"50%"`, `"100%"`); no default width was shown explicitly outside these controlled demos.
- **Heights supported:** 4px, 10px, 50px, 200px all demoed as valid — the component doesn't clamp to a small fixed set of size tokens the way some Geist components do (e.g. small/medium/large); height is a raw pixel number.
- **Color tokens referenced in code:** `var(--geist-foreground)`, `var(--geist-error)`, `var(--geist-warning)`, `var(--geist-highlight-pink)`, `var(--geist-success)` — these are the CSS custom properties used for threshold-based coloring via the `colors` prop, confirming Progress consumes the standard Geist color token set rather than component-specific tokens.
- **`type` enum values confirmed in code:** `success`, `error`, `warning`, `secondary` (four semantic variants demoed side by side in the Themed section). A default/primary/neutral variant exists implicitly (used when `type` is omitted, e.g. in the Default and Custom-max demos) but its literal name wasn't visible in the captured JSX.
- **`colors` prop mechanics:** keys are numeric percentage thresholds (0, 25, 50, 75, 100 in the demo) mapped to color values; the fill recolors as `value` crosses each threshold, effectively giving continuous threshold-based coloring as an alternative to the discrete `type` prop.
- **Stops rendering:** ten stops were demoed clustered toward the low-to-mid range (10 through 90) plus one near the top (95), each with a `tooltip` string equal to its percentage label (e.g. `'10%'`) — implies stops render as small tick marks along the track that reveal a tooltip on hover/focus.
- **Motion:** the page's prose doesn't spell out transition timing/easing explicitly; the Dynamic colors demo (buttons incrementing/decrementing `value` by 10) implies the fill width and color both animate smoothly between value changes, consistent with other Geist components' default transition conventions, but no exact duration/easing values were present in the captured markup or flight payload.
- No standalone props table exists on this page (unlike some other Geist component docs) — the only prop-level documentation available is inferred from the seven demo code blocks (Default, Custom max, Dynamic colors, Themed, With Stops, Widths, Heights) plus the Best Practices prose.
