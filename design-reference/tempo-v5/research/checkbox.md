# Checkbox

> "A control that toggles between two options, checked or unchecked."

Source: https://vercel.com/geist/checkbox

## Sections documented

- **Default** — a basic controlled checkbox (`useState` + `onChange`) rendering the label "Option 1". Demonstrates the checked/unchecked interactive state with "Show code".
- **Disabled** — three stacked disabled examples in a `flex flex-col gap-4` column: plain `Disabled`, `Disabled Checked` (checked + disabled), and `Disabled Indeterminate` (indeterminate + disabled). Demonstrates the disabled visual treatment across all three value states. Has "Show code".
- **Indeterminate** — a single checkbox rendered with the `indeterminate` prop, showing the dash/mixed-state glyph instead of the checkmark. Has "Show code".
- **Best Practices** — an accordion with four subsections: When to use, Behavior, Content, Accessibility (see below).

No Sizes, Types, or Variants sections exist for this component — Checkbox ships in a single fixed size/style, and only the three sections above appear on the page.

## API

Single component, no documented subcomponents.

```tsx
import { Checkbox } from '@vercel/geistcn/components';
```

### Props observed across all code examples

- `checked?: boolean` — controlled checked state.
- `onChange?: (event) => void` — the examples show `onChange={(): void => setChecked((b) => !b)}`, i.e. a no-argument toggle callback pattern (bind your own state, the component does not manage it internally).
- `disabled?: boolean` — disables interaction; combinable with `checked` and/or `indeterminate`.
- `indeterminate?: boolean` — renders the dash/mixed glyph instead of the checkmark; combinable with `disabled`.
- `children` — the label content, rendered inline immediately after the box (composition is `<Checkbox>Label text</Checkbox>`, not a separate `label` prop).

### Usage snippets (as shown in the docs)

Controlled default:
```tsx
import { Checkbox } from '@vercel/geistcn/components';
import { useState, type JSX } from 'react';

export function Component(): JSX.Element {
  const [checked, setChecked] = useState(false);

  return (
    <Checkbox checked={checked} onChange={(): void => setChecked((b) => !b)}>
      Option 1
    </Checkbox>
  );
}
```

Disabled (all three value states):
```tsx
import { Checkbox } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return (
    <div className="flex flex-col items-stretch justify-start gap-4 flex-initial">
      <Checkbox disabled>Disabled</Checkbox>
      <Checkbox checked disabled>
        Disabled Checked
      </Checkbox>
      <Checkbox disabled indeterminate>
        Disabled Indeterminate
      </Checkbox>
    </div>
  );
}
```

Indeterminate:
```tsx
import { Checkbox } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return <Checkbox indeterminate>Option 1</Checkbox>;
}
```

### Composition patterns implied by Best Practices copy

- Wrap a related group of checkboxes in a native `<fieldset>` with a `<legend>` for the group label (Title Case noun, e.g. `Notifications`, `Required Permissions`, no trailing colon).
- For a row-select checkbox with no visible label (e.g. table row picker), set `aria-label="Select {row name}"` directly on the input rather than relying on the group legend.
- Use Geist's `Tooltip` alongside a disabled checkbox to explain why it's disabled.
- Use Geist's `Toggle` instead of a lone checkbox for a single boolean setting (dark mode, password protection) — Checkbox is positioned for multi-select/acknowledgment use cases, not standalone booleans.

## Best practices

**When to use**
- Multi-select within a list — table-row pickers, multi-pick filters, opt-in preference groups.
- Acknowledgment of a specific statement the user must affirm (terms of service, an irreversible export/action).
- Not for a single standalone boolean (dark mode, password protection) — use Toggle there since on/off framing reads more clearly than one isolated checkbox.

**Behavior**
- Indeterminate is a display-only visual state, not a real third value the component tracks — the parent component must compute "some but not all children selected" and drive the prop itself, clearing it the instant selection becomes fully on or fully off.
- Validation errors on a required checkbox (e.g. "you must agree") should only surface on submit, never on blur/toggle — don't flash an error mid-interaction while the user is still deciding.
- A disabled checkbox must still communicate *why* — pair it with a tooltip; an unexplained greyed-out box reads as broken rather than intentional.

**Content**
- Fieldset/group labels are a short Title Case noun phrase with no trailing colon.
- An acknowledgment checkbox's label is a complete sentence ending in a period (e.g. "I agree to the Terms of Service.").
- When a group is indeterminate, put the partial count in the visible copy next to the group label (e.g. "3 of 5 selected") — never leave the mixed state unexplained.

**Accessibility**
- Group related checkboxes inside `<fieldset>`/`<legend>` so assistive tech announces the group context before each option.
- For unlabeled row-select checkboxes, supply `aria-label="Select {row name}"` so the control remains identifiable out of visual context.
- Don't break the native `<label>`/`htmlFor` association with a custom wrapper — the click target is designed to extend across the whole label already.

## Design notes

- **Control size**: box is `size-4` (16px square) with `border` (hairline) and `rounded-sm` corner radius. The inner check/dash SVG is rendered at `16x16` in a `viewBox="0 0 20 20"`.
- **Hit target**: the visible box sits inside a `p-0.5 -m-0.5` wrapper span, giving a small invisible padding/margin buffer around the 16px box for a slightly larger click area; the real `<input type="checkbox">` is visually hidden with `sr-only peer` and drives all state via CSS `peer-*` selectors on its sibling span.
- **Label**: `<label>` is `text-[13px] inline-flex items-start cursor-pointer`; label text sits in a `<span class="ml-2">` right after the box span, so label and box are one flex row with 8px (`ml-2`) gap.
- **State-driven styling is 100% via Tailwind arbitrary-value + `peer-*`/`group` selectors, no JS class toggling**:
  - Unchecked, enabled: `bg-[var(--ds-background-100)]`, `border-[var(--ds-gray-700)]`.
  - Checked, enabled (not indeterminate): `peer-checked:bg-[var(--ds-gray-1000)]` + `peer-checked:border-[var(--ds-gray-1000)]` (fills solid to the highest-contrast gray/near-black).
  - Checked + disabled: `peer-disabled:peer-checked:bg-[var(--ds-gray-600)]` / `border-[var(--ds-gray-600)]` (dimmed fill).
  - Unchecked + disabled: `peer-disabled:not-peer-checked:bg-[var(--ds-gray-100)]` / `border-[var(--ds-gray-500)]`.
  - Hover (enabled, unchecked): `peer-hover:not-peer-disabled:not-peer-checked:bg-[var(--ds-gray-200)]`.
  - Focus-visible: `peer-focus-visible:shadow-[var(--ds-focus-ring)]` plus the same `gray-200` background bump as hover when unchecked and enabled.
  - Disabled indeterminate dash line: `peer-disabled:[&.indeterminate_svg_line]:stroke-[var(--ds-gray-500)]`.
- **Checkmark vs. dash are two separate SVG primitives inside the same `<svg>`, toggled by visibility, not swapped**:
  - Checkmark: `<path d="M14 7L8.5 12.5L6 10" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">`, colored `stroke-[var(--geist-background)]` (i.e. it draws in the page background color, "cut out" of the filled box).
  - Dash (indeterminate): `<line x1="5" x2="15" y1="10" y2="10" stroke-width="2" stroke-linecap="round">`, colored `stroke-[var(--checkbox-color)]` where `--checkbox-color` is locally set to `var(--ds-gray-700)` on the wrapper span.
  - Visibility rules: default state shows the path and hides the line (`[&:not(.indeterminate)_svg_path]:visible` on `peer-checked`, `[&:not(.indeterminate)_svg_line]:invisible`); the `.indeterminate` class flips it (`[&.indeterminate_svg_line]:visible`, `[&.indeterminate_svg_path]:invisible !important`). An `.inverted` class exists too (`[&.inverted_svg_path]:visible`) implying an inverted/alternate color variant hook, though no demo section exercises it.
- **Transition**: `transition-all duration-200` on the box for smooth color/border animation between states. There's also a curious `rotate-[0.000001deg]` hack on the box, almost certainly a GPU-compositing/subpixel-rendering forcing trick (common Vercel technique to avoid blurry borders on transform-adjacent elements), not a visible rotation.
- **Design tokens referenced** (from `--ds-*` custom properties across the page, several used directly by Checkbox): `--ds-background-100`, `--ds-gray-100`, `--ds-gray-200`, `--ds-gray-500`, `--ds-gray-600`, `--ds-gray-700`, `--ds-gray-1000`, `--ds-focus-ring`, `--geist-background` (used for the checkmark color so it "knocks out" against the filled box regardless of light/dark theme).
- **Demo-card chrome** (shared across all Geist component pages, not Checkbox-specific): each example lives in a `rounded-lg border border-gray-alpha-400 bg-background-100` card with `p-6` padding; the "Show code" toggle is a `radix`-powered collapsible footer bar (`bg-background-200 border-t border-gray-400`, 48px tall button row) that expands a syntax-highlighted code block below it.
- **No size/variant enum exists** — unlike components such as Button, Checkbox has exactly one visual size (16px) and one shape (rounded-sm square); the only state axes are checked / indeterminate / disabled, each independently toggleable and stacked via the peer-selector chain above.
