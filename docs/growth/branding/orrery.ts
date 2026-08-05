// ORRERY v3 — the machine, drawn correctly.
//
// WHAT v2 GOT WRONG. It lit station 07 and called that the moat. The README is
// explicit that the product is THREE LAYERS, each the precondition for the next
// (01 the director, 02 the operating system, 03 the company brain), and that the
// mechanism is a RETURN PATH, not an endpoint:
//
//   "A shipped outcome is settled at Learn with a verdict, that verdict is
//    written back against the decision that caused it, and it re-ranks what
//    Discover and Decide surface next. The loop does not end in a report; it
//    ends by changing what you are shown."
//
// So v2 drew the orbit and omitted the single edge that IS the product. v3 draws
// it: an ember path leaving Learn, passing THROUGH the core (the brain), and
// re-entering at Discover. Two chords through the centre, which is literally the
// sentence above.
//
// THE THREE LAYERS are three orbital shells, distinguished by structure and
// weight rather than by colour. Marigold/blue/green are product-surface tokens
// and the standing brand ruling keeps blue out of every asset, so the layers are
// read here as architecture: inner director, middle lifecycle, outer brain.
//
// CRAFT. 3x supersample -> Lanczos3. Perspective foreshortening on every orbit.
// Back halves drawn before the core, front halves after, so the core eclipses
// the far side of its own rings. All light is mix-blend-mode:plus-lighter, which
// accumulates toward white-hot instead of averaging toward brown. All glows are
// radial gradients falling to zero alpha, never stacked discs. Fractal grain
// over everything so no wide gradient can band.

import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { homedir, tmpdir } from "node:os";
import sharp from "sharp";
import { C, markInner, SILVER, GRAPHITE, strokeFor } from "./mark.ts";

const REPO = join(import.meta.dir, "..", "..", "..");
const FONTS = join(REPO, "public", "fonts", "geist");
const OUT = join(import.meta.dir, "social");
mkdirSync(OUT, { recursive: true });
const SS = 3;

// Two grounds, one instrument.
//
// DARK is the night observatory: void ground, brass orbits, the core as emitter.
// LIGHT is the older object — an ENGRAVED ASTRONOMICAL PLATE. Warm paper, sepia
// copperplate linework, one lit ember reading. That register (Kepler diagrams,
// antique star charts, watch-movement drawings) reads as centuries of precision,
// which is the "accumulated judgement" story, and it is unclaimed in AI because
// everyone defaulted to dark cosmic.
//
// P is mutated by setGround() before each render rather than threaded through
// every function, because rendering is strictly sequential here and the diff for
// full theming would be larger than the feature deserves.
// PLATINUM, not brass. Founder ruling 2026-08-05: the feeling to hit is
// "premium, platinum, elite". Warm brass linework reads as an ANTIQUE
// instrument and drifts toward steampunk; cool platinum reads as modern
// precision engineering, which is the elite register.
//
// The structure is therefore cold and the heart is hot: platinum orbits, ember
// and gold only at the core and the two lit stations. That tension is more
// luxurious than an all-warm frame, and it keeps the founder's standing rule
// that colour must carry status rather than decorate.
const DARK = {
  ground: "#050507",
  brass: "#A8AEB8",        // platinum hairline. Name kept so callers stay stable.
  ember: C.ember,
  emberHi: C.emberHi,
  gold: C.gold,
  bone: "#F5F4F2",
  slate: "#8A8B90",
  markTone: "dark" as "dark" | "light",
  lift: "rgba(150,170,210,.055)",
  scrim: "5,5,7",
  grain: 0.17,
};

const LIGHT = {
  ground: "#F7F4EE",       // warm bone, the paper
  brass: "#9A8256",        // copperplate engraving, darker so it holds on paper
  ember: C.ember,
  emberHi: "#FF9A5C",
  gold: "#B8862F",
  bone: "#14120F",         // "bone" is the type colour; on paper it is near-black
  slate: "#6B655C",
  markTone: "light" as "dark" | "light",
  lift: "rgba(20,18,15,.05)",
  scrim: "247,244,238",
  grain: 0.13,
};

const P = { ...DARK };
export function setGround(g: "dark" | "light") { Object.assign(P, g === "dark" ? DARK : LIGHT); }

function findChrome(): string {
  const c = [
    ...["1228", "1223"].map((v) => join(homedir(), "Library/Caches/ms-playwright",
      `chromium_headless_shell-${v}`, "chrome-headless-shell-mac-arm64/chrome-headless-shell")),
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ];
  for (const p of c) if (existsSync(p)) return p;
  throw new Error("No headless Chromium found.");
}
const CHROME = findChrome();

let n = 0;
async function render(html: string, w: number, h: number, outFile: string) {
  const scratch = join(tmpdir(), `sp-o3-${process.pid}-${n++}`);
  mkdirSync(scratch, { recursive: true });
  writeFileSync(join(scratch, "page.html"), html);
  try {
    execFileSync(CHROME, ["--headless", "--disable-gpu", "--hide-scrollbars",
      `--force-device-scale-factor=${SS}`, "--allow-file-access-from-files",
      "--font-render-hinting=none", "--disable-lcd-text",
      `--screenshot=${join(scratch, "shot.png")}`,
      `--window-size=${w},${h}`, `file://${join(scratch, "page.html")}`], { stdio: "pipe" });
    const shot = join(scratch, "shot.png");
    const m = await sharp(shot).metadata();
    if (m.width !== w * SS || m.height !== h * SS)
      throw new Error(`${outFile}: got ${m.width}x${m.height}, want ${w * SS}x${h * SS}`);
    await sharp(shot).resize(w, h, { kernel: "lanczos3", fit: "fill" })
      .png({ compressionLevel: 9, palette: false, effort: 10 }).toFile(outFile);
    console.log(`  ${outFile.split("/").pop()!.padEnd(34)} ${w}x${h}  ${(readFileSync(outFile).length / 1024).toFixed(0)}KB`);
  } finally { rmSync(scratch, { recursive: true, force: true }); }
}

const ff = (f: string, file: string, w = "400") =>
  `@font-face{font-family:"${f}";src:url("file://${join(FONTS, file)}") format("woff2${file.includes("Variable") ? "-variations" : ""}");font-weight:${w};font-display:block}`;
const FONTS_CSS = [
  ff("Geist", "Geist-Variable.woff2", "100 900"),
  ff("Geist Mono", "GeistMono-Variable.woff2", "100 900"),
  ff("Geist Pixel Square", "GeistPixel-Square.woff2"),
].join("");

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------
const STATIONS = ["Discover", "Decide", "Plan", "Design", "Build", "Ship", "Learn"];

type Orr = {
  cx: number; cy: number; k: number;
  /** [director, lifecycle, brain] + optional depth rings beyond */
  shells: number[];
  stationR: number;
  nodeR: number;
  id: string;
};

const ang = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / 7;
const px = (o: Orr, r: number, t: number) => o.cx + r * Math.cos(t);
const py = (o: Orr, r: number, t: number) => o.cy + r * o.k * Math.sin(t);

function arc(o: Orr, r: number, from: number, to: number) {
  let d = "";
  for (let i = 0; i <= 170; i++) {
    const t = from + ((to - from) * i) / 170;
    d += `${i === 0 ? "M" : "L"}${px(o, r, t).toFixed(2)} ${py(o, r, t).toFixed(2)} `;
  }
  return d.trim();
}

function defs(o: Orr) {
  const outer = o.shells[o.shells.length - 1];
  return `<defs>
    <radialGradient id="fall${o.id}" cx="${o.cx}" cy="${o.cy}" r="${outer}" gradientUnits="userSpaceOnUse">
      <stop offset="0%"   stop-color="${P.brass}" stop-opacity="1"/>
      <stop offset="42%"  stop-color="${P.brass}" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="${P.brass}" stop-opacity="0.14"/>
    </radialGradient>
    <radialGradient id="halo${o.id}">
      <stop offset="0%"   stop-color="${P.ember}" stop-opacity="0.6"/>
      <stop offset="24%"  stop-color="${P.ember}" stop-opacity="0.22"/>
      <stop offset="58%"  stop-color="${P.ember}" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="${P.ember}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="ret${o.id}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="${P.ember}" stop-opacity="0.95"/>
      <stop offset="50%"  stop-color="${P.emberHi}" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="${P.gold}" stop-opacity="0.55"/>
    </linearGradient>
  </defs>`;
}

/** Back halves + the far-side nodes. Drawn BEFORE the core. */
function back(o: Orr) {
  const rings = o.shells.map((r, i) => {
    const structural = i < 3; // the three layers read heavier than depth rings
    return `<path d="${arc(o, r, Math.PI, Math.PI * 2)}" fill="none" stroke="url(#fall${o.id})"
      stroke-width="${structural ? 1.2 : 0.8}" opacity="${(structural ? 0.34 - i * 0.05 : 0.14).toFixed(3)}"/>`;
  }).join("");
  const nodes = STATIONS.map((_, i) => {
    const t = ang(i);
    if (Math.sin(t) >= 0) return "";
    return `<circle cx="${px(o, o.stationR, t).toFixed(1)}" cy="${py(o, o.stationR, t).toFixed(1)}"
      r="${(o.nodeR * 0.72).toFixed(2)}" fill="${P.brass}" opacity="0.42"/>`;
  }).join("");
  return `${defs(o)}${rings}${nodes}`;
}

/**
 * THE RETURN PATH — the product, drawn.
 *
 * Two quadratic chords: Learn -> core, then core -> Discover. The control points
 * are pulled perpendicular to each chord so the pair reads as one continuous
 * swept curve through the centre rather than as a hard V. Flow beads ride the
 * path at decreasing alpha to give it direction without an arrowhead, which at
 * banner scale always looks like clip art.
 */
function returnPath(o: Orr) {
  const tL = ang(6), tD = ang(0);
  const lx = px(o, o.stationR, tL), ly = py(o, o.stationR, tL);
  const dx = px(o, o.stationR, tD), dy = py(o, o.stationR, tD);

  const bend = o.stationR * 0.42;
  const c1x = (lx + o.cx) / 2 - bend * 0.5, c1y = (ly + o.cy) / 2 + bend * 0.28 * o.k;
  const c2x = (o.cx + dx) / 2 + bend * 0.5, c2y = (o.cy + dy) / 2 + bend * 0.28 * o.k;

  const d = `M${lx.toFixed(1)} ${ly.toFixed(1)} Q${c1x.toFixed(1)} ${c1y.toFixed(1)} ${o.cx} ${o.cy}
             Q${c2x.toFixed(1)} ${c2y.toFixed(1)} ${dx.toFixed(1)} ${dy.toFixed(1)}`;

  const bead = (t: number, r: number, a: number) => {
    // sample the composite curve at parameter t in [0,1]
    const q = (p0: number[], c: number[], p1: number[], s: number) =>
      [(1 - s) ** 2 * p0[0] + 2 * (1 - s) * s * c[0] + s ** 2 * p1[0],
       (1 - s) ** 2 * p0[1] + 2 * (1 - s) * s * c[1] + s ** 2 * p1[1]];
    const pt = t < 0.5
      ? q([lx, ly], [c1x, c1y], [o.cx, o.cy], t * 2)
      : q([o.cx, o.cy], [c2x, c2y], [dx, dy], (t - 0.5) * 2);
    return `<circle cx="${pt[0].toFixed(1)}" cy="${pt[1].toFixed(1)}" r="${r}" fill="${P.emberHi}" opacity="${a}"/>`;
  };

  return `
    <path d="${d}" fill="none" stroke="url(#ret${o.id})" stroke-width="${(o.nodeR * 0.42).toFixed(2)}"
      stroke-linecap="round" opacity="0.30" filter="none"/>
    <path d="${d}" fill="none" stroke="url(#ret${o.id})" stroke-width="${(o.nodeR * 0.2).toFixed(2)}"
      stroke-linecap="round" opacity="0.95"/>
    ${bead(0.14, o.nodeR * 0.3, 0.9)}${bead(0.3, o.nodeR * 0.24, 0.62)}
    ${bead(0.72, o.nodeR * 0.26, 0.72)}${bead(0.88, o.nodeR * 0.32, 0.95)}`;
}

/** Front halves, near-side nodes, the two lit endpoints. Drawn AFTER the core. */
function front(o: Orr) {
  const rings = o.shells.map((r, i) => {
    const structural = i < 3;
    return `<path d="${arc(o, r, 0, Math.PI)}" fill="none" stroke="url(#fall${o.id})"
      stroke-width="${structural ? 1.35 : 0.9}" opacity="${(structural ? 0.5 - i * 0.07 : 0.2).toFixed(3)}"/>`;
  }).join("");

  const nodes = STATIONS.map((_, i) => {
    if (i === 6 || i === 0) return "";
    const t = ang(i);
    if (Math.sin(t) < 0) return "";
    const depth = 0.74 + 0.4 * ((Math.sin(t) + 1) / 2);
    return `<circle cx="${px(o, o.stationR, t).toFixed(1)}" cy="${py(o, o.stationR, t).toFixed(1)}"
      r="${(o.nodeR * depth).toFixed(2)}" fill="${P.brass}" opacity="${(0.5 + 0.3 * depth).toFixed(2)}"/>`;
  }).join("");

  const lit = (i: number, scale: number) => {
    const t = ang(i), x = px(o, o.stationR, t), y = py(o, o.stationR, t);
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(o.nodeR * 6.4 * scale).toFixed(1)}" fill="url(#halo${o.id})"/>
      <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(o.nodeR * 1.32 * scale).toFixed(1)}" fill="${P.ember}"/>
      <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(o.nodeR * 0.48 * scale).toFixed(1)}" fill="${P.emberHi}"/>`;
  };

  return `${rings}${nodes}${returnPath(o)}${lit(6, 1)}${lit(0, 0.86)}`;
}

function markEl(size: number, id: string, tone?: "dark" | "light") {
  const t = tone ?? P.markTone;
  return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" fill="none" style="display:block">${
    markInner({ spiral: t === "dark" ? SILVER : GRAPHITE, sw: strokeFor(size), coreGlow: true, idSuffix: id })}</svg>`;
}

/**
 * The core as an emitter.
 *
 * The two grounds need genuinely different physics, not an inverted palette.
 * On DARK, plus-lighter is correct: photons accumulate toward white-hot, which
 * is what stops a low-alpha orange from averaging into brown.
 *
 * On LIGHT that same blend does nothing, because paper is already near maximum
 * and adding light to white returns white. So the lit core has to work the way
 * ink works on a printed plate: `multiply`, laying warm pigment INTO the paper.
 * A glow on paper is not brighter than the paper, it is warmer than it.
 */
function coreLight(cx: number, cy: number, r: number, k: number) {
  const dark = P.markTone === "dark";
  const L = (rx: number, ry: number, col: string, a: number) =>
    `<div style="position:absolute;left:${cx - rx}px;top:${cy - ry}px;width:${rx * 2}px;height:${ry * 2}px;
       border-radius:50%;background:radial-gradient(closest-side, ${col} 0%, rgba(0,0,0,0) 100%);
       opacity:${a};mix-blend-mode:${dark ? "plus-lighter" : "multiply"};pointer-events:none"></div>`;
  return dark
    ? [
        L(r * 10, r * 10 * k * 0.6, "rgba(255,120,55,.22)", 0.62),
        L(r * 5.4, r * 5.4 * Math.max(k, 0.52), "rgba(255,107,44,.46)", 0.6),
        L(r * 2.5, r * 2.5, "rgba(255,145,72,.66)", 0.75),
        L(r * 1.1, r * 1.1, "rgba(255,212,162,.9)", 0.9),
      ].join("")
    : [
        L(r * 9, r * 9 * k * 0.62, "rgba(214,150,96,.30)", 0.5),
        L(r * 4.4, r * 4.4 * Math.max(k, 0.55), "rgba(255,140,70,.34)", 0.55),
        L(r * 1.9, r * 1.9, "rgba(255,107,44,.42)", 0.6),
      ].join("");
}

const GRAIN = (o: number) => `
  <svg width="0" height="0" style="position:absolute"><filter id="gr">
    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch"/>
    <feColorMatrix type="saturate" values="0"/></filter></svg>
  <div style="position:absolute;inset:0;filter:url(#gr);opacity:${o};mix-blend-mode:overlay;pointer-events:none"></div>`;

function page(w: number, h: number, body: string, ground = P.ground) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
${FONTS_CSS}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${w}px;height:${h}px;overflow:hidden}
body{background:${ground};font-family:"Geist",system-ui,sans-serif;
  -webkit-font-smoothing:antialiased;text-rendering:geometricPrecision;position:relative}
.mono{font-family:"Geist Mono",ui-monospace,monospace;text-transform:uppercase}
.pixel{font-family:"Geist Pixel Square",ui-monospace,monospace}
svg.layer{position:absolute;inset:0;pointer-events:none}
</style></head><body>${body}</body></html>`;
}

/** The whole machine, as one composable block. */
function machine(w: number, h: number, o: Orr, markPx: number, coreR: number) {
  return `
    <svg class="layer" viewBox="0 0 ${w} ${h}">${back(o)}</svg>
    ${coreLight(o.cx, o.cy, coreR, o.k)}
    <div style="position:absolute;left:${o.cx - markPx / 2}px;top:${o.cy - markPx / 2}px">${markEl(markPx, o.id)}</div>
    <svg class="layer" viewBox="0 0 ${w} ${h}">${front(o)}</svg>`;
}

/** A readout tag on a leader rule, anchored to a station node. */
function readout(o: Orr, i: number, label: string, side: "left" | "right", gap = 52, size = 9.5) {
  const t = ang(i), x = px(o, o.stationR, t), y = py(o, o.stationR, t);
  const isL = side === "left";
  return `<div style="position:absolute;${isL ? `left:${x - gap - 210}px` : `left:${x + gap}px`};
      top:${y}px;transform:translateY(-50%);width:210px;display:flex;align-items:center;
      justify-content:${isL ? "flex-end" : "flex-start"};gap:9px;${isL ? "" : "flex-direction:row-reverse;justify-content:flex-end"}">
      <span class="mono" style="font-size:${size}px;letter-spacing:.24em;color:${P.gold};opacity:.95;white-space:nowrap">${label}</span>
      <span style="flex:0 0 ${gap - 12}px;height:1px;background:linear-gradient(to ${isL ? "right" : "left"},transparent,${P.gold});opacity:.6"></span>
    </div>`;
}

export { P, STATIONS, ang, px, py, machine, readout, markEl, GRAIN, page, render, OUT, coreLight };
export type { Orr };
