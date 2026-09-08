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
