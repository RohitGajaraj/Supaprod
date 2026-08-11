# Supaprod Brand Kit

> _Created: 2026-07-14 · Last updated: 2026-08-05_

> The base brand kit for Supaprod: the mark, its variations,
> the palette, type, and ready-to-upload assets (SVG + PNG + favicon + social).
> Ship-ready; enhance over time. Every asset is generated from the SAME
> parametric mark the product renders (`src/components/supaprod/SupaprodMark.tsx`),
> so the kit can never drift from the app.


## Email design

**[`email-design.md`](./email-design.md) is the contract for how any email looks.** Read it before changing an email's appearance. It carries the decided treatment (an ember band, not an ember email, and why the full ground was pushed back on), the three contrast measurements that constrain it, which mark to use on which ground, and the BIMI requirements and cost that block the grey sender avatar. Assets come from [`generate-email-marks.ts`](./generate-email-marks.ts).

## The GitHub repo social preview

**Asset:** [`social/github-social-preview-1280x640.png`](./social/github-social-preview-1280x640.png), plus the [`.svg`](./social/github-social-preview.svg) source. It is emitted by `generate-social.ts` like everything else; the hand-cropping recipe below is kept only as a record of why the obvious tools were rejected.

**It has to be uploaded by hand.** GitHub exposes no REST field for a repository's social preview image (verified against the repo API 2026-08-04), so this is the one brand asset an agent cannot apply:

> **Repo → Settings → General → Social preview → Upload an image**

**Why one image serves both light and dark.** GitHub renders the preview as a card and does not recolour it, so the asset carries **its own dark ground** rather than relying on transparency. A transparent mark would vanish on one theme or the other; a self-contained frame reads identically on both.

**Regenerating it.** The mark is inlined from `logo/supaprod-mark-dark.svg`, so the PNG must be rebuilt if the mark changes. Two constraints worth knowing before you try:

- **`sharp` cannot render the text.** Its bundled librsvg is built without pango, so SVG `<text>` produces nothing at all, silently. The first attempt looked like a blank card with a logo on it.
- **`qlmanage` (WebKit) renders text correctly but squares its output** and scales to fit the longest side, which turned a 1280x640 source into a 2x-zoomed, clipped render. The working recipe is to author a **square** 1280x1280 canvas, render that, then crop the 640-tall band at y=320. That is deterministic; fitting a non-square source is not.

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

| Variation | File(s) | Use it for |
| --- | --- | --- |
| **On dark** (silver/white spiral + ember/gold core, soft glow) | `logo/supaprod-mark-dark.svg`, `png/supaprod-mark-dark-{32,64,128,256,512,1024}.png` | The default mark on dark surfaces (the app is dark-first). |
| **On light** (graphite/black spiral + ember/gold core) | `logo/supaprod-mark-light.svg`, `png/supaprod-mark-light-{32,64,128,256,512,1024}.png` | The mark on white/light surfaces. |
| **Avatar / app icon** (the mark on its own rounded ground) | `logo/supaprod-appicon-{dark,light}.svg`, `avatars/avatar-{dark,light}-*.png` | Every social profile picture, app stores, PWA. Self-contained, so it reads the same on a light platform UI and a dark one. |
| **Mono white / black** (single color) | `logo/supaprod-mark-mono-*.svg` (vector only; raster on request) | Photographic backgrounds, print, one-color contexts, embossing. |
| **Lockup** (mark + "Supaprod" wordmark) | `logo/supaprod-lockup-{dark,light}.svg`, `png/supaprod-lockup-{dark,light}-{720x216,1440x432}.png` | Headers, docs, decks, email signatures. |
| **App icon** (mark on a rounded square) | `logo/supaprod-appicon-{dark,light}.svg`, `icons/appicon-*-*.png` | App stores, PWA, desktop/dock icons. |
| **Favicon** | `logo/supaprod-favicon.svg`, `icons/favicon.ico`, `icons/favicon-{16,32,48}.png` | Browser tab / bookmarks. |
| **Animated** (loader) | `logo/supaprod-mark-animated.svg` (SMIL), `logo/supaprod-mark-animated.html` (tweakable, particle flow) | Loading / "AI is working" states; the HTML is the reference "gif" you can open, tweak, or record. |

## File inventory

```
branding/
├─ README.md                    ← this file (the brand guidelines)
├─ generate.ts                  ← regenerates every SVG from the mark curve (bun)
├─ logo/                        ← source vectors (scalable, upload-ready)
│  ├─ supaprod-mark-dark.svg / -light.svg
│  ├─ supaprod-mark-mono-white.svg / -mono-black.svg
│  ├─ supaprod-mark-animated.svg      (SMIL, self-animating)
│  ├─ supaprod-mark-animated.html     (standalone tweakable reference)
│  ├─ supaprod-lockup-dark.svg / -light.svg
│  ├─ supaprod-appicon-dark.svg / -light.svg
│  └─ supaprod-favicon.svg
├─ generate-social.ts           ← regenerates every PNG below from one spec table (bun)
├─ mark.ts                      ← the shared geometry both generators import
├─ png/                         ← raster marks + lockups, transparent ground
│  ├─ supaprod-mark-{dark,light}-{32,64,128,256,512,1024}.png
│  └─ supaprod-lockup-{dark,light}-{720x216,1440x432}.png
├─ icons/                       ← app / favicon / PWA
│  ├─ favicon.ico  favicon-{16,32,48}.png
│  ├─ apple-touch-icon.png (180)
│  ├─ android-chrome-{192,512}.png
│  └─ appicon-{dark,light}-{512,1024}.png
├─ avatars/                     ← profile pictures, the app icon on its own ground
│  ├─ avatar-dark-{16,32,64,128,200,240,320,400,500,512,800,1024}.png
│  └─ avatar-light-{400,512,1024}.png
├─ video/                       ← trailer and product-demo frames
│  ├─ title-{16x9-3840x2160,9x16-2160x3840}.png
│  └─ endcard-16x9-3840x2160.png  lowerthird-1920x320.png
├─ orrery.ts                    ← THE BRAND WORLD: geometry, both grounds, light
├─ generate-banners.ts          ← every banner and share card, from orrery.ts
└─ social/                      ← platform banners and share cards (ORRERY)
   └─ <base>-{dark,light}-<W>x<H>.png, for base in:
      x-header · mastodon-header · bluesky-banner · linkedin-cover
      youtube-banner · og · github-social-preview
      producthunt-gallery · discord-banner · square
```

## ORRERY, the brand world

**The mark is already an orrery** — a seven-petal curve revolving around a glowing core is a hand-built mechanical model of a system. The world is therefore derived from the mark rather than bolted onto it.

**Why not space.** Perplexity owns cosmic-void and a hundred imitators are in it. More importantly it means the wrong thing: space reads as vast, unknown and exploratory, and Supaprod sells the opposite — accumulated certainty. The instrument, not the void.

**The moat is drawn, not asserted.** A path leaves `07 Learn`, passes *through* the core, and re-enters at `01 Discover`. That is [`../../../README.md`](../../../README.md) verbatim: the verdict is written back against the decision that caused it and re-ranks what Discover surfaces next. An earlier pass drew the orbit and omitted that one edge, which meant it drew everything except the product.

**Three orbital shells are the three layers** — 01 director, 02 operating system, 03 the brain — read as architecture rather than as colour, because the layer tokens (marigold/blue/green) belong to product surfaces.

**Platinum, not brass** (founder ruling, 2026-08-05: "premium, platinum, elite"). Warm brass linework reads as an antique instrument and drifts toward steampunk; cool platinum reads as modern precision engineering. The structure is cold and the heart is hot — platinum orbits, ember and gold only at the core and the two lit stations.

### Four things that make the render premium rather than merely clean

1. **Perspective.** A ring of radius `r` tilted by θ projects to an ellipse with semi-minor axis `r·cos θ`. Flat concentric circles are the shape of a radar sweep and a loading spinner; ellipses read as an object in space.
2. **Occlusion order.** Back halves (`sin t < 0`) are drawn *before* the core, front halves *after*, so the core eclipses the far side of its own orbits. That single ordering is what makes the eye accept depth.
3. **Additive light.** On dark, every light layer uses `mix-blend-mode: plus-lighter`, which accumulates toward white-hot. Normal blending averages a low-alpha orange over near-black toward **brown**, which is exactly the muddy stain two earlier passes were rejected for. On light the same layers switch to `multiply`, because adding light to paper returns paper: a glow on paper is not brighter than the paper, it is warmer than it.
4. **Glows are gradients, never stacked discs.** A disc keeps a hard edge no matter how transparent it is, so stacked low-opacity circles leave visible rims that read as a dark ring around the light source.

### The quality pipeline

Chromium renders at **3× device scale factor**, then libvips downsamples with **Lanczos3** to exactly the spec size — nine rendered samples per output pixel, so thin strokes and type edges get true supersampled antialiasing rather than the rasterizer's one-sample guess. A **fractal-noise grain** layer sits over the frame at roughly 2%: a wide ember gradient over near-black quantises into visible concentric rings in 8-bit PNG, and grain dissolves those steps into something the eye reads as texture.

**The one thing supersampling hurts is pixel type.** Geist Pixel Square's whole identity is hard square steps, and 3× downsampling is a machine for smoothing steps away. The wordmark is therefore set large enough that its steps survive; below roughly 20px it silently stops being a pixel font at all.

## Regenerating the kit

Two stages, both deterministic, both reading the same geometry from `mark.ts`:

```bash
bun "docs/growth/branding/generate.ts"          # the SVG masters in logo/
bun "docs/growth/branding/generate-social.ts"   # every PNG, from one spec table
bun "docs/growth/branding/generate-social.ts" --only=x-header   # or just one
```

**Adding a platform is a row in the `SPECS` table**, not a design session. Name, width, height, layout, ground, and optionally a safe area. The filename carries the dimensions and the generator enforces that they are true.

### Four rules the kit learned the hard way

**1. Every output is measured against its own filename.** This kit previously shipped `og-dark-1200x630.png` at 600x315 pixels, and `square-dark-1200x1200.png` at 600x600. Nothing caught it because nothing checked. `generate-social.ts` now parses each rendered PNG's header and refuses to write a file whose pixels disagree with its name.

**2. The raster stage must derive from the vector stage.** The PNG set was originally a one-time manual export, so when the product was renamed the SVGs updated and the PNGs froze, leaving the old wordmark rendered into four lockups and three share cards for three weeks. Both generators now import `mark.ts`, so that drift is structurally impossible.

**3. Small marks need contrast, not weight.** A seven-petal spiral loses its petal gaps as it shrinks. The instinct is a heavier stroke, and past a point that makes it worse by closing the gaps entirely. What actually rescues it is contrast. This was first found at 32px, where a gradient stroke that dipped to silver-lo read as a smudge on black; the same finding later applied at every size and the gradient was retired outright (see below). Below 64px the mark also drops the glow. Verified by rendering the ladder beside the shipped favicons, magnified, and looking at both.

**Colour, restated after the 2026-08-05 correction.** The mark is a **solid** near-white `#f2f0ed` spiral, an ember core, a gold bead. Those are the product's own values, lifted from `--text-primary` and `--text-subtle` rather than picked for the kit, and the glow sits at 0.24 opacity to match the product's own `drop-shadow(0 0 3.5px ... #fff 24%)`. The kit previously ran a cooler grey, a gradient that dipped to dull grey at its midpoint, and a glow at more than twice the strength, which is why a kit asset beside the landing page looked like a different mark.

**4. Sixteen pixels is a geometry problem, not a tuning problem.** Seven petals plus seven gaps plus a core do not fit. That size is owned by `icons/favicon-16.png` and `favicon.ico`; the raster ladder stops at 32 rather than ship a second, no better file. The smallest avatar any platform asks for is 200px.

### Colour on marketing surfaces

Banners and share cards are **monochrome with one point of colour: the ember core.** This follows the founder's standing colour ruling in [`../../design/DESIGN-SYSTEM.md`](../../design/DESIGN-SYSTEM.md) that the surface is monochrome by default and ember is rare, because colour must carry status rather than decorate. The full ember-to-blue expression is reserved for the app icon and the avatars derived from it, which already shipped that way.

**The Pixel wordmark is WHITE.** An earlier version of this kit set it in gold `#E8B44C` and the founder rejected it on sight. He was right, though not quite for the reason he gave: gold *is* a brand token (`--marigold`), but it is the mark's core bead and a caution accent, and **no live surface sets type in it**. The `/brief` and `/investors` heroes set "Supaprod" in Geist Pixel Square in `--text-primary`, and the homepage headline does the same. On a light ground the wordmark goes near-black for the same reason: match the product, not the palette table.

### The hero composition

Banners and cards are built from the live `/brief` hero, not composed independently. In order: the mark, a mono caps kicker, the wordmark at display size, then the subhead. Behind it, three layers that a flat grid does not give you:

1. **A warm ember bloom** centred behind the wordmark. This is what makes the frame read as lit from within rather than printed, and it is the single biggest difference between the first version of these banners and this one.
2. **A grid on a large cell** at roughly 0.02 alpha. The first attempt used a small cell at higher alpha and read mechanical.
3. **A deterministic star scatter**, seeded from the asset name so re-running the generator does not reshuffle them into a spurious diff.

## Color palette

| Token | Hex | Role |
| --- | --- | --- |
| **Ember** (brand) | `#FF6B2C` | Primary CTA, "needs-human", the one brand accent. Ember-hi `#FFD9C2`, ember-lo `#C24E1E`. |
| **Blue** (machine) | `#3E63DD` | Links, metric numerals (data), the machine's voice **inside the product UI**. ⚠️ Never in the mark or in any brand asset. It used to appear in a kit-only ember-to-blue gradient that blended through violet and matched nothing the product renders; retired 2026-08-05. |
| **Gold** (core bead) | `#E8B44C` | The mark's living centre; also the "warning/caution" accent. |
| **Moss** (success) | `#7FBF8E` | Success / present / "still stands". |
| **Madder** (risk) | `#E06557` | Errors, gaps, rejected. |
| Neutral · dark bg | `#0A0A0A` | App/marketing dark background. |
| Neutral · light bg | `#FFFFFF` | Light background. |
| Text · on dark | `#EDEDED` | Primary text on dark; silver `#8A8A93` secondary. |
| Text · on light | `#111111` | Primary text on light. |

Grayscale carries ≥90% of any surface; chromatic color appears only with
meaning. Ember = the brand / needs-human; blue = data / machine.

## Typography

- **Geist Sans** — wordmark, UI, headings. The "Supaprod" wordmark is Geist Sans
  600, tight tracking. (For final production lockups, outline the wordmark to a
  path so it renders without the font installed.)
- **Geist Mono** — data, code, trace ids, metadata.
- **Geist Pixel Square** — the brand display face, and specifically the Square
  cut: `--font-pixel` is bound to it in both `src/styles.css` and
  `src/styles/ink.css`, so Square is what ships and Circle, Grid, Line and
  Triangle are not alternatives to reach for. Founder ruling 2026-08-05: Pixel is
  **retired from the app and kept for marketing**, allowed on hero moments on the
  public surfaces. One Pixel word per asset. Pixel everywhere stops being a
  signal and becomes a texture.

Fonts are SIL OFL 1.1 (self-hosted in `public/fonts/geist/`).

## Clear space & minimum size

- **Clear space:** keep padding around the mark ≥ the diameter of the core on
  all sides (the SVGs already build in ~10% padding).
- **Minimum size:** mark ≥ 20 px; favicon uses the bolder-stroke variant so it
  survives 16 px. The lockup wordmark should never render below ~14 px.

## Do / Don't

- **Do** use the on-dark mark on dark and the on-light mark on light. There is
  no third "hero" expression to reach for: the mark is white lines and an ember
  core, everywhere, and the app icon is that same mark on its own ground.
- **Do** keep the core ember + gold (the one warm accent) even on mono spirals
  where color is allowed.
- **Don't** recolor the spiral into arbitrary hues, rotate the static logo,
  add drop-shadows beyond the built-in glow, or stretch/skew the mark.
- **Don't** place the full-color mark on a busy photo — use the mono variant.
- **Don't** re-draw the petals by hand; regenerate from `generate.ts` so the
  curve stays exact.

## Animation / loader

The mark doubles as the product's loader wherever AI is working (thinking,
drafting, shaping). In the app it is `SupaprodMark animated` /
`SupaprodLoader` (`src/components/supaprod/SupaprodMark.tsx`) and the shared
`AiWorking` indicator. For marketing/video, open
`logo/supaprod-mark-animated.html` (a self-contained, tweakable reference with a
particle-flow trail) or use `logo/supaprod-mark-animated.svg` (SMIL). Record the
HTML to a GIF/MP4 if a raster animation is needed.

## Regenerating the kit

The vectors are generated so they never drift from the product mark:

```bash
bun "docs/growth/branding/generate.ts"   # rewrites logo/*.svg
```

PNGs, the favicon.ico, and the social cards were rasterized from those SVGs
(via headless Chromium at exact pixel sizes). Re-run the generator after any
change to the mark, then re-rasterize.
