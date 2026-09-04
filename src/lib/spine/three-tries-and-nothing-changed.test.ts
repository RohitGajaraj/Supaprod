/**
 * 5,398 CREDITS IN ONE NIGHT FOR FIVE SENTENCES.
 *
 * One track churned Build to Ship every ten minutes on a fault that was not the
 * crew's. Since the regrant, 2,566 more in under three hours, 2,469 of them on
 * `agent`, and 36 of 47 runs belonged to a probe workspace whose five tracks
 * had nothing left to prove -- deferred by hand at 07:02 UTC.
 *
 * Every existing ceiling behaved exactly as designed while that happened, which
 * is why this counts neither attempts nor dispatches: it asks whether the last
 * three drives changed anything.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import {
  BACKOFF_MINUTES,
  deferUntil,
  NEVER_BACKED_OFF,
  DRIVES_BEFORE_BACKOFF,
  stuckBackoffMinutes,
  triedAgainLine,
  type DriveEntry,
} from "@/lib/spine/three-tries-and-nothing-changed";

const NOW = new Date("2026-09-04T12:30:00Z");
const minsAgo = (n: number) => new Date(NOW.getTime() - n * 60_000).toISOString();

/** Newest first, as the reader supplies them. */
const drives = (holds: (string | null)[]): DriveEntry[] =>
  holds.map((hold, i) => ({ hold, at: minsAgo(i * 10) }));

describe("three drives, nothing to show for them", () => {
  it("backs off after three fruitless drives", () => {
    const m = stuckBackoffMinutes({
      recent: drives(["self-check-failed", "self-check-failed", "self-check-failed"]),
      newestArtifactAt: null,
    });
    expect(m).toBe(BACKOFF_MINUTES[0]);
  });

  it("climbs the ladder as the same hold keeps coming back", () => {
    const same = (n: number) => drives(Array.from({ length: n }, () => "out-of-time"));
    expect(stuckBackoffMinutes({ recent: same(3), newestArtifactAt: null })).toBe(10);
    expect(stuckBackoffMinutes({ recent: same(4), newestArtifactAt: null })).toBe(30);
    expect(stuckBackoffMinutes({ recent: same(5), newestArtifactAt: null })).toBe(90);
    // The last rung repeats rather than growing without bound.
    expect(stuckBackoffMinutes({ recent: same(9), newestArtifactAt: null })).toBe(90);
  });

  it("does nothing before the third", () => {
    expect(
      stuckBackoffMinutes({
        recent: drives(["out-of-time", "out-of-time"]),
        newestArtifactAt: null,
      }),
    ).toBeNull();
  });

  it("catches the churn that alternates, which is the churn that happened", () => {
    /*
     * ── THE MEASUREMENT THAT CHANGED THE RULE (P-113b) ──────────────────
     * The first version required the three drives to share a hold. Simulated
     * against the night it was written for -- the tablet track, 26 drives, 11
     * runs, $0.3971 -- it prevented TWO drives and saved 8%, because the churn
     * alternates. This exact sequence appears four times in the last hour of
     * that window and the same-hold rule fired on none of them.
     */
    expect(
      stuckBackoffMinutes({
        recent: drives(["self-check-failed", "out-of-time", "self-check-failed"]),
        newestArtifactAt: null,
      }),
    ).toBe(BACKOFF_MINUTES[0]);
  });

  it("the run ends at a drive that MOVED, so the count starts again", () => {
    // A track that got somewhere is not spending for nothing, whatever it did
    // before or does next.
    expect(
      stuckBackoffMinutes({
        recent: drives(["out-of-time", null, "out-of-time", "out-of-time"]),
        newestArtifactAt: null,
      }),
    ).toBeNull();
  });

  it("and at a hold this rule does not price", () => {
    // Waiting on a person costs nothing, so the drives before it are not a run
    // of spending -- the same statement as "it moved", for pricing purposes.
    expect(
      stuckBackoffMinutes({
        recent: drives(["out-of-time", "waiting-on-a-person", "out-of-time", "out-of-time"]),
        newestArtifactAt: null,
      }),
    ).toBeNull();
  });

  it("does nothing for a track that is moving", () => {
    expect(
      stuckBackoffMinutes({ recent: drives([null, null, null]), newestArtifactAt: null }),
    ).toBeNull();
  });
});

describe("a track that filed something is working, whatever hold it keeps hitting", () => {
  it("is left alone when an artifact landed inside the window", () => {
    /*
     * Build committing to the same branch across three drives enters on the
     * same hold each time and is making progress every time. Backing that off
     * would slow down work that is working.
     */
    expect(
      stuckBackoffMinutes({
        recent: drives(["self-check-failed", "out-of-time", "self-check-failed"]),
        newestArtifactAt: minsAgo(5),
      }),
    ).toBeNull();
  });

  it("but an artifact from BEFORE the window is not progress now", () => {
    expect(
      stuckBackoffMinutes({
        recent: drives(["self-check-failed", "self-check-failed", "self-check-failed"]),
        newestArtifactAt: minsAgo(600),
      }),
    ).toBe(BACKOFF_MINUTES[0]);
  });
});

describe("the holds that spend nothing are never touched", () => {
  for (const hold of ["waiting-on-a-person", "the-call-is-yours", "needs-evidence"]) {
    it(`${hold} is left alone`, () => {
      /*
       * The first two are a person's to answer and the sweep already excludes
       * them, so deferring would only delay the moment it notices they
       * answered. The third owns `deferred_until` for its own horizon, and two
       * rules writing one date is two rules arguing.
       */
      expect(NEVER_BACKED_OFF.has(hold)).toBe(true);
      expect(
        stuckBackoffMinutes({ recent: drives([hold, hold, hold]), newestArtifactAt: null }),
      ).toBeNull();
    });
  }
});

describe("what the card says", () => {
  it("names the count and the time it comes back, same day", () => {
    const said = triedAgainLine(deferUntil(10, NOW), NOW, { zone: "UTC" });
    /* "and nothing changed", never "with the same result": the three drives may
       have stopped on different holds, and claiming they were identical is a
       sentence the record does not support. */
    expect(said).toContain(`Tried ${DRIVES_BEFORE_BACKOFF} times and nothing changed`);
    expect(said).not.toContain("same result");
    expect(said).toContain("at 12:40");
  });

  it("names the day, not the clock, for a retry that lands on a later day (P-143)", () => {
    const said = triedAgainLine("2026-09-21T00:00:00Z", NOW, { zone: "UTC" });
    expect(said).toContain(`Tried ${DRIVES_BEFORE_BACKOFF} times and nothing changed`);
    expect(said).toContain("on Sep 21");
    expect(said).not.toContain("00:00");
  });

  it("says the calendar wait's own sentence, not a false retry claim, when the deferral is the forecast horizon (P-143)", () => {
    const said = triedAgainLine("2026-09-21T00:00:00Z", NOW, {
      zone: "UTC",
      isForecastHorizon: true,
    });
    expect(said).toBe("Learn returns on Sep 21.");
    expect(said).not.toContain("Tried");
  });

  it("reads the person's own zone, not UTC, for both the clock and the day", () => {
    /* 2026-09-04T23:15:00Z is still Sep 4 in UTC but already Sep 5 in
       Kolkata (UTC+5:30) -- a zone-blind formatter would call this "today". */
    const said = triedAgainLine("2026-09-04T23:15:00Z", NOW, { zone: "Asia/Kolkata" });
    expect(said).toContain("on Sep 5");
  });

  it("says nothing once the wait is over, so a stale row cannot claim one", () => {
    expect(triedAgainLine(minsAgo(5), NOW)).toBeNull();
    expect(triedAgainLine(null, NOW)).toBeNull();
    expect(triedAgainLine("not a date", NOW)).toBeNull();
  });
});

describe("the sweep applies it where a slot is actually spent", () => {
  const TICK = readFileSync("src/routes/api/public/hooks/track-tick.ts", "utf8")
    /* Comments first: the explanation names the very calls it describes. */
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^\s*\/\/.*$/gm, " ");

  it("defers in eligibility rather than at one of the driver's fourteen exits", () => {
    expect(TICK).toContain("stuckBackoffMinutes({");
    expect(TICK).toContain("stuckAway");
  });

  it("the deferred tracks are excluded from this tick, not merely marked", () => {
    expect(TICK).toContain("...scheduledAway, ...unchanged, ...stuckAway");
  });

  it("a read that failed defers nobody", () => {
    /*
     * The one direction this rule must not fail in. Holding work back on
     * evidence we could not gather costs the work rather than the money, and
     * the money is the only thing it was built to save.
     */
    expect(TICK).toContain("if (!drivesErr)");
  });

  it("and a person's press still clears it, wherever the drive came from", () => {
    const DRIVER = readFileSync("src/lib/spine/driver.server.ts", "utf8");
    // One write, on the way in, so no exit can forget it.
    expect(DRIVER).toContain("deferred_until: null");
  });
});
