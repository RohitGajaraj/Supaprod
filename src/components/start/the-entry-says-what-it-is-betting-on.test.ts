/**
 * ── THE REGION FOR THE STATE ALMOST EVERY REAL WORKSPACE IS IN ────────────
 *
 * `WhetherItWorked` answers the founder's *"I cannot feel the value"* with the
 * newest closed loop. Measured on the live database 2026-09-09, it cannot draw
 * for him:
 *
 *   Every workspace holding a graded outcome is a seed or a sample.
 *   His two own workspaces hold 16 runs between them and ZERO.
 *   Of those 16, two reached Learn and wait on a forecast date; fourteen
 *   stopped at a hold.
 *
 * Lane 2's funnel over all 121 tracks ever made agrees from the other side:
 * one has shipped, two have reached a learning, 82 stand at station one.
 *
 * So the entry said nothing about value at all on either of his workspaces --
 * a debt count, a composer, a road and a list, every one of them about what is
 * owed or what exists. This is what the record CAN say in that state, and it
 * draws where it is needed: 10 open bets on "My workspace", soonest due in
 * three days; 6 on "A1 delete probe", soonest in two.
 *
 * What these pin is not the wording. It is the four calls that make this
 * evidence rather than reassurance: a result always outranks a promise, the
 * machine's words reach the screen unedited, a bet with no readable date says
 * nothing at all, and a seed says so.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { dueIn, theBetStillOpen } from "@/components/start/the-bet-still-open";
import type { OpenBet } from "@/lib/start/home-answers.functions";

const NOW = "2026-09-09T12:00:00Z";
/*
 * A ZONE THAT IS NOT UTC, DELIBERATELY. A horizon is stored at midnight UTC
 * and this repo's own box is IST; the first version of this shape formatted
 * with no zone at all and a guard caught it. Reading these in Asia/Kolkata is
 * what makes the day counts here mean anything: in UTC every one of them
 * would pass even if the zone were being ignored.
 */
const ZONE = "Asia/Kolkata";

const BET: OpenBet = {
  decisionTitle: "Do not add second delivery address for holiday homes",
  claim:
    "Fewer than 0.2% of homeowners will attempt to use a second saved address in the first 30 days after launch.",
  howWeWillKnow: "Measured by click events on the saved-address picker, reported weekly.",
  horizon: "2026-09-11T00:00:00Z",
  isSample: false,
};

describe("a result outranks a promise", () => {
  it("draws nothing when a loop has closed, however good the open bet is", () => {
    // The two regions are siblings in one slot. Both drawing would put a
    // verdict and a prediction about different work side by side, and the
    // reader would have to work out which one is the answer.
    expect(
      theBetStillOpen({ openBet: BET, closed: { verdict: "missed" }, nowIso: NOW, zone: ZONE }),
    ).toBeNull();
  });

  it("draws when there is a bet and no result yet", () => {
    expect(theBetStillOpen({ openBet: BET, closed: null, nowIso: NOW, zone: ZONE })?.claim).toBe(
      BET.claim,
    );
  });

  it("draws nothing when there is no bet either", () => {
    expect(theBetStillOpen({ openBet: null, closed: null, nowIso: NOW, zone: ZONE })).toBeNull();
  });
});

describe("the machine's words reach the screen unedited", () => {
  it("passes the claim and the observable through verbatim", () => {
    const out = theBetStillOpen({ openBet: BET, closed: null, nowIso: NOW, zone: ZONE });
    expect(out?.claim).toBe(BET.claim);
    expect(out?.howWeWillKnow).toBe(BET.howWeWillKnow);
  });

  it("keeps the claim when the record carries no observable", () => {
    // A forecast with no stated signal is weaker and still real. The shape
    // says less rather than inventing the half that is missing.
    const out = theBetStillOpen({
      openBet: { ...BET, howWeWillKnow: null },
      closed: null,
      nowIso: NOW,
      zone: ZONE,
    });
    expect(out?.claim).toBe(BET.claim);
    expect(out?.howWeWillKnow).toBeNull();
  });

  it("says nothing at all when the claim is blank", () => {
    expect(
      theBetStillOpen({ openBet: { ...BET, claim: "   " }, closed: null, nowIso: NOW, zone: ZONE }),
    ).toBeNull();
  });
});

describe("the date is a date and a distance, and never a guess", () => {
  it("names both, because each does a job the other cannot", () => {
    // The date goes in a calendar; the distance changes whether you wait.
    const out = theBetStillOpen({ openBet: BET, closed: null, nowIso: NOW, zone: ZONE });
    expect(out?.inWords).toBe("in 2 days");
    expect(out?.due).toContain("Sep");
  });

  it("says today and tomorrow in words, because a reader should not subtract", () => {
    // 20:30 on the 9th in Asia/Kolkata: the same calendar day as NOW there.
    expect(dueIn("2026-09-09T15:00:00Z", NOW, ZONE).inWords).toBe("today");
    expect(dueIn("2026-09-10T12:00:00Z", NOW, ZONE).inWords).toBe("tomorrow");
    /*
     * AND THE CASE THAT PROVES THE ZONE IS READ AT ALL. 23:00 UTC on the 9th
     * is 04:30 on the TENTH in Asia/Kolkata, so a person there is right to be
     * told tomorrow. By elapsed milliseconds it is eleven hours away and would
     * read as today, which is the wrong day for a date the product commits to.
     * This assertion fails if the zone is ever dropped again.
     */
    expect(dueIn("2026-09-09T23:00:00Z", NOW, ZONE).inWords).toBe("tomorrow");
  });

  it("rounds to weeks past a fortnight, and never to months", () => {
    // "in 43 days" is a number a reader converts. A month would lose the week
    // the commitment was actually set for.
    expect(dueIn("2026-10-22T12:00:00Z", NOW, ZONE).inWords).toBe("in about 6 weeks");
    expect(dueIn("2026-09-20T12:00:00Z", NOW, ZONE).inWords).toBe("in 11 days");
  });

  it("draws nothing at all when the horizon cannot be read", () => {
    /*
     * A bet that cannot say when you will know is the reassurance this region
     * exists to avoid: "it is being measured" with no date is exactly the
     * shape of claim the product must never make about itself.
     */
    expect(
      theBetStillOpen({
        openBet: { ...BET, horizon: "not a date" },
        closed: null,
        nowIso: NOW,
        zone: ZONE,
      }),
    ).toBeNull();
  });

  it("still draws when the horizon has somehow passed, with the date and no distance", () => {
    // The read only asks for future horizons, so this is a clock skew or a
    // stale render rather than a state. It degrades to the fact it can still
    // stand behind rather than printing "in -3 days".
    const out = theBetStillOpen({
      openBet: { ...BET, horizon: "2026-09-06T00:00:00Z" },
      closed: null,
      nowIso: NOW,
      zone: ZONE,
    });
    expect(out?.inWords).toBeNull();
    expect(out?.due).toContain("Sep");
  });
});

describe("a seed bet says so", () => {
  it("marks a sample row so it is never read as the founder's own", () => {
    // Three metrics proving this product worked were all seed data once, and
    // nobody could tell.
    expect(
      theBetStillOpen({
        openBet: { ...BET, isSample: true },
        closed: null,
        nowIso: NOW,
        zone: ZONE,
      })?.isSample,
    ).toBe(true);
  });
});

describe("the region as it is drawn", () => {
  const SRC = readFileSync(join(import.meta.dir, "BetStillOpen.tsx"), "utf8");

  it("says the sample in WORDS, never only in a colour", () => {
    expect(SRC).toContain("From the sample workspace");
  });

  it("wears no status colour, because a bet has no verdict yet", () => {
    /*
     * Its sibling carries the one status chip in that column, because a
     * verdict IS a status. Painting this amber for "pending" would invent a
     * state the record does not hold, and Meridian's rule is that colour
     * carries status and never decorates.
     */
    expect(SRC).not.toContain("StatusChip");
    for (const hue of ["mrd-hold", "mrd-fail", "mrd-pass", "mrd-you"]) {
      expect({ hue, used: SRC.includes(hue) }).toEqual({ hue, used: false });
    }
  });

  it("puts no number in display type: the ladder here stops at base", () => {
    for (const big of ["text-mrd-h1", "text-mrd-h2", "text-mrd-h3", "sp-num"]) {
      expect({ big, used: SRC.includes(big) }).toEqual({ big, used: false });
    }
  });

  it("offers ONE door, the same one its sibling offers", () => {
    const doors = [...SRC.matchAll(/to="(\/[^"]*)"/g)].map((m) => m[1]);
    expect(doors).toEqual(["/outcomes"]);
  });
});

describe("the home mounts it, and pays for no extra read", () => {
  const ROUTE = readFileSync(
    join(import.meta.dir, "..", "..", "routes", "_authenticated.start.tsx"),
    "utf8",
  );

  it("is mounted beside its sibling", () => {
    expect(ROUTE).toContain("<BetStillOpen");
    expect(ROUTE.indexOf("<BetStillOpen")).toBeGreaterThan(ROUTE.indexOf("<WhetherItWorked"));
  });

  it("reads the home-answers query and opens no second one", () => {
    // The home's largest read ran four times on one arrival once (F-216). A
    // new region is not a reason for a new request, and `openBet` rides the
    // batch the three answers already issue.
    const call = ROUTE.match(/const betOpen = theBetStillOpen\(\{[\s\S]*?\}\);/);
    expect(call, "the shape call moved; re-point this test").not.toBeNull();
    expect(call![0]).toContain("homeReads.data.openBet");
    expect(call![0]).toContain("homeReads.data.closed");
  });
});
