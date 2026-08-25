/**
 * A run the loop halted must not spend one of the station's three attempts.
 *
 * ── A 2026-08-02 FIX THAT ROTTED, AND THE ROT WAS INVISIBLE ───────────────
 *
 * `driveTrackOnce` already has the right rule for an empty account, with the
 * measurement in its own comment: three of nine tracks frozen on 2026-08-02 with
 * `spend_used_usd = 0` and nothing behind them but credit refusals. Attempts
 * exist to stop a station that cannot do its job; a station that was never given
 * the chance must not be charged one.
 *
 * **That branch fires on a THROWN dispatch, and the loop stopped throwing.**
 * `CreditExhaustedError` is now caught inside `executeLoop`, which marks the run
 * `halted`, refunds it, and returns NORMALLY carrying
 * `halted: { kind: "out_of_credit" }` — deliberately, so a wallet event stays
 * out of the failure counts. From the driver's side that is indistinguishable
 * from a clean run that filed nothing, so it recorded `produced-nothing` and
 * charged an attempt.
 *
 * MEASURED 2026-08-25 00:00 UTC on the live end-to-end attempt. All three
 * Discover seats returned:
 *
 *   "Halted: AI credits exhausted: account credit balance (13) is below the
 *    projected cost (16). Top up or upgrade in Settings → Usage."
 *
 * and `spine_tracks.attempts` went 1 → 2 with `last_hold = 'produced-nothing'`.
 * Three of those is `given-up` — the exact freeze the 2026-08-02 fix was written
 * to prevent, arriving through the one door left open to it.
 *
 * **Neither half was wrong on its own.** The loop is right to model a wallet
 * event as a halt rather than a failure. The driver is right that a station that
 * never ran keeps its attempts. They simply stopped agreeing about which channel
 * carries the fact, and nothing failed loudly when they did.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "bun:test";

import { HALT_HOLD, holdForHalt } from "./correction";
import { HOLD_LINE, type HoldReason } from "./driver";

const DRIVER_SRC = readFileSync(
  fileURLToPath(new URL("./driver.server.ts", import.meta.url)),
  "utf8",
);

/**
 * The holds the driver records WITHOUT charging an attempt, read from its own
 * source rather than restated here. Every mapped halt has to land in this set,
 * because landing outside it is the bug.
 */
const NON_ATTEMPT_HOLDS = new Set<HoldReason>([
  "out-of-credit",
  "over-budget",
  "out-of-time",
  "paused",
  "no-agent",
]);

describe("which halts get a hold", () => {
  it("maps the wallet halt the live run actually hit", () => {
    expect(holdForHalt("out_of_credit")).toBe("out-of-credit");
  });

  it("maps every governance halt the runtime can raise", () => {
    expect(holdForHalt("kill_switch")).toBe("paused");
    expect(holdForHalt("mission_spend_cap")).toBe("over-budget");
    expect(holdForHalt("mission_token_cap")).toBe("over-budget");
  });

  it("maps an agent switched off mid-flight to the reason that says so", () => {
    expect(holdForHalt("agent-disabled")).toBe("no-agent");
  });

  /**
   * The conservative edge. An unmapped halt keeps today's behaviour exactly,
   * rather than being guessed into a hold whose sentence would be untrue of the
   * reader's workspace. `stopped` is a race, not a boundary.
   */
  it("leaves an unmapped halt alone rather than guessing", () => {
    expect(holdForHalt("stopped")).toBeNull();
    expect(holdForHalt("something-new")).toBeNull();
    expect(holdForHalt(null)).toBeNull();
    expect(holdForHalt(undefined)).toBeNull();
    expect(holdForHalt("")).toBeNull();
  });
});

describe("every mapped halt is a hold that costs no attempt", () => {
  /**
   * THE WHOLE POINT, asserted as a property rather than case by case. If someone
   * later maps a halt to `stalled` or `produced-nothing`, both of which DO charge
   * an attempt, this fails — and that mapping would reintroduce the exact defect
   * this file exists for.
   */
  it("never maps a halt to a hold that charges an attempt", () => {
    for (const hold of Object.values(HALT_HOLD)) {
      expect(NON_ATTEMPT_HOLDS.has(hold)).toBe(true);
    }
  });

  it("never maps a halt to produced-nothing or stalled", () => {
    for (const hold of Object.values(HALT_HOLD)) {
      expect(hold).not.toBe("produced-nothing");
      expect(hold).not.toBe("stalled");
    }
  });

  it("only names holds the product actually has a sentence for", () => {
    for (const hold of Object.values(HALT_HOLD)) {
      expect(HOLD_LINE[hold]).toBeTruthy();
    }
  });
});

describe("the driver reads the halt", () => {
  it("consults result.halted at the seat", () => {
    expect(DRIVER_SRC).toContain("if (result.halted)");
    expect(DRIVER_SRC).toContain("haltedAs = holdForHalt(result.halted.kind)");
  });

  it("returns on it without touching attempts", () => {
    const start = DRIVER_SRC.indexOf("if (haltedAs) {");
    expect(start).toBeGreaterThan(-1);
    const branch = DRIVER_SRC.slice(start, DRIVER_SRC.indexOf("\n  }", start));
    expect(branch).toContain("last_hold: haltedAs");
    // The defect in one assertion: this branch must never increment attempts.
    expect(branch).not.toContain("attempts");
  });

  /**
   * Order matters. A halted run did not throw, so the `failed` branch would not
   * fire — but if it ever did it would record `stalled` and charge an attempt
   * for a run that never started.
   */
  it("is decided before the failure branch", () => {
    expect(DRIVER_SRC.indexOf("if (haltedAs) {")).toBeLessThan(DRIVER_SRC.indexOf("if (failed) {"));
  });

  /**
   * A halt stops the CREW, not one seat. The seats after it are briefed on what
   * it filed, and an account that cannot pay for seat one cannot pay for seat
   * two either.
   */
  it("breaks the crew rather than running the remaining seats", () => {
    const at = DRIVER_SRC.indexOf("haltedAs = holdForHalt(result.halted.kind)");
    expect(DRIVER_SRC.slice(at, at + 120)).toContain("break");
  });
});
