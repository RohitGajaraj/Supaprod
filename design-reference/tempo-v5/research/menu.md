# Menu

> "Dropdown menu opened via button. Supports typeahead and keyboard navigation."

Source: https://vercel.com/geist/menu (fetched 2026-07-11)

Menu extends the [Button component](https://vercel.com/geist/button) — the trigger (`MenuButton`) is a Button under the hood and inherits its size/variant/shape props.

## Sections documented

- **Default** — baseline `MenuContainer` + `MenuButton` + `Menu` with plain `MenuItem`s, one `MenuItem` rendered as a link (`href`), and one destructive item (`type="error"`).
- **With chevron** — same menu, but `MenuButton` has `showChevron` and `variant="secondary"`; the chevron rotates on open (see Design notes).
- **Disabled items** — a `MenuItem` with the `disabled` prop, shown alongside enabled and destructive items.
- **Locked items** — `MenuItemLocked` wrapped in a `Tooltip` to explain a permission-gated, inert action.
- **Link items** — `MenuLink` variant of the item for navigation entries (in-app relative href and external/placeholder hrefs).
- **Custom trigger** — the trigger need not be a labeled `MenuButton`; here an `Avatar` is used as the trigger content with `MenuButton type="unstyled"`, still keyboard/aria-wired.
- **Prefix and suffix** — icon-only, square, small, secondary `MenuButton`s (`svgOnly`) demonstrating `MenuItem prefix={...}` and `MenuItem suffix={...}` icon slots, shown as two triggers side by side.
- **Menu position** — `MenuContainer position="left-start"` example; text notes the position auto-flips based on window/viewport bounds.
- **With section** — `MenuSection title="Section"` grouping a subset of items, plus a `MenuDivider` separating a trailing destructive item, and a `MenuItemLocked` row.
- **Best Practices** (accordion with four subsections: When to use, Behavior, Content, Accessibility) — see below.

## API

### Components

- `MenuContainer` — the root/positioning wrapper. Props seen: `position` (e.g. `"left-start"`; auto-flips to fit viewport bounds).
- `MenuButton` — the trigger; it is the Button component in disguise. Props seen: `showChevron` (boolean, renders + animates a chevron affordance), `variant` (`"secondary"` seen; inherits Button's variant set), `type` (`"unstyled"` seen, for fully custom trigger content like an Avatar), `shape` (`"square"` seen), `size` (`"small"` seen), `svgOnly` (boolean, icon-only square trigger), `aria-label` (required when `svgOnly`/icon-only, no visible text label).
- `Menu` — the popover/listbox surface. Props seen: `width` (number, px — `200` used throughout).
- `MenuItem` — a standard action row. Props seen: `onClick`, `disabled` (boolean), `type="error"` (destructive styling), `href` (renders as a link-like item without needing `MenuLink`), `prefix` (ReactNode, leading icon slot), `suffix` (ReactNode, trailing icon slot).
- `MenuItemLocked` — permission-gated row; renders disabled with a trailing lock icon. Typically wrapped in `Tooltip` to explain why it's locked.
- `MenuLink` — navigation item variant. Props seen: `href`.
- `MenuSection` — groups items under a heading. Props seen: `title` (string).
- `MenuDivider` — a visual separator between groups of items (e.g. before a destructive action).
- `Tooltip` — used to wrap `MenuItemLocked` for the "why is this disabled" explanation. Props seen: `className`, `text`.

Import paths seen in every example:
```tsx
import {
  Menu,
  MenuButton,
  MenuContainer,
  MenuDivider,
  MenuItem,
  MenuItemLocked,
  MenuLink,
  MenuSection,
} from '@vercel/geistcn/components';
import type { JSX } from 'react';
import {
  IconAccessibility,
  IconMoreHorizontal,
} from '@vercel/geistcn-assets/icons';
```

### Usage snippets (verbatim from the page's "Show code" panels)

**Default**
```tsx
import {
  Menu,
  MenuButton,
  MenuContainer,
  MenuItem,
} from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return (
    <MenuContainer>
      <MenuButton>Actions</MenuButton>
      <Menu width={200}>
        <MenuItem onClick={() => undefined}>One</MenuItem>
        <MenuItem onClick={() => undefined}>Two</MenuItem>
        <MenuItem onClick={() => undefined}>Three</MenuItem>
        <MenuItem href="https://vercel.com">Test for Link</MenuItem>
        <MenuItem onClick={() => undefined} type="error">
          Delete
        </MenuItem>
      </Menu>
    </MenuContainer>
  );
}
```

**With chevron**
```tsx
import {
  Menu,
  MenuButton,
  MenuContainer,
  MenuItem,
} from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return (
    <>
      <MenuContainer>
        <MenuButton showChevron variant="secondary">
          Actions
        </MenuButton>
        <Menu width={200}>
          <MenuItem onClick={() => undefined}>One</MenuItem>
          <MenuItem onClick={() => undefined}>Two</MenuItem>
          <MenuItem onClick={() => undefined}>Three</MenuItem>
          <MenuItem href="https://vercel.com">Test for Link</MenuItem>
          <MenuItem onClick={() => undefined} type="error">
            Delete
          </MenuItem>
        </Menu>
      </MenuContainer>
    </>
  );
}
```

**Disabled items**
```tsx
import {
  Menu,
  MenuButton,
  MenuContainer,
  MenuItem,
} from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return (
    <MenuContainer>
      <MenuButton>Actions</MenuButton>
      <Menu width={200}>
        <MenuItem onClick={() => undefined}>One</MenuItem>
        <MenuItem onClick={() => undefined}>Two</MenuItem>
        <MenuItem disabled onClick={() => undefined}>
          Three
        </MenuItem>
        <MenuItem onClick={() => undefined} type="error">
          Delete
        </MenuItem>
      </Menu>
    </MenuContainer>
  );
}
```

**Locked items**
```tsx
import {
  Menu,
  MenuButton,
  MenuContainer,
  MenuItem,
  MenuItemLocked,
  Tooltip,
} from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return (
    <MenuContainer>
      <MenuButton>Actions</MenuButton>
      <Menu width={200}>
        <MenuItem onClick={() => undefined}>View Details</MenuItem>
        <MenuItem onClick={() => undefined}>Edit</MenuItem>
        <Tooltip
          className="w-full flex"
          text="You do not have the permissions to delete."
        >
          <MenuItemLocked onClick={() => undefined}>Delete</MenuItemLocked>
        </Tooltip>
      </Menu>
    </MenuContainer>
  );
}
```

**Link items**
```tsx
import {
  Menu,
  MenuButton,
  MenuContainer,
  MenuLink,
} from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return (
    <MenuContainer>
      <MenuButton>Links</MenuButton>
      <Menu width={200}>
        <MenuLink href="/design/menu#custom-trigger">One</MenuLink>
        <MenuLink href="#">Two</MenuLink>
        <MenuLink href="#">Three</MenuLink>
      </Menu>
    </MenuContainer>
  );
}
```

**Custom trigger**
```tsx
import {
  Avatar,
  Menu,
  MenuButton,
  MenuContainer,
  MenuItem,
} from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return (
    <MenuContainer>
      <MenuButton type="unstyled">
        <Avatar size={30} username="evilrabbit" />
      </MenuButton>
      <Menu width={200}>
        <MenuItem>One</MenuItem>
        <MenuItem>Two</MenuItem>
        <MenuItem>Three</MenuItem>
      </Menu>
    </MenuContainer>
  );
}
```

**Prefix and suffix**
```tsx
import {
  Menu,
  MenuButton,
  MenuContainer,
  MenuItem,
} from '@vercel/geistcn/components';
import type { JSX } from 'react';
import {
  IconAccessibility,
  IconMoreHorizontal,
} from '@vercel/geistcn-assets/icons';

export function Component(): JSX.Element {
  return (
    <div className="flex flex-row items-stretch justify-start gap-6 flex-initial">
      <MenuContainer>
        <MenuButton
          aria-label="Menu"
          shape="square"
          size="small"
          svgOnly
          variant="secondary"
        >
          <IconMoreHorizontal />
        </MenuButton>
        <Menu>
          <MenuItem prefix={<IconAccessibility />}>Left</MenuItem>
          <MenuItem prefix={<IconAccessibility />}>Center</MenuItem>
          <MenuItem prefix={<IconAccessibility />}>Right</MenuItem>
        </Menu>
      </MenuContainer>
      <MenuContainer>
        <MenuButton
          aria-label="Menu"
          shape="square"
          size="small"
          svgOnly
          variant="secondary"
        >
          <IconMoreHorizontal />
        </MenuButton>
        <Menu>
          <MenuItem suffix={<IconAccessibility />}>Left</MenuItem>
          <MenuItem suffix={<IconAccessibility />}>Center</MenuItem>
          <MenuItem suffix={<IconAccessibility />}>Right</MenuItem>
        </Menu>
      </MenuContainer>
    </div>
  );
}
```
_Note: `Menu` is used here with no `width` prop — it sizes to content when omitted._

**Menu position**
```tsx
import {
  Menu,
  MenuButton,
  MenuContainer,
  MenuItem,
} from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return (
    <MenuContainer position="left-start">
      <MenuButton>Left Start</MenuButton>
      <Menu width={200}>
        <MenuItem>One</MenuItem>
        <MenuItem>Two</MenuItem>
      </Menu>
    </MenuContainer>
  );
}
```

**With section**
```tsx
import {
  Menu,
  MenuButton,
  MenuContainer,
  MenuDivider,
  MenuItem,
  MenuItemLocked,
  MenuSection,
} from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return (
    <MenuContainer>
      <MenuButton>Actions</MenuButton>
      <Menu width={200}>
        <MenuSection title="Section">
          <MenuItem onClick={() => undefined}>One</MenuItem>
          <MenuItem onClick={() => undefined}>Two</MenuItem>
        </MenuSection>
        <MenuItem onClick={() => undefined}>Three</MenuItem>
        <MenuItemLocked onClick={() => undefined}>Locked</MenuItemLocked>
        <MenuDivider />
        <MenuItem onClick={() => undefined} type="error">
          Delete
        </MenuItem>
      </Menu>
    </MenuContainer>
  );
}
```

### Composition patterns observed

- `MenuContainer` is always the outermost element; it holds exactly one trigger (`MenuButton`) and one `Menu`.
- The trigger and the menu are siblings inside `MenuContainer`, not nested — positioning/open-state is coordinated by the container, not by passing the trigger as a child of `Menu`.
- `MenuItem` can act as a link by passing `href` directly (no separate component needed) — `MenuLink` is a distinct, dedicated link-item component used when every item in the menu is a navigation entry.
- Destructive actions use `type="error"` on `MenuItem`, not a separate component.
- Grouping uses `MenuSection` (with a `title`) wrapping a run of `MenuItem`s; ungrouped items and a `MenuDivider` can follow in the same `Menu`.
- Icon-only triggers pair `svgOnly` + `shape="square"` + `size="small"` + a required `aria-label` (since there is no visible text).
- `MenuItemLocked` is commonly wrapped in `Tooltip` so the disabled state has a stated reason.

## Best practices

**When to use**
- Reach for Menu when a single trigger should reveal a short, discoverable list of actions scoped to one resource (e.g. the "..." menu on a table row, or a dropdown hung off a primary entity).
- Don't reuse Menu for right-click/long-press context actions (use ContextMenu instead) or for a global command palette behind Cmd+K (use CommandMenu instead).
- If there are only two closely related primary actions, prefer a split button over hiding the second action inside a menu.

**Behavior**
- The menu opens on click only — never on hover, since hover-open interactions break for screen reader users and conflict with trackpad scrolling.
- Placement isn't fixed: it auto-flips to stay inside the viewport, so don't hardcode a side that will clip on narrow screens.
- Close the menu when an item is activated, on Escape, or on an outside click — but never just because the pointer moved off it (no hover-to-close).
- For actions gated by permissions, use `MenuItemLocked` so the lock icon and disabled visual state carry the "why," rather than silently disabling a plain `MenuItem`.

**Content**
- Item labels are Title Case "Verb + Noun" (e.g. "Rename Project", "Duplicate Deployment"); a bare verb like "Rename" or "Edit" only works when the object is unambiguous from context, which is rare.
- Only append an ellipsis when the item opens a follow-up dialog/step ("Rename…", "Transfer to Team…") — not for actions that complete immediately.
- Destructive items belong together at the bottom of the menu, separated from the rest by a divider, and keep the same Verb + Noun phrasing (e.g. "Delete Project" — never a bare "Delete").
- Section headings (`MenuSection`'s `title`) stay short — one or two Title Case words ("Workspace", "Recent Projects").

**Accessibility**
- Arrow Up/Down move focus between items, Home/End jump to the first/last item, Enter or Space activates the focused item.
- Typeahead lets a user type a character to jump to the next item starting with it — so keep the visible label as the first thing rendered in the item so what's typed matches what's read.
- On close, focus must return to the trigger button so keyboard users don't lose their place in the surrounding row/list.

## Design notes

- `Menu` accepts an explicit pixel `width`; `200` is the width used in every non-icon-only example. When omitted (the icon-only prefix/suffix demo), the menu sizes to its content instead.
- `MenuButton` is literally the Button component — every Button prop applies: `variant` (`"secondary"` shown), `shape` (`"square"` shown), `size` (`"small"` shown, using the shared `--geist-form-small-height` / `--geist-form-small-font` tokens visible on the underlying trigger markup), `svgOnly` (icon-only), `showChevron` (adds a rotating chevron affordance), `type="unstyled"` (strips all Button chrome so an arbitrary node like `Avatar` can serve as the trigger).
- Trigger button chrome tokens observed directly in the rendered markup: default trigger height uses `--height:var(--ds-size-medium)` at `text-[14px]`, `rounded-md` corners, `!px-(--geist-gap-half)` horizontal padding, background `var(--ds-gray-1000)` / foreground `var(--ds-background-100)` (inverted/high-contrast "primary" trigger by default); the "With chevron" example switches to the `variant="secondary"` token set: `--themed-bg:var(--ds-background-100)`, `--themed-fg:var(--ds-gray-1000)`, `--themed-border:var(--ds-gray-400)`, with a `shadow-[0_0_0_1px_var(--themed-border,_transparent)]` outline instead of a filled background.
- Focus ring token: `data-[focus]:shadow-[0_0_0_1px_var(--themed-border,_transparent),0_0_0_2px_var(--ds-background-100),0_0_0_4px_var(--ds-focus-color)]` — a double-ring focus treatment (border color + background gap + accent focus color), consistent with other Geist interactive controls.
- The chevron affordance in "With chevron" is a wrapped `<svg>` inside a `span[data-open="false"]` with class `rotate-0 transition-transform duration-150` — i.e. it rotates via a CSS transform over `150ms` when `data-open` flips to `true` (standard Geist transition timing, matches the trigger's own `duration-[time:150ms] ease-in-out`).
- Destructive `MenuItem` (`type="error"`) styling wasn't visible in the closed/static markup (menu content renders client-side on open) but is documented as a first-class `type` prop value, paired in the Best Practices copy with bottom-of-list placement + a `MenuDivider`.
- Icon slots: `prefix`/`suffix` accept a `ReactNode` (icon component instance, e.g. `<IconAccessibility />`), letting the same `MenuItem` support a leading or trailing icon without a different subcomponent.
- Icon-only triggers use the square/small Button treatment (`shape="square"`, `size="small"`, `svgOnly`) and rely on `aria-label` for the accessible name since there is no visible text — matches the header's own icon-only "Open menu" button pattern seen elsewhere on the page.
- `MenuContainer position` accepts placement keywords (`"left-start"` demonstrated); the component recalculates/flips this automatically against window bounds rather than the consumer having to branch on viewport size.
- No explicit motion duration/easing was documented in prose beyond the chevron's `150ms ease-in-out` transform; open/close animation for the menu panel itself was not visible in the static (closed) HTML snapshot since Radix mounts the panel content (`id="radix-..."`, `hidden`) only once opened client-side.
