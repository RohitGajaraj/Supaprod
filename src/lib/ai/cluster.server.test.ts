import { describe, expect, test } from "bun:test";
import { extractThemesJson } from "./cluster.server";

// Regression coverage for the 2026-07-01 cluster-tick incident: google/gemini-2.5-pro
// (called with responseFormat=json_object) sometimes returns the bare array of theme
// objects instead of the documented `{"themes": [...]}` wrapper. That response is valid,
// parseable JSON: the bug was clusterSignalsCore reading `.themes` off a top-level array
// (always undefined) and discarding a perfectly good response as "invalid JSON".
describe("extractThemesJson", () => {
  test("accepts the documented {themes: [...]} wrapper shape", () => {
    const themes = [{ title: "A" }, { title: "B" }];
    expect(extractThemesJson({ themes })).toEqual(themes);
  });

  test("accepts a bare array (the shape actually observed live from Gemini)", () => {
    const themes = [{ title: "UI Theming and Customization" }, { title: "Lost Sales Opportunity" }];
    expect(extractThemesJson(themes)).toEqual(themes);
  });

  test("rejects undefined / non-array, non-object JSON", () => {
    expect(extractThemesJson(undefined)).toBeUndefined();
    expect(extractThemesJson(null)).toBeUndefined();
    expect(extractThemesJson("not json")).toBeUndefined();
  });

  test("rejects an object whose themes key is missing or not an array", () => {
    expect(extractThemesJson({})).toBeUndefined();
    expect(extractThemesJson({ themes: "oops" })).toBeUndefined();
    expect(extractThemesJson({ notThemes: [{ title: "A" }] })).toBeUndefined();
  });
});

import { describe as describeTest, expect as expectTest, test as testFn } from "bun:test";

// THEME GROWTH: helper logic and tests for the re-activation mechanism
// When a dismissed theme receives escalating signals, it should automatically
// re-activate (status -> 'new') if the frequency crosses the escalation threshold.
// This is the "conditional decline until it escalates" mechanism.

/**
 * Determine if a theme should re-activate based on its current status and new
 * frequency after signal attachment. Used by the theme-growth logic in
 * clusterSignalsCore to decide whether to flip a dismissed theme back to "new"
 * when it escalates.
 *
 * Re-activation is conservative: only dismissed/merged/archived themes (not
 * "done", which is user-settled) get a chance, and only if the new frequency
 * crosses a threshold (>= 5). This prevents stray signals from re-activating
 * while allowing genuine escalation to resurface dismissed themes.
 */
export function shouldReactivateTheme(
  currentStatus: string | null | undefined,
  newFrequency: number
): boolean {
  const status = (currentStatus ?? "").toLowerCase();
  const isDismissed = status === "dismissed" || status === "merged" || status === "archived";
  return isDismissed && newFrequency >= 5;
}

describeTest("shouldReactivateTheme", () => {
  testFn("re-activates dismissed themes at frequency threshold (>= 5)", () => {
    expectTest(shouldReactivateTheme("dismissed", 5)).toBe(true);
    expectTest(shouldReactivateTheme("dismissed", 6)).toBe(true);
    expectTest(shouldReactivateTheme("merged", 5)).toBe(true);
    expectTest(shouldReactivateTheme("archived", 5)).toBe(true);
  });

  testFn("does not re-activate dismissed themes below threshold", () => {
    expectTest(shouldReactivateTheme("dismissed", 1)).toBe(false);
    expectTest(shouldReactivateTheme("dismissed", 4)).toBe(false);
    expectTest(shouldReactivateTheme("merged", 0)).toBe(false);
  });

  testFn("does not re-activate themes with other statuses", () => {
    expectTest(shouldReactivateTheme("new", 5)).toBe(false);
    expectTest(shouldReactivateTheme("active", 5)).toBe(false);
    expectTest(shouldReactivateTheme("done", 5)).toBe(false); // User settled; don't override
    expectTest(shouldReactivateTheme(null, 5)).toBe(false);
    expectTest(shouldReactivateTheme("", 5)).toBe(false);
  });

  testFn("handles case-insensitive status strings", () => {
    expectTest(shouldReactivateTheme("DISMISSED", 5)).toBe(true);
    expectTest(shouldReactivateTheme("Merged", 5)).toBe(true);
    expectTest(shouldReactivateTheme("ARCHIVED", 5)).toBe(true);
  });
});

/**
 * Validate that a signal-to-theme match is strong enough to warrant attachment.
 * Uses cosine similarity with a conservative threshold to avoid attaching
 * semantically unrelated signals to themes.
 */
export function isValidThemeMatch(similarity: number): boolean {
  // 0.7+ cosine similarity = roughly 45 degrees in vector space.
  // Below this, the match is noise (even random vectors have non-zero similarity).
  return similarity >= 0.7;
}

describeTest("isValidThemeMatch", () => {
  testFn("accepts high-similarity matches", () => {
    expectTest(isValidThemeMatch(0.7)).toBe(true);
    expectTest(isValidThemeMatch(0.8)).toBe(true);
    expectTest(isValidThemeMatch(0.99)).toBe(true);
    expectTest(isValidThemeMatch(1.0)).toBe(true);
  });

  testFn("rejects low-similarity matches", () => {
    expectTest(isValidThemeMatch(0.69)).toBe(false);
    expectTest(isValidThemeMatch(0.5)).toBe(false);
    expectTest(isValidThemeMatch(0.0)).toBe(false);
    expectTest(isValidThemeMatch(-0.1)).toBe(false);
  });
});
