/**
 * ── NO TWO JOURNEY STATES MAY RENDER IDENTICALLY ──────────────────────────
 *
 * Law 14 says a defect that exists only BETWEEN elements is invisible to every
 * gate that examines one element. This is that law applied to the one table
 * where it bites hardest: `Journey`'s paint map, which every road, row and
 * mark in the product reads.
 *
 * ── THE DEFECT IT WAS WRITTEN FROM ────────────────────────────────────────
 * Measured on the served home 2026-09-09, workspace A1 delete probe:
 *
 *   Decide   3 runs, all `the-call-is-yours`   state `you`
 *   Design   2 runs, both `going-in-circles`   state `stopped`
 *   both:    fill oklch(0.28 0.14 315) · ink oklch(0.74 0.11 315)
 *
 * Three runs waiting for an answer and two that gave up render the same pixel.
 *
 * ── AND EVERY CHANGE THAT CAUSED IT WAS CORRECT ───────────────────────────
 * `stopped` was moved onto the you-chip fill that same morning, on a measured
 * greyscale argument that correctly closed the `held`/`failed` pair. Good
 * reasoning, written down, right conclusion. It landed `stopped` on top of
 * `you`, and nobody looked, because nobody had touched `you`.
 *
 * **A review checks a change against its own reason. What no diff shows is the
 * state the change arrives AT.** That is what this reads: not whether a paint
 * is right, but whether any two of them have become the same thing.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SRC = readFileSync(join(import.meta.dir, "Journey.tsx"), "utf8");
/* Comments only. This file's own headers quote paint values while arguing
   about them, and reading those as paints would invent collisions. Strings
   are left alone: they ARE the values being compared. */
const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

/** Every `state: { ring, ink, fill, dashed? }` entry, as written. */
function paints(): Record<string, string> {
  const start = CODE.indexOf("working: { ring");
  expect(start, "the paint table moved; re-point this test").toBeGreaterThan(-1);
  const table = CODE.slice(start, CODE.indexOf("\n};", start));
  const out: Record<string, string> = {};
  for (const m of table.matchAll(/(\w+):\s*\{([^}]*)\}/g)) {
    const fields = [...m[2].matchAll(/(\w+):\s*("[^"]*"|\w+)/g)]
      .map(([, k, v]) => `${k}=${v}`)
      .sort()
      .join(" · ");
    out[m[1]] = fields;
  }
  return out;
}

/**
 * The one pair known to collide, and the contract entry that owns it.
 *
 * It is listed rather than fixed because every non-hue channel already has a
 * written owner — the glyph is the STATION's (law 4), the fill is spent, the
 * dashed ring is `waived`, weight says which station is current — so settling
 * it means TAKING a channel from another state, which reaches every lane's
 * surfaces. Law 19 carries the measurement and names the three candidates.
 *
 * **Removing a pair from here is the win.** Adding one needs a law beside it.
 */
const KNOWN_OPEN: ReadonlyArray<readonly [string, string]> = [["you", "stopped"]];

const key = (a: string, b: string) => [a, b].sort().join(" == ");
const allowed = new Set(KNOWN_OPEN.map(([a, b]) => key(a, b)));

describe("no two journey states render identically", () => {
  it("finds no collision that is not already filed in the contract", () => {
    const table = paints();
    const bySig: Record<string, string[]> = {};
    for (const [state, sig] of Object.entries(table)) (bySig[sig] ??= []).push(state);

    const collisions = Object.values(bySig)
      .filter((names) => names.length > 1)
      .flatMap((names) => names.flatMap((a, i) => names.slice(i + 1).map((b) => key(a, b))))
      .filter((k) => !allowed.has(k));

    expect(
      collisions,
      "two states now look the same. Either give one a channel, or file the pair in DESIGN-SYSTEM.md and add it to KNOWN_OPEN with its reason.",
    ).toEqual([]);
  });

  it("still reads a table with something in it", () => {
    /*
     * THE MIRROR. Every assertion above is satisfied by finding nothing, so a
     * regex that silently stopped matching would report a clean bill of health
     * on a table full of collisions. This is the assertion that fails when the
     * MEASUREMENT breaks rather than the code.
     */
    const table = paints();
    expect(Object.keys(table).length).toBeGreaterThanOrEqual(8);
    for (const state of ["working", "you", "stopped", "held", "waiting"]) {
      expect({ state, painted: state in table }).toEqual({ state, painted: true });
    }
  });

  it("keeps the known pair honest: it must still actually collide", () => {
    /*
     * If somebody settles `you` / `stopped`, this fails and the entry has to
     * come out of KNOWN_OPEN. A stale allow-list is how a guard quietly stops
     * guarding: the debt is paid and the exemption outlives it.
     */
    const table = paints();
    for (const [a, b] of KNOWN_OPEN) {
      expect(
        { pair: `${a}/${b}`, same: table[a] === table[b] },
        "this pair no longer collides; remove it from KNOWN_OPEN and from law 19",
      ).toEqual({ pair: `${a}/${b}`, same: true });
    }
  });
});
