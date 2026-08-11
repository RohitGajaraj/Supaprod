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

import { statSync } from "node:fs";
import { join } from "node:path";

/** The app's public/ directory, four levels up from this kit. */
const REPO_PUBLIC = join(import.meta.dir, "..", "..", "..", "public");
import sharp from "sharp";
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

/**
 * A star field sized in DISPLAYED pixels, for canvases that get downscaled hard.
 *
 * The shared `starfield()` in orrery.ts draws stars at 0.28..1.53px and that is
 * correct for a 1500px banner shown at 600. It is not correct for the LinkedIn
 * cover, which is 4200px shown at 804: there the brightest star lands at 0.29px
 * displayed and the entire field disappears. The founder asked for "more
 * starfield so it looks like a starry thing" and the honest reading is not
 * "more stars", it is "stars that survive the downscale".
 *
 * So every radius here is a displayed size multiplied by D, same discipline as
 * the type. Density is thinned across the type block, because a star behind a
 * letterform is noise rather than depth.
 */
function starsAtDisplayScale(
  w: number,
  h: number,
  seed: string,
  D: number,
  quiet: { x0: number; x1: number; y0: number; y1: number },
) {
  if (P.markTone !== "dark") return "";
  let s = 0;
  for (const ch of seed) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;

  // TUNED DOWN after the first pass read as falling snow rather than as a sky.
  // Two faults, and the glints were the bigger one: at a 1-in-14 rate with a
  // 6px displayed radius they stopped being highlights and became the dominant
  // texture. A star field is mostly almost-nothing with a handful of exceptions.
  const out: string[] = [];
  for (let i = 0; i < 250; i++) {
    const sx = rnd() * w;
    const sy = rnd() * h;
    const inQuiet = sx > quiet.x0 && sx < quiet.x1 && sy > quiet.y0 && sy < quiet.y1;
    if (inQuiet && rnd() < 0.86) continue;

    const mag = rnd();
    // 0.26..1.06 DISPLAYED px. The square curve keeps most of them near the
    // floor and a few genuinely bright, which is what stops a field reading
    // as noise.
    const r = ((0.26 + mag * mag * 0.8) * D).toFixed(1);
    const a = (0.07 + mag * mag * 0.3).toFixed(3);
    out.push(
      `<circle cx="${sx.toFixed(0)}" cy="${sy.toFixed(0)}" r="${r}" fill="#fff" opacity="${a}"/>`,
    );

    // 1 in 40, not 1 in 14, and half the radius.
    if (mag > 0.975) {
      const g = (1.9 + rnd() * 1.3) * D;
      out.push(
        `<circle cx="${sx.toFixed(0)}" cy="${sy.toFixed(0)}" r="${g.toFixed(0)}" fill="url(#glint${seed})"/>`,
      );
    }
  }
  return `<svg class="layer" viewBox="0 0 ${w} ${h}"><defs>
    <radialGradient id="glint${seed}"><stop offset="0" stop-color="#fff" stop-opacity=".16"/>
    <stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>${out.join("")}</svg>`;
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
  // cx STAYS at w-336. It was briefly moved to w-320 on 2026-08-07 to give the
  // enlarged category line more room, and that was unnecessary and harmful: the
  // category ends at x=797 and the leftmost station label starts at x=906, so
  // the gutter was already 109px. Moving the instrument right pushed "03 PLAN"
  // off the 1500 edge. Measure before you move things.
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
      <!-- SIZES RAISED 2026-08-07, founder call, and for the same reason as the
           LinkedIn cover: these were sized to the FILE, not to the render.
           X draws a 1500px banner at roughly 600px on desktop, a 2.5x downscale,
           so the category line at 17px was landing at 6.8px on screen. It has
           never been readable there; it simply was never measured. At 24px it
           lands at 9.6px, and the wordmark goes 22 -> 28 so the lockup does not
           end up outweighed by the line beneath it.

           The headline is UNCHANGED at 54px (21.6px displayed). It was already
           the one element sized correctly, and the hierarchy still holds:
           headline 21.6 > category 10.8.

           Mobile stays a known compromise. X mobile crops ~13% per side and
           renders near 390px, so nothing survives at full size there; that is
           what the "-safe" variants were for and the founder rejected them
           2026-08-06 for shrinking the type. Desktop is the surface being fixed
           here, deliberately.

           NOTE TO WHOEVER EDITS THIS COMMENT NEXT: no backticks in here. This
           block lives inside a template literal, so a backtick opens a nested
           expression and the whole function stops parsing. It happened twice on
           2026-08-07, once here and once in linkedinCover, and the second one
           got committed before a full render caught it. -->
      ${lockup(38 * s, 28 * s, id + "lk")}
      <div style="margin-top:${30 * s}px;font-size:${54 * s}px;line-height:${LEAD};
          font-weight:500;letter-spacing:-.042em;color:${P.bone};white-space:nowrap">${HOOK}</div>
      <div style="margin-top:${26 * s}px">${categoryLine(24 * s, 14 * s)}</div>
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
    cx: w + 20 * s,
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
    <div style="position:absolute;left:${230 * s}px;top:50%;transform:translateY(-50%);
        display:flex;align-items:center;gap:${28 * s}px">
      ${lockup(36 * s, 26 * s, id + "lk")}
      <span style="width:1px;height:${46 * s}px;background:${P.brass};opacity:.34"></span>
      <span style="font-size:${17.5 * s}px;color:${P.slate};letter-spacing:-.006em">${CATEGORY}</span>
    </div>
  `,
  );
}

// =============================================================================
// LINKEDIN COVER — 4200x700. Replaces the scaled-up `strip()` layout.
//
// `strip()` is a 191px design and at 4200x700 it was being stretched 3.7x. The
// founder rejected the upload on sight -- "not at all aligned good, and it was
// outside the preferred area" -- and he was right on all three counts:
//
//   LOGO       LinkedIn overlays a SQUARE company logo plate on the bottom
//              left, covering roughly x 0..800 at this width. The strip put its
//              wordmark at x=843, which is 43px of clearance. Once LinkedIn
//              applied its own side crop the plate landed ON the wordmark. That
//              is the "outside the preferred area" fault exactly.
//   INSTRUMENT the strip pushed the orrery centre OFF-canvas to cx=4273 with a
//              1246px outer shell, so only bare arcs entered the frame and the
//              right edge sliced them mid-curve. It reads as a render accident,
//              not as a deliberate bleed.
//   VOID       everything sat centre-right, leaving the left ~20% of a 6:1
//              canvas as dead black -- and the logo plate does not fill it.
//
// SO: the instrument is CONTAINED rather than bled, at banner() proportions
// scaled 0.92, and the type block is anchored at x=1000 -- 200px clear of the
// logo plate and far clear of a 4%-per-side crop. Nothing is cut at any edge,
// which is what makes this survive a crop the exact geometry of which we do not
// control and cannot measure without logging in.
//
// THE TYPE IS NOT SHRUNK, deliberately. Founder ruling 2026-08-06, from the
// rejected x-header `-safe` variant: shrinking type to survive a crop "looks
// weird again, it's not good". Shrinking was the wrong lever there and it is
// the wrong lever here. The anchor moves; the type does not.
// =============================================================================
/**
 * The two headline blocks the LinkedIn cover can carry. BOTH SHIP, per founder
 * ruling 2026-08-07 ("leave this current version, don't delete it, create a copy
 * and work with the new version") -- the same rule the x-header and x-header-safe
 * pair already follow. The uploader picks; neither replaces the other.
 *
 * HOOK is the ratified variant-H claim. It is the sharper sentence and it owns
 * the output/outcome pair that this file calls the moat.
 *
 * SPINE is `TAGLINE` from src/routes/index.tsx:44, verbatim, which is the live
 * homepage hero. It names the three layers in order -- knows what to build (the
 * director), ships it (the operating system), guides the next call (the company
 * brain) -- so a stranger learns what the product DOES rather than only what it
 * claims. On LinkedIn specifically that matters, because the Tagline field
 * directly under the company name already carries the category, and a cold
 * visitor who reads category plus claim still does not know what gets built.
 *
 * The lifted word is `guide the next call` and not an arbitrary one: per
 * CLAUDE.md the brain is the only layer defensible on its own, and it is
 * the beat the instrument's lit return path from 07 LEARN actually draws.
 */
const HOOK_BLOCK = (D: number) => `
  <div style="width:${(34 * D).toFixed(0)}px;height:${(2.6 * D).toFixed(1)}px;background:${P.ember}"></div>
  <div style="margin-top:${(15 * D).toFixed(0)}px;font-size:${(21 * D).toFixed(0)}px;
      line-height:${LEAD};font-weight:500;letter-spacing:-.042em;color:${P.bone};
      white-space:nowrap">${HOOK}</div>`;

// ⚠️ NEW COPY, NOT YET RATIFIED. Everything else in this file traces to a
// founder-approved string; this one does not, and it should not be treated as
// canon until he signs it off.
//
// It is a COMPRESSION of TAGLINE, not a replacement for it. The verbatim line
// runs 65 characters, and the founder's note was "this is very too long text,
// how crisp can you deliver this message". A hero paragraph and a banner are
// different surfaces: the hero is read, the banner is glanced at.
//
// The subject is dropped on purpose. LinkedIn prints "Supaprod" directly beneath
// the cover, so the page supplies the subject and the banner does not have to.
// That buys back the seven characters that "Agents that" was spending and lets
// the sentence go verb-first, which is also punchier.
//
// Three beats, 49 characters, and both ends of the loop survive: knows what to
// build is the director, ships it is the operating system, learns what worked is
// the brain. `Learns what worked` takes the weight because it is the
// only one of the three a competitor cannot also claim.
const SPINE_BLOCK = (D: number) => `
  <div style="width:${(34 * D).toFixed(0)}px;height:${(2.6 * D).toFixed(1)}px;background:${P.ember}"></div>
  <div style="margin-top:${(15 * D).toFixed(0)}px;font-size:${(20 * D).toFixed(0)}px;
      line-height:${LEAD};font-weight:500;letter-spacing:-.042em;color:${P.bone};
      white-space:nowrap">Knows what to build. Ships it.<br>${hi("Learns what worked")}.</div>`;

/**
 * VARIANT C. Founder direction 2026-08-07, after seeing B:
 * "use the word Agents, and for the keywords try the Geist Pixel font to
 *  highlight those 3 areas, build, ship and learns. All 3 need equal importance
 *  and white is good."
 *
 * Three departures from the house rules, all deliberate and all his call:
 *
 *   SUBJECT RETURNS. B dropped "Agents" because LinkedIn supplies the subject
 *   beneath the cover. He wants it back, and it does buy the sentence its
 *   agentic-first framing rather than leaving it a list of verbs.
 *
 *   PIXEL AS EMPHASIS. The lockup docblock says Pixel "appears HERE and nowhere
 *   else: one Pixel word per asset". This asset carries no lockup, so nothing
 *   competes, but three Pixel words is still a departure from that rule and is
 *   recorded as one rather than quietly done.
 *
 *   EQUAL WEIGHT, NO DIM. The ratified system is one hero word at 700 and one
 *   word dimmed. Here all three verbs are peers, because they are three stages
 *   of one loop and ranking them would misrepresent the product. Emphasis comes
 *   from the typeface switch alone, not from weight or colour.
 *
 * Pixel runs slightly smaller than Geist Sans at the same nominal size because
 * its square terminals fill more of the em box, so the spans are set at 0.94 to
 * keep the baseline rhythm even.
 */
/**
 * THICKENED WITH A STROKE, NOT WITH font-weight. Founder call 2026-08-07 after
 * seeing the first pass: "it's not coming out highlighted, increase the weight
 * of the font and change the colour to ember."
 *
 * He is right that the typeface switch alone did not read as emphasis. Geist
 * Pixel is narrower and lighter in stroke than Geist Sans, so at render size the
 * verbs sat QUIETER than the text around them, which is the opposite of a
 * highlight.
 *
 * font-weight cannot fix it. The kit ships exactly one Pixel face,
 * GeistPixel-Square.woff2, with no bold, so `font-weight:700` would trigger
 * SYNTHETIC bold. A browser fakes that by smearing the glyph horizontally, and
 * on a squared-terminal pixel face that reads as a rendering fault rather than
 * as weight, which is precisely the failure mode the lockup docblock warns
 * about.
 *
 * -webkit-text-stroke adds real, even thickness on every edge instead. Sized at
 * 0.02em, which is OPTICAL PARITY and not emphasis: the Pixel stem is about
 * 0.02em thinner than Geist Sans at 500, so this closes the deficit and stops
 * there. It was briefly 0.045em, and the founder was right to call that too
 * much -- at double the deficit it stacked a third emphasis lever on words that
 * already had colour and a typeface change. Ember does the highlighting; the
 * stroke only stops the face reading thin.
 *
 * Ember is the accent the brand already owns, and it is what the tick above the
 * headline is drawn in, so the three verbs now rhyme with it. Note this is EMBER
 * and not gold: the file rule is that gold is the mark's core bead and a caution
 * accent, never a type colour.
 */
const pixelWord = (t: string, D: number) => {
  const size = 21.5 * D;
  return (
    `<span class="pixel" style="font-size:${size.toFixed(0)}px;color:${P.ember};` +
    `font-weight:400;letter-spacing:.005em;` +
    `-webkit-text-stroke:${(size * 0.02).toFixed(1)}px ${P.ember}">${t}</span>`
  );
};

/**
 * "Agents" carries a little weight of its own. Founder call 2026-08-07:
 * "highlight Agents not with colour, but just a little more whitish and
 *  thickening, only the Agents word, and the font stays the same."
 *
 * That is the right instinct and it keeps the hierarchy legible: ember marks the
 * three stages of the loop, and a brightness lift marks WHO does them. Two
 * different jobs, so two different devices, and neither borrows the other's.
 * Using colour here as well would have flattened them into one undifferentiated
 * band of emphasis.
 *
 * The lift is small on purpose. P.bone is #F5F4F2, so pure white is only a few
 * points brighter; combined with 700 against the surrounding 500 it reads as
 * a subject being named rather than as a second highlight competing with ember.
 */
const agentsWord = `<span style="color:#FFFFFF;font-weight:700">Agents</span>`;

/**
 * VARIANT D, weight only. Founder request 2026-08-07, pointing at the shipped
 * x-header: "you see how the weighted text looks, it looks so premium, just
 * white and grey contrast, and the weight of the font without even putting an
 * effort. Should we try that for LinkedIn instead of the ember colour or the
 * Geist Pixel font?"
 *
 * He is describing the system this file already ratified at the top: body at
 * full bone weight 500, the hero lifted to 700, and nothing else touched. The
 * x-header reads premium because it spends exactly one device.
 *
 * So this variant drops BOTH of the devices variant C added. No ember, no
 * typeface switch. The three verbs go to 700 and stay bone, which keeps them
 * peers with each other while lifting all three off the line.
 *
 * The base is NOT greyed to make room for them. That is the correction recorded
 * in the TYPOGRAPHY block at the top of this file: dimming the field does not
 * spotlight the hero, it dulls the whole room. Contrast is made by lifting one
 * thing above a bright field. The x-header only dims "output" because output is
 * the thing the company is NOT, and there is no such word in this sentence.
 */
const WEIGHT_BLOCK = (D: number) => `
  <div style="width:${(34 * D).toFixed(0)}px;height:${(2.6 * D).toFixed(1)}px;background:${P.ember}"></div>
  <div style="margin-top:${(15 * D).toFixed(0)}px;font-size:${(20 * D).toFixed(0)}px;
      line-height:${LEAD};font-weight:500;letter-spacing:-.042em;color:${P.bone};
      white-space:nowrap">Agents that know what to ${hi("build")},<br>${hi("ship")} it, and ${hi("learn")} what worked.</div>`;

/**
 * VARIANT E, two weight tiers. Founder 2026-08-07: "D is good, just that the
 * Agents word also needs to be highlighted... the highlighted word should be of
 * more weight, something similar to that. I'll leave that to you, you take a
 * call."
 *
 * THE CALL, and the reasoning, because he asked for judgement rather than
 * obedience: bolding "Agents" AND all three verbs is four lifted words out of
 * twelve, and the x-header he is admiring reads premium precisely because the
 * lift is SCARCE, one word at 700 out of six. Four bold words in one sentence
 * is not that look, it is a busy one.
 *
 * So the lift is split into two tiers instead of flattened into one:
 *
 *   750  Agents          the subject, who does the work. Strongest, once.
 *   600  build ship learn  the three loop stages. Peers with each other,
 *                          clearly lifted, deliberately below the subject.
 *   500  everything else   the ratified base, at full brightness.
 *
 * This keeps the founder's earlier and still-standing requirement that the
 * three verbs carry EQUAL importance: they are equal to one another. Being
 * below the subject is a different axis and does not rank them against
 * each other.
 *
 * Intermediate weights are honest here. Geist ships as a variable face at
 * 100-900 (see FONTS_CSS in orrery.ts), so 600 and 750 are real instances and
 * not the synthetic smear that ruled font-weight out for the Pixel verbs in
 * variant C.
 */
/**
 * VARIANT F, everything lifted to 700. Founder on variant E, 2026-08-07: "you
 * have not highlighted the and learn, that also needs to be highlighted... as
 * of now it doesn't feel highlighted, no spotlight on those words."
 *
 * He is right and the fault was mine. Variant E put the verbs at 600 against a
 * 500 base, and at roughly 20px displayed that one step is below the threshold
 * where a reader perceives a weight change at all. The two-tier idea was sound
 * on paper and invisible on the page, which is the only test that counts.
 *
 * So this is his original instruction executed literally: Agents and all three
 * verbs at 700 against the 500 base. Four lifted words rather than one, which
 * is a real departure from the x-header's scarcity, and the honest trade is
 * that every word he named is now unmistakably lifted.
 */
const LIFT_ALL_BLOCK = (D: number) => `
  <div style="width:${(34 * D).toFixed(0)}px;height:${(2.6 * D).toFixed(1)}px;background:${P.ember}"></div>
  <div style="margin-top:${(15 * D).toFixed(0)}px;font-size:${(20 * D).toFixed(0)}px;
      line-height:${LEAD};font-weight:500;letter-spacing:-.042em;color:${P.bone};
      white-space:nowrap">${hi("Agents")} that know what to ${hi("build")},<br>${hi("ship")} it, and ${hi("learn")} what worked.</div>`;

/**
 * VARIANT G, the founder's own alternative: "different font even if it is not
 * highlighted, different fonts say Geist Pixel or something with the same white
 * colour text."
 *
 * This is variant C's device minus the thing that made C too loud. C stacked
 * three signals on the verbs: a typeface switch, ember, and a heavy stroke. G
 * keeps only the typeface switch, in bone rather than ember, with the stroke at
 * the 0.02em optical parity established when the thickening was audited down.
 * Pixel is narrower and lighter than Geist Sans, so without that parity stroke
 * the verbs read quieter than the words around them, which is the failure the
 * first Pixel attempt hit.
 *
 * Agents keeps a plain weight lift here, because giving it Pixel too would make
 * four of twelve words a different typeface and the line would stop being a
 * sentence.
 */
const PIXEL_WHITE_BLOCK = (D: number) => {
  const size = 21.5 * D;
  const pw = (t: string) =>
    `<span class="pixel" style="font-size:${size.toFixed(0)}px;color:${P.bone};font-weight:400;` +
    `letter-spacing:.005em;-webkit-text-stroke:${(size * 0.02).toFixed(1)}px ${P.bone}">${t}</span>`;
  return `
  <div style="width:${(34 * D).toFixed(0)}px;height:${(2.6 * D).toFixed(1)}px;background:${P.ember}"></div>
  <div style="margin-top:${(15 * D).toFixed(0)}px;font-size:${(20 * D).toFixed(0)}px;
      line-height:${LEAD};font-weight:500;letter-spacing:-.042em;color:${P.bone};
      white-space:nowrap">${hi("Agents")} that know what to ${pw("build")},<br>${pw("ship")} it, and ${pw("learn")} what worked.</div>`;
};

/**
 * VARIANT H, the station-label register. This is my proposal rather than one of
 * his, offered because he asked for it explicitly: "I just gave you the
 * suggestion that might not be the right one, but the problem is real. See how
 * we can address it, not just by going with my thoughts, if you have a better
 * approach in design language you can opt that."
 *
 * THE DIAGNOSIS. Weight cannot spotlight four words in one sentence without the
 * line going busy. That is why 600 was imperceptible and why 700 on all four
 * will read heavy. The constraint is not how much lift is applied, it is that
 * the verbs are BURIED IN PROSE. A reader scanning a sentence does not stop on
 * a slightly bolder word in the middle of it.
 *
 * THE MOVE. Give the three verbs the register the instrument already uses for
 * exactly these three things. The orrery on the right labels its stations
 * 05 BUILD, 06 SHIP and 07 LEARN in Geist Mono, uppercase, tracked out. Putting
 * the inline verbs in that same register does two things at once:
 *
 *   They stop reading as prose and start reading as TAGGED STAGES, which is
 *   what they are. Caps plus mono plus tracking is a far stronger scan signal
 *   than any weight step, and it is the signal this design system already
 *   assigns to loop stages.
 *
 *   The type block and the instrument become ONE system. Right now they are two
 *   unrelated things sharing a canvas: a sentence, and a diagram that happens to
 *   name the same stages in a different voice.
 *
 * Agents keeps the plain weight lift, so the sentence still has a subject that
 * outranks its verbs, and the headline keeps a single lift in its own register.
 *
 * Caps sit optically larger than lowercase at the same nominal size, so the
 * mono spans run at 0.84 to keep the line rhythm even.
 */
const STATION_BLOCK = (D: number) => {
  const st = (t: string) =>
    `<span class="mono" style="font-size:${(20 * 0.84 * D).toFixed(0)}px;color:${P.bone};` +
    `font-weight:500;letter-spacing:.09em">${t.toUpperCase()}</span>`;
  return `
  <div style="width:${(34 * D).toFixed(0)}px;height:${(2.6 * D).toFixed(1)}px;background:${P.ember}"></div>
  <div style="margin-top:${(15 * D).toFixed(0)}px;font-size:${(20 * D).toFixed(0)}px;
      line-height:${LEAD};font-weight:500;letter-spacing:-.042em;color:${P.bone};
      white-space:nowrap">${hi("Agents")} that know what to ${st("build")},<br>${st("ship")} it, and ${st("learn")} what worked.</div>`;
};

/**
 * VARIANT I, ember underline. Founder 2026-08-07: "should there be a pencil
 * drawn underline sort of thing under the keywords like build, ship and learn,
 * in ember colour? At least that would give a spotlight."
 *
 * This is the best answer of the several tried, and the reason is structural.
 * Every previous attempt changed the WORDS themselves: heavier, a different
 * face, a different colour. Each one traded away something. Weight at 700 on
 * four words made the line busy. Pixel fragmented the sentence into code. Ember
 * as a text colour stacked a second signal on words that already had one.
 *
 * An underline MARKS a word without altering it. The three verbs stay one
 * typeface, one weight and one colour, so the line still reads as a sentence,
 * and the rule underneath is an unambiguous look-here. It also rhymes with the
 * ember tick already sitting above the headline, so it reads as this design
 * system rather than as a new device bolted on.
 *
 * CLEAN RULE, NOT A HAND-DRAWN ONE, deliberately against the literal request. A
 * pencil wobble is charming at full size and turns to mush at the 5.22x
 * downscale this file is subject to, where the rule lands at about 2px. An
 * irregular 2px stroke reads as a rendering artefact. A crisp one survives.
 *
 * Drawn with a background gradient rather than text-decoration or a border so
 * it sits at a controlled offset below the baseline and never collides with
 * descenders. There are none in build, ship or learn, but the next word chosen
 * might have one.
 */
const UNDERLINE_BLOCK = (D: number) => {
  const size = 20 * D;
  const rule = Math.max(2, Math.round(size * 0.085));
  const ul = (t: string) =>
    `<span style="background-image:linear-gradient(${P.ember},${P.ember});` +
    `background-size:100% ${rule}px;background-position:0 100%;background-repeat:no-repeat;` +
    `padding-bottom:${Math.round(size * 0.1)}px">${t}</span>`;
  return `
  <div style="width:${(34 * D).toFixed(0)}px;height:${(2.6 * D).toFixed(1)}px;background:${P.ember}"></div>
  <div style="margin-top:${(15 * D).toFixed(0)}px;font-size:${size.toFixed(0)}px;
      line-height:1.34;font-weight:500;letter-spacing:-.042em;color:${P.bone};
      white-space:nowrap">${hi("Agents")} that know what to ${ul("build")},<br>${ul("ship")} it, and ${ul("learn")} what worked.</div>`;
};

const SUBJECT_BLOCK = (D: number) => {
  const lift = (t: string, w: number) => `<span style="font-weight:${w}">${t}</span>`;
  return `
  <div style="width:${(34 * D).toFixed(0)}px;height:${(2.6 * D).toFixed(1)}px;background:${P.ember}"></div>
  <div style="margin-top:${(15 * D).toFixed(0)}px;font-size:${(20 * D).toFixed(0)}px;
      line-height:${LEAD};font-weight:500;letter-spacing:-.042em;color:${P.bone};
      white-space:nowrap">${lift("Agents", 750)} that know what to ${lift("build", 600)},<br>${lift("ship", 600)} it, and ${lift("learn", 600)} what worked.</div>`;
};

const PIXEL_BLOCK = (D: number) => `
  <div style="width:${(34 * D).toFixed(0)}px;height:${(2.6 * D).toFixed(1)}px;background:${P.ember}"></div>
  <div style="margin-top:${(15 * D).toFixed(0)}px;font-size:${(20 * D).toFixed(0)}px;
      line-height:${LEAD};font-weight:500;letter-spacing:-.042em;color:${P.bone};
      white-space:nowrap">${agentsWord} that know what to ${pixelWord("build", D)},<br>${pixelWord("ship", D)} it, and ${pixelWord("learn", D)} what worked.</div>`;

function linkedinCover(
  w: number,
  h: number,
  id: string,
  headline: (D: number) => string = HOOK_BLOCK,
) {
  // ---------------------------------------------------------------------------
  // TYPE IS SIZED TO THE RENDERED COVER, NOT TO THE FILE. This is the whole
  // reason this function exists in its current shape.
  //
  // Measured on the live page 2026-08-07, signed in, `View as member` at a
  // 1440px viewport: LinkedIn draws this 4200x700 file into an 804x132 box.
  // That is a 5.22x DOWNSCALE. So a size written here is divided by five before
  // anybody reads it, and the only sizes that matter are display sizes.
  //
  // The first attempt at this layout borrowed banner()'s scale (s = h/500 = 1.4)
  // and set the category line at 17*s = 24px. On screen that is 4.6px. The
  // founder caught it immediately -- "it looks too small, would that be
  // readable" -- and he was right; it is not a preference, it is illegible.
  //
  // The ORIGINAL strip() sizes were correct all along, because s = h/191 = 3.67
  // happened to land the category at 64px master = 12.2px displayed. Its fault
  // was alignment, never type size. So this layout keeps strip()'s sizes and
  // fixes only what was actually broken.
  //
  // D below is the file-to-display ratio. Every type size is written as
  // (target displayed px) * D, so the intent survives anyone rescaling the file.
  // ---------------------------------------------------------------------------
  const D = w / 804;

  // BIG AND HALF-CUT, not small and complete. Founder call 2026-08-07: a small
  // whole instrument "is so small it cannot even be read -- what is the whole
  // purpose of it", and he is right. At 410px across it was decorative dust.
  //
  // So the centre now sits at x=4250, PAST the right edge, and the frame shows
  // the left half of a large orrery sweeping in. The ellipses are bisected at
  // their widest point, which reads as a deliberate section. That is the whole
  // difference from the ORIGINAL fault: the old layout was also cut, but cut
  // mid-arc at a random radius, which reads as an accident. Cut a circle at its
  // diameter and it looks intended; cut it anywhere else and it looks broken.
  //
  // Vertically it stays CONTAINED -- k is down to 0.32 so the outer ring spans
  // y 78..622 on a 700px canvas. One edge is cut, on purpose, and no other.
  //
  // THE MARK IS NOT DRAWN (markPx 0). The orrery's core is off-canvas, and that
  // is the second half of the founder's note: LinkedIn already stamps the mark
  // on the logo plate bottom-left AND prints "Supaprod" directly beneath the
  // cover, so drawing the lockup here was the word's third appearance in one
  // glance. "Again we are showing Supaprod. It's not good."
  // THE INSTRUMENT IS LARGE AND ITS CORE IS IN FRAME. Founder reference
  // 2026-08-07 (the x-header render): rings spreading wide and losing contrast
  // as they go, the outermost ones drifting over the type without harming it.
  //
  // Two earlier passes got this wrong in opposite directions. The first made it
  // small and complete, which he called decorative dust. The second pushed the
  // core off-canvas and faded the RIGHT edge, which dimmed the dense, legible
  // part and left only the faint outer arcs -- backwards. The falloff is RADIAL,
  // not horizontal: bright at the core, dissolving outward. See `falloff`.
  //
  // Once the outer rings dissolve, they cost nothing, so the outermost shell can
  // run to 1421 and sweep the full width. That is what "stretched towards left
  // so that we show more portion" actually needs.
  const outer = 1421;
  const o: Orr = {
    cx: 3980,
    cy: h * 0.5,
    k: 0.34,
    shells: [304, 534, 823, 1107, outer],
    stationR: 534,
    nodeR: 11.8,
    id,
  };
  // RADIAL CONTRAST FALLOFF. This is the correction that made the composition
  // work, and it took two wrong attempts to find.
  //
  // The founder's words were "the spiral rings can be a little more subtly less
  // contrast", and I read that as a left-right gradient twice. His reference
  // image settled it: "take a look at how it slowly loses contrast while it
  // spreads out and overlapping on the text". The axis is RADIAL. Rings are
  // bright at the core and dissolve as they spread, which is both how an
  // engraving of an orbital system actually behaves and the reason the faint
  // outermost arcs are free to cross the type -- at 10% opacity they are
  // atmosphere, not collision.
  //
  // The ellipse is sized to the instrument (rx to the outer shell, ry by k), so
  // the fade follows the geometry rather than cutting across it.
  const rx = Math.round(outer * 1.05);
  const ry = Math.round(outer * 1.05 * o.k);
  const falloff =
    `radial-gradient(${rx}px ${ry}px at ${o.cx}px ${o.cy}px, ` +
    `#000 0%, #000 26%, rgba(0,0,0,.60) 50%, rgba(0,0,0,.22) 72%, rgba(0,0,0,.05) 100%)`;
  return page(
    w,
    h,
    `
    <div style="position:absolute;inset:0;background:
      radial-gradient(80% 160% at 26% 0%, ${P.lift} 0%, transparent 62%)"></div>
    <!-- THE INSTRUMENT IS NOT GLOBALLY DIMMED, and that was decided rather than
         defaulted. It was briefly taken to opacity .78 on 2026-08-07 when the
         founder asked "should we dullen it a bit", then reverted by him the same
         hour on the reasoning that settles it: "I thought if you were doing it
         centre aligned then the text would overlap, and dulling would make
         sense. If you are not doing centre alignment then it is good as it is."
         Correct. The dim was a remedy for a collision that the left-anchored
         layout never creates. The radial falloff already shapes the
         instrument's internal contrast, and nothing else is needed. Do not
         reinstate a global opacity here without a collision to justify it. -->
    <div style="position:absolute;inset:0;-webkit-mask-image:${falloff};mask-image:${falloff}">
      ${machine(w, h, o, 245, 44, { r: 620, size: 44 })}
    </div>
    <!-- Star field ON TOP of the falloff, not inside it, so the sky stays even
         across the whole frame while only the instrument fades. -->
    ${starsAtDisplayScale(w, h, id + "sky", D, { x0: 900, x1: 3400, y0: 150, y1: 550 })}
    ${GRAIN(P.grain)}
    <!-- THE BANNER CARRIES THE HOOK, NOT THE CATEGORY. Founder call 2026-08-07,
         and it reverses the inversion made earlier the same day. Both calls were
         right; the second one has information the first did not.

         Read the live page top to bottom and the category line appeared TWICE
         inside about 100 vertical pixels: once across the cover, and again in
         LinkedIn's own Tagline field directly under the company name. "Don't you
         feel that would be a concern, the repetitive of the content."

         The division that resolves it is not arbitrary. LinkedIn INDEXES the
         tagline field -- it is what surfaces the page in search -- so the
         keyword-bearing category sentence belongs there on its own merits. That
         leaves the cover free for the line the tagline cannot carry: the claim
         that separates this company from every other one that could describe
         itself as an operating system for product teams.

         So the tagline does the searchable work and the banner does the
         persuasive work, and neither repeats the other.

         Two lines, not flat, with the weight contrast from the ratified copy
         block at the top of this file: body at 500, "outcomes" at 700, and
         exactly one word dimmed. LEAD 1.08 locks the pair into one object.
         No lockup here -- see the note on the mark above.
         x=1000 clears LinkedIn's logo plate, which ends at x=794. -->
    <div style="position:absolute;left:1000px;top:50%;transform:translateY(-50%);width:2460px">
      ${headline(D)}
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
const SPECS: {
  base: string;
  w: number;
  h: number;
  fn: (id: string) => string;
  /** Also emit a JPEG twin. See the LinkedIn note below for why it is not decorative. */
  jpeg?: boolean;
  /**
   * Also write this asset into the app's `public/` directory, under the given
   * filename, on the DARK ground only.
   *
   * THIS EXISTS TO CLOSE THE HOUSE HAZARD. Nothing in this repo regenerated
   * `public/` from the brand kit, so every founder ruling had to be carried
   * across by hand and routinely was not. That failure shipped four times in a
   * single day on 2026-08-07: the OG card still said "Cadence" weeks after the
   * rename, the icon set was violet three weeks after the colour was banned,
   * the FAQ's JSON-LD drifted from its copy, and the LinkedIn JPEG kept serving
   * a layout the PNG had already replaced.
   *
   * `public/og-supaprod.png` was verified pixel-identical to
   * `social/og-dark-1200x630.png` on 2026-08-07, which is to say it was a hand
   * copy that happened to still be current. Now it is generated, so it cannot
   * quietly stop being current.
   */
  publicAs?: string;
}[] = [
  // Both variants ship for every avatar-overlay platform. `-safe` survives the
  // ~13% mobile side-crop and the nav-button band; the plain one is the wider
  // desktop composition. Neither replaces the other.
  { base: "x-header", w: 1500, h: 500, fn: (i) => banner(1500, 500, i) },
  { base: "x-header-safe", w: 1500, h: 500, fn: (i) => bannerSafe(1500, 500, i) },
  { base: "mastodon-header", w: 1500, h: 500, fn: (i) => banner(1500, 500, i) },
  { base: "mastodon-header-safe", w: 1500, h: 500, fn: (i) => bannerSafe(1500, 500, i) },
  { base: "bluesky-banner", w: 3000, h: 1000, fn: (i) => banner(3000, 1000, i) },
  { base: "bluesky-banner-safe", w: 3000, h: 1000, fn: (i) => bannerSafe(3000, 1000, i) },
  // LINKEDIN IS 4200x700, NOT 1128x191.
  //
  // 1128x191 is the OLD company-page spec and it is what this kit shipped. On
  // the current page LinkedIn slots the cover into a 4200x700 frame, so a
  // 1128-wide file gets upscaled 3.7x in each dimension: the crop dialog
  // letterboxes it with black bars and the result looks soft. The founder spotted
  // the quality loss before the number was checked.
  //
  // Cap is 3MB, and LinkedIn's own guidance prefers JPEG over PNG here because
  // their pipeline re-encodes. The old size is kept only as a fallback for any
  // surface still asking for it.
  //
  // ⚠️ `jpeg: true` IS LOAD-BEARING AND IT WAS MISSING UNTIL 2026-08-07.
  //
  // This comment used to claim the JPEG "is emitted alongside". It was not. No
  // code in this file or in orrery.ts ever wrote a .jpg -- the shipped
  // linkedin-cover-dark-4200x700.jpg was made by hand on 2026-08-06 and then
  // never moved again. So when the composition below was rewritten, the PNG
  // updated and the JPEG kept serving the OLD broken layout, while §5 of
  // social-accounts.md points the uploader at the JPEG by name.
  //
  // That is the house hazard verbatim: corrected source, stale artifact. It has
  // now bitten the OG card, the icon set, the FAQ schema and this file. A
  // comment asserting an output exists is not an output; only code that writes
  // it is.
  // BOTH HEADLINE VARIANTS SHIP. Founder ruling 2026-08-07: "leave this current
  // version, don't delete it, create a copy and work with the new version." Same
  // pattern as x-header / x-header-safe -- the uploader picks, neither replaces
  // the other, and the rejected one stays available rather than being lost to a
  // git history nobody will dig through.
  {
    base: "linkedin-cover-hook",
    w: 4200,
    h: 700,
    fn: (i) => linkedinCover(4200, 700, i, HOOK_BLOCK),
    jpeg: true,
  },
  {
    base: "linkedin-cover-spine",
    w: 4200,
    h: 700,
    fn: (i) => linkedinCover(4200, 700, i, SPINE_BLOCK),
    jpeg: true,
  },
  {
    base: "linkedin-cover-weight",
    w: 4200,
    h: 700,
    fn: (i) => linkedinCover(4200, 700, i, WEIGHT_BLOCK),
    jpeg: true,
  },
  {
    base: "linkedin-cover-subject",
    w: 4200,
    h: 700,
    fn: (i) => linkedinCover(4200, 700, i, SUBJECT_BLOCK),
    jpeg: true,
  },
  {
    base: "linkedin-cover-liftall",
    w: 4200,
    h: 700,
    fn: (i) => linkedinCover(4200, 700, i, LIFT_ALL_BLOCK),
    jpeg: true,
  },
  {
    base: "linkedin-cover-pixelwhite",
    w: 4200,
    h: 700,
    fn: (i) => linkedinCover(4200, 700, i, PIXEL_WHITE_BLOCK),
    jpeg: true,
  },
  {
    base: "linkedin-cover-station",
    w: 4200,
    h: 700,
    fn: (i) => linkedinCover(4200, 700, i, STATION_BLOCK),
    jpeg: true,
  },
  {
    base: "linkedin-cover-underline",
    w: 4200,
    h: 700,
    fn: (i) => linkedinCover(4200, 700, i, UNDERLINE_BLOCK),
    jpeg: true,
  },
  {
    base: "linkedin-cover",
    w: 4200,
    h: 700,
    fn: (i) => linkedinCover(4200, 700, i, PIXEL_BLOCK),
    jpeg: true,
  },
  { base: "linkedin-cover-legacy", w: 1128, h: 191, fn: (i) => strip(1128, 191, i) },
  { base: "youtube-banner", w: 2560, h: 1440, fn: () => youtube() },
  { base: "og", w: 1200, h: 630, fn: (i) => card(1200, 630, i), publicAs: "og-supaprod.png" },
  { base: "github-social-preview", w: 1280, h: 640, fn: (i) => card(1280, 640, i) },
  { base: "producthunt-gallery", w: 1270, h: 760, fn: (i) => card(1270, 760, i) },
  { base: "discord-banner", w: 960, h: 540, fn: (i) => card(960, 540, i) },
  { base: "square", w: 1200, h: 1200, fn: (i) => card(1200, 1200, i) },
];

// Iteration filters. A full run is 28 assets at 3x supersample and the 8400x1400
// LinkedIn @2x alone takes minutes, which is long enough that you stop checking
// your work. `ONLY` substring-matches the base, `GROUND` picks one ground:
//
//   ONLY=linkedin-cover GROUND=dark bun run generate-banners.ts
//
// Filters affect WHICH files are written, never HOW any of them is drawn, so a
// filtered run and a full run produce byte-identical output for the assets both
// of them touch. Verified 2026-08-07: after the LinkedIn recomposition a full
// run left the other 26 assets untouched in git.
const ONLY = process.env.ONLY;
const GROUND = process.env.GROUND;

console.log(`ORRERY — full platform set, both grounds, 3x supersample\n`);
let jpegs = 0;
let publics = 0;
for (const g of ["light", "dark"] as const) {
  if (GROUND && g !== GROUND) continue;
  setGround(g);
  console.log(`  ${g.toUpperCase()}`);
  for (const s of SPECS) {
    if (ONLY && !s.base.includes(ONLY)) continue;
    const id = `${s.base}-${g}`.replace(/[^a-z0-9]/g, "");
    const png = join(OUT, `${s.base}-${g}-${s.w}x${s.h}.png`);
    await render(s.fn(id), s.w, s.h, png);
    // Emitted FROM the PNG that was just written, so the two can never disagree.
    // Quality 92 puts 4200x700 at roughly 400KB, an order under LinkedIn's 3MB
    // cap, and LinkedIn re-encodes anyway so there is nothing to gain by going
    // lower and detail to lose.
    // Ship into public/ so the live site cannot drift from the kit.
    //
    // Palette-quantised to 128 colours: 264KB becomes 45KB, an 83% cut. That
    // number is only safe because it was CHECKED rather than assumed. Palette
    // reduction is exactly what bands a dark gradient, so the darkest region of
    // the card was cropped and magnified against the original before this was
    // adopted; type stayed crisp, the gradient stayed smooth and the orbit
    // hairlines survived. Do not raise the colour count "to be safe" without
    // re-running that comparison, and do not lower it without one either.
    //
    // Size matters here more than on a banner: an OG card is refetched by every
    // unfurl on X, Product Hunt, Slack and LinkedIn, so it is paid for once per
    // share rather than once per visitor.
    if (s.publicAs && g === "dark") {
      const dest = join(REPO_PUBLIC, s.publicAs);
      await sharp(png).png({ palette: true, colours: 128, compressionLevel: 9 }).toFile(dest);
      const kb = Math.round(statSync(dest).size / 1024);
      publics++;
      console.log(`    └─ public/${s.publicAs}  ${kb}KB`);
    }

    if (s.jpeg) {
      const jpg = png.replace(/\.png$/, ".jpg");
      await sharp(png).jpeg({ quality: 92, chromaSubsampling: "4:4:4" }).toFile(jpg);
      jpegs++;
      console.log(`    └─ ${jpg.split("/").pop()}`);
    }
  }
}
console.log(`\n${SPECS.length * 2} assets + ${jpegs} JPEG twins + ${publics} public/ → ${OUT}`);
