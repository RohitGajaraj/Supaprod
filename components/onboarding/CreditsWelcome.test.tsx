import { describe, it, expect } from "bun:test";
import { creditsWelcomeVisible } from "./CreditsWelcome";

// Founder ruling 2026-07-09: the post-onboarding welcome moment. These pin
// the honesty rules - the card only ever states a real, positive grant while
// metering is actually on; every other state renders nothing.

describe("creditsWelcomeVisible", () => {
  it("shows for a real positive grant while metering is on", () => {
    expect(creditsWelcomeVisible(true, 750)).toBe(true);
    expect(creditsWelcomeVisible(true, 1)).toBe(true);
  });

  it("renders nothing while the credits engine is dormant, whatever the stored grant says", () => {
    expect(creditsWelcomeVisible(false, 750)).toBe(false);
  });

  it("renders nothing for a zero or ungranted account - never a hardcoded promise", () => {
    expect(creditsWelcomeVisible(true, 0)).toBe(false);
    expect(creditsWelcomeVisible(true, -1)).toBe(false);
  });
});
