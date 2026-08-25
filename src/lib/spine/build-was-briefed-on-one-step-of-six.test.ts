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

describe("the gate is intact, and is left to a person on purpose", () => {
  it("never tells a station to merge", () => {
    expect(briefs).not.toContain("studio.pr.merge");
    expect(stationGoal("build", track)).not.toContain("studio.pr.merge");
  });

  it("says so in words rather than only by omission", () => {
    expect(briefs.toLowerCase()).toContain("do not merge it yourself");
  });

  it("keeps the merge and the publish pinned to a human", () => {
    expect(HIGH_RISK_FORCE_REVIEW.has("studio.pr.merge")).toBe(true);
    expect(HIGH_RISK_FORCE_REVIEW.has("release.publish")).toBe(true);
  });
});

describe("THE RULE: brief only what the station may actually run", () => {
  /**
   * The generalisation, and the reason this file is not just three string
   * assertions. If a later change adds a tool to a Build brief, this fails
   * unless that tool is also autonomous — which is the question whoever adds it
   * should have to answer.
   */
  it("every studio tool named in a Build brief is autonomous", () => {
    const named = [...briefs.matchAll(/studio\.[a-z_.]+/g)].map((m) => m[0].replace(/\.$/, ""));
    expect(named.length).toBeGreaterThan(0);
    for (const tool of named) {
      expect({ tool, autonomous: BUILD_LANE_AUTONOMOUS.has(tool) }).toEqual({
        tool,
        autonomous: true,
      });
    }
  });

  it("and no force-review tool is named in one", () => {
    const named = [...briefs.matchAll(/studio\.[a-z_.]+/g)].map((m) => m[0].replace(/\.$/, ""));
    for (const tool of named) {
      expect({ tool, forced: HIGH_RISK_FORCE_REVIEW.has(tool) }).toEqual({ tool, forced: false });
    }
  });
});
