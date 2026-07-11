# Clearable Input

> "Text input with a clear button that resets the value on Escape."

Part of Vercel's Geist Design System (`@vercel/geistcn/components`), listed under Components alongside Input, Search Input, Combobox, etc. Page nav: Previous = Choicebox, Next = Code. No "Best Practices" accordion is present on this page (unlike some other Geist component pages) — the page is demos + a single one-line description only.

## Sections documented

- **Default** — a bare `ClearableInput` with only `aria-label`, `placeholder`, and controlled `value`/`onChange`. Demonstrates the baseline: an input that shows a clear ("x") button once it has a value, which resets the value.
- **With Label** — same component but using the `label` prop ("Email") instead of (or in addition to) `aria-label`, showing the labeled-field composition pattern.
- **With Cmdk** — adds the `cmdk` boolean prop, which (per the visible demo chrome showing `Esc` and `⌘K` hints) switches the component into a command-menu-style search input, presumably rendering keyboard-shortcut affordances (`⌘K` to focus, `Esc` to clear/blur) alongside the clear button.
- **Disabled** — adds the `disabled` boolean prop; input is pre-seeded with `'Some text'` to show the disabled/filled visual state (still shows `Esc` hint in the demo chrome, though interaction is blocked).
- **With Clear Callback** — adds an `onClear` handler (distinct from `onChange`) and shows a companion counter ("Cleared N times") to prove the callback fires specifically on clear, not on every change.

Each demo has a collapsible "Show code" toggle exposing the exact JSX shown below.

## API

Single component: **`ClearableInput`**, imported as:

```tsx
import { ClearableInput } from "@vercel/geistcn/components";
```

Props observed across the five demos (composed from a standard text-input-like API):

- `value: string` — controlled value.
- `onChange: (e: ChangeEvent<HTMLInputElement>) => void` — standard change handler; receives `e.target.value`.
- `onClear?: () => void` — fires when the clear button (or presumably Escape) resets the value; separate from `onChange`. Demo proves it does NOT require also handling onChange to detect a clear — it's a discrete event.
- `placeholder?: string`.
- `label?: string` — renders an associated field label (alternative/companion to `aria-label`).
- `aria-label?: string` — used directly in the bare/cmdk/disabled/callback demos for accessible naming when no visible `label` is used.
- `cmdk?: boolean` — opts into command-palette-style presentation/behavior (shows `⌘K`/`Esc` affordances in the demo chrome).
- `disabled?: boolean` — standard disabled state.

Full usage snippets (decoded from the page's embedded code blocks):

**Default:**

```tsx
import { ClearableInput } from "@vercel/geistcn/components";
import type { JSX } from "react";
import { useState } from "react";

export function Component(): JSX.Element {
  const [value, setValue] = useState("");
  return (
    <ClearableInput
      aria-label="Demo clearable input"
      onChange={(e) => {
        setValue(e.target.value);
      }}
      placeholder="Enter some text..."
      value={value}
    />
  );
}
```

**With Label:**

```tsx
import { ClearableInput } from "@vercel/geistcn/components";
import type { JSX } from "react";
import { useState } from "react";

export function Component(): JSX.Element {
  const [value, setValue] = useState("");
  return (
    <ClearableInput
      label="Email"
      onChange={(e) => {
        setValue(e.target.value);
      }}
      placeholder="Enter your email..."
      value={value}
    />
  );
}
```

**With Cmdk:**

```tsx
import { ClearableInput } from "@vercel/geistcn/components";
import type { JSX } from "react";
import { useState } from "react";

export function Component(): JSX.Element {
  const [value, setValue] = useState("");
  return (
    <ClearableInput
      aria-label="Search with cmdk"
      cmdk
      onChange={(e) => {
        setValue(e.target.value);
      }}
      placeholder="Search..."
      value={value}
    />
  );
}
```

**Disabled:**

```tsx
import { ClearableInput } from "@vercel/geistcn/components";
import type { JSX } from "react";
import { useState } from "react";

export function Component(): JSX.Element {
  const [value, setValue] = useState("Some text");
  return (
    <ClearableInput
      aria-label="Disabled clearable input"
      disabled
      onChange={(e) => {
        setValue(e.target.value);
      }}
      placeholder="Enter some text..."
      value={value}
    />
  );
}
```

**With Clear Callback:**

```tsx
import { ClearableInput } from "@vercel/geistcn/components";
import type { JSX } from "react";
import { useState } from "react";

export function Component(): JSX.Element {
  const [value, setValue] = useState("");
  const [clearCount, setClearCount] = useState(0);
  return (
    <div className="flex flex-col gap-2">
      <ClearableInput
        aria-label="Clearable input with callback"
        onChange={(e) => {
          setValue(e.target.value);
        }}
        onClear={() => {
          setClearCount((prev) => prev + 1);
        }}
        placeholder="Enter some text and clear..."
        value={value}
      />
      <p className="text-copy-14 text-gray-900">Cleared {clearCount} times</p>
    </div>
  );
}
```

## Best practices

No dedicated "Best Practices" accordion was present on this page at capture time (some Geist component pages have one; this one does not). Inferred usage rules from the demos and prop shape instead:

- Use it in place of a plain text `Input` whenever the field commonly needs a quick one-click reset — search boxes, filter fields, free-text entry the user often retypes.
- Always pass an accessible name — either `label` (visible) or `aria-label` (icon-only/chromeless contexts like the cmdk variant) — the clear-only-icon affordance has no inherent text.
- Treat `onClear` as a distinct signal from `onChange`, not a special case of it — wire analytics/side-effects (like the demo's clear counter) off `onClear` so you don't have to diff old/new value to detect a clear.
- The `cmdk` variant is for command-palette-style search entry points; it changes the surrounding chrome (shows keyboard hints) rather than the input's core clear behavior — don't reach for it for ordinary form fields.
- Escape-to-clear is a built-in keyboard affordance (implied by the "Esc" hint shown in every demo's chrome) — don't add a redundant custom Escape handler on top of it.
- Respect `disabled` for read-only/locked states; the clear button should not be interactable then (demo pre-fills a value specifically to prove the clear affordance is suppressed while disabled).

## Design notes

- Component/package: `ClearableInput` from `@vercel/geistcn/components` (the shadcn-flavored Geist package, distinct from the older `@vercel/geist` primitives referenced elsewhere in the flight bundle).
- Demo chrome consistently renders an `Esc` keycap hint next to every instance (and `⌘K` additionally for the `cmdk` variant), implying the clear/focus keyboard affordances are a built-in, always-visible part of the component's rendered chrome, not just an internal keybinding.
- Companion text under the "With Clear Callback" demo uses classes `text-copy-14 text-gray-900` — confirms Geist's `text-copy-14` type-scale token and the `gray-900` foreground-role token for secondary/supporting copy near a form control.
- Layout wrapper in the callback demo uses plain Tailwind utilities (`flex flex-col gap-2`), not a bespoke Geist layout primitive — suggests the component itself has no built-in vertical spacing contract with adjacent helper text; callers add their own gap.
- No explicit pixel sizes, radii, or color-state tokens (e.g. `--ds-*`, `material-*`) were present in the captured code/markup for this specific page — the component's internal styling is compiled into the Geist package rather than exposed inline in these examples; only the outer usage-level classes above were observable. Cross-reference the sibling `Input` / `Search Input` page specs for shared sizing/token values if pixel-exact reimplementation is needed, since `ClearableInput` likely shares the base text-input primitive.
