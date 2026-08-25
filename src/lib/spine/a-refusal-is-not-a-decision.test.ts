/**
 * Decide was told to say no, and a station that says no files nothing.
 *
 * `stationJob("decide", ...)` used to end: *"If the evidence does not support
 * it, say so plainly rather than finding a reason."* That is the right
 * instinct against rationalising a bad bet, and it has one blind spot — it
 * describes what to SAY, never what to FILE.
 *
 * In a workspace with no ingestion source configured (`scout_targets` is 0
 * rows in `0b792d52`) an honest agent reaches "the evidence does not support
 * it" every single time, says so, and stops. The run completes. Nothing is
 * written to `decisions`. On 2026-08-25 the Round 4 track sat at
 * `decide / produced-nothing` for exactly this reason, and the two seats that
 * ran said so in as many words:
 *
 *   strategist: "The evidence does not support doing this work. ... Per
 *   policy, workstreams must be declined when primary evidence is absent and
 *   telemetry is broken."
 *
 * WHY THIS IS THE EXPENSIVE KIND OF WRONG. A refusal and a recorded "no" read
 * the same to a person and are opposites to this product. **The forecast
 * captured at decision time is the moat.** A refusal writes no `decisions`
 * row, so it writes no `forecast_claim`, no `forecast_how_we_will_know` and
 * no `forecast_horizon_date` — there is nothing for `forecast_resolution` to
 * ever settle. A recorded no, with what would change it and when we would
 * know, is the deliverable. A refusal is the one outcome that leaves the
 * product with nothing.
 *
 * THE CORRECTION IS NOT A LOWER EVIDENCE BAR, and this file exists to stop it
 * being read as one. Thin evidence still means low confidence and it still
 * means no. It belongs in the forecast rather than in a silence.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SRC = readFileSync(fileURLToPath(new URL("./driver.ts", import.meta.url)), "utf8");

/**
 * Comments stripped. The correction above quotes the retired sentence
 * verbatim, so a naive scan of this module would find the old instruction in
 * its own explanation and fail on prose.
 */
const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

/** The `decide` arm of `stationJob` alone. */
const DECIDE = (() => {
  const at = CODE.indexOf("Decide whether ${subject}");
  expect(at).toBeGreaterThan(-1);
  return CODE.slice(at, CODE.indexOf("`;", at));
})();

describe("a no is filed, not merely said", () => {
  it("tells the station that a no is filed the same way as a yes", () => {
    expect(DECIDE).toContain('A "no" is a decision and you file it the same way as a yes');
  });

  it("forbids the one outcome that records nothing", () => {
    expect(DECIDE).toContain("What you must not do is decline to decide");
  });

  /**
   * Both halves of this sentence carry weight. The request obliges a call —
   * that is what was missing, and it is why an agent with no evidence
   * concluded it had nothing to do. It is *not* a reason to approve, which is
   * what stops this being a rubber stamp.
   */
  it("makes the request an obligation to decide and not a reason to approve", () => {
    expect(DECIDE).toContain("obliges you to make a call on it");
    expect(DECIDE).toContain("it is not on its own a reason to do it");
  });
});

describe("the evidence bar is intact", () => {
  it("still refuses rationalising", () => {
    expect(DECIDE).toContain("without finding a reason");
  });

  it("sends thin evidence into the forecast rather than into a silence", () => {
    expect(DECIDE).toContain("thin or absent evidence is a fact about your confidence");
    expect(DECIDE).toContain("both of those go in the forecast");
  });

  it("no longer carries the sentence that read as a standing order to decline", () => {
    expect(CODE).not.toContain("say so plainly rather than finding a reason");
  });
});
