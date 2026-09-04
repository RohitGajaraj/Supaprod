/**
 * LEARN WAITING ON TIME IS NOT FAILING (ruled by A, concurred by B, 2026-08-25).
 *
 * ── THE BIND THIS RESOLVES ─────────────────────────────────────────────────
 * `learning.record` is Learn's ONLY arrival path (attach.ts: learn → learning),
 * and its own description forbids a verdict before the forecast's horizon —
 * "if the evidence is not in yet, DO NOT CALL THIS TOOL AT ALL". So an honest
 * learn crew files nothing by DESIGN, and the driver used to read that as
 * `produced-nothing`: one attempt per tick for obeying the tool, three ticks
 * to `given-up`, and the correction loop rewriting good work upstream. The
 * dishonest crew that guessed a verdict sailed through. A rule that punishes
 * honesty and rewards guessing is how the moat — forecasts graded against
 * reality, not convenience — would have quietly rotted.
 *
 * ── THE SHAPE ──────────────────────────────────────────────────────────────
 * Pre-horizon, a learn visit that filed nothing holds `needs-evidence`
 * (resumable, product-native) with attempts UNCHANGED, and the line carries
 * the due date so a stalled board distinguishes "waiting on time" from
 * "waiting on me" without opening anything (B's amendment). Passes after the
 * first return the same dated hold WITHOUT dispatching the crew — a question
 * whose answer is a date does not cost a crew per tick. Past the horizon,
 * everything falls through to `produced-nothing` unchanged: evidence in,
 * nothing filed IS a failure then. A track with no forecast (a waived Decide,
 * F-61's shape) gets null from the lookup and never the wait.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "bun:test";

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");

const DRIVER = read("./driver.server.ts");
const body = DRIVER.slice(DRIVER.indexOf("export async function driveTrackOnce("));

describe("the honest wait, pre-horizon", () => {
  it("a pre-horizon learn that filed nothing holds needs-evidence, before produced-nothing can see it", () => {
    const waitAt = body.indexOf('station === "learn"', body.indexOf("!producedThisVisit"));
    const producedNothingWrite = body.indexOf('last_hold: "produced-nothing"');
    expect(waitAt).toBeGreaterThan(-1);
    expect(producedNothingWrite).toBeGreaterThan(waitAt);
  });

  it("the wait burns no attempt", () => {
    // The needs-evidence write must not touch attempts; the produced-nothing
    // write below it must. Slice each update and check.
    const waitWrite = body.slice(
      body.indexOf('last_hold: "needs-evidence"') - 400,
      body.indexOf('last_hold: "needs-evidence"') + 100,
    );
    expect(waitWrite).toContain("attempts deliberately UNCHANGED");
    expect(waitWrite).not.toContain("attempts: (row.attempts ?? 0) + 1");
  });

  it("the driver does not compose the line itself; one composer owns it", () => {
    /*
     * RE-AIMED 2026-09-04 (P-144). This pinned two literals in this file's
     * source: "comes due on ${dueIso.slice(0, 10)}" and "nothing here is
     * waiting on a person". Both have moved into
     * `what-learn-is-waiting-for.ts`, and the second is now CONDITIONAL, which
     * is the point of the packet: when no metric on the spec can produce a
     * number, somebody does have to walk over, and the old sentence told them
     * not to. Pinning the words here would have made the honest fix fail.
     *
     * The requirement is unchanged and is stronger stated this way: this file
     * must not build that sentence, because it built it TWICE (:2440 and
     * :3691, verbatim) and two copies is how the hold line and the spec's own
     * sentence came to contradict each other on one screen. The wording in
     * each state, and that it agrees with the spec sentence, is pinned in
     * what-learn-is-waiting-for.test.ts.
     */
    expect(body).toContain("whatLearnIsWaitingFor(dueIso");
    expect(body).not.toContain("nothing here is waiting on a person");
    expect(body).not.toContain("comes due on ${dueIso.slice(0, 10)}");
  });

  it("a later pass skips the crew instead of paying for it", () => {
    // The pre-dispatch check reads the STORED hold and returns before the crew
    // section. It must sit before the seat loop's queued counter.
    const preDispatch = body.indexOf('row.last_hold === "needs-evidence"');
    const crewLoop = body.indexOf("let queued = 0");
    expect(preDispatch).toBeGreaterThan(-1);
    expect(crewLoop).toBeGreaterThan(preDispatch);
  });
});

describe("what the wait must never loosen", () => {
  it("only learn gets it: every branch that names the station is deliberate", () => {
    /*
     * WAS 2, THEN 3 (2026-08-27), NOW 4 (P-123). The third is
     * `reopenIfOutcomeContested`, which asks at Learn because that is the only
     * station whose output can contest a refusal. The fourth is `learnMayStart`:
     * Learn refuses to grade a track that has not shipped, and that belongs at
     * Learn and nowhere else for the same reason -- Learn is the only station
     * that makes a claim about what happened in the world, so it is the only one
     * that can be wrong about there being a world to speak of.
     *
     * The count is the point of the assertion. Raise it only after checking the
     * new branch belongs at Learn and nowhere else, which is what this test is
     * really guarding.
     */
    expect([...body.matchAll(/station === "learn"/g)].length).toBe(4);
  });

  it("a forecastless track falls through: the lookup answers null, never a date", () => {
    const helper = DRIVER.slice(
      DRIVER.indexOf("async function forecastDueDate("),
      DRIVER.indexOf("export async function driveTrackOnce("),
    );
    expect(helper).toContain("if (!decisionId) return null;");
    expect(helper).toContain("return iso ?? null;");
    // Fail-soft: an unreachable table degrades to today's behaviour.
    expect(helper).toContain("catch {");
  });

  it("past the horizon the ordinary produced-nothing still applies", () => {
    // Both guards test the date is in the FUTURE; there is no branch that
    // holds needs-evidence on a past date.
    expect([...body.matchAll(/Date\.parse\(dueIso\) > Date\.now\(\)/g)].length).toBe(2);
  });
});
