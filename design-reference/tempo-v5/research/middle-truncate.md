# MiddleTruncate

> "Truncates text in the middle, preserving the start and end of the string for maximum readability."

Source: https://vercel.com/geist/middle-truncate — fetched 2026-07-10/11, page rendered fine (238KB HTML, Next.js flight payload present, no 404).

## Sections documented

- **Examples** — labeled "Covers strings that benefit from middle truncation." A live demo rendering 11 example rows (Branch, Preview URL, Deployment ID, Env var key, Monospace no ligatures, Commit SHA, File path, Custom domain, Model name, Tight width, Fits as-is), each showing a realistic long string wrapped in `MiddleTruncate` at a given text style. An interactive sidebar (`aside`) lets you drag a `Slider` to resize the container (0-600px) and watch every row re-truncate live, plus a `Toggle` ("Animate") that ping-pongs the width automatically over a 4s loop via `requestAnimationFrame` — this is the only interactive control surface on the page; there are no separate Sizes/Types/Variants/States demo sections for this component.
- **Show code** — reveals the full example source (`Component`) shown below under API.
- **Best Practices** (accordion, 3 subsections) — When to use / Behavior / Accessibility, each a bullet list (captured verbatim content paraphrased below).

No other demo groupings exist on this page — MiddleTruncate is documented as a single component with one canonical example, not a family of variants.

## API

Import:
```tsx
import { MiddleTruncate, Slider } from '@vercel/geistcn/components';
```

### `MiddleTruncate` props observed in the example
- `value: string` — the full string to render/truncate (required; the source-of-truth text, not the visible ellipsis form).
- `className?: string` — applied per-instance to control text style (e.g. `text-label-14`, `text-copy-14`, `text-label-14 font-mono`).
- `style?: CSSProperties` — per-instance inline style (used in the demo to disable ligatures: `fontFeatureSettings: '"liga" 0, "calt" 0'`, `fontVariantLigatures: 'none'`).

No other props (no explicit `startChars`/`endChars`/`separator` props appear in the captured code — the component appears to auto-compute the split from available container width rather than taking explicit head/tail character counts).

### Composition pattern (minimal usage)
```tsx
<div style={{ maxWidth: width }}>
  <div className="min-w-0 basis-0 grow">
    <MiddleTruncate
      className={example.className}
      style={example.style}
      value={example.value}
    />
  </div>
</div>
```
Key structural requirement: `MiddleTruncate` must sit inside a flex/grid child with `min-w-0` (or an equivalent width-constraining wrapper) so it can measure and shrink below its content's intrinsic width — a bare flex child without `min-w-0` won't truncate.

### Full captured example source (`Component`)
```tsx
'use client';
import { Label } from '@vercel/geistcn/components';
import { Toggle } from '@vercel/geistcn/components';
import { MiddleTruncate, Slider } from '@vercel/geistcn/components';
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type JSX,
} from 'react';

interface ExampleItem {
  className: string;
  label: string;
  style?: CSSProperties;
  value: string;
}

const EXAMPLES: ExampleItem[] = [
  {
    className: 'text-label-14',
    label: 'Branch',
    value: 'feature/redesign-dashboard-navigation-with-sidebar-improvements',
  },
  {
    className: 'text-copy-14',
    label: 'Preview URL',
    value:
      'platform-web-git-feature-redesign-dashboard-navigation-phamous.vercel.app',
  },
  {
    className: 'text-label-14',
    label: 'Deployment ID',
    value: 'dpl_8gmXTT1yJRP8UbGfXD7A3sp4RKhW',
  },
  {
    className: 'text-label-14 font-mono',
    label: 'Env var key',
    value: 'STRIPE_WEBHOOK_SIGNING_SECRET',
  },
  {
    className: 'text-label-14 font-mono',
    label: 'Monospace no ligatures',
    style: {
      fontFeatureSettings: '"liga" 0, "calt" 0',
      fontVariantLigatures: 'none',
    },
    value: 'STRIPE_WEBHOOK_SIGNING_SECRET',
  },
  {
    className: 'text-copy-14',
    label: 'Commit SHA',
    value: '2b0874e797d7c2a4092d0033ee0c2f0f9aef2869',
  },
  {
    className: 'text-copy-14',
    label: 'File path',
    value:
      'apps/vercel-site/app/(dashboard)/[teamSlug]/[project]/settings/page.tsx',
  },
  {
    className: 'text-copy-14',
    label: 'Custom domain',
    value: 'api.internal.platform-observability.example.com',
  },
  {
    className: 'text-label-14',
    label: 'Model name',
    value: 'google/gemini-3.1-flash-image-preview',
  },
  {
    className: 'text-label-14',
    label: 'Tight width',
    value: 'feature/redesign-dashboard-navigation-with-sidebar-improvements',
  },
  {
    className: 'text-label-14',
    label: 'Fits as-is',
    value: 'sidebar.tsx',
  },
];

const MAX_WIDTH = 600;

export function Component(): JSX.Element {
  const [width, setWidth] = useState(MAX_WIDTH);
  const [isAnimating, setIsAnimating] = useState(false);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!isAnimating) return;

    const duration = 4000;
    let start: number | null = null;

    function step(timestamp: number): void {
      if (start === null) start = timestamp;
      const elapsed = timestamp - start;
      const progress = (elapsed % duration) / duration;
      // Ping-pong: 0→1→0→1…
      const t = progress < 0.5 ? progress * 2 : 2 - progress * 2;
      setWidth(Math.round(t * MAX_WIDTH));
      rafRef.current = requestAnimationFrame(step);
    }

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isAnimating]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        {EXAMPLES.map((example) => (
          <div
            className="flex items-center gap-4 rounded-md border border-gray-alpha-400 px-4 py-3"
            key={example.label}
          >
            <div className="basis-32 shrink-0 text-label-13 text-gray-700">
              {example.label}
            </div>
            <div style={{ maxWidth: width }}>
              <div className="min-w-0 basis-0 grow">
                <MiddleTruncate
                  className={example.className}
                  style={example.style}
                  value={example.value}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <aside>
        <form className="flex gap-1 items-center">
          <Label value="Width">
            <div className="flex items-center gap-2">
              <Slider
                max={MAX_WIDTH}
                min={0}
                value={[width]}
                onValueChange={([value]) => setWidth(value ?? 0)}
                disabled={isAnimating}
              />

              <p className="font-mono text-copy-13 text-gray-900">{width}px</p>
            </div>
          </Label>
        </form>

        <Toggle
          checked={isAnimating}
          onChange={(): void => setIsAnimating(!isAnimating)}
        >
          Animate
        </Toggle>
      </aside>
    </div>
  );
}
```

## Best practices

**When to use**
- Reach for middle truncation only when both ends of a string carry meaning — file paths, URLs, deployment IDs, commit hashes, prefixed branch names. The head anchors "what kind of thing" and the tail (or a distinguishing suffix) anchors "which specific one."
- For prose, titles, and descriptions, truncate at the end instead (standard `…` at the tail) — chopping the middle of a sentence destroys its meaning, it's only useful for identifier-shaped strings.
- If a user might ever need the exact untruncated value, don't rely on truncation alone — pair it with a tooltip revealing the full string, or a copy affordance, since the truncated glyph on its own throws away precision.

**Behavior**
- The component collapses the string down to a single ellipsis character (`…`), not three literal periods — this matters for monospace content (env keys, hashes, paths) where three periods would eat three fixed character cells instead of one.
- Truncation is driven by the actual rendered width of its container, so anything that resizes the container in response to interaction (hover-expand cards, animating rows) will make the cut point visibly jump around each frame. If the surrounding layout changes width during an interaction, lock the width for the duration rather than letting it free-run.
- The DOM/copy value is always the original full string — copying selected text (or any custom copy handler layered on top) must still yield the untruncated source, not the shortened display text. Verify this invariant holds if you intercept `onCopy`.
- Don't nest `MiddleTruncate` inside a container that also applies CSS `text-overflow: ellipsis` — the two truncation mechanisms conflict and produce inconsistent results (the inner ellipsis generally wins, but not reliably).

**Accessibility**
- Assistive tech should get the full, untruncated string as the accessible name of the wrapping element — the component keeps the complete value in the DOM (for copy) so this is achievable without extra plumbing, but it's the integrator's job to wire the accessible name correctly.
- If you put `MiddleTruncate` inside a focusable/interactive control (button, link), give that control an explicit `aria-label` — an ellipsis glyph alone announces nothing useful to a screen reader.
- On small viewports, make sure enough of the string stays visible that the leading segment (path prefix, ID prefix) is still identifiable — don't let responsive layout squeeze the visible portion down to nothing informative.

## Design notes

- **Text styles used per row** (Tailwind/Geist utility classes, not component-owned): `text-label-14`, `text-copy-14`, `text-label-14 font-mono`, `text-label-13` (row label column). No component-specific size/variant prop exists — visual style is entirely inherited via `className` passed straight through.
- **Ligature handling**: one demo row explicitly disables font ligatures/contextual alternates for monospace values via inline style — `fontFeatureSettings: '"liga" 0, "calt" 0'` + `fontVariantLigatures: 'none'` — relevant because truncating monospace strings with ligatures on can visually distort adjacent glyphs at the cut point.
- **Layout container**: rows use `flex items-center gap-4 rounded-md border border-gray-alpha-400 px-4 py-3` (card-style row), label column `basis-32 shrink-0`, value column wrapped in a width-constrained `div` (`maxWidth: width`) containing a `min-w-0 basis-0 grow` inner div — this `min-w-0` wrapper is structurally required for the truncation measurement to work in a flex context.
- **Interactive demo controls**: a `Slider` (min 0, max 600, single-thumb `value={[width]}`) drives container width live; a `Toggle` labeled "Animate" starts a `requestAnimationFrame` loop that ping-pongs width 0→600→0 over a 4000ms period (linear ease, `t = progress < 0.5 ? progress*2 : 2-progress*2`), demonstrating re-truncation under continuous resize. Slider is disabled while `isAnimating` is true.
- **Ellipsis character**: renders exactly one `…` (U+2026 HORIZONTAL ELLIPSIS), never three separate periods — call this out in any re-implementation since it affects monospace column-width math.
- **Copy semantics**: the underlying full string remains the copyable/DOM value regardless of visible truncation — implies the real implementation likely renders both a visually-truncated display span and keeps the untruncated text as the accessible/copy source (exact DOM strategy, e.g. `aria-label` vs. hidden full-text node, isn't shown in the captured example code — only asserted in the Best Practices prose).
- No numeric px sizing, border radius, or color token values are exposed for the component itself in the captured code (colors like `border-gray-alpha-400`, `text-gray-700`, `text-gray-900` are demo-page chrome, not part of MiddleTruncate's own styling contract) — the component appears to be typography/layout-only with no visual chrome of its own (no built-in border, background, or color).
