# Slider

> "Input to select a value from a given range."

Source: https://vercel.com/geist/slider (Geist Design System, Vercel). Fetched via raw HTML + Next.js flight payload (no props table is rendered on this page — the JSX demos below are the only documented API surface).

## Sections documented

- **Default** — a single-thumb slider bound to one numeric value (`useState([50])`), wrapped in a bare `<form>`. Demonstrates the minimal usage: `value` + `onValueChange`, no visible numeric inputs.
- **Range with inputs** — a two-thumb range slider (`useState([50, 75])`) with `showStartInput` and `showEndInput` enabled, rendering editable numeric inputs at each end of the track alongside the two thumbs.
- **Disabled range with inputs** — same two-thumb range-with-inputs configuration, plus the `disabled` prop, showing the inert/dimmed visual state.
- **Best Practices** (accordion) — four bullets of when-to-use / behavior / accessibility guidance (paraphrased below).

No "Sizes", "Types", or other variant sections exist on this page — Slider ships with exactly these three demos plus the Best Practices accordion.

## API

Import:

```tsx
import { Slider } from "@vercel/geistcn/components";
```

Single component, no documented subcomponents. Props observed across the three demos:

- `value: number[]` — controlled value. A one-element array (`[50]`) renders a single-thumb slider; a two-element array (`[50, 75]`) renders a two-thumb range slider. Array length is what switches single vs. range mode — there is no separate `type`/`mode` prop.
- `onValueChange: (value: number[]) => void` — change callback, paired with `useState` in every example (`const [value, setValue] = useState([50])`).
- `showStartInput?: boolean` — renders an editable numeric input bound to the first (start) thumb.
- `showEndInput?: boolean` — renders an editable numeric input bound to the second (end) thumb. Only meaningful/used together with a two-element `value` (range mode) in the examples.
- `disabled?: boolean` — disables the whole control (track, thumbs, and the start/end inputs if present).

No `min`, `max`, or `step` props appear in any example on this page (defaults are not shown), and no explicit `size` variant is demonstrated.

### Usage snippets

Default (single thumb, no inputs):

```tsx
import { Slider } from "@vercel/geistcn/components";
import { useState, type JSX } from "react";

export function Component(): JSX.Element {
  const [value, setValue] = useState([50]);
  return (
    <form>
      <Slider onValueChange={setValue} value={value} />
    </form>
  );
}
```

Range with inputs (two thumbs + editable numeric fields):

```tsx
import { Slider } from "@vercel/geistcn/components";
import { useState, type JSX } from "react";

export function Component(): JSX.Element {
  const [value, setValue] = useState([50, 75]);
  return (
    <form>
      <Slider onValueChange={setValue} showEndInput showStartInput value={value} />
    </form>
  );
}
```

Disabled range with inputs:

```tsx
import { Slider } from "@vercel/geistcn/components";
import { useState, type JSX } from "react";

export function Component(): JSX.Element {
  const [value, setValue] = useState([50, 75]);
  return (
    <form>
      <Slider disabled onValueChange={setValue} showEndInput showStartInput value={value} />
    </form>
  );
}
```

Composition pattern: every example wraps the `Slider` in a bare `<form>` — no `Fieldset`/`Label` wrapper shown in the demo code itself (labeling guidance is deferred to Best Practices, see below).

## Best practices

Paraphrased from Geist's guidance:

- Reach for a slider when the input is about relative shape/feel rather than exact precision — think bandwidth caps, opacity, volume, color channels — not for values a user needs to hit exactly.
- If the value must be exact (e.g. a port number or a memory limit), pair the slider with a numeric `Input` field, since keyboard-first users will default to typing rather than dragging.
- Quantize dragging to a sensible step (1, 5, 10%) so the control never yields ugly fractional output like `47.83291`; also clamp `min`/`max` to the real bounds the product actually supports.
- Always surface the live value next to the track using tabular figures, and label what the number means (e.g. "Sample Rate · 44 kHz") — the track by itself doesn't communicate meaning.
- Any threshold styling (warning/error tint past some limit) should reuse the same numeric breakpoint that's shown elsewhere in the UI, not an ad hoc slider-only cutoff.
- Wire up an accessible name via a sibling `<label htmlFor>` or `aria-label`, and let native keyboard behavior (arrow keys, Page Up/Down, Home/End) do the work — don't intercept or override those keys.

## Design notes

- No component-scoped CSS (no `--ds-slider-*` tokens, no `material-*` classes) is present in the page's inline payload — styling lives in the external Geist stylesheet bundle, not inline/observable from this fetch. The only design tokens visible anywhere on the page are generic `--ds-*` globals used site-wide (`--ds-gray-100..1000`, `--ds-gray-alpha-*`, `--ds-blue-300/700/900`, `--ds-amber-800`, `--ds-background-100`, `--ds-focus-color`, `--ds-focus-ring`, `--ds-shadow-border`, `--ds-shadow-border-small`, `--ds-size-medium`) — treat these as the palette/shadow/focus-ring primitives Slider would draw from (thumb focus ring, disabled gray fill, track background), not as slider-specific values.
- Package path is `@vercel/geistcn/components` (the geistcn shadcn-style distribution), not a `@vercel/geist-icons` or separate `@geist-ui` package — mirrors how other Geist components are documented on this same site.
- Value model: an array-typed `value`/`onValueChange` pair, where array length (1 vs 2 elements) determines single-thumb vs. two-thumb range behavior — no discrete `variant`/`mode` enum, this is inferred from data shape.
- The "with inputs" variant is additive (`showStartInput`, `showEndInput`) rather than a different component — same `<Slider>` tag, two boolean flags toggle the paired numeric `<input>` elements at each end.
- `disabled` is a single boolean that dims/disables the entire composite (track + thumbs + any start/end inputs together) — no per-thumb or per-input disabling shown.
- No explicit motion/transition behavior is described in the fetched HTML/flight payload (drag interaction is presumably native Radix-slider-style pointer tracking, consistent with Geist's usual Radix-primitive foundation, but this specific page does not narrate it).
