/**
 * EVIDENCE ALREADY ON THE RECORD IS EVIDENCE (2026-08-27).
 *
 * This is why Discover has never cleared, and it is one sentence.
 *
 * The sense brief said *"call signals.log for each piece of evidence"* and named
 * no other way to finish. So a crew searching a workspace that was ALREADY FULL
 * of evidence concluded there was nothing to log, and filed nothing.
 *
 * ── MEASURED ON THE REAL WORKSPACE ─────────────────────────────────────────
 * 258 signals, **81 of them from genuinely outside sources**: NPS survey 28,
 * analytics dashboard 15, session replay archive 15, sales calls 6, support
 * tickets 5, a GitHub connector 7. Against track `a30238f5` — reusing a saved
 * delivery address — the table holds an analytics row titled *"41 percent of
 * abandonments happened on the redundant address re-confirm screen"* and a
 * session-replay row about redundant address entry, both tagged
 * `address-friction`.
 *
 * The crew **quoted that 41 percent figure back** and still reported *"no
 * user-sourced evidence exists ... the workspace contains only internal
 * documentation (PRDs, decisions, brief excerpts)"*. It had read the number out
 * of a PRD rather than out of the signals table, and F-73 correctly forbids
 * citing our own artifacts as evidence about the world.
 *
 * **Every guard was working as designed.** The brief simply never said that
 * evidence already on the record counts. Both sense-entry tracks died of it,
 * twelve drives each, and the F-43 ceiling was right to stop them.
 *
 * ── WIDENING A FINISH IS WHEN A CREW LOOKS FOR A CHEAPER ONE ───────────────
 * So this file pins the widening AND all three refusals it must not take with
 * it.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SRC = readFileSync(fileURLToPath(new URL("./driver.ts", import.meta.url)), "utf8");
const SENSE = SRC.slice(
  SRC.indexOf("const FILE_IT"),
  SRC.indexOf("decide:", SRC.indexOf("const FILE_IT")),
);

describe("grouping what is already there is a complete finish", () => {
  it("says existing evidence counts, in words a crew cannot read past", () => {
    expect(SENSE).toContain("ALREADY IN THIS WORKSPACE COUNTS");
  });

  it("names the hand that searches it, not only the hand that writes", () => {
    // The old brief named `signals.log` alone, which is the whole defect.
    expect(SENSE).toContain("signals.list");
  });

  it("and calls grouping a correct outcome rather than a shortcut", () => {
    expect(SENSE).toContain("cluster.trigger");
    expect(SENSE).toContain("complete, correct outcome, not a shortcut");
  });
});

describe("THE THREE REFUSALS SURVIVE THE WIDENING", () => {
  it("filing the absence of evidence is still forbidden", () => {
    expect(SENSE).toContain("never do is file the ABSENCE of evidence");
  });

  it("citing our own artifacts is still forbidden, and says why", () => {
    // F-73: a track cleared Discover by citing another track's PRD.
    expect(SENSE).toContain("own PRDs, decisions or briefs");
    expect(SENSE).toContain("our own writing coming back");
  });

  it("an empty workspace still means file nothing", () => {
    // The honest absence. Widening what counts as a finish must not turn
    // "there is nothing here" into a reason to invent something.
    expect(SENSE).toContain("say so in your answer and file nothing");
  });

  it("and logging genuinely new evidence is still the other way to finish", () => {
    expect(SENSE).toContain("only for evidence that is genuinely not on the record yet");
  });
});
