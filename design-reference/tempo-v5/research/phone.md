# Phone

> "The Phone component lets you showcase website screenshots or other content within a realistic phone-style frame."

Source: https://vercel.com/geist/phone (fetched 2026-07-10/11, server-rendered Next.js flight payload). This is one of Geist's smallest documented components — the page ships exactly two sections and a single code example (no Sizes/Types/Variants/States tables like richer components e.g. Button or Avatar).

## Sections documented

- **Composition** — the only functional demo on the page. Shows the minimal usage pattern: wrap a `Phone` in a constrained-width container and pass it an `address` prop (a URL string). The live preview (`peek: "phone-composition"`) renders that URL's screenshot inside the phone chrome, but the preview itself is a client-rendered iframe/image not present in the static payload — only the code sample was recoverable headlessly.
- **Best Practices** — a `BestPractices` accordion with three subsections: When to use, Behavior, Accessibility (see below). No separate "Anatomy" or "Props" section exists on this page — this is the full extent of the documented API surface.

## API

Single import, single component, one prop demonstrated:

```tsx
import { Phone } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return (
    <div className="w-full max-w-xs mx-auto">
      <Phone address="https://vercel.com" />
    </div>
  );
}
```

- **Component**: `Phone` (default export path `@vercel/geistcn/components`).
- **Props visible in the example**:
  - `address: string` — a URL. Per the composition demo this is used to source/label the screenshot content shown inside the frame (analogous to how the sibling `Browser` component takes a URL to render as chrome-bar text and/or drive a live capture). No other props (size, variant, theme, orientation) are demonstrated anywhere in the fetched payload — the docs page does not expose a props table, so any additional API (e.g. `children` for custom content instead of a captured `address`, a `variant`/`theme` toggle, width/height sizing props) is not confirmed by this page and should be verified against the actual `@vercel/geistcn` package source/types before assuming it exists.
- **Composition pattern**: `Phone` is meant to be dropped into a width-constrained wrapper (`className="w-full max-w-xs mx-auto"` in the example) — the component itself does not appear to cap its own width, so the frame scales to its container. This mirrors the max-w-xs pattern Vercel uses across their marketing pages for phone-mockup screenshots.
- **Related component**: `Browser` (`/geist/browser`) is explicitly referenced as the desktop-chrome counterpart — the best-practices copy tells you to pair the two when showing parallel desktop/mobile views of the same UI.

## Best practices

Paraphrased from the accordion copy (not copied verbatim):

**When to use**
- Reach for Phone purely as marketing/documentation chrome around a mobile screenshot, screen recording, or demo image — think landing pages and doc pages, not the product itself.
- Never put a live, interactive mobile UI inside it. The frame visually signals "this is a captured screen," so putting real interactive content in it creates a mismatch with user expectations.
- When a flow needs both a desktop and mobile view side by side, pair Phone with Browser and keep both frames on the same light/dark theme so they read as one comparison rather than two unrelated screenshots.

**Behavior**
- Keep the Phone's rendering theme (light/dark) in sync with the page/section around it — a mismatched chrome color will visually compete with the screenshot it's supposed to be showcasing.
- Whatever image or video goes inside the frame should be cropped/exported at a real phone aspect ratio (roughly 19.5:9, the modern-iPhone ratio) so the bezel edges line up with the content instead of clipping it.
- Don't add your own drop-shadow or elevation on the wrapping element — the Phone chrome already carries its own shadow/elevation styling, and stacking another shadow on top reads as a visual halo/glow artifact rather than added depth.

**Accessibility**
- The phone frame itself is decorative chrome, not content — mark it (or treat it as implicitly) `aria-hidden="true"` and put any accessible name/description on the inner screenshot content instead.
- Alt text belongs on the inner image and should describe what's on the screen (e.g. "Vercel dashboard on iPhone"), not describe the device/frame itself.
- If the inner content is an autoplaying video, respect `prefers-reduced-motion` and fall back to a paused poster frame rather than forcing motion.

## Design notes

- No numeric size/radius/token values are exposed on this documentation page — unlike richer Geist components (e.g. Button, Avatar) there is no visible `--ds-*` custom-property list, no size enum (sm/md/lg), and no state-color table for Phone. The component's actual bezel thickness, corner radius, notch/dynamic-island treatment, and any CSS custom properties live inside the compiled `@vercel/geistcn` package and were not observable from the static/flight HTML — they would need to be sourced from the package's CSS/JS or from visually inspecting the rendered preview in a browser.
- Recommended aspect ratio called out explicitly in the best-practices copy: **19.5:9** for the inner screen content (matches modern iPhone screen ratio) — this is the one concrete numeric constraint documented.
- Container sizing convention shown in the only code example: constrain the *wrapper*, not the component, via a `max-w-xs` (a Tailwind utility, ~20rem/320px) centered wrapper (`mx-auto`) — implying Phone itself is fluid/responsive to its parent's width rather than fixed-size.
- Elevation guidance: the component ships its own shadow/elevation by default; the doc explicitly warns against adding a second shadow on the wrapping container.
- Styling language: code samples use plain Tailwind utility classes on the wrapper (`w-full max-w-xs mx-auto`), consistent with the rest of Geist's `geistcn` (shadcn-style, copy-paste + Tailwind) component family rather than CSS Modules or the classic `--ds-*` token component line.

## Notes for re-implementation

- Given how sparse this page is, treat this spec as a floor, not a ceiling — before building, pull the actual `@vercel/geistcn` package source (npm/GitHub) for the real prop union, default sizing, and CSS token names, since the marketing docs page does not expose them.
- If pixel-fidelity matters, the live preview (rendered client-side from the `peek: "phone-composition"` slug) would need to be captured with a real browser (e.g. Playwright/Chrome) to see the actual bezel art, notch shape, and default dimensions — headless HTML fetch cannot recover that visual, only the JSX source used to produce it.
