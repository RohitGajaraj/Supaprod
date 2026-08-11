// Supaprod social + marketing raster generator (2026-08-05).
//
// The second stage of the brand kit. generate.ts emits the SVG masters from the
// parametric mark; this emits every PNG a platform, a launch surface or the
// video kit needs, driven by ONE spec table. Adding a platform is a row here,
// not a design session.
//
//   bun "docs/growth/branding/generate-social.ts"
//   bun "docs/growth/branding/generate-social.ts" --only=x-header
//
// Why headless Chromium and not a library. The branding README documents both
// obvious paths failing: sharp's bundled librsvg is built without pango, so SVG
// <text> renders SILENTLY BLANK, and qlmanage squares its output and scales to
// the longest side. Chromium renders real fonts at an exact viewport, which is
// what a banner with a wordmark in it actually requires. Playwright's browsers
// are already on this machine, so we drive the binary directly and add no
// dependency to the project.
//
// THE INVARIANT: every output is measured after render and compared against the
// size its own filename claims. The kit previously shipped a file called
// og-dark-1200x630.png that was 600x315 pixels. That cannot happen again.

import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { homedir, tmpdir } from "node:os";
import { C, markInner, appIcon, SILVER, GRAPHITE, strokeFor, glowAllowed } from "./mark.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..", "..");
const OUT_SOCIAL = join(HERE, "social");
const OUT_PNG = join(HERE, "png");
const OUT_AVATAR = join(HERE, "avatars");
const OUT_VIDEO = join(HERE, "video");
const FONTS = join(REPO, "public", "fonts", "geist");

for (const d of [OUT_SOCIAL, OUT_PNG, OUT_AVATAR, OUT_VIDEO]) mkdirSync(d, { recursive: true });

// --- The renderer ------------------------------------------------------------

function findChrome(): string {
  const candidates = [
    ...["1228", "1223"].map((v) =>
      join(
        homedir(),
        "Library/Caches/ms-playwright",
        `chromium_headless_shell-${v}`,
        "chrome-headless-shell-mac-arm64/chrome-headless-shell",
      ),
    ),
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
  ];
  for (const c of candidates) if (existsSync(c)) return c;
  throw new Error(
    "No headless Chromium found. Install Chrome, or run: bunx playwright install chromium",
  );
}
const CHROME = findChrome();

function pngSize(file: string): { w: number; h: number } {
  const buf = readFileSync(file);
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

let rendered = 0;
function render(html: string, w: number, h: number, outFile: string, transparent = false) {
  const scratch = join(tmpdir(), `sp-brand-${process.pid}-${rendered++}`);
  mkdirSync(scratch, { recursive: true });
  const page = join(scratch, "page.html");
  writeFileSync(page, html);
  try {
    execFileSync(
      CHROME,
      [
        "--headless",
        "--disable-gpu",
        "--hide-scrollbars",
        "--force-device-scale-factor=1",
        "--allow-file-access-from-files",
        ...(transparent ? ["--default-background-color=00000000"] : []),
        `--screenshot=${join(scratch, "shot.png")}`,
        `--window-size=${w},${h}`,
        `file://${page}`,
      ],
      { stdio: "pipe" },
    );
    const shot = join(scratch, "shot.png");
    const got = pngSize(shot);
    // THE INVARIANT. A filename that lies about its own pixels is the exact
    // defect this kit shipped last time; fail loudly rather than write it.
    if (got.w !== w || got.h !== h) {
      throw new Error(
        `${outFile}: rendered ${got.w}x${got.h} but the spec says ${w}x${h}. Refusing to write.`,
      );
    }
    renameSync(shot, outFile);
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

// --- Shared chrome for every page -------------------------------------------

const fontFace = (family: string, file: string, weight = "400") =>
  `@font-face{font-family:"${family}";src:url("file://${join(FONTS, file)}") format("woff2${file.includes("Variable") ? "-variations" : ""}");font-weight:${weight};font-display:block}`;

const FONTS_CSS = [
  fontFace("Geist", "Geist-Variable.woff2", "100 900"),
  fontFace("Geist Mono", "GeistMono-Variable.woff2", "100 900"),
  fontFace("Geist Pixel Square", "GeistPixel-Square.woff2"),
].join("");

// The backdrop, lifted from the live /brief hero rather than invented here.
//
// That page is the reference the founder pointed at, and it has three layers a
// flat grid does not: a warm ember bloom sitting behind the wordmark, a grid on
// a large cell at very low alpha, and a scatter of faint star points. The bloom
// is what makes the frame feel lit from within instead of printed. The kit's
// first attempt had only the grid, on a small cell, which read mechanical.
//
// The scatter is deterministic (seeded from the asset name) so re-running the
// generator does not reshuffle the stars and produce a spurious diff.
function stars(w: number, h: number, seed: string, count: number, ground: Ground): string {
  let x = 0;
  for (const ch of seed) x = (x * 31 + ch.charCodeAt(0)) >>> 0;
  const rnd = () => (x = (x * 1664525 + 1013904223) >>> 0) / 4294967296;
  const tint = ground === "dark" ? "255,255,255" : "0,0,0";
  const dots: string[] = [];
  for (let i = 0; i < count; i++) {
    const cx = (rnd() * 100).toFixed(2);
    const cy = (rnd() * 100).toFixed(2);
    const r = (0.6 + rnd() * 1.5).toFixed(2);
    const a = (0.05 + rnd() * 0.22).toFixed(3);
    dots.push(
      `radial-gradient(circle ${r}px at ${cx}% ${cy}%, rgba(${tint},${a}) 0 ${r}px, transparent ${r}px)`,
    );
  }
  return dots.join(",");
}

function BACKDROP(w: number, h: number, seed: string, ground: Ground, bloomY = 50): string {
  const cell = Math.round(Math.max(w, h) / 12);
  const line = ground === "dark" ? "rgba(242,240,237,0.022)" : "rgba(17,17,17,0.035)";
  // The ember bloom. Kept low: it should read as light in the room, not as a
  // coloured wash. Ember is the only hue anywhere on these surfaces.
  const bloom =
    ground === "dark"
      ? `radial-gradient(ellipse 62% 58% at 50% ${bloomY}%, rgba(255,107,44,0.17) 0%, rgba(255,107,44,0.07) 32%, rgba(255,107,44,0.02) 55%, transparent 72%)`
      : `radial-gradient(ellipse 62% 58% at 50% ${bloomY}%, rgba(255,107,44,0.055) 0%, transparent 68%)`;
  return `background-image:
    ${stars(w, h, seed, 48, ground)},
    ${bloom},
    repeating-linear-gradient(to right, ${line} 0 1px, transparent 1px ${cell}px),
    repeating-linear-gradient(to bottom, ${line} 0 1px, transparent 1px ${cell}px);`;
}

type Ground = "dark" | "light";

const ink = (g: Ground) => (g === "dark" ? C.silverHi : C.black);
const sub = (g: Ground) => (g === "dark" ? C.silverLo : "#565660");
const bg = (g: Ground) => (g === "dark" ? C.bgDark : C.bgLight);

/**
 * The mark as an inline SVG sized in px.
 *
 * Two expressions, and the split is a ruling, not a preference:
 *
 *   "mono"  silver or graphite spiral, ember core. THE DEFAULT for every banner
 *           and card, because the founder's colour ruling is that the surface is
 *           monochrome and "ember is rare... colour must carry status, never
 *           decorate". One point of light in the whole frame is the premium
 *           signal; a full ember-to-blue spiral on a marketing card is decoration.
 *
 *   "grad"  RETIRED. This used to read "the ember-to-blue expression, reserved
 *           for the app icon and the avatars derived from it, which already
 *           shipped that way; changing them would be a ratchet regression on an
 *           asset that is already right."
 *
 *           Every clause of that was false by the time it was read. The founder
 *           had already banned the ember-to-blue gradient on 2026-08-05 (the
 *           ruling is recorded in full in mark.ts, above the markInner builder),
 *           the code below has passed SILVER for dark avatars ever since, and
 *           the asset it called "already right" was the one being rejected.
 *
 *           This comment survived the ruling and became the most dangerous line
 *           in the kit: on 2026-08-07 it was the stated reason for reaching back
 *           to the pre-ruling PNGs in icons/ and shipping a violet app icon to
 *           public/. The founder caught it on sight, again.
 *
 *           THERE IS NO SECOND BRAND COLOUR. The mark is a WHITE spiral, an
 *           ember core and a gold bead. If you are about to add blue, you are
 *           re-litigating a closed ruling. Spiral still carries a "grad" kind in
 *           mark.ts because the type is general; nothing constructs one, and
 *           nothing should.
 */
function markSVG(px: number, ground: Ground, id: string): string {
  const sw = strokeFor(px);
  // Glow is a small-mark killer (it closes the petal gaps) and, at large sizes on
  // a card, it turns a crisp drawing hazy. The core keeps its own bloom either
  // way, so the one lit thing in the frame stays lit.
  const bodyGlow = null;

  // Below the glow threshold the stroke also goes SOLID. This was found by
  // rendering the ladder against the shipped favicons and looking at both
  // magnified: at 32px the shipped favicon was visibly cleaner than a first
  // attempt here, and the reason was not weight, it was contrast. A gradient
  // stroke spends half the curve at silver-lo #8A8A93, which is mid-grey, and
  // mid-grey on black at 32px is a smudge. A solid bright stroke keeps all seven
  // petals separable. Weight alone cannot buy that back, and past a point extra
  // weight actively closes the gaps.
  const small = !glowAllowed(px);
  const spiral: Parameters<typeof markInner>[0]["spiral"] = small
    ? { kind: "solid", color: ground === "dark" ? C.silverHi : C.black }
    : ground === "dark"
      ? SILVER
      : { kind: "solid", color: C.graphiteHi };

  const inner = markInner({
    spiral,
    glow: bodyGlow,
    sw,
    idSuffix: id,
  });
  return `<svg viewBox="0 0 100 100" width="${px}" height="${px}" fill="none" style="display:block">${inner}</svg>`;
}

function page(bodyStyle: string, body: string, w: number, h: number, ground: Ground, extra = "") {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
${FONTS_CSS}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${w}px;height:${h}px;overflow:hidden}
body{background:${bg(ground)};color:${ink(ground)};
  font-family:"Geist",system-ui,sans-serif;-webkit-font-smoothing:antialiased;${bodyStyle}}
/* WHITE, not gold. The live /brief hero sets "Supaprod" in Geist Pixel Square
   in --text-primary, and the homepage headline does the same. Gold is the
   mark's core bead and a caution accent; it is not a type colour on any
   surface the product ships. An earlier version of this kit set the wordmark
   in gold and it read as a colour the brand does not use. */
.pixel{font-family:"Geist Pixel Square",ui-monospace,monospace;color:${ink(ground)};font-weight:400;letter-spacing:-0.02em}
.kicker{font-family:"Geist Mono",ui-monospace,monospace;color:${sub(ground)};
  text-transform:uppercase;letter-spacing:0.19em;font-weight:400}
.em{color:${C.ember}}
.word{font-weight:600;letter-spacing:-0.03em;color:${ink(ground)}}
.sub{color:${sub(ground)};font-weight:400;letter-spacing:-0.01em}
.mono{font-family:"Geist Mono",ui-monospace,monospace;color:${sub(ground)};letter-spacing:0.06em}
${extra}
</style></head><body>${body}</body></html>`;
}

// --- Layouts -----------------------------------------------------------------
// Each layout is a composition, not a size. Sizes come from the spec table, so
// the same composition serves X, Mastodon and Bluesky at three aspect ratios.

type Spec = {
  name: string;
  w: number;
  h: number;
  layout:
    | "banner"
    | "strip"
    | "card"
    | "safe"
    | "avatar"
    | "logosquare"
    | "mark"
    | "lockup"
    | "titleframe";
  ground?: Ground;
  hero?: string; // the Pixel word
  line?: string; // the supporting line
  kicker?: string; // overrides the category kicker
  foot?: string; // small mono line pinned to the foot
  safeW?: number; // safe-area width, for "safe"
  safeH?: number;
  out?: string; // output dir, defaults to social/
  transparent?: boolean;
};

// Set as "Supaprod", capitalised, because that is how the live /brief hero sets
// it. Handles are lowercase; the wordmark in prose is not.
const HERO = "Supaprod";

// AGENTIC-first, not agent-first. The live /brief and /investors pages both run
// "FOR PRODUCT MANAGERS WHO SHIP WITH AGENTS" as a mono
// caps kicker above the wordmark, and "agentic-first" is the phrase used in
// eight places across src/. The kit had taken "agent-first" from README.md line
// 8, which is the one place that still says it. What a visitor has just read on
// the site wins over a line in a document they will never open.
const KICKER = "For product managers who ship with agents";

// The subhead follows the live hero's shape, with one deliberate difference.
// The site currently reads "agents that know what to build, ship it, and
// remember" and "remember" is the exact word the 2026-08-02 ruling bans. The
// ruling is newer than the page, so the kit says the compliant thing and the
// page is flagged to catch up, rather than the kit importing the violation.
const LINE = "Agents that know what to build, ship it, and learn what worked";

function build(s: Spec): string {
  const g = s.ground ?? "dark";
  const hero = s.hero ?? HERO;
  const line = s.line ?? LINE;

  switch (s.layout) {
    // Wide banner: mark and wordmark on a baseline, supporting line beneath.
    // Padding is generous because every one of these gets cropped by something.
    case "banner": {
      const markPx = Math.round(s.h * 0.28);
      const kickPx = Math.max(9, Math.round(s.h * 0.042));
      const heroPx = Math.round(s.h * 0.235);
      const linePx = Math.round(s.h * 0.062);
      return page(
        `display:flex;align-items:center;justify-content:center;${BACKDROP(s.w, s.h, s.name, g, 50)}`,
        `<div style="display:flex;flex-direction:column;align-items:center;text-align:center">
           ${markSVG(markPx, g, s.name)}
           <div class="kicker" style="font-size:${kickPx}px;margin-top:${Math.round(s.h * 0.052)}px">${s.kicker ?? KICKER}</div>
           <div class="pixel" style="font-size:${heroPx}px;line-height:1;margin-top:${Math.round(s.h * 0.03)}px">${hero}</div>
         </div>`,
        s.w,
        s.h,
        g,
      );
    }

    // Very short strip (LinkedIn cover is 191px tall). Lockup only, one line,
    // vertically centred. Anything more is unreadable at this height.
    case "strip": {
      const markPx = Math.round(s.h * 0.52);
      const heroPx = Math.round(s.h * 0.3);
      const linePx = Math.round(s.h * 0.125);
      return page(
        `display:flex;align-items:center;justify-content:center;padding:0 ${Math.round(s.h * 0.3)}px;${s.transparent ? "" : BACKDROP(s.w, s.h, s.name, g, 50)}`,
        `<div style="display:flex;align-items:center;gap:${Math.round(markPx * 0.4)}px">
           ${markSVG(markPx, g, s.name)}
           <div class="pixel" style="font-size:${heroPx}px;line-height:1">${hero}</div>
           <div style="width:1px;height:${Math.round(s.h * 0.34)}px;background:${sub(g)};opacity:.35"></div>
           <div class="sub" style="font-size:${linePx}px">${line}</div>
         </div>`,
        s.w,
        s.h,
        g,
        // A lower third is composited OVER footage, so it needs a transparent
        // ground and no hairline field. The same layout serves the opaque
        // LinkedIn cover, where the ground is the asset.
        s.transparent ? `body{background:transparent!important}` : "",
      );
    }

    // Centred card: OG, GitHub preview, Product Hunt gallery. This is the one a
    // stranger sees first when a link is pasted anywhere.
    case "card": {
      const markPx = Math.round(s.h * 0.155);
      const kickPx = Math.max(9, Math.round(s.h * 0.0225));
      const heroPx = Math.round(s.h * 0.2);
      const linePx = Math.round(s.h * 0.042);
      const footPx = Math.max(8, Math.round(s.h * 0.019));
      // The live /brief hero, in order: mark, mono caps kicker, the wordmark at
      // display size, then the subhead. The wordmark is the loudest thing in the
      // frame by a wide margin; the previous version of this card gave it about
      // the same weight as the supporting line and read like a slide template.
      return page(
        `display:flex;flex-direction:column;align-items:center;justify-content:center;
         ${BACKDROP(s.w, s.h, s.name, g, 47)}`,
        `<div style="display:flex;flex-direction:column;align-items:center;text-align:center">
           ${markSVG(markPx, g, s.name)}
           <div class="kicker" style="font-size:${kickPx}px;margin-top:${Math.round(s.h * 0.048)}px">${s.kicker ?? KICKER}</div>
           <div class="pixel" style="font-size:${heroPx}px;line-height:1;margin-top:${Math.round(s.h * 0.028)}px">${hero}</div>
           <div class="sub" style="font-size:${linePx}px;line-height:1.45;margin-top:${Math.round(s.h * 0.036)}px;max-width:${Math.round(s.w * 0.72)}px">${line}</div>
         </div>
         ${
           s.foot
             ? `<div class="kicker" style="position:absolute;bottom:${Math.round(s.h * 0.055)}px;left:0;right:0;text-align:center;font-size:${footPx}px;opacity:.55">${s.foot}</div>`
             : ""
         }`,
        s.w,
        s.h,
        g,
      );
    }

    // Safe-area layout: YouTube renders 2560x1440 but only guarantees the
    // centre 1546x423 is visible on every device. Everything legible lives
    // inside that box; the rest of the canvas is field, on purpose.
    case "safe": {
      const sw = s.safeW ?? Math.round(s.w * 0.6);
      const sh = s.safeH ?? Math.round(s.h * 0.29);
      const markPx = Math.round(sh * 0.32);
      const kickPx = Math.max(10, Math.round(sh * 0.05));
      const heroPx = Math.round(sh * 0.3);
      const linePx = Math.round(sh * 0.072);
      // Bloom is pulled to the safe area's own centre, not the canvas centre,
      // so the lit part of the frame is the part every device actually shows.
      return page(
        `display:flex;align-items:center;justify-content:center;${BACKDROP(s.w, s.h, s.name, g, 50)}`,
        `<div style="width:${sw}px;height:${sh}px;display:flex;flex-direction:column;
                     align-items:center;justify-content:center;text-align:center">
           ${markSVG(markPx, g, s.name)}
           <div class="kicker" style="font-size:${kickPx}px;margin-top:${Math.round(sh * 0.06)}px">${s.kicker ?? KICKER}</div>
           <div class="pixel" style="font-size:${heroPx}px;line-height:1;margin-top:${Math.round(sh * 0.04)}px">${hero}</div>
         </div>`,
        s.w,
        s.h,
        g,
      );
    }

    // Lockup: mark + wordmark on transparent, for headers, decks and email
    // signatures. The four PNGs this replaces were the only assets in the kit
    // that had the OLD product name rendered into their pixels, because a
    // wordmark raster freezes whatever the wordmark said on export day.
    case "lockup": {
      const markPx = Math.round(s.h * 0.72);
      const wordPx = Math.round(s.h * 0.46);
      return page(
        `display:flex;align-items:center;justify-content:center;gap:${Math.round(markPx * 0.3)}px`,
        `${markSVG(markPx, g, s.name)}
         <div class="word" style="font-size:${wordPx}px;line-height:1">Supaprod</div>`,
        s.w,
        s.h,
        g,
        `body{background:transparent!important}`,
      );
    }

    // Avatar: the SHIPPED app icon, rasterised. Not a recomposition of it.
    // appIcon() is the same builder generate.ts uses for the SVG master, so the
    // avatar a stranger sees on X is provably the icon already on the home
    // screen. Only the stroke moves, and only via the optical ladder.
    case "avatar": {
      const icon = appIcon(
        bg(g),
        g === "dark" ? SILVER : GRAPHITE,
        null, // crisp lines; the core keeps its own bloom via appIcon
        strokeFor(s.w),
      ).replace('width="512" height="512"', `width="${s.w}" height="${s.h}"`);
      return page(
        `display:flex;align-items:center;justify-content:center`,
        icon,
        s.w,
        s.h,
        g,
        `body{background:transparent!important}svg{display:block}`,
      );
    }

    // SQUARE LOGO — for containers that do NOT round the image themselves.
    //
    // The avatar block above rests on an assumption written into this file:
    // "platforms crop to a circle or a squircle themselves, so the source
    // carries its own rounded ground". LinkedIn is the counter-example, found
    // on the live page 2026-08-07. Its COMPANY LOGO slot is a hard square on a
    // WHITE card, and it crops nothing. Feeding it the rounded avatar put white
    // into all four corners, so the mark read as a sticker floating on a card
    // rather than as the company's logo. The founder's words were "it looks
    // odd, that's not perfectly sitting", and he was reading the corners.
    //
    // The art is identical to `avatar`. The only difference is that the page
    // keeps its ground instead of going transparent, so appIcon's rounded rect
    // sits on the same colour and the corners fill. Same builder, same stroke
    // ladder, no second source of truth for the mark.
    case "logosquare": {
      const icon = appIcon(
        bg(g),
        g === "dark" ? SILVER : GRAPHITE,
        null,
        strokeFor(s.w),
      ).replace('width="512" height="512"', `width="${s.w}" height="${s.h}"`);
      return page(
        `display:flex;align-items:center;justify-content:center`,
        icon,
        s.w,
        s.h,
        g,
        `svg{display:block}`,
      );
    }

    // Bare mark on transparent. This is what the png/ set has always been: the
    // spiral alone, no ground, for placing on someone else's surface. Rendering
    // it on the avatar's rounded square would have been a silent regression.
    case "mark": {
      return page(
        `display:flex;align-items:center;justify-content:center`,
        markSVG(s.w, g, s.name),
        s.w,
        s.h,
        g,
        `body{background:transparent!important}`,
      );
    }

    // Title frame for the trailer. 16:9 and 9:16 from the same row.
    case "titleframe": {
      const base = Math.min(s.w, s.h);
      const markPx = Math.round(base * 0.13);
      const kickPx = Math.round(base * 0.019);
      const heroPx = Math.round(base * 0.165);
      const linePx = Math.round(base * 0.031);
      return page(
        `display:flex;flex-direction:column;align-items:center;justify-content:center;
         ${BACKDROP(s.w, s.h, s.name, g, 47)}`,
        `<div style="display:flex;flex-direction:column;align-items:center;text-align:center">
           ${markSVG(markPx, g, s.name)}
           <div class="kicker" style="font-size:${kickPx}px;margin-top:${Math.round(base * 0.042)}px">${s.kicker ?? KICKER}</div>
           <div class="pixel" style="font-size:${heroPx}px;line-height:1;margin-top:${Math.round(base * 0.024)}px">${hero}</div>
           <div class="sub" style="font-size:${linePx}px;line-height:1.45;margin-top:${Math.round(base * 0.03)}px;max-width:${Math.round(s.w * 0.66)}px">${line}</div>
         </div>`,
        s.w,
        s.h,
        g,
      );
    }
  }
}

// --- The spec table ----------------------------------------------------------
// Sizes verified against each platform's own guidance, August 2026. LinkedIn
// differs between company cover (1128x191) and personal profile (1584x396);
// this is the COMPANY page.

const SPECS: Spec[] = [
  // THE PLATFORM BANNERS AND SHARE CARDS HAVE MOVED OUT OF THIS FILE.
  //
  // They are generated by `generate-banners.ts` from the ORRERY world in
  // `orrery.ts`. The founder reviewed the compositions this file produced on
  // 2026-08-05 and rejected them twice; the fault was never the machinery, which
  // is why the renderer, the size ladder and the filename-versus-pixels
  // invariant all survive here unchanged. What failed was art direction:
  //
  //   - a centred mark-over-wordmark stack, which is the default AI-startup
  //     template and says the NAME rather than the idea, on a profile where the
  //     platform already renders the name twice;
  //   - Geist Pixel Square at display size, which stops reading as a typeface
  //     and starts reading as a broken image;
  //   - a normal-blended ember wash on near-black, which averages to brown;
  //   - a 48-point random star scatter, which reads as sensor dust;
  //   - a YouTube banner hiding inside its own safe box, leaving a TV showing a
  //     speck on a black field.
  //
  // This file KEEPS everything that was not rejected and is still correct: the
  // avatars, the icon and favicon ladder, the raster marks and lockups, and the
  // video frames.

  // Video kit
  { name: "title-16x9-3840x2160", w: 3840, h: 2160, layout: "titleframe", out: OUT_VIDEO },
  { name: "title-9x16-2160x3840", w: 2160, h: 3840, layout: "titleframe", out: OUT_VIDEO },
  {
    name: "endcard-16x9-3840x2160",
    w: 3840,
    h: 2160,
    layout: "card",
    foot: "supaprod.ai",
    out: OUT_VIDEO,
  },
  {
    name: "lowerthird-1920x320",
    w: 1920,
    h: 320,
    layout: "strip",
    out: OUT_VIDEO,
    transparent: true,
  },
];

// Avatars. One ground, many sizes: platforms crop to a circle or a squircle
// themselves, so the source carries its own rounded ground and never a
// transparent one.
const AVATAR_SIZES = [1024, 800, 512, 500, 400, 320, 240, 200, 128, 64, 32, 16];
for (const px of AVATAR_SIZES) {
  SPECS.push({
    name: `avatar-dark-${px}`,
    w: px,
    h: px,
    layout: "avatar",
    out: OUT_AVATAR,
    transparent: true,
  });
}
for (const px of [1024, 512, 400]) {
  SPECS.push({
    name: `avatar-light-${px}`,
    w: px,
    h: px,
    layout: "avatar",
    ground: "light",
    out: OUT_AVATAR,
    transparent: true,
  });
}

// Square logos, for containers that render a hard square and crop nothing.
// LinkedIn's company logo slot is the one this was built for; see the
// `logosquare` case above for what went wrong without it. NOT transparent, on
// purpose -- transparency is the whole defect being fixed.
for (const px of [1024, 512, 400, 300]) {
  SPECS.push({
    name: `logo-square-dark-${px}`,
    w: px,
    h: px,
    layout: "logosquare",
    out: OUT_AVATAR,
  });
}

// The mark raster set, replacing the cadence-* files. Same art, correct name,
// plus the optical ladder at the small end.
//
// The ladder stops at 32 on purpose. A seven-petal mark at 16px is not a tuning
// problem, it is a geometry problem: seven petals plus seven gaps plus a core do
// not fit in sixteen pixels, and a magnified side-by-side against the shipped
// favicon-16 showed both are equally illegible. That size is already solved and
// owned by icons/favicon-16.png and favicon.ico. Shipping a second, no better
// 16px file here would only create a choice where there is no difference.
// The smallest avatar any platform in the runbook asks for is 200px.
const MARK_SIZES = [1024, 512, 256, 128, 64, 32];

// Lockups. 240x72 is the SVG master's aspect ratio (10:3), held exactly.
for (const w of [1440, 720]) {
  for (const ground of ["dark", "light"] as const) {
    SPECS.push({
      name: `supaprod-lockup-${ground}-${w}x${Math.round((w * 72) / 240)}`,
      w,
      h: Math.round((w * 72) / 240),
      layout: "lockup",
      ground,
      out: OUT_PNG,
      transparent: true,
    });
  }
}
for (const px of MARK_SIZES) {
  for (const [suffix, ground] of [
    ["dark", "dark"],
    ["light", "light"],
  ] as const) {
    SPECS.push({
      name: `supaprod-mark-${suffix}-${px}`,
      w: px,
      h: px,
      layout: "mark",
      ground,
      out: OUT_PNG,
      transparent: true,
    });
  }
}

// --- Run ---------------------------------------------------------------------

const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7);
const queue = only ? SPECS.filter((s) => s.name.includes(only)) : SPECS;
if (!queue.length) {
  console.error(`No spec matches --only=${only}`);
  process.exit(1);
}

console.log(`Rendering ${queue.length} assets with ${CHROME.split("/").pop()}\n`);
let ok = 0;
const failures: string[] = [];

for (const s of queue) {
  const dir = s.out ?? OUT_SOCIAL;
  const file = join(dir, `${s.name}.png`);
  try {
    render(build(s), s.w, s.h, file, s.transparent);
    console.log(`  ok  ${s.name}.png  ${s.w}x${s.h}`);
    ok++;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  FAIL  ${s.name}: ${msg}`);
    failures.push(s.name);
  }
}

console.log(`\n${ok}/${queue.length} rendered, every one measured against its own filename.`);
if (failures.length) {
  console.error(`Failed: ${failures.join(", ")}`);
  process.exit(1);
}
