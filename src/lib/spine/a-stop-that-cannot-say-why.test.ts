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

  it("and never the sentence the reader already derives", () => {
    /*
     * MY FIRST VERSION OF THIS TEST WAS WRONG AND FAILED HONESTLY, which is the
     * useful kind. It asserted `not.toContain("last_hold_because: \`")` — no
     * template literal at all — and the tools-refused write legitimately
     * composes one from two facts the driver holds.
     *
     * The property I actually meant is narrower: the STORED value must never be
     * `holdLine(...)`, because that is derived from `last_hold` when the row is
     * read. Storing it too would put the same sentence on screen twice, and the
     * two copies could then disagree.
     *
     * Checked per assignment rather than per file, so a `holdLine` appearing
     * legitimately in the RETURNED line a few lines below cannot satisfy or
     * break it.
     */
    const assignments = [...DRIVER.matchAll(/last_hold_because:\s*([^\n]+)/g)].map((m) => m[1]!);
    expect(assignments.length, "expected the column to be written somewhere").toBeGreaterThan(0);
    for (const a of assignments) {
      expect(a, `derived sentence stored: ${a}`).not.toContain("holdLine");
      expect(a, `derived sentence stored: ${a}`).not.toContain("HOLD_LINE");
    }
  });

  it("a refused tool carries what the tool actually said", () => {
    /*
     * The instance that matters most. S4 measured the real merge failures across
     * the product's life: eight, of which FIVE are "GitHub merge 405: Pull
     * Request has merge conflicts". A conflict is not something a deploy or a
     * prompt fixes, and under F-75 auto-merge the loop meets it again with no
     * person in the run. Without this the track says only "this station could
     * not use a tool it needed".
     */
    /* The tool's own FACT, and not its instruction: "Only a merged changeset
       can promote. Merge the PR first." stores the first sentence, because the
       second tells a seat what to do and a person reads this column
       (self-check-words.ts). */
    expect(DRIVER).toContain(
      "last_hold_because: `It was ${refusal.tool}, which said: ${splitInstruction(refusal.error).why ?? refusal.error}`",
    );
  });

  it("and it stores the specific half only, not the derived prefix", () => {
    /*
     * My first attempt sliced 400 characters after the write and asserted no
     * `holdLine(` in them, which reached past the update and into the RETURNED
     * line, where `holdLine` belongs. A guard whose window is wrong fails on
     * correct code, and the fix for that is a narrower window, never a weaker
     * assertion: the update object itself, and nothing after it.
     */
    const start = DRIVER.indexOf('last_hold: "tools-refused"');
    expect(start).toBeGreaterThan(-1);
    const update = DRIVER.slice(start, DRIVER.indexOf("} as never)", start));
    expect(update).toContain("last_hold_because:");
    expect(update).not.toContain("holdLine");
  });

  it("and the generic branch writes null, which is not the same as writing nothing", () => {
    /*
     * THIS ASSERTED "writes nothing" UNTIL 2026-09-03, and the distinction it
     * missed is the one this whole file is about. `HOLD_LINE[hold]` is derived on
     * read, so a generic sentence in this column is worse than a null -- that
     * part was always right. But writing NOTHING does not leave a null: it
     * leaves whatever the previous hold put there.
     *
     * A1 watched both halves in one night. `6817e386` held on a merge gate
     * reading "Stopped by you." from a stop cleared eight minutes earlier;
     * `2fdf93b6` held `out-of-time` reading "The checks were never run on this
     * change" from the self-check before it. The describe below is titled "a
     * released track never keeps a stale reason", and the branch two lines up
     * was keeping one.
     */
    const seatStop = DRIVER.slice(DRIVER.indexOf("last_hold: decision.hold"));
    expect(seatStop.slice(0, 400)).toContain("last_hold_because: null");
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
  /*
   * WHITESPACE, NOT A LINE BREAK. This required `\n` between the two keys, so a
   * clear that prettier put on ONE line -- `{ last_hold: null, last_hold_because:
   * null }` -- failed a test whose subject is the PAIRING, not the formatting.
   * A guard coupled to where a line breaks is testing the formatter (F-189).
   */
  const CLEARS = /last_hold: null,\s*last_hold_because: null,/g;

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

  it("and the count only ever grows, so it is not silently shrinking", () => {
    /*
     * A FLOOR, NOT A FIXED COUNT. This asserted exactly nine while the comment
     * above it promised "a tenth added tomorrow is covered the day it lands" --
     * and the tenth landed (P-71b's `the-call-is-yours` release) and failed it.
     * The rule is that no existing clear disappears; a new one is the property
     * above doing its job, not a regression (F-189).
     */
    const total = [DRIVER, TRACKS, CORRECTION].reduce(
      (n, src) => n + (src.match(/last_hold: null,/g) ?? []).length,
      0,
    );
    // 9 -> 8 on 2026-09-08: `advanceTrack` (track.functions.ts) was deleted
    // with its clear, under P-146; a clear that leaves with its whole function
    // is not a clear that disappeared from a live path.
    expect(total).toBeGreaterThanOrEqual(8);
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

describe("F-134: a halt names what stopped it, and the hold line stopped lying", () => {
  const DRIVER_SERVER = code(read("./driver.server.ts"));
  const DRIVER = code(read("./driver.ts"));

  it("the halt's own sentence is captured where the kind is chosen", () => {
    /*
     * `result.halted` carries `{ kind, reason }` and only the kind was kept.
     * The reason for an agent-disabled halt NAMES THE AGENT — "<slug> is
     * switched off, so this run was cancelled instead of resumed" — which is
     * exactly what this column exists to carry.
     */
    expect(DRIVER_SERVER).toContain("haltedBecause = result.halted.reason?.trim() || null");
    // And exactly one `if (haltedAs) {` block, so the sibling guard that locates
    // the halt branch by that string cannot slice the wrong one.
    expect(DRIVER_SERVER.split("if (haltedAs) {").length - 1).toBe(1);
  });

  it("and written when the hold is written", () => {
    expect(DRIVER_SERVER).toContain("last_hold_because: haltedBecause");
  });

  it("F-127 is not contradicted, because that branch is generic and this is not", () => {
    /*
     * F-127 argued the seat-decision branch should not write a SENTENCE, and it
     * is right about what it was looking at: `HOLD_LINE[kind]` is a static map
     * the reader already derives. A generic line in a column meant for specifics
     * is worse than a null; a specific one is the point of the column.
     *
     * It writes `null` there now, which is the removal of a sentence rather than
     * one. The two findings agree once that is said out loud: F-127 forbids a
     * generic line, this file forbids a stale one, and null is the only value
     * that satisfies both.
     */
    const seatStop = DRIVER_SERVER.slice(DRIVER_SERVER.indexOf("last_hold: decision.hold"));
    const head = seatStop.slice(0, 400);
    expect(head).toContain("last_hold_because: null");
    // And still no sentence: nothing between quotes on that key.
    expect(head).not.toMatch(/last_hold_because:\s*[`"']/);
  });

  it("the no-agent line is true whether nobody covers it or the agent is off", () => {
    // It read "No agent serves this station yet", and S1 verified all seven
    // stations HAVE a lead agent, so `agent-disabled` is the only way to reach
    // it. 27 of 283 agents are switched off. Those need different actions:
    // one is hiring, the other is a toggle.
    expect(DRIVER).not.toContain("No agent serves this station yet");
    expect(DRIVER).toContain("No agent is picking this step up, so it needs you.");
  });

  it("and it carries no machine punctuation", () => {
    expect("No agent is picking this step up, so it needs you.").not.toMatch(/[–—]/);
  });
});
