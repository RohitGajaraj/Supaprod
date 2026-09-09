/**
 * THE HERO SAYS THE ONE THING THAT DISCRIMINATES, IN THIS ORDER: what needs
 * you, what stopped, what is moving, then the invitation. Seen live on
 * 2026-09-08: four runs held at Build and Ship under a hero that said nothing
 * was waiting. A negation over a stopped run is the false all-clear the
 * shell's honesty rule exists to prevent.
 */
/* `test` was never imported, so the placeholderFor block below raised
   "test is not defined" and its pin never ran (found while landing the fourth
   review, 2026-09-09). */
import { describe, expect, it, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { heroCopy } from "./Hero";

const base = {
  status: "open" as const,
  needsYou: null,
  working: null,
  station: "build" as const,
  holdReason: null,
  holdBecause: null,
  produced: [],
  forecast: null,
  drivenAt: "2026-09-08T00:00:00Z",
};

describe("heroCopy", () => {
  it("invites when nothing has ever run, and never counts an unread list", () => {
    expect(heroCopy({ product: "Prism", runs: undefined }).title).toBe(
      "What should Prism do next?",
    );
    /* The first home does not repeat the first run screen: unread still
       invites with the promise, but a workspace that has never run asks for
       the FIRST thing and points at the three sentences below it. */
    const first = heroCopy({ product: "Prism", runs: [] });
    expect(first.title).toBe("What should Prism do first?");
    expect(first.line).toContain("Say it in one sentence");
  });

  it("says a REFUSED runs read refused, rather than drawing the first visit over it", () => {
    /* Fourth review, 2026-09-09: a failed cold read gave a workspace with a
       year of runs the onboarding promise in the hero and the starter cards
       under it, with one line lower down admitting the list did not load. */
    const failed = heroCopy({ product: "Prism", runs: undefined, failed: true });
    expect(failed.title).toBe("What should Prism do next?");
    expect(failed.line).not.toContain("Say it in one sentence");
    expect(failed.line).toContain("could not be read");
  });

  it("leads with what needs a person", () => {
    const c = heroCopy({
      product: "Prism",
      runs: [
        { ...base, needsYou: { tool: "studio.pr.merge" } },
        { ...base, working: { seat: "Scribe", since: "", tool: null } },
      ],
    });
    expect(c.title).toBe("1 run needs you.");
    expect(c.line).toContain("1 run is moving on its own");
  });

  it("counts a run stopped on a condition a person must look at, and never calls it quiet", () => {
    const c = heroCopy({
      product: "Prism",
      runs: [
        { ...base, holdReason: "going-in-circles" },
        { ...base, holdReason: "stalled" },
        { ...base, station: "learn", holdBecause: "The forecast comes due on 2026-10-03." },
      ],
    });
    expect(c.title).toBe("2 runs have stopped.");
    expect(c.line).not.toContain("Nothing");
  });

  it("leads with the queue's number when the Inbox holds more than the runs carry", () => {
    const c = heroCopy({
      product: "Prism",
      runs: [{ ...base, holdReason: "going-in-circles" }],
      waiting: 6,
    });
    expect(c.title).toBe("6 calls are waiting for you.");
    expect(c.line).toContain("Inbox");
  });

  it("names the largest family, as the Inbox page does, rather than a raw total", () => {
    const c = heroCopy({
      product: "Prism",
      runs: [],
      waiting: 53,
      waitingShape: [
        { n: 20, label: "20 design gates" },
        { n: 12, label: "12 assumption challenges" },
      ],
    });
    expect(c.title).toBe("20 design gates and 33 other calls are waiting for you.");
    expect(
      heroCopy({
        product: "Prism",
        runs: [],
        waiting: 2,
        waitingShape: [{ n: 2, label: "2 decisions" }],
      }).title,
    ).toBe("2 decisions are waiting for you.");
  });

  it("says how many are moving when nothing needs a person", () => {
    const c = heroCopy({
      product: null,
      runs: [{ ...base, working: { seat: "Scribe", since: "", tool: null } }],
    });
    expect(c.title).toBe("1 run is moving.");
  });

  it("calls a seat quiet past the stall threshold, as the strip, the row and the mark do", () => {
    /* Fourth review, 2026-09-09: every other surface on the page called the
       seat quiet for 42 min and stopped its clock; the largest type on the
       page still said it was moving. */
    const seat = {
      seat: "Scribe",
      since: "2026-09-08T00:00:00Z",
      tool: null,
      lastCallAt: "2026-09-08T00:00:00Z",
    };
    const quiet = heroCopy({
      product: "Prism",
      runs: [{ ...base, working: seat }],
      waiting: 0,
      nowMs: Date.parse("2026-09-08T00:45:00Z"),
    });
    expect(quiet.title).toBe("1 run has gone quiet.");
    expect(quiet.line).toContain("45 min");
    expect(quiet.line).not.toContain("moving");
    /* Five minutes after its last call the same seat is still moving. */
    const moving = heroCopy({
      product: "Prism",
      runs: [{ ...base, working: seat }],
      waiting: 0,
      nowMs: Date.parse("2026-09-08T00:05:00Z"),
    });
    expect(moving.title).toBe("1 run is moving.");
  });

  it("counts a terminal hold with the stopped, not with the moving or the quiet", () => {
    /* `given-up` is the person's to restart (the driver's own set) and draws
       in the you hue; it is still a stopped run on this line. */
    const c = heroCopy({
      product: "Prism",
      runs: [{ ...base, holdReason: "given-up" }],
      waiting: 0,
    });
    expect(c.title).toBe("1 run has stopped.");
    expect(c.line).not.toContain("1 run has stopped");
  });

  it("falls back to the invitation, in the product's name, when everything is settled", () => {
    /* The all-clear is earned by an answered queue: `waiting: 0` is the
       queue saying nothing is there (fourth review, 2026-09-09). */
    const c = heroCopy({ product: "Prism", runs: [{ ...base, status: "done" }], waiting: 0 });
    expect(c.title).toBe("What should Prism do next?");
    expect(c.line).toContain("Nothing you started");
  });

  it("never turns an unread or refused queue into an all-clear", () => {
    /* Fourth review, 2026-09-09: null fell to 0 and the line said nothing was
       waiting on a read that never answered, the most expensive lie this
       surface can tell. */
    const unread = heroCopy({
      product: "Prism",
      runs: [{ ...base, status: "done" }],
      waiting: null,
    });
    expect(unread.title).toBe("What should Prism do next?");
    expect(unread.line).not.toContain("Nothing");
    expect(unread.line).toContain("could not be read");
    const moving = heroCopy({
      product: "Prism",
      runs: [{ ...base, working: { seat: "Scribe", since: "", tool: null } }],
      waiting: null,
    });
    expect(moving.title).toBe("1 run is moving.");
    expect(moving.line).toContain("could not be read");
  });

  it("carries the Inbox's own caveat when the queue answered short", () => {
    const caveat = "Part of your queue did not load, so this is not everything waiting on you.";
    const c = heroCopy({
      product: "Prism",
      runs: [{ ...base, holdReason: "going-in-circles" }],
      waiting: 31,
      queueShort: caveat,
    });
    expect(c.title).toBe("31 calls are waiting for you.");
    expect(c.line).toContain(caveat);
    /* And with nothing counted, the all-clear gives way to the caveat. */
    const settled = heroCopy({
      product: "Prism",
      runs: [{ ...base, status: "done" }],
      waiting: 0,
      queueShort: caveat,
    });
    expect(settled.line).not.toContain("Nothing you started");
    expect(settled.line).toContain(caveat);
  });
});

describe("placeholderFor", () => {
  test("a goal that opens with a verb follows Help <name>; an outcome sentence does not", async () => {
    const { placeholderFor } = await import("@/routes/_authenticated.start");
    expect(
      placeholderFor({
        name: "Prism",
        northStar: "Get 40% of active users to a funded savings goal.",
      }),
    ).toBe("Help Prism get 40% of active users to a funded savings goal");
    /* Seen live on Relay, 2026-09-08: "Help Relay every homeowner understands
       their energy use" is not a sentence. An outcome falls to the plain frame. */
    expect(
      placeholderFor({
        name: "Relay",
        northStar: "Every homeowner understands their energy use at a glance",
      }),
    ).toBe("Change one thing in Relay, and say what it should do");
    expect(placeholderFor(null)).toBe("Make the checkout accept an American Express card");
  });
});

/*
 * ── THE CALLS LINE SAYS ONE DIRECTION AND AT MOST ONE FACT ────────────────
 *
 * Read on the served entry (deployment 99f5076a, 2026-09-09), A1 delete probe:
 *
 *   4 design gates and 2 other calls are waiting for you.
 *   Start with "Mission completed: Show homeowner installer arrival window on
 *   order page". Answer them in Inbox, or on the runs below that carry them.
 *   2 runs have stopped. Open Inbox
 *
 * Four clauses and three subjects wrapping to two lines. The stored title was
 * fixed at its writer (`handoff.server.ts`); this pins the shape of the line
 * that carried it, because nothing did and the branch was free to grow a
 * fourth clause again.
 */
describe("the line under a calls headline", () => {
  const seat = {
    seat: "Scribe",
    since: "2026-09-08T00:00:00Z",
    tool: null,
    lastCallAt: "2026-09-08T00:00:00Z",
  };
  const callsWaiting = (extra: Record<string, unknown> = {}) =>
    heroCopy({
      product: "Prism",
      runs: [
        { ...base, holdReason: "given-up" },
        { ...base, holdReason: "given-up" },
        { ...base, working: seat },
      ],
      waiting: 6,
      waitingFirst: "Show homeowner installer arrival window on order page",
      nowMs: Date.parse("2026-09-08T00:45:00Z"),
      ...extra,
    });

  it("leads with the one call to start with, and drops the layout sentence", () => {
    const c = callsWaiting();
    expect(c.line).toStartWith(
      'Start with "Show homeowner installer arrival window on order page".',
    );
    // The door below is labelled "Open Inbox" and the runs are visibly below.
    expect(c.line).not.toContain("Answer them in Inbox");
    expect(c.door?.label).toBe("Open Inbox");
  });

  it("carries at most ONE run fact, never a tally joined by semicolons", () => {
    const c = callsWaiting();
    expect(c.line).not.toContain(";");
    expect(c.line).toContain("1 run has gone quiet");
    expect(c.line).not.toContain("2 runs have stopped");
  });

  it("leaves STOPPED to the road, which names the station and says what it means", () => {
    /*
     * Read together on the served entry, about 200px apart:
     *
     *   hero:  "...2 runs have stopped. Open Inbox"
     *   road:  "Design has stopped, and will not move without you."
     *
     * The road's version names WHICH station and what it means; the hero could
     * only ever count. And on a headline whose subject is CALLS WAITING, a
     * tally of runs is a second subject.
     */
    const stoppedOnly = heroCopy({
      product: "Prism",
      runs: [
        { ...base, holdReason: "given-up" },
        { ...base, holdReason: "given-up" },
      ],
      waiting: 6,
      waitingFirst: "Show homeowner installer arrival window on order page",
    });
    expect(stoppedOnly.line).not.toContain("stopped");
    expect(stoppedOnly.line).toStartWith('Start with "Show homeowner');
  });

  it("still says QUIET, because the road has no state for it", () => {
    /*
     * THE MIRROR, and it is why this is a filter and not a deletion. A seat
     * that has gone quiet mid-turn is still `working` on the map and its
     * station looks alive, so the hero is the only place it can be said -- and
     * a quiet seat may still be spending, which is why this file ranks it
     * above stopped in the first place.
     */
    const quietOnly = heroCopy({
      product: "Prism",
      runs: [{ ...base, working: seat }],
      waiting: 6,
      waitingFirst: "Something to start with",
      nowMs: Date.parse("2026-09-08T00:45:00Z"),
    });
    expect(quietOnly.line).toContain("1 run has gone quiet");
  });

  it("never reports what is going fine on a line read to find what to do", () => {
    expect(callsWaiting().line).not.toContain("moving");
  });

  it("says where to answer when there is no call it can name", () => {
    // The fallback is the whole direction here rather than a preamble to one.
    const c = callsWaiting({ waitingFirst: null });
    expect(c.line).toStartWith("Answer them in Inbox");
    expect(c.line).not.toContain("Start with");
  });

  /*
   * THE MIRROR. Every assertion above is a REMOVAL, and a line that said
   * nothing at all would pass all four. Where the headline is about the runs
   * themselves the tally is the subject, and it must still be there.
   */
  it("still tallies the rest where the headline IS the runs", () => {
    const c = heroCopy({
      product: "Prism",
      runs: [
        { ...base, holdReason: "given-up" },
        { ...base, working: seat },
      ],
      waiting: 0,
      nowMs: Date.parse("2026-09-08T00:45:00Z"),
    });
    expect(c.title).toBe("1 run has gone quiet.");
    expect(c.line).toContain("1 run has stopped");
  });
});

/*
 * ── A CONTROL'S LABEL IS ONE PHRASE AND NEVER BREAKS ──────────────────────
 *
 * SEEN ON THE SERVED ENTRY, 2026-09-10, measured with
 * `getClientRects().length` rather than by eye: the hero's door "Open Inbox"
 * occupied TWO line boxes, with "Open" ending one line and "Inbox" starting
 * the next.
 *
 * A two-word control split across lines stops reading as a control. The eye
 * takes "...2 runs have stopped. Open" as the end of a sentence and "Inbox" as
 * the start of another, and this door sits in the largest paragraph on the
 * landing page.
 *
 * A SWEEP OF EVERY `a` AND `button` ON THE ENTRY found exactly one broken
 * label, so this is pinned rather than generalised into a lint nobody asked
 * for. If a second appears, that is the moment it becomes a rule in the
 * contract rather than a guard on one file.
 */
describe("the hero's door", () => {
  const SRC = readFileSync(join(import.meta.dir, "Hero.tsx"), "utf8");

  it("never breaks its own label across lines", () => {
    const link = SRC.match(/<Link\s+to=\{copy\.door\.to\}[\s\S]*?className="([^"]*)"/);
    expect(link, "the hero door moved; re-point this test").not.toBeNull();
    expect(link![1]).toContain("whitespace-nowrap");
  });

  it("still lets the sentence around it wrap", () => {
    // The paragraph must keep wrapping wherever it likes; only the thing a
    // person presses is held together. `nowrap` on the <p> would push the
    // whole line off a narrow screen.
    const para = SRC.match(/<p className="max-w-\[var\(--mrd-measure-page\)\][^"]*"/);
    expect(para, "the hero paragraph moved; re-point this test").not.toBeNull();
    expect(para![0]).not.toContain("whitespace-nowrap");
  });
});
