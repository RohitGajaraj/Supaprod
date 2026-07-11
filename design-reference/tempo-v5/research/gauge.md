# Gauge

> "A circular visual for conveying a percentage."

Source: https://vercel.com/geist/gauge (Vercel Geist Design System). Captured 2026-07-11.

## Sections documented

- **Default** — four gauges side by side at `size="tiny"|"small"|"medium"|"large"`, all `value={50}`, no label/value text shown. Demonstrates the four size steps at a glance.
- **Label (showValue demo)** — `showValue` gauges across all four sizes, with values `80` and `100` shown for `small`, `medium`, and `large` (tiny only shown at 80). Demonstrates the built-in numeric label rendered inside/beside the arc, and how the digit count (80 vs 100) affects the label at each size.
- **Default color scale** — three `small` gauges with plain `value={14}`, `value={34}`, `value={68}` and no `colors` prop. Demonstrates the built-in default threshold-based color ramp across low/mid/high values.
- **Custom color range** — a row of `small` gauges stepping `value` from 0 to 100 in increments of 10, each passed an explicit `colors` map keyed by numeric threshold strings (`'0'` through `'100'`) pointing at a single hue's full shade ramp (pink 100→1000). Demonstrates fully custom per-threshold color overrides replacing the default scale.
- **Custom secondary color** — one `medium` gauge at `value={50}` with a two-key `colors` object (`primary`/`secondary`) instead of numeric thresholds. Demonstrates overriding just the filled-arc color and the track (unfilled arc) color as a simple two-tone pair.
- **Arc priority** — one `medium` gauge, `arcPriority="equal"`, `colors={{primary, secondary}}` (blue/red), `showValue`, `value={50}`. Prose: "When using the gauge to display a ratio, use the `equal` arc priority to make both arcs equally sized." Demonstrates the `arcPriority` prop controlling whether the filled arc visually dominates the track (default) or both arcs get equal visual weight (`"equal"`), which matters for true half/half ratio displays.
- **Indeterminate** — four gauges (`tiny`/`small`/`medium`/`large`), all `indeterminate`, `value={25}`. Demonstrates a loading/unknown-value state, presumably rendered as an animated/spinning arc rather than a static fill.
- **Best Practices** (accordion, three panels: When to use / Behavior / Accessibility) — see below.

## API

Single component, imported from the shared Geist React package:

```tsx
import { Gauge } from "@vercel/geistcn/components";
```

### `<Gauge />` props (observed across examples)

| Prop            | Type / values seen                                                                                  | Purpose                                                                                                                                                                       |
| --------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | --- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`         | `number` (0–100)                                                                                    | The percentage the gauge renders.                                                                                                                                             |
| `size`          | `"tiny" \| "small" \| "medium" \| "large"`                                                          | Controls overall gauge diameter.                                                                                                                                              |
| `showValue`     | `boolean` (boolean shorthand, no value)                                                             | Renders the numeric percentage as a label on/near the gauge.                                                                                                                  |
| `colors`        | either a **threshold map** (`Record<'0'                                                             | '10'                                                                                                                                                                          | '20' | ... | '100', string>`, numeric-string keys at 10-point steps from 0 to 100) OR a **two-key map** (`{ primary: string; secondary: string }`) | Threshold map: assigns a distinct fill color per value bracket (a stepped color ramp). Two-key map: sets just the filled arc (`primary`) and the track/unfilled arc (`secondary`) colors, overriding the default scale entirely. |
| `arcPriority`   | `"equal"` (only non-default value observed; default appears to be primary-dominant)                 | Controls whether the filled arc is drawn with visual priority over the track (default) or both arcs render with equal visual weight — used for true ratio/half-half displays. |
| `indeterminate` | `boolean` (boolean shorthand)                                                                       | Puts the gauge into a loading/unknown state (still takes a `value`, e.g. `25`, presumably as the static angle for the indeterminate sweep).                                   |
| `children`      | not shown filled in any example, but called out in Best Practices as "reserved for an icon overlay" | Icon overlay slot inside the gauge — not for text/unit strings.                                                                                                               |

### Usage snippets (as documented, `@vercel/geistcn/components`)

Sizes:

```tsx
<Gauge size="tiny" value={50} />
<Gauge size="small" value={50} />
<Gauge size="medium" value={50} />
<Gauge size="large" value={50} />
```

Label / showValue:

```tsx
<Gauge showValue size="tiny" value={80} />
<Gauge showValue size="small" value={80} />
<Gauge showValue size="small" value={100} />
<Gauge showValue size="medium" value={80} />
<Gauge showValue size="medium" value={100} />
<Gauge showValue size="large" value={80} />
<Gauge showValue size="large" value={100} />
```

Default color scale (no `colors` prop — built-in ramp):

```tsx
<Gauge size="small" value={14} />
<Gauge size="small" value={34} />
<Gauge size="small" value={68} />
```

Custom color range (per-threshold override, one gauge shown per 10-point step 0→100; example at value 0 and 10 shown, pattern repeats through 100):

```tsx
<Gauge
  colors={{
    "0": "var(--ds-pink-100)",
    "10": "var(--ds-pink-200)",
    "20": "var(--ds-pink-300)",
    "30": "var(--ds-pink-400)",
    "50": "var(--ds-pink-500)",
    "60": "var(--ds-pink-600)",
    "70": "var(--ds-pink-700)",
    "80": "var(--ds-pink-800)",
    "90": "var(--ds-pink-900)",
    "100": "var(--ds-pink-1000)",
  }}
  size="small"
  value={0}
/>
```

(Note: the threshold map skips `'40'` in the captured source — steps are `0,10,20,30,50,60,70,80,90,100`, i.e. 9 declared stops covering an 11-step range; treat as a possible source quirk/typo rather than a hard requirement to skip 40.)

Custom secondary color (two-tone override):

```tsx
<Gauge
  colors={{
    primary: "var(--ds-blue-700)",
    secondary: "var(--ds-blue-300)",
  }}
  size="medium"
  value={50}
/>
```

Arc priority (equal-weight ratio display):

```tsx
<Gauge
  arcPriority="equal"
  colors={{
    primary: "var(--ds-blue-700)",
    secondary: "var(--ds-red-700)",
  }}
  showValue
  size="medium"
  value={50}
/>
```

Indeterminate:

```tsx
<Gauge indeterminate size="tiny" value={25} />
<Gauge indeterminate size="small" value={25} />
<Gauge indeterminate size="medium" value={25} />
<Gauge indeterminate size="large" value={25} />
```

## Best practices (paraphrased)

**When to use**

- Reach for Gauge when you're showing a 0–100 ratio against a fixed ceiling and the comparison itself is the point — quota usage, cache hit rate, uptime, billing-period consumption.
- If it's determinate progress toward a known total (an upload, a multi-step setup wizard), use Progress instead — Gauge is for a snapshot ratio, not a completion sequence.
- If the thing you're representing is really a binary or enum state (not a percentage), use Status Dot (for deployment-style states) or Badge (for everything else) rather than forcing it into a gauge.

**Behavior**

- Default arc behavior favors the filled portion visually; switch to `arcPriority="equal"` specifically when the number is a true ratio and 50% should visually read as an exact half split, not a dominant fill.
- Don't invent one-off color thresholds for the gauge. Reuse the product's existing numeric breakpoints for warning/error states (e.g. the same `>=80%` warning / `>=95%` error cutoffs used elsewhere) so the gauge's color language stays consistent with the rest of the UI.
- When a gauge is `indeterminate`, always pair it with copy that explains why the value isn't showing yet (e.g. "Calculating usage…") — an indeterminate gauge alone reads as a bug or a zero value, not a loading state.

**Content**

- A gauge is never self-describing — always pair it with an adjacent label or a Tooltip that names what the number actually represents (e.g. "Build Cache Hit Rate").
- Don't stuff units into `children` — that slot is reserved for an icon overlay, not text. The unit lives in the label next to the gauge (e.g. "Uptime · 99.97%").
- When `showValue` is on, the number rendered is the bare value — never concatenate a `%` sign or other unit string into the value itself.

**Accessibility**

- The component owns `role="progressbar"` plus `aria-valuemin` / `aria-valuemax` / `aria-valuenow` internally — don't override or duplicate these.
- The adjacent label is the gauge's accessible name; wire it up via `aria-labelledby` on the gauge's wrapper so assistive tech announces something like "Uptime, 99 percent."
- Never rely on color alone to communicate a threshold crossing (e.g. warning/error tint) — always back it with redundant text, either inline below the gauge or in a Tooltip.

## Design notes

- **Sizes**: four discrete steps — `tiny`, `small`, `medium`, `large`. Exact pixel diameters are not printed in the captured markup/flight payload (no literal px values appeared in the extracted text or code); treat the four-step scale as confirmed but measure actual rendered diameters from a live render or the compiled CSS if pixel-exact values are required.
- **Color tokens**: examples exclusively use the Geist design-token CSS variables, not raw hex — pattern is `var(--ds-<hue>-<step>)`, e.g. `var(--ds-pink-100)` through `var(--ds-pink-1000)` (10 steps: 100/200/300/400/500/600/700/800/900/1000), and `var(--ds-blue-700)` / `var(--ds-blue-300)` / `var(--ds-red-700)` for two-tone overrides. Rebuild the color API against the equivalent Tailwind v4 / CSS-variable token scale (e.g. this repo's `--ds-*` or Tailwind color scale) rather than hardcoding hex.
- **`colors` prop shape has two valid forms**, mutually exclusive per usage: (a) a threshold map with string-numeral keys at 10-point steps ('0'..'100') mapping each bracket to a color — a stepped ramp; (b) a flat `{ primary, secondary }` pair — fill vs. track. Implementation should type this as a union (`Record<ThresholdKey, string> | { primary: string; secondary: string }`).
- **`arcPriority="equal"`** is the only non-default value shown; the implicit default clearly gives the filled ("primary") arc more visual weight than the track — likely meaning the track (secondary) arc's stroke or opacity is diminished relative to the fill when not in equal mode, and both arcs get matched stroke weight/opacity under `arcPriority="equal"`.
- **`indeterminate`** still takes a `value` prop (`25` in the example) even though the state is meant to be "unknown" — implies the indeterminate visual (likely an animated/looping sweep, not a static fill) uses that value only as a static base angle or ignores it visually while some animation loops; motion behavior itself is not described in visible prose, so verify by live-rendering the component.
- **`showValue`** renders the bare numeric percentage (no `%` sign shown in the label per the best-practices copy — worth confirming against a live render whether the `%` glyph is actually appended by the component itself; the text says not to inject one via props, which implies the component itself is responsible for any unit glyph).
- **Accessibility contract**: internally sets `role="progressbar"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow` — rebuild must replicate this exact ARIA contract and expose an `aria-labelledby`-compatible wrapper element for the caller to attach the adjacent label's id.
- **`children`** slot exists but is documented as reserved for an icon overlay (not demonstrated in any captured code example) — implement as an overlay positioned at the gauge's center/icon slot, not as general child content.
