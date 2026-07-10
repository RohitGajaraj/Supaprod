# Snippet

> "Display a snippet of copyable code for the command line." (Vercel Geist, https://vercel.com/geist/snippet)

## Sections documented

- **Default** — a basic `Snippet` rendering a single shell command (`npm init next-app`) at a fixed width, with the light theme.
- **Inverted** — the same snippet with the `dark` prop set, showing the dark/inverted visual variant.
- **Multi line** — `text` accepts an array of strings; each array item renders as its own line inside one snippet block, sized to `100%` width instead of a fixed pixel width.
- **No prompt** — `prompt={false}` suppresses the leading `$` prompt glyph, for copying content that isn't a shell command.
- **Callback** — demonstrates `onCopy`, a callback fired when the user copies the snippet's text (example fires a `alert(...)`).
- **Variants** — three `type` values (`success`, `error`, `warning`) shown stacked, each recoloring the snippet to communicate an outcome state.
- **Controlled Copied State** — a full worked example composing `Snippet` with `ContextCardTrigger`: a custom clickable wrapper (`role="button"`, keyboard-accessible) manages its own `copied` boolean via `useState`/`useCallback`/`useRef` (with a 1s reset timeout), passes `copied` into `Snippet` to drive the copied-check visual state externally, and shows a `ContextCardTrigger` tooltip/popover with a preview of the copied text (`content` prop, `side="top"`).
- **Best Practices** — accordion of usage guidance (when to use Snippet vs. sibling components, how `text`/`prompt`/`copyText`/`placeholder`/`copied` interact). See below.

## API

### `Snippet` (from `@vercel/geistcn/components`)

Props observed across the examples:

- `text: string | string[]` — the command/content to display. A string renders one line; an array renders one line per item (multi-line block). This is also what gets copied to the clipboard by default.
- `width: string` — CSS width of the snippet box, e.g. `"300px"`. Multi-line example uses `"100%"` instead of a fixed pixel value.
- `dark: boolean` — renders the inverted/dark visual variant of the component (independent of the page's own theme).
- `prompt: boolean` (default appears to be `true`) — when `false`, no leading `$` is rendered before the text; used for non-shell content (URLs, JSON, arbitrary output) so the copied string matches the displayed string exactly.
- `type: 'success' | 'error' | 'warning'` — recolors the snippet to signal an outcome/status.
- `onCopy: () => void` — fired when the user triggers copy (e.g. clicking the copy affordance).
- `copied: boolean` — controlled copied/check state; lets a parent own the copied indicator (e.g. when the actual clipboard-copy trigger lives outside the component, as in the `ContextCardTrigger` composition example).
- `copyText` (mentioned in Best Practices, not shown in a code sample here) — overrides what's copied to the clipboard when `text` contains rich JSX nodes (e.g. highlighted `<span>`s) rather than a plain string, so the clipboard payload stays plain text.
- `placeholder` (mentioned in Best Practices, not shown in a code sample here) — paired with `text=""` for an empty state; informational only, never copied.

### Minimal usage

```tsx
import { Snippet } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return <Snippet text="npm init next-app" width="300px" />;
}
```

### Dark / inverted

```tsx
export function Component(): JSX.Element {
  return <Snippet dark text="npm init next-app" width="300px" />;
}
```

### Multi-line

```tsx
export function Component(): JSX.Element {
  return <Snippet text={['cd project', 'now']} width="100%" />;
}
```

### No prompt

```tsx
export function Component(): JSX.Element {
  return <Snippet prompt={false} text="npm init next-app" width="300px" />;
}
```

### Copy callback

```tsx
export function Component(): JSX.Element {
  return (
    <Snippet
      onCopy={() => alert('You copied the text!')}
      text="npm init next-app"
      width="300px"
    />
  );
}
```

### Type variants (status coloring)

```tsx
export function Component(): JSX.Element {
  return (
    <div className="flex flex-col items-stretch justify-start gap-3 flex-initial">
      <Snippet text="npm init next-app" type="success" width="300px" />
      <Snippet text="npm init next-app" type="error" width="300px" />
      <Snippet text="npm init next-app" type="warning" width="300px" />
    </div>
  );
}
```

### Controlled copied state, composed with ContextCardTrigger

```tsx
'use client';

import { useCallback, useRef, useState } from 'react';
import { Snippet, ContextCardTrigger } from '@vercel/geistcn/components';
import type { JSX } from 'react';

const COPY_TEXT = `# About
Template for a full-featured Next.js AI chatbot

# Requirements
This template uses the Vercel AI Gateway to access multiple AI models through a unified interface. The default model is OpenAI GPT-4.1 Mini, with support for Anthropic, Google, and xAI models.`;

export function Component(): JSX.Element {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(COPY_TEXT);
    setCopied(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), 1000);
  }, []);

  return (
    <ContextCardTrigger
      content={
        <div className="text-copy-13-mono w-96 whitespace-pre-line">
          {COPY_TEXT}
        </div>
      }
      side="top"
    >
      {/* <div> since we don't want to wrap a button around a button */}
      <div
        role="button"
        tabIndex={0}
        aria-label="copy content"
        onClick={handleCopy}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCopy();
          }
        }}
        className="cursor-pointer"
      >
        <Snippet
          copied={copied}
          text="Copy install prompt"
          prompt={false}
          width="300px"
        />
      </div>
    </ContextCardTrigger>
  );
}
```

## Best practices

Paraphrased from the page's "Best Practices" accordion:

- **Pick the right primitive.** Snippet is for a runnable shell command meant to be copied. For a single inline token (an env var name, a path) use `InlineCode`; for a block of multi-line source meant to be read, use `CodeBlock`.
- **Never hand-type the `$`.** Pass the raw command string as `text`; the component itself renders the prompt glyph. Including a leading `$` in `text` produces a doubled `$ $ command`.
- **Turn off the prompt for non-commands.** When the content isn't a shell invocation (a URL, JSON, raw output the user should copy verbatim), set `prompt={false}` so what's displayed matches exactly what's copied.
- **Design the empty state deliberately.** Combine `placeholder` with `text=""`. Keep the placeholder copy in sentence case, no trailing period, and avoid softening words like "Please" — e.g. "Run vercel link to fetch env vars." The placeholder text is informational only and is never included in the copy payload.
- **Only reach for `copyText` when `text` is rich content.** If `text` contains JSX (highlighted spans, conditional fragments) and you need the clipboard to receive plain text instead, set `copyText`. If `text` is already a plain string, adding `copyText` is redundant.
- **One command per snippet.** Use the array form of `text` only for a short, closely related multi-line block (e.g. two sequential commands). For anything longer or more like a script, use `CodeBlock` instead so the user can read before copying.
- **Lift the copied state when the trigger lives outside the component.** Use the controlled `copied` prop together with an `onCopy` callback when some other surface (a card, a tooltip/context menu) needs to show the same "copied" checkmark feedback while the actual copy action fires from outside the `Snippet` markup itself.

## Design notes

- Import path: `@vercel/geistcn/components` (note: `geistcn`, not `geist` — this is the shadcn-style component package for Geist, distinct from the marketing-site bundle).
- Sub/related components referenced by name in the prose: `InlineCode`, `CodeBlock`, `ContextCardTrigger` (a tooltip/popover trigger with `content` and `side` props, e.g. `side="top"`).
- Fixed widths used in examples: `"300px"` for single-line commands; `"100%"` for the multi-line variant (lets it fill its container instead of clipping).
- Status/type coloring: three semantic variants — `success`, `error`, `warning` — stacked with `flex flex-col items-stretch justify-start gap-3 flex-initial` (8px/`gap-3` vertical rhythm at Tailwind's 4px scale, i.e. 12px between stacked snippets).
- Copy-affordance interaction pattern: clicking (or Enter/Space when focused via `role="button" tabIndex={0}`) triggers copy; a `copied` boolean flips a checkmark/confirmation state for 1000ms (`setTimeout(..., 1000)`) before resetting — this is the concrete timing value to replicate for the "copied" feedback state.
- Typography token seen in the composed example: `text-copy-13-mono` used for a monospace preview of copied text inside a `ContextCardTrigger` popover (`w-96 whitespace-pre-line`), i.e. a 384px-wide, pre-wrapped mono block.
- No props table was present on the page (no dedicated API/props documentation block) — the full prop surface above is reconstructed from the "Show code" examples and the Best Practices prose; there is no confirmation of a fuller prop set (e.g. exact TypeScript types/defaults) beyond what appears in these snippets.
- The dark/light `dark` prop is a variant flag on the component itself (renders inverted colors), separate from the page's own `data-theme` — i.e. `Snippet` supports being forced dark regardless of ambient theme.
