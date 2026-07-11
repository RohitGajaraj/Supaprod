# Search Input

> "Pre-configured search input with a magnifying glass icon and clear button." (Geist Design System, `vercel.com/geist/search-input`)

## Sections documented

- **Default** — a plain `SearchInput` bound to `useState`, controlled `value`/`onChange`, with a `placeholder` and a required `aria-label`. Shows the base look: leading magnifying-glass icon, trailing clear ("x") button that only appears once there is text.
- **With Cmdk** — same input but with the `cmdk` boolean prop set. Adds a trailing animated keyboard-shortcut badge showing `Esc` and `⌘K` in the same slot, used to signal the input can be summoned via Cmd+K and dismissed via Esc. The two kbd chips cross-fade/slide on hover (`data-animate="true"` swaps translate-x).
- **Disabled** — `cmdk` + `disabled` together, showing the disabled visual treatment (muted background/text, `cursor-not-allowed`) while keeping the cmdk badge present but presumably inert.
- **Loading** — `loading` boolean prop with a pre-filled `value` ("Project A"). Replaces the trailing slot with an animated 12-dot spinner (`sr-only` text "Loading...") instead of the clear button.
- **Custom Prefix** — overrides the default magnifying-glass icon by passing a `prefix` prop (e.g. `prefix={<IconSparkles />}`), showing the leading icon slot is swappable.

No "Best Practices" (When to use / Behavior / Accessibility) accordion is rendered on this page — unlike some other Geist component pages (e.g. Select), Search Input ships only the five demo sections above; there was no separate guidance copy to paraphrase.

## API

Import path: `@vercel/geistcn/components`. Icons (for prefix overrides) come from `@vercel/geistcn-assets/icons`.

```tsx
import { SearchInput } from "@vercel/geistcn/components";
import type { JSX } from "react";
import { useState } from "react";

export function Component(): JSX.Element {
  const [value, setValue] = useState("");
  return (
    <SearchInput
      aria-label="Search"
      onChange={(e) => {
        setValue(e.target.value);
      }}
      placeholder="Enter some text..."
      value={value}
    />
  );
}
```

With the command-menu affordance:

```tsx
<SearchInput
  aria-label="Search"
  cmdk
  onChange={(e) => setValue(e.target.value)}
  placeholder="Enter some text..."
  value={value}
/>
```

Disabled, still showing the cmdk badge:

```tsx
<SearchInput
  aria-label="Search"
  cmdk
  disabled
  onChange={(e) => setValue(e.target.value)}
  placeholder="Enter some text..."
  value={value}
/>
```

Loading state (spinner replaces the clear button):

```tsx
<SearchInput
  aria-label="Search"
  loading
  onChange={(e) => setValue(e.target.value)}
  placeholder="Enter some text..."
  value={value}
/>
```

Custom leading icon via `prefix`:

```tsx
import { IconSparkles } from "@vercel/geistcn-assets/icons";

<SearchInput
  aria-label="Search"
  onChange={(e) => setValue(e.target.value)}
  placeholder="Enter some text..."
  prefix={<IconSparkles />}
  value={value}
/>;
```

**Props observed across all examples:**

| Prop          | Type                                         | Notes                                                                                                                                                                                                                                                                  |
| ------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aria-label`  | `string`                                     | Required in every example — the underlying `<input>` has no visible `<label>`, so this is the accessible name.                                                                                                                                                         |
| `value`       | `string`                                     | Controlled value.                                                                                                                                                                                                                                                      |
| `onChange`    | `(e: ChangeEvent<HTMLInputElement>) => void` | Standard controlled-input handler; reads `e.target.value`.                                                                                                                                                                                                             |
| `placeholder` | `string`                                     | Rendered on the native `<input placeholder>`.                                                                                                                                                                                                                          |
| `cmdk`        | `boolean`                                    | Adds the trailing `Esc` / `⌘K` keyboard-badge pair (a command-menu affordance), replacing/joining the clear button slot.                                                                                                                                               |
| `disabled`    | `boolean`                                    | Standard disabled state; composes with `cmdk`.                                                                                                                                                                                                                         |
| `loading`     | `boolean`                                    | Swaps the trailing slot for a 12-dot spinner with `sr-only` "Loading..." text; suppresses the clear button.                                                                                                                                                            |
| `prefix`      | `ReactNode`                                  | Overrides the default leading magnifying-glass icon (e.g. swap in `IconSparkles`). No `suffix` prop was exercised in any demo — the trailing slot is owned internally by the component (clear button / cmdk badge / spinner are mutually exclusive states it manages). |

No `size` prop appears in any Search Input example (unlike sibling components such as Select, which expose `small`/`default`/`large`). Search Input renders at one fixed size only in this page's demos.

**Composition / DOM shape** (from rendered markup): the component wraps a `fieldset`-like container (`data-geist-input-wrapper`) holding: (1) a `<label data-geist-input-prefix>` housing the leading icon, (2) the native `<input type="search" data-geist-input>`, (3) a `<label data-geist-input-suffix>` housing whichever trailing control is active (clear button, cmdk kbd pair, or spinner). The native input has `type="search"`, `autoCapitalize="none"`, `autoComplete="off"`, `autoCorrect="off"`, `spellCheck={false}`, and native WebKit search-input decorations are stripped via `[appearance:textfield]` plus `[&::-webkit-inner-spin-button]:appearance-none` / `[&::-webkit-outer-spin-button]:appearance-none`.

## Design notes

- **Sizing**: input height is fixed via the token `h-(--ds-size-medium)` (i.e. `--ds-size-medium` CSS variable), not a `size` prop — this page never shows small/large variants. Horizontal padding on the input is `px-3`; container radius is `rounded-md`; text size is `text-sm`.
- **Border/shadow, not `border` utility**: the control's edge is drawn as a 1px inset shadow, not a Tailwind border class — `shadow-[0_0_0_1px_var(--ds-gray-alpha-400)]`, escalating on hover to `shadow-[0_0_0_1px_var(--ds-gray-alpha-500)]`.
- **Focus ring**: on focus, the wrapper switches to a compound shadow combining a 1px border plus a 4px outer ring: light theme `shadow-[0_0_0_1px_var(--ds-gray-alpha-600),0px_0px_0px_4px_rgba(0,0,0,0.16)]`; dark theme `dark-theme:has-[:focus]:!shadow-[0_0_0_1px_var(--ds-gray-alpha-600),0px_0px_0px_4px_rgba(255,255,255,0.24)]`. This is a `:has(:focus)` selector on the wrapper, not a focus-visible ring on the input itself.
- **Disabled state**: background becomes `var(--ds-gray-100)`, placeholder/text color drops to `var(--accents-3)` / `var(--ds-gray-700)`, `cursor-not-allowed`, and on WebKit `-webkit-text-fill-color` is force-set (a common Safari disabled-input fix).
- **Prefix/suffix icon slot sizing**: icons are sized via `size-(--ds-control-decoration-size)` — a shared decoration-size token used across Geist form controls, not a hardcoded pixel value.
- **Icon**: default prefix icon is a 16x16 magnifying-glass `<svg viewBox="0 0 16 16">` (path fill `currentColor`), swappable via the `prefix` prop.
- **Cmdk badge**: two `<kbd data-geist-kbd>` chips ("Esc" and "⌘K", rendered as `⌘`+`K` glyphs) stacked in one relatively-positioned container; each kbd is `h-5 min-w-5 min-h-5 rounded-sm text-xs`, background `var(--ds-background-100)`, ring `shadow-[0_0_0_1px_var(--ds-gray-alpha-400)]`, text color `var(--ds-gray-1000)`/`var(--ds-gray-900)`. Hover/focus state (`group-data-[animate=true]`) translates one chip out (`translate-x-[26px]`, width to `w-7`) to reveal/hide the other — an animated crossfade driven by CSS custom properties `--duration` and `--timing` (a shared motion-token pair, not a hardcoded ms value in this snippet, though the spinner elsewhere uses concrete values — see below).
- **Loading spinner**: a 12-dot radial spinner built from 12 absolutely-positioned `div`s, each `h-[1.5px] w-1`, `rounded-full`, `bg-current`, rotated in 36° increments (`rotate(0deg)…rotate(324deg)`) and translated outward (`translate(146%)`), animated with `animation: spinner-opacity 1000ms linear infinite` and staggered `animation-delay` in 100ms steps counting down from `-300ms` to `0ms` (i.e. a comet-trail fade effect). Accessible label: visually-hidden `sr-only` "Loading...".
- **Clear button**: a plain `<button type="button">` in the suffix slot, `rounded-r-md`, `hover:text-[var(--geist-foreground)]`, `focus-visible:outline-2 focus-visible:outline-[var(--ds-focus-color)] focus-visible:-outline-offset-1`; only rendered/visible when the input has a value (mutually exclusive with the loading spinner and, per the demos, largely superseded by the cmdk badge when `cmdk` is set).
- **Token naming**: consistent `--ds-*` custom-property namespace throughout (`--ds-gray-100`...`--ds-gray-1000`, `--ds-gray-alpha-400/500/600`, `--ds-background-100`, `--ds-focus-color`, `--ds-size-medium`, `--ds-control-decoration-size`), plus component-scoped `data-geist-input`, `data-geist-input-wrapper`, `data-geist-input-prefix`, `data-geist-input-suffix`, `data-geist-kbd` attributes used both for styling hooks and likely for the library's own CSS/selectors.
- **Motion**: aside from the spinner's continuous rotation/opacity loop, all documented transitions are short and easing-based — `transition-all duration-150` on the input wrapper, `transition-transform duration-[time:var(--duration)] ease-[easing-function:var(--timing)]` on the kbd-swap animation, `duration-150 ease-[easing-function:ease]` on the clear button's color/box-shadow/border transitions. No large/slow motion; everything reads as quick micro-interactions.

## Notes

- Fetch succeeded on the first attempt (210.7 KB HTML, no slug fallback needed).
- The Next.js flight payload (`self.__next_f.push`) embedded in this page turned out to be a prefetched bundle for a **different**, unrelated component page (`Select` — visible via its own `frontmatter: {title: "Select", description: "Display a dropdown list of items."}` and a "Best Practices" heading that belongs to Select, not Search Input). This is normal Next.js Link-prefetch behavior bundling sibling route data into the same document; it was not used for this spec except to confirm the JSX code-example format. All Search Input JSX examples and all "Design notes" values above were instead pulled from the actual server-rendered DOM for `/geist/search-input` (the five demo sections' real markup and classes), which is more reliable here than the flight payload for this particular page.
- All 5 unique JSX code examples (Default, With Cmdk, Disabled, Loading, Custom Prefix) were successfully extracted verbatim.
- No `size` prop or size variants appear anywhere on this page for Search Input (contrast with Select, which the incidentally-fetched flight data showed does have `small`/`default`/`large`). Do not assume Search Input has a size prop without checking the live component source.
- No dedicated Best Practices / When-to-use / Accessibility accordion exists on this specific page — confirmed via both the rendered `<h2>` id list (`default`, `with-cmdk`, `disabled`, `loading`, `custom-prefix` only) and the plain-text extraction of the static HTML.
