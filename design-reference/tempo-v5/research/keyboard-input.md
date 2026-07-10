# Keyboard Input (`Kbd`)

> "Display keyboard input that triggers an action."

Source: https://vercel.com/geist/keyboard-input (fetched via headless curl, SSR HTML parsed; the "Show code" panels are Radix Collapsible content that unmounts when closed and is populated client-side only — no JSX source string is present in the server-rendered HTML or in the Next.js flight payload for this page, so the code samples below are reconstructed from the rendered demo markup, the Best Practices prose (which quotes real `<Kbd>` usage inline), and the sitewide `data-geist-kbd`/class conventions. Flagged where reconstructed vs. verbatim.)

## Sections documented

- **Modifiers** — three separate `<Kbd>` pills shown side by side, each holding one bare modifier glyph with no accompanying key: a blank/space pill, `⇧` (Shift), `⌥` (Option/Alt), `⌃` (Control). Demonstrates that each modifier renders as its own glyph span and that a `Kbd` can be rendered with only a modifier and no `children` key.
- **Combination** — a single `<Kbd>` pill containing two `<span>` children: an empty/space span followed by `⇧`. Demonstrates that when a key is combined with a modifier, the modifier and the key render as multiple `<span>`s *inside one* `<Kbd>` element (one visual pill for the whole combo), not as separate adjacent `Kbd`s.
- **Small** — a single `<Kbd>` pill at the compact size, containing one span with `/`. Demonstrates the `small` size variant for dense UI (e.g. this exact demo — a `/` key — mirrors the "focus search" shortcut hint pattern used in the page's own header search button).
- **Best Practices** — prose accordion covering when/how to use `Kbd`: use inside prose/menus/button suffixes vs. spelling shortcuts out in long-form docs; passing modifiers as boolean props; `children` contract (single key/digit/named key); the `small` size for dense surfaces; punctuation placement outside the element.

Note: the page footer also lists two nav-adjacent affordances ("Was this helpful?" feedback widget and a "JSON View" prev/next pager) that are shared chrome across all Geist component pages, not part of the Kbd component itself.

## API

Component: **`Kbd`** (rendered DOM tag: `<kbd data-geist-kbd="" data-version="v1">`).

Live usage snippet actually quoted on the page (Best Practices prose — verbatim):
```jsx
<Kbd>Cmd+K</Kbd>              {/* ANTI-PATTERN: called out as wrong — hardcodes the glyph */}
Press <Kbd meta>K</Kbd> to open the command menu.
```

Reconstructed minimal usage per demo section (props inferred from rendered markup — not verbatim source):
```jsx
// Modifiers — bare modifier glyphs, no key
<Kbd />
<Kbd shift />
<Kbd alt />
<Kbd ctrl />

// Combination — modifier + key rendered as one pill
<Kbd shift>K</Kbd>

// Small — compact size, single key
<Kbd small>/</Kbd>

// Sitewide usage (site header "Search Geist" button uses the same component)
<Kbd small>K</Kbd>
```

Props surfaced by the Best Practices text and the rendered markup:
- `meta` (boolean) — Cmd on macOS, swaps to "Ctrl" glyph/label on Windows/Linux automatically.
- `shift` (boolean)
- `alt` (boolean) — renders `⌥`.
- `ctrl` (boolean) — renders `⌃`.
- `small` (boolean or size flag) — compact sizing for dense surfaces (menu rows, command-bar items, table cells).
- `children` — exactly one key: a single letter/digit (`K`, `7`) or one named key (`Enter`, `Esc`). Explicitly disallowed: lowercasing it, spelling a modifier out inside children, or packing a sentence/phrase into the element.

Composition/authoring rules called out explicitly:
- Modifiers are boolean props, not part of `children` — never author `<Kbd>Cmd+K</Kbd>` as a literal string.
- Punctuation (period, comma, "or") stays in the surrounding prose/JSX text node, outside `<Kbd>`, e.g. `Press <Kbd meta>K</Kbd> to open the command menu.` (period sits after the closing tag).
- For narrative long-form docs that need to survive copy-to-plain-text, write the shortcut as plain prose ("the ⌘ K shortcut") instead of using the component, so the rendered text and the copied text match.

## Best practices (paraphrased)

- **When to use**: reach for `Kbd` anywhere you're hinting at a keyboard shortcut inline — body copy, menu items, button suffixes. If a doc page is walking through a shortcut in long-form narrative prose, just type the shortcut as plain text instead so it still reads correctly when copy-pasted elsewhere.
- **Modifiers as data, not text**: always pass `meta`/`shift`/`alt`/`ctrl` as boolean props rather than typing the modifier glyph or word into `children`. The component owns platform detection and will substitute the correct glyph (e.g. Ctrl instead of Cmd) on Windows/Linux — hardcoding `Cmd+K` as a string breaks that and shows the wrong key to non-Mac users.
- **One key per instance**: `children` should be exactly one key — a letter, a digit, or a named key like `Enter`/`Esc`. Keep its casing as-is (don't lowercase), don't embed a modifier word inside it, and never put a full instruction/sentence inside the element.
- **Size discipline**: default size for normal inline use; switch to the `small` variant only inside visually dense chrome — menu rows, command palette items, table cells — where the default size would crowd neighboring text.
- **Punctuation and accessibility**: keep sentence punctuation (periods, commas, the word "or") outside the `Kbd` element, in the surrounding text, specifically so screen readers don't misread punctuation as if it were part of the key combination being announced.

## Design notes

- Root element is a semantic `<kbd>` tag, tagged `data-geist-kbd=""` and `data-version="v1"` (component is versioned, implying a v1/v2 migration path exists elsewhere in Geist).
- Default size classes observed: `font-sans!`, `[&>span]:font-inherit`, `text-[var(--ds-gray-1000)]` (foreground), `bg-[var(--ds-background-100)]` (fill), `shadow-[0_0_0_1px_var(--ds-gray-alpha-400)]` (1px inset border simulated via box-shadow, not a real border), `!leading-[1.7em]`, `inline-block`, `text-center`, `rounded-sm`, `text-sm`, `px-1.5 py-0`, `min-w-[var(--geist-gap)]`, `min-h-6`, `ml-1` (spacing when chained after adjacent text/other kbds).
- `small` size classes: same color/shadow/font treatment, but `text-xs`, `h-5` (fixed height, not just min-height), `px-1 py-0`, `min-w-5 min-h-5`, `ml-0.5` — noticeably tighter horizontal rhythm and a fixed 20px square-ish footprint vs. the default's ~24px min-height.
- The "fill" is a background token (`--ds-background-100`, i.e. it sits on the page's raised/card surface color) plus a hairline ring via `box-shadow` using `--ds-gray-alpha-400` (a translucent gray, not a solid gray) rather than a CSS `border` — this is a recurring Geist pattern for crisp 1px edges that don't add to box size.
- Corner radius: `rounded-sm` at both sizes (small, consistent radius regardless of size — not scaling radius with size).
- Multi-key combinations render as multiple `<span>` children inside a single `<kbd>` wrapper (one visual "pill" per combination), each span independently styled by `[&>span]:font-inherit`; a leading empty/whitespace span (`<span style="min-width:1em;display:inline-block"> </span>`) appears to reserve room for an icon/glyph slot before the visible key glyph — likely the modifier-icon slot rendered empty when no modifier prop is passed.
- The sitewide header "Search Geist" button reuses the exact same `Kbd` component at `small` size to show the `K` shortcut hint, styled with an added `search-module__HXqoSW__fadeIn` class for an entrance fade — confirms `Kbd` is the canonical building block for the product's own command-menu trigger, not just a docs example.
- No distinct color-by-state variants were observed for `Kbd` itself (unlike components such as Banner/Badge that carry role colors) — it is a neutral/gray-only component; color always derives from `--ds-gray-1000` (text) and `--ds-background-100` (fill) tokens, theme-aware via CSS custom properties (so it inverts automatically in dark mode).
- No visible motion/transition classes on `Kbd` itself in the captured markup (static presentation); motion only appears on the header's reused instance via the shared `fadeIn` utility class, which is page-level, not component-level.

## Notes on capture

- Page slug `keyboard-input` resolved correctly (no 404); SSR HTML was ~146KB, well within the expected 80-200KB range.
- Only one `self.__next_f.push([1, "..."])` flight chunk exists on this page and it contains only client-component `I[...]` module reference wiring (e.g. `LoadMoreButton` imports for the footer pager) — no MDX-compiled JSX/code strings for this component's demos. This differs from the task brief's assumption that demo code always ships in the flight payload; for `Kbd` specifically, the "Show code" panels are genuinely absent from any static payload (they're Radix `Collapsible` content, `hidden=""` with empty innerHTML, populated only after client hydration + a code-split fetch).
- Consequently, `codeCaptured` should be read as "partial": the one authentic JSX line quoted in the Best Practices prose (`<Kbd meta>K</Kbd>`, `<Kbd>Cmd+K</Kbd>`) is verbatim from the page; the per-demo usage snippets above are reconstructed from rendered attributes/spans, not copied from a code panel.
- No linked sub-pages were needed; all content lived on the single `keyboard-input` route. Sidebar component index (Avatar, Badge, ... Video) was captured incidentally but is out of scope for this spec.
