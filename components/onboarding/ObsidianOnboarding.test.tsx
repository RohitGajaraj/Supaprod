import { describe, it, expect } from "bun:test";
import { timeEstimateFor, FALLBACK_BELIEF } from "./ObsidianOnboarding";

/**
 * OBS-14 - this repo has no jsdom/React-Testing-Library dependency (the
 * constraint every other Obsidian component here documents), so the
 * component's phase transitions, connect mutation, and demo-gated action are
 * not render-tested. What is genuinely pure - the per-provider time-estimate
 * copy and the fallback belief - is covered here.
 */
describe("ObsidianOnboarding - timeEstimateFor", () => {
  it("returns the spec's named estimates verbatim", () => {
    expect(timeEstimateFor("github")).toBe("about 1 minute");
    expect(timeEstimateFor("intercom")).toBe("about 2 minutes");
  });

  it("falls back to a sensible default for any unlisted provider", () => {
    expect(timeEstimateFor("figma")).toBe("about 2 minutes");
    expect(timeEstimateFor("jira")).toBe("about 2 minutes");
  });
});

describe("ObsidianOnboarding - FALLBACK_BELIEF", () => {
  it("is a non-empty plain-words belief string", () => {
    expect(FALLBACK_BELIEF.length).toBeGreaterThan(0);
    expect(FALLBACK_BELIEF).not.toMatch(/[—–]/);
  });
});
