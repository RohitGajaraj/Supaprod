# Radio

> "Provides single user input from a selection of options."

Source: https://vercel.com/geist/radio (Geist Design System)

## Sections documented

- **Default** — a `RadioGroup` with a visible `label` ("Default Radio Example"), two `RadioGroupItem`s stacked vertically (Option 1 / Option 2), controlled via `useState`. Demonstrates the baseline two-option group.
- **Radio disabled** — same shape as Default but the whole `RadioGroup` carries a `disabled` prop, greying out and disabling both options together (group-level disabling, not per-item).
- **Radio required** — the `RadioGroup` is wrapped in a `<form>` alongside a `Button` ("Submit"); the group carries `required` and starts with an empty string value (no default selection), showing the required-field pattern used with native form validation.
- **Radio headless** — uses the `RadioGroup` root component together with the `useRadio` hook instead of `RadioGroup.Item`/`RadioGroupItem`, letting the consumer render fully custom label/markup (a `<label>` with `justify-content: space-between` wrapping arbitrary content plus the hook-returned `component`). Demonstrates building a bespoke option row (e.g. label left, radio dot right) while keeping the group's state/keyboard logic.
- **Radio standalone** — a single unlabelled `Radio` primitive (not wrapped in `RadioGroup`) driven manually via `checked`/`onChange`/`value` props and an explicit `aria-label`, for embedding a lone radio input inside custom UI (e.g. a list row).
- **Best Practices** (accordion) — When to use / Behavior / Content / Accessibility guidance (see below).

## API

Package: `@vercel/geistcn/components`

Components/hooks exported and used:

- `RadioGroup` — the group root/controller.
- `RadioGroupItem` — an individual option within a `RadioGroup` (labelled variant).
- `useRadio` — headless hook returning a ready-to-render `component` (the radio input visual) for a given `{ value, disabled }`, used when you don't want `RadioGroupItem`'s built-in label layout.
- `Radio` — the standalone/unmanaged primitive radio input, used outside a `RadioGroup`.

### `RadioGroup` props seen

- `label?: string` — visible group label rendered above the options (e.g. "Default Radio Example").
- `aria-label?: string` — accessible name when no visible `label` is rendered (used in the headless example).
- `value: string` — controlled selected value.
- `onChange: (value: string) => void` — change handler, receives the newly selected value directly (not an event).
- `disabled?: boolean` — disables every option in the group at once.
- `required?: boolean` — marks the group as required (for native form validation); goes on the group, never on an individual item.
- Children are typically wrapped in a plain `<div>` with Tailwind layout classes (`flex flex-col ... gap-4`/`gap-6`) — the group itself does not appear to impose the stack layout; the demo wraps children explicitly.

### `RadioGroupItem` props seen

- `value: string` — the option's value, matched against the group's `value`.
- children — the visible option label (plain text, e.g. `Option 1`).

### `useRadio(options)`

- Input: `{ value: string, disabled: boolean }`.
- Returns: `{ component: JSX.Element }` — just the radio dot visual, wired to the enclosing group's checked/onChange state via context; the caller supplies its own label/layout around it.

### `Radio` (standalone) props seen

- `aria-label: string` — required accessible name since there's no group label.
- `checked: boolean`
- `onChange: () => void`
- `value: string`

### Minimal usage snippets

Default:

```tsx
import { RadioGroup, RadioGroupItem } from "@vercel/geistcn/components";
import { useState, type JSX } from "react";

export function Component(): JSX.Element {
  const [value, setValue] = useState("one");

  return (
    <RadioGroup label="Default Radio Example" onChange={setValue} value={value}>
      <div className="flex flex-col items-stretch justify-start gap-6 flex-initial">
        <RadioGroupItem value="one">Option 1</RadioGroupItem>
        <RadioGroupItem value="two">Option 2</RadioGroupItem>
      </div>
    </RadioGroup>
  );
}
```

Disabled (group-level):

```tsx
import { RadioGroup, RadioGroupItem } from "@vercel/geistcn/components";
import { useState, type JSX } from "react";

export function Component(): JSX.Element {
  const [value, setValue] = useState("one");

  return (
    <RadioGroup disabled label="Disabled Radio Example" onChange={setValue} value={value}>
      <div className="flex flex-col items-stretch justify-start gap-6 flex-initial">
        <RadioGroupItem value="one">Option 1</RadioGroupItem>
        <RadioGroupItem value="two">Option 2</RadioGroupItem>
      </div>
    </RadioGroup>
  );
}
```

Required (in a form, with submit button):

```tsx
import { Button, RadioGroup, RadioGroupItem } from "@vercel/geistcn/components";
import { useState, type JSX } from "react";

export function Component(): JSX.Element {
  const [value, setValue] = useState("");

  return (
    <form className="flex flex-col items-start justify-start gap-6 flex-initial">
      <RadioGroup label="Required Radio Example" onChange={setValue} required value={value}>
        <div className="flex flex-col items-stretch justify-start gap-4 flex-initial">
          <RadioGroupItem value="one">Option 1</RadioGroupItem>
          <RadioGroupItem value="two">Option 2</RadioGroupItem>
        </div>
      </RadioGroup>
      <Button size="small">Submit</Button>
    </form>
  );
}
```

Headless (custom row layout via `useRadio`):

```tsx
import { RadioGroup, useRadio } from "@vercel/geistcn/components";
import { useState, type JSX } from "react";

export function Component(): JSX.Element {
  const [value, setValue] = useState("one");
  const { component } = useRadio({ value: "one", disabled: false });
  const { component: component2 } = useRadio({ value: "two", disabled: false });

  return (
    <RadioGroup aria-label="Options" onChange={setValue} value={value}>
      <div className="flex flex-col items-stretch justify-start gap-6 flex-initial">
        <label style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Option 1</span>
          {component}
        </label>
        <label style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Option 2</span>
          {component2}
        </label>
      </div>
    </RadioGroup>
  );
}
```

Standalone (unmanaged, single primitive):

```tsx
import { Radio } from "@vercel/geistcn/components";
import { useState, type JSX } from "react";

export function Component(): JSX.Element {
  const [value, setValue] = useState("one");

  return (
    <li className="flex flex-row items-stretch justify-start gap-2 flex-initial list-none">
      <span>Option 1</span>
      <Radio
        aria-label="Option 1"
        checked={value === "one"}
        onChange={() => setValue("one")}
        value="one"
      />
    </li>
  );
}
```

## Best practices (paraphrased)

**When to use**

- Reach for Radio when the user must pick exactly one option out of roughly 2 to 6 mutually-exclusive choices and it's valuable for the user to see all options simultaneously (e.g. deploy region, plan tier, billing cycle).
- Once you're past ~6 options, switch to Select or Combobox instead — a long radio stack overwhelms the form.
- For a simple binary on/off choice, use Toggle rather than two radios.
- If each option needs richer content (an icon, description, or badge), use Choicebox instead of plain Radio.

**Behavior**

- Default to the safest option pre-selected, so the field always reads as "configured," never as "empty but required." Only ship with no default when the choice genuinely has consequences and a deliberate, uncoerced pick is wanted.
- `required` belongs on the group, not on a single radio — requiring one lone radio button doesn't make sense.
- Arrow keys move the selection within the group and skip over disabled options; Tab moves focus out of the group to the next field entirely (it doesn't cycle through the radios).

**Content**

- Give the group a Title Case noun label (e.g. "Deployment Region", "Billing Cycle"), rendered as a real `<legend>` or a label tied to the group with `aria-labelledby`.
- Keep option labels parallel in grammar, length, and tone — "Monthly / Yearly", not "Monthly / Pay yearly".
- If an option is disabled, attach a Tooltip explaining why (e.g. "Available on Pro and Enterprise"); an unexplained greyed-out option looks broken.

**Accessibility**

- Wrap the group in `<fieldset>` + `<legend>` so assistive tech announces the group's purpose before reading individual options.
- The standalone/unlabeled Radio primitive must always get an explicit `aria-label` describing the choice — never ship one with no accessible name.
- Never strip the native focus ring (e.g. by dropping `outline-offset` via a CSS override) — keyboard users need to see which option currently has focus.

## Design notes

**Radio dot anatomy (from rendered Tailwind classes in the demo markup):**

- Outer control: `size-4` (16x16px), `rounded-full`, `border border-[var(--radio-color)]`, background `var(--ds-background-100)`.
- Inner filled dot (`::after`): `size-2` (8x8px), `rounded-full`, centered via `top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`, background `var(--radio-color)`, starts at `scale-0` and animates to `scale-100` when checked (`peer-checked:after:scale-100`).
- Transition: outer border/background transition `border-color, background` over `duration-200 ease-in`; inner dot transform transitions `duration-150 ease-in` (dot pop-in is faster than the border/bg change).
- Focus ring: `peer-focus-visible:shadow-[var(--ds-focus-ring)]` (also triggers on a `data-focus-visible-added` state) — uses the shared Geist focus-ring shadow token, not a redrawn outline.

**Color-by-state (all keyed off a local `--radio-color` custom property, set per state):**

- Default (unchecked, enabled): `--radio-color: var(--ds-gray-700)`.
- Hover (unchecked, not active): background `var(--ds-gray-200)`, `--radio-color: var(--ds-gray-900)` — hover only applies when the item is not already checked and not currently pressed (`group-hover:peer-not-checked:peer-not-active:*`).
- Active/pressed: `--radio-color: var(--ds-gray-600)`.
- Checked: `--radio-color: var(--ds-gray-1000)` (fills both the ring border and the inner dot).
- Disabled: text and `--radio-color` both drop to `var(--ds-gray-500)`; container cursor becomes `cursor-not-allowed`.

**Label typography:**

- The text label rendered alongside a radio (in the labelled/`RadioGroupItem` composition) uses `text-[13px]` with the group wrapper as `inline-flex items-center`.
- Disabled label text color: `var(--ds-gray-500)`.

**Layout:**

- Demos wrap multiple `RadioGroupItem`s in a plain flex column: `flex flex-col items-stretch justify-start gap-6 flex-initial` (6-option-gap spacing) or `gap-4` in the required-form variant — the component itself does not appear to enforce the stacking gap; callers supply their own wrapper `div`.
- The standalone example wraps a radio + label in a `flex flex-row items-stretch justify-start gap-2 flex-initial list-none` — used when embedding a single Radio inside a `<li>` row.

**Tokens referenced elsewhere on the page (for cross-component consistency, not necessarily used directly by Radio):** `--ds-gray-100/200/400/500/600/700/900/1000`, `--ds-gray-alpha-100/200/400/500/600`, `--ds-background-100`, `--ds-focus-ring`, `--ds-focus-color`, `--ds-shadow-border`, `--ds-shadow-border-small`, `--ds-blue-300/700/900`, `--ds-amber-800`.

**Motion:** the only animated behavior is the inner dot's scale-in/out (0 → 1, 150ms ease-in) paired with a slightly slower border/background color transition (200ms ease-in) on the outer ring — no bounce, no additional easing curve beyond `ease-in` for both.
