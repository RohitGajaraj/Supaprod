# Choicebox

> "A larger form of Radio or Checkbox, where the user has a larger tap target and more details."

Source: https://vercel.com/geist/choicebox — fetched via `curl` (server-rendered HTML, 260.5KB), prose parsed from raw HTML, code examples decoded from the Next.js flight payload (`self.__next_f.push` chunks).

## Sections documented

- **Single-select** — a `ChoiceboxGroup` with `type="radio"`; two tiles ("Pro Trial" / "Pro"), one selected by default via controlled `value` state. Shows the base radio-tile pattern in a row layout (`listClassName="flex-row"`).
- **Multi-select** — the same group shape with `type="checkbox"` and an array `value`/`setValue`; demonstrates additive (non-exclusive) selection.
- **Disabled** — two side-by-side groups: one with the whole group disabled (`disabled` prop on `ChoiceboxGroup`), one with a single tile disabled (`disabled` prop on one `ChoiceboxGroupItem` inside an otherwise-enabled group). Both use `showLabel` to render the visible group label instead of only an `aria-label`.
- **Custom content** — a radio group where each `ChoiceboxGroupItem` has JSX children (here a `Badge`) that only render/are relevant once that option is selected — demoed via a `Badge` centered in a `div` inside the item, illustrating the `choicebox-content` slot that appears below the title/description row when the tile is checked.
- **Best Practices** (accordion, four subsections: When to use / Behavior / Content / Accessibility) — see paraphrased rules below.

Every demo has a "Show code" toggle revealing the exact JSX; on this page all four toggles' code was recovered.

## API

Components:

- `ChoiceboxGroup` — the container/fieldset-equivalent. Renders as `role="radiogroup"` (single-select) or `role="group"` with `aria-multiselectable="true"` (multi-select), not an actual `<fieldset>`/`<legend>` — group naming is via `aria-label` (or a rendered label element when `showLabel` is set).
- `ChoiceboxGroupItem` — one tile. Renders as a `<label>` wrapping a visually-hidden native `<input type="radio">` or `<input type="checkbox">` (`class="sr-only peer"`), so keyboard/AT semantics come from the real input while the visual state is driven by CSS `:checked`/`peer-checked` selectors.

Props seen in the code examples:

`ChoiceboxGroup`

- `label: string` — accessible name; also visible text when `showLabel` is set.
- `showLabel?: boolean` — renders the label visibly (used in the Disabled demo); omitted elsewhere, so the label is `aria-label`-only by default.
- `type: 'radio' | 'checkbox'` — selection mode (single vs multi).
- `value: string | string[]` — controlled value; `string` for `type="radio"`, `string[]` for `type="checkbox"`.
- `onChange: (value) => void` — matches the `value` shape for the given `type`.
- `disabled?: boolean` — disables every item in the group.
- `listClassName?: string` — className applied to the internal `<ul>`; used in every example as `"flex-row"` to lay tiles out horizontally instead of the default stacked column.

`ChoiceboxGroupItem`

- `title: string` — bold, Title Case label (rendered `text-sm font-medium`).
- `description: string` — sentence-case supporting copy (rendered `text-sm`, same size as title but regular weight).
- `value: string` — the option's value, matched against the group's controlled `value`.
- `disabled?: boolean` — disables this one tile (overrides group-level enabled state; other tiles stay interactive).
- `children?: ReactNode` — optional custom content rendered in the `choicebox-content` region beneath the title/description, shown only while that item's box has content (used for a centered `Badge` in the Custom Content demo).

Usage snippets (from the recovered flight payload, trimmed to the essential shape):

```tsx
"use client";
import { ChoiceboxGroup, ChoiceboxGroupItem } from "@vercel/geistcn/components";
import { useState, type JSX } from "react";

export function Component(): JSX.Element {
  const [value, setValue] = useState("trial");
  return (
    <ChoiceboxGroup
      label="select a plan"
      onChange={setValue}
      type="radio"
      value={value}
      listClassName="flex-row"
    >
      <ChoiceboxGroupItem description="Free for two weeks" title="Pro Trial" value="trial" />
      <ChoiceboxGroupItem description="Get started now" title="Pro" value="pro" />
    </ChoiceboxGroup>
  );
}
```

```tsx
// Multi-select: swap type + value shape
const [value, setValue] = useState([] as string[]);
<ChoiceboxGroup
  type="checkbox"
  value={value}
  onChange={setValue}
  listClassName="flex-row"
  label="select a plan"
>
  ...
</ChoiceboxGroup>;
```

```tsx
// Disabled — whole group vs single item
<ChoiceboxGroup disabled label="Choicebox group disabled" onChange={setValue} showLabel type="radio" value={value} listClassName="flex-row">
  <ChoiceboxGroupItem description="Free for two weeks" title="Pro Trial" value="trial" />
  <ChoiceboxGroupItem description="Get started now" title="Pro" value="pro" />
</ChoiceboxGroup>

<ChoiceboxGroup label="Single input disabled" onChange={setValue2} showLabel type="checkbox" value={value2} listClassName="flex-row">
  <ChoiceboxGroupItem description="Free for two weeks" disabled title="Pro Trial" value="trial" />
  <ChoiceboxGroupItem description="Get started now" title="Pro" value="pro" />
</ChoiceboxGroup>
```

```tsx
// Custom content — children rendered when selected
import { Badge, ChoiceboxGroup, ChoiceboxGroupItem } from "@vercel/geistcn/components";

<ChoiceboxGroup
  label="select a plan"
  onChange={setValue}
  type="radio"
  value={value}
  listClassName="flex-row"
>
  <ChoiceboxGroupItem description="Free for two weeks" title="Pro Trial" value="trial">
    <div className="flex justify-center p-2">
      <Badge variant="trial">Trial</Badge>
    </div>
  </ChoiceboxGroupItem>
  <ChoiceboxGroupItem description="Get started now" title="Pro" value="pro">
    <div className="flex justify-center p-2">
      <Badge variant="blue">Pro</Badge>
    </div>
  </ChoiceboxGroupItem>
</ChoiceboxGroup>;
```

## Best practices (paraphrased)

**When to use**

- Reach for it when a choice benefits from a bigger tap target plus supporting detail — a framework picker, a plan comparison, a deployment region with a latency figure.
- Single-select for mutually exclusive options, multi-select for additive ones — never mix both modes in one group.
- Keep it to 4-6 tiles max; beyond that, use `Select` or `Combobox` so a single field doesn't push the page into a long scroll. If a tile is just a plain label with no description, use plain `Radio` instead.

**Behavior**

- The entire tile is the hit target and focus target — clicking/tapping anywhere on it selects it. Never nest an interactive button or link inside a tile; it will steal the click.
- The selection indicator (check or filled dot) in the corner is the real signal — don't rely on the border highlight alone, it's not enough contrast on washed-out screens.
- A disabled tile needs a `Tooltip` explaining why (e.g. "Available on Pro"). An unexplained faded tile reads as a bug, not an intentional restriction.

**Content**

- Keep titles parallel: one Title Case title and one sentence-case description per tile, description ending in a period.
- Don't let the description just restate the title — it should carry the differentiating fact (e.g. "$20/mo · 100 GB bandwidth").
- Icons paired with a title are decorative; if an icon is the only label, give the tile its own `aria-label` naming the choice.

**Accessibility**

- Although it doesn't render a literal `<fieldset>`/`<legend>` in the markup captured, treat the group as one — the underlying native radio/checkbox inputs plus `role="radiogroup"`/`role="group"` + `aria-label` (or `aria-multiselectable`) is what exposes it as a single group to assistive tech.
- Arrow keys move focus within a single-select group; Space toggles a multi-select item — don't intercept or override these with custom key handlers.
- Color alone must never be the selection signal — pair the highlight border with the corner check/dot so colorblind users can still tell what's active.

## Design notes (observed values)

- **DOM shape**: `ChoiceboxGroup` → `<div role="radiogroup" aria-label aria-multiselectable aria-required>` → `<ul class="flex ... list-none m-0 p-0 flex-row|flex-col">` → one `<label>` per `ChoiceboxGroupItem`, each wrapping a visually-hidden `<input type="radio"|"checkbox" class="sr-only peer">`.
- **Group selection mode markers**: `role="radiogroup"` + `aria-multiselectable="false"` for `type="radio"`; `role="group"` + `aria-multiselectable="true"` for `type="checkbox"`.
- **Tile (`<label>`) classes**: `flex-1 flex flex-col items-stretch justify-start cursor-pointer group/choicebox transition-colors duration-150 ease-in border border-[var(--ds-gray-400)] overflow-hidden rounded-md`.
  - Hover (enabled, unchecked): `border-[var(--ds-gray-500)]` + `bg-[var(--ds-gray-100)]`.
  - Checked: `border-[var(--ds-blue-600)]` (hover on checked bumps to `!border-[var(--ds-blue-600)]`, same color, forced).
  - Focus-within: `outline-2 outline-offset-2 outline-indigo-600` on the group.
  - Disabled tile: `cursor-not-allowed` (no group class, no hover states applied).
  - Radius: `rounded-md`. Border width: 1px (`border`).
- **Option row** (`data-slot="choicebox-group-item-option"`): `flex flex-row items-center justify-between gap-6 p-3` — 12px padding all sides, 24px gap between the title/description block and the radio/checkbox indicator.
  - Checked background: `bg-[var(--ds-blue-100)]`, hover-while-checked bumps to `!bg-[var(--ds-blue-200)]`.
  - When custom content is present and non-empty, checked state also adds `border-b border-[var(--ds-blue-600)]` to separate the option row from the content region below.
- **Title/description block** (`data-slot="choicebox-group-item-title-description"`): `flex flex-col gap-1` (4px stack).
  - Title: `text-sm leading-5 font-medium` (14px/20px), color `var(--ds-gray-900)`-equivalent default, `var(--ds-blue-900)` when checked, `var(--ds-gray-500)` when disabled.
  - Description: `text-sm leading-5` (same 14px/20px size, regular weight), `var(--ds-gray-900)` default, `var(--ds-blue-900)` when checked, `var(--ds-gray-500)` when disabled. Auto-hidden (`[&:empty]:hidden`) if no description passed.
- **Selection indicator**: a native input (`sr-only peer`) plus a sibling `<span aria-hidden="true">` styled as a `size-4` (16px) circle — `rounded-full border border-[--radio-color] bg-[var(--ds-background-100)]`, with an `after:` pseudo-element (`size-2`, 8px, `rounded-full`, `bg-[--radio-color]`) that scales from 0 to 1 (`after:scale-0` → `peer-checked:after:scale-100`) over `duration-150 ease-in`. This is a filled-dot indicator (works identically for both radio and checkbox visuals here), not a checkmark glyph — the "check or filled dot" language in Best Practices maps to this literal dot.
  - Color token `--radio-color` cascades: default `var(--ds-gray-500)`, hover `var(--ds-gray-700)`/`var(--ds-gray-900)`, checked `var(--ds-blue-900)`, active `var(--ds-blue-900)`.
  - Focus ring: `shadow-[var(--ds-focus-ring)]` applied via `peer-focus-visible`.
- **Content region** (`class="choicebox-content"`): appears below the option row when the item has children; its checkbox-checked accent color is remapped via `[--checkbox-color:var(--ds-blue-900)]`.
- **Layout control**: `listClassName` is the only lever shown for row vs column layout — every demo passes `"flex-row"`; the implied default (unset) is column/stacked (`flex-col`), consistent with "cap at 4-6 tiles... so the page doesn't scroll".
- **Group-level label**: `showLabel` toggles between an invisible `aria-label`-only name and a rendered label element — used in the Disabled demo to visibly title the two groups ("Choicebox group disabled" / "Single input disabled").
- **Motion**: color/background transitions are `transition-colors duration-150 ease-in` on the tile; the dot's fill uses `transition-transform duration-150 ease-in`. No transform/scale animation on the tile itself, no layout shift on select — the only visible motion is the color fade and the dot's scale-in.
- **Tokens referenced**: `--ds-gray-100/400/500/700/900`, `--ds-blue-100/200/600/900`, `--ds-background-100`, `--ds-focus-ring`, `--ds-shadow-border` (used elsewhere on the page, e.g. theme switcher, not the tile itself). All colors are CSS custom properties (`var(--ds-*)`), no hardcoded hex in the tile markup itself (hex values only appear inside the syntax-highlighted code-block spans, unrelated to the actual component styling).
