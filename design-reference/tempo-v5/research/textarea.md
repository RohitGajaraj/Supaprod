# Textarea

> "Retrieve multi-line user input."

Source: https://vercel.com/geist/textarea — fetched and parsed headlessly (no browser). Package: `@vercel/geistcn/components`.

## Sections documented

- **Default** — a single `<Textarea>` with an `aria-label`, long lorem-ipsum `placeholder`, and `style={{ minHeight: 100 }}`. Shows the resting/hover/focus visual states.
- **Disabled** — same shape with the `disabled` prop; demonstrates the disabled fill, text color, and cursor.
- **Error** — three stacked textareas (`size="small"`, `"medium"`, `"large"`) each with a `defaultValue` and `error="There has been an error."`, showing the inline error message + red focus ring per size.
- **Sizes** — three stacked textareas (`small` / `medium` / `large`) with the same `defaultValue`, showing the row-height / control-height / font-size scale across sizes.
- **Read Only** — a single textarea with `readOnly` and a `defaultValue`, showing the read-only rendering (still selectable, not editable, no interactive chrome change from default enabled state visually).
- **Rows** — a single textarea with `rows={5}` and a short instructional placeholder, showing the fixed-row-count (non-auto-grow) behavior.
- **Best Practices** — accordion-style guidance covering when to use it vs. Input, sizing/growth behavior, validation timing, whitespace handling, label/placeholder copy rules, and accessibility wiring (see Best practices section below).

Page footer also shows adjacent nav cards ("Previous: Text With Copy Button", "Next: Theme Switcher") — not part of the component spec.

## API

Import:

```tsx
import { Textarea } from "@vercel/geistcn/components";
import type { JSX } from "react";
```

Single component, no documented subcomponents. It renders a native `<textarea>` wrapped in a styled container `<div>` (which itself is wrapped in a `<label>` when used with the label/helper/error pattern seen in markup — label wraps the field + error/helper block).

**Props observed across examples:**

- `aria-label` (string) — used in every example in place of a visible `<label>` text child; accessible name.
- `placeholder` (string) — instructional/sample text.
- `defaultValue` (string) — uncontrolled initial value (also accepts a `value` control pattern presumably, not shown).
- `disabled` (boolean) — disables the field.
- `readOnly` (boolean) — makes the field non-editable but still focusable/selectable.
- `error` (string) — pass a string (not boolean) to render an inline error message below the field; switches the field's ring/box-shadow to the red/error palette and swaps the size-based focus ring for the always-on error ring.
- `size` ("small" | "medium" | "large") — controls control height, row-to-input mapping variable, corner radius, and font size (see Design notes).
- `rows` (number) — fixes row count / height instead of the default auto/minHeight behavior.
- `style` (inline, e.g. `{{ minHeight: 100 }}`) — used in every non-`rows` example to set a starting height; the component does not appear to set a default minHeight itself in these demos.

**Usage snippets (verbatim from the page's code examples):**

Default:

```tsx
import { Textarea } from "@vercel/geistcn/components";
import type { JSX } from "react";

export function Component(): JSX.Element {
  return (
    <Textarea
      aria-label="Default"
      placeholder="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
      style={{ minHeight: 100 }}
    />
  );
}
```

Disabled:

```tsx
import { Textarea } from "@vercel/geistcn/components";
import type { JSX } from "react";

export function Component(): JSX.Element {
  return (
    <Textarea
      aria-label="Disabled"
      disabled
      placeholder="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
      style={{ minHeight: 100 }}
    />
  );
}
```

Error (all three sizes):

```tsx
import { Textarea } from "@vercel/geistcn/components";
import type { JSX } from "react";

export function Component(): JSX.Element {
  return (
    <div className="flex flex-col items-stretch justify-start gap-8 flex-initial">
      <Textarea
        aria-label="With error (small)"
        defaultValue="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
        error="There has been an error."
        size="small"
        style={{ minHeight: 100 }}
      />
      <Textarea
        aria-label="With error (medium)"
        defaultValue="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
        error="There has been an error."
        size="medium"
        style={{ minHeight: 100 }}
      />
      <Textarea
        aria-label="With error (large)"
        defaultValue="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
        error="There has been an error."
        size="large"
        style={{ minHeight: 100 }}
      />
    </div>
  );
}
```

Sizes:

```tsx
import { Textarea } from "@vercel/geistcn/components";
import type { JSX } from "react";

const loremIpsum =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";

export function Component(): JSX.Element {
  return (
    <div className="flex flex-col gap-6">
      <Textarea
        aria-label="Textarea"
        defaultValue={loremIpsum}
        size="small"
        style={{ minHeight: 100 }}
      />
      <Textarea
        aria-label="Textarea"
        defaultValue={loremIpsum}
        size="medium"
        style={{ minHeight: 100 }}
      />
      <Textarea
        aria-label="Textarea"
        defaultValue={loremIpsum}
        size="large"
        style={{ minHeight: 100 }}
      />
    </div>
  );
}
```

Read Only:

```tsx
import { Textarea } from "@vercel/geistcn/components";
import type { JSX } from "react";

const loremIpsum =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";

export function Component(): JSX.Element {
  return (
    <Textarea
      aria-label="Read only"
      defaultValue={loremIpsum}
      readOnly
      style={{ minHeight: 100 }}
    />
  );
}
```

Rows:

```tsx
import { Textarea } from "@vercel/geistcn/components";
import type { JSX } from "react";

export function Component(): JSX.Element {
  return (
    <Textarea
      aria-label="Textarea with fixed rows"
      placeholder="Textarea with fixed number of rows"
      rows={5}
    />
  );
}
```

## Best practices

Paraphrased from the page's accordion (When to use / Behavior / Accessibility content, merged into one list as the page presents it):

- Use `<Textarea>` for anything that wraps across multiple lines — commit messages, descriptions, freeform notes. Reach for `Input` instead when the value is a single short token like a name or a domain.
- Default to a comfortable number of rows and only let the control grow when there's vertical room on the page; don't let it push primary actions off-screen.
- Validate on blur, not on every keystroke, and drive the error state by passing a string to `error` rather than a boolean — that string becomes the inline error message and takes over the space helper text would otherwise use.
- Strip leading/trailing whitespace before running required-field checks, so a field containing only blank lines doesn't slip past validation as "filled in."
- Keep labels to short, Title Case nouns (e.g. "Description", "Release Notes"). Placeholders should model an example value, not restate an instruction like "Enter a description."
- Validation copy should name the field and the constraint, end with a period, and skip "please" (e.g. "Description is required.", "Release notes can't exceed 500 characters.").
- Wire helper text as a sibling `<p>` connected via `aria-describedby` rather than embedding it in the label; keep it to one sentence, sentence case, with a period.

## Design notes

**Markup shape** (from rendered HTML): a `<label>` wraps a styled `<div>` container, which wraps the native `<textarea>`; the error message renders as a sibling `<div role="alert" data-geist-error>` below the field, connected via `id`/`aria-describedby` (id pattern seen: `textarea-<generated>-error`).

**Textarea element base classes** (constant across all states):
`py-2.5 px-3 resize-none w-full [&[rows]]:h-[unset] inline-flex appearance-none webkit-search-reset min-w-0 border-none bg-[var(--ds-background-100)] text-[var(--geist-foreground)] order-1 outline-none focus:outline-none`

- disabled adds: `disabled:bg-[var(--ds-gray-100)] disabled:placeholder:text-[var(--accents-3)] disabled:[-webkit-text-fill-color:var(--accents-3)] disabled:opacity-100 disabled:text-[var(--ds-gray-700)] disabled:cursor-not-allowed`
- `resize-none` — manual textarea resize handle is disabled; sizing is entirely controlled via `rows`/`style.minHeight`/CSS.
- `spellCheck="false"` and `autoCapitalize/autoComplete/autoCorrect="off"` are set on the native element by default.

**Wrapper container classes by size** (this is where the size scale, radius, and box-shadow/ring live — not on the `<textarea>` itself):

- Common: `flex max-w-full transition-all duration-150 overflow-hidden font-normal w-full`
- **small**: `rounded-md [&>input]:h-8 text-sm [&>input]:px-3`
- **medium**: `rounded-md [&>input]:h-(--ds-size-medium) text-sm [&>input]:px-3`
- **large**: `rounded-lg [&>input]:h-(--ds-size-large) [&>input]:text-base [&>input]:px-3`
- (Note: the `[&>input]` selectors are template classes shared with the Input component; on Textarea they affect the same size token, `--ds-size-medium` / `--ds-size-large`, which the design system defines centrally — small is hardcoded to `h-8` rather than a `--ds-size-small` var in the observed markup.)

**Resting/hover/focus ring (non-error):**

- Resting: `shadow-[0_0_0_1px_var(--ds-gray-alpha-400)]`
- Hover: `hover:shadow-[0_0_0_1px_var(--ds-gray-alpha-500)]` (suppressed when the control is disabled: `hover:[&:has(textarea:disabled)]:shadow-[0_0_0_1px_var(--ds-gray-alpha-400)]`)
- Focus: `has-[:focus]:!shadow-[0_0_0_1px_var(--ds-gray-alpha-600),0px_0px_0px_4px_rgba(0,0,0,0.16)]`, with a dark-theme override swapping the outer glow to `rgba(255,255,255,0.24)` (`dark-theme:has-[:focus]:!shadow-[...]`). This is a 1px solid ring plus a 4px soft glow, i.e. a two-layer box-shadow "focus halo," not a browser default outline (outline is explicitly removed on the textarea).

**Error state** — replaces the whole ring/shadow stack and adds marker classes:

- Wrapper: `shadow-[0_0_0_1px_var(--ds-red-900),0_0_0_4px_var(--ds-red-300)]`, hover `hover:shadow-[0_0_0_1px_var(--ds-red-900),0_0_0_4px_var(--ds-red-500)]`, focus `has-[:focus]:shadow-[0_0_0_1px_var(--ds-red-900),0_0_0_4px_var(--ds-red-300)]` (ring stays present/unchanged on focus while erroring, unlike the gray-alpha state which strengthens on focus).
- Wrapper also carries plain marker classes `geist-themed geist-error` (hooks for theme/QA, not visual by themselves).
- Error message block: `text-[var(--ds-red-900)] flex items-start text-[13px] leading-5`, `role="alert"`, `data-geist-error`, `id="textarea-<id>-error"`, `style="margin-top:var(--geist-gap-quarter)"`. It renders a 16x16 inline warning-triangle SVG icon (`color: var(--ds-red-900)`, `mr-2 mt-0.5` alignment) followed by a `<div class="break-words">` holding the message text.

**Read-only** — no distinct visual class delta was observed beyond native browser `readOnly` semantics (background/border stay in the enabled resting state; text remains full-opacity/selectable but not editable). Disabled is visually distinct (grayed background/text via the `disabled:` classes above); read-only is not.

**Tokens referenced:** `--ds-background-100`, `--geist-foreground`, `--ds-gray-100`, `--accents-3`, `--ds-gray-700`, `--ds-gray-alpha-400/500/600`, `--ds-size-medium`, `--ds-size-large`, `--ds-red-300/500/900`, `--geist-gap-quarter`. Radius: `rounded-md` (small/medium) vs `rounded-lg` (large) — large gets both a bigger radius and bumps text to `text-base` while small/medium stay `text-sm`.

**Motion:** `transition-all duration-150` on the wrapper is the only documented motion — a 150ms ease covering the shadow/ring change between resting → hover → focus → error. No entrance/exit animation is part of the component itself.
