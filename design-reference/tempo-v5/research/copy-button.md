# Copy Button

> "A button that copies a given string to the clipboard and provides feedback when copied."

Source: https://vercel.com/geist/copy-button (fetched 2026-07-11 via raw HTML + Next.js flight payload decode; no browser used).

## Sections documented

This page is minimal compared to most Geist component pages — it has exactly one demo section and no Best Practices accordion, no props table, and no additional variant/size/state demos.

- **Default** — the only demo on the page. Shows a single `CopyButton` usage with `textToCopy` and `label` props, rendered inline, with a "Show code" toggle revealing the JSX source (light + dark syntax-highlighted variants embedded in the flight payload).

No "Sizes", "Types", "Variants", "States", or "Best Practices" sections exist on this page — confirmed by grepping the fetched HTML for `Best Practices`, `When to use`, `Accessibility`, and additional `copy-button-*` demo-name tokens (only `copy-button-default` was found) and by stripping all tags to check the visible prose (only "Default" and "Show code" appear as section labels).

Related/adjacent component in the same nav group (not this page, listed for context): **Text With Copy Button** (`/geist/text-with-copy-button`) — a separate, more composite component pairing display text with a copy affordance. The sidebar also places Copy Button alphabetically between **Context Menu** and **Description**.

## API

Import path shown in the code sample:

```tsx
import { CopyButton } from "@vercel/geistcn/components";
import type { JSX } from "react";

export function Component(): JSX.Element {
  return <CopyButton textToCopy="lipsum" label="copy text" />;
}
```

Only one composition pattern is demonstrated on the page — a bare, self-closing `<CopyButton />` with two props:

- `textToCopy: string` — the string copied to the clipboard on click. Example value: `"lipsum"`.
- `label: string` — accessible/visible label for the button. Example value: `"copy text"`.

No other props, sub-components, enum values, size/variant props, or `onCopy`-style callback props are visible anywhere in the fetched payload. The component is a leaf/standalone element — no compound-component pattern (no `CopyButton.Root`/`CopyButton.Icon` etc. appears).

Because the page exposes no props table, the prop surface above should be treated as **only what's provably demonstrated**; a real implementation likely also needs (inferred, not confirmed by this page) a copied/idle visual state and probably a `size` or `disabled` prop consistent with other Geist button-family components — but do not fabricate these into the spec as documented; flag them as assumptions if implemented.

## Best practices

Not documented on this page. Unlike most other Geist component pages (e.g. Button, Modal), this page ships with no "Best Practices" accordion at all — no When to use / Behavior / Accessibility guidance is present in the fetched HTML or flight payload. Nothing to paraphrase; do not invent guidance here.

## Design notes

- **Package**: `@vercel/geistcn/components` (the `geistcn` variant of the Geist component package, distinct from `@vercel/geist` core tokens/icons referenced elsewhere on the site).
- **Peek/demo identifier**: `copy-button-default` (used as the `name` prop wired to the page's `Preview` renderer and as the `frontmatter.peek` value for the page's own preview thumbnail).
- **Frontmatter** captured from the MDX module: `{ title: "Copy Button", description: "A button that copies a given string to the clipboard and provides feedback when copied.", peek: "copy-button-default" }`.
- **Code block styling tokens** (from the embedded syntax highlighter, light/dark pairs — these are Shiki/rehype-pretty-code colors, not Geist design tokens, but useful for matching the doc-site code block look):
  - Light theme: keywords `#D73A49`, identifiers/punctuation `#24292E`, strings `#032F62`, function/class names `#6F42C1`, JSX tag name `#005CC5`.
  - Dark theme: keywords `#F97583`, identifiers/punctuation `#E1E4E8`, strings `#9ECBFF`, function/class names `#B392F0`, JSX tag name `#79B8FF`.
- **Page heading typography** (from the surrounding grid shell, not the component itself): `text-heading-24 md:text-heading-40 font-semibold` for the `<h1>`, `text-copy-16 md:text-copy-20 text-gray-900` with `line-height: 1.5` for the one-line description paragraph.
- **Grid shell classes**: page content wrapped in `grid-module__*__unstable_gridSystemWrapper` / `grid-module__*__gridSystem` with CSS custom properties `--guide-width`, `--max-width: 1200px`, `--min-width: 300px` — this is the doc-site's layout grid, not the component's own box model.
- **No component-level sizing, radius, spacing, or state-color values are observable** for the `CopyButton` itself in this payload — the page never renders the actual compiled `CopyButton` DOM (client component boundary `$L22` with `code: "$23"` only ships the MDX/source-code panel, not a server-rendered snapshot of the live button), and no CSS module class names for the button (e.g. no `copy-button-module__*`) appear anywhere in the fetched HTML. Getting exact button pixel sizes, icon swap animation (copy icon to checkmark), toast/tooltip feedback timing, and color tokens will require either the live rendered DOM (browser fetch) or cross-referencing the sibling `Button` and `Toast`/`Feedback` Geist pages, since "provides feedback when copied" (per the one-line description) is not detailed further on this page.

## Notes / gaps

- The page fetched successfully (119.2 KB, within expected 80-200 KB range) and is genuinely this sparse — this is not a truncated fetch or wrong slug. Verified by checking flight-payload chunk count (only one `self.__next_f.push` call in the whole document, fully parsed) and grepping for section/heading markers site-wide.
- Because there is no props table and no rendered live component, several implementation details (copied-state icon swap, disabled state, size variants, color tokens, accessibility copy like `aria-live` announcements) are NOT confirmed by this page and would need to be sourced from a live browser render of `/geist/copy-button` or from the related `Text With Copy Button` and `Toast`/`Feedback` pages before being treated as spec.
- Cached raw HTML retained at `design-reference/tempo-v5/research/.cache/copy-button.html` for re-derivation if needed.
