Unit 011: the public pages' live hexes move onto the ink theme's names

What was wrong: /updates and /product painted with literal hexes while the
file that exists to own those values, PUBLIC_INK_THEME, sat beside them
defining the same palette. Two of the literals were worse than stale:
#565c66 on /updates' footer and #71717a on /product's eyebrow are the
exact failed-contrast values inkTheme's re-pitch table records replacing
(2.94:1 and 4.10:1 against a 4.5 floor for small text). The literals were
keeping failures alive in files the re-pitch never reached.

Changes:

- updates.tsx renders inside LegalPageShell, which already spreads
  PUBLIC_INK_THEME. Its eight hexes became var(--ink), var(--ink-subtle),
  var(--soft-stone) and one var(--ink-faint). Seven are value-exact; the
  footer moves #565c66 -> the theme's #7a8089, taking it from 2.94:1 to
  4.97:1.
- product.tsx now spreads PUBLIC_INK_THEME on its root, as /demo,
  /t/$slug and /proof already do. Measured first: under the stamped light
  theme the obsidian vars resolve LIGHT (--ink #171717, --paper #fff), so
  mapping literals onto those names blind would have rendered black text
  on a black page for light-theme visitors. The spread pins this
  single-theme page dark by construction, then its hexes map: --ink,
  --ink-subtle, --ember (CTA ground, hover-return, focus ring, cap hover),
  --paper (CTA text, scrim gradient). The CTA's #ff8344 hover tint stays
  literal in source: no token carries a hover step anywhere, and
  inkTheme.ts is on LANE 0's path, not mine to extend.

The guard caught my own shortcut, correctly. My first pass wrote
var(--text-subtle); design:ratchet refused to freeze because --text-* is
retired vocabulary and the swap would have raised that marker. Swapped to
var(--ink-muted), same role, no retired namespace, and the better value:
its #8f959e measures 6.56:1 where text-subtle's #8b8b93 measures 5.86:1.

Deliberately untouched: index.tsx's seven raw colours sit in its <style>
block and its own comment argues they ARE the single-theme contract;
mounting the theme there changes token values for every LANE 0 component
underneath and is a ruling I am not entitled to make solo. Recorded for
REQ alongside REQ-004 rather than smuggled.

Verified under Playwright, computed values read off live elements:

- product: h1 rgb(244,244,245), eyebrow rgb(143,149,158), CTA ground
  rgb(255,107,44), CTA text rgb(10,10,10), page ground rgb(13,13,14)
  (inkTheme canvas winning over the light stamp, which is the point).
- updates: headings rgb(244,244,245), dates rgb(161,161,170).
- Screenshots: docs/screenshots/u011-product-token-mapped.png,
  u011-updates-token-mapped.png (gitignored).

Gates: tsc 0; bun test 10,733 pass / 0 fail; ratchet 2695 -> 2679
(product raw-colour 10 -> 2, updates 8 -> 0), frozen in this commit.
