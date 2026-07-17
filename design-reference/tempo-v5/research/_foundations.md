# Geist Foundations

Source pages (fetched headlessly via curl, cached in `research/.cache/`):

- https://vercel.com/geist/introduction
- https://vercel.com/geist/colors
- https://vercel.com/geist/typography
- https://vercel.com/geist/materials
- https://vercel.com/geist/icons (redirects — see § 5)

All prose below is paraphrased; quoted strings and class/value names are copied verbatim from the pages' rendered content (extracted from the Next.js RSC payload embedded in each page's HTML).

---

## 1. System structure

The Geist site (`vercel.com/geist/*`) is Vercel's public design-system reference. The homepage (`/geist/introduction`) carries the H1 "Geist Design System" with the tagline "Vercel design system for building consistent web experiences," and the shared page `<meta>` description across all five pages reads "Vercel's design system called Geist. Made for building consistent and delightful web experiences."

**Left sidebar taxonomy.** The nav is grouped into three labeled sections, in this order:

1. **Foundations** — Introduction, Colors, Typography, Materials (the four pages this doc covers; there is no separate "Icons" entry — see § 5).
2. **Brands** — sub-brand themes layered on the same system: Vercel, Turbo, v0, eve, AI SDK.
3. **Components** — roughly 70 component reference pages (Avatar, Badge, Banner, Book, Breadcrumbs, Browser, Button, Calendar, Card, Checkbox, Choicebox, Clearable Input, Code, Code Block, Collapse, Combobox, Command Menu, Context Card, Context Menu, Copy Button, Description, Destructive Action Modal, Dots Menu, Drawer, Empty State, Entity, Error, Error Card, Feedback, Fieldset, File Tree, Gauge, Grid, Input, JSON View, Keyboard Input, Label, Load More Button, Loading Dots, Menu, MiddleTruncate, Modal, Multi Select, Note, Pagination, Phone, Progress, Project Banner, Radio, Relative Time Card, Scroller, Search Input, Select, Separator, Sheet, Show More, Skeleton, Slider, Snippet, Spinner, Split Button, Status Dot, Switch, Table, Tabs, Text With Copy Button, Textarea, Theme Switcher, Toast, Toggle, Tooltip, Video, and more).

The homepage itself surfaces this same structure as a card grid: a large "Brands" card (linking to `/geist/brands`), then one card per component, plus a small "Icons" teaser card described below.

**Navigation model.** The header is a fixed/sticky bar (max width 1220px) containing the Geist logo mark + wordmark (linking to `/geist`), a `Search Geist` trigger button, a component command-menu affordance, pagination controls, and the theme switcher; the page body below is a two-column layout on desktop (`xl:grid-cols-[260px_1fr]`) — a persistent left sidebar (the Foundations/Brands/Components tree above) plus the main content column — collapsing to a single column with the sidebar tucked away on mobile/`md` widths.

**Search (cmd+K).** The header's `Search Geist` button renders a keyboard-shortcut badge reading "K" preceded by the command-key glyph, i.e. the documented shortcut is **⌘K** (Cmd+K on Mac) to jump into search from anywhere on the site.

**Theme switching.** A three-way segmented control (radio group) in the header lets the visitor pick **System**, **Light**, or **Dark** — implemented as three radio inputs (`aria-label="light"`, `aria-label="dark"`, and a system option) with icon glyphs, so the whole documentation site (not just code samples) is themeable live.

---

## 2. Colors

The Colors page H1 reads "Colors" with the subtitle "Learn how to work with our color system. Right click to copy raw values." — i.e. the live swatches are copy-to-clipboard on right-click.

**The 10 scales x 10 steps model.** The page states directly: "There are 10 color scales in the system. P3 colors are used on supported browsers and displays." The 10 named scales are: **backgrounds, gray, gray-alpha, blue, red, amber, green, teal, purple, pink.** Each chromatic/gray scale runs in 10 numbered steps from `-100` (lightest) to `-1000` (darkest/most saturated), e.g. `gray-100 … gray-1000` — confirmed by the role mapping below, where "Color 1" through "Color 10" line up exactly with steps 100 through 1000 of the gray scale.

**Semantic roles** (the page walks these as five distinct groups, each rendered as swatches over a `var(--ds-gray-N)` / `var(--ds-background-N)` CSS variable):

- **Backgrounds 1–2** ("There are two background colors for pages and UI components. In most instances, you should use Background 1 — especially when color is being placed on top of the background. Background 2 should be used sparingly when a subtle background differentiation is needed."):
  - Background 1 (`--ds-background-100`) — default element background.
  - Background 2 (`--ds-background-200`) — secondary background.

- **Colors 1–3: Component Backgrounds** ("These three colors are designed for UI component backgrounds."):
  - Color 1 (`gray-100`) — default background.
  - Color 2 (`gray-200`) — hover background.
  - Color 3 (`gray-300`) — active background.
  - Documented pairing rule: if a component's default background is Background 1, use Color 1 for its hover state and Color 2 for its active state; on small elements like badges, Color 2 or Color 3 can serve as the base background instead.

- **Colors 4–6: Borders** ("These three colors are designed for UI component borders."):
  - Color 4 (`gray-400`) — default border.
  - Color 5 (`gray-500`) — hover border.
  - Color 6 (`gray-600`) — active border.

- **Colors 7–8: High Contrast Backgrounds** ("These two colors are designed for high contrast UI component backgrounds."):
  - Color 7 (`gray-700`) — high-contrast background.
  - Color 8 (`gray-800`) — hover high-contrast background.

- **Colors 9–10: Text and Icons** ("These two colors are designed for accessible text and icons."):
  - Color 9 (`gray-900`) — secondary text and icons.
  - Color 10 (`gray-1000`) — primary text and icons.

**When to use which, in short:** reach for Background 1/2 to lay out page and panel surfaces; Colors 1–3 for anything with its own fill that needs hover/active states (buttons, menu items, badges); Colors 4–6 for the border/stroke of that same component through its interaction states; Colors 7–8 when a background itself needs to read as high-contrast/emphasized (e.g. a filled dark button); and Colors 9–10 for the text/icon ink on top of all of the above, split into secondary vs. primary emphasis.

**P3 / wide-gamut note.** The only explicit statement on the page is the one quoted above — "P3 colors are used on supported browsers and displays" — meaning the palette ships wide-gamut (Display P3) values that browsers/displays capable of it will render, falling back gracefully elsewhere. The page's static markup does not spell out "OKLCH" by name or expose the raw CSS color functions (the actual swatch values are supplied to a client-rendered `ColorPalette` component rather than being present as literal `oklch()`/`color(display-p3 …)` strings in the page source), so that implementation detail could not be confirmed directly from this fetch.

---

## 3. Typography

The Typography page H1 reads "Typography" with the subtitle "Rules of typesetting throughout the system." Its "Usage" section explains the delivery mechanism: "Our typography styles can be consumed as Tailwind classes. The classes below pre-set a combination of font-size, line-height, letter-spacing, and font-weight for you based on the Geist Core Figma system" — i.e. each class name is a single atomic Tailwind utility that bakes in all four typographic properties at once, so authors never hand-tune them individually.

**The Subtle / Strong `<strong>` modifier convention.** Several classes carry a documented "modifier" (subtle or strong) that is triggered purely by markup, not by a separate class: "To make use of the Subtle and Strong modifiers, all you have to do is use the `<strong>` element nested as the descendant of a given typography class," e.g.:

```html
<p className="text-copy-16">Copy 16 <strong>with Strong</strong></p>
```

So the parent element carries the size class (e.g. `text-copy-16`), and any inline text wrapped in `<strong>` automatically picks up that class's heavier ("Strong") or dimmer ("Subtle") weight variant — no extra utility class needed.

**Tabular numbers.** Called out specifically on `text-label-13`: "Tabular is used when conveying numbers for consistent spacing" — i.e. the label-13 class has a tabular-figures variant reserved for numeric strings (timestamps, counters) so digits keep a fixed width and don't jitter as they change.

**The class families, with each class's documented usage guidance:**

**Headings** ("Used to introduce pages or sections."):

| Class             | Modifier | Usage                                                      |
| ----------------- | -------- | ---------------------------------------------------------- |
| `text-heading-72` | —        | Marketing heroes.                                          |
| `text-heading-64` | —        | (size step, no separate usage note)                        |
| `text-heading-56` | —        | (size step, no separate usage note)                        |
| `text-heading-48` | —        | (size step, no separate usage note)                        |
| `text-heading-40` | —        | (size step, no separate usage note)                        |
| `text-heading-32` | subtle   | Marketing subheadings, paragraphs, and dashboard headings. |
| `text-heading-24` | subtle   | (size step)                                                |
| `text-heading-20` | subtle   | (size step)                                                |
| `text-heading-16` | subtle   | (size step)                                                |
| `text-heading-14` | —        | (size step)                                                |

**Buttons** ("Only to be used within components that render buttons."):

| Class            | Usage                                                         |
| ---------------- | ------------------------------------------------------------- |
| `text-button-16` | Largest button.                                               |
| `text-button-14` | Default button.                                               |
| `text-button-12` | Only used when a tiny button is placed inside an input field. |

**Label** ("Designed for single-lines, and given ample line-height for highlighting & marrying up with icons."):

| Class                | Modifier / suffix                | Usage                                                                                                         |
| -------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `text-label-20`      | —                                | Marketing text.                                                                                               |
| `text-label-18`      | —                                | (size step)                                                                                                   |
| `text-label-16`      | strong                           | Used in titles to help differentiate from regular (body) text.                                                |
| `text-label-14`      | strong                           | Most common text style of all. Used in many menus.                                                            |
| `text-label-14-mono` | —                                | Largest form of mono, to pair with larger (>14) text.                                                         |
| `text-label-13`      | "with Strong, and Tabular (123)" | Used as a secondary line next to other labels. Tabular is used when conveying numbers for consistent spacing. |
| `text-label-13-mono` | —                                | Used to pair with Label 14, as the smaller mono size looks better in that pairing.                            |
| `text-label-12`      | "with Strong, AND CAPS"          | Used for tertiary-level text in busy views, like Comments, Show More, and the capitals in Calendars.          |
| `text-label-12-mono` | —                                | (mono companion, no separate usage note)                                                                      |

**Copy** ("Designed for multiple lines of text, having a higher line height than Label."):

| Class               | Modifier | Usage                                                             |
| ------------------- | -------- | ----------------------------------------------------------------- |
| `text-copy-24`      | strong   | For hero areas on marketing pages.                                |
| `text-copy-20`      | strong   | For hero areas on marketing pages.                                |
| `text-copy-18`      | strong   | Mainly for marketing, big quotes.                                 |
| `text-copy-16`      | strong   | Used in simpler, larger views like Modals where text can breathe. |
| `text-copy-14`      | strong   | Most commonly used text style.                                    |
| `text-copy-13`      | —        | For secondary text and views where space is a premium.            |
| `text-copy-13-mono` | —        | Used for inline code mentions.                                    |

(Cells marked "size step, no separate usage note" mean the page lists the class as part of the scale but only attaches prose usage guidance to specific steps — those specific quoted strings above are exact; the rest of each family is a straight numeric size progression at the same role.)

---

## 4. Materials

The Materials page H1 reads "Materials" with the subtitle "Presets for radii, fills, strokes, and shadows." — Materials are the system's elevation/surface presets: named bundles of corner radius + background fill + stroke + shadow that stand in for hand-rolling those four properties separately.

**Every preset, with its documented radius and elevation semantics**, grouped exactly as the page groups them:

_Surface_ ("On the page."):

- `material-base` — "Everyday use. Radius 6px."
- `material-small` — "Slightly raised. Radius 6px."
- `material-medium` — "Further raised. Radius 12px."
- `material-large` — "Further raised. Radius 12px."

_Floating_ ("Above the page."):

- `material-tooltip` — "Lightest shadow. Corner 6px. Tooltips will be the only floating element with a triangular stem."
- `material-menu` — "Lift from page. Radius 12px."
- `material-modal` — "Further lift. Radius 12px."
- `material-fullscreen` — "Biggest lift. Radius 16px."

So there are eight presets total across two families: four "Surface" (on-page, resting-to-raised: base/small/medium/large, radii 6/6/12/12px) and four "Floating" (above-page, progressively lifted: tooltip/menu/modal/fullscreen, radii 6/12/12/16px, tooltip uniquely carrying a pointer/stem shape). Elevation reads as a strict ladder — each step is documented as visually "further" or "biggest" lift than the one before it, driven by shadow strength rather than by radius alone (base and small share a 6px radius but small is called out as "slightly raised").

**Best-practice rules** (the page organizes them under three headers — When to use, Behavior, Accessibility — each paraphrased below):

_When to use:_

- Reach for a Material instead of hand-assembling radius/fill/stroke/shadow yourself — the preset name itself encodes the element's elevation role.
- Choose the preset by where the element sits in the layered hierarchy: `base` for resting cards, `small`–`large` for progressively raised content, `tooltip`/`menu` for floating popovers, `modal` for dialogs, `fullscreen` for full takeovers.
- Never stack two Materials on the same element; if a child needs more elevation than its parent, give the child its own Material at a higher step instead.

_Behavior:_

- Keep the elevation choice aligned with the element's z-index band, so (for example) a `tooltip`-typed surface never visually sits below a `base` card.
- Prefer the lowest elevation that still reads as raised against its background — over-elevating is called out as a common source of visual noise.
- Let the Material preset drive the chrome (radius/fill/stroke/shadow) and use ordinary layout spacing for positioning, rather than overriding shadows ad hoc on the same element.

_Accessibility:_

- Materials are purely decorative chrome; the actual semantics (e.g. `role="dialog"` on a modal, `role="tooltip"` on a tooltip) belong on the role-bearing wrapper element, not the Material itself.
- Don't rely on shadow alone to signal elevation — pair it with a matching focus-visible ring on any focusable children inside.
- Test Materials in both light and dark themes: shadow contrast reads weaker on dark backgrounds than on light, so separation needs to be reconfirmed there.

---

## 5. Icons

**There is no dedicated, standalone "Icons" documentation page.** Both `https://vercel.com/geist/icons` and the sidebar-adjacent `https://vercel.com/geist/geistcn-icons` (the only icon-shaped link discoverable from the Introduction page's markup) return an HTTP **307 redirect** to `https://vercel.com/geist/introduction` (confirmed via `curl -I`; the fetched HTML for `/geist/icons` is byte-identical to the Introduction page and its `<link rel="canonical">` points back at `/geist/introduction`). So this section documents what the official site actually shows about icons, which is limited to a teaser card on the homepage rather than a full spec page.

**What the teaser shows:** the Introduction page's card grid includes an "Icons" card with the one-line description **"Icon set tailored for developer tools."** — positioning the Geist icon set as purpose-built for the kind of dense, technical UI Vercel's own product surfaces use (dashboards, CLIs, logs), rather than a general-purpose or marketing icon library.

**Distribution / package name.** No npm package name, install command, or GitHub link is shown anywhere on the fetched pages for the icon set specifically (the one `npx create-next-app` snippet present in the page markup is a generic "get started with Next.js" snippet used elsewhere on the site, unrelated to icon installation). Based on what's actually rendered in these five pages, **there is no publicly documented install path for the icon set** — it is used natively throughout vercel.com/geist (every inline icon across all five fetched pages, including the Geist wordmark itself, is tagged `data-slot="geist-icon"`), but that internal usage is not the same as a published, installable package, and this fetch found no evidence of one.

**Sizing / stroke conventions (inferred from every icon instance actually rendered across the five pages):**

- All 44+ sampled `data-slot="geist-icon"` SVGs share the same internal coordinate grid: `viewBox="0 0 16 16"` — icons are authored on a 16x16 unit grid.
- Display size varies by placement (the header logo mark renders at 27x27, one instance at 20x20, everything else at the native 16x16) while keeping that same 16-unit viewBox — i.e. icons scale cleanly rather than being redrawn per size.
- Every sampled icon is a **solid/filled** glyph (`<path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="...">`) inheriting `currentColor` for tinting — there is no `stroke`/`stroke-width` attribute on any sampled icon, so this is a filled icon system, not an outlined/line-icon system.

**Publicly installable:** not confirmed. Nothing in the fetched Foundations pages links to an npm package, a public Figma library, or a GitHub repo for the icon set; the only public-facing surface is the homepage teaser card, and the two candidate dedicated-page URLs both redirect away rather than resolving to real content.
