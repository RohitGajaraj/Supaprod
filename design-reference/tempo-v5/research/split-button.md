# Split Button

> "A button that offers a primary interaction coupled with a dropdown menu offering additional actions." — Geist Design System

Source: https://vercel.com/geist/split-button

## Sections documented

- **Default** — a single `SplitButton` with a primary "Save" action plus a dropdown of two menu items (`Save`, `Save + Redeploy`); demonstrates the rule that the primary action is repeated as the first menu item. Rendered at all 3 sizes (`small` / `medium` / `large`) crossed with both non-destructive variants (`default` / `secondary`).
- **Menu Alignment** — two side-by-side `SplitButton` instances, identical except one sets `menuAlignment="bottom-end"` (menu right-aligns to the trigger) vs. the implicit default `bottom-start` (menu left-aligns, under the primary button).
- **Icon** — a `SplitButton` labeled "Copy page" whose dropdown menu items each carry an `icon` prop (brand logos, `v0` and `ChatGPT`), showing icon-per-item composition and a fixed-width menu (`menuProps={{ width: 240 }}`) plus per-item `className` sizing (`w-[200px]`).
- **Title with Icon** — same size/variant grid as Default, but each `SplitButtonMenuItem`'s `title` is replaced with a `<span>` combining an icon (`IconFloppyDisk`, `IconArrowCircleUp`) and text, showing that `title` accepts a `ReactNode`, not just a string.
- **Best Practices** — accordion-style guidance covering when to use the pattern, behavior rules (primary/menu mirroring, restricted variants, labeling), and accessibility (the `menuButtonLabel` / `aria-label` contract).

## API

### `SplitButton`

Composed of a primary button (left) and a menu trigger (right, chevron-style) that opens a dropdown; two-part control rendered as one visual unit.

Props observed in the code examples:
- `buttonProps: ButtonProps` — spread onto the primary button. Used to pass `onClick`, `size`, `variant`, etc. (reuses the base `Button` component's prop shape).
- `menuButtonLabel: string` — accessible name for the trailing dropdown-trigger segment; becomes its `aria-label`. Example values: `"Select save method"`, `"Copy page"`.
- `menuItems: ReactNode` — the dropdown contents; either a JSX fragment (`<>...</>`) of `SplitButtonMenuItem`s or an array of `SplitButtonMenuItem` elements (each needs a `key` when in array form).
- `menuAlignment?: "bottom-start" | "bottom-end"` — controls horizontal alignment of the opened menu relative to the trigger. Default is `bottom-start`.
- `menuProps?: { width?: number }` — passed through to the underlying menu/dropdown; `width` sets a fixed pixel width (`264`, `240` seen in examples).
- `children: ReactNode` — the primary button's visible label (e.g. `Save`, or the icon-composed `Copy page`).

Restricted prop values (per Best Practices, enforced by the type system):
- `buttonProps.variant` (aka the component's "type") is restricted to `'default' | 'secondary'` — destructive/other variants are intentionally not allowed on the primary segment.
- `buttonProps.size` accepts the standard `ButtonProps['size']` union — examples enumerate `'small' | 'medium' | 'large'`.

### `SplitButtonMenuItem`

One row in the dropdown menu.

Props observed:
- `title: ReactNode` — the item's label; can be plain text (`"Save"`) or a composed node (icon + text span).
- `description?: string` — secondary/helper text under the title (e.g. `"Save changes and create a new production deployment"`).
- `menuItemProps: object` — spread onto the underlying menu item element; used for `onClick`, and `className` (e.g. `'w-[200px]'` to size icon-menu items).
- `icon?: ReactNode` — leading icon/logo node (e.g. `<LogoVZeroSvg className="w-4 h-4" />`).
- `key` — required when items are passed as an array rather than a fragment.

### Usage snippets

Minimal primary + one alternate action:
```tsx
import { SplitButton, SplitButtonMenuItem } from '@vercel/geistcn/components';

<SplitButton
  buttonProps={{ onClick: () => alert('Clicked Saved') }}
  menuButtonLabel="Select save method"
  menuItems={
    <>
      <SplitButtonMenuItem
        title="Save"
        description="Save changes"
        menuItemProps={{ onClick: () => alert('Clicked Save') }}
      />
      <SplitButtonMenuItem
        title="Save + Redeploy"
        description="Save changes and create a new production deployment"
        menuItemProps={{ onClick: () => alert('Clicked Save + Redeploy') }}
      />
    </>
  }
  menuProps={{ width: 264 }}
>
  Save
</SplitButton>
```

Right-aligned menu:
```tsx
<SplitButton
  buttonProps={{ onClick: () => alert('Clicked Saved') }}
  menuAlignment="bottom-end"
  menuButtonLabel="Select save method"
  menuItems={/* ... */}
  menuProps={{ width: 264 }}
>
  Save
</SplitButton>
```

Icon-only menu items with array form and per-item width:
```tsx
import { LogoIconOpenAiSvg, LogoVZeroSvg } from '@vercel/geistcn-assets/logos';

<SplitButton
  buttonProps={{ onClick: () => console.log('Copy page'), size: 'small', variant: 'secondary' }}
  menuButtonLabel="Copy page"
  menuItems={[
    <SplitButtonMenuItem
      key="v0"
      title="Open in v0"
      description="Open this page in v0"
      icon={<LogoVZeroSvg className="w-4 h-4" />}
      menuItemProps={{ onClick: () => console.log('v0'), className: 'w-[200px]' }}
    />,
    <SplitButtonMenuItem
      key="chatgpt"
      title="Open in ChatGPT"
      description="Open this page in ChatGPT"
      icon={<LogoIconOpenAiSvg className="w-4 h-4" />}
      menuItemProps={{ onClick: () => console.log('ChatGPT'), className: 'w-[200px]' }}
    />,
  ]}
  menuProps={{ width: 240 }}
>
  Copy page
</SplitButton>
```

Icon-composed title:
```tsx
import { IconArrowCircleUp, IconFloppyDisk } from '@vercel/geistcn-assets/icons';

<SplitButtonMenuItem
  title={
    <span className="flex gap-2 items-center">
      <IconFloppyDisk /> Save
    </span>
  }
  description="Save changes"
  menuItemProps={{ onClick: () => alert('Clicked Save') }}
/>
```

Full size/variant matrix pattern used in both Default and "Title with Icon" demos:
```tsx
const SIZES: ButtonProps['size'][] = ['small', 'medium', 'large'];
const TYPES: Extract<ButtonProps['variant'], 'default' | 'secondary'>[] = ['default', 'secondary'];

TYPES.map((variant) =>
  SIZES.map((size) => (
    <SplitButton
      key={`${variant}`}
      buttonProps={{ onClick: () => alert('Clicked Saved'), size, variant }}
      menuButtonLabel="Select save method"
      menuItems={/* ... */}
      menuProps={{ width: 264 }}
    >
      Save
    </SplitButton>
  ))
);
```

## Best practices (paraphrased)

- **When to use:** reach for a Split Button when there is one obvious default action plus 1-4 closely related variants that belong right next to it (e.g. a "Deploy" button with a "Deploy to Preview" variant). If the extra actions aren't tightly related to the primary one, use a plain `Menu` instead — don't force unrelated actions into this pattern.
- **Mirror the primary action:** the first row in the dropdown must be the exact same action as the primary button, both in behavior and in the visible label. This keeps keyboard and screen-reader users on parity with mouse users — nobody should discover a "hidden" first option that differs from what's already visible.
- **No destructive primaries:** the primary segment's variant is limited to `default` or `secondary` by the type system. The component won't let you make the visible action `destructive`, because burying a delete/remove action inside a dropdown is considered an unsafe pattern.
- **Label menu items consistently:** use Title Case and a Verb + Noun phrasing for every item (e.g. "Deploy to Production", "Promote to Production", "Rollback Deployment"). If a destructive item must appear in the menu, group it at the bottom, separated by a divider from the safe actions.
- **Name the menu trigger for assistive tech:** always set `menuButtonLabel` to a short, descriptive sentence naming the whole action set (e.g. "More deploy options"). It becomes the dropdown trigger's `aria-label` and is literally the only thing a screen reader announces for that segment, so make it self-sufficient.
- **Alignment default:** leave `menuAlignment` at its default (`bottom-start`, menu hangs under the primary button) unless the split button sits flush against the right edge of its container, in which case switch to `bottom-end` so the menu doesn't overflow the viewport/container edge.

## Design notes

- Two-segment control: a primary action button fused to a trailing dropdown-trigger segment (chevron), visually one pill/rectangle.
- Sizes inherit directly from the base `Button` component's size scale: `small`, `medium`, `large` (exact px values not exposed in markup on this page — infer from the shared `Button` spec/token set, e.g. Geist's typical 32/36/40px control heights).
- Variant (color/fill) scale on the primary segment is restricted at the type level to `default` and `secondary` only — no `destructive` (or other) variant is selectable for the primary action, enforced by `Extract<ButtonProps['variant'], 'default' | 'secondary'>` in the demo source.
- Menu width is explicit and fixed via `menuProps={{ width }}` — 264px used for text-only menus, 240px used for the icon/logo menu (with individual items additionally set to `w-[200px]` via `className`).
- Menu alignment is a two-value enum: `bottom-start` (default, left edge under trigger) vs `bottom-end` (right edge under trigger) — purely horizontal offset control, no top/above placement variant shown.
- Menu items support: `title` (string or node), `description` (secondary line, string), `icon` (leading node, seen as 16px/`w-4 h-4` logo SVGs), and pass-through `menuItemProps` for `onClick`/`className`/etc.
- No color tokens, `--ds-*` custom properties, or `material-*` class names were present in the static/server-rendered HTML for this page (the live demo is client-hydrated and its DOM/class output isn't in the initial payload); only the source-code strings were recoverable from the Next.js flight payload. Re-derive exact token names from the shared `Button`/`Menu` component specs instead.
- Package origin: components ship from `@vercel/geistcn/components` (the installable Geist-for-shadcn distribution), icons from `@vercel/geistcn-assets/icons`, and brand logos from `@vercel/geistcn-assets/logos` — confirms this is the "geistcn" (shadcn-flavored) distribution of Geist, not a closed internal-only component.
