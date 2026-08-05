// ORRERY — the full platform set.
//
// =============================================================================
// TYPOGRAPHY, corrected 2026-08-05 after a founder review that rejected the
// previous pass as "too spacey, elements highlighted for namesake, everything
// else dulled down."
//
// Both faults were mine and both came from over-correcting an earlier note:
//
//   LEADING  He asked for "a little more breathing space" and I went from 1.06
//            to 1.30. At 1.30 the two lines stop reading as one headline and
//            drift into separate objects. 1.14 is the answer: enough silence
//            before the counterpoint lands, not so much that the pair breaks.
//
//   CONTRAST I pushed the connectives ("that own", "Not just") down to #5E6068,
//            almost the background. That does not spotlight the hero word, it
//            dulls the whole room. In the reference the founder approved,
//            "Agents that run" sits at FULL brightness and only the negative
//            word is dimmed. Contrast is made by lifting one thing above a
//            bright field, never by darkening the field.
//
// So the system is: body at full bone weight 500, the hero word at 700, and
// exactly ONE word dimmed -- the thing we are not.
// =============================================================================
//
// LAYOUT. Every platform lays its own furniture over the banner, so each layout
// below encodes measured exclusion zones rather than a shared centred grid. See
// the ZONES block before each function.

import { join } from "node:path";
import { P, machine, markEl, GRAIN, page, render, OUT, setGround } from "./orrery.ts";
import type { Orr } from "./orrery.ts";

// --- Copy, ratified 2026-08-05 (variant H) ----------------------------------
//
// `output` is what you shipped; `outcome` is whether it worked. That word pair
// IS the moat, and the near-rhyme makes it stick before the reader has analysed
// it. It also earns the picture: the lit return path from 07 Learn back to
// 01 Discover is literally an outcome being owned.
//
// Frame constraint: 28 characters per line or fewer. Longer than that cannot
// hold display size.

/** The hero word. Lifted by WEIGHT above a bright field. */
const hi = (t: string) => `<span style="font-weight:700">${t}</span>`;
/** The one dimmed word: the thing we are not. Nothing else is dimmed. */
const dim = (t: string) => `<span style="color:#6E7078;font-weight:500">${t}</span>`;

const HOOK = `Agents that own ${hi("outcomes")}.<br>Not just ${dim("output")}.`;
const HOOK_FLAT = `Agents that own ${hi("outcomes")}. Not just ${dim("output")}.`;

/** Category line. `product teams` lifted by COLOUR only, so it never competes
 *  with the headline's weight contrast. */
const CATEGORY =
  `The <span style="color:${P.bone};opacity:.8">agentic-first</span> operating system for ` +
  `<span style="color:${P.bone};font-weight:500">product teams</span>`;

/**
 * Headline leading, set to the reference the founder approved: 1.08.
 *
 * Confirmed 2026-08-05: "if there is no breathing space, it's fine, if you match
 * the reference image that is good." Tight is correct here and the earlier 1.30
 * was simply wrong. At display size with -0.042em tracking, a two-line headline
 * wants its lines locked together as ONE object; the counterpoint lands harder
 * arriving immediately than it does after a pause. Loose leading is for reading
 * paragraphs, not for delivering a two-beat claim.
 */
const LEAD = 1.08;

/**
 * The masthead: mark + "Supaprod" in Geist Pixel Square.
 *
 * Brand is rank 2 in the hierarchy and was previously drawn at rank 5. Pixel
 * Square's square terminals crowd at small sizes and open up when given air, so
 * a touch of positive tracking is what makes it read as deliberate rather than
 * as a rendering artefact. Pixel appears HERE and nowhere else: one Pixel word
 * per asset.
 */
function lockup(markPx: number, textPx: number, id: string) {
  return `<div style="display:flex;align-items:center;gap:${(markPx * 0.36).toFixed(0)}px">
    ${markEl(markPx, id)}
    <span class="pixel" style="font-size:${textPx}px;color:${P.bone};line-height:1;
      letter-spacing:${(textPx * 0.015).toFixed(2)}px">Supaprod</span>
  </div>`;
}

/** Category line with its ember tick. */
function categoryLine(size: number, gap: number, center = false) {
  return `<div style="display:flex;align-items:center;gap:${gap}px;
      ${center ? "justify-content:center;" : ""}">
    <span style="width:${(size * 1.5).toFixed(0)}px;height:1.5px;background:${P.ember};opacity:1"></span>
    <span style="font-size:${size}px;color:${P.bone};opacity:.82;letter-spacing:-.006em">${CATEGORY}</span>
  </div>`;
}

// =============================================================================
// WIDE BANNER — X, Mastodon, Bluesky.
//
// THE MOBILE CROP, measured from a real device 2026-08-06. This is the fault
// that shipped: the layout was designed to the FILE's edges instead of to the
// RENDERED safe area, and X's mobile app does not show the whole file.
//
//   X mobile crops roughly 13% off EACH SIDE and zooms the remainder. With a
//   96px left margin on a 1500px canvas (6.4%), the crop ate the margin and then
//   the type: "Agents" rendered as "gents", "Not just" rendered as "lot", and
//   the wordmark was clipped at the corner. Desktop was fine throughout, which
//   is exactly why this is easy to miss.
//
//   X mobile also overlays NAV BUTTONS on the banner: a back arrow at the left
//   and search / overflow at the right, sitting at roughly 41% of banner height.
//
// SAFE AREA, therefore: design inside the centre ~74% of width, and keep the
// headline above the button band.
//
//   SAFE_L      0.155  left margin as a fraction of width, clears the crop
//               with margin to spare rather than exactly
//   AVATAR      a 334px circle at x 40..374, y 333..500 on the master. The text
//               block centres on 0.33 x height so it clears both the circle
//               below and the nav buttons at 41%.
//   INSTRUMENT  pulled in so its leftmost station label clears the headline AND
//               its rightmost label survives the right-hand crop at x=1305.
// =============================================================================
const SAFE_L = 0.17;

/**
 * WIDE, the original composition. Optimised for the DESKTOP render, where the
 * whole file is shown. Kept unchanged and still shipped, per founder ruling
 * 2026-08-06: "create a new version for mobile separately, don't replace the
 * existing ones." Both variants ship; the uploader picks.
 */
function banner(w: number, h: number, id: string) {
  const s = h / 500;
  const o: Orr = {
    cx: w - 336 * s,
    cy: h * 0.5,
    k: 0.38,
    shells: [124 * s, 218 * s, 336 * s, 452 * s, 580 * s],
    stationR: 218 * s,
    nodeR: 4.8 * s,
    id,
  };
  return page(
    w,
    h,
    `
    <div style="position:absolute;inset:0;background:
      radial-gradient(85% 130% at 14% 2%, ${P.lift} 0%, transparent 56%)"></div>
    ${machine(w, h, o, 100 * s, 18 * s, { r: 258 * s, size: 10 * s })}
    ${GRAIN(P.grain)}
    <div style="position:absolute;left:${96 * s}px;top:${(h * 0.35).toFixed(0)}px;
        transform:translateY(-50%);width:${704 * s}px">
      ${lockup(30 * s, 22 * s, id + "lk")}
      <div style="margin-top:${30 * s}px;font-size:${54 * s}px;line-height:${LEAD};
          font-weight:500;letter-spacing:-.042em;color:${P.bone};white-space:nowrap">${HOOK}</div>
      <div style="margin-top:${26 * s}px">${categoryLine(17 * s, 13 * s)}</div>
    </div>
  `,
  );
}

/**
 * SAFE, the mobile-first composition. A separate file, not a replacement.
 *
 * THE FAULT IT FIXES, measured on a real device 2026-08-06: X's mobile app crops
 * roughly 13% off EACH SIDE and zooms the remainder. The wide variant's left
 * margin is 96px on a 1500px canvas, which is 6.4% — so the crop ate the margin
 * and then the type. "Agents" rendered as "gents", "Not just" as "lot", and the
 * wordmark was clipped at the corner. Desktop was correct throughout, which is
 * exactly why it survived review.
 *
 * X mobile also overlays NAV BUTTONS on the banner: a back arrow at the left,
 * search and overflow at the right, at roughly 41% of banner height.
 *
 * So this variant designs inside the centre ~74% of width and lifts the block to
 * 33% height, clearing both the nav band below it and the avatar circle beneath
 * that. The instrument shrinks and moves in so its rightmost station label also
 * survives the right-hand crop.
 */
function bannerSafe(w: number, h: number, id: string) {
  const s = h / 500;
  const o: Orr = {
    cx: w - 430 * s,
    cy: h * 0.5,
    k: 0.38,
    shells: [112 * s, 196 * s, 300 * s, 408 * s, 528 * s],
    stationR: 196 * s,
    nodeR: 4.5 * s,
    id,
  };
  return page(
    w,
    h,
    `
    <div style="position:absolute;inset:0;background:
      radial-gradient(85% 130% at 20% 2%, ${P.lift} 0%, transparent 56%)"></div>
    ${machine(w, h, o, 92 * s, 17 * s, { r: 232 * s, size: 9.5 * s })}
    ${GRAIN(P.grain)}
    <!-- Headline at 46px keeps "Agents that own outcomes." (25 chars at roughly
         0.47em/char) to ~540px, so the block runs x 232..772 on the master and
         still clears the instrument's leftmost label. -->
    <!-- 0.28 not 0.33: X mobile's nav buttons sit at ~41% of banner height, and
         a block centred at 33% put the second headline line right under the back
         arrow. Centring at 28% lifts the whole block above the button band while
         still clearing the avatar circle, whose top edge is at 66%. -->
    <div style="position:absolute;left:${(w * SAFE_L).toFixed(0)}px;top:${(h * 0.28).toFixed(0)}px;
        transform:translateY(-50%);width:${620 * s}px">
      ${lockup(28 * s, 20 * s, id + "lk")}
      <div style="margin-top:${26 * s}px;font-size:${46 * s}px;line-height:${LEAD};
          font-weight:500;letter-spacing:-.042em;color:${P.bone};white-space:nowrap">${HOOK}</div>
      <div style="margin-top:${22 * s}px">${categoryLine(19 * s, 13 * s)}</div>
    </div>
  `,
  );
}

// =============================================================================
// SHARE CARD — OG, GitHub preview, Product Hunt, Discord, square.
// No platform furniture overlays these. Instrument above, message below, and
// the hierarchy is steeper because a link preview is read small.
// =============================================================================
function card(w: number, h: number, id: string) {
  const s = Math.min(w, h) / 630;
  const o: Orr = {
    cx: w / 2,
    cy: h * 0.38,
    k: 0.36,
    shells: [112 * s, 196 * s, 296 * s, 402 * s, 524 * s],
    stationR: 196 * s,
    nodeR: 4.8 * s,
    id,
  };
  return page(
    w,
    h,
    `
    <div style="position:absolute;inset:0;background:
      radial-gradient(90% 90% at 50% 0%, ${P.lift} 0%, transparent 55%)"></div>
    ${machine(w, h, o, 102 * s, 18 * s, { r: 244 * s, size: 10.5 * s })}
    ${GRAIN(P.grain)}
    <div style="position:absolute;left:${46 * s}px;top:${42 * s}px">${lockup(30 * s, 22 * s, id + "lk")}</div>
    <div style="position:absolute;left:0;right:0;bottom:${62 * s}px;text-align:center;padding:0 ${60 * s}px">
      <div style="font-size:${52 * s}px;line-height:${LEAD};font-weight:500;
          letter-spacing:-.042em;color:${P.bone}">${HOOK_FLAT}</div>
      <div style="margin-top:${24 * s}px">${categoryLine(18 * s, 14 * s, true)}</div>
    </div>
  `,
  );
}

// =============================================================================
// YOUTUBE 2560x1440.
//
// ZONES: no avatar overlap (YouTube puts the avatar BELOW the banner), but the
// crop is brutal. A TV sees all 2560x1440, desktop sees a 2560x423 band, mobile
// sees only the centred 1546x423 box at x 507..2053, y 508..931. So the
// instrument is scaled to the FULL canvas while every WORD lives inside the
// smallest box. One asset, three correct crops.
// =============================================================================
function youtube() {
  const w = 2560,
    h = 1440;
  // The instrument sits HIGH so its lowest station labels clear the type band.
  // At cy=512 with labelR=570 the bottom labels landed at y~772, which put
  // "05 BUILD" and "04 DESIGN" straight through the Supaprod lockup. Raising the
  // centre to 432 and pulling the label ring in to 512 puts the lowest label at
  // y~668, leaving a clean 60px gutter before the text band starts at 730.
  const o: Orr = {
    cx: 1280,
    cy: 432,
    k: 0.42,
    shells: [258, 452, 674, 918, 1215],
    stationR: 452,
    nodeR: 9.2,
    id: "yt",
  };
  return page(
    w,
    h,
    `
    <div style="position:absolute;inset:0;background:
      radial-gradient(85% 105% at 50% 0%, ${P.lift} 0%, transparent 55%)"></div>
    ${machine(w, h, o, 190, 36, { r: 512, size: 20 })}
    <!-- Scrim under the type only. The orbits run behind the headline and would
         otherwise cross the letterforms; this lifts contrast without putting a
         visible box on the frame. -->
    <div style="position:absolute;left:0;right:0;top:700px;height:320px;
      background:radial-gradient(52% 100% at 50% 50%, rgba(${P.scrim},.92) 0%, rgba(${P.scrim},.6) 42%, transparent 76%)"></div>
    ${GRAIN(P.grain)}
    <!-- Text band: y 730..930, entirely inside the 1546x423 mobile safe box
         (y 508..931) and 60px clear of the lowest station label at y~668. -->
    <div style="position:absolute;left:50%;top:730px;transform:translateX(-50%);
        width:1546px;text-align:center">
      <div style="display:flex;justify-content:center">${lockup(44, 32, "ytlk")}</div>
      <div style="margin-top:30px;font-size:68px;line-height:${LEAD};font-weight:500;
          letter-spacing:-.04em;color:${P.bone}">${HOOK_FLAT}</div>
      <div style="margin-top:26px">${categoryLine(25, 18, true)}</div>
    </div>
    <div style="position:absolute;left:0;right:0;bottom:0;height:420px;
      background:linear-gradient(to top, rgba(255,107,44,.05) 0%, transparent 100%)"></div>
  `,
  );
}

// =============================================================================
// STRIP — LinkedIn company cover, 1128x191.
//
// ZONES, and this layout was genuinely broken before:
//   LOGO       LinkedIn overlays a SQUARE company logo on the bottom left,
//              eating roughly x 0..215. The previous version started its text at
//              x=212, so the wordmark butted straight against the logo with no
//              breathing room at all. Text now starts at x=286.
//   INSTRUMENT the orrery previously sat at cx = w-150 with shells out to 268,
//              putting its left edge at x=710 -- directly underneath "product
//              teams". Type on top of the spiral. It now bleeds off the RIGHT
//              edge (centre past the canvas) so only an outer arc is visible and
//              its leftmost geometry stops at x=898, clear of text ending ~840.
//   HEIGHT     at 191px there is no vertical room to lift into, so this layout
//              indents rather than lifts. Station labels are dropped entirely:
//              10px mono on a 191px strip is noise, not information.
// =============================================================================
function strip(w: number, h: number, id: string) {
  const s = h / 191;
  const o: Orr = {
    cx: w + 92 * s,
    cy: h * 0.5,
    k: 0.34,
    shells: [70 * s, 124 * s, 190 * s, 262 * s, 340 * s],
    stationR: 124 * s,
    nodeR: 3.1 * s,
    id,
  };
  return page(
    w,
    h,
    `
    <div style="position:absolute;inset:0;background:
      radial-gradient(70% 160% at 26% 0%, ${P.lift} 0%, transparent 58%)"></div>
    ${machine(w, h, o, 52 * s, 11 * s)}
    ${GRAIN(P.grain)}
    <div style="position:absolute;left:${286 * s}px;top:50%;transform:translateY(-50%);
        display:flex;align-items:center;gap:${28 * s}px">
      ${lockup(36 * s, 26 * s, id + "lk")}
      <span style="width:1px;height:${46 * s}px;background:${P.brass};opacity:.34"></span>
      <span style="font-size:${17.5 * s}px;color:${P.slate};letter-spacing:-.006em">${CATEGORY}</span>
    </div>
  `,
  );
}

// =============================================================================
// The spec table. `base` carries NO ground and NO dimensions: both are appended,
// so a file is always `<base>-<ground>-<W>x<H>.png` plus an `@2x` twin.
//
// Dimensions stay in the filename because the renderer measures each written PNG
// against them and refuses to write a file whose pixels disagree with its own
// name. That invariant exists because this kit once shipped a file called
// og-dark-1200x630.png that was actually 600x315.
const SPECS: { base: string; w: number; h: number; fn: (id: string) => string }[] = [
  // Both variants ship for every avatar-overlay platform. `-safe` survives the
  // ~13% mobile side-crop and the nav-button band; the plain one is the wider
  // desktop composition. Neither replaces the other.
  { base: "x-header", w: 1500, h: 500, fn: (i) => banner(1500, 500, i) },
  { base: "x-header-safe", w: 1500, h: 500, fn: (i) => bannerSafe(1500, 500, i) },
  { base: "mastodon-header", w: 1500, h: 500, fn: (i) => banner(1500, 500, i) },
  { base: "mastodon-header-safe", w: 1500, h: 500, fn: (i) => bannerSafe(1500, 500, i) },
  { base: "bluesky-banner", w: 3000, h: 1000, fn: (i) => banner(3000, 1000, i) },
  { base: "bluesky-banner-safe", w: 3000, h: 1000, fn: (i) => bannerSafe(3000, 1000, i) },
  { base: "linkedin-cover", w: 1128, h: 191, fn: (i) => strip(1128, 191, i) },
  { base: "youtube-banner", w: 2560, h: 1440, fn: () => youtube() },
  { base: "og", w: 1200, h: 630, fn: (i) => card(1200, 630, i) },
  { base: "github-social-preview", w: 1280, h: 640, fn: (i) => card(1280, 640, i) },
  { base: "producthunt-gallery", w: 1270, h: 760, fn: (i) => card(1270, 760, i) },
  { base: "discord-banner", w: 960, h: 540, fn: (i) => card(960, 540, i) },
  { base: "square", w: 1200, h: 1200, fn: (i) => card(1200, 1200, i) },
];

console.log(`ORRERY — full platform set, both grounds, 3x supersample\n`);
for (const g of ["light", "dark"] as const) {
  setGround(g);
  console.log(`  ${g.toUpperCase()}`);
  for (const s of SPECS) {
    const id = `${s.base}-${g}`.replace(/[^a-z0-9]/g, "");
    await render(s.fn(id), s.w, s.h, join(OUT, `${s.base}-${g}-${s.w}x${s.h}.png`));
  }
}
console.log(`\n${SPECS.length * 2} assets → ${OUT}`);
