import { describe, it, expect, beforeEach } from "bun:test";
import {
  LANDING_SESSION_KEY_RE,
  LANDING_SESSION_STORAGE_KEY,
  clearLandingSessionKey,
  getLandingSessionKey,
  peekLandingSessionKey,
} from "@/lib/landing-session";

/**
 * The landing session key exists so an anonymous visit can be joined to the
 * account it becomes. These tests hold the four properties that makes true:
 * it is stable within a session, it survives a reload of the same tab, it can
 * be read without being created, and it goes away once it has been claimed.
 */

beforeEach(() => {
  clearLandingSessionKey();
  window.sessionStorage.removeItem(LANDING_SESSION_STORAGE_KEY);
});

describe("the anonymous landing session key", () => {
  it("mints 32 hex characters and nothing else", () => {
    const key = getLandingSessionKey();
    expect(key).toBeDefined();
    expect(LANDING_SESSION_KEY_RE.test(key!)).toBe(true);
  });

  it("returns the same key on every call in one session", () => {
    const first = getLandingSessionKey();
    expect(getLandingSessionKey()).toBe(first!);
    expect(getLandingSessionKey()).toBe(first!);
  });

  it("survives a reload of the same tab, which is how a visit stays one visit", () => {
    const first = getLandingSessionKey();
    // A reload clears module state but not sessionStorage.
    clearInMemoryOnly();
    expect(getLandingSessionKey()).toBe(first!);
  });

  it("is unique per session, so two visitors never collide", () => {
    const first = getLandingSessionKey();
    clearLandingSessionKey();
    window.sessionStorage.removeItem(LANDING_SESSION_STORAGE_KEY);
    expect(getLandingSessionKey()).not.toBe(first!);
  });

  it("peek reads without minting, so arriving straight at signup files no claim", () => {
    expect(peekLandingSessionKey()).toBeUndefined();
    expect(window.sessionStorage.getItem(LANDING_SESSION_STORAGE_KEY)).toBeNull();
    const key = getLandingSessionKey();
    expect(peekLandingSessionKey()).toBe(key!);
  });

  it("is dropped once claimed, so nothing linkable is left in the browser", () => {
    getLandingSessionKey();
    clearLandingSessionKey();
    expect(window.sessionStorage.getItem(LANDING_SESSION_STORAGE_KEY)).toBeNull();
    expect(peekLandingSessionKey()).toBeUndefined();
  });

  it("ignores a stored value that is not a key we minted", () => {
    window.sessionStorage.setItem(LANDING_SESSION_STORAGE_KEY, "someone@example.com");
    const key = getLandingSessionKey();
    expect(LANDING_SESSION_KEY_RE.test(key!)).toBe(true);
  });
});

/**
 * Simulate a page reload: the module's memo goes with the JavaScript context,
 * sessionStorage does not. clearLandingSessionKey drops both, so it cannot be
 * used for this.
 */
function clearInMemoryOnly(): void {
  const stored = window.sessionStorage.getItem(LANDING_SESSION_STORAGE_KEY);
  clearLandingSessionKey();
  if (stored) window.sessionStorage.setItem(LANDING_SESSION_STORAGE_KEY, stored);
}
