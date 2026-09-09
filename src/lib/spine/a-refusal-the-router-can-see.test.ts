/**
 * ── THE ROUTER READ THE APPROVAL STATE AND CALLED IT THE DIRECTION ───────────
 *
 * `decisionWasRefusal` decides whether the driver waives Define, Design, Build
 * and Ship after Decide. It asked `decisions.status === 'declined'`, and
 * `decision.record` sets that status ONLY when the call was `do-not-build` AND
 * the approval gate had already approved it. A refusal written while the gate
 * was pending kept a `pending` status, so the router saw nothing and the track
 * went on to build the thing the station had just refused.
 *
 * ── WHAT IS MEASURED, AND WHAT WAS WITHDRAWN ───────────────────────────────
 * On production one decision carries `call = 'do-not-build'` with a status the
 * old check could not see, and 33 more carry no direction at all because they
 * predate the column. So the blind spot is real.
 *
 * A count of tracks that BUILT after a refusal was quoted for this and is
 * withdrawn: it took the refusal from any decision on the track rather than the
 * standing one, and clocked "afterwards" by the batch-written attachment time.
 * Correctly measured, of 29 tracks with a decision, 6 stand on a refusal and
 * ZERO built after it. This closes a hole nobody has fallen through, which is
 * still worth closing and is not the same claim.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { callWasARefusal, DECISION_ROUTING_COLUMNS } from "./a-refusal-the-router-can-see";

const DRIVER = readFileSync("src/lib/spine/driver.server.ts", "utf8");

describe("a refusal the router can see", () => {
  it("sees the refusal the old check missed: a direction with an unapproved record", () => {
    // The exact live row. `status` says nothing about direction here.
    expect(callWasARefusal({ call: "do-not-build", status: "pending" })).toBe(true);
    expect(callWasARefusal({ call: "do-not-build", status: "approved" })).toBe(true);
  });

  it("still sees the one it always saw, because 33 rows have no direction", () => {
    // Written before the column existed: the gate approved the refusal, so the
    // status is the only witness left and it must keep being read.
    expect(callWasARefusal({ call: null, status: "declined" })).toBe(true);
  });

  /*
   * THE MIRROR (law 12). "It sees refusals" passes just as well if it calls
   * everything a refusal, which would waive four stations on every track in
   * the product. The builds are asserted in the same breath.
   */
  it("calls nothing else a refusal, including a row that recorded no direction", () => {
    for (const build of [
      { call: "build", status: "approved" },
      { call: "build", status: "pending" },
      { call: null, status: "approved" },
      { call: null, status: "pending" },
      { call: null, status: null },
      { call: "", status: "" },
      { call: "DO-NOT-BUILD", status: "standing" },
    ]) {
      expect({ ...build, refusal: callWasARefusal(build) }).toEqual({ ...build, refusal: false });
    }
  });

  it("the driver selects both columns, from the one place that names them", () => {
    expect(DECISION_ROUTING_COLUMNS).toBe("status,call");
    expect(DRIVER).toContain('.select("status,call")');
    expect(DRIVER).toContain("callWasARefusal(");
  });

  it("an unreadable decision says so instead of arriving as a decision to build", () => {
    /* The whole read sat inside `catch { return false }`, so a failure and a
       "build" answer were the same value. The direction of the failure is
       unchanged on purpose -- waiving four stations on a row nobody could read
       would stop work that may never have been refused -- but it is now said
       out loud rather than swallowed. */
    const at = DRIVER.indexOf("async function decisionWasRefusal");
    expect(at).toBeGreaterThan(-1);
    const body = DRIVER.slice(at, DRIVER.indexOf("\n}", DRIVER.indexOf("callWasARefusal(", at)));
    expect(body).toContain("if (error) {");
    expect(body).toContain("console.error");
    expect(body).not.toMatch(/catch\s*\{\s*return false;\s*\}/);
  });
});
