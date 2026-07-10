# Code

> "Display a snippet of code with syntax highlighting."

Source: https://vercel.com/geist/code (fetched 2026-07-10). This is one of Geist's sparsest documented pages — the entire page body is a single demo section plus the page-level breadcrumbs (Previous: Clearable Input, Next: Code Block). There is no Sizes/Types/Variants/States gallery, no Props table, and no "Best Practices" (When to use / Behavior / Accessibility) accordion rendered on this page — unusual compared to denser Geist component pages, but confirmed by parsing the full decoded Next.js flight payload (only one MDX section, `Default`, was present; searches for "Best Practices", "When to use", "Behavior", "Accessibility", "Anatomy", "Props", "Sizes", "Types", "Variants", "States" all returned zero matches in both the rendered text and the flight payload).

## Sections documented

- **Default** — the only demo on the page. Shows `Code` rendering a highlighted, non-editable block of syntax-colored source text (here, a TSX snippet), contrasted with the sibling `Snippet` component (single-line command display) used inside the example's own sample string. The preview registers under the internal peek id `code-default`.

## API

Package: `@vercel/geistcn/components`

```tsx
import { Code } from '@vercel/geistcn/components';
import type { JSX } from 'react';

const codeExampleTsx = `import { Snippet } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return <Snippet text="npm init next-app" width="300px" />;
}`;

export function Component(): JSX.Element {
  return <Code syntax="javascript">{codeExampleTsx}</Code>;
}
```

- **`<Code>`** — single component, no documented subcomponents on this page.
  - `syntax` (string, required in the example) — language id used for highlighting; only value shown is `"javascript"` (used here even though the sample content is TSX, implying the prop selects a highlighter grammar rather than being strictly TSX/JSX-specific — treat `"javascript"` as covering the JS/TS/JSX family unless a dedicated `"tsx"`/`"typescript"` value is found on another page or in the package source).
  - children — the raw code string to render (a plain JS template-literal string, not JSX-wrapped lines); the component owns tokenizing/coloring internally.
  - No `width`, `title`, `filename`, `showLineNumbers`, or copy-button props are demonstrated on this page (contrast with `Snippet`, which does show a `width` prop in the example content, and with the separate `Code Block` component which is the likely home for filename/line-number/toolbar chrome — see `/geist/code-block`, not covered by this fetch).

Composition pattern shown: `Code` wrapping a multi-line string is the full API surface demonstrated; no nesting with other Geist components beyond referencing `Snippet` as example *content*, not as a child.

## Best practices

Not documented on this page — no "When to use" / "Behavior" / "Accessibility" content was present in the fetched HTML or the decoded flight payload. Do not fabricate guidance; if this is needed, re-check the live page for a collapsed accordion that may load client-side content not present in the initial payload, or check the `code-block` sibling page which likely carries the fuller behavioral spec.

## Design notes

- Rendered as a `<pre data-language="tsx" data-theme="light|dark"><code data-language="tsx" data-theme="light|dark">…</code></pre>` structure via `rehype-pretty-code` (marked with `data-rehype-pretty-code-fragment` on the wrapping div) — i.e. Geist's docs site renders the *documentation's own code sample* through the same highlighter convention as the rest of the site; this is the MDX pipeline's styling, not necessarily the shipped `Code` component's internal DOM (the component's actual rendered markup wasn't captured — only the docs' own syntax-highlighted presentation of the example source was).
- Two color themes present line-by-line as inline `style={{color: "#HEX"}}` spans — this is the docs site's own light/dark token pair for syntax highlighting, not exposed as customizable design tokens on this page:
  - Light theme: keywords `#D73A49`, plain text `#24292E`, strings `#032F62`, types/components `#6F42C1`, identifiers/component names `#005CC5`.
  - Dark theme: keywords `#F97583`, plain text `#E1E4E8`, strings `#9ECBFF`, types/components `#B392F0`, identifiers/component names `#79B8FF`.
  - (These are GitHub-Dimmed-style token colors, a common Shiki/rehype-pretty-code default pairing — likely the docs-site MDX renderer's palette rather than a `Code` component prop; do not assume the shipped `Code` component exposes these as configurable tokens without checking the package source.)
- Page chrome around the demo: an "Show code" toggle exists on the page (confirmed present in the plain-text extraction) but its target markup — the collapsed source panel — is the same `__rawString__` block already captured above; there was no additional hidden content beyond the light/dark pair of the one example.
- No `--ds-*` custom-property tokens, no `material-*` classes, and no explicit pixel sizing (heights/radii) were visible anywhere in the page markup for the `Code` component itself — the visible sizing tokens on the page (`text-heading-24`, `md:text-heading-40`, `text-copy-16`, `md:text-copy-20`) belong to the page's own H1/description typography, not to `Code`.
- Prior/next component links confirm placement in the Geist component index: **Previous: Clearable Input**, **Next: Code Block** — reinforces that line-numbered/filename/toolbar chrome likely lives in the separate `Code Block` component, and single-line copyable commands live in `Snippet`.
