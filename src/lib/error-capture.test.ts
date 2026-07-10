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

  it("expires after the 5s TTL: a stale capture reads as undefined, not the old error", () => {
    globalThis.dispatchEvent(new ErrorEvent("error", { error: new Error("stale") }));
    const realNow = Date.now;
    try {
      Date.now = () => realNow() + 5_001;
      expect(consumeLastCapturedError()).toBeUndefined();
    } finally {
      Date.now = realNow;
    }
  });

  it("a fresh capture inside the TTL window is still returned", () => {
    globalThis.dispatchEvent(new ErrorEvent("error", { error: new Error("fresh") }));
    const realNow = Date.now;
    try {
      Date.now = () => realNow() + 4_999;
      expect(consumeLastCapturedError()).toBeDefined();
    } finally {
      Date.now = realNow;
    }
  });

  it("a later capture overwrites an earlier, unconsumed one", () => {
    globalThis.dispatchEvent(new ErrorEvent("error", { error: new Error("first") }));
    globalThis.dispatchEvent(new ErrorEvent("error", { error: new Error("second") }));
    const captured = consumeLastCapturedError() as Error;
    expect(captured.message).toBe("second");
  });
});
