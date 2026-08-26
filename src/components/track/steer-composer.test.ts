/**
 * THE STEER BOX'S PURE HALVES.
 *
 * The roster answers "who is actually on this work" from the transcript's own
 * turns -- newest first, deduplicated, capped -- and never invents a name. The
 * mention scanner finds the @partial under the caret and only under the caret:
 * an @ earlier in the sentence that the cursor has moved away from must not
 * reopen the list, or Enter stops meaning "send".
 */
import { describe, expect, it } from "bun:test";

import { activeMention, rosterFromTurns } from "./SteerComposer";

describe("rosterFromTurns", () => {
  it("takes the seats that worked here, newest first, without repeats", () => {
    expect(
      rosterFromTurns([{ agentName: "Verify" }, { agentName: "Build" }, { agentName: "Build" }]),
    ).toEqual(["Verify", "Build"]);
  });

  it("is capped, because a roster is not a directory", () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ agentName: `Seat ${i}` }));
    expect(rosterFromTurns(many)).toHaveLength(5);
  });

  it("an empty transcript names nobody", () => {
    expect(rosterFromTurns([])).toEqual([]);
    expect(rosterFromTurns(undefined)).toEqual([]);
  });
});

describe("activeMention", () => {
  it("finds the partial name directly under the caret", () => {
    //        position 6 is just after "Bui"
    expect(activeMention("hey @Bui", 8)).toEqual({ query: "bui", start: 4 });
  });

  it("a bare @ with nothing after it offers everyone", () => {
    expect(activeMention("@", 1)).toEqual({ query: "", start: 0 });
  });

  it("an @ the caret has left behind stays closed", () => {
    expect(activeMention("@old text", 9)).toBeNull();
  });

  it("no @ anywhere means no list", () => {
    expect(activeMention("plain words", 11)).toBeNull();
  });
});
