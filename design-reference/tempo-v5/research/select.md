# Select

> "Display a dropdown list of items."

Source: https://vercel.com/geist/select (Vercel Geist Design System). Package: `@vercel/geistcn/components`. Icons package used in examples: `@vercel/geistcn-assets/icons`.

## Sections documented

- **Sizes** — three `<Select>` instances side by side: `size="small"`, default (no size prop), `size="large"`, each populated with three plain `<option>` children (Option 1/2/3).
- **Prefix and suffix** — same three sizes, each `<Select>` given both a `prefix` and a `suffix` prop holding an icon element (`<IconArrowCircleUp />`), no children options shown (demonstrates the icon-decorated closed state).
- **Disabled** — a single disabled `<Select>` with a placeholder, no options, showing the disabled visual/interactive state.
- **Error** — three sizes again, each with an `error` string prop set to "Please select a value.", demonstrating the error/invalid state per size.
- **Label** — a single `<Select>` with a `label` prop ("My label") and a `placeholder`, demonstrating the field-label pattern (label sits above/beside the control, distinct from placeholder).
- **With options** — two selects side by side: one with real `<option value="...">` children (fruit list) and a plain placeholder, the other with the same option list plus `defaultValue="banana"` to show a pre-selected value overriding the placeholder.
- **Required** — a single `<Select>` with `label`, `placeholder`, and the boolean `required` prop, with an eslint-disable comment (`rulesdir/prefer-radio-for-few-static-options`) showing Vercel's internal lint rule nudging away from `<Select>` for very short option sets.
- **Best Practices** — accordion of usage/behavior/accessibility guidance (see below).

Every demo section above the fold except "Best Practices" also renders a "Show code" toggle exposing the JSX source (captured in full below). The page footer additionally shows global doc chrome: a "Was this helpful?" feedback widget, Previous/Next component nav (Search Input → Select → Separator), and the full Components sidebar list (Avatar, Badge, ... Video) — not select-specific, omitted here.

## API

Import:
```tsx
import { Select } from '@vercel/geistcn/components';
import type { JSX } from 'react';
// optional, for prefix/suffix icon slots:
import { IconArrowCircleUp } from '@vercel/geistcn-assets/icons';
```

Composition: `<Select>` is used as a single element taking native `<option>` (and presumably `<optgroup>`, per Best Practices copy) as `children` — it wraps a real `<select>` under the hood rather than exposing a custom listbox/option subcomponent API (no `Select.Option`, no `.Group` static — Best Practices explicitly says "Geist `<Select>` has no `.Group` static", implying you fall back to native `<optgroup>`).

### Props observed across examples

| Prop | Type / values seen | Notes |
|---|---|---|
| `aria-label` | string | Used on every example that lacks a visible `label`, for accessible naming. |
| `label` | string | Visible field label rendered by the component (e.g. `"My label"`, `"Required field"`). |
| `placeholder` | string | Shown as the closed-select text when no value/defaultValue is set (e.g. `"Small"`, `"Select a fruit"`, `"Please select an option"`). |
| `size` | `"small"` \| default (unset = medium/default) \| `"large"` | Three-tier sizing, consistent with other Geist form controls. |
| `prefix` | `ReactNode` (icon element) | Leading decoration slot, e.g. `prefix={<IconArrowCircleUp />}`. |
| `suffix` | `ReactNode` (icon element) | Trailing decoration slot, e.g. `suffix={<IconArrowCircleUp />}`. |
| `disabled` | boolean | Disables interaction; shown paired with a placeholder rather than options. |
| `error` | string | Passing a string switches the control into error/invalid visual state AND is presumably rendered as the error message; value used in examples: `"Please select a value."`. |
| `defaultValue` | string | Matches an `<option value="...">`; pre-selects that option, uncontrolled. |
| `required` | boolean | Marks the field required (paired with `label` in the example, not `aria-label`). |
| `children` | `<option>` elements (optionally `<optgroup>`) | Standard native select children; `value` + text content per option. |

### Minimal usage snippets (from the page)

Sizes:
```tsx
<Select aria-label="Small" placeholder="Small" size="small">
  <option>Option 1</option>
  <option>Option 2</option>
  <option>Option 3</option>
</Select>

<Select aria-label="Default" placeholder="Default">
  <option>Option 1</option>
  <option>Option 2</option>
  <option>Option 3</option>
</Select>

<Select aria-label="Large" placeholder="Large" size="large">
  <option>Option 1</option>
  <option>Option 2</option>
  <option>Option 3</option>
</Select>
```

Prefix and suffix (no options, three sizes):
```tsx
<Select
  aria-label="Small"
  placeholder="Small"
  prefix={<IconArrowCircleUp />}
  size="small"
  suffix={<IconArrowCircleUp />}
/>

<Select
  aria-label="Default"
  placeholder="Default"
  prefix={<IconArrowCircleUp />}
  suffix={<IconArrowCircleUp />}
/>

<Select
  aria-label="Large"
  placeholder="Large"
  prefix={<IconArrowCircleUp />}
  size="large"
  suffix={<IconArrowCircleUp />}
/>
```

Disabled:
```tsx
<Select
  aria-label="Disabled"
  disabled
  placeholder="Disabled with placeholder"
/>
```

Error (three sizes):
```tsx
<Select
  aria-label="Small with error"
  error="Please select a value."
  placeholder="Small"
  size="small"
/>

<Select
  aria-label="Default with error"
  error="Please select a value."
  placeholder="Default"
/>

<Select
  aria-label="Large with error"
  error="Please select a value."
  placeholder="Large"
  size="large"
/>
```

Label:
```tsx
<Select label="My label" placeholder="With label" />
```

With options / default value:
```tsx
<Select aria-label="Fruit" placeholder="Select a fruit">
  <option value="apple">Apple</option>
  <option value="orange">Orange</option>
  <option value="banana">Banana</option>
  <option value="grape">Grape</option>
</Select>

<Select
  aria-label="Fruit with default value"
  defaultValue="banana"
  placeholder="With default value"
>
  <option value="apple">Apple</option>
  <option value="orange">Orange</option>
  <option value="banana">Banana</option>
  <option value="grape">Grape</option>
</Select>
```

Required:
```tsx
{/* eslint-disable-next-line rulesdir/prefer-radio-for-few-static-options */}
<Select
  label="Required field"
  placeholder="Please select an option"
  required
>
  <option value="option1">Option 1</option>
  <option value="option2">Option 2</option>
  <option value="option3">Option 3</option>
</Select>
```

## Best practices

(Paraphrased from the page's Best Practices accordion.)

- **Reach for a plain `<Select>` only for short, fixed lists** (roughly under ten items) where typing to filter wouldn't help; once the list gets long or benefits from search, move to Combobox instead.
- **Use MultiSelect, not `<Select>`, when more than one value can be chosen at once**; if the choice is really just 2-3 mutually exclusive options, prefer a Switch-style segmented control over a dropdown.
- **For long lists, group with native `<optgroup>`** — Geist's `<Select>` intentionally has no `.Group` subcomponent, so grouping is the browser-native pattern, not a custom API.
- **Keep option casing/wording consistent and branded** — options read as Title Case when they're short, and should match canonical product/brand names exactly (e.g. "Next.js", never "NextJS"); don't mix registers within one list.
- **Label with a short Title Case noun** (e.g. "Framework", "Region") and pass it straight through the `label` prop rather than building a separate `<label>` element.
- **Placeholder text should describe the action, not restate the label or use vague verbs** — "Select a framework" is right; "Choose one...", "Pick", or repeating the label are wrong.
- **Validate on blur, not on every keystroke/change**, and surface errors by passing a string to the `error` prop; error copy should name the field and end with a period, e.g. "Select a framework."
- **Never wrap a labelled `<Select>` in a Tooltip** — doing so breaks the label's accessible announcement; put any supplementary hint on a separate sibling icon button instead.

## Design notes

- Three-tier `size` scale (`small` / default / `large`) is consistent with other Geist form controls on this doc set (Input, Combobox, etc.) — exact pixel heights weren't present in visible markup/flight text captured (no literal `32px`/`36px`/`40px` or `--ds-*` token strings surfaced in the scraped HTML/JSON); confirm concrete height/radius/token values against the live rendered DOM or Geist's CSS source if pixel-exact values are required.
- `prefix` / `suffix` are first-class props taking arbitrary icon nodes (not just a boolean/variant flag), matching the icon-slot pattern used elsewhere in Geist inputs.
- `error` is a **string prop**, not a boolean + separate message node — passing any string simultaneously (a) flips the control to its invalid/error visual state and (b) supplies the message text, in one prop.
- The component composes over the native `<select>` element: `children` are literal `<option>` (and, per Best Practices, `<optgroup>`) tags with real `value` attributes, not a custom `Select.Item`/listbox JSX API — implies (for a Radix rebuild) either wrapping native `<select>` styling directly, or building a Radix `Select.Root`/`Select.Item` primitive underneath while preserving this same declarative "pass `<option>` children" authoring ergonomic if API parity matters.
- Code samples are wrapped in a responsive demo container: `flex relative min-w-px max-w-full flex-col sm:flex-row sm:flex-wrap flex-1` (multi-size rows) with each control in `flex relative min-w-px max-w-full flex-col items-start flex-1` — i.e. size/variant demos lay out as an equal-width row on `sm:` and up, stacked on mobile.
- An internal ESLint rule surfaces in two examples: `rulesdir/prefer-radio-for-few-static-options`, disabled inline — signals Vercel's own linting nudges engineers toward Radio (or similar) instead of `<Select>` when the option count is small, reinforcing the Best Practices "under ~10 items... switch" guidance.
- No motion/animation behavior was described in the captured page text (the syntax-highlighted code viewer itself is `data-theme="dark"` regardless of site theme, per the raw flight payload — that's an artifact of the docs' code-block renderer, not the Select component).
