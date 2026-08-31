import { describe, expect, it } from "bun:test";
import { stationGoal } from "./driver";

/**
 * A STATION JOB IS READ BY EVERY SEAT, SO IT MUST NOT GIVE ONE SEAT'S ORDER
 * (F-181, 2026-09-01).
 *
 * ── FOURTEEN DECISIONS FOR ONE QUESTION ──────────────────────────────────────
 * `stationGoal` composes the STATION's job and the SEAT's job into a single
 * brief. `stationJob.decide` opened *"Finish by calling decision.record"* with
 * no subject — so the critic, whose job is to red-team a call that already
 * exists, was told to finish by recording one, and did.
 *
 * Measured on `d2263583`, the first clean acceptance candidate: **14 decisions
 * for one question**, filed in strategist/critic pairs every ten minutes from
 * 13:40 to 17:31, carrying FOUR horizon dates — 2026-09-07, 2026-09-30 (x5),
 * 2026-10-15 (x7), 2026-11-30 — **none resolved.** Nothing on the record says
 * which forecast stands, so Learn has no rule for choosing when it grades.
 * **That is a data-integrity defect on the moat itself**, not a token cost.
 *
 * ── AND F-168 FIXED THE SEAT AND LEFT THE STATION ────────────────────────────
 * That finding corrected the critic's own brief to call `decision.revise`, and
 * deployed by 16:14 — and the 17:31 visit still called `decision.record`,
 * because the station sentence was still ordering it to. `decision.revise` is
 * reachable and its most recent call succeeded, so the seat was not falling back
 * for want of a tool. **The same file already warned about this in the other
 * direction (F-32): a sentence removed from one of the two composed texts is
 * still read from the other.**
 *
 * This guard asks the composed brief the question, rather than reading either
 * half alone — because the defect lived in neither half by itself.
 */
describe("a station job is read by every seat", () => {
  const forSeat = (seat: string) => stationGoal("decide", "a subject", { seat } as never);

  it("composes the station job into every seat's brief", () => {
    // The premise. If this ever stops being true the rest of the file is
    // asserting about text nobody reads.
    for (const seat of ["strategist", "critic"]) {
      expect(forSeat(seat)).toContain("decision.record");
    }
  });

  it("attributes the record to the seat that MAKES the call", () => {
    // Not "finish by calling decision.record". The subject is what stops a
    // reviewing seat from reading it as its own instruction.
    expect(forSeat("strategist")).toContain("seat that MAKES the call");
  });

  it("tells a reviewing seat not to file a second record", () => {
    const critic = forSeat("critic");
    expect(critic).toContain("does not record a second one");
    expect(critic).toContain("decision.revise");
  });

  it("says why two records are worse than one, not just that they are", () => {
    // R-20 §5 and the whole of today: a rule with no consequence attached is a
    // rule the next author deletes as noise. The consequence here is that
    // nothing on the record names the forecast to grade.
    expect(forSeat("critic")).toMatch(/which forecast is the one to grade/);
  });
});
