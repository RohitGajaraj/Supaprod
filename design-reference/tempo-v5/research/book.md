# Book

> "A responsive book component."

Source: https://vercel.com/geist/book (Vercel Geist Design System)

## Sections documented

- **Default** — a single `Book` rendered with just a `title` prop; establishes the baseline cover (default `variant="stripe"` look, no color/icon/illustration overrides).
- **Variants** — side-by-side comparison of the two cover styles: `variant="simple"` vs `variant="stripe"`, same title, same width (196px), shown in a row.
- **Custom color** — three books with a custom `color` (hex) prop, one also setting `textColor` to control the title text color against the custom cover color; mixes default and `simple` variants.
- **Custom icon** — three books each with an `icon` prop (brand mark components from `@vercel/geistcn-assets/logos`: `LogoIconVercel`, `LogoIconNext`, `LogoIconReact`), demonstrating a logo badge on the cover.
- **Custom illustration** — two books with an `illustration` prop (custom local React components, e.g. `Lines` and `Icon` imported from sibling files), one default variant and one `simple` variant, laid out with `items-stretch` (illustration affects cover height/layout).
- **Responsive** — a single `Book` where `width` is given as a responsive object (`{ sm: 150, md: 196 }`), showing the prop accepts a breakpoint-keyed size map, not just a number.
- **Width** — three books with fixed numeric `width` values (300, 200, 150) side by side, showing the cover scales proportionally as width changes.
- **Textured** — two rows demonstrating the `textured` boolean prop combined with custom `color`/`textColor`, once with default variant and once with `variant="simple"`; shows texture applies to both variants.
- **Best Practices** — accordion with three subsections: When to use, Behavior, Accessibility (content paraphrased below).

## API

Import:

```tsx
import { Book } from "@vercel/geistcn/components";
```

Optional companion imports seen in examples:

```tsx
import { LogoIconVercel, LogoIconNext, LogoIconReact } from "@vercel/geistcn-assets/logos";
```

### `<Book />` props (inferred from usage across all examples)

| Prop           | Type                                                       | Values seen                                                                                                       | Notes                                                                                                                                                                                   |
| -------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`        | `string`                                                   | e.g. "The user experience of the Frontend Cloud"                                                                  | Required in every example; the cover's label text.                                                                                                                                      |
| `variant`      | `"simple" \| "stripe"`                                     | `simple`, `stripe` (default appears to be `stripe` — omitted in the Default demo and it renders the striped look) | Controls cover treatment: `stripe` = accent stripe/spine detail, `simple` = flat title-only cover.                                                                                      |
| `color`        | `string` (hex or CSS color)                                | `"#9D2127"`, `"#7DC1C1"`, `"#FED954"`                                                                             | Overrides the cover's base/accent color. Best-practice guidance says prefer design tokens (`var(--ds-blue-700)`) over raw hex in production.                                            |
| `textColor`    | `string` (hex, named color, or token)                      | `"white"`, `"#ece4db"`, `"#9d3b05"`                                                                               | Overrides the title text color; paired with `color` for contrast when using a custom cover color.                                                                                       |
| `icon`         | `ReactNode`                                                | e.g. `<LogoIconVercel />`                                                                                         | Renders a small logo/icon badge on the cover face.                                                                                                                                      |
| `illustration` | `ReactNode`                                                | custom components (`<Lines />`, `<Icon />`)                                                                       | Renders a larger illustration on/in the cover; affects layout (examples use `items-stretch` on the wrapping flex row when illustration is present, implying variable cover height).     |
| `width`        | `number \| { sm?: number; md?: number; lg?: number; ... }` | `300`, `200`, `150`, `196`, or `{ sm: 150, md: 196 }`                                                             | Numeric = fixed px width. Object = responsive width map keyed by breakpoint token (Tailwind-style `sm`/`md` shown). Height presumably derives from width to preserve book aspect ratio. |
| `textured`     | `boolean`                                                  | `true`                                                                                                            | Adds a textured/paper-grain finish to the cover surface.                                                                                                                                |

### Composition patterns

Single book:

```tsx
<Book title="The user experience of the Frontend Cloud" />
```

Variant comparison:

```tsx
<div className="flex flex-row items-baseline justify-start gap-8 flex-initial">
  <Book title="The user experience of the Frontend Cloud" variant="simple" width={196} />
  <Book title="The user experience of the Frontend Cloud" variant="stripe" width={196} />
</div>
```

Custom color + text color:

```tsx
<Book color="#9D2127" title="How Vercel improves your website's search engine ranking" />
<Book color="#7DC1C1" textColor="white" title="Design Engineering at Vercel" variant="simple" />
<Book color="#FED954" title="The user experience of the Frontend Cloud" />
```

Custom icon (brand logos):

```tsx
<Book icon={<LogoIconVercel />} title="Vercel Platform Guide" />
<Book icon={<LogoIconNext />} title="Next.js Documentation" />
<Book icon={<LogoIconReact />} title="React Essentials" />
```

Custom illustration:

```tsx
<div className="flex flex-row items-stretch justify-start gap-8 flex-initial">
  <Book illustration={<Lines />} title="The user experience of the Frontend Cloud" />
  <Book
    illustration={<Icon />}
    title="The user experience of the Frontend Cloud"
    variant="simple"
  />
</div>
```

Responsive width:

```tsx
<Book title="The user experience of the Frontend Cloud" width={{ sm: 150, md: 196 }} />
```

Fixed widths:

```tsx
<Book title="The user experience of the Frontend Cloud" width={300} />
<Book title="The user experience of the Frontend Cloud" width={200} />
<Book title="The user experience of the Frontend Cloud" width={150} />
```

Textured, both variants:

```tsx
<div className="flex flex-row items-baseline justify-start gap-8 flex-initial">
  <Book color="#7DC1C1" textured title="Design Engineering at Vercel" />
  <Book color="#9D2127" textured title="Design Engineering at Vercel" />
  <Book color="#FED954" textured title="Design Engineering at Vercel" />
</div>
<div className="flex flex-row items-baseline justify-start gap-8 flex-initial">
  <Book color="#7DC1C1" textColor="white" textured title="Design Engineering at Vercel" variant="simple" />
  <Book color="#9D2127" textColor="#ece4db" textured title="Design Engineering at Vercel" variant="simple" />
  <Book color="#FED954" textColor="#9d3b05" textured title="Design Engineering at Vercel" variant="simple" />
</div>
```

No standalone subcomponents were shown — `Book` is used as a single, self-contained element in every example (no `Book.Cover`, `Book.Title`, etc.).

## Best practices (paraphrased)

**When to use**

- Reach for Book on marketing pages, docs landing covers, and changelog hero moments — anywhere the "labeled volume" metaphor fits the content.
- Don't use it for in-product cards or repeated dashboard rows; it's a decorative/editorial component, not a list-item primitive — use `Card` there instead.
- Choose `simple` when the title text alone should carry the design; choose `stripe` when you want an icon or color accent to add a visual hierarchy or category signal.

**Behavior**

- Drive the `color` prop from design tokens (e.g. `var(--ds-blue-700)`, `var(--ds-amber-600)`) rather than raw hex, so covers adapt automatically between light and dark themes.
- Save the `textured` treatment for a single hero/featured book — in a row of several books the texture fights with the title for attention.
- Use the responsive (breakpoint-object) form of `width` to keep the cover's proportions consistent across screen sizes; don't let it stretch/squash, since a distorted aspect ratio undermines the book illusion.

**Accessibility**

- Treat the cover art as decorative chrome; expose the actual title through a real heading element underneath/alongside it so screen readers don't announce the text twice.
- Illustrations inside the cover only need alt text if they convey information the title doesn't already state — otherwise mark them `aria-hidden`.
- If a Book is wrapped in a link, put the focus ring on the link element itself, not the decorative cover, so keyboard users get an accurate focus target.

## Design notes

- Default demo omits `variant`, and the rendered default reads as the striped cover — `stripe` is the implicit default variant.
- Standard demo width is `196` (used repeatedly as the comparison baseline in Variants/Custom-color/Textured sections); other explicit widths shown: `300`, `200`, `150`.
- `width` accepts either a plain number (px) or a responsive object keyed by breakpoint (`{ sm: 150, md: 196 }`) — consistent with Tailwind's `sm`/`md`/`lg` breakpoint naming, implying the component resolves width via CSS custom properties or container queries rather than plain inline style at a single size.
- Color examples use raw hex values (`#9D2127` deep red, `#7DC1C1` teal, `#FED954` yellow, `#ece4db` cream, `#9d3b05` rust) purely for the demo, but best-practice guidance explicitly says production usage should reference Geist design tokens (`var(--ds-blue-700)`, `var(--ds-amber-600)`) instead — meaning the component's `color` prop accepts any valid CSS color string, and the design system expects consumers to pass a `--ds-*` custom property.
- `textColor` pairs with `color` for contrast — seen paired as `color="#7DC1C1"` + `textColor="white"`, `color="#9D2127"` + `textColor="#ece4db"`, `color="#FED954"` + `textColor="#9d3b05"` — i.e. light cover gets a dark/rust text color, dark covers get near-white text.
- `icon` slot is sized for small brand marks (`LogoIconVercel`, `LogoIconNext`, `LogoIconReact` — square icon-only logo components from the Geist assets logo pack), distinct from the larger `illustration` slot which takes arbitrary custom SVG/React components (`Lines`, `Icon` in the example, imported from local `./lines` and `./icon` files) and affects the flex row's cross-axis alignment (`items-stretch` used only in the illustration example vs `items-baseline` elsewhere), implying illustrated books can vary in effective height and the layout uses stretch to align cover bottoms/tops.
- `textured` is a boolean flag layered on top of `color`/`textColor`, applied identically to both `stripe` (default) and `simple` variants in the docs, confirming texture is variant-agnostic.
- No numeric px values for height, corner radius, or font size were present in the captured JSX/props — those are internal to the component's CSS and not exposed as props on this page; only `width`, `color`, `textColor`, `icon`, `illustration`, `variant`, `textured`, and `title` are documented as the public prop surface.
- Package path is `@vercel/geistcn/components` (note: "geistcn", not "geist") and the companion assets/logos package is `@vercel/geistcn-assets/logos`.
- Sidebar shows Book sits alphabetically between Banner and Breadcrumbs in the Components nav; "Previous: Banner" / "Next: Breadcrumbs" confirms adjacency for future crawl ordering.
