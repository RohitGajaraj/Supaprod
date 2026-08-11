// EMPHASIS TREATMENTS — one approved line, three ways of spotlighting it.
//
// Copy is RATIFIED (founder, 2026-08-05) and does not move here:
//
//   Agents that own outcomes.
//   Not just output.
//   For product managers who ship with agents
//
// The brief is to spotlight `Agents`, `outcomes` and `product teams`. The trap
// is that three equal spotlights are no spotlight, so each level gets a
// DIFFERENT mechanism and they are ordered deliberately:
//
//   outcomes       the hero. Heaviest, brightest, and the only word carrying an
//                  accent. It is the payoff and the moat in one word.
//   Agents         the subject. Advanced by WEIGHT, not by colour or accent.
//   product teams  who it is for. Advanced by COLOUR only, in the subline.
//   output         pushed furthest back. It is the thing we are not.
//   the glue       "that own", "Not just", "for" recede hardest. Dimming the
//                  connectives makes every noun advance without spending any
//                  weight, which is the cheapest contrast in typography.
//
//   bun docs/growth/branding/emphasis-treatments.ts

import { join } from "node:path";
import { mkdirSync } from "node:fs";
import { P, machine, markEl, GRAIN, page, render, setGround } from "./orrery.ts";
import type { Orr } from "./orrery.ts";

const OUT = join(import.meta.dir, "messaging-options");
mkdirSync(OUT, { recursive: true });

type Treatment = { key: string; name: string; note: string; hook: () => string; sub: () => string };

/** Connective glue. Recedes hardest so the nouns advance for free. */
const glue = (t: string) => `<span style="color:#5E6068;font-weight:300">${t}</span>`;

const TREATMENTS: Treatment[] = [
  {
    key: "H1",
    name: "WEIGHT GRADIENT",
    note: "Purely typographic. No colour beyond bone and slate. Most restrained.",
    hook: () => `
      <span style="font-weight:500">Agents</span> ${glue("that own")}
      <span style="font-weight:650">outcomes</span>.<br>
      ${glue("Not just")} <span style="color:#5A5C63;font-weight:300">output</span>.`,
    sub: () => `${glue("The")} <span style="color:${P.bone};opacity:.72">agentic-first</span>
      ${glue("operating system for")} <span style="color:${P.bone};font-weight:500">product teams</span>`,
  },
  {
    key: "H2",
    name: "EMBER RULE",
    note: "Same gradient, plus one ember rule under the hero word. One accent, one word.",
    hook: () => `
      <span style="font-weight:500">Agents</span> ${glue("that own")}
      <span style="font-weight:650;background-image:linear-gradient(${P.ember},${P.ember});
        background-size:100% 3px;background-repeat:no-repeat;background-position:0 100%;
        padding-bottom:6px">outcomes</span>.<br>
      ${glue("Not just")} <span style="color:#5A5C63;font-weight:300">output</span>.`,
    sub: () => `${glue("The")} <span style="color:${P.bone};opacity:.72">agentic-first</span>
      ${glue("operating system for")} <span style="color:${P.bone};font-weight:500">product teams</span>`,
  },
  {
    key: "H3",
    name: "LIT WORD",
    note: "The hero word is LIT, echoing the one lit station in the orrery. Type and diagram share a language.",
    // The orrery's whole grammar is that exactly one thing glows. Giving the
    // hero word the same treatment makes the headline and the instrument argue
    // in the same voice rather than sitting next to each other.
    hook: () => `
      <span style="font-weight:500">Agents</span> ${glue("that own")}
      <span style="font-weight:650;color:#FFF6EF;
        text-shadow:0 0 22px rgba(255,107,44,.55), 0 0 46px rgba(255,107,44,.28)">outcomes</span>.<br>
      ${glue("Not just")} <span style="color:#5A5C63;font-weight:300">output</span>.`,
    sub: () => `${glue("The")} <span style="color:${P.bone};opacity:.72">agentic-first</span>
      ${glue("operating system for")} <span style="color:${P.bone};font-weight:500">product teams</span>`,
  },
];

function lockup(markPx: number, textPx: number, id: string) {
  return `<div style="display:flex;align-items:center;gap:${(markPx * 0.32).toFixed(0)}px">
    ${markEl(markPx, id)}
    <span class="pixel" style="font-size:${textPx}px;color:${P.bone};line-height:1">Supaprod</span>
  </div>`;
}

function banner(t: Treatment, w: number, h: number, id: string) {
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
      <div style="margin-top:${28 * s}px;font-size:${55 * s}px;line-height:1.14;font-weight:400;
          letter-spacing:-.04em;color:${P.bone}">${t.hook()}</div>
      <div style="margin-top:${26 * s}px;display:flex;align-items:center;gap:${13 * s}px">
        <span style="width:${24 * s}px;height:1px;background:${P.ember};opacity:.85"></span>
        <span style="font-size:${17 * s}px;color:${P.slate};letter-spacing:-.004em">${t.sub()}</span>
      </div>
    </div>
  `,
  );
}

function card(t: Treatment, w: number, h: number, id: string) {
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
      <div style="font-size:${48 * s}px;line-height:1.16;font-weight:400;letter-spacing:-.042em;
          color:${P.bone}">${t.hook().replace("<br>", " ")}</div>
      <div style="margin-top:${22 * s}px;display:flex;align-items:center;justify-content:center;gap:${13 * s}px">
        <span style="width:${22 * s}px;height:1px;background:${P.ember};opacity:.85"></span>
        <span style="font-size:${18 * s}px;color:${P.slate}">${t.sub()}</span>
      </div>
    </div>
  `,
  );
}

setGround("dark");
console.log("EMPHASIS TREATMENTS — approved copy, three spotlight systems\n");
for (const t of TREATMENTS) {
  console.log(`  ${t.key}  ${t.name} — ${t.note}`);
  await render(
    banner(t, 1500, 500, `b${t.key}`),
    1500,
    500,
    join(OUT, `emph-${t.key}-x-header-1500x500.png`),
  );
  await render(
    card(t, 1200, 630, `c${t.key}`),
    1200,
    630,
    join(OUT, `emph-${t.key}-og-1200x630.png`),
  );
}
console.log(`\n→ ${OUT}`);
