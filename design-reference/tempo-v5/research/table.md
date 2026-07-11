# Table

> "A semantic HTML table component" (Geist, `vercel.com/geist/table`)

## Sections documented

- **Basic table** — the default `<TableRoot><Table>` composition: `TableHeader` with `TableHead` cells, `TableBody` with `TableRow`/`TableCell`. No modifiers.
- **Striped table** — same structure with `<TableBody striped>` — alternating row background for scanability on dense data.
- **Bordered table** — same structure with `<TableBody bordered>` — cell/row borders drawn instead of (or in addition to) zebra striping.
- **Interactive table** — same structure with `<TableBody interactive>` — rows get hover/press affordance, implying the whole row is clickable (e.g. drill-in to a detail view).
- **Full featured table** — combines `TableColgroup`/`TableCol` (explicit column-width control via `className="w-[NN%]"`), a computed/mapped `TableBody` (`items.map(...)`) with `interactive striped` combined, and a `TableFooter` row for a computed subtotal (`colSpan`, currency formatting via `Intl.NumberFormat`).
- **Virtualized table** — the performance/long-list variant: `TableBody virtualize`, a client component (`'use client'`) that windows a 5,000-row array, a memoized `Row` sub-component, and the `ShowMore` component (from the same package) used as a sticky "expand to see everything" control with a bottom fade-out overlay (`bg-linear-to-t ... to-transparent`) while collapsed.
- **Best Practices** (accordion, 3 subsections) — "When to use", "Behavior", "Content" — see below.

## API

Package: `@vercel/geistcn/components`

### Components / subcomponents (import list, observed across all examples)

- `TableRoot` — outermost wrapper (referred to in prose as `<Table>` at the top level, but the actual export wrapping everything is `TableRoot`).
- `Table` — the semantic `<table>` element wrapper, nested directly inside `TableRoot`.
- `TableColgroup` — wraps `TableCol` children; optional, only used when explicit column widths are needed.
- `TableCol` — one per column; takes a `className` (Tailwind width utility, e.g. `w-[44%]`) to pin column width — this is how the "Full featured" and "Virtualized" examples get stable, non-reflowing column widths.
- `TableHeader` — wraps the header `TableRow`(s); analogous to `<thead>`.
- `TableRow` — a row, valid inside `TableHeader`, `TableBody`, or `TableFooter`.
- `TableHead` — a header cell (`<th>`-equivalent), used only inside `TableHeader`'s `TableRow`.
- `TableBody` — wraps data rows; carries the visual/behavioral modifier props (see below).
- `TableCell` — a data cell (`<td>`-equivalent), used inside `TableBody`/`TableFooter` rows. Accepts `className` (seen used for emphasis: `text-gray-1000 font-medium`) and `colSpan`.
- `TableFooter` — wraps a summary/footer `TableRow` (e.g. totals), rendered after `TableBody`.
- `ShowMore` — a separate, standalone component (not a `Table.*` subcomponent) used to progressively reveal virtualized rows. Props observed: `expanded` (boolean), `noBorder` (boolean), `onClick`, `className`.

### `TableBody` boolean modifier props (each independent, combinable)

- `striped` — zebra-stripe rows.
- `bordered` — draw borders around cells/rows.
- `interactive` — hover/active row affordance (row acts like a clickable target).
- `virtualize` — enables virtualization/windowing behavior for large row counts (used together with manual JS-side windowing logic in the example — the prop appears to be a rendering/behavior flag rather than a full virtualization engine, since the example still does its own `.fill(5000)` + `index >= 9` slicing).

Multiple modifiers combine freely, e.g. `<TableBody interactive striped>` and `<TableBody interactive striped virtualize>` both appear in the official examples.

### Composition patterns (minimal usage snippets)

Basic:

```tsx
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableRoot,
} from "@vercel/geistcn/components";

export function Component(): JSX.Element {
  return (
    <TableRoot>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Col 1</TableHead>
            <TableHead>Col 2</TableHead>
            <TableHead>Col 3</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Value 1.1</TableCell>
            <TableCell>Value 1.2</TableCell>
            <TableCell>Value 1.3</TableCell>
          </TableRow>
          {/* ...more rows... */}
        </TableBody>
      </Table>
    </TableRoot>
  );
}
```

Striped / bordered / interactive — identical shape, only the `TableBody` prop changes:

```tsx
<TableBody striped>…</TableBody>
<TableBody bordered>…</TableBody>
<TableBody interactive>…</TableBody>
```

Full featured (columns + computed rows + footer):

```tsx
import {
  Table,
  TableColgroup,
  TableCol,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableFooter,
  TableRoot,
} from "@vercel/geistcn/components";

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  maximumFractionDigits: 2,
  currency: "usd",
});
function formatCurrency(amount: number): string {
  return formatter.format(amount);
}

const items = [
  { product: "Brake Pads Set", usage: "100 sets", price: "$50 per set", charge: 5000 },
  // ...more rows...
];

export function Component(): JSX.Element {
  return (
    <TableRoot>
      <Table>
        <TableColgroup>
          <TableCol className="w-[44%]" />
          <TableCol className="w-[22%]" />
          <TableCol className="w-[22%]" />
          <TableCol className="w-[11%]" />
        </TableColgroup>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Usage</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Charge</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody interactive striped>
          {items.map((item) => (
            <TableRow key={item.product}>
              <TableCell>{item.product}</TableCell>
              <TableCell>{item.usage}</TableCell>
              <TableCell>{item.price}</TableCell>
              <TableCell>{formatCurrency(item.charge)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell className="text-gray-1000 font-medium" colSpan={3}>
              Subtotal
            </TableCell>
            <TableCell className="text-gray-1000 font-medium">
              {formatCurrency(items.reduce((sum, val) => sum + val.charge, 0))}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </TableRoot>
  );
}
```

Virtualized (client component, windowed rows + progressive reveal):

```tsx
"use client";

import {
  ShowMore,
  Table,
  TableColgroup,
  TableCol,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableRoot,
} from "@vercel/geistcn/components";
import { memo, useState, type JSX } from "react";

export function Component(): JSX.Element {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="relative">
      <TableRoot>
        <Table>
          <TableColgroup>{/* ...TableCol widths... */}</TableColgroup>
          <TableHeader>{/* ...TableHead cells... */}</TableHeader>
          <TableBody interactive striped virtualize>
            {new Array(5_000).fill(null).map((_, index) => {
              if (!expanded && index >= 9) return null;
              const item = items[index % items.length];
              if (!item) return null;
              return <Row item={item} key={`${item.product}${index}`} />;
            })}
          </TableBody>
        </Table>
      </TableRoot>
      {expanded ? null : (
        <div className="from-background-100 pointer-events-none absolute bottom-0 left-0 h-[30%] w-full rounded bg-linear-to-t to-transparent opacity-80" />
      )}
      <div className={expanded ? "h-16" : "h-4"} />
      <div className="pointer-events-none absolute bottom-0 left-0 flex h-[calc(100%-160px)] w-full flex-col justify-end">
        <ShowMore
          className="pointer-events-auto sticky bottom-4 mb-4"
          expanded={expanded}
          noBorder
          onClick={() => setExpanded((x) => !x)}
        />
      </div>
    </div>
  );
}

const Row = memo(function Row({ item }: { item: (typeof items)[number] }): JSX.Element {
  return (
    <TableRow>
      <TableCell>{item.product}</TableCell>
      <TableCell>{item.usage}</TableCell>
      <TableCell>{item.price}</TableCell>
      <TableCell>{formatCurrency(item.charge)}</TableCell>
    </TableRow>
  );
});
```

## Best practices

**When to use**

- Reach for `Table` when rows share a uniform shape and at least one column needs to be sortable or compared across rows — it's for genuinely tabular, multi-column data.
- If you just need one row of descriptive text plus a single action (a membership row, an integration row), use the `Entity` component instead of forcing it into a table.
- For a key/value metadata block on a detail page, use the `Description` component rather than faking it with a two-column table.

**Behavior**

- Don't render an empty `<TableBody>` when the underlying list is empty (cleared filter, nothing created yet) — show the dedicated `Empty State` component outside the table instead.
- Missing/inapplicable values in a cell should render as an em dash (`—`), never `N/A`, `null`, or a blank string.
- Column-header sort controls are real buttons, not decorative text — keep the visible label in Title Case, treat the sort arrow as decorative, and let the button itself announce the next sort direction to assistive tech (i.e. don't rely on the arrow icon alone for a11y).
- Numeric columns should use tabular figures (`tabular-nums` or Geist Mono) so digits line up vertically for comparison across rows.

**Content**

- Column headers are Title Case noun phrases (`Last Used`, `Requests (7d)`, `Created`, `Status`) — never full sentences.
- Use short relative-time strings in cells (`2m ago`, `5h ago`) and switch to an absolute date (`Mar 14, 2026`) once the value is older than 7 days; pair with the `Relative Time Card` component for the hover/detail treatment.
- Pagination controls read `Previous` / `Next`; page-count copy is `Page 2 of 7` or a ranged form like `21–40 of 142` using an en dash inside the range.

## Design notes

- Composition is deep: `TableRoot > Table > (TableColgroup > TableCol*) + TableHeader > TableRow > TableHead + TableBody > TableRow > TableCell + TableFooter > TableRow > TableCell`. `TableRoot` is the outer positioning/scroll wrapper; `Table` is the actual `<table>`.
- Column widths are pinned via `TableCol className="w-[44%]"` etc. rather than a dedicated width prop — plain Tailwind arbitrary-value width utilities, summing to 100% across the observed 4-column layout (44/22/22/11).
- `TableBody` visual/behavioral state is expressed as bare boolean props (`striped`, `bordered`, `interactive`, `virtualize`), and they compose freely (seen doubled and tripled together) — implies these are independent CSS-class toggles on the body element, not mutually exclusive variants.
- Emphasis cells (e.g. a footer "Subtotal" row) use plain Tailwind utility classes directly on `TableCell`: `text-gray-1000 font-medium` (bold, near-black-on-dark-mode gray token) versus the default body-text color which reads as `text-gray-900` elsewhere on the page (page body copy: `text-copy-16 md:text-copy-20 text-gray-900`).
- Page heading typography (documented on the page chrome, not the component itself): `text-heading-24 md:text-heading-40 font-semibold` for the `<h1>`, `text-copy-16 md:text-copy-20 text-gray-900` with `line-height: 1.5` for the sub-description paragraph — useful as the general Geist docs-page heading scale if replicating the surrounding doc shell too.
- The virtualized example is not a "real" virtualization engine wired to `virtualize` alone — the demo pairs the prop with hand-rolled windowing (`Array(5000).fill(null)` + `if (!expanded && index >= 9) return null`) and a `memo`-wrapped `Row` component for render-cost control. Treat `virtualize` as a styling/behavior flag (e.g. containment/overflow handling) rather than an automatic list-virtualization implementation — actual large-list windowing is left to the consumer.
- Progressive disclosure of long tables uses a separate `ShowMore` component: a sticky, bottom-anchored button (`sticky bottom-4 mb-4`) paired with a fade-out gradient overlay while collapsed (`bg-linear-to-t ... to-transparent opacity-80`, height `30%` of the container, from `bg-background-100`). The gradient/overlay is manually composed by the consumer, not built into `ShowMore` or `TableBody`.
- No distinct "Sizes" or "Types" or "States" sections exist for Table on this page (unlike some other Geist components) — the documented variant axis is purely the `TableBody` boolean props plus the column/footer/virtualization composition patterns above.
- `peek` slug for the page's default preview embed is `table-default`; individual example previews are keyed `table-basic`, etc. (internal-only naming, not part of the public API).
