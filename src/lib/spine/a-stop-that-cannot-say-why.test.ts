/**
 * F-127: THE DRIVER COMPUTED THE REASON A RUN STOPPED, AND THREW IT AWAY.
 *
 * `driver.server.ts` sets `last_hold` to a coarse KIND — `given-up`,
 * `tools-refused`, `station-cannot-finish`, `going-in-circles`. The comment
 * above that write already describes the gap without naming it as one:
 *
 *   *"The persisted `last_hold` is the coarse shape so the surface that lists
 *   work can render a sentence; the specific one, naming both stations and the
 *   missing thing, is the line returned here and it is what the tick's own
 *   record of the sweep carries."*
 *
 * So the reason exists. It is returned, it lands in a job record, and it never
 * reaches the track. A person opening the work an hour later reads *"Nothing
 * more will be tried here on its own"* and has no route to the sentence that
 * would tell them what to do about it.
 *
 * ── MEASURED, AND IT COST THIS SESSION AN EVENING ──────────────────────────
 * `a30238f5` sat at `ship` on `given-up`. Finding out why meant joining
 * `agent_runs` and reading a seat's output, where the answer was *"the spec
 * requires <=5% abandonment ... Shipping cannot proceed until the success metric
 * is met"* — a deadlock in the loop rather than a fact about the work (F-115).
 * **None of that was reachable from the screen the product tells people to
 * watch**, and R-18's acceptance is precisely that a person can watch it happen.
 *
 * ── THE TYPECHECKER CAUGHT A DESIGN ERROR, NOT A SYNTAX ONE ────────────────
 * My first version also wrote the column on the seat-decision branch. It refused
 * to compile, and it was right to: that branch's line is `HOLD_LINE[hold]`, a
 * static map from kind to sentence, which `holdLine()` already derives on read.
 * Storing it would duplicate that while LOOKING like a specific reason in the
 * one column whose purpose is carrying one. **A generic sentence there is worse
 * than a null**, because null reads as "no more was said" and a generic line
 * does not.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");

/** Comments stripped: this file's own header quotes the shapes being asserted. */
const code = (src: string) =>
  src
    .split("\n")
    .filter((l) => {
      const t = l.trim();
      return !t.startsWith("*") && !t.startsWith("//") && !t.startsWith("/*");
    })
    .join("\n");

const DRIVER = code(read("./driver.server.ts"));
const TRACKS = code(read("./track.functions.ts"));
const CORRECTION = code(read("./correction.server.ts"));

describe("the sentence is stored where a surface can read it", () => {
  it("the correction stop writes the driver's own words", () => {
    expect(DRIVER).toContain("last_hold_because: decision.because");
  });

  it("verbatim, never re-derived", () => {
    // Two derivations of one sentence is two sentences. The screen and the
    // record must not be able to disagree about why something stopped.
    expect(DRIVER).not.toContain("last_hold_because: `");
    expect(DRIVER).not.toContain("last_hold_because: holdLine");
  });

  it("and the generic branch deliberately writes nothing", () => {
    // See the header: HOLD_LINE[hold] is what holdLine() already derives on read.
    const seatStop = DRIVER.slice(DRIVER.indexOf("last_hold: decision.hold"));
    expect(seatStop.slice(0, 200)).not.toContain("last_hold_because");
  });
});

describe("THE INVARIANT: a released track never keeps a stale reason", () => {
  /*
   * The half most likely to be missed, and this file already records the
   * previous instance of it at :521 — "`last_hold` was not cleared, so the row
   * went on rendering the PREVIOUS reason". A stale reason reads as a current
   * one, and it would read as a specific current one, which is worse.
   *
   * Nine places clear a hold across three files. Checked as a PROPERTY rather
   * than nine assertions, so a tenth added tomorrow is covered the day it lands.
   */
  const CLEARS = /last_hold: null,\s*\n\s*last_hold_because: null,/g;

  it.each([
    ["driver.server.ts", DRIVER],
    ["track.functions.ts", TRACKS],
    ["correction.server.ts", CORRECTION],
  ])("every hold cleared in %s clears its reason too", (_name, src) => {
    const holds = (src.match(/last_hold: null,/g) ?? []).length;
    const paired = (src.match(CLEARS) ?? []).length;
    expect(holds, "expected this file to clear at least one hold").toBeGreaterThan(0);
    expect(paired).toBe(holds);
  });

  it("and there are nine of them, so the count is not silently shrinking", () => {
    const total = [DRIVER, TRACKS, CORRECTION].reduce(
      (n, src) => n + (src.match(/last_hold: null,/g) ?? []).length,
      0,
    );
    expect(total).toBe(9);
  });
});

describe("the Track a surface receives carries it", () => {
  it("the column is selected", () => {
    expect(TRACKS).toContain("last_hold,last_hold_because,driven_at");
  });

  it("mapped onto a named field rather than left as a row column", () => {
    expect(TRACKS).toContain("holdBecause: r.last_hold_because ?? null");
  });

  it("beside holdReason, not instead of it", () => {
    // The coarse kind is what a LIST needs; the sentence is what a person needs
    // before they can act. They answer different questions and both are kept.
    expect(TRACKS).toContain("holdReason: r.last_hold,");
  });
});
