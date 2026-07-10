# Browser

> "The Browser component lets you showcase website screenshots or any other content within a realistic browser-style frame."

Source: https://vercel.com/geist/browser (fetched via raw HTML + Next.js flight payload, 2026-07-10). This is a comparatively sparse Geist page — only one demo section (no separate Default/Sizes/Types/States blocks) plus Best Practices.

## Sections documented

- **Composition** — the single live demo. Shows a `Browser` frame with `address="https://www.vercel.com"` (rendered address bar reads `vercel.com`) wrapping an empty content slot (`<div className="p-6" />`). A "Show code" toggle reveals the JSX behind it. The same snippet is emitted twice in the underlying payload (once per light/dark syntax-highlight theme render), not two distinct examples — there is only one canonical usage pattern shown on the page.
- **Best Practices** — three-part accordion: When to use, Behavior, Accessibility (see below).

No Sizes, Types, Variants, or States sections are present on this page — unusual relative to other Geist component pages, implying Browser is treated as a single-shape compositional wrapper rather than a component with multiple visual variants demonstrated in the docs (though the Best Practices text does reference a `light`/`dark` variant prop — see Design notes).

## API

Only one composition pattern is demonstrated in code:

```tsx
import { Browser } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return (
    <div className="max-w-4xl">
      <Browser address="https://www.vercel.com">
        <div className="p-6" />
      </Browser>
    </div>
  );
}
```

- **`Browser`** — top-level component. Observed props:
  - `address: string` — the URL shown in the simulated address bar (e.g. `"https://www.vercel.com"`; rendered truncated as `vercel.com`).
  - `children` — arbitrary content (screenshot image, video, or any markup) rendered inside the frame's content area.
  - A theme/appearance prop is implied by the Best Practices copy ("`light` chrome on light backgrounds, `dark` chrome on dark") but its exact prop name and type were not shown in any code sample on this page — treat `light` / `dark` as the two enum values to support, name TBD (likely `variant` or `theme`) until confirmed from the source package.
- **Building-block subcomponents** referenced by name in the Best Practices copy, implying they exist as separately importable/composable pieces for custom layouts, but no code example for them appears on this page:
  - `Dots` — the traffic-light window dots.
  - `Controls` — presumably the back/forward/reload cluster.
  - An "address bar" piece (unnamed in the prose, likely part of `Controls` or a separate `AddressBar`).
  - Also referenced elsewhere in this doc: `Middle Truncate` (a separate Geist component, for truncating long URLs inside the address bar).

Composition guidance: use the canned `Browser` component for the standard shape; drop down to composing `Dots` + `Controls` + address bar directly only when the canned shape doesn't fit — don't fork/hand-roll the chrome.

## Best practices

**When to use**
- Use it purely as decorative marketing chrome — wrapping screenshots, demo captures, or recordings on landing pages, docs, and changelog posts.
- Never put live/real product UI inside it; the frame visually signals "this is a screenshot," so putting an interactive surface inside is misleading.
- Prefer the composed building blocks over a custom-built frame when the default `Browser` shape doesn't match the layout — don't recreate the chrome from scratch.

**Behavior**
- Pick the chrome variant to match the page background it sits on — light chrome on light sections, dark chrome on dark sections — so the frame doesn't visually clash with its surroundings.
- For long URLs in the address bar, truncate in the middle (host prefix + path tail both stay visible) rather than truncating from one end.
- Reserve/lock the aspect ratio of the inner content so the frame doesn't jump or reflow while an image loads or if it fails to load.

**Accessibility**
- The chrome itself is purely decorative — hide it from assistive tech (`aria-hidden="true"`) and put the actual meaning on the inner image/video via its own `alt` text.
- Alt text on the inner screenshot should describe what's actually shown, not a generic label like "browser screenshot."
- Don't make the dots or nav controls focusable — they're static decoration, not real controls, so focusable-but-inert elements would confuse keyboard users.

## Design notes

- Import path: `@vercel/geistcn/components` (same package path pattern as other Geist components).
- Demo container in the docs wraps the example in `<div className="max-w-4xl">` — a layout convention of the docs site, not part of the component itself.
- Content slot in the example is a plain `<div className="p-6" />` — i.e. the Browser frame just renders whatever's passed as `children`, padded by the consumer, not by the component.
- Two color/theme variants exist for the chrome: `light` and `dark` (exact prop name unconfirmed from this page's code — no prop table was rendered on the page; there is no `<table>` element and no TypeScript prop-interface block in the page source).
- No numeric sizing (control diameter, chrome height, corner radius), color tokens (`--ds-*`), or motion behavior are stated anywhere in the visible prose or code for this component — the page does not expose those specifics; they'd need to come from the actual `@vercel/geistcn` package source rather than the docs page.
- Subcomponents `Dots`, `Controls`, and an address-bar piece exist as composable primitives (named directly in the prose) for custom layouts, but the docs page shows zero code for them — their props/anatomy are undocumented here.
- Related component referenced: `Middle Truncate` (separate Geist component) — used inside the address bar for long URLs.
