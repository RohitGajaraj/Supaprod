import { describe, it, expect } from "bun:test";
import { originLine, runStatus } from "./run-status";
import type { Track } from "@/lib/spine/track.functions";

/**
 * THE FIRST THING A PERSON READS ABOUT A RUN, pinned.
 *
 * Seven branches decided what the header claims and not one of them was tested.
 * The only way to check a branch was to find a live track in that state and
 * look at it, which is how a header spent an unknown stretch saying "Running"
 * over a run that was not running -- recorded in this function's own docblock,
 * fixed before this test existed, and now guarded.
 *
 * The properties below are the ones a future edit could plausibly break while
 * looking correct in review.
 */

const base: Track = {
  id: "t1",
  title: "Some work",
  station: "design",
  status: "open",
  route: ["sense", "decide", "define", "design", "build", "ship", "learn"],
  holdReason: null,
  hold: null,
  drivenAt: "2026-08-27T01:00:00.000Z",
  attempts: 0,
} as unknown as Track;

const at = (over: Partial<Track>): Track => ({ ...base, ...over }) as Track;

describe("what the run header claims", () => {
  it("says nothing at all when nothing is running, holding or waiting", () => {
    // The honesty fix this function's docblock records: the fallback used to
    // return "Running" for every open track between sweeps, which is most of
    // them. Silence is this system's word for nothing to report.
    expect(runStatus(at({ holdReason: null }))).toBeNull();
  });

  it("never puts the hold's reason under the chip, in either hold tone", () => {
    // THE PROPERTY THAT COST A SCREEN. Photographed at 1440, the reason was on
    // the page three times: here, on the map's own stop, and as the lead of
    // "Why it stopped". Fifteen words right-aligned beside the title was the
    // heaviest of the three and carried the least. The chip stays; two words at
    // a glance is what a header is for.
    const held = runStatus(
      at({ holdReason: "out-of-time", hold: "This run of the loop ran long." }),
    );
    expect(held?.word).toBe("On hold");
    expect(held?.second).toBeUndefined();

    const waiting = runStatus(
      at({ holdReason: "waiting-on-a-person", hold: "Somebody has to choose between the two." }),
    );
    expect(waiting?.word).toBe("Waiting on you");
    expect(waiting?.second).toBeUndefined();
  });

  it("lets work in motion outrank a hold row written between legs", () => {
    // RUN-18. An out-of-time hold lands mid-press by design; while the next leg
    // is already walking, the truthful headline is Running.
    const s = runStatus(at({ holdReason: "out-of-time" }), true);
    expect(s?.word).toBe("Running");
    expect(s?.pulse).toBe(true);
  });

  it("does not let liveNow overrule a hold that is waiting on a person", () => {
    // The one exception to the rule above, and the one worth guarding: if a
    // person is being waited on, saying "Running" hides the fact that nothing
    // will move until they act.
    const s = runStatus(at({ holdReason: "waiting-on-a-person" }), true);
    expect(s?.word).toBe("Waiting on you");
  });

  it("calls the end of a route Finished rather than Passed", () => {
    // "Passed" would claim a graded outcome. The product has never graded a
    // forecast, so reaching the end is a completion and nothing more.
    const s = runStatus(at({ status: "done" }));
    expect(s?.word).toBe("Finished");
    expect(s?.status).toBe("pass");
  });

  it("says Abandoned without a reason, because nothing will clear it", () => {
    const s = runStatus(at({ status: "abandoned", holdReason: "given-up", hold: "It gave up." }));
    expect(s?.word).toBe("Abandoned");
    expect(s?.second).toBeUndefined();
  });

  it("never pulses a state nothing is working on", () => {
    // A pulse claims motion. On a hold or a finished route there is none, and a
    // pulsing chip over a stopped run is the same lie as a progress bar.
    expect(runStatus(at({ holdReason: "out-of-time" }))?.pulse).toBe(false);
    expect(runStatus(at({ status: "done" }))?.pulse).toBe(false);
    expect(runStatus(at({ status: "abandoned" }))?.pulse).toBe(false);
  });
});

describe("where the work came from", () => {
  const T = "The saved address dropdown shows deleted addresses after a customer removes one";

  it("says nothing when the origin is the title again", () => {
    // Exactly what was on screen for 6199f3df at 1440.
    expect(originLine(T, T)).toBeNull();
    // Whitespace and case are not a difference a reader can see.
    expect(originLine(T, `  ${T.toUpperCase()}  `)).toBeNull();
  });

  it("keeps the part the title did not already say", () => {
    expect(originLine(T, `${T}. This became work because 9 signals say it.`)).toBe(
      "This became work because 9 signals say it.",
    );
    // The joining punctuation goes with the repeated half; a line starting
    // with ". " reads as a fragment of the sentence above it.
    expect(originLine("Fix checkout", "Fix checkout — 4 people reported it this week.")).toBe(
      "4 people reported it this week.",
    );
  });

  it("stays silent rather than leaving a dangling scrap", () => {
    // Below the floor there is no fact left, only the tail of a sentence the
    // reader has already read. Silence is the honest render.
    expect(originLine("Fix checkout", "Fix checkout now")).toBeNull();
    expect(originLine(T, `${T}.`)).toBeNull();
  });

  it("never hides an origin that carries its own fact", () => {
    // THE REGRESSION THIS GUARDS. The origin is often the best line on the
    // page, and a rule written to remove duplication is one edit away from
    // removing the thing worth reading.
    const brief =
      "Homeowners stall at checkout when adding a second monitor, and they mute notifications once alerts arrive one at a time.";
    expect(originLine(T, brief)).toBe(brief);
    expect(originLine(T, null)).toBeNull();
    expect(originLine(T, "")).toBeNull();
    // No title yet is not a reason to drop the origin.
    expect(originLine("", brief)).toBe(brief);
  });
});
