// MESSAGING VARIANTS — three headline strategies, same ORRERY visual.
//
// Written to `messaging-options/` so NOTHING in `social/` is touched: the
// founder asked to compare against the shipped set, not to replace it.
//
// WHY A NEW ROUND. The shipped line is "Agents that run product. Not just code."
// It positions against CODING AGENTS, which is a competitive jab, and it never
// says the thing that matters most: Supaprod tells you what to build. Canon is
// unambiguous about the full arc --
//
//   "It tells you what to build, builds it, ships it, checks what actually
//    happened, and learns from it, so next time it guides the call INSTEAD OF
//    WAITING TO BE ASKED."
//
// The shipped headline captures the middle of that sentence and drops both ends.
// All three variants below lead with "tells you what to build" and carry the arc
// through to "learns, then guides".
//
//   bun docs/growth/branding/messaging-variants.ts

import { join } from "node:path";
import { P, machine, markEl, GRAIN, page, render, setGround } from "./orrery.ts";
import type { Orr } from "./orrery.ts";
import { mkdirSync } from "node:fs";

const OUT = join(import.meta.dir, "messaging-options");
mkdirSync(OUT, { recursive: true });

const CATEGORY = "For product managers who ship with agents";

/** Emphasis helpers. The USP words carry the argument, so they carry the weight. */
const hi = (t: string) => `<span style="font-weight:600;color:${P.bone}">${t}</span>`;
const lo = (t: string) => `<span style="color:${P.slate};font-weight:400">${t}</span>`;

type Variant = {
  key: string;
  name: string;
  /** two-line hook. SHORT. See the length rule below. */
  hook: () => string;
  /** one line that carries whatever the hook had to drop */
  sub?: string;
  /** the three-beat mechanism, or null to leave it off */
  beats: [string, string][] | null;
  note: string;
};

// THE LENGTH RULE, set by the founder 2026-08-05.
//
// "Agents that run product. Not just code." was the right LENGTH and the wrong
// impact. Round two overcorrected: leading with the full canon arc produced
// headlines of 55 to 65 characters, and a line that long can only ever be set
// small and read slowly.
//
// So: the hook stays at or under ~42 characters across two short lines, and
// anything it cannot carry moves to a single subline. The category line is
// ratified as-is and appears on every asset.
//
// What makes a SHORT line impactful is a turn, not more words. "Tells you what
// to build" reads as an analytics product and the reader files it; "Then builds
// it" breaks that frame. The double-take does the work length cannot. The
// shipped line had no turn: it stated one idea twice.

const VARIANTS: Variant[] = [
  // THE FRAME IS RATIFIED, ONLY THE CONTRAST MOVES.
  //
  // Founder 2026-08-05: "Agents that run product. Not just code." works because
  // of its SHAPE -- the word agents is present, "product" is spotlit, "code" is
  // pushed back, and the contrast says we own this and they only own that. Short,
  // verb-led, two beats.
  //
  // Its weakness was never the form. It was that the contrast is about SCOPE
  // (product vs code) when the strongest claim in the canon is about AUTHORITY:
  // it tells you what to build instead of waiting to be asked. These three keep
  // the frame character-for-character and move the contrast onto that claim.
  //
  // Subline on all three is the ratified category line and nothing else.
  {
    key: "G",
    name: "DECIDE / HOW",
    // 46 chars. Every rival agent decides HOW. None decides WHAT. That is the
    // whole product in one contrast, and it is the founder's own emphasis.
    hook: () => `Agents that decide ${hi("what")} to build.<br>Not just ${lo("how")}.`,
    beats: null,
    note: "46 chars. Rivals decide HOW. Only this decides WHAT.",
  },
  {
    key: "H",
    name: "OUTCOMES / OUTPUT",
    // 41 chars. The sharpest word pair available: output is what you shipped,
    // outcome is whether it worked. Owning the second is the moat, and the near
    // rhyme makes the line stick.
    hook: () => `Agents that own ${hi("outcomes")}.<br>Not just ${lo("output")}.`,
    beats: null,
    note: "41 chars. Output is what shipped. Outcome is whether it worked.",
  },
  {
    key: "I",
    name: "LEAD / SHIP",
    // 44 chars. Closest to the shipped line, and the smallest possible edit that
    // buys authority: leading a product means choosing its direction, where
    // running one only means keeping it moving.
    hook: () => `Agents that ${hi("lead")} product.<br>Not just ${lo("ship code")}.`,
    beats: null,
    note: "44 chars. Smallest edit from the shipped line. Lead implies choosing.",
  },
];

/**
 * Hook size, derived from the longest line rather than hand-set.
 *
 * The ratified frame is TWO beats. A hook that wraps to a third line has broken
 * the frame no matter how good the words are, which is exactly what happened to
 * variant G at a fixed 56px. Geist at weight 400 with -0.04em tracking runs
 * about 0.47em per character, so the size that still fits is width / (0.47 * n).
 * A hook whose longest line runs past ~28 characters simply cannot hold display
 * size in this frame; that is a copy constraint, not a rendering one.
 */
function hookSize(hook: string, boxPx: number, max: number) {
  const longest = Math.max(
    ...hook
      .replace(/<[^>]+>/g, "")
      .split("<br>")
      .map((l) => l.trim().length),
  );
  return Math.min(max, Math.floor(boxPx / (0.47 * longest)));
}

function lockup(markPx: number, textPx: number, id: string) {
  return `<div style="display:flex;align-items:center;gap:${(markPx * 0.32).toFixed(0)}px">
    ${markEl(markPx, id)}
    <span class="pixel" style="font-size:${textPx}px;color:${P.bone};line-height:1">Supaprod</span>
  </div>`;
}

function beatsBlock(bs: [string, string][], size: number, gap: number) {
  return `<div style="display:flex;flex-direction:column;gap:${gap}px">${bs
    .map(
      ([n, t]) => `<div style="display:flex;align-items:baseline;gap:${size * 0.9}px">
        <span class="mono" style="font-size:${(size * 0.72).toFixed(1)}px;letter-spacing:.16em;
          color:${P.brass};opacity:.9;min-width:${size * 1.5}px">${n}</span>
        <span style="font-size:${size}px;color:${P.slate}">${t}</span></div>`,
    )
    .join("")}</div>`;
}

// Banner: text lifted to clear the avatar circle (centred on 0.35 x height).
function banner(v: Variant, w: number, h: number, id: string) {
  const s = h / 500;
  const o: Orr = {
    cx: w - 380 * s,
    cy: h * 0.5,
    k: 0.38,
    shells: [128 * s, 228 * s, 350 * s, 470 * s, 600 * s],
    stationR: 228 * s,
    nodeR: 4.8 * s,
    id,
  };
  return page(
    w,
    h,
    `
    <div style="position:absolute;inset:0;background:
      radial-gradient(85% 130% at 14% 2%, ${P.lift} 0%, transparent 56%)"></div>
    ${machine(w, h, o, 104 * s, 19 * s, { r: 268 * s, size: 10.5 * s })}
    ${GRAIN(P.grain)}
    <div style="position:absolute;left:${92 * s}px;top:${(h * 0.35).toFixed(0)}px;
        transform:translateY(-50%);width:${700 * s}px">
      ${lockup(28 * s, 21 * s, id + "lk")}
      <div style="margin-top:${26 * s}px;font-size:${hookSize(v.hook(), 700 * s, 56 * s)}px;line-height:1.05;font-weight:400;
          letter-spacing:-.04em;color:${P.bone}">${v.hook()}</div>
      ${
        v.sub
          ? `<div style="margin-top:${18 * s}px;font-size:${18 * s}px;color:${P.slate};
          letter-spacing:-.006em;line-height:1.45">${v.sub}</div>`
          : ""
      }
      <div style="margin-top:${22 * s}px;display:flex;align-items:center;gap:${13 * s}px">
        <span style="width:${24 * s}px;height:1px;background:${P.ember};opacity:.85"></span>
        <span style="font-size:${16 * s}px;color:${P.slate};opacity:.85">${CATEGORY}</span>
      </div>
      ${v.beats ? `<div style="margin-top:${20 * s}px">${beatsBlock(v.beats, 13.5 * s, 8 * s)}</div>` : ""}
    </div>
  `,
  );
}

function card(v: Variant, w: number, h: number, id: string) {
  const s = Math.min(w, h) / 630;
  const o: Orr = {
    cx: w / 2,
    cy: h * 0.38,
    k: 0.36,
    shells: [116 * s, 200 * s, 300 * s, 408 * s, 530 * s],
    stationR: 200 * s,
    nodeR: 4.8 * s,
    id,
  };
  const flat = v.hook().replace("<br>", " ");
  return page(
    w,
    h,
    `
    <div style="position:absolute;inset:0;background:
      radial-gradient(90% 90% at 50% 0%, ${P.lift} 0%, transparent 55%)"></div>
    ${machine(w, h, o, 106 * s, 19 * s, { r: 250 * s, size: 11 * s })}
    ${GRAIN(P.grain)}
    <div style="position:absolute;left:${44 * s}px;top:${40 * s}px">${lockup(28 * s, 21 * s, id + "lk")}</div>
    <div style="position:absolute;left:0;right:0;bottom:${56 * s}px;text-align:center;padding:0 ${56 * s}px">
      <div style="font-size:${hookSize(flat, w - 130 * s, 50 * s)}px;line-height:1.1;font-weight:400;letter-spacing:-.042em;color:${P.bone}">${flat}</div>
      ${v.sub ? `<div style="margin-top:${16 * s}px;font-size:${18.5 * s}px;color:${P.slate}">${v.sub}</div>` : ""}
      <div style="margin-top:${18 * s}px;display:flex;align-items:center;justify-content:center;gap:${13 * s}px">
        <span style="width:${22 * s}px;height:1px;background:${P.ember};opacity:.85"></span>
        <span style="font-size:${17 * s}px;color:${P.slate}">${CATEGORY}</span>
      </div>
    </div>
  `,
  );
}

setGround("dark");
console.log("MESSAGING VARIANTS — same visual, three headline strategies\n");
for (const v of VARIANTS) {
  console.log(`  ${v.key}  ${v.name} — ${v.note}`);
  await render(
    banner(v, 1500, 500, `b${v.key}`),
    1500,
    500,
    join(OUT, `msg-${v.key}-x-header-1500x500.png`),
  );
  await render(
    card(v, 1200, 630, `c${v.key}`),
    1200,
    630,
    join(OUT, `msg-${v.key}-og-1200x630.png`),
  );
}
console.log(`\n→ ${OUT}`);
