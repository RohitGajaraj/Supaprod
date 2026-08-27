import { describe, it, expect } from "bun:test";
import { buildBlocked } from "./build-precondition";

/**
 * The measurement behind this is in the module's own header: 11 runs, 373,096
 * tokens, across 5 tracks, all telling the agent's story of a repository that
 * was never connected, under a hold line promising it would try again.
 */
describe("a station that cannot succeed says so", () => {
  const held = { station: "build", held: true } as const;

  it("names the missing repository when Build is held and none resolves", () => {
    const out = buildBlocked({ ...held, resolution: "not_connected" });
    expect(out?.line).toContain("no repository");
    // It must say WHY the retry keeps failing, which is the one thing a person
    // cannot work out from the screen in front of them.
    expect(out?.line).toContain("keeps filing nothing");
    expect(out?.door).toBe("Connect a repository");
  });

  it("says nothing when the repository is there", () => {
    expect(buildBlocked({ ...held, resolution: "connected" })).toBeNull();
  });

  it("says nothing when the check itself could not tell", () => {
    /*
     * THE ONE THAT WOULD DO REAL HARM. `new-build.functions.ts` records this
     * exactly: a pre-flight check that guesses wrong "does not merely fail to
     * help, it contradicts the truth and talks a person out of" the thing that
     * would have worked. The founder's own workspace was once told no repo was
     * connected while one was bound to Relay. Unknown is silence.
     */
    expect(buildBlocked({ ...held, resolution: "unknown" })).toBeNull();
    expect(buildBlocked({ ...held, resolution: null })).toBeNull();
    expect(buildBlocked({ ...held, resolution: undefined })).toBeNull();
  });

  it("says nothing at a station that does not open a pull request", () => {
    // Ship promotes a pull request that already exists, and a missing binding
    // there fails differently; claiming this reason would be wrong.
    for (const station of ["sense", "decide", "define", "design", "ship", "learn"]) {
      expect(buildBlocked({ station, held: true, resolution: "not_connected" })).toBeNull();
    }
  });

  it("says nothing while the work is moving", () => {
    // Only a screen that is showing a hold has a retry to explain. Saying this
    // over a running station would report a stop that has not happened.
    expect(buildBlocked({ station: "build", held: false, resolution: "not_connected" })).toBeNull();
  });

  it("offers no imperative of its own, because the door beside it is the action", () => {
    // The same rule the failure lines follow: a sentence that offers an action
    // can be contradicted by whatever renders next to it.
    const line = buildBlocked({ ...held, resolution: "not_connected" })!.line;
    expect(line).not.toMatch(/\b(press|click|try again|connect it|go to)\b/i);
  });
});
