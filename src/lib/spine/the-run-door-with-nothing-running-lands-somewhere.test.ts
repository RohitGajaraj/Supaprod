import { describe, expect, it } from "bun:test";
import { resolveRunDoor } from "./track.functions";

/**
 * THE RUN DOOR WITH NOTHING RUNNING LANDS SOMEWHERE (P-109, A-QUEUE.md).
 *
 * P-11 drew the rail's Run row only while the person stood on
 * `/track/$trackId` and dropped it everywhere else -- a door with nothing
 * behind it the instant you were not already on one. P-63 named it directly:
 * "Run has no door to design for while nothing's live." `resolveRunDoor` is
 * what answers instead, independent of the current page: a run somewhere is
 * genuinely running ("live"); nothing is running but one exists ("last", the
 * most recently touched track); the workspace has never had one ("none").
 *
 * THE GUARD, Scope's own words: the three resolutions.
 */

describe("resolveRunDoor", () => {
  it("live wins when something is actually running", () => {
    expect(resolveRunDoor({ liveTrackId: "t-live", lastTrackId: "t-last" })).toEqual({
      state: "live",
      trackId: "t-live",
    });
  });

  it("falls back to the last touched track when nothing is running", () => {
    expect(resolveRunDoor({ liveTrackId: null, lastTrackId: "t-last" })).toEqual({
      state: "last",
      trackId: "t-last",
    });
  });

  it("lands on none, with no track to point at, for a workspace that has never had a run", () => {
    expect(resolveRunDoor({ liveTrackId: null, lastTrackId: null })).toEqual({
      state: "none",
      trackId: null,
    });
  });

  it("live still wins even when it and the last touched track are the same one", () => {
    // The common case: the live run IS also the most recently touched track.
    // Asserted so a future edit cannot accidentally read this as ambiguous.
    expect(resolveRunDoor({ liveTrackId: "t-1", lastTrackId: "t-1" })).toEqual({
      state: "live",
      trackId: "t-1",
    });
  });
});
