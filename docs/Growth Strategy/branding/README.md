# Supaprod Brand Kit

> _Created 2026-07-14. The base brand kit for Supaprod: the mark, its variations,
> the palette, type, and ready-to-upload assets (SVG + PNG + favicon + social).
> Ship-ready; enhance over time. Every asset is generated from the SAME
> parametric mark the product renders (`src/components/cadence/CadenceMark.tsx`),
> so the kit can never drift from the app._

## The mark

Supaprod's mark is a **seven-petal spiral** (an epitrochoid) revolving around a
**glowing core**. The meaning is the product:

- **Seven petals = the seven loop stages** — 01 Discover, 02 Decide, 03 Plan,
  04 Design, 05 Build, 06 Ship, 07 Learn — drawn as one continuous curve, so the
  lifecycle reads as a single connected journey, not seven separate marks.
- **The core = the intelligence the loop revolves around** — the **Brain** (what
  the product knows) keeping the **Pulse** (the beat). It is an ember disc with a
  small **gold bead** at its heart (a quiet nod to the tilak / diya): the living
  centre.
- **In motion (the loader):** the loop rotates and energy flows around it while
  the core pulses — "the machine is working." Slowed so the moment is felt;
  pauses under `prefers-reduced-motion`.

Curve: `u(t) = ((R-r)·cos t + d·cos((R-r)t/r), (R-r)·sin t − d·sin((R-r)t/r))`,
with **R = 7, r = 1, d = 3** (K = 6 → seven petals).

## Variations (and when to use each)

| Variation                                                      | File(s)                                                                                               | Use it for                                                                                        |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **On dark** (silver/white spiral + ember/gold core, soft glow) | `logo/supaprod-mark-dark.svg`, `png/cadence-mark-dark-*.png` (png exports pending re-rasterization)   | The default mark on dark surfaces (the app is dark-first).                                        |
| **On light** (graphite/black spiral + ember/gold core)         | `logo/supaprod-mark-light.svg`, `png/cadence-mark-light-*.png` (png exports pending re-rasterization) | The mark on white/light surfaces.                                                                 |
| **Gradient / hero** (ember→blue spiral + ember/gold core)      | `logo/supaprod-mark-gradient.svg`, `png/cadence-mark-gradient-*.png` (png exports pending re-rasterization) | Marketing, hero moments, the app icon, favicon — the full-color expression.                 |
| **Mono white / black** (single color)                          | `logo/supaprod-mark-mono-*.svg`, `png/cadence-mark-mono-*-*.png` (png exports pending re-rasterization) | Photographic backgrounds, print, one-color contexts, embossing.                             |
| **Lockup** (mark + "Supaprod" wordmark)                        | `logo/supaprod-lockup-{dark,light}.svg`, `png/cadence-lockup-*-*.png` (png exports pending re-rasterization) | Headers, docs, decks, email signatures.                                                |
| **App icon** (mark on a rounded square)                        | `logo/supaprod-appicon-{dark,light}.svg`, `icons/appicon-*-*.png`                                      | App stores, PWA, desktop/dock icons.                                                              |
| **Favicon**                                                    | `logo/supaprod-favicon.svg`, `icons/favicon.ico`, `icons/favicon-{16,32,48}.png`                       | Browser tab / bookmarks.                                                                          |
| **Animated** (loader)                                          | `logo/supaprod-mark-animated.svg` (SMIL), `logo/supaprod-mark-animated.html` (tweakable, particle flow) | Loading / "AI is working" states; the HTML is the reference "gif" you can open, tweak, or record. |

## File inventory

```
branding/
├─ README.md                    ← this file (the brand guidelines)
├─ generate.ts                  ← regenerates every SVG from the mark curve (bun)
├─ logo/                        ← source vectors (scalable, upload-ready)
│  ├─ supaprod-mark-dark.svg / -light.svg / -gradient.svg
│  ├─ supaprod-mark-mono-white.svg / -mono-black.svg
│  ├─ supaprod-mark-animated.svg      (SMIL, self-animating)
│  ├─ supaprod-mark-animated.html     (standalone tweakable reference)
│  ├─ supaprod-lockup-dark.svg / -light.svg
│  ├─ supaprod-appicon-dark.svg / -light.svg
│  └─ supaprod-favicon.svg
├─ png/                         ← raster marks + lockups (transparent); still under the
│  │                              cadence- filename prefix, pending re-rasterization from
│  │                              the renamed SVGs above (the lockup PNGs also still show
│  │                              the old wordmark in their pixels until re-rendered)
│  ├─ cadence-mark-gradient-{32,64,128,256,512,1024}.png
│  ├─ cadence-mark-dark-{...}.png / -light-{...}.png
│  ├─ cadence-mark-mono-{white,black}-{256,512}.png
│  └─ cadence-lockup-{dark,light}-{720,1440}.png
├─ icons/                       ← app / favicon / PWA
│  ├─ favicon.ico  favicon-{16,32,48}.png
│  ├─ apple-touch-icon.png (180)
│  ├─ android-chrome-{192,512}.png
│  └─ appicon-{dark,light}-{512,1024}.png
└─ social/                      ← Open Graph / share cards (dark + light)
   ├─ og-dark-1200x630.png  og-light-1200x630.png
   └─ square-dark-1200x1200.png
```

## Color palette

| Token                | Hex       | Role                                                                                      |
| -------------------- | --------- | ----------------------------------------------------------------------------------------- |
| **Ember** (brand)    | `#FF6B2C` | Primary CTA, "needs-human", the one brand accent. Ember-hi `#FFD9C2`, ember-lo `#C24E1E`. |
| **Blue** (machine)   | `#3E63DD` | Links, metric numerals (data), the machine's voice.                                       |
| **Gold** (core bead) | `#E8B44C` | The mark's living centre; also the "warning/caution" accent.                              |
| **Moss** (success)   | `#7FBF8E` | Success / present / "still stands".                                                       |
| **Madder** (risk)    | `#E06557` | Errors, gaps, rejected.                                                                   |
| Neutral · dark bg    | `#0A0A0A` | App/marketing dark background.                                                            |
| Neutral · light bg   | `#FFFFFF` | Light background.                                                                         |
| Text · on dark       | `#EDEDED` | Primary text on dark; silver `#8A8A93` secondary.                                         |
| Text · on light      | `#111111` | Primary text on light.                                                                    |

Grayscale carries ≥90% of any surface; chromatic color appears only with
meaning. Ember = the brand / needs-human; blue = data / machine.

## Typography

- **Geist Sans** — wordmark, UI, headings. The "Supaprod" wordmark is Geist Sans
  600, tight tracking. (For final production lockups, outline the wordmark to a
  path so it renders without the font installed.)
- **Geist Mono** — data, code, trace ids, metadata.
- **Geist Pixel** — the brand display face: hero metrics, stage titles, the
  agent/person name moments. Use sparingly (a moment, not body text).

Fonts are SIL OFL 1.1 (self-hosted in `public/fonts/geist/`).

## Clear space & minimum size

- **Clear space:** keep padding around the mark ≥ the diameter of the core on
  all sides (the SVGs already build in ~10% padding).
- **Minimum size:** mark ≥ 20 px; favicon uses the bolder-stroke variant so it
  survives 16 px. The lockup wordmark should never render below ~14 px.

## Do / Don't

- **Do** use the on-dark mark on dark and the on-light mark on light; use the
  gradient for hero/marketing and the icon.
- **Do** keep the core ember + gold (the one warm accent) even on mono spirals
  where color is allowed.
- **Don't** recolor the spiral into arbitrary hues, rotate the static logo,
  add drop-shadows beyond the built-in glow, or stretch/skew the mark.
- **Don't** place the full-color mark on a busy photo — use the mono variant.
- **Don't** re-draw the petals by hand; regenerate from `generate.ts` so the
  curve stays exact.

## Animation / loader

The mark doubles as the product's loader wherever AI is working (thinking,
drafting, shaping). In the app it is `CadenceMark animated` /
`CadenceLoader` (`src/components/cadence/CadenceMark.tsx`) and the shared
`AiWorking` indicator. For marketing/video, open
`logo/supaprod-mark-animated.html` (a self-contained, tweakable reference with a
particle-flow trail) or use `logo/supaprod-mark-animated.svg` (SMIL). Record the
HTML to a GIF/MP4 if a raster animation is needed.

## Regenerating the kit

The vectors are generated so they never drift from the product mark:

```bash
bun "docs/Growth Strategy/branding/generate.ts"   # rewrites logo/*.svg
```

PNGs, the favicon.ico, and the social cards were rasterized from those SVGs
(via headless Chromium at exact pixel sizes). Re-run the generator after any
change to the mark, then re-rasterize.
