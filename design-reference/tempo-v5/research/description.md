# Description

> "Displays a brief heading and subheading to communicate any additional information or context a user needs to continue."

## Sections documented

- **Default** — a `<Description>` with a `title` ("Section Title") and `content` ("Data about this section.") stacked as a label/value pair, plus a "Show code" toggle revealing the JSX source.
- **Text right** — the same title/content pair but with the `right` boolean prop set, right-aligning the content relative to the title (used to show the value-on-the-right layout variant, e.g. for a definition list where values line up on the trailing edge).
- **Ellipsis** — the same title/tooltip pair but `content` is a long lorem-ipsum paragraph and the `ellipsis` boolean prop is set, demonstrating single-line truncation of long values with an ellipsis rather than wrapping.
- **Best Practices** — an accordion of usage guidance covering when to use the component, its underlying accessibility semantics, title/content casing conventions, when to use the `tooltip` prop, and a rule against putting interactive controls in the title slot.

Only three demo variants are shown on this page (Default, Text right, Ellipsis) — there is no separate "Sizes," "Types," "States," or "Variants" section beyond these three examples plus Best Practices.

## API

Single component, imported as:

```tsx
import { Description } from "@vercel/geistcn/components";
```

### `<Description>` props (observed across all three code examples)

| Prop       | Type                                            | Observed values                                           | Notes                                                                                                     |
| ---------- | ----------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `title`    | `string`                                        | `"Section Title"`                                         | The label/key half of the pair. Rendered as the definition term.                                          |
| `content`  | `string`                                        | `"Data about this section."`, long lorem-ipsum string     | The value half of the pair. Rendered as the definition description.                                       |
| `tooltip`  | `string`                                        | `"Additional context about what this section refers to."` | Optional. Adds a tooltip (likely an info affordance next to the title) with a one-sentence clarification. |
| `right`    | boolean flag (no value passed — presence-based) | present in the "Text right" example                       | Right-aligns the content relative to the title.                                                           |
| `ellipsis` | boolean flag (no value passed — presence-based) | present in the "Ellipsis" example                         | Truncates long `content` to a single line with an ellipsis instead of wrapping.                           |

### Minimal usage (Default)

```tsx
import { Description } from "@vercel/geistcn/components";
import type { JSX } from "react";

export function Component(): JSX.Element {
  return (
    <Description
      content="Data about this section."
      title="Section Title"
      tooltip="Additional context about what this section refers to."
    />
  );
}
```

### Text right variant

```tsx
import { Description } from "@vercel/geistcn/components";
import type { JSX } from "react";

export function Component(): JSX.Element {
  return (
    <Description
      content="Data about this section."
      right
      title="Section Title"
      tooltip="Additional context about what this section refers to."
    />
  );
}
```

### Ellipsis variant (long content)

```tsx
import { Description } from "@vercel/geistcn/components";
import type { JSX } from "react";

export function Component(): JSX.Element {
  return (
    <Description
      content="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque sed venenatis libero. Phasellus consectetur turpis ac est pulvinar finibus. Mauris non tellus pretium, vehicula lectus sed, iaculis ex. Integer eu aliquet turpis. Cras sem nulla, commodo ut libero id, suscipit pulvinar lorem."
      ellipsis
      title="Section Title"
      tooltip="Additional context about what this section refers to."
    />
  );
}
```

No other subcomponents, compound-component exports, or ref/imperative APIs are shown for this component.

## Best practices (paraphrased)

- **When to use**: reach for `Description` for definition-list style metadata — a short Title Case key paired with a single value (their examples: Last Deployed, Region, Plan). It is not the right tool for inline help text under a form field — use the input's own helper-text slot for that instead.
- **Accessibility / semantics**: the component renders as a real HTML definition list (`<dl>`/`<dt>`/`<dd>`), so screen readers announce each title/content pair as a proper key-value definition. Don't wrap it in extra paragraph tags or other markup that would break that list structure.
- **Casing convention**: the `title` should be a Title Case noun phrase (e.g. "Last Deployed", "Build Duration"). The `content` value should be sentence case, except when the value is a literal identifier, ID, or timestamp that must be preserved exactly as-is (don't re-case those).
- **When to add a tooltip**: only pass `tooltip` when the title alone could be ambiguous and a single clarifying sentence would resolve that ambiguity. Tooltip copy should be sentence case and end with a period.
- **Don't put controls in the title**: buttons, menus, or links should live in the content slot (`<dd>`) or in the surrounding layout — never in the title slot (`<dt>`), which should remain a plain label.

## Design notes

- Import path: `@vercel/geistcn/components` (the `geistcn` package, i.e. the shadcn-style Geist component distribution), named export `Description`.
- Underlying DOM: renders a definition list — `<dl>` wrapping a `<dt>` (title) and `<dd>` (content) — confirmed directly in the Best Practices copy ("Geist renders `<dl>`/`<dt>`/`<dd>`").
- Two boolean layout/behavior modifiers observed as bare JSX attributes (no value): `right` (right-aligns content vs. title) and `ellipsis` (single-line truncation of long content).
- No color tokens, size tokens, radii, or motion behavior were visible in the page's prose or in the captured code/text — the flight payload for this page did not expose a syntax-highlighted rendering of raw CSS/token values beyond the JSX source itself, and no separate "Design notes"/token table section exists on this page. Treat spacing/typography as inherited from the same text and label tokens used elsewhere in Geist (not independently specified here); an engineer re-implementing this should default to the same key/value label pattern used by adjacent Geist components (e.g. Label, Fieldset) rather than inventing new tokens.
- No explicit size variants (small/medium/large) or state variants (hover/disabled/error) are documented for this component — it is a purely presentational label+value pair with the two structural modifiers above.

## Notes on extraction

- Fetched HTML was ~149KB, single `<script>` tag containing one `self.__next_f.push([1, "..."])` Next.js flight payload (not the typical multi-chunk pattern) — decoded via `json.loads` on the array literal, then the embedded JSX source was pulled from `__rawString__:` backtick-delimited template literals within that payload (handles escaped backticks).
- All three demo code examples were successfully extracted verbatim from `__rawString__` blocks (the same source shown to the user behind the page's "Show code" toggles).
- No 404 or content gap encountered — this is the correct, live page for the `description` slug at time of fetch.
