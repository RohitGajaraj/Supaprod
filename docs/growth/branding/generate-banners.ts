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
    <span style="width:${(size * 1.5).toFixed(0)}px;height:1px;background:${P.ember};opacity:.9"></span>
    <span style="font-size:${size}px;color:${P.slate};letter-spacing:-.006em">${CATEGORY}</span>
  </div>`;
}

// =============================================================================
// WIDE BANNER — X, Mastodon, Bluesky.
//
// ZONES, measured on a 1500x500 master:
//   AVATAR    a 334px circle centred near x=207 on the bottom edge, covering
//             x 40..374, y 333..500. The text block therefore centres on
//             0.35 x height, not 0.5, and the bottom-left quadrant stays empty.
//   INSTRUMENT centre pulled to w-340 so the leftmost station label (06 SHIP,
//             at cx - labelR) lands clear of where the headline ends. Text and
//             diagram must never share a column.
// =============================================================================
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
    <!-- WIDTH IS LOAD-BEARING. "Agents that own outcomes." is 25 characters; at
         56px with -0.042em tracking Geist runs ~0.47em/char, so the line needs
         ~658px. A 660px box left 2px of slack and the line wrapped, turning a
         two-beat headline into three ragged lines. 704px at 54px carries it with
         real margin, and still stops well clear of the instrument: text ends at
         x=800, the leftmost station label sits at x=906. -->
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
  { base: "x-header", w: 1500, h: 500, fn: (i) => banner(1500, 500, i) },
  { base: "mastodon-header", w: 1500, h: 500, fn: (i) => banner(1500, 500, i) },
  { base: "bluesky-banner", w: 3000, h: 1000, fn: (i) => banner(3000, 1000, i) },
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
