// ORRERY — the full platform set.
//
// MESSAGE ARCHITECTURE (corrected after the founder's note that the copy was
// punchy but never said what the product IS, and that the moat is the whole
// three-layer chain rather than the Learn station alone).
//
//   WEDGE      "You have agents for code. Nothing runs product."
//   CATEGORY   "The agentic-first operating system for product teams."  <- ALWAYS
//   MECHANISM  01 tells you what to build · 02 builds and ships it
//              · 03 learns what actually worked
//   MOAT       the outcome re-ranks the next bet
//
// The three MECHANISM beats are numbered to match the three orbital shells, so
// the diagram and the copy state the same three things and each explains the
// other. Geist Pixel Square carries the wordmark ONLY, small: the founder's own
// ruling is one Pixel word per asset, and Pixel at display size stops reading as
// a typeface and starts reading as a broken image.

import { join } from "node:path";
import {
  P, machine, readout, markEl, GRAIN, page, render, OUT, ang, px, py, setGround,
} from "./orrery.ts";
import type { Orr } from "./orrery.ts";

// THE HOOK. Short enough to be set LARGE, which is the whole point: the previous
// pass made the 52-character category line the headline, and a line that long
// can only ever be small. Small type is not impactful type.
//
// "Not just code" is the sharpest differentiation available. Every buyer already
// has coding agents; nobody has agents that run PRODUCT. It concedes nothing,
// names the gap, and makes the category line below it land as the answer.
const HOOK = "Agents that run product.<br>Not just code.";

// THE CATEGORY. Always present, always directly under the hook. This is the line
// the founder asked to be explicit about: agentic-first, product teams.
const CATEGORY = "The agentic-first operating system for product teams";

// THE MECHANISM, in the canon's own order: 01 director, 02 operating system,
// 03 company brain. Numbered to rhyme with the three orbital shells.
const BEATS: [string, string][] = [
  ["01", "Tells you what to build"],
  ["02", "Builds it, ships it"],
  ["03", "Learns what actually worked"],
];

/** The numbered mechanism list, rhyming with the three shells. */
function beats(size = 14, gap = 11) {
  return `<div style="display:flex;flex-direction:column;gap:${gap}px">${
    BEATS.map(([nRaw, t]) => `
      <div style="display:flex;align-items:baseline;gap:13px">
        <span class="mono" style="font-size:${(size * 0.72).toFixed(1)}px;letter-spacing:.16em;color:${P.brass};opacity:.85;min-width:${size * 1.5}px">${nRaw}</span>
        <span style="font-size:${size}px;color:${P.slate};letter-spacing:-.005em">${t}</span>
      </div>`).join("")}</div>`;
}

/** Wordmark: the mark + "Supaprod" in Pixel, small. One Pixel word per asset. */
function lockup(markPx: number, textPx: number, id: string) {
  return `<div style="display:flex;align-items:center;gap:${(markPx * 0.32).toFixed(0)}px">
    ${markEl(markPx, id)}
    <span class="pixel" style="font-size:${textPx}px;color:${P.bone};line-height:1">Supaprod</span>
  </div>`;
}

// =============================================================================
// WIDE BANNER  — X, Mastodon, Bluesky. Machine right, message left, and the
// bottom-left quadrant deliberately empty because X drops the avatar there.
// =============================================================================
function banner(w: number, h: number, id: string) {
  const s = h / 500;                       // everything scales off the 1500x500 master
  const o: Orr = {
    cx: w - 380 * s, cy: h * 0.5, k: 0.38,
    shells: [128 * s, 228 * s, 350 * s, 470 * s, 600 * s],
    stationR: 228 * s, nodeR: 4.8 * s, id,
  };
  return page(w, h, `
    <div style="position:absolute;inset:0;background:
      radial-gradient(85% 130% at 14% 2%, ${P.lift} 0%, transparent 56%)"></div>
    ${machine(w, h, o, 74 * s, 26 * s)}
    ${readout(o, 6, "07 Learn", "left", 54 * s, 9.5 * s)}
    ${readout(o, 0, "01 Discover", "right", 54 * s, 9.5 * s)}
    ${GRAIN(P.grain)}
    <div style="position:absolute;left:${92 * s}px;top:50%;transform:translateY(-50%);width:${700 * s}px">
      ${lockup(28 * s, 21 * s, id + "lk")}
      <div style="margin-top:${28 * s}px;font-size:${54 * s}px;line-height:1.06;font-weight:500;
          letter-spacing:-.042em;color:${P.bone}">${HOOK}</div>
      <div style="margin-top:${24 * s}px;display:flex;align-items:center;gap:${14 * s}px">
        <span style="width:${26 * s}px;height:1px;background:${P.ember};opacity:.8"></span>
        <span style="font-size:${17.5 * s}px;letter-spacing:-.008em;color:${P.slate}">${CATEGORY}</span>
      </div>
    </div>
  `);
}

// =============================================================================
// SHARE CARD — OG, GitHub preview, Product Hunt, Discord, square.
// Machine above, message below. Seen small, so the hierarchy is steeper.
// =============================================================================
function card(w: number, h: number, id: string, opts: { wedge?: boolean } = {}) {
  const s = Math.min(w, h) / 630;
  const o: Orr = {
    cx: w / 2, cy: h * 0.40, k: 0.36,
    shells: [116 * s, 200 * s, 300 * s, 408 * s, 530 * s],
    stationR: 200 * s, nodeR: 4.8 * s, id,
  };
  return page(w, h, `
    <div style="position:absolute;inset:0;background:
      radial-gradient(90% 90% at 50% 0%, ${P.lift} 0%, transparent 55%)"></div>
    ${machine(w, h, o, 76 * s, 27 * s)}
    ${GRAIN(P.grain)}
    <div style="position:absolute;left:${44 * s}px;top:${40 * s}px">${lockup(28 * s, 21 * s, id + "lk")}</div>
    <div style="position:absolute;left:0;right:0;bottom:${58 * s}px;text-align:center;padding:0 ${60 * s}px">
      <div style="font-size:${50 * s}px;line-height:1.08;font-weight:500;letter-spacing:-.042em;color:${P.bone}">
        Agents that run product. Not just code.
      </div>
      <div style="margin-top:${20 * s}px;display:flex;align-items:center;justify-content:center;gap:${14 * s}px">
        <span style="width:${24 * s}px;height:1px;background:${P.ember};opacity:.8"></span>
        <span style="font-size:${18 * s}px;color:${P.slate}">${CATEGORY}</span>
      </div>
      <div style="margin-top:${22 * s}px;display:flex;justify-content:center;gap:${28 * s}px;flex-wrap:wrap">
        ${BEATS.map(([nn, t]) => `<span style="font-size:${14.5 * s}px;color:${P.slate}">
          <span class="mono" style="font-size:${10.5 * s}px;letter-spacing:.14em;color:${P.brass};opacity:.85">${nn}</span>
          &nbsp;${t}</span>`).join("")}
      </div>
    </div>
  `);
}

// =============================================================================
// YOUTUBE 2560x1440 — the machine fills the full canvas so a TV sees an
// instrument; every word stays inside the 1546x423 safe box (y 508..931).
// =============================================================================
function youtube() {
  const w = 2560, h = 1440;
  const o: Orr = {
    cx: 1280, cy: 548, k: 0.42,
    shells: [286, 500, 742, 1010, 1330], stationR: 500, nodeR: 9.6, id: "yt",
  };
  return page(w, h, `
    <div style="position:absolute;inset:0;background:
      radial-gradient(85% 105% at 50% 0%, ${P.lift} 0%, transparent 55%)"></div>
    ${machine(w, h, o, 152, 56)}
    <div style="position:absolute;left:0;right:0;top:690px;height:330px;
      background:radial-gradient(56% 100% at 50% 50%, rgba(${P.scrim},.88) 0%, rgba(${P.scrim},.55) 44%, transparent 78%)"></div>
    ${GRAIN(P.grain)}
    <div style="position:absolute;left:50%;top:762px;transform:translateX(-50%);width:1546px;text-align:center">
      <div style="display:flex;justify-content:center">${lockup(40, 30, "ytlk")}</div>
      <div style="margin-top:26px;font-size:66px;line-height:1.08;font-weight:500;letter-spacing:-.04em;color:${P.bone}">
        Agents that run product. Not just code.
      </div>
      <div style="margin-top:22px;display:flex;align-items:center;justify-content:center;gap:18px">
        <span style="width:30px;height:1px;background:${P.ember};opacity:.8"></span>
        <span style="font-size:24px;color:${P.slate}">${CATEGORY}</span>
      </div>
      <div style="margin-top:22px;display:flex;justify-content:center;gap:44px">
        ${BEATS.map(([nn, t]) => `<span style="font-size:22px;color:${P.slate}">
          <span class="mono" style="font-size:15px;letter-spacing:.14em;color:${P.brass};opacity:.85">${nn}</span>
          &nbsp;${t}</span>`).join("")}
      </div>
    </div>
    <div style="position:absolute;left:0;right:0;bottom:0;height:420px;
      background:linear-gradient(to top, rgba(255,107,44,.05) 0%, transparent 100%)"></div>
  `);
}

// =============================================================================
// STRIP — LinkedIn cover 1128x191. Too short for the machine, so it carries a
// horizontal lockup and a single rule, which is what the 6:1 ratio wants.
// =============================================================================
function strip(w: number, h: number, id: string) {
  const s = h / 191;
  const o: Orr = {
    cx: w - 150 * s, cy: h * 0.5, k: 0.34,
    shells: [52 * s, 92 * s, 142 * s, 200 * s, 268 * s],
    stationR: 92 * s, nodeR: 2.6 * s, id,
  };
  return page(w, h, `
    <div style="position:absolute;inset:0;background:
      radial-gradient(80% 150% at 12% 0%, ${P.lift} 0%, transparent 58%)"></div>
    ${machine(w, h, o, 32 * s, 11 * s)}
    ${GRAIN(P.grain)}
    <div style="position:absolute;left:${52 * s}px;top:50%;transform:translateY(-50%);
        display:flex;align-items:center;gap:${26 * s}px">
      ${lockup(34 * s, 24 * s, id + "lk")}
      <span style="width:1px;height:${44 * s}px;background:${P.brass};opacity:.32"></span>
      <span style="font-size:${17 * s}px;color:${P.slate};letter-spacing:-.008em">${CATEGORY}</span>
    </div>
  `);
}

// =============================================================================
// The spec table. `base` carries NO ground and NO dimensions: both are appended,
// so a file is always `<base>-<ground>-<W>x<H>.png`. The previous kit baked the
// ground into the base name (`og-dark-1200x630`), which is why adding a light
// pass to it would have produced `og-dark-light-1200x630`.
//
// Dimensions stay in the filename because the renderer measures each written
// PNG against them and refuses to write a file whose pixels disagree with its
// own name. That invariant exists because this kit once shipped a file called
// og-dark-1200x630.png that was actually 600x315.
const SPECS: { base: string; w: number; h: number; fn: (id: string) => string }[] = [
  { base: "x-header",              w: 1500, h: 500,  fn: (i) => banner(1500, 500, i) },
  { base: "mastodon-header",       w: 1500, h: 500,  fn: (i) => banner(1500, 500, i) },
  { base: "bluesky-banner",        w: 3000, h: 1000, fn: (i) => banner(3000, 1000, i) },
  { base: "linkedin-cover",        w: 1128, h: 191,  fn: (i) => strip(1128, 191, i) },
  { base: "youtube-banner",        w: 2560, h: 1440, fn: () => youtube() },
  { base: "og",                    w: 1200, h: 630,  fn: (i) => card(1200, 630, i, { wedge: true }) },
  { base: "github-social-preview", w: 1280, h: 640,  fn: (i) => card(1280, 640, i, { wedge: true }) },
  { base: "producthunt-gallery",   w: 1270, h: 760,  fn: (i) => card(1270, 760, i, { wedge: true }) },
  { base: "discord-banner",        w: 960,  h: 540,  fn: (i) => card(960, 540, i) },
  { base: "square",                w: 1200, h: 1200, fn: (i) => card(1200, 1200, i, { wedge: true }) },
];

// Both grounds, every platform. LIGHT is rendered as a first-class expression
// rather than as an afterthought variant: the founder asked three times for a
// light, premium feeling, and the brands he benchmarks (Anthropic, OpenAI,
// Google) are predominantly light. A dark banner sitting on a light platform UI
// reads heavy rather than premium. He picks per platform, from real files.
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
