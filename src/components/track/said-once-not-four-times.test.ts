import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { waiverLine, waiverVoices, type WaivedLike } from "./said-once-not-four-times";

const w = (r: string | null): WaivedLike => ({ waivedReason: r });

/** The exact string `driver.server.ts` waives all four stations with. */
const DECLINED = "The call was not to build, so there is nothing to specify or ship.";

describe("waiverVoices", () => {
  it("says a lone waiver's reason plainly", () => {
    const v = waiverVoices([w(null), w("Already known"), w(null)]);
    expect(v[0].kind).toBe("not-waived");
    expect(v[1]).toEqual({ kind: "says", reason: "Already known", covers: 1 });
    expect(v[2].kind).toBe("not-waived");
  });

  it("says a declined route's one reason once and covers four", () => {
    // Discover, Decide, then the four F-174 waives, then Learn.
    const v = waiverVoices([
      w(null),
      w(null),
      w(DECLINED),
      w(DECLINED),
      w(DECLINED),
      w(DECLINED),
      w(null),
    ]);
    expect(v[2]).toEqual({ kind: "says", reason: DECLINED, covers: 4 });
    expect(v.slice(3, 6).every((x) => x.kind === "already-said")).toBe(true);
    expect(v[6].kind).toBe("not-waived");
    // The whole point: exactly one stop is allowed to print the sentence.
    expect(v.filter((x) => x.kind === "says")).toHaveLength(1);
  });

  it("returns one voice per stop, always", () => {
    const stops = [w(null), w("a"), w("a"), w("b"), w(null)];
    expect(waiverVoices(stops)).toHaveLength(stops.length);
  });

  it("does NOT fold two waivers separated by a station that ran", () => {
    /*
     * Same reason, not adjacent. Folding them would claim the two stations came
     * off the route together, which the record does not say.
     */
    const v = waiverVoices([w("Same words"), w(null), w("Same words")]);
    expect(v[0]).toEqual({ kind: "says", reason: "Same words", covers: 1 });
    expect(v[2]).toEqual({ kind: "says", reason: "Same words", covers: 1 });
    expect(v.filter((x) => x.kind === "already-said")).toHaveLength(0);
  });

  it("does not merge reasons that only look alike", () => {
    // Whitespace and case are NOT normalised: a person's own words may differ
    // by exactly this much and still be two different sentences.
    const v = waiverVoices([w("Already known"), w("already known "), w("Already known")]);
    expect(v.every((x) => x.kind === "says")).toBe(true);
  });
});

describe("waiverLine", () => {
  it("is null for anything that must not print", () => {
    expect(waiverLine({ kind: "not-waived" })).toBeNull();
    expect(waiverLine({ kind: "already-said" })).toBeNull();
  });

  it("gives a lone waiver's reason verbatim and adds nothing", () => {
    expect(waiverLine({ kind: "says", reason: "Already known", covers: 1 })).toBe("Already known");
  });

  it("states the span when one reason covers several stations", () => {
    const line = waiverLine({ kind: "says", reason: DECLINED, covers: 4 });
    expect(line).toBe(`${DECLINED} The same reason took 4 stations off the route.`);
  });

  it("says 'the same reason', never 'one call'", () => {
    /*
     * A waiver records `by`, `reason` and `reopensWhen` and NO identifier of the
     * decision behind it. "One call" would be an inference from two adjacent
     * strings matching, which is the over-claim this file exists to avoid.
     */
    const line = waiverLine({ kind: "says", reason: DECLINED, covers: 4 }) ?? "";
    expect(line).not.toMatch(/\bone call\b/i);
    expect(line).toContain("The same reason");
  });
});

describe("the coupling this is only correct because of", () => {
  /*
   * `TrackChain` (the coupling this described, `sub = waivedReason ?? gap`
   * falling through to `gap` on a suppressed repeat) is gone -- deleted with
   * P-146's unreachable-export sweep, 2026-09-04: the run screen's own guard
   * (`one-station-display-on-the-run-screen.test.ts`) confirms its job moved
   * to `TrackActivity`'s `SeatCalls`, not merely its mount. `waiverVoices` and
   * `waiverLine` have no consumer left; the regression this test pinned in
   * TrackChain's own source cannot recur in a file that renders nothing.
   */
  it("the reason the driver waives four stations with is still one shared string", () => {
    /*
     * If S0 ever gives the four waives DIFFERENT reasons, this module correctly
     * stops folding them and the four sentences come back -- which would be the
     * right behaviour, but somebody should know it happened rather than discover
     * it on a screen.
     */
    const src = readFileSync(
      fileURLToPath(new URL("../../lib/spine/driver.server.ts", import.meta.url)),
      "utf8",
    );
    const loop = src.includes('["define", "design", "build", "ship"] as AgentStation[]');
    expect(loop, "the four-station waive loop was restructured -- re-check the fold").toBe(true);
  });
});
