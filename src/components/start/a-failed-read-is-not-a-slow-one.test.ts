/**
 * ── A POLLING READ THAT ALWAYS FAILS IS NEVER "FINISHED FAILING" ──────────
 *
 * WALKED ON THE SERVED ENTRY, 2026-09-10. The page sat on *"Reading your
 * workspace. Still reading."* and stayed there. The headline's gate held until
 * `runs` stopped fetching, and `runs` carries `refetchInterval: 10_000`: every
 * ten seconds it returns to `fetchStatus: "fetching"` with no data, which is
 * byte-for-byte the state of a read that simply has not answered yet. So a read
 * failing on every attempt looked, forever, exactly like a slow one.
 *
 * The founder's own bar names this pair: *"Empty, slow and wrong are the states
 * that decide whether it is trusted, and they are the ones that get designed
 * last."* This was WRONG rendering as SLOW, which is the worst way round --
 * slow asks a person to wait, wrong asks them to act, and the product was
 * asking somebody to wait for something that was never coming.
 *
 * `Hero` has taken a `failed` flag all along and says the right thing with it.
 * It never got the chance, because the gate in front of it never opened.
 *
 * The `failureCount` clause itself lives in `query-state.ts`, where eleven
 * surfaces get it and where its own tests hold it. What is asserted here is the
 * entry's use of it, and the two conditions that are not about reads.
 */
import { describe, expect, it } from "bun:test";
import { heroCanDraw } from "./a-failed-read-is-not-a-slow-one";

const answered = { isPending: false, data: [], isError: false, fetchStatus: "idle" as const };
const firstLoad = {
  isPending: true,
  data: undefined,
  isError: false,
  fetchStatus: "fetching" as const,
};
/** A poll that has failed and is retrying: pending, fetching, and not worth waiting for. */
const retryingAfterFailure = { ...firstLoad, failureCount: 1 };
/** The same poll between attempts, where `isError` has settled. */
const failedIdle = { ...firstLoad, isError: true, fetchStatus: "idle" as const, failureCount: 3 };

const ok = { workspaceLoading: false, seeded: true };

describe("the headline waits for a read that might still answer", () => {
  it("waits through a first load, whichever read it is", () => {
    expect(heroCanDraw({ ...ok, queue: answered, runs: firstLoad })).toBe(false);
    expect(heroCanDraw({ ...ok, queue: firstLoad, runs: answered })).toBe(false);
  });

  it("draws once both reads have answered", () => {
    expect(heroCanDraw({ ...ok, queue: answered, runs: answered })).toBe(true);
  });
});

describe("and never waits for one that has already failed", () => {
  it("draws while a failed poll is mid-retry", () => {
    /*
     * THE DEFECT EXACTLY. Every clause of "no answer yet" is satisfied here --
     * pending, fetching, no data -- and `isError` is false because the retry is
     * in flight. Only `failureCount` remembers that an attempt already came
     * back empty-handed.
     */
    expect(heroCanDraw({ ...ok, queue: answered, runs: retryingAfterFailure })).toBe(true);
  });

  it("draws between the attempts of a failing poll", () => {
    expect(heroCanDraw({ ...ok, queue: failedIdle, runs: failedIdle })).toBe(true);
  });

  it("waits again the moment a retry succeeds", () => {
    // The mirror. `failureCount` resets on success, so a read that recovers is
    // waited on exactly as it was before it stumbled -- otherwise one stumble
    // would permanently stop the headline waiting for anything.
    expect(heroCanDraw({ ...ok, queue: answered, runs: { ...firstLoad, failureCount: 0 } })).toBe(
      false,
    );
  });
});

describe("the states that are not about reads at all", () => {
  it("draws nothing while the workspace itself is unresolved", () => {
    // Which workspace this is decides what every read asks for. A headline
    // before that is a headline about nothing.
    expect(
      heroCanDraw({ workspaceLoading: true, seeded: true, queue: answered, runs: answered }),
    ).toBe(false);
  });

  it("draws nothing before the composite has answered for this workspace", () => {
    expect(
      heroCanDraw({ workspaceLoading: false, seeded: false, queue: answered, runs: answered }),
    ).toBe(false);
  });
});
