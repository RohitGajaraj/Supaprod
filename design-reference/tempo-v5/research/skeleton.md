# Skeleton

> "Display a skeleton whilst another component is loading." (Vercel Geist)

Source: https://vercel.com/geist/skeleton — fetched via raw HTML + Next.js flight payload (`self.__next_f.push`), no browser used. Component ships from `@vercel/geistcn/components`.

## Sections documented

- **Default with set width** — bare `<Skeleton width={160} />`: a shimmering block sized only by an explicit `width`, height auto.
- **Default with box height** — `<Skeleton boxHeight={42} width={160} />`: demonstrates the `boxHeight` prop, a distinct sizing knob from `height`, used when the skeleton needs to reserve a container's outer box height (e.g. matching a control's hit area) independent of the visible bar height.
- **Wrapping children** — `<Skeleton>`/`<Skeleton show={false}>` wrapping a `<Button>`: shows the skeleton-as-wrapper pattern — when no fixed size is passed, the skeleton auto-sizes to its child, and `show={false}` reveals the child instead of the shimmer.
- **Wrapping children with fixed size** — `<Skeleton height={100} width="100%">{null}</Skeleton>` vs. the same skeleton wrapping a real `<Button>` child: shows that supplying a fixed `height`/`width` makes the skeleton hide automatically once children are non-null, while retaining the reserved size (no layout shift).
- **Pill** — `<Skeleton pill width={48} />`: fully rounded (pill) shape variant, e.g. for avatars.
- **Rounded** — `<Skeleton boxHeight={48} height={48} rounded width={48} />`: standard rounded-corner shape variant.
- **Squared** — `<Skeleton boxHeight={48} height={48} squared width={48} />`: sharp/near-zero-radius shape variant, e.g. for image tiles.
- **No animation** — `<Skeleton animated={false} height={100} width="100%">{null}</Skeleton>`: disables the shimmer animation entirely (static placeholder), e.g. for low-power / reduced-motion surfaces.
- **Button** — three sub-demos in one block: (1) wrapping a `<Button>` without the `button` prop (default animation), (2) wrapping a `<Button>` with the `button` prop set (animation extended by 1px to account for the button's own border), (3) multiple buttons loading side by side (`Save` primary + `Cancel` secondary), each independently wrapped in its own `<Skeleton button>`.
- **Best Practices** — accordion with three subsections: When to use, Behavior, Accessibility (see below).

## API

Import:

```tsx
import { Skeleton } from "@vercel/geistcn/components";
```

Composable with `Button` (and implicitly any child element) via the children-wrapping pattern:

```tsx
import { Button, Skeleton } from "@vercel/geistcn/components";
```

### `<Skeleton>` props observed in code samples

| Prop        | Type (inferred)       | Values seen                    | Purpose                                                                                                                                                           |
| ----------- | --------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `width`     | `number \| string`    | `160`, `48`, `120`, `"100%"`   | explicit width of the shimmer block                                                                                                                               |
| `height`    | `number \| string`    | `100`, `48`, `32`, `"100%"`    | explicit height of the shimmer block                                                                                                                              |
| `boxHeight` | `number`              | `42`, `48`                     | outer box height, distinct from the visible bar `height` — reserves layout space (e.g. matching a control's full hit-box) while the bar itself can render shorter |
| `show`      | `boolean`             | `false` (default true)         | when `false`, forces the wrapped child to render (skips/undoes the skeleton hide state)                                                                           |
| `pill`      | `boolean` (flag prop) | present                        | fully rounded pill shape                                                                                                                                          |
| `rounded`   | `boolean` (flag prop) | present                        | standard rounded-corner shape                                                                                                                                     |
| `squared`   | `boolean` (flag prop) | present                        | sharp-corner shape                                                                                                                                                |
| `animated`  | `boolean`             | `false` (default true)         | toggles the shimmer animation                                                                                                                                     |
| `button`    | `boolean` (flag prop) | present                        | signals the skeleton is wrapping a `<Button>`; extends the shimmer by 1px to visually cover the button's border/outline                                           |
| `children`  | `ReactNode`           | `null`, `<Button>...</Button>` | when children are non-null (truthy), the skeleton auto-reveals them (unless `show` overrides); when `null`/absent, shows the shimmer                              |

### Composition patterns

1. **Standalone placeholder** — self-closing `<Skeleton width={…} />` (and/or `height`, `boxHeight`) with no children, purely decorative loading block.
2. **Shape-only variant** — combine `pill` / `rounded` / `squared` with fixed `width`+`height` (and often `boxHeight` matching `height`) to mirror the eventual element's shape.
3. **Wrapper-reveal** — `<Skeleton>{child}</Skeleton>` where the skeleton auto-sizes to the child and swaps to showing the child once ready; `show={false}` is the escape hatch to force-reveal regardless of children.
4. **Fixed-size wrapper** — `<Skeleton height={h} width={w}>{child ?? null}</Skeleton>` reserves a stable box so revealing the child causes no reflow.
5. **Button-aware wrapper** — `<Skeleton button height={32} width={120}><Button>Loading...</Button></Skeleton>` — always pair the `button` flag with a `<Button>` child so the shimmer edge accounts for the button's border.
6. **No-animation static block** — `animated={false}` combined with a fixed-size wrapper, for reduced-motion contexts.

## Best practices (paraphrased)

**When to use**

- Reach for Skeleton when you already know the final layout and are just waiting on data — table rows, card grids, profile blocks, sidebars.
- For a single in-flight action instead of a whole layout, use a Spinner; for an indeterminate inline wait, use LoadingDots; when you can report real progress, use a Progress bar.
- Don't use Skeleton as decoration or as a stand-in for "there's nothing here" — that's what an EmptyState is for.

**Behavior**

- Size the skeleton (`width`/`height`) to match the real content's final dimensions; a block that resizes when data arrives (e.g. 200x20 collapsing to 80x16) reads as a visual glitch.
- Choose the shape flag to match what's coming: `pill` for avatars, `rounded` for buttons/chips, `squared` for image tiles.
- When wrapping children, keep the reserved dimensions stable across the loading-to-loaded transition so surrounding content doesn't reflow on reveal.

**Accessibility**

- Mark the loading region `aria-busy="true"`, and put `aria-live="polite"` on the destination container (not the skeleton element itself) so screen readers announce completion once real content lands.
- Turn off the shimmer (no-animation variant) on low-power surfaces and honor `prefers-reduced-motion`.
- Treat skeletons as purely decorative — never place focusable controls inside one while it's in the loading state.

## Design notes

- Shape vocabulary is a 3-way flag set: `pill` (fully round), `rounded` (standard radius), `squared` (sharp corner) — mutually exclusive style flags rather than a single `shape` enum in the visible examples.
- `height` vs `boxHeight` is a real distinction in the API: `boxHeight` appears to control the outer reserved box (used at 42px and 48px in the samples) independent from the visible shimmer bar `height` (also independently set, e.g. 48/100) — useful for aligning a skeleton to a control whose visual bar is shorter than its full interactive hit area.
- The `button` boolean prop exists specifically to extend the shimmer's covered area by 1px, described in-page as compensating for the button's own border/outline so the skeleton fully occludes it with no border sliver showing through.
- Observed concrete sizes in the examples: `width={160}` (default demo), `boxHeight={42}` (box-height demo), `height={32}`/`width={120}` (button-wrap demo), `48x48` (pill/rounded/squared demos), `height={100}` + `width="100%"` (full-width fixed-size demos).
- Typography class seen alongside demos: `text-label-14` (used for the small captions "Without button prop (default):" etc. — a Geist type-scale token for 14px label text, not part of Skeleton itself but shows the surrounding-copy convention).
- Layout classes used to arrange multi-skeleton demos: `flex flex-col gap-4`, `flex flex-col gap-2`, `flex gap-3`, `flex flex-col items-start justify-start gap-4 flex-initial` — plain Tailwind utility composition, no bespoke skeleton-only layout primitive.
- Motion: shimmer animation is on by default and toggled off entirely via `animated={false}` (binary on/off, no speed/easing prop surfaced in the examples). No numeric duration/easing values were present in the extracted markup — only the boolean toggle and the `prefers-reduced-motion` accessibility guidance.
- No color tokens (e.g. `--ds-*`, `gray-alpha-*`) were visible directly on the `Skeleton` component's own props/code samples in the flight payload; the shimmer's visual color comes from the compiled component internals, not exposed as a prop in these examples.
