# Text With Copy Button

> "Display text alongside a button that copies the text to the clipboard."

Source: https://vercel.com/geist/text-with-copy-button (Geist, Vercel's design system). Fetched via raw HTML + Next.js flight payload (`self.__next_f.push`) decode — no browser used.

## Sections documented

- **Default** — the base pattern: a piece of text (`textToCopy`) rendered with `ellipsis` truncation, paired with a copy-to-clipboard trigger and a `successMessage` that presumably swaps in/toasts after the copy fires.
- **With Small and Tertiary** — a size/variant combination demo (small size + tertiary button style) applied to a longer, more "technical" string (a config digest), showing the component adapts to compact, low-emphasis placements (e.g. inline in a settings row) as well as the default emphasis level.

Only these two live demo blocks exist on the page (confirmed via the two `Preview` slugs in the flight payload: `text-with-copy-button-default` and `text-with-copy-button-with-small-and-tertiary`). There is **no** "Best Practices" accordion (no When to use / Behavior / Accessibility copy) on this page — Geist does not ship that section for this component; treat guidance below as inferred from the API + naming, not paraphrased from source prose since none exists.

## API

Import path:

```tsx
import { TextWithCopyButton } from "@vercel/geistcn/components";
```

Single component, no documented subcomponents. Props observed across both demos:

| Prop             | Type (inferred) | Example value                                                   | Notes                                                                                                                                                                                                |
| ---------------- | --------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ellipsis`       | boolean (flag)  | `ellipsis`                                                      | Truncates the displayed text with an ellipsis when it overflows its container; used in both demos.                                                                                                   |
| `successMessage` | string          | `"Copied to clipboard"` / `"Copied hashed digest to clipboard"` | Text shown (likely as a toast/tooltip swap) after a successful copy. Demo 2 shows it's meant to be customized per-context ("Copied hashed digest to clipboard" — reflects what was actually copied). |
| `textLabel`      | string          | `"Copy"` / `"Copy config digest"`                               | The accessible/visible label for the copy action itself — also customized per-context in demo 2, implying this is the button's accessible name (not just decorative).                                |
| `textToCopy`     | string          | `"lipsum"` / `"edgeConfigData.digest"`                          | The actual string value that gets written to the clipboard when the button is pressed — distinct from what may be visually displayed as truncated text.                                              |

No `size` or `variant` prop literal was visible in the JSX examples themselves (the "With Small and Tertiary" demo's title implies a `size="small"` and `variant="tertiary"`-style API, consistent with other Geist button-family components, but the actual prop names/enum values were not present in the two captured code snippets — likely defaulted/omitted in the shown example or set via a wrapping context not part of the minimal usage snippet).

### Minimal usage — Default

```tsx
import { TextWithCopyButton } from "@vercel/geistcn/components";
import type { JSX } from "react";

export function Component(): JSX.Element {
  return (
    <TextWithCopyButton
      ellipsis
      successMessage="Copied to clipboard"
      textLabel="Copy"
      textToCopy="lipsum"
    />
  );
}
```

### Minimal usage — With Small and Tertiary

```tsx
import { TextWithCopyButton } from "@vercel/geistcn/components";
import type { JSX } from "react";

export function Component(): JSX.Element {
  return (
    <TextWithCopyButton
      ellipsis
      successMessage="Copied hashed digest to clipboard"
      textLabel="Copy config digest"
      textToCopy="edgeConfigData.digest"
    />
  );
}
```

Composition pattern: this is a leaf/atomic component — you pass it the string to display/truncate and the string to copy as separate props (so the visible label and the copied payload can differ, e.g. showing a truncated digest but copying the full value), plus copy-specific labels for the trigger and the success state.

## Best practices

No Best Practices accordion ships with this Geist page, so nothing to paraphrase from source. Reasonable house rules to adopt for our re-implementation, inferred purely from the API shape and Geist's sibling "Copy Button" component pattern:

- Use `ellipsis` whenever `textToCopy` (or its display counterpart) can be long/unpredictable (hashes, tokens, URLs, IDs) — never let it wrap or blow out a row.
- Keep `textLabel` and `successMessage` context-specific rather than generic "Copy"/"Copied" everywhere it appears more than once on a screen — the second demo shows Geist customizing both per use case (config digest) so multiple instances on one page stay distinguishable to assistive tech users tabbing through.
- The value shown to the user and the value copied to the clipboard are allowed to differ (`textToCopy` need not equal the rendered text) — use this for copying full/raw values (e.g. a full API key) while displaying a truncated/formatted version.
- Given the small/tertiary variant demo, prefer the low-emphasis (tertiary, small) styling when the copy action sits inline in a dense row (e.g. a settings table) and reserve the default/larger emphasis for a standalone or primary-content placement.

## Design notes

- Rendered code samples are captured in TSX with light-theme syntax highlighting tokens (`data-theme="light"`), color palette used in the docs' code blocks: keywords `#D73A49`, plain text/punctuation `#24292E`, strings `#032F62`, component/type identifiers `#6F42C1`, JSX tag name `#005CC5`. (This is the Geist docs' code-block theme, not the component's own runtime styling — no direct token names like `--ds-*` or `material-*` were present in the captured payload for this specific component page.)
- No numeric control sizing (e.g. 32/36/40px), radii, or `--ds-*` CSS custom property names appear anywhere in the page's flight payload for this component — Geist's public docs site does not expose the component's internal implementation/styles here, only usage-level JSX and prose.
- No motion/animation behavior described in the source (e.g. no mention of a toast transition, checkmark swap animation, or timing for the success-state revert). Recommend defaulting to Geist's general system pattern used elsewhere (icon swap to a checkmark + revert after ~2s) since it's implied by `successMessage` existing but not specified here — flag this as an assumption, not a documented fact.
- Layout: page uses a component-preview grid module (`grid-module__AMTIxG__grid`) with guide rows, standard to all Geist component pages — not specific to this component.

### What's NOT available from this fetch

- No prop table (types/defaults/required flags) is rendered as text in the docs SSR/flight payload — Geist's docs likely generate that from TypeScript types client-side or it isn't present for this component at all.
- No accessibility notes (aria attributes on the actual component, keyboard behavior, focus handling) were in the source; the only `aria-*` occurrences found are decorative grid-guide `aria-hidden` divs used for the docs page layout, unrelated to the component itself.
- No `size`/`variant` enum value list — only the demo section title implies "small" + "tertiary" exist as options.
