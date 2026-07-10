# Multi Select

> "A keyboard-navigable dropdown for selecting multiple items with advanced focus management."

Source: https://vercel.com/geist/multi-select (Geist Design System, Vercel). Package: `@vercel/geistcn/components`.

## Sections documented

- **Select Actions** — demonstrates the three interaction modes available on each row: checkbox focus (Enter/Space toggles just that item), button focus (Enter/Space runs a smart contextual action — Select Only / Select All / Toggle depending on state), and hidden action labels that only reveal themselves on hover/focus. Live demo: a 3-item list (Design System, Components, Design Tokens) with 2 preselected, trigger reads "2 items selected."
- **Keyboard Navigation** — demonstrates the full keyboard model: Up/Down arrows move between rows while preserving whichever of checkbox/button had focus; Left/Right arrows swap focus between the row's checkbox and its action button; Tab leaves the menu entirely (no focus trap on tab-out); Enter/Space executes whatever is currently focused. Live demo: a 4-item list (Frameworks, Libraries, Development Tools, Databases) with 1 preselected, trigger reads "1 category selected."
- **Controlled State** — demonstrates driving the component's selection from external state/handlers, including bulk operations wired to plain `Link` triggers outside the menu: Clear All, and two named presets ("Core Features," "Advanced Features"). Live demo: a 4-item list (Analytics, Monitoring, Security, Performance) with 1 preselected, trigger reads "Selected: analytics" and shows a custom joined-name label instead of a count once a small number of items are picked.
- **Best Practices** (accordion) — When to use / Behavior / Accessibility guidance (see below).

Every demo section includes a live interactive rendering plus a "Show code" toggle revealing the full TSX source (all three toggles were captured).

## API

### Components (composition)

```tsx
import {
  MultiSelectRoot,
  MultiSelectTrigger,
  MultiSelectContent,
  MultiSelectRow,
} from '@vercel/geistcn/components';
```

- **`MultiSelectRoot`** — top-level wrapper/provider; no props observed being passed in any example (state is fully lifted to the consumer via `useState<Set<string>>`).
- **`MultiSelectTrigger`** — the closed-state button/handle. Takes no props in the examples; its children are computed label text (a render-prop-free plain conditional expression), not an internal count prop — the consuming app is responsible for building the label string itself (see label-composition rules below).
- **`MultiSelectContent`** — the dropdown/popover panel that hosts the rows.
  - `align` — `"start"` (only value observed; presumably also supports `"center"`/`"end"` per typical Radix popover alignment, not confirmed on page).
- **`MultiSelectRow`** — one selectable row/item. Props observed:
  - `key` — React list key (item id).
  - `name: string` — the visible row label.
  - `checked: boolean` — controlled checked state for that row.
  - `onChange: () => void` — toggle handler for that single row (checkbox path).
  - `onSelectOnly: () => void` — handler invoked by the row's contextual action button when it means "select only this item."
  - `onSelectAll: () => void` — handler invoked by the row's contextual action button when it means "select all items" (surfaced on rows depending on current selection state).
  - `selectedCount: number` — current number of selected items across the whole list, passed down so the row can decide which contextual action to show/label.
  - `totalCount: number` — total number of selectable items, same purpose as above.

No `MultiSelectItem`, `MultiSelectValue`, `MultiSelectSearch`/filter subcomponent, or explicit "select all" root-level primitive was present in any of the three captured examples — the "select all" and "select only" behavior is implemented entirely by the consumer's handlers, keyed off `selectedCount`/`totalCount` passed into `MultiSelectRow`, not by dedicated subcomponents.

### Usage pattern (canonical shape used by all 3 examples)

```tsx
import { useState } from 'react';
import {
  MultiSelectRoot,
  MultiSelectTrigger,
  MultiSelectContent,
  MultiSelectRow,
} from '@vercel/geistcn/components';

const items = [
  { id: 'design', name: 'Design System', count: 42 },
  // ...
];

function Component() {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(
    new Set(['design']),
  );

  const handleItemToggle = (id: string) => {
    const next = new Set(selectedItems);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedItems(next);
  };
  const handleSelectOnly = (id: string) => setSelectedItems(new Set([id]));
  const handleSelectAll = () =>
    setSelectedItems(new Set(items.map((i) => i.id)));

  return (
    <MultiSelectRoot>
      <MultiSelectTrigger>
        {selectedItems.size === 0
          ? 'No items selected'
          : selectedItems.size === items.length
            ? 'All items selected'
            : `${selectedItems.size} items selected`}
      </MultiSelectTrigger>
      <MultiSelectContent align="start">
        {items.map((item) => (
          <MultiSelectRow
            key={item.id}
            name={item.name}
            checked={selectedItems.has(item.id)}
            onChange={() => handleItemToggle(item.id)}
            onSelectOnly={() => handleSelectOnly(item.id)}
            onSelectAll={handleSelectAll}
            selectedCount={selectedItems.size}
            totalCount={items.length}
          />
        ))}
      </MultiSelectContent>
    </MultiSelectRoot>
  );
}
```

Note the `items` array shape carries a `count` field (`{ id, name, count }`) in every example dataset, but `count` is never actually read anywhere in the three examples — it looks like leftover/decorative sample data, not a component prop.

### Trigger label composition rules seen across examples

- Zero selected → a "No X selected" string.
- All selected → an "All X selected" string.
- Exactly one selected → an explicit singular string in one example ("1 category selected") — i.e. the consumer special-cases singular vs. plural rather than the component doing it.
- Some-but-not-all selected → either a count string (`` `${n} items selected` ``) or, in the controlled-state example, a literal joined list of selected names (`` `Selected: ${Array.from(selectedItems).join(', ')}` ``). Both patterns are shown as valid; the component imposes no fixed label format.

### External bulk-action wiring (Controlled State example)

Bulk actions (Clear All, and two named presets) are implemented as plain `Link` components (also from `@vercel/geistcn/components`) placed outside the `MultiSelectRoot`, each with `type="highlight"` and an `onClick` that calls `setSelectedItems` directly — there is no dedicated "bulk actions" subcomponent.

```tsx
<Link type="highlight" onClick={handleClearAll}>Clear All</Link>
```

## Best practices (paraphrased)

**When to use**
- Reach for Multi Select when someone needs to pick more than one value out of a known, bounded list (e.g. regions, scopes, tags).
- If only one value can be picked from a short list, use `Select` instead.
- If typing-to-filter matters more than seeing the whole option set at a glance, use `Combobox` instead.
- Don't use Multi Select for a single boolean setting — that's what `Toggle` is for.

**Behavior**
- The trigger should summarize the selection as a count ("3 regions selected") once more than one item is picked, but show the single item's name when exactly one is picked.
- Prefer controlled mode whenever the selection needs to live in the URL or sync to a server, so the trigger label and the stored value can't drift apart.
- Keep the two focus tracks (row checkbox vs. row action button) distinct: vertical arrow keys should always move between rows, horizontal arrow keys should always move between the checkbox and the button within a row.
- When a filtered/searched list comes up empty, show a specific message that echoes the query (`No {items} match "{query}"`) rather than a generic "No results."

**Accessibility**
- Every row's checkbox needs its own descriptive `aria-label` (e.g. "Select us-east-1") — a bare "Select" gives screen reader users no anchor to what they're selecting.
- The trigger needs a stable accessible name even at zero selections; don't lean on placeholder text alone to carry that meaning.
- Focus should be trapped inside the open menu, and returned to the trigger when the menu closes.
- Bulk actions ("Select All," "Select Only") should be announced through the same visible label the button shows, so what's spoken matches what's on screen.

## Design notes

- Package/import path: `@vercel/geistcn/components` (note: `geistcn`, not `geist`, in the actual import — matches the site's shadcn-style component library naming).
- Sample-copy typography classes observed in demo wrapper markup: `text-copy-14` (body copy, 14px scale) paired with `text-gray-900` for helper/instructional text under the control (e.g. "Hover over items to see action labels...").
- Layout spacing observed: demo wrapper uses `space-y-4` (16px vertical rhythm) between the `MultiSelectRoot` and any helper text/links below it; the controlled-state example's link row uses `flex flex-col gap-2 flex-wrap`.
- No numeric control heights (32/36/40px), border radii, or `--ds-*` custom-property tokens were present anywhere in the captured HTML/flight payload — the component's own internal styling is not exposed in the page source (it lives inside the compiled `@vercel/geistcn` package, not in the docs-site bundle). Only the surrounding demo-page utility classes are visible.
- Code blocks are rendered with `data-language="tsx"` and `data-theme="dark"` and syntax-highlighted with an inline color palette (e.g. keywords `#F97583`, plain tokens `#E1E4E8`, strings `#9ECBFF`, punctuation `#24292E`) — this is the docs site's Shiki-style highlighter theme, not a Multi Select design token.
- Keyboard-navigation copy in the second demo uses literal arrow glyphs (`↑ ↓` for rows, `← →` for checkbox/button focus) rather than icon components.
- No motion/transition behavior is described in the prose; nothing on open/close animation, easing, or duration was documented on the page.
- No size/variant/state prop enums were documented — this page has no "Sizes," "Types," "Variants," or "States" demo sections; the only variance shown across examples is selection state, controlled vs. semi-controlled label composition, and the three action-mode interactions covered above.
