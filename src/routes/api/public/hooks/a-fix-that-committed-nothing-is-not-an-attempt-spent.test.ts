import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * A CI FIX THAT COMMITTED NOTHING IS NOT AN ATTEMPT SPENT (F-179, 2026-08-31).
 *
 * ── THE DEADLOCK, MEASURED ON THE TWO CHANGESETS TIER 0.2 UNBLOCKED ─────────
 * `fix_attempts` was reset to 0 on the changesets behind PRs #2 and #3 at 09:29
 * and 09:32 UTC. `ci-poll-tick` dispatched a builder run for each within
 * seconds — the unblock worked. Both runs finished `completed` having called
 * `studio.fix.commit`, which the **pre-F-152** policy floor turned into an
 * approval rather than a commit. Both approvals were still `pending` and
 * undecided eight hours later.
 *
 * ── TWO COUNTERS DISAGREED AND THE WRONG ONE BLOCKED ────────────────────────
 * The tick's own comment states the design: *budget consumption lives in
 * `studio.fix.commit` itself (per real commit); the dispatch is bounded by the
 * head-sha dedup.* So a run that ends without committing:
 *
 *   · spends NO budget — `fix_attempts` stays 0, so the exhausted-park never
 *     fires and nothing anywhere reports the changeset as stuck;
 *   · and RETIRES ITS HEAD SHA FOREVER, because the sha only moves when a
 *     commit lands, and both the `agent_runs` count and the dispatch claim
 *     treated "was ever dispatched" as "is finished".
 *
 * **The changeset is dead and every instrument reads healthy**: `pr_open`,
 * `fix_attempts: 0`, and the tick returning `ok` every two minutes for eight
 * hours. That is the day's recurring shape — a terminal state no counter can
 * express — arriving on the Build→Ship seam the acceptance runs through.
 *
 * ── WHAT CHANGED, AND WHAT DELIBERATELY DID NOT ─────────────────────────────
 * The bound stays; its ceiling moves from 1 to `CI_FIX_BUDGET`, so F-151's spin
 * stays impossible — three dispatches per red head, then it stops. And when it
 * does stop with nothing committed, it says so somewhere durable, because the
 * tick's `failures` array is returned to a caller and `job_runs` stores no
 * payload: every counter this tick reports otherwise reaches nobody.
 */
const TICK = readFileSync(join(import.meta.dir, "ci-poll-tick.ts"), "utf8");

describe("a fix that committed nothing is not an attempt spent", () => {
  it("bounds dispatches per head sha by the budget, not by one", () => {
    // The literal `> 0` is what made a single fruitless dispatch permanent.
    expect(TICK).toMatch(/dispatchesForHead >= CI_FIX_BUDGET/);
    expect(TICK).not.toMatch(/\(priorForHead \?\? 0\) > 0\) continue/);
  });

  it("keys the dispatch claim by the ordinal as well as the sha", () => {
    // Otherwise the claim is a SECOND permanent retirement of the head: it is
    // taken once and released only when the insert fails, so raising the
    // ceiling above would have changed nothing at all.
    const claims = TICK.split("ci-poll.fix-dispatch").slice(1);
    expect(claims.length).toBeGreaterThanOrEqual(2); // the claim and its release
    for (const c of claims) {
      expect(c.slice(0, 160)).toContain("${headSha}:${dispatchesForHead}");
    }
  });

  it("records the stuck state somewhere durable, not only in the return value", () => {
    // `failures` is returned to the caller and `job_runs` has no payload column,
    // so a counter reported there reaches nobody — the F-171 shape one layer up.
    const branch = TICK.slice(TICK.indexOf("dispatchesForHead >= CI_FIX_BUDGET"));
    expect(branch.slice(0, 1800)).toContain("recordErrorEvent");
    expect(branch.slice(0, 1800)).toContain("ci-poll.fix-stuck");
  });

  it("says it once per head sha rather than every two minutes", () => {
    // The tick runs every 2 minutes for the life of the PR. An unclaimed write
    // here would be ~720 identical error rows a day.
    const branch = TICK.slice(TICK.indexOf("dispatchesForHead >= CI_FIX_BUDGET"));
    expect(branch.slice(0, 1800)).toMatch(/claimOnce\(/);
  });

  it("leaves the real-commit budget branch alone", () => {
    // `fix_attempts >= CI_FIX_BUDGET` parks the mission and is a different
    // question: that one fired on work actually done. Both must survive.
    expect(TICK).toMatch(/attempts >= CI_FIX_BUDGET/);
    expect(TICK).toContain('status: "blocked"');
  });
});
