import { describe, it, expect, afterEach } from "bun:test";
import { consumeLastCapturedError } from "./error-capture";

// error-capture.ts registers its listeners once, at module import time, and
// keeps a single module-level `lastCapturedError` slot. Every test below
// drives that same slot through the real global "error" / "unhandledrejection"
// events (not by reaching into module internals), then always drains it via
// consumeLastCapturedError so state never leaks into the next test.

describe("consumeLastCapturedError", () => {
  afterEach(() => {
    // Drain any error a test forgot to consume so it can never bleed into
    // the next test's assertions.
    consumeLastCapturedError();
  });

  it("returns undefined when nothing has been captured", () => {
    expect(consumeLastCapturedError()).toBeUndefined();
  });

  it("captures a window 'error' event and returns the original Error object", () => {
    const original = new Error("boom");
    globalThis.dispatchEvent(new ErrorEvent("error", { error: original }));
    expect(consumeLastCapturedError()).toBe(original);
  });

  it("captures an 'unhandledrejection' event and returns the rejection reason", () => {
    const reason = new Error("promise blew up");
    const event = new Event("unhandledrejection") as PromiseRejectionEvent & { reason: unknown };
    Object.defineProperty(event, "reason", { value: reason, configurable: true });
    globalThis.dispatchEvent(event);
    expect(consumeLastCapturedError()).toBe(reason);
  });

  it("is single-consume: a second read immediately after returns undefined", () => {
    globalThis.dispatchEvent(new ErrorEvent("error", { error: new Error("once") }));
    expect(consumeLastCapturedError()).toBeDefined();
    expect(consumeLastCapturedError()).toBeUndefined();
  });

  /*
   * ── F-148: A ONE-MILLISECOND MARGIN AGAINST THE WALL CLOCK ────────────────
   *
   * These read `Date.now = () => realNow() + 4_999`, and `realNow()` is called
   * at READ time rather than at capture time. The event records `at = T0`; by
   * the time the assertion runs the real clock is `T0 + delta`, so the stub
   * returns `T0 + delta + 4999` and the elapsed time is `4999 + delta`.
   *
   * **Any delta over one millisecond expires a capture the test calls fresh.**
   * Under full-suite load that is a coin flip, which is exactly what S3
   * reported: failed twice in one evening, passed alone and on re-run.
   *
   * A suite that fails one run in three teaches every lane to re-run rather
   * than read the output, and that habit is what most of tonight's findings
   * needed somebody NOT to have.
   *
   * Fixed by controlling the clock for the WRITE as well as the read, so
   * neither end touches the wall clock and the elapsed time is exactly the
   * number in the test. `advanceTo` makes both cases read as what they are:
   * one millisecond inside the window and one millisecond outside it.
   */
  const atFixedClock = (msSinceCapture: number, assert: () => void) => {
    const realNow = Date.now;
    const base = realNow();
    try {
      Date.now = () => base;
      globalThis.dispatchEvent(new ErrorEvent("error", { error: new Error("boom") }));
      Date.now = () => base + msSinceCapture;
      assert();
    } finally {
      Date.now = realNow;
    }
  };

  it("expires after the 5s TTL: a stale capture reads as undefined, not the old error", () => {
    atFixedClock(5_001, () => expect(consumeLastCapturedError()).toBeUndefined());
  });

  it("a fresh capture inside the TTL window is still returned", () => {
    atFixedClock(4_999, () => expect(consumeLastCapturedError()).toBeDefined());
  });

  it("and the boundary itself is exact, which the old wall-clock version could not assert", () => {
    // Exactly TTL_MS is INSIDE the window: the module tests `> TTL_MS`. With the
    // clock controlled this is a fact rather than a race.
    atFixedClock(5_000, () => expect(consumeLastCapturedError()).toBeDefined());
  });

  it("a later capture overwrites an earlier, unconsumed one", () => {
    globalThis.dispatchEvent(new ErrorEvent("error", { error: new Error("first") }));
    globalThis.dispatchEvent(new ErrorEvent("error", { error: new Error("second") }));
    const captured = consumeLastCapturedError() as Error;
    expect(captured.message).toBe("second");
  });
});
