# Theme Switcher

> "Component that allows users to switch between light and dark themes."

## Sections documented

- **Default** — the standard-size control (three-option segmented radio group: system / light / dark) with full label text ("Select a display theme:" as a visually-hidden legend, per-option `aria-label`s of "system" / "light" / "dark").
- **Small** — the same control rendered with the `small` prop, shrinking the pill/segment height for dense chrome (footers, dropdowns).
- **Disabled** — the same control rendered with the `disabled` prop; every radio input gets the native `disabled` attribute, greying out the control and blocking interaction (documented as distinct from the auto-disable behavior driven by `forcedTheme`).
- **Best Practices** — an accordion of prose guidance (when to use, sizing choice, state wiring via `next-themes`, auto-disable behavior, and "don't rebuild this yourself" guidance). Paraphrased below.

Only 3 live demos are present on the page (Default, Small, Disabled) — no separate "Sizes"/"Types"/"Variants"/"States" headings beyond these three.

## API

Single exported component, no documented subcomponents.

```tsx
import { ThemeSwitcher } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return <ThemeSwitcher />;
}
```

```tsx
import { ThemeSwitcher } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return <ThemeSwitcher small />;
}
```

```tsx
import { ThemeSwitcher } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return <ThemeSwitcher disabled />;
}
```

Props observed:
- `small?: boolean` — renders the compact size (adds `data-small` to the root `<fieldset>` and cascades a `data-[small]:` Tailwind variant down to each segment/label).
- `disabled?: boolean` — sets native `disabled=""` on each of the three radio `<input>` elements; visual state comes from the `disabled:` / `aria-disabled:` Tailwind variants already baked into the label/segment classes (no separate disabled skin — same classes fire whether disabled is manual or driven by `forcedTheme`).
- No `value`/`onChange`/`theme` props are exposed in any example — state is implicit, sourced from `next-themes` context (see Best Practices).

Composition / internal structure (from rendered markup, useful for a faithful rebuild):
- Root: `<fieldset>` — the segmented control container. Carries `isolate flex ... rounded-full h-8 w-fit p-0 border-0 m-0 data-[small]:h-6`.
- `<legend class="sr-only">Select a display theme:</legend>` — visually hidden group label.
- Three segments, each: `<span class="h-full"><input type="radio" value="system|light|dark" aria-label="system|light|dark" id="theme-switch-{value}-{reactId}" class="appearance-none p-0 m-0 outline-none absolute peer" /><label for="..."><span class="sr-only">{value}</span><span class="relative z-[1] size-4"><svg data-slot="geist-icon">…</svg></span></label></span>`.
- Each option is a native radio input visually hidden (`appearance-none ... absolute`) paired with a sibling `<label>` styled via the `peer` / `peer-checked` / `peer-focus-visible` Tailwind pattern — no JS-driven active-state class toggling, pure CSS sibling selectors off the radio's checked/focus state.
- Icon per option: system = a "monitor" glyph, light = a "sun" glyph, dark = a "moon" glyph (inline SVG, `viewBox="0 0 16 16"`, `data-slot="geist-icon"`, `fill="currentColor"`, no hardcoded fill color — inherits text color from the label).
- `disabled` variant: identical markup with `disabled=""` added to each `<input>`.

## Best practices

- This is the canonical Light / System / Dark control — use one instance per app (footer or settings), never duplicated on multiple screens.
- Reach for `small` in tight chrome (footers, dropdowns/menus); use the default size on a settings page where the option labels/spacing have room to breathe.
- Treat it as a controlled read of app-wide theme state, not local component state: it reads/writes through `next-themes`, so the app must be wrapped in `GeistProvider` once at the root, and you should not shadow or mirror that state into your own React state.
- The control disables itself automatically when the provider has a `forcedTheme` set; the manual `disabled` prop is only meant for showing a read-only/inert preview of the control itself, not for general app logic.
- Don't hand-roll a theme picker from a `Switch` or a trio of icon buttons — this component already owns the icon set, per-option `aria-label`s, and system-theme detection, so a custom rebuild duplicates and risks drifting from that behavior.
- Leave the three option labels (`light`, `system`, `dark`) as-is — they map directly to `next-themes` keys and stay translatable; relabeling them breaks that contract.

## Design notes

- Root control height: `h-8` (32px) default, `h-6` (24px) with `small`. Fully pill-shaped: `rounded-full`.
- Root border/edge: `shadow-[var(--ds-shadow-border)]` (a hairline border implemented as a box-shadow token, not a real `border`) with `border-0` explicitly zeroing any native border.
- Each segment/label: `size-8` (32px square) default, `data-[small]:size-6` (24px square) — so default icon hit target is 32x32, small is 24x24; label itself is `rounded-full`, `flex items-center justify-center`, `cursor-pointer`.
- Icon size: `size-4` (16px) SVGs (`viewBox="0 0 16 16"`), wrapped in `relative z-[1]` span so the icon layers above the checked-state background fill.
- Color roles (all via CSS custom properties, not literal Tailwind colors):
  - Idle/unselected icon+text: `text-[var(--ds-gray-700)]`.
  - Hover (unselected): `hover:text-[var(--ds-gray-1000)]`.
  - Checked/selected state: `peer-checked:text-[var(--ds-gray-1000)]`, `peer-checked:bg-[var(--ds-background-100)]`, plus `peer-checked:shadow-[0_0_0_1px_var(--ds-gray-400),0px_1px_2px_0px_var(--ds-gray-alpha-100)]` (a 1px ring + soft drop shadow standing in for a card-like active pill), and the icon glyph is force-colored `peer-checked:[&_svg]:!text-[var(--accents-8)]`.
  - Keyboard focus (focus-visible on the underlying radio): `peer-focus-visible:shadow-[var(--ds-focus-ring)]`, `peer-focus-visible:text-[var(--ds-gray-1000)]`, and the same `[&_svg]:!text-[var(--accents-8)]` icon-color override as checked.
  - Disabled state (native `disabled` on the radio cascades via the label's `group-` classes elsewhere in the design system's shared disabled recipe): `disabled:cursor-not-allowed`, `disabled:text-[var(--ds-gray-700)]`, `disabled:bg-[var(--ds-gray-100)]` (and `aria-disabled:` mirrors for the aria-disabled case).
- Selection mechanism: pure CSS, no active JS class-toggling — each `<input type="radio">` is visually hidden (`appearance-none ... absolute`) and marked `peer`; the sibling `<label>` uses `peer-checked:`/`peer-focus-visible:` Tailwind variants to skin itself. This means the whole active/hover/focus state machine is CSS-only.
- Icon set: 3 custom "geist-icon" SVGs at 16x16 — a monitor/display icon for "system", a sun icon for "light", a moon icon for "dark" — each `fill="currentColor"` so they always match the current text color token above.
- Layout: the 3 segments are children of a `flex` fieldset with `isolate` (creates its own stacking context so the `z-[1]` icon layering and shadow rings don't clip against ancestors) and `w-fit` (control hugs its content width, doesn't stretch).
- No transition/animation classes were observed on the checked-state shadow or background swap — state changes (light/dark/system, hover, focus, disabled) all render as instant CSS variable/utility swaps rather than an explicit `transition-*`/duration utility on this component (contrast with `Textarea`/similar Geist inputs elsewhere in the same page which do carry `duration-[time:150ms] ease-in-out`).
