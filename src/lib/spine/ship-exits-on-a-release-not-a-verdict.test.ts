/**
 * TWICE IN TWENTY MINUTES, SHIP LEFT WITHOUT SHIPPING.
 *
 *   06:30:48  the release-verifier filed a DECLINED decision -- spec a draft,
 *             design gate pending -- and the sweep advanced the track to Learn.
 *   06:51:17  Ship ran again, raised the promote decision, and the sweep
 *             advanced to Learn before anybody answered it.
 *
 * Both passed every gate on the advance, because every one of them asks about
 * an ARTIFACT and a decision is an artifact. F-72 wrote the same sentence one
 * station earlier: not one of them asks whether the station's work is OVER.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import {
  declinedLine,
  learnMayStart,
  shipMayLeave,
  type ReleaseFacts,
} from "@/lib/spine/ship-exits-on-a-release-not-a-verdict";

const facts = (over: Partial<ReleaseFacts> = {}): ReleaseFacts => ({
  liveInProduction: false,
  handedBack: false,
  declinedBecause: null,
  known: true,
  ...over,
});

const DECLINE = "Do not ship until PRD approved and design gate cleared.";

describe("what lets Ship leave", () => {
  it("a production deploy on the record", () => {
    const e = shipMayLeave(facts({ liveInProduction: true }));
    expect(e.leave).toBe(true);
  });

  it("a person's recorded handback", () => {
    // `claimed`, never `success`: a person's word is not proof that a provider
    // deployed anything, and it IS enough to leave Ship.
    expect(shipMayLeave(facts({ handedBack: true })).leave).toBe(true);
  });

  it("a live production deploy wins even over a decline on the record", () => {
    // The decline was about shipping; something shipped. The world settles it.
    expect(shipMayLeave(facts({ liveInProduction: true, declinedBecause: DECLINE })).leave).toBe(
      true,
    );
  });
});

describe("what holds Ship where it is", () => {
  it("a declined release becomes a person's hold, not an advance", () => {
    const e = shipMayLeave(facts({ declinedBecause: DECLINE }));
    expect(e.leave).toBe(false);
    if (!e.leave) {
      expect(e.hold).toBe("waiting-on-a-person");
      expect(e.because).toContain(DECLINE);
    }
  });

  it("the hold carries the seat's own words, and so the two calls it names", () => {
    /*
     * A person told only "Ship is waiting on you" goes looking for what to do.
     * The rationale already names the spec approval and the design gate, so it
     * is carried verbatim rather than paraphrased into a second answer.
     */
    const said = declinedLine(DECLINE);
    expect(said).toContain("PRD approved");
    expect(said).toContain("design gate cleared");
    expect(said).toContain("nothing has gone live");
  });

  it("a decision raised and unanswered is not a release either", () => {
    /*
     * 06:51:17, the second instance. Ship completed, raised the promote, and
     * the advance did not care that nobody had pressed it. Nothing is live, so
     * Ship is not finished -- and the ordinary path decides, rather than a
     * person-hold, because nobody is being waited on yet.
     */
    const e = shipMayLeave(facts());
    expect(e.leave).toBe(false);
    if (!e.leave) {
      expect(e.hold).toBeNull();
      expect(e.because).toContain("Nothing is live");
    }
  });

  it("a failed read holds without parking anybody", () => {
    // A read we could not make is not evidence about the work, and it is not a
    // reason to put a track in front of a person either.
    const e = shipMayLeave(facts({ known: false }));
    expect(e.leave).toBe(false);
    if (!e.leave) expect(e.hold).toBeNull();
  });
});

describe("Learn refuses to grade what nobody can use", () => {
  it("refuses an unshipped track", () => {
    const m = learnMayStart(facts());
    expect(m.start).toBe(false);
    expect(m.because).toContain("a claim about nothing");
  });

  it("starts once something is live, or a person says it shipped", () => {
    expect(learnMayStart(facts({ liveInProduction: true })).start).toBe(true);
    expect(learnMayStart(facts({ handedBack: true })).start).toBe(true);
  });

  it("a failed read does NOT stop Learn, unlike Ship's exit", () => {
    /*
     * The asymmetry is deliberate and is the one thing in this file that could
     * be read as inconsistent. Learn is the end of the route: refusing it on an
     * unreadable record strands finished work with nowhere to go, which is
     * worse than grading late. Ship's exit has somewhere to wait.
     */
    expect(learnMayStart(facts({ known: false })).start).toBe(true);
  });
});

describe("the driver asks both questions where they can still change the answer", () => {
  const SRC = readFileSync("src/lib/spine/driver.server.ts", "utf8")
    /* Comments first (F-188): the explanation names the stations it gates. */
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^\s*\/\/.*$/gm, " ");

  it("Ship's exit is asked before the advance, not after it", () => {
    const asked = SRC.indexOf("shipMayLeave(facts)");
    const advance = SRC.indexOf("const arrivedAt = nextStation(onwardRoute, station);");
    expect(asked, "the ship exit gate is gone; re-point this guard").toBeGreaterThan(-1);
    expect(advance, "the advance moved; re-point this guard").toBeGreaterThan(-1);
    expect(asked).toBeLessThan(advance);
  });

  it("Learn's refusal is asked before its crew is dispatched", () => {
    const asked = SRC.indexOf("learnMayStart(facts)");
    /* Anchored on the dispatch itself, not on a neighbouring station's block:
       `if (station === "build")` occurs several times in this file and the
       first one is nowhere near the crew. A guard that picks the wrong one of
       several matches is asserting an accident. */
    const dispatch = SRC.indexOf("const result = await runAgentLoop(");
    expect(asked, "the learn gate is gone; re-point this guard").toBeGreaterThan(-1);
    expect(dispatch, "the crew dispatch moved; re-point this guard").toBeGreaterThan(-1);
    expect(asked).toBeLessThan(dispatch);
  });

  it("neither gate spends an attempt", () => {
    /*
     * A correct refusal is not a failed try. Spending the stall ceiling on one
     * would end a track for doing the right thing, which is the F-43 shape.
     */
    const shipAt = SRC.indexOf("shipMayLeave(facts)");
    const learnAt = SRC.indexOf("learnMayStart(facts)");
    for (const [name, from] of [
      ["ship", shipAt],
      ["learn", learnAt],
    ] as const) {
      /* The gate's OWN branch ends at its return. A fixed window reached the
         next hold's block the day a sentence above it got shorter, and that
         block counts an attempt for a different reason (nothing to hand on). */
      const end = SRC.indexOf("return {", from);
      expect(end, `${name}'s gate branch has no return; re-point this guard`).toBeGreaterThan(from);
      const branch = SRC.slice(from, end);
      expect(branch, `${name} must not count an attempt`).not.toContain("attempts:");
    }
  });
});
