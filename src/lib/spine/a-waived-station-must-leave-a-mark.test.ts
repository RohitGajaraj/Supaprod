import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * A WAIVED STATION MUST LEAVE A MARK ON THE ROW (F-178, 2026-08-31).
 *
 * ── MEASURED ON THE LIVE ACCEPTANCE CANDIDATE, THE HOUR IT HAPPENED ──────────
 * `d2263583` walked `sense -> decide -> learn` at 17:31:31, every drive
 * `driven_via='sweep'`, zero presses, zero approvals. It was **driven at two
 * stations of seven** — `define`, `design`, `build` and `ship` were waived by
 * the decline path — and its `waived` column read `[]`.
 *
 * R-18's acceptance query carries `waived = '[]'` for exactly one purpose: to
 * guarantee the work went through all seven stations. **A track that skipped
 * four satisfied it.** The waiver was built into an in-memory `onwardRoute` and
 * recomputed every tick, so the loop behaved correctly and the record said
 * nothing had happened.
 *
 * ── AND F-174 OPENED THE HOLE, HOURS EARLIER, IN THIS SAME FILE ──────────────
 * Before it, a declined track stuck at Decide and could never reach Learn, so no
 * row could be miscounted this way. Unblocking the decline path made the row
 * reachable. **A fix that unblocks a path can invalidate a measurement that only
 * held while the path was blocked** — and this measurement is the one the whole
 * project is judged by.
 *
 * ── THE SECOND HALF, WHICH IS WORSE ──────────────────────────────────────────
 * The waiver block promises that a contested verdict brings the stations back
 * *"rather than needing a person to remember this happened"*.
 * `reopenIfOutcomeContested` exits early unless some waiver carries
 * `reopensWhen: "outcome-contested"`, and it reads them from the ROW. With
 * `waived` never written, the trigger could never match and the promise could
 * never be kept. Persisting the route fixes both directions at once: the decline
 * that ADDS waivers, and the reopen that REMOVES them.
 */
const DRIVER = readFileSync(join(import.meta.dir, "driver.server.ts"), "utf8");

describe("a waived station must leave a mark", () => {
  it("persists the route's waivers when the tick changed them", () => {
    // Structural, not textual: the update object that moves a track must be able
    // to carry `waived`. Asked of the shape so rewording the comment or renaming
    // the local leaves it green.
    const move = DRIVER.split(".update(")
      .map((c) => c.split("as never")[0].replace(/\s+/g, " "))
      .find((o) => o.includes("station: arrivedAt"));
    expect(move).toBeDefined();
    expect(move).toContain("waivedPatch");
  });

  it("writes it on the finishing branch too, not only on a move", () => {
    // A route can be declined and finish in the same tick. Persisting only on a
    // move would leave exactly the rows the acceptance query reads unmarked.
    const done = DRIVER.split(".update(")
      .map((c) => c.split("as never")[0].replace(/\s+/g, " "))
      .find((o) => o.includes('status: "done"'));
    expect(done).toBeDefined();
    expect(done).toContain("waivedPatch");
  });

  it("only writes when the route actually changed", () => {
    // An ordinary tick must keep writing the columns it always wrote. Comparing
    // against the route as READ is what makes this a patch rather than a
    // rewrite, and it is why a reopen persists as well as a decline.
    expect(DRIVER).toMatch(/const routeChanged =[\s\S]{0,120}onwardRoute\.waived/);
    expect(DRIVER).toMatch(/routeChanged \? \{ waived:/);
  });

  it("still builds the waivers from the decline, unchanged", () => {
    // The behaviour F-63 established is not what moved here. Only the record did.
    expect(DRIVER).toContain('reopensWhen: "outcome-contested"');
    expect(DRIVER).toMatch(/for \(const skipped of \["define", "design", "build", "ship"\]/);
  });
});
