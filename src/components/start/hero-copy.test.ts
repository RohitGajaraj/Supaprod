/**
 * THE HERO SAYS THE ONE THING THAT DISCRIMINATES, IN THIS ORDER: what needs
 * you, what stopped, what is moving, then the invitation. Seen live on
 * 2026-09-08: four runs held at Build and Ship under a hero that said nothing
 * was waiting. A negation over a stopped run is the false all-clear the
 * shell's honesty rule exists to prevent.
 */
import { describe, expect, it } from "bun:test";
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
    expect(first.line).toContain("press one of the three below");
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

  it("falls back to the invitation, in the product's name, when everything is settled", () => {
    const c = heroCopy({ product: "Prism", runs: [{ ...base, status: "done" }] });
    expect(c.title).toBe("What should Prism do next?");
  });
});
