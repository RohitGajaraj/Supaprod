# Input

> "Retrieve text input from a user." (Geist page one-liner)

Source: https://vercel.com/geist/input — package: `@vercel/geistcn/components` (exports `Input` and `SearchInput`); icon assets from `@vercel/geistcn-assets/icons`.

## Sections documented

1. **Default** — three `Input`s side by side demonstrating the three sizes: `size="small"`, default (medium), `size="large"`.
2. **Prefix and suffix** — five stacked examples: icon prefix only, icon suffix only, string prefix + string suffix (`"https://"` / `".com"`), icon prefix/suffix with `prefixStyling={false}` / `suffixStyling={false}` (removes the affordance chrome), and a string prefix with an icon suffix that also drops its container via `suffixContainer={false}` combined with `suffixStyling={false}`.
3. **Disabled** — six variants of the disabled state: bare disabled with placeholder, disabled with a `value` (not just a placeholder), disabled with icon prefix, disabled with icon suffix, disabled with string prefix+suffix, disabled with unstyled (`prefixStyling`/`suffixStyling` false) icon prefix+suffix.
4. **Search** — a `SearchInput` demo wired to `useState`, controlled `value`/`onChange`, plain search box (no command-palette affordance).
5. **⌘K** — same `SearchInput` pattern but with the `cmdk` boolean prop set, which presumably renders the ⌘K keyboard-shortcut hint/affordance inside the field.
6. **Error** — three `Input`s (`size="small"`, `"medium"`, `"large"`) each given an `error="An error message."` string prop with a placeholder styled like an email (`long-error@gmail.com`), showing the error state at every size.
7. **Label** — a single `Input` with a `label="Label"` prop demonstrating the built-in label rendering (as opposed to an externally-associated `<label>`).
8. **Rounded prefix and suffix** — an `Input` with `rounded` boolean prop plus string `prefix="www."` and `suffix=".com"`, showing the pill/rounded treatment applied to the prefix/suffix segments.
9. **Rounded prefix and suffix without styling** — same `rounded` layout, but with `prefixStyling={false}` and `suffixStyling={false}` added, showing the rounded shape without the chrome/background styling on the prefix and suffix segments.
10. **Best Practices** — an accordion of guidance grouped under four headings: When to use, Behavior, Content, Accessibility (full text captured below, paraphrased).

Note: the page nav/sidebar (scraped from the surrounding shell, not the component doc itself) lists sibling text-entry-adjacent components: Textarea, Combobox — both referenced directly inside the Best Practices copy as the components to reach for instead of Input in certain cases.

## API

### `<Input>` — observed props (from all code examples)

| Prop              | Type / values seen                                  | Notes                                                                                                                              |
| ----------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `aria-labelledby` | string                                              | used in nearly every undecorated example instead of a visible label                                                                |
| `label`           | string                                              | renders a built-in associated label (`"Label"` example); best-practices notes it requires `id` when passed as a string (see below) |
| `placeholder`     | string                                              | example value, never an instruction (content rule)                                                                                 |
| `value`           | string                                              | controlled value, shown even while `disabled`                                                                                      |
| `size`            | `"small"` \| default (medium, no prop) \| `"large"` | affects error demo and default demo                                                                                                |
| `disabled`        | boolean                                             | combines with placeholder, value, prefix, suffix                                                                                   |
| `error`           | string                                              | error message text; presence of the prop triggers the error visual state                                                           |
| `prefix`          | `ReactNode` (icon component) or `string`            | e.g. `<IconArrowCircleUp />`, `"https://"`, `"vercel/"`, `"www."`                                                                  |
| `suffix`          | `ReactNode` (icon component) or `string`            | e.g. `<IconArrowCircleUp />`, `".com"`                                                                                             |
| `prefixStyling`   | boolean (default true)                              | `false` strips the chrome/background styling from the prefix slot                                                                  |
| `suffixStyling`   | boolean (default true)                              | `false` strips the chrome/background styling from the suffix slot                                                                  |
| `suffixContainer` | boolean (default true)                              | `false` removes the suffix's wrapping container entirely (seen combined with `suffixStyling={false}`)                              |
| `rounded`         | boolean                                             | applies a rounded/pill treatment to the prefix/suffix segments                                                                     |

Type name referenced in Best Practices/Accessibility copy: `InputPropsWithStringLabelAndId` — a union member of the `Input` prop types that requires `id` whenever `label` is passed as a plain string (so the label element can be associated for screen readers). Implies the full prop type is a discriminated union keyed on how the label is supplied (string+id vs. custom label node vs. `aria-labelledby`).

### `<SearchInput>` — observed props

| Prop          | Type / values seen | Notes                                                 |
| ------------- | ------------------ | ----------------------------------------------------- |
| `value`       | string             | controlled                                            |
| `onChange`    | `(e) => void`      | standard change handler, reads `e.target.value`       |
| `placeholder` | string             | e.g. `"Enter some text..."`                           |
| `cmdk`        | boolean            | toggles the ⌘K palette-style affordance/shortcut hint |

### Minimal usage snippets (as documented)

```tsx
// Sizes
import { Input } from "@vercel/geistcn/components";

<div className="flex flex-col md:flex-row items-start justify-between gap-4 flex-initial">
  <Input aria-labelledby="Demo input" placeholder="Small" size="small" />
  <Input aria-labelledby="Demo input" placeholder="Default" />
  <Input aria-labelledby="Demo input" placeholder="Large" size="large" />
</div>;
```

```tsx
// Prefix / suffix combinations
import { Input } from '@vercel/geistcn/components';
import { IconArrowCircleUp } from '@vercel/geistcn-assets/icons';

<Input aria-labelledby="Demo" placeholder="Default" prefix={<IconArrowCircleUp />} />
<Input aria-labelledby="Demo" placeholder="Default" suffix={<IconArrowCircleUp />} />
<Input aria-labelledby="Demo" placeholder="Default" prefix="https://" suffix=".com" />
<Input
  aria-labelledby="Demo"
  placeholder="Default"
  prefix={<IconArrowCircleUp />}
  prefixStyling={false}
  suffix={<IconArrowCircleUp />}
  suffixStyling={false}
/>
<Input
  aria-labelledby="Demo"
  placeholder="Default"
  prefix="vercel/"
  suffix={<IconArrowCircleUp />}
  suffixContainer={false}
  suffixStyling={false}
/>
```

```tsx
// Disabled states
<Input aria-labelledby="Demo" disabled placeholder="Disabled with placeholder" />
<Input aria-labelledby="Demo" disabled value="Disabled with value" />
<Input aria-labelledby="Demo" disabled placeholder="Disabled with prefix" prefix={<IconArrowCircleUp />} />
<Input aria-labelledby="Demo" disabled placeholder="Disabled with suffix" suffix={<IconArrowCircleUp />} />
<Input aria-labelledby="Demo" disabled placeholder="Disabled with prefix and suffix" prefix="https://" suffix=".com" />
<Input
  aria-labelledby="Demo"
  disabled
  placeholder="Disabled with prefix and suffix"
  prefix={<IconArrowCircleUp />}
  prefixStyling={false}
  suffix={<IconArrowCircleUp />}
  suffixStyling={false}
/>
```

```tsx
// Search
import { SearchInput } from "@vercel/geistcn/components";
import { useState } from "react";

const [value, setValue] = useState("");
<SearchInput
  onChange={(e) => setValue(e.target.value)}
  placeholder="Enter some text..."
  value={value}
/>;
```

```tsx
// ⌘K variant
<SearchInput
  cmdk
  onChange={(e) => setValue(e.target.value)}
  placeholder="Enter some text..."
  value={value}
/>
```

```tsx
// Error, all sizes
<Input aria-labelledby="Demo input" error="An error message." placeholder="long-error@gmail.com" size="small" />
<Input aria-labelledby="Demo input" error="An error message." placeholder="long-error@gmail.com" size="medium" />
<Input aria-labelledby="Demo input" error="An error message." placeholder="long-error@gmail.com" size="large" />
```

```tsx
// Label
<Input aria-labelledby="Demo input" label="Label" placeholder="Label" />
```

```tsx
// Rounded prefix/suffix
<Input aria-labelledby="Demo" placeholder="Label example" prefix="www." rounded suffix=".com" />

// Rounded, unstyled
<Input
  aria-labelledby="Demo"
  placeholder="Label example"
  prefix="www."
  prefixStyling={false}
  rounded
  suffix=".com"
  suffixStyling={false}
/>
```

### Composition patterns observed

- Icon affordances go through a shared icon-asset package (`@vercel/geistcn-assets/icons`), not raw SVGs — same icon component (`IconArrowCircleUp`) reused as both prefix and suffix across examples.
- `prefix`/`suffix` accept either a string (rendered as plain text, e.g. protocol/domain fragments) or a React node (icon), sharing one slot API.
- The styling and container are independently toggleable per side (`prefixStyling`, `suffixStyling`, `suffixContainer`), so a consumer can keep the slot but drop the visual chrome, or drop the slot's wrapper entirely.
- `SearchInput` is a distinct, purpose-built component (not `Input` with a `type="search"` prop) — fully controlled, and its ⌘K affordance is a single boolean (`cmdk`), not a separate composed component.
- No `Textarea` or `Combobox` code is shown on this page — they're referenced only in prose as the components to use instead when the input needs multi-line or filtered-list-from-known-values behavior.

## Best practices (paraphrased)

**When to use**

- Use `Input` for a single line of free-form text (names, domains, tokens).
- Move to `Textarea` as soon as the value could wrap across multiple lines.
- Move to `Combobox` when the value should come from a known, filterable list rather than open text.
- For an inline search box, use the dedicated `search`-style variant (i.e. `SearchInput`) with a placeholder scoped to what's being searched (e.g. "Search projects") — don't repurpose it for an unrelated form field.

**Behavior**

- Validate on blur rather than on every keystroke, and surface the failure by passing a message string to `error`.
- Trim leading/trailing whitespace before submit so equivalent values (`" example.com"` vs `"example.com"`) don't diverge.
- Keep the field focusable while an async save is in flight; only reach for `disabled` when input is genuinely impossible, and pair it with a loading indicator.
- Don't wrap a labelled `Input` in a tooltip for extra explanation — put that explainer on a separate, adjacent icon button so the field's accessible label isn't obscured.

**Content**

- Labels are short, Title Case nouns ("Project Name", "Domain", "Environment Variable Name").
- Placeholders show a realistic example value ("my-awesome-project", "example.com") — never an instruction like "Enter your project name".
- Helper text is one sentence, sentence case, ending in a period, rendered as a sibling element wired via `aria-describedby`.
- Validation messages name the field and the specific constraint, end in a period, and avoid softening language like "please" (e.g. "Project name is required.", "Code must be 6 digits.").

**Accessibility**

- If you pass `label` as a plain string, you must also pass `id` — the type system enforces this (the `InputPropsWithStringLabelAndId` union won't compile otherwise) because without it screen readers can't associate the label with the field.
- For an icon-only affordance living next to an input, use a circular icon button with an explicit `aria-label` rather than a bare unlabeled icon.
- A `SearchInput`'s placeholder should name its scope (e.g. "Search projects") so its purpose is clear without relying on surrounding visual context.

## Design notes

- **Sizes**: three discrete sizes are exposed via the `size` prop — `"small"`, an unnamed default (medium), and `"large"`. No pixel heights were present in the captured markup/JSX (the demo renders through the compiled `Component` package, not raw class names) — treat medium as the base and confirm exact px heights (commonly 32/36/40 in Geist-family components) against the live rendered DOM or the shipped package source before hard-coding.
- **Slots**: `prefix`/`suffix` is a single flexible slot accepting a string or a node; three independent booleans govern its visual treatment — `prefixStyling`/`suffixStyling` (chrome/background) and `suffixContainer` (wrapper presence) — meaning the internal anatomy is: input row → optional prefix container (styled or not) → text field → optional suffix container (styled or not, and its container itself removable).
- **Rounded**: a single boolean (`rounded`) switches the prefix/suffix segment shape from the default (presumably square/inline) to a pill/rounded treatment; it composes with the styling-off variant, so rounding and chrome-removal are orthogonal.
- **Error state**: driven purely by passing a string to `error` — no separate boolean; the presence of a truthy string is what flips the visual state, and it was demonstrated at all three sizes.
- **Disabled state**: `disabled` is a plain boolean that composes with every other variant shown (placeholder-only, with a value, with prefix, with suffix, with both, and with unstyled prefix/suffix) — the component doesn't render a distinct disabled-with-value visual differently from disabled-with-placeholder beyond the standard disabled treatment.
- **Label**: `label` renders as a built-in element (not left to the consumer to compose externally); this is why the type system requires `id` alongside a string `label` — internally it likely renders a `<label htmlFor={id}>`.
- **SearchInput vs Input**: `SearchInput` is a sibling component, not a variant/prop of `Input` — it owns its own controlled-value contract and its own `cmdk` boolean for the ⌘K hint, rather than sharing `Input`'s `type` or `variant` prop space.
- **Import paths**: components from `@vercel/geistcn/components`; icons from the separate `@vercel/geistcn-assets/icons` package — icons are not bundled with the component package.
- **No CSS custom properties, class names, or color tokens** (e.g. `--ds-*`, `text-label-14`) were present in the captured JSX/code examples — the compiled preview renders through the shipped component's own internal styling, so token-level values (fill colors for error/focus states, exact radii, spacing) are not visible from this page's source and must be sourced from the installed package's CSS/JS or from a live-rendered DOM inspection.
- **No motion behavior** was described or evidenced in the captured code/prose for this component.
