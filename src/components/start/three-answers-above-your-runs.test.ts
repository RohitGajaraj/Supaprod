/**
 * FOUNDER, 00:08 2026-09-04: "today we have only the app saying that start, so
 * a lot of things are not in home."
 *
 * The rule every one of these holds: AN ALL-CLEAR NEEDS AN ANSWERED READ.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import {
  homeAnswers,
  waitingAnswer,
  arrivingAnswer,
  releasedAnswer,
  learnedAnswer,
} from "./three-answers-above-your-runs";

const code = (src: string): string =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

/** P-130: `releasedAnswer`/`homeAnswers` read a zone and a "now" instant.
 *  Fixed here so every test is deterministic regardless of the machine's
 *  own zone. */
const ZONE = "UTC";
const NOW = "2026-09-04T12:50:00.000Z";

/** Helio Labs, read from production 2026-09-04 (the P-56 shape). */
const HELIO = [
  { n: 21, label: "21 design gates" },
  { n: 10, label: "10 assumption challenges" },
  { n: 8, label: "8 decisions" },
];

describe("an all-clear needs an answered read", () => {
  it("says NOTHING when a read did not answer, never zero", () => {
    // The most expensive lie this surface can tell: a person who is told
    // nothing is waiting stops looking.
    expect(waitingAnswer(null)).toEqual({ read: "unread" });
    expect(learnedAnswer(null)).toEqual({ read: "unread" });
    expect(arrivingAnswer(null, "2026-09-01T00:00:00Z")).toEqual({ read: "unread" });
    expect(releasedAnswer(null, "2026-09-01T00:00:00Z", ZONE, NOW)).toEqual({ read: "unread" });
  });

  it("still speaks when the read answered and there is nothing", () => {
    // A home that says nothing at all is indistinguishable from a broken one.
    expect(waitingAnswer([])).toEqual({
      read: "answered-empty",
      line: "Nothing is waiting on your answer.",
    });
    expect(learnedAnswer(0).read).toBe("answered-empty");
    expect(arrivingAnswer(0, "2026-09-01T00:00:00Z").read).toBe("answered-empty");
    expect(releasedAnswer([], "2026-09-01T00:00:00Z", ZONE, NOW).read).toBe("answered-empty");
  });

  it("gives an empty answer no door, because there is nowhere to go", () => {
    for (const a of [
      waitingAnswer([]),
      learnedAnswer(0),
      arrivingAnswer(0, "2026-09-01T00:00:00Z"),
      releasedAnswer([], "2026-09-01T00:00:00Z", ZONE, NOW),
    ]) {
      expect(a).not.toHaveProperty("door");
    }
  });
});

describe("what is waiting on you", () => {
  it("names the largest family, not the total", () => {
    // "39 things" is a wall; "21 design gates" is where a person starts. Same
    // reasoning as the approvals heading, from the same shape (P-56).
    const a = waitingAnswer(HELIO);
    expect(a).toMatchObject({
      read: "answered",
      line: "21 design gates need you, and 18 other things.",
      door: { label: "Answer them", to: "/approvals" },
    });
  });

  it("drops the remainder clause when there is only one family", () => {
    expect(waitingAnswer([{ n: 1, label: "1 decision" }])).toMatchObject({
      line: "1 decision need you.",
    });
    expect(waitingAnswer([{ n: 3, label: "3 decisions" }])).toMatchObject({
      line: "3 decisions need you.",
    });
  });

  it("says 'thing' for a remainder of one", () => {
    expect(
      waitingAnswer([
        { n: 2, label: "2 decisions" },
        { n: 1, label: "1 spec" },
      ]),
    ).toMatchObject({ line: "2 decisions need you, and 1 other thing." });
  });
});

describe("what came in since you last looked", () => {
  it("counts from the person's own last look, never a rolling window", () => {
    const a = arrivingAnswer(4, "2026-09-01T00:00:00Z");
    expect(a).toMatchObject({
      read: "answered",
      line: "4 new findings since you last looked.",
      door: { label: "See them", to: "/arriving" },
    });
    // A clock would tell somebody back from a fortnight away about 24 hours.
    const src = code(readFileSync("src/lib/start/home-answers.functions.ts", "utf8"));
    expect(src).toContain("brain_last_seen");
    expect(src).toContain('arrivingQ.gt("created_at", lastLookedAt)');
  });

  it("treats never-looked as its own answer, not as zero", () => {
    // "Nothing new" would be false on a workspace full of findings.
    expect(arrivingAnswer(140, null)).toMatchObject({
      read: "answered",
      line: "140 findings are on the record. You have not looked yet.",
    });
    expect(arrivingAnswer(0, null)).toEqual({
      read: "answered-empty",
      line: "Nothing has come in yet.",
    });
  });

  it("withholds the count when the last look could not be read", () => {
    // A count is only usable when we know what it counted FROM: shown against
    // the wrong baseline it is worse than absent.
    const src = code(readFileSync("src/lib/start/home-answers.functions.ts", "utf8"));
    expect(src).toContain("arriving.error || seenFailed ? null");
  });

  it("gets the singular right", () => {
    expect(arrivingAnswer(1, "2026-09-01T00:00:00Z")).toMatchObject({
      line: "1 new finding since you last looked.",
    });
    expect(arrivingAnswer(1, null)).toMatchObject({
      line: "1 finding is on the record. You have not looked yet.",
    });
  });
});

/*
 * P-126 (A-QUEUE.md): the first live release on Ship (12:29 IST 09-04) --
 * *Checkout: Address confirmation streamlined.*, live at
 * cad-60000000-...deno.net -- was on Start nowhere. This is the fixture that
 * exact incident against: the sentence, its time, and the address as a link.
 */
describe("what went live since you last looked", () => {
  const RELEASE = {
    title: "Checkout: Address confirmation streamlined.",
    url: "https://cad-60000000.deno.net",
    releasedAt: "2026-09-04T12:28:00.000Z",
  };

  it("names the release, the UTC clock it went live at, and the address as a link", () => {
    expect(releasedAnswer([RELEASE], "2026-09-04T00:00:00.000Z", ZONE, NOW)).toEqual({
      read: "answered",
      line: "Checkout: Address confirmation streamlined. went live at 12:28.",
      door: { label: "Open it", href: "https://cad-60000000.deno.net" },
    });
  });

  it("names the newest release and counts the rest, plural", () => {
    const older = { ...RELEASE, title: "Older release", releasedAt: "2026-09-04T10:00:00.000Z" };
    const newer = { ...RELEASE, title: "Newer release", releasedAt: "2026-09-04T13:00:00.000Z" };
    expect(releasedAnswer([newer, older], "2026-09-04T00:00:00.000Z", ZONE, NOW)).toMatchObject({
      line: "Newer release went live at 13:00, and 1 other release.",
    });
  });

  it("says 'releases' for a remainder greater than one", () => {
    const a = { ...RELEASE, title: "A" };
    const b = { ...RELEASE, title: "B" };
    const c = { ...RELEASE, title: "C" };
    expect(releasedAnswer([a, b, c], "2026-09-04T00:00:00.000Z", ZONE, NOW)).toMatchObject({
      line: "A went live at 12:28, and 2 other releases.",
    });
  });

  it("treats never-looked as its own answer, not as zero", () => {
    expect(releasedAnswer([RELEASE], null, ZONE, NOW)).toMatchObject({ read: "answered" });
    expect(releasedAnswer([], null, ZONE, NOW)).toEqual({
      read: "answered-empty",
      line: "Nothing has shipped yet.",
    });
  });

  it("is a different sentence from arriving's own empty line, so the two never read as one fact", () => {
    const releasedEmpty = releasedAnswer([], "2026-09-04T00:00:00.000Z", ZONE, NOW);
    const arrivingEmpty = arrivingAnswer(0, "2026-09-04T00:00:00.000Z");
    expect(releasedEmpty).not.toEqual(arrivingEmpty);
  });

  /*
   * P-130 (A-QUEUE.md): a release named here can be from before today -- a
   * bare clock reading for one from two days ago would silently claim it
   * happened this morning. `answeredRelease` reads it day-aware through
   * `dateTimeInZone`, so it says so instead.
   */
  it("says yesterday, then a dated day, for a release from before today -- never a bare clock claiming it was this morning", () => {
    const yesterday = { ...RELEASE, releasedAt: "2026-09-03T12:28:00.000Z" };
    expect(releasedAnswer([yesterday], "2026-09-01T00:00:00.000Z", ZONE, NOW)).toMatchObject({
      line: "Checkout: Address confirmation streamlined. went live at yesterday 12:28.",
    });
    const lastWeek = { ...RELEASE, releasedAt: "2026-08-28T12:28:00.000Z" };
    expect(releasedAnswer([lastWeek], "2026-08-01T00:00:00.000Z", ZONE, NOW)).toMatchObject({
      line: "Checkout: Address confirmation streamlined. went live at Aug 28, 12:28.",
    });
  });

  it("reads the time through the given zone, not UTC", () => {
    // The same instant, a different zone: IST is UTC+5:30, so 12:28 UTC
    // reads as 17:58 there. A caller in the wrong zone would say 12:28 for
    // an instant that, to the person, happened at 17:58.
    expect(
      releasedAnswer([RELEASE], "2026-09-04T00:00:00.000Z", "Asia/Kolkata", NOW),
    ).toMatchObject({ line: "Checkout: Address confirmation streamlined. went live at 17:58." });
  });
});

describe("what the record learned this week", () => {
  it("uses a window, and says so in its own words", () => {
    expect(learnedAnswer(3)).toMatchObject({
      read: "answered",
      line: "3 calls came back this week and the record was re-scored.",
      door: { label: "Read them", to: "/outcomes" },
    });
    expect(learnedAnswer(1)).toMatchObject({
      line: "1 call came back this week and the record was re-scored.",
    });
  });
});

describe("the four, together", () => {
  it("keeps the order a person needs: what stops work, what is new, what shipped, what was learned", () => {
    // Released sits ahead of learned (P-126's own ordering rule: "ahead of
    // re-scored calls"); its own door carries `href`, not `to`, so the
    // release itself is checked by its line rather than folded into the
    // same `.to` projection as the three route-linked answers.
    const a = homeAnswers({
      waitingShape: HELIO,
      arrivingCount: 2,
      lastLookedAt: "2026-09-01T00:00:00Z",
      learnedCount: 1,
      releases: [
        {
          title: "Checkout: Address confirmation streamlined.",
          url: "https://cad-60000000.deno.net",
          releasedAt: "2026-09-01T12:28:00.000Z",
        },
      ],
      zone: ZONE,
      nowIso: NOW,
    });
    expect(a).toHaveLength(4);
    expect(a[0]).toMatchObject({ door: { to: "/approvals" } });
    expect(a[1]).toMatchObject({ door: { to: "/arriving" } });
    expect(a[2]).toMatchObject({ door: { href: "https://cad-60000000.deno.net" } });
    expect(a[3]).toMatchObject({ door: { to: "/outcomes" } });
  });

  it("keeps an unread one in the list, so a test can see which read failed", () => {
    // Dropped by the component, not here.
    const a = homeAnswers({
      waitingShape: null,
      arrivingCount: 2,
      lastLookedAt: "2026-09-01T00:00:00Z",
      learnedCount: 0,
      releases: [],
      zone: ZONE,
      nowIso: NOW,
    });
    expect(a).toHaveLength(4);
    expect(a[0]).toEqual({ read: "unread" });
  });

  it("renders nothing at all when no read answered", () => {
    const src = code(readFileSync("src/components/start/HomeAnswers.tsx", "utf8"));
    expect(src).toContain('answers.filter((a) => a.read !== "unread")');
    expect(src).toContain("if (shown.length === 0) return null;");
  });

  it("treats a PENDING read as unread on the surface, not as empty", () => {
    // The first frame saying "Nothing is waiting on your answer" before it has
    // looked is the same lie one tick earlier.
    const src = code(readFileSync("src/routes/_authenticated.start.tsx", "utf8"));
    expect(src).toContain("queueRead.isSuccess");
    expect(src).toContain("homeReads.isSuccess ? homeReads.data.arrivingCount : null");
  });

  it("reads the waiting shape from the approvals queue, never a second count", () => {
    const src = code(readFileSync("src/routes/_authenticated.start.tsx", "utf8"));
    expect(src).toContain("queueShape((queueRead.data?.items ?? []).map((i) => i.kindKey))");
  });
});
