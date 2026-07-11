# Command Menu

> "Launch a set of actions as a full-screen overlay." (Vercel Geist Design System — `command-menu`)

Source: https://vercel.com/geist/command-menu · fetched 2026-07-10.

## Sections documented

- **Default** — baseline demo: a trigger `Button` ("Open Command Menu") that opens a `CommandMenu` overlay with a search `CommandMenuInput`, and a `CommandMenuList` containing three `CommandMenuGroup`s ("Suggestions", "Commands", "Collaboration"), each holding one or more `CommandMenuItem`s (plain text children, no icons/suffixes).
- **With divider** — shows mixing ungrouped top-level `CommandMenuItem`s with a `CommandMenuDivider` (a plain horizontal rule between "Item 3" and the grouped items) and a single `CommandMenuGroup` below the divider. Demonstrates that items don't have to be grouped — flat items, a divider, then a group can coexist in one list.
- **With suffix** — shows `CommandMenuItem`'s `suffix` prop: two groups ("Group 1", "Group 2") of country names, each item with a trailing 3-letter country-code label (`<p className="text-copy-14 text-gray-700">`) except one item ("Switzerland") whose suffix is an `IconCheckCircle` (from `@vercel/geistcn-assets/icons`) instead of text — showing the suffix slot accepts arbitrary content (label text or an icon/status indicator) for the same item type.
- **Best Practices** (accordion, four subsections: When to use / Behavior / Content / Accessibility) — see paraphrased rules below.

No "Sizes", "Types", "States", or additional layout sections are present for this component beyond the three demos and the Best Practices accordion.

## API

### Components

- `CommandMenu` — root overlay/dialog. Props seen: `open: boolean`, `setOpen: (open: boolean) => void` (controlled open state, matches a `useState<boolean>` pair in every example).
- `CommandMenuInput` — the search/filter text field inside the menu. Props seen: `placeholder: string` (e.g. `"What do you need?"`).
- `CommandMenuList` — wraps all rows/groups/dividers; the scrollable results container.
- `CommandMenuGroup` — a labeled section of items. Props seen: `heading: string` (e.g. `"Suggestions"`, `"Group 1"`).
- `CommandMenuItem` — a single actionable row. Props seen: `callback: () => void` (invoked on select — every example wires a no-op `callback` function), `suffix?: ReactNode` (trailing content — text label or icon), and plain text/JSX children as the item label.
- `CommandMenuDivider` — a plain visual separator between ungrouped items or between groups; takes no props in the examples.
- `CommandMenuPage` — referenced only in the Best Practices prose (not shown in a live code example): implies a sub-page/multi-page navigation model. Documented sub-properties: `CommandMenuPage.label` (Title Case, names the scope, e.g. "Projects", "Team Settings") and `CommandMenuPage.placeholder` (sentence case, action-oriented, ends in an ellipsis, e.g. "Search projects…").

### Composition patterns

Minimal usage (Default demo):

```tsx
import {
  CommandMenu,
  Button,
  CommandMenuInput,
  CommandMenuList,
  CommandMenuGroup,
  CommandMenuItem,
} from "@vercel/geistcn/components";
import { useState, type JSX } from "react";

export function Component(): JSX.Element {
  const [open, setOpen] = useState(false);

  function callback(): void {
    // no op
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Command Menu</Button>
      <CommandMenu open={open} setOpen={setOpen}>
        <CommandMenuInput placeholder="What do you need?" />
        <CommandMenuList>
          <CommandMenuGroup heading="Suggestions">
            <CommandMenuItem callback={callback}>Figma Import</CommandMenuItem>
          </CommandMenuGroup>
          <CommandMenuGroup heading="Commands">
            <CommandMenuItem callback={callback}>Import Extension</CommandMenuItem>
            <CommandMenuItem callback={callback}>Manage Extensions</CommandMenuItem>
          </CommandMenuGroup>
          <CommandMenuGroup heading="Collaboration">
            <CommandMenuItem callback={callback}>Flags Explorer</CommandMenuItem>
          </CommandMenuGroup>
        </CommandMenuList>
      </CommandMenu>
    </>
  );
}
```

Ungrouped items + divider + group (With divider demo):

```tsx
import {
  Button,
  CommandMenu,
  CommandMenuDivider,
  CommandMenuGroup,
  CommandMenuInput,
  CommandMenuItem,
  CommandMenuList,
} from "@vercel/geistcn/components";
import { useState, type JSX } from "react";

export function Component(): JSX.Element {
  const [open, setOpen] = useState(false);

  function callback(): void {
    // no op
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Command Menu</Button>
      <CommandMenu open={open} setOpen={setOpen}>
        <CommandMenuInput placeholder="What do you need?" />
        <CommandMenuList>
          <CommandMenuItem callback={callback}>Item 1</CommandMenuItem>
          <CommandMenuItem callback={callback}>Item 2</CommandMenuItem>
          <CommandMenuDivider />
          <CommandMenuItem callback={callback}>Item 3</CommandMenuItem>
          <CommandMenuGroup heading="Group 1">
            <CommandMenuItem callback={callback}>Grouped Item 1</CommandMenuItem>
            <CommandMenuItem callback={callback}>Grouped Item 2</CommandMenuItem>
          </CommandMenuGroup>
        </CommandMenuList>
      </CommandMenu>
    </>
  );
}
```

Item `suffix` (text label or icon) (With suffix demo):

```tsx
import {
  Button,
  CommandMenu,
  CommandMenuGroup,
  CommandMenuInput,
  CommandMenuItem,
  CommandMenuList,
} from "@vercel/geistcn/components";
import { IconCheckCircle } from "@vercel/geistcn-assets/icons";
import { useState, type JSX } from "react";

export function Component(): JSX.Element {
  const [open, setOpen] = useState(false);

  function callback(): void {
    // no op
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Command Menu</Button>
      <CommandMenu open={open} setOpen={setOpen}>
        <CommandMenuInput placeholder="What do you need?" />
        <CommandMenuList>
          <CommandMenuGroup heading="Group 1">
            <CommandMenuItem
              callback={callback}
              suffix={<p className="text-copy-14 text-gray-700">USA</p>}
            >
              United States of America
            </CommandMenuItem>
            <CommandMenuItem
              callback={callback}
              suffix={<p className="text-copy-14 text-gray-700">ESP</p>}
            >
              Spain
            </CommandMenuItem>
            <CommandMenuItem
              callback={callback}
              suffix={<p className="text-copy-14 text-gray-700">FRA</p>}
            >
              France
            </CommandMenuItem>
          </CommandMenuGroup>
          <CommandMenuGroup heading="Group 2">
            <CommandMenuItem
              callback={callback}
              suffix={<p className="text-copy-14 text-gray-700">AUT</p>}
            >
              Austria
            </CommandMenuItem>
            <CommandMenuItem callback={callback} suffix={<IconCheckCircle color="gray-700" />}>
              Switzerland
            </CommandMenuItem>
            <CommandMenuItem
              callback={callback}
              suffix={<p className="text-copy-14 text-gray-700">GER</p>}
            >
              Germany
            </CommandMenuItem>
          </CommandMenuGroup>
        </CommandMenuList>
      </CommandMenu>
    </>
  );
}
```

Every example follows the same shape: a `Button` toggles `open` via local `useState`, the `CommandMenu` is fully controlled (`open`/`setOpen`), it always starts with one `CommandMenuInput`, then a `CommandMenuList` holding either loose `CommandMenuItem`s, `CommandMenuDivider`s, and/or `CommandMenuGroup`s in any combination.

## Best practices (paraphrased)

**When to use**

- Reach for `CommandMenu` when you need one global, keyboard-first palette that both finds resources and runs actions anywhere in the app — not scoped to a single visible control.
- If the menu is triggered from a specific control tied to one resource (a button/icon that opens a small options list), use `Menu` instead.
- If the menu is triggered by a right-click on a table/list row, use `ContextMenu` instead.
- Once a flat list would grow past roughly 30 items, or spans genuinely different resource types, split it into pages (e.g. a "Projects" page vs a "Team Settings" page) rather than one long scroll.

**Behavior**

- Wire the global open shortcut to Cmd+K on macOS and Ctrl+K elsewhere; don't let any other in-page search/filter field reuse that binding — it must stay a global, singular shortcut.
- Always reopen to the root page. If the user drills into a sub-page and backs out, restore whatever they'd already typed rather than clearing the query.
- While open, trap keyboard focus inside the overlay; on close, return focus to whatever element had it before the menu opened.
- When the input is empty, don't show a blank list — populate it with recent items or a sensible default set so the menu is immediately useful pre-typing.

**Content / copy rules**

- `CommandMenuItem` labels are Title Case verb phrases describing an action ("Deploy Project", "Invite Team Member") — never navigation phrasing like "Go to project page"; the menu performs actions, it doesn't browse.
- A `CommandMenuPage`'s `label` is Title Case and simply names the scope it represents ("Projects", "Team Settings").
- A `CommandMenuPage`'s `placeholder` is sentence case, names what's being searched, is action-oriented, and ends in an ellipsis ("Search projects…", "Type a command or search…") — a bare "Search…" doesn't say what's being searched and is considered wrong.
- `CommandMenuGroup` headings are Title Case and short (1-2 words: "Actions", "Recent").

**Accessibility**

- Put `aria-live="polite"` on the results count so screen reader users hear the list narrow as they type.
- Standard list-navigation keymap: Up/Down moves the highlighted item, Enter activates it, Escape closes the whole menu, and Backspace on an empty input pops back one page in the page stack.
- Render each item's keyboard shortcut using a `Kbd` slot so it's both visually discoverable and announced as a label to assistive tech (not just baked into plain text).

## Design notes

- **Trigger pattern**: every demo opens the menu from a plain `Button` (`onClick={() => setOpen(true)}`) — there's no dedicated "command menu trigger" subcomponent shown; `open`/`setOpen` is the only public controlled-state contract on `CommandMenu` itself.
- **Structural composition**: `CommandMenu` > `CommandMenuInput` (single, always first) > `CommandMenuList` > any mix of bare `CommandMenuItem`, `CommandMenuDivider`, and `CommandMenuGroup` (each holding its own `CommandMenuItem`s). Groups and loose items can be interleaved in the same list.
- **Suffix slot**: `CommandMenuItem`'s `suffix` prop accepts arbitrary `ReactNode` — observed filled with a `<p className="text-copy-14 text-gray-700">` text label (country code) in most rows, and with an `IconCheckCircle` (colored `gray-700`) in place of text for one row, confirming the slot is type-agnostic (label text or a status/check icon both fit the same visual slot).
- **Observed utility classes**: `text-copy-14 text-gray-700` for the suffix label typography/color (14px copy scale, gray-700 text color) — this is the only concrete token pairing visible in the shipped examples for this component. No other Tailwind/`--ds-*` custom-property classes or explicit pixel sizes/radii are exposed in the command-menu examples themselves (sizing/radius/elevation of the overlay itself lives in the underlying `@vercel/geistcn` component styles, not in the doc-page code samples).
- **Icon usage convention**: icons imported from `@vercel/geistcn-assets/icons` (e.g. `IconCheckCircle`) take a `color` prop using the same gray-scale token names as text classes (`color="gray-700"`), keeping icon and text suffix colors visually matched.
- **No motion/animation description** is given in the on-page prose for this component; behavior notes are limited to focus-trap, focus-return, and page-stack semantics (see Best Practices above).

## Notes on capture

- Page fetched successfully (~237KB raw HTML), server-rendered with a Next.js RSC flight payload (`self.__next_f.push([1, "..."])`, exactly 2 chunks for this route).
- All three "Show code" examples were recovered by decoding the flight JSON strings and extracting the `__rawString__:\`...\`` backtick-delimited code blocks embedded in the syntax-highlighter markup.
- The `CommandMenuPage` sub-API is mentioned only in the Best Practices prose (for multi-page command menus) — no live code example demonstrates it on this page; treat its `label`/`placeholder` prop shapes above as inferred from prose, not from a JSX snippet.
- No sub-pages, "Sizes", "Types", or "States" sections exist for this component beyond what's captured here — the component's public surface on this doc page is genuinely limited to the three demos plus Best Practices.
