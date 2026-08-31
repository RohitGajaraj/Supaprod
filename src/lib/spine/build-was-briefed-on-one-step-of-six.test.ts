/**
 * Build was told to stage, and staging is one step of six.
 *
 * The chain from a change to a shipped release is
 * `studio.stage` -> `studio.commit` -> `studio.pr.open` -> `studio.checks.run`
 * -> `studio.pr.merge` -> `release.publish`. Build's brief named the first and
 * stopped, so a track arrived at Ship with a staged changeset and nothing else.
 * `release.publish` then refuses:
 *
 *   if ((cs.status) !== "merged")
 *     throw new Error("Only a merged changeset can promote. Merge the PR first.")
 *
 * Measured 2026-08-25 in workspace `0b792d52`: **0 deployments, 1 changeset, 0
 * merged**, and `grep -c "studio.commit" driver.ts` returned **0**.
 *
 * THE PART WORTH REMEMBERING. The permission was never missing. Founder ruling
 * 2026-07-08 put `studio.stage`, `studio.commit` and `studio.pr.open` in
 * `BUILD_LANE_AUTONOMOUS` precisely so the build lane's own mechanics run
 * unattended — a `studio/*` branch and a draft PR are isolated and reversible,
 * and nothing lands except through the review-pinned merge gate. **That ruling
 * sat unused for seven weeks because no station was told the tools existed**,
 * and because `studio.commit`'s own description still read "Operator-gated",
 * which is what a reader checking permission would have found. Both are fixed.
 *
 * WHAT THIS FILE GUARDS is the pairing, which is the rule that outlives this
 * bug: **a station may only be briefed on a tool it is actually allowed to
 * run.** Briefing a force-review tool would build a loop that stalls on an
 * approval nobody asked for; leaving an autonomous tool unbriefed is what
 * happened here. Both directions are asserted.
 */
import { describe, expect, it } from "bun:test";

import { stationCrew, stationGoal } from "./driver";
import { BUILD_LANE_AUTONOMOUS, HIGH_RISK_FORCE_REVIEW } from "@/lib/ai/trust-ramp";

const track = { title: "Add SSO", origin: null };
const crew = stationCrew("build");
const briefs = crew.map((r) => r.file).join("\n");

describe("Build is briefed through the steps it is allowed to take", () => {
  it("names the commit, so staged work leaves the workspace", () => {
    expect(briefs).toContain("studio.commit");
  });

  it("names the pull request, so Ship has something to point at", () => {
    expect(briefs).toContain("studio.pr.open");
  });

  /**
   * The fallback matters as much as the seats: it is used when a station has no
   * crew entry, and F-32 was found to be half-fixed for exactly this reason —
   * the retired sentence survived in the other place that composes the brief.
   */
  it("carries the same chain in the goal a Build seat actually receives", () => {
    const goal = stationGoal("build", track);
    expect(goal).toContain("studio.stage");
    expect(goal).toContain("studio.commit");
  });
});

/*
 * THE DOCTRINE MOVED ON 2026-08-25 (F-50, R-27), AND THIS BLOCK MOVED WITH IT.
 *
 * The block above this comment used to be called "the gate is intact, and is
 * left to a person on purpose", and it asserted the OPPOSITE of what stands
 * now: briefs must never name `studio.pr.merge`, and must say "do not merge it
 * yourself" in words. That rule was right when the merge gate lived in a
 * detached approvals queue nobody answered (90 raised, 0 approved). It became
 * the defect the day the gate moved into the tool: `studio.pr.merge` proves CI
 * green fresh in-tool and refuses red, `AUTO_SHIP_ENABLED` is live in
 * production by the founder's own hand, and the consent card answers a
 * governance question INSIDE the run. F-50's measurement was exactly this
 * file's old rule doing its work: the gate stood open and no station was ever
 * told to walk up to it, so every PR sat at `pr_open` forever.
 *
 * What the gate MEANS is unchanged and still asserted: the floor stands, and a
 * brief that names the merge must also say that a governance question is the
 * STOPPING point, never something to work around.
 */
describe("the gate lives in the tool, and the station walks up to it", () => {
  it("tells the checking seat to run the checks and call the merge", () => {
    // In `briefs` (all seats), not in `stationGoal` — the goal composes the
    // LEAD seat, the builder, whose job ends at the commit. The chain's tail
    // belongs to the qa seat that signs the PR, which is exactly the split the
    // comment on that seat argues for.
    expect(briefs).toContain("studio.checks.run");
    expect(briefs).toContain("studio.pr.merge");
  });

  it("says in words that a governance question is the stopping point", () => {
    expect(briefs.toLowerCase()).toContain("the gate working");
  });

  it("keeps the floor under the merge and the publish", () => {
    expect(HIGH_RISK_FORCE_REVIEW.has("studio.pr.merge")).toBe(true);
    expect(HIGH_RISK_FORCE_REVIEW.has("release.publish")).toBe(true);
  });

  it("never names the publish in a Build brief — Ship's act stays Ship's", () => {
    expect(briefs).not.toContain("release.publish");
    expect(stationGoal("build", track)).not.toContain("release.publish");
  });
});

describe("THE RULE: brief only what the station may run or lawfully ask for", () => {
  /**
   * The generalisation, updated with the doctrine. A studio tool named in a
   * Build brief must be one of exactly three things: autonomous by the
   * 2026-07-08 ruling; a floor-free read/trigger (the checks family writes
   * nothing); or THE named gate itself, whose call files the governance
   * question in place. Anything else added later still fails here, which is
   * the question whoever adds it should have to answer.
   */
  /*
   * F-147 ANSWERS THIS GUARD'S OWN QUESTION rather than widening it to pass.
   *
   * `studio.review` joined the checking seat's brief on 2026-08-31. It is the
   * same class `studio.checks.run` is already admitted under, and the case is
   * not mine: `trust-ramp.ts:74-96` records the four Build verification checks
   * as "DELIBERATELY ABSENT FROM BOTH FLOORS ... they read the staged diff and
   * GitHub, they write nothing, and their whole purpose is to be run before the
   * tools that DO have consequence." A read with no consequence and no floor is
   * exactly what READ_CLASS was written to hold.
   *
   * The three sibling checks are NOT added here. They are the same class and
   * would pass, but no brief names them yet, and a set that anticipates callers
   * stops being evidence of what is actually reachable. Add each one when its
   * brief line lands, not before.
   */
  const READ_CLASS = new Set(["studio.checks.run", "studio.review"]);
  const THE_GATE = new Set(["studio.pr.merge"]);

  it("every studio tool named in a Build brief is autonomous, a read, or the gate", () => {
    const named = [...briefs.matchAll(/studio\.[a-z_.]+/g)].map((m) => m[0].replace(/\.$/, ""));
    expect(named.length).toBeGreaterThan(0);
    for (const tool of named) {
      const allowed = BUILD_LANE_AUTONOMOUS.has(tool) || READ_CLASS.has(tool) || THE_GATE.has(tool);
      expect({ tool, allowed }).toEqual({ tool, allowed: true });
    }
  });

  it("and the only force-review tool ever named is the gate itself", () => {
    const named = [...briefs.matchAll(/studio\.[a-z_.]+/g)].map((m) => m[0].replace(/\.$/, ""));
    for (const tool of named) {
      const lawful = !HIGH_RISK_FORCE_REVIEW.has(tool) || THE_GATE.has(tool);
      expect({ tool, lawful }).toEqual({ tool, lawful: true });
    }
  });
});
