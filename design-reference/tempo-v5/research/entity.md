# Entity

> "Displays up-to-two columns of content. The left column can contain arbitrary content, and the right column typically contains controls or actions related to the content in the left column."

Source: https://vercel.com/geist/entity

## Sections documented

- **Default** — a single `<Entity>` row: left column is an `Avatar` (32px, username "evilrabbit"), center is `EntityContent` with a title ("Evil Rabbit") and description ("Glenn Hitchcock (@gln)"), right column is a plain paragraph of secondary text ("Connected 1h ago"). Demonstrates the base three-slot anatomy (left / content / right).
- **Entity with Skeleton** — a single `<Entity>` whose child is a loading skeleton layout (one full-width `Skeleton` line plus a row of three shorter `Skeleton` pills) instead of `EntityContent`. Demonstrates the recommended loading state for a row before data resolves.
- **Entity with List** — three `<Entity as="li">` rows inside an `<EntityList>`, each with `EntityContent` (title + description) on the left/center and a small secondary `Button` ("Decline") on the right. Demonstrates composing multiple entities into a list with per-row actions.
- **Entity with List and Checkbox** — three `<Entity as="button">` rows inside `<EntityList>`, data-driven from an array, each with a `Checkbox` in the `left` slot (controlled via `useState`, with `aria-label` set to the row's title) and `EntityContent` for title/description. Demonstrates multi-select row pattern where the whole row is a clickable button toggling its checkbox.
- **Entity with Fill** — a single `<Entity>` containing two `EntityContent` elements, the first with the `fill` prop set and a description, the second without `fill`. Demonstrates the `fill` prop's effect on how content children share/distribute the row's available width.
- **Entity with Column ClassNames** — a single `<Entity>` with a placeholder `Avatar` (50px) in `left`, a plain action label ("[some action]") in `right`, and `leftClassName` / `rightClassName` props each set to a dashed-border utility class. Demonstrates that the left and right slots accept their own className overrides for custom framing (styling hook for arbitrary column content).

## API

Package: `@vercel/geistcn/components`

### `<Entity>`
Root row container.

Props observed:
- `left?: ReactNode` — arbitrary content for the left column (Avatar, icon, Checkbox, etc.)
- `leftClassName?: string` — className applied to the left column wrapper (e.g. for custom border/padding framing)
- `right?: ReactNode` — arbitrary content for the right column (buttons, status text, etc.)
- `rightClassName?: string` — className applied to the right column wrapper
- `as?: React.ElementType` — polymorphic root tag, observed as `"li"` (inside `EntityList`) and `"button"` (clickable/selectable row)
- `onClick?: () => void` — used when `as="button"` for whole-row interaction
- children — typically one or more `EntityContent` elements, or a custom layout (e.g. the Skeleton example)

### `<EntityContent>`
Center content block (title + description).

Props observed:
- `title?: string`
- `description?: string | ReactNode`
- `fill?: boolean` — makes this content block expand/fill available row width (seen paired with a second non-fill `EntityContent` to show the contrast)

### `<EntityList>`
Wraps multiple `Entity` rows (renders as a list container; child `Entity`s use `as="li"` when semantic list markup is wanted).

No additional props observed beyond children.

### Composition patterns (minimal usage)

```tsx
import { Avatar, Entity, EntityContent } from '@vercel/geistcn/components';

<Entity
  left={<Avatar size={32} username="evilrabbit" />}
  right={<p className="text-copy-14 text-gray-900">Connected 1h ago</p>}
>
  <EntityContent
    description="Glenn Hitchcock (@gln)"
    fill
    title="Evil Rabbit"
  />
</Entity>
```

```tsx
import { Entity, Skeleton } from '@vercel/geistcn/components';

<Entity>
  <div className="flex flex-col items-stretch justify-start gap-2 flex-1">
    <Skeleton height={20} width="100%" />
    <div className="flex flex-row items-center justify-start gap-2 flex-initial">
      <Skeleton height={20} width={70} />
      <Skeleton height={20} width={60} />
      <Skeleton height={20} width={68} />
    </div>
  </div>
</Entity>
```

```tsx
import { Button, Entity, EntityList, EntityContent } from '@vercel/geistcn/components';

<EntityList>
  <Entity
    as="li"
    right={
      <Button size="small" variant="secondary">
        Decline
      </Button>
    }
  >
    <EntityContent
      description="Last used just now"
      title="GitHub Desktop on MacBook Pro"
    />
  </Entity>
  {/* ...repeated for VS Code on Windows 11 / Terminal on Ubuntu 24.04 */}
</EntityList>
```

```tsx
import { useState } from 'react';
import { Checkbox, Entity, EntityList, EntityContent } from '@vercel/geistcn/components';

const items = [
  { id: 'github', title: 'GitHub Desktop on MacBook Pro', description: 'Last used just now' },
  { id: 'vscode', title: 'VS Code on Windows 11', description: 'Last used 10min ago' },
  { id: 'terminal', title: 'Terminal on Ubuntu 24.04', description: 'Last used 25min ago' },
];

const [checkedStates, setCheckedStates] = useState<Record<string, boolean>>({
  github: true, vscode: false, terminal: false,
});

const handleCheckboxChange = (id: string): void => {
  setCheckedStates((prev) => ({ ...prev, [id]: !prev[id] }));
};

<EntityList>
  {items.map((item) => (
    <Entity
      key={item.id}
      as="button"
      onClick={() => handleCheckboxChange(item.id)}
      left={
        <Checkbox
          aria-label={item.title}
          checked={checkedStates[item.id as string]}
          onChange={() => handleCheckboxChange(item.id)}
        />
      }
    >
      <EntityContent description={item.description} title={item.title} />
    </Entity>
  ))}
</EntityList>
```

```tsx
import { Entity, EntityContent, EntityList } from '@vercel/geistcn/components';

<EntityList>
  <Entity>
    <EntityContent fill description="This is a simple description" />
    <EntityContent description="This is a simple description" />
  </Entity>
</EntityList>
```

```tsx
import { Avatar, Entity, EntityContent, EntityList } from '@vercel/geistcn/components';

<EntityList>
  <Entity
    left={<Avatar placeholder size={50} />}
    leftClassName="border border-dashed border-gray-300 rounded-md p-2"
    right={<span className="text-copy-14 text-gray-900">[some action]</span>}
    rightClassName="border border-dashed border-gray-300 rounded-md p-2"
  >
    <EntityContent description="Entity with dashed borders" />
  </Entity>
</EntityList>
```

## Best practices (paraphrased)

**When to use**
- Reach for `Entity` when you need a row of descriptive content paired with one or two controls — think member rows, integration rows, domain rows.
- If the data is tabular with sortable columns and every row shares the same shape, use `Table` instead.
- If you just need a static key/value metadata block on a detail page (not an interactive row), use `Description` instead.

**Behavior**
- Keep the right column to at most one or two controls; if a row needs more actions, tuck the extras into a `Dots Menu` rather than crowding the row.
- For multi-select rows, the leading `Checkbox` should carry an `aria-label` in the form `"Select {entity name}"` so the row is operable without depending on the sighted label text.
- Show the Skeleton variant while data is loading instead of rendering an empty row; swap it for real content once the fetch resolves.

**Content**
- Lead the left column with something scannable: an `Avatar` or icon, then a Title Case label, then sentence-case secondary metadata (e.g. "Member since Mar 14, 2026").
- Word right-column buttons as Verb + Noun ("Remove Member", "Resend Invite") rather than a bare verb ("Remove", "Confirm") — a bare verb loses its context once the row scrolls out of view.

## Design notes

- Text utility classes observed in raw examples: `text-copy-14` (14px body copy) paired with `text-gray-900` for secondary/right-column text.
- Avatar sizes used in examples: `32` (default row) and `50` (custom-framed / placeholder example).
- Skeleton sizing used in the loading-state example: one full-width line at `height={20}, width="100%"`, followed by three shorter pills at `height={20}` with widths `70`, `60`, `68` — laid out with `flex flex-row items-center gap-2` inside a `flex flex-col gap-2` wrapper (`flex-1` for the stack, `flex-initial` for the pill row).
- `leftClassName` / `rightClassName` are genuine per-column style hooks — the docs' own "dashed borders" example applies `border border-dashed border-gray-300 rounded-md p-2` to demonstrate arbitrary custom framing per column, implying the columns render as normal `div`s that accept a className override.
- `as` prop makes `Entity` polymorphic: `"li"` for semantic lists (paired with `EntityList` as the `<ul>`/list wrapper), `"button"` for a fully clickable/selectable row (used with a leading `Checkbox` for multi-select).
- `EntityContent`'s `fill` prop is a layout/distribution flag — in the two-content-block example, the `fill` instance is expected to expand and consume the remaining row width while the plain instance stays intrinsic-sized; exact flex-basis/flex-grow CSS was not visible in the captured markup (only the prop and its effect are documented), so this should be verified empirically against the live component before porting pixel values.
- No explicit border-radius, row height, or color token values (`--ds-*`) were present in the captured HTML/flight payload for this component specifically — the component appears to compose purely from Tailwind utility classes plus its own layout primitives rather than exposing raw design tokens on this page. Cross-reference the Colors/Typography/Materials foundation pages (linked in the left nav: `Colors`, `Typography`, `Materials`) for the underlying token values if pixel-exact tokens are needed.
- No explicit "Sizes", "Types", "Variants", or "States" demo sections exist for this component — the six sections listed above (Default, Skeleton, List, List+Checkbox, Fill, Column ClassNames) are the complete set on the page.
- No motion/transition behavior was described in the prose or visible in the captured code for this component.
