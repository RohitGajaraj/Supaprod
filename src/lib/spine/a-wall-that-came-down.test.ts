/**
 * ── A WALL THAT CAME DOWN IS NOT A LOOP THAT WILL NOT CONVERGE ───────────────
 *
 * The packet's first acceptance criterion: the repair releases on the RECORD,
 * never on the hold word, and if it cannot tell the two populations apart on
 * production data it does not ship. `going-in-circles` is a TRUE reading of a
 * shape and loops that really do go in circles reach the same word honestly.
 *
 * THE FOUR PRODUCTION TRACKS ARE THE FIXTURE, with their real timestamps, so
 * this test IS the separation the criterion asks for rather than a claim about
 * one. Measured 2026-09-10 across every open track carrying a terminal hold
 * with any halted run.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import {
  mayRelease,
  newestRunIsAWalletHalt,
  wallIsNewerThanTheRelease,
  type ReleaseInput,
} from "./a-wall-that-came-down";

const PAID = 15238;

const base: ReleaseInput = {
  status: "open",
  lastHold: "going-in-circles",
  holdIsTerminal: true,
  newestRun: { status: "halted", haltedReason: "out_of_credit", at: "2026-09-04T05:30:05.472Z" },
  releasedAt: null,
  spendableCredits: PAID,
};
const at = (over: Partial<ReleaseInput>): ReleaseInput => ({ ...base, ...over });

describe("the two populations, told apart on the real rows", () => {
  it("releases 6cc7a010 and 0c0db8e6: twelve wallet halts and the newest run is one", () => {
    for (const stamp of ["2026-09-04T05:30:05.472Z", "2026-09-04T05:30:04.476Z"]) {
      const v = mayRelease(
        at({ newestRun: { status: "halted", haltedReason: "out_of_credit", at: stamp } }),
      );
      expect(v.release).toBe(true);
      // The report names the halt that justified it, per the packet's #2.
      expect(v.release && v.because).toContain(stamp);
      expect(v.release && v.because).toContain("15238");
    }
  });

  it("leaves a30238f5 alone: it has wallet halts, but something RAN after them", () => {
    /* Two `out_of_credit` halts on 2026-08-26 at 17:30, then a run at 02:30 the
       next day and the track still gave up. Fifteen hours separate them. The
       hold is about the work, and a rule keyed on "any wallet halt on the
       track" would have released it. */
    const v = mayRelease(
      at({
        lastHold: "given-up",
        newestRun: { status: "completed", haltedReason: null, at: "2026-08-27T02:30:28.994Z" },
      }),
    );
    expect(v.release).toBe(false);
    expect(v.release === false && v.why).toContain("not a wallet halt");
  });

  it("leaves bb405f6c alone: a terminal hold and no wallet halt anywhere", () => {
    const v = mayRelease(
      at({
        lastHold: "station-cannot-finish",
        newestRun: { status: "failed", haltedReason: null, at: "2026-08-25T06:30:02.011Z" },
      }),
    );
    expect(v.release).toBe(false);
  });

  it("leaves the abandoned ones alone whatever their runs say", () => {
    // cf1ba785 and 7977dc06 both carry wallet halts and are abandoned.
    const v = mayRelease(at({ status: "abandoned" }));
    expect(v.release).toBe(false);
    expect(v.release === false && v.why).toContain("abandoned");
  });
});

describe("one wall earns one release", () => {
  it("refuses a second release on the same halt", () => {
    const v = mayRelease(at({ releasedAt: "2026-09-10T00:00:00.000Z" }));
    expect(v.release).toBe(false);
    expect(v.release === false && v.why).toContain("already released");
  });

  it("allows one when the wall came back up after the release", () => {
    expect(
      wallIsNewerThanTheRelease(
        at({
          releasedAt: "2026-09-10T00:00:00.000Z",
          newestRun: {
            status: "halted",
            haltedReason: "out_of_credit",
            at: "2026-09-10T02:00:00.000Z",
          },
        }),
      ),
    ).toBe(true);
  });

  it("treats a never-released track as releasable", () => {
    expect(wallIsNewerThanTheRelease(at({ releasedAt: null }))).toBe(true);
  });
});

describe("credit is checked, not assumed", () => {
  it("refuses when the balance could not be read, rather than treating it as money", () => {
    const v = mayRelease(at({ spendableCredits: null }));
    expect(v.release).toBe(false);
    expect(v.release === false && v.why).toContain("could not be read");
  });

  it("refuses when the wall is still up, and says what the account holds", () => {
    const v = mayRelease(at({ spendableCredits: 0 }));
    expect(v.release).toBe(false);
    expect(v.release === false && v.why).toContain("still holds 0");
  });
});

/*
 * THE MIRROR (law 12). Every test above but one asserts a REFUSAL, and a rule
 * that refused everything would pass all of them and repair nothing. The
 * releasing case is asserted by name, and so is the predicate on its own.
 */
describe("and it still releases the case it exists for", () => {
  it("says yes to the shape the packet was written about", () => {
    expect(mayRelease(base).release).toBe(true);
    expect(newestRunIsAWalletHalt(base)).toBe(true);
  });

  it("the predicate is about the halt, not about the hold word", () => {
    // Same wallet halt under a DIFFERENT terminal hold still releases: the
    // discriminator is the record, which is the packet's first criterion.
    expect(mayRelease(at({ lastHold: "given-up" })).release).toBe(true);
  });
});

/**
 * ── THE WRITE, WHICH IS WHERE THE FIRST VERSION FAILED ───────────────────────
 *
 * `mayRelease` decides WHETHER; the update decides WHAT. The first version
 * cleared the hold alone, shipped, and did not work: both tracks were released
 * at 21:57:06 on 2026-09-09 and at the 22:00 tick they were deferred to 23:30
 * with `station_drives` still 12. A row had changed and the work was still
 * dead.
 *
 * The wall is recorded in three places and every one is a count of refusals at
 * the door. Clearing only the hold makes it WORSE than leaving it: the money
 * exemption in `decideDrive` keys on the hold, so erasing the hold turns the
 * exemption OFF while the drives ceiling still reads twelve.
 */
describe("the release clears everything the wall wrote, not just the word", () => {
  const DRIVER = readFileSync("src/lib/spine/driver.server.ts", "utf8");
  const at = DRIVER.indexOf("export async function releaseWalletStoppedTracks");
  const body = DRIVER.slice(at, DRIVER.indexOf("\nexport ", at + 10));

  it("clears the hold, the drive count, the seat and the deferral together", () => {
    expect(at).toBeGreaterThan(-1);
    const update = body.slice(body.indexOf(".update({"), body.indexOf('.eq("id", t.id)'));
    expect(update).toContain("last_hold: null");
    expect(update).toContain("station_drives: 0");
    expect(update).toContain("seat_cursor: 0");
    expect(update).toContain("deferred_until: null");
    expect(update).toContain("driven_at: null");
    expect(update).toContain("wallet_released_at:");
  });

  /*
   * THE MIRROR. Clearing everything on every track would be a different and
   * worse bug -- a genuine loop reset to zero drives loops twelve more times.
   * The write is only reachable through `mayRelease`, so the guard asserts the
   * gate is still in front of it.
   */
  it("is only reachable through the verdict, so a genuine loop is never reset", () => {
    const verdict = body.indexOf("const verdict = mayRelease(");
    const write = body.indexOf(".update({");
    expect(verdict).toBeGreaterThan(-1);
    expect(verdict).toBeLessThan(write);
    expect(body).toContain("if (!verdict.release) {");
  });
});
