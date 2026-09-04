import { describe, expect, test } from "bun:test";
import { timedPhase, appendServerTiming } from "./server-timing";

/**
 * P-58b. No request context exists in a unit test -- `setResponseHeader` and
 * `getResponseHeader` have nothing to write to or read from here, which is
 * exactly the case `timedPhase`'s own header says it must survive: a phase
 * this file's own header calls out (no prior use of these two calls from a
 * route `loader` anywhere in this repo to model this on). These tests prove
 * the fail-silent contract holds -- the phase itself still runs and its
 * result still returns, with or without a header to write.
 */
describe("timedPhase runs the phase and never lets the diagnostic break it", () => {
  test("resolves with the phase's own value, with no request context reachable", async () => {
    const result = await timedPhase("landing-data", async () => 42);
    expect(result).toBe(42);
  });

  test("rejects with the phase's own error, not a timing-related one", async () => {
    await expect(
      timedPhase("landing-data", async () => {
        throw new Error("waitlist read failed");
      }),
    ).rejects.toThrow("waitlist read failed");
  });

  test("runs an async phase to completion before resolving", async () => {
    let ran = false;
    const result = await timedPhase("landing-data", async () => {
      // A microtask tick, not a fixed sleep: this only has to prove the
      // phase's own async work finishes before timedPhase resolves, and a
      // real timer would be an assertion about the machine the suite runs
      // on rather than about the ordering this test exists to check.
      await Promise.resolve();
      ran = true;
      return "done";
    });
    expect(ran).toBe(true);
    expect(result).toBe("done");
  });
});

describe("appendServerTiming: the primitive a caller with its own duration reuses", () => {
  // `track.functions.ts`'s `withStartReaderTiming` is the first such caller
  // (P-58b): it already measures its own wall clock for a `console.log`, and
  // reuses this rather than a second, drifting duration.
  test("never throws with no request context reachable", () => {
    expect(() => appendServerTiming("workspace-read", 12.4)).not.toThrow();
  });
});
