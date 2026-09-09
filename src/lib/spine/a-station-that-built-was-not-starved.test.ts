/**
 * THE LOOP TOLD DEFINE THAT A SPEC BUILD HAD ALREADY BUILT FROM WAS NOT ENOUGH.
 *
 * ── WHAT IT COST, MEASURED ON THE LIVE RUN ────────────────────────────────
 * `2fdf93b6` reached Build, produced a changeset, and opened a pull request. It
 * was sent back to Define anyway — four times, across `build → define →
 * design → build` laps from 22:20 UTC on 2026-09-02 — because its attempts hit
 * the ceiling for reasons that had nothing to do with the spec: red CI, a path
 * claimed by another run, and two drives that counted an attempt without
 * dispatching a seat at all.
 *
 * Each lap, `decideCorrection` reached its last branch and concluded *"what
 * Define filed is not enough to work from"*. Define then wrote another spec.
 * That track carries FOUR `prd` rows and EIGHT `prototype` rows, and A1's
 * measurement across the workspace is that 12 filed artifacts repeat 5 things
 * already on the record. **This is the machine that produced them.**
 *
 * ── THE BRANCH IS NOT WRONG. ITS PREMISE WAS. ─────────────────────────────
 * "Not enough" is the founder's own example and it is right when it holds: the
 * station ran against this input and produced NOTHING, so the input is the thing
 * to fix. What the rule never checked is whether the station produced anything.
 *
 * A station that filed its own artifact was not starved. Whatever went wrong
 * came after the input was used, and rewriting the input cannot reach it.
 */
import { describe, expect, it } from "bun:test";
import { decideCorrection, MAX_TRACK_CORRECTIONS } from "@/lib/spine/correction";
import { STATION_ARTIFACT } from "@/lib/spine/attach";
import { MAX_STATION_ATTEMPTS } from "@/lib/spine/driver";
import { fullRoute } from "@/lib/spine/route";

/** Build at the ceiling with a spec on the record, which is the live shape. */
const atBuild = (over: Partial<Parameters<typeof decideCorrection>[0]> = {}) =>
  decideCorrection({
    hold: "stalled",
    station: "build",
    route: fullRoute(),
    attempts: MAX_STATION_ATTEMPTS,
    corrections: 0,
    // Track-wide: the spec Define filed. `needIsMet` reads this, so the need IS
    // met and the rule reaches its last two branches.
    filed: ["signal", "decision", "prd", "task", "prototype"],
    filedAtThisStation: [],
    ...over,
  });

describe("a station that produced its own work is not sent back for its input", () => {
  it("gives up rather than routing, when Build filed a changeset", () => {
    /*
     * A1'S ACCEPTANCE. A track with a spec and a `pr_open` changeset at the
     * attempt ceiling holds at `given-up` rather than routing back to Define.
     */
    const d = atBuild({ filedAtThisStation: ["mission", "changeset"] });
    expect(d.action).toBe("give-up");
    if (d.action !== "give-up") throw new Error("unreachable");
    expect(d.because).toContain("produced its own work from it");
    /* The CAUSE and the reason a go-back is wrong; the effect ("nothing more
       will be tried") is the hold line's sentence, said once, since
       2026-09-09. */
    expect(d.because).toContain("downstream of the");
    expect(d.because.toLowerCase()).not.toContain("nothing more");
  });

  it("says the problem is downstream, not that the spec was bad", () => {
    // The sentence a person reads decides where they look. Telling them the spec
    // was not enough sends them to rewrite a spec that was fine.
    const d = atBuild({ filedAtThisStation: ["changeset"] });
    expect(d.because).toContain("downstream");
    expect(d.because).not.toContain("not enough to work from");
  });

  it("STILL routes back when the station produced nothing of its own", () => {
    /*
     * THE FOUNDER'S OWN EXAMPLE, WHICH MUST SURVIVE. Build has the spec, ran
     * three times, and filed no changeset: the input really is the thing to fix
     * and Define really is the station to fix it. A rule that stopped doing this
     * would trade one silent failure for another.
     */
    const d = atBuild({ filedAtThisStation: [] });
    expect(d.action).toBe("go-back");
    if (d.action !== "go-back") throw new Error("unreachable");
    expect(d.station).toBe("define");
    expect(d.kind).toBe("not-enough");
  });

  it("a mission alone is not producing, because the driver files that itself", () => {
    /*
     * THE TRAP IN THE OBVIOUS VERSION. `filedAtThisStation.length > 0` would
     * have been the easy check and it is always true at Build: the driver writes
     * a `mission` row there before any seat runs. That version fires on every
     * track and deletes the founder's case above, silently.
     */
    const d = atBuild({ filedAtThisStation: ["mission"] });
    expect(d.action).toBe("go-back");
  });

  it("reads each station's own artifact from the one map, not a literal", () => {
    // Build's is `changeset`. Naming it here would be a second source of truth,
    // and the map is what `attach.ts` already uses to file the row.
    expect(STATION_ARTIFACT.build.kind).toBe("changeset");
    expect(atBuild({ filedAtThisStation: [STATION_ARTIFACT.build.kind] }).action).toBe("give-up");
  });

  it("works for a station other than Build, because the rule is not about Build", () => {
    const d = decideCorrection({
      hold: "stalled",
      station: "design",
      route: fullRoute(),
      attempts: MAX_STATION_ATTEMPTS,
      corrections: 0,
      filed: ["signal", "decision", "prd"],
      filedAtThisStation: [STATION_ARTIFACT.design.kind],
    });
    expect(d.action).toBe("give-up");
  });
});

describe("what P-03c did not change", () => {
  it("an unmet need still routes back, whatever the station filed", () => {
    /*
     * The ABSENT branch is above this rule and must stay ahead of it: a station
     * with no spec at all is starved, and that is true even if it filed
     * something of its own from a previous life on the route.
     */
    const d = atBuild({ filed: ["signal"], filedAtThisStation: ["changeset"] });
    expect(d.action).toBe("go-back");
    if (d.action !== "go-back") throw new Error("unreachable");
    expect(d.kind).toBe("absent");
  });

  it("the correction budget still ends it first", () => {
    // `spent` is checked before both branches, and a track that has been round
    // MAX_TRACK_CORRECTIONS times stops for a person either way.
    const d = atBuild({
      corrections: MAX_TRACK_CORRECTIONS,
      filedAtThisStation: ["changeset"],
    });
    expect(d.action).toBe("give-up");
  });

  it("a hold that is not a station failing is still left alone", () => {
    expect(atBuild({ hold: "waiting-on-a-person" }).action).toBe("retry");
  });

  it("attempts below the ceiling still retry rather than correcting", () => {
    expect(atBuild({ attempts: MAX_STATION_ATTEMPTS - 1 }).action).toBe("retry");
  });
});
