# Badge

> "A label that emphasizes an element that requires attention, or helps categorize with other similar elements."

Source: https://vercel.com/geist/badge — fetched as static Next.js flight-rendered HTML (page title "Badge"; ~490KB raw HTML, ~319KB decoded flight payload). No 404s, no slug variants needed.

## Sections documented

- **Variants** — every color/tone combination: `gray`, `gray-subtle`, `blue`, `blue-subtle`, `purple`, `purple-subtle`, `amber`, `amber-subtle`, `red`, `red-subtle`, `pink`, `pink-subtle`, `green`, `green-subtle`, `teal`, `teal-subtle`, plus the standalone `inverted`, `Trial`, and `Turborepo` badges. Shows the full color/contrast matrix side by side.
- **Sizes** — `Small`, `Medium`, `Large` badges shown together to compare scale.
- **With icons** — every color variant repeated across `lg`/`md`/`sm` sizes, each at both default and `contrast="low"` (subtle), all rendered with a leading icon (`IconShield`) to show icon placement/sizing at each size and tone.
- **Pill** — a link-styled variant ("a special link, not quite as prominent as a button, based on `<Badge />` styling") shown at `sm`/`md`/`lg` sizes, with and without a leading logo icon (`LogoIconSlack`).
- **Best Practices** — accordion/prose block covering when to use Badge vs. Status Dot vs. Pill vs. Button, content rules, and accessibility guidance (paraphrased below).

## API

### `Badge` (from `@vercel/geistcn/components`)

```tsx
import { Badge } from '@vercel/geistcn/components';
import { IconShield } from '@vercel/geistcn-assets/icons';

<Badge variant="gray">gray</Badge>
<Badge variant="gray" contrast="low">gray-subtle</Badge>
<Badge variant="inverted">inverted</Badge>
<Badge variant="trial">Trial</Badge>
<Badge variant="turbo">Turborepo</Badge>

<Badge size="sm">Small</Badge>
<Badge size="md">Medium</Badge>
<Badge size="lg">Large</Badge>

<Badge icon={<IconShield />} size="lg" variant="gray">gray</Badge>
<Badge icon={<IconShield />} size="md" variant="gray" contrast="low">gray</Badge>
```

**Props observed:**
- `variant`: `"gray" | "blue" | "purple" | "amber" | "red" | "pink" | "green" | "teal" | "inverted" | "trial" | "turbo"`
- `contrast`: `"low"` — applied alongside a color `variant` to produce the "-subtle" tone (no `contrast="low"` shown for `inverted` / `trial` / `turbo`)
- `size`: `"sm" | "md" | "lg"`
- `icon`: a `ReactNode` (icon component instance), rendered with `data-slot="icon"`; renders left of the label with an automatic negative left-margin at `sm` for optical alignment (see Design notes)
- `children`: label text (plain text node, capitalized visually via CSS `capitalize`, not by transforming the string)

### `badgeVariants` (CVA-style class factory, same package) + Pill composition pattern

The **Pill** demo does not use `<Badge>` directly — it composes the badge's variant classes onto a `Link`/anchor via a `class-variance-authority`-style `badgeVariants()` function and the `cn` class-merge helper:

```tsx
import { badgeVariants } from '@vercel/geistcn/components';
import { LogoIconSlack } from '@vercel/geistcn-assets/logos';
import { cn } from '@vercel/geistcn/utils';
import { Link } from '@vercel/microfrontends/next/client';

<Link
  href="#badge#pill"
  className={cn(badgeVariants({ variant: 'pill', size: 'sm' }))}
>
  Label
</Link>

<Link
  href="#badge#pill"
  className={cn(badgeVariants({ variant: 'pill', size: 'md' }))}
>
  <LogoIconSlack colored data-slot="icon" />
  Label
</Link>
```

- `badgeVariants` accepts `{ variant, size }` and returns a className string — this is the composition seam for turning a Badge's look into an interactive/clickable element (link or button) without literally nesting a `<Badge>` inside an anchor.
- `variant: 'pill'` is a distinct variant value only meaningful to `badgeVariants` (not passed to `<Badge>` itself in the docs).
- Icon-in-pill uses the same `data-slot="icon"` convention as `Badge`'s `icon` prop, applied manually since Pill is composed from raw markup, not the `<Badge>` component.

### Related components referenced (not detailed on this page)

- **Status Dot** — recommended instead of Badge for a colored dot with no text.
- **Tooltip** — recommended to pair with lifecycle badges (Alpha/Beta/Early Access) to name the limitation.
- **Button** — recommended once a "badge" needs to be clickable/actionable (Badge itself must stay static/non-interactive).

## Best practices (paraphrased)

- **When to use:** Badge is for short, scannable metadata attached to the thing it describes — status, plan tier, environment, role. One badge per row; needing two side-by-side badges signals the row should become a second column instead.
- **Vs. other components:** a plain colored dot with no text should be a Status Dot, not a Badge. A clickable filter chip that toggles a query should use the `pill` variant (or a small Button), not a Badge.
- **Non-interactivity:** Badges are static labels — never attach `onClick` to one. If the value needs to be actionable, promote it to a real Button or link (this is exactly what the Pill pattern demonstrates via `badgeVariants` + `Link`).
- **Content discipline:** keep content to text, or icon + text. Never nest two icons, and never nest a child Badge inside a Badge.
- **Lifecycle badges:** pair labels like Alpha / Beta / Early Access with a Tooltip that states the concrete limitation (example given: "Alpha: API may change before GA").
- **Copy style:** Title Case, one word when possible, two words max (e.g. Active, Pending, Pro, Enterprise Trial). Match the canonical API/log term exactly rather than a friendlier synonym — their examples: "Production" not "Prod", "Deployed" not "Live", "Canceled" not "Cancelled" (single L, matching the Vercel API's spelling).
- **No redundant iconography:** don't add a checkmark for success or an X for error — the color variant alone carries that signal. Canonical color-to-meaning mapping: green = healthy, red = error, amber = warning, blue = informational/production, gray = neutral. The `-subtle` (low-contrast) tone works with any of these on dense/busy surfaces.
- **No sentence content:** don't stuff a full sentence into a badge (e.g. avoid "Currently Active" or "You are on Pro") — let the surrounding row/UI supply that context; the badge itself stays terse.
- **Accessibility:** for icon-only or otherwise ambiguous badges, set a `title` attribute so screen readers announce the meaning. Never rely on color alone to convey state — the text label itself must remain legible/readable independent of color.

## Design notes

**Shape & structure (all variants):** `inline-flex`, `shrink-0`, `items-center`, `justify-center`, `rounded-full` (fully pill-shaped, not just rounded corners), `whitespace-nowrap`, `py-0.5`, `font-medium`, `capitalize`, `tabular-nums`. Icon slot governed via arbitrary-variant selectors: `**:data-[slot=icon]:block`, `**:data-[slot=icon]:shrink-0`, and a `-webkit-transform: translate(0px,0px)` hack (likely a Safari sub-pixel/anti-aliasing fix for the icon).

**Size scale (three sizes, distinct box + type + icon geometry):**
| size | height | text size | horizontal padding | gap (icon-to-text) | icon size | extra |
|---|---|---|---|---|---|---|
| `sm` | `h-5` (20px) | `text-[11px]` | `px-1.5` | `gap-1` | `size-3` (12px) | `tracking-[0.2px]` |
| `md`/default demo | `h-6` (24px) | `text-[12px]` | `px-3` | `gap-1` | `size-3.5` (14px) | `-ml-0.5` on icon (optical pull-in) |
| `lg` | `h-8` (32px) | `text-sm` | `px-3` | `gap-1.5` | `size-4` (16px) | none |

(Note: the raw class dump shows two different `md`-ish rows — a 24px/12px row and a 32px/text-sm row — consistent with `sm`/`md`/`lg` all differing in height, font-size, padding, gap and icon size simultaneously, not just height.)

**Color tokens (all via Geist CSS custom properties, `--ds-*` design-system scale):**
- Solid `variant="blue"`: `bg-(--ds-blue-800)` + `text-(--ds-contrast-fg)` (white/near-white text for contrast on saturated fill).
- Subtle `variant="blue" contrast="low"`: `bg-(--ds-blue-200)` + `text-(--ds-blue-900)` (light tint fill, dark-tint text — the "-subtle" pattern: fill drops from the 800 step to the 200 step, text moves to the 900 step of the same hue).
- `variant="gray"` (default/solid-ish neutral in the size demo): `bg-(--ds-gray-200)` + `text-(--ds-gray-1000)`.
- `variant="inverted"`: `bg-(--ds-gray-1000)` + `text-(--ds-gray-100)` — full color inversion (near-black fill, near-white text in light theme; flips in dark theme via the token).
- `variant="trial"` / a themed dark badge: `bg-(--ds-gray-900) dark-theme:bg-(--ds-gray-500)` + `text-(--ds-contrast-fg)` — explicit dark-theme override on the fill step, confirming badges are theme-aware via `dark-theme:` variant classes, not just CSS custom-property swaps.
- General pattern confirmed across all 8 hues (gray, blue, purple, amber, red, pink, green, teal): solid = `{hue}-800` fill / contrast-fg text; subtle = `{hue}-200` fill / `{hue}-900` text. (Directly observed for blue and gray; amber/red/pink/green/teal/purple follow the same generator per the repeated demo structure, not independently confirmed per-hue in the raw DOM sample pulled.)

**Icon layout:** icon rendered via `data-slot="icon"`, sized per badge size (`size-3` / `size-3.5` / `size-4`), with a small negative left margin (`-ml-0.5`) at the middle size step to visually tuck the icon closer to the badge's rounded edge — likely optical compensation for the icon's own internal padding.

**Pill variant (interactive):** built by applying `badgeVariants({ variant: 'pill', size })` classes to a `Link` (or button) rather than the `Badge` component itself, so it can carry real interactivity (hover/focus states, `href`) while visually matching Badge. Confirms Badge and Pill share one class-variance-authority variant map, with `pill` as a variant key alongside the color hues.

**Motion:** no motion/transition behavior documented or observed in the extracted markup for Badge itself (static label, no hover/active states defined in the captured classes — consistent with the "Badges are static, don't wire onClick" guidance).

**Package/namespace:** everything ships from `@vercel/geistcn/components` (the shadcn-flavored Geist package, not a `@vercel/geist` npm import path), with icons/logos from `@vercel/geistcn-assets/icons` and `@vercel/geistcn-assets/logos`, and the pill's Link from `@vercel/microfrontends/next/client` (site-internal microfrontend routing, not relevant to a standalone re-implementation — substitute your own router's Link).
