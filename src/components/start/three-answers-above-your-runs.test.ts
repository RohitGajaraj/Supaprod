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
    expect(learnedAnswer(3, 3)).toMatchObject({
      read: "answered",
      // FIFTH REVIEW, 2026-09-09: same claim, the record's own noun. "Call" is
      // reserved for what waits on a person; this counts graded decision rows.
      line: "3 decisions came back this week and the record was re-scored.",
      door: { label: "Read them", to: "/outcomes" },
    });
    expect(learnedAnswer(1, 1)).toMatchObject({
      line: "1 decision came back this week and the record was re-scored.",
    });
  });

  it("does NOT claim a re-score when nothing was re-scored", () => {
    /*
     * The clause used to be part of the sentence unconditionally. Measured on
     * the founder's own workspace: the one decision that came back that week
     * carried no prior or new score, so nothing had moved and the entry said it
     * had. The evidence region directly under this line showed the SAME
     * decision with no re-score, and the two disagreed in one glance.
     */
    expect(learnedAnswer(1, 0)).toMatchObject({
      line: "1 decision came back this week.",
      door: { label: "Read them", to: "/outcomes" },
    });
    expect(learnedAnswer(3, 0)).toMatchObject({
      line: "3 decisions came back this week.",
    });
  });

  it("withholds the clause when the re-score read did not answer", () => {
    // Null is "we could not find out", and it must not be guessed in either
    // direction: the same rule the three answers already hold to.
    expect(learnedAnswer(2, null)).toMatchObject({
      line: "2 decisions came back this week.",
    });
    expect(learnedAnswer(2)).toMatchObject({
      line: "2 decisions came back this week.",
    });
  });

  it("still says nothing at all when the count itself is unread", () => {
    expect(learnedAnswer(null, 5).read).toBe("unread");
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
    /*
     * FIVE SINCE 2026-09-10, AND THE NEW ONE LEADS. "Your work moved" was in
     * none of these: they say what is WAITING, what ARRIVED, what SHIPPED and
     * what was LEARNED, and a run advancing a station is the one thing this
     * product exists to do. It goes first because a home that opens on what is
     * OWED when the product has just done something is the "dump of data"
     * reading of the page.
     *
     * `moved` is absent here, so it is unread and the four keep their order
     * behind it -- which is the property this test was written for and still
     * holds.
     */
    expect(a).toHaveLength(5);
    expect(a[0]).toEqual({ read: "unread" });
    expect(a[1]).toMatchObject({ door: { to: "/approvals" } });
    expect(a[2]).toMatchObject({ door: { to: "/arriving" } });
    expect(a[3]).toMatchObject({ door: { href: "https://cad-60000000.deno.net" } });
    expect(a[4]).toMatchObject({ door: { to: "/outcomes" } });
  });

  it("leads with what moved when something did, ahead of what is owed", () => {
    const a = homeAnswers({
      waitingShape: HELIO,
      arrivingCount: 2,
      lastLookedAt: "2026-09-01T00:00:00Z",
      learnedCount: 1,
      releases: [],
      moved: {
        kind: "one",
        title: "Warn a homeowner before a visit is cancelled",
        station: "Design",
      },
      zone: ZONE,
      nowIso: NOW,
    });
    expect(a[0]).toMatchObject({
      read: "answered",
      line: "Warn a homeowner before a visit is cancelled reached Design.",
    });
    /* The debt is still there, one line down. Leading with the news does not
       mean hiding what is waiting. */
    expect(a[1]).toMatchObject({ door: { to: "/approvals" } });
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
    expect(a).toHaveLength(5);
    /* `moved` unread at 0, and the refused `waitingShape` unread at 1: both
       stay in the list so a test can see WHICH read failed. */
    expect(a[0]).toEqual({ read: "unread" });
    expect(a[1]).toEqual({ read: "unread" });
  });

  it("renders nothing at all when no read answered", () => {
    const src = code(readFileSync("src/components/start/HomeAnswers.tsx", "utf8"));
    expect(src).toContain('answers.filter((a) => a.read !== "unread")');
    expect(src).toContain("if (shown.length === 0) return null;");
  });

  it("treats a PENDING read as unread on the surface, not as empty", () => {
    // The first frame saying "Nothing new since you looked" before it has
    // looked is the same lie one tick earlier.
    const src = code(readFileSync("src/routes/_authenticated.start.tsx", "utf8"));
    expect(src).toContain("homeReads.isSuccess ? homeReads.data.arrivingCount : null");
  });

  it("says what is waiting ONCE, in the hero, off the queue the Inbox page and the rail row read", () => {
    /*
     * Lane 1, 2026-09-08. The home used to read the approvals queue for a
     * fourth sentence above the rows. Then it read only the rows, and the
     * Inbox page said six calls were waiting while the hero said nothing
     * was. Now the hero, the rail's Inbox row and the Inbox page read
     * getApprovalsQueue under one shell key; HomeAnswers composes no waiting
     * sentence of its own.
     */
    const src = code(readFileSync("src/routes/_authenticated.start.tsx", "utf8"));
    const shell = code(readFileSync("src/components/shell/AppFrame.tsx", "utf8"));
    expect(src).toContain("waitingShape: null");
    expect(src).toContain('[...APPROVALS_QUEUE_PREFIX, "shell", activeWorkspaceId ?? null]');
    expect(shell).toContain('[...APPROVALS_QUEUE_PREFIX, "shell", wsKey]');
    expect(shell).toContain("gates: waitingCount ?? gateCount,");
    expect(src).toContain('.filter((a) => a.read === "answered")');
  });
});

/*
 * ── A REGION'S NAME MUST DESCRIBE WHAT IS IN IT ───────────────────────────
 *
 * This section was called "What needs you", and on 2026-09-10 it began leading
 * with *"Warn a homeowner before an installer visit is cancelled reached
 * Build."* — which needs nobody.
 *
 * The name was already loose: what ARRIVED, what SHIPPED and what was LEARNED
 * need nobody either. Only the waiting line ever did. Adding a fourth kind made
 * it plainly wrong, and a screen reader announces the region before anything
 * inside it — so the first thing a person using one heard was a promise the
 * contents do not keep.
 *
 * What every line shares is the CLOCK, not an obligation.
 */
describe("the region is named for what it holds", () => {
  const SRC = readFileSync("src/components/start/HomeAnswers.tsx", "utf8");
  const codeOnly = code(SRC);

  it("does not promise that everything inside needs a person", () => {
    expect({ promises: codeOnly.includes("What needs you") }).toEqual({ promises: false });
  });

  it("names the one thing every line actually shares", () => {
    expect(codeOnly).toContain('aria-label="Since you last looked"');
  });

  it("still labels the region at all", () => {
    /* THE MIRROR. The first assertion passes by finding nothing, so deleting
       the label entirely would read as an improvement — and an unlabelled
       region is worse than a wrongly-labelled one for the reader who most
       depends on it. */
    expect(codeOnly).toContain("aria-label=");
  });
});
