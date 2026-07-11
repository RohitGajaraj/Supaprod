# Context Menu

> "Displays a brief heading and subheading to communicate any additional information or context a user needs to continue." (Note: this is Geist's stock one-liner template text reused across several component pages verbatim in the source HTML — for Context Menu itself, read it as: a menu that appears at the pointer on right-click/long-press, showing contextual actions for whatever was clicked.)

## Sections documented

- **Default** — a single dashed-border trigger box ("Right click here"); right-clicking opens a `ContextMenuContent` with four plain `ContextMenuItem`s ("Item one".."Item Four"), each with an `onClick` handler and a `value` prop.
- **Disabled items** — same four-item menu, but the middle two items ("Item Two", "Item Three") carry a `disabled` prop, demonstrating the disabled visual/interactive state.
- **Link items** — same four-item shape, but each `ContextMenuItem` is rendered as a link via `href="/"` instead of `onClick`, demonstrating navigation-triggering menu items.
- **Prefix and suffix** — two trigger boxes side by side (flex row on desktop, column on mobile, `gap: 24`). First menu's items all pass a `prefix={<LogoIconVercelCircleSvg />}` icon; second menu's items all pass the same icon via `suffix={...}` instead, demonstrating leading/trailing icon slots on items that are also links (`href="/"`).
- **Best Practices** (accordion, three subsections: When to use / Behavior / Accessibility) — see Best practices below.

No other demo sections (no Sizes, Types, Variants, or States sections beyond the four above) were present on the page.

## API

Subcomponents observed in code (all imported from `@vercel/geistcn/components`):

- `ContextMenu` — root wrapper, holds trigger + content as children. No props were shown being passed to it in any example (always used bare `<ContextMenu>`).
- `ContextMenuTrigger` — wraps the element that receives the right-click/long-press binding. No dedicated props observed; the demo always wraps a plain `<div>`.
- `ContextMenuContent` — wraps the list of items (the menu surface itself). No props observed on it either.
- `ContextMenuItem` — the actionable row. Props observed across examples:
  - `onClick={(): void => ...}` — click/select handler (used in Default and Disabled examples)
  - `value="hello"` — always present in every example; a required-looking identifier/value for the item (pattern consistent with a Radix-style `Menu.Item` `value` used for selection tracking)
  - `disabled` — boolean flag disabling an item (Disabled items example)
  - `href="/"` — renders the item as a navigable link instead of a click handler (Link items, Prefix/suffix examples)
  - `prefix={<Icon />}` — leading icon/element slot (Prefix and suffix example)
  - `suffix={<Icon />}` — trailing icon/element slot (Prefix and suffix example)

No `ContextMenuSeparator`, `ContextMenuLabel`, `ContextMenuCheckboxItem`, `ContextMenuRadioItem`, or submenu subcomponents appeared in any captured example or import list — only the four above were ever imported. (Best Practices prose recommends a divider before a destructive group and warns against nested submenus, but no submenu/separator component was demonstrated in code on this page.)

### Usage snippets

Default:

```tsx
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@vercel/geistcn/components";

<ContextMenu>
  <ContextMenuTrigger>
    <div
      className="text-copy-14"
      style={{
        width: 300,
        padding: "45px 0",
        border: "1px var(--ds-gray-alpha-600) dashed",
        borderRadius: 4,
        textAlign: "center",
      }}
    >
      Right click here
    </div>
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem onClick={(): void => console.log("value")} value="hello">
      Item one
    </ContextMenuItem>
    {/* ...Item Two, Item Three, Item Four */}
  </ContextMenuContent>
</ContextMenu>;
```

Disabled items (middle two items disabled):

```tsx
<ContextMenuItem disabled onClick={(): void => console.log("value")} value="hello">
  Item Two
</ContextMenuItem>
```

Link items:

```tsx
<ContextMenuItem href="/" value="hello">
  Item one
</ContextMenuItem>
```

Prefix and suffix (two menus side by side, icon from `@vercel/geistcn-assets/logos`):

```tsx
import { LogoIconVercelCircleSvg } from "@vercel/geistcn-assets/logos";

<ContextMenuItem href="/" prefix={<LogoIconVercelCircleSvg />} value="hello">
  Item one
</ContextMenuItem>;
{
  /* second menu, same items but suffix instead of prefix */
}
<ContextMenuItem href="/" suffix={<LogoIconVercelCircleSvg />} value="hello">
  Item one
</ContextMenuItem>;
```

## Best practices

**When to use**

- Reserve ContextMenu for power-user shortcuts triggered by right-click or long-press on a row, file, or canvas object — not as a primary UI surface.
- Never make it the sole way to reach an action; every item must also exist as a visible `Menu` trigger or row button, so mouse-only and keyboard-only users have equal access.
- Pick the right menu for the job: a global command palette is `CommandMenu`; a menu opened from a visible button trigger is `Menu`; ContextMenu is specifically for the right-click/long-press case.

**Behavior**

- Bind opening to right-click on desktop and long-press on touch.
- Suppress the native OS/browser context menu only over the trigger's own hit area, never globally on the page.
- Anchor the menu to the pointer position; if it would run off-screen, flip it horizontally first, then vertically, before resorting to clipping.
- Dismiss on selecting an item, on Escape, and on an outside click. Do not dismiss just because the pointer moves off the menu (no close-on-hover-out).

**Content**

- Item labels follow the same convention as `Menu`: Title Case, Verb + Noun phrasing ("Open in New Tab", "Copy URL", "Delete Deployment"). A bare verb alone is not acceptable.
- Append an ellipsis only when the action opens a follow-up dialog before completing ("Rename…", "Move to Folder…").
- Cluster destructive actions at the bottom of the list, separated by a divider, and keep them to the same Verb + Noun phrasing — a lone "Delete" label is never acceptable on its own.

**Accessibility**

- Support the OS-level "open context menu" keyboard shortcut (Shift+F10 on Windows/Linux, or the dedicated menu key / platform equivalent) as an alternate way to open the same menu without a right-click.
- Arrow keys (Up/Down) move item focus; Enter or Space activates the focused item; Escape closes the menu and returns focus to the originating row/element.
- Keep destructive actions at the top level of the menu — avoid nesting them inside submenus, since one level of depth is what keeps keyboard navigation predictable.

## Design notes

- Demo trigger box styling (used consistently across all four examples): `width: 300px`, `padding: 45px 0`, `border: 1px var(--ds-gray-alpha-600) dashed`, `borderRadius: 4px`, `textAlign: center`, text class `text-copy-14`.
- Only one CSS custom property token appears in the captured markup/code: `--ds-gray-alpha-600` (used for the demo box border, not necessarily the real component's internal border token — it's illustrative wrapper styling around the trigger, not styling emitted by ContextMenu itself).
- Text utility classes seen on the page: `text-copy-14`, `text-copy-16`, `text-copy-20` (from surrounding page chrome/typography, not confirmed as ContextMenuItem's own internal type scale since the item internals aren't exposed in the flight payload — items render as opaque compiled components).
- The "Prefix and suffix" demo lays its two menu instances out with `className="flex flex-col md:flex-row items-stretch justify-start flex-initial"` and `style={{ gap: 24 }}` — column stack on mobile, row on `md:` and up, 24px gap.
- Icons are supplied via `prefix`/`suffix` render-prop slots taking a JSX element (`<LogoIconVercelCircleSvg />` from `@vercel/geistcn-assets/logos`), i.e. arbitrary icon components, not a fixed icon-name enum.
- No motion/animation description text was present on the page (Geist doc pages for this component do not include a written motion spec) and no color-by-state values (e.g. destructive red hue) were present in the captured code beyond the divider/grouping guidance in prose — the destructive-color styling itself isn't shown in any code example on this page, only the compositional rule to divider-separate destructive items.
- No px sizing for the menu itself (row height, menu width, corner radius of the popover) is exposed in the captured HTML/flight payload — the internal `ContextMenuContent`/`ContextMenuItem` implementation is compiled/opaque in this page's source, so those values are not observable from this page alone.
