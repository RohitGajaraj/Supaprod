# Label

> "Accessible text label for form controls."

Source: https://vercel.com/geist/label. This is one of Geist's simpler component pages: it has no separate API-reference table and no "Best Practices" accordion (When to use / Behavior / Accessibility), unlike some richer components in the system. The page consists of a title, the one-line purpose statement, three demo sections each with a "Show code" toggle, and the standard sidebar/nav chrome (Foundations, Brands, full Components list).

## Sections documented

- Default — a bare `Label` with just a `value`, not associated with any input. Demonstrates the label rendered on its own ("This is a label").
- With Input — a `Label` paired with an `Input` via `withInput` + `aria-labelledby`/`id` wiring. Demonstrates the canonical "label above a field" composition ("Email Address" label over an "Enter email address..." input).
- Bypass Casing — same label+input composition as above, but with a `bypassCasing` prop added and the label text written in sentence case ("Email address" instead of "Email Address"). Demonstrates that Geist's `Label` normally applies its own text-casing transform, and `bypassCasing` opts a given label out of it so the author's exact casing is preserved.

No other sections (no Sizes, Types, Variants, States, or layout/edge-case demos) are present on this page. Label is presented as a small, single-purpose primitive.

## API

Import path: `@vercel/geistcn/components`.

Example 1 (Default):
```tsx
import { Label } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return <Label id="test-input" value="This is a label" />;
}
```

Example 2 (With Input):
```tsx
import { Input, Label } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return (
    <>
      <Label id="test-input" value="Email Address" withInput />
      <Input
        aria-labelledby="test-input"
        id="test-input"
        placeholder="Enter email address..."
      />
    </>
  );
}
```

Example 3 (Bypass Casing):
```tsx
import { Input, Label } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return (
    <>
      <Label bypassCasing id="test-input" value="Email address" withInput />
      <Input
        aria-labelledby="test-input"
        id="test-input"
        placeholder="Enter email address..."
      />
    </>
  );
}
```

### Props observed (no formal prop table is published on this page; inferred from the three examples above)

- `id` (string, required in all examples) — anchors the label; when paired with an input, the input references it via `aria-labelledby={id}` (ARIA-based, not native `htmlFor`/`for` label-wrapping).
- `value` (string, required) — the label's text content. Passed through Geist's automatic text-casing transform by default (see `bypassCasing`).
- `withInput` (boolean, optional) — signals the label is paired with a form control sitting immediately after it; likely adjusts layout spacing/typography for the "label on top of a field" case vs. a standalone label.
- `bypassCasing` (boolean, optional) — opts the label out of Geist's automatic text-casing normalization so the exact casing of `value` renders as-authored.

### Composition pattern

`Label` is a standalone primitive, not a wrapper — it does not enclose the input as children. The link between label and control is explicit and bidirectional:
- The control gets `id={sameId}` and `aria-labelledby={sameId}`.
- The `Label` gets that same id value passed to its own `id` prop.

Typical usage shape:
```tsx
<Label id={fieldId} value="Field name" withInput />
<Input aria-labelledby={fieldId} id={fieldId} placeholder="..." />
```

## Best practices

No "Best Practices" accordion (When to use / Behavior / Accessibility) is published on this page, so nothing can be paraphrased from Vercel's own text. Reasonable rules inferred from the examples themselves, to guide the reimplementation:

- Pair every form control with a `Label` via matching `id`/`aria-labelledby` rather than relying on placeholder text alone for accessible naming.
- Use `withInput` whenever the label sits directly above/beside a control, so its layout (spacing, weight) reads as a field label rather than free-standing text.
- Default to the automatic casing behavior; reach for `bypassCasing` only when exact casing must be preserved verbatim (a proper noun, an already-lowercased sentence-style label, or content coming from user data).

## Design notes

- Component name/slug: `Label`, imported from `@vercel/geistcn/components` (same package/namespace as `Input`).
- Default rendering applies an automatic text-casing transform to the `value` string. The exact transform rule (title case vs. sentence case vs. capitalize-first-word) is not directly visible in the raw HTML/flight payload — only its presence and its opt-out (`bypassCasing`) are confirmed by comparing "Email Address" (default) vs. "Email address" (bypassCasing) across the two paired-with-input examples.
- Association model is ARIA-based (`aria-labelledby` + shared `id`), not the native HTML `<label for>` wrapping pattern — worth preserving for parity in a Radix/React re-implementation (render a `<span>`/`<div>` carrying the shared `id`, not a native `<label>` element, unless further evidence surfaces).
- Code examples on the page ship with both light and dark syntax-highlighting theme variants (`data-theme="light"` / `data-theme="dark"`) for the same snippet, confirming the docs site (and likely the component itself) supports light/dark parity.
- No dedicated size/weight/color token names (e.g. `--ds-*`, `text-label-14`) were observable for this component specifically in the captured HTML/flight payload — the page does not expose a props/token reference table. Recommend cross-referencing the `Input` component's Geist page (since `Label` always appears paired with `Input` in the two richer examples) for shared spacing/typography tokens if closer visual fidelity is needed.
