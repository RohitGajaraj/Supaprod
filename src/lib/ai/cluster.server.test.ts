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

/**
 * Theme growth gates, tested against the SHIPPED functions.
 *
 * These tests previously declared their own local copies of shouldReactivateTheme
 * and isValidThemeMatch inside this file and asserted against those, importing
 * bun:test a second time under aliases to do it. So they passed while never once
 * touching the code that runs, and they went on passing after the real
 * shouldReactivateTheme was corrected on 2026-08-02, still asserting the OLD
 * behaviour: a flat "frequency >= 5" bar and `merged` counting as re-activatable.
 * A test that green-lights the exact defect it is named after is worse than no
 * test, because it is read as evidence.
 */
import { shouldReactivateTheme, isValidThemeMatch } from "./cluster.server";
import { THEME_ATTACH_THRESHOLD } from "./theme-growth";

describe("shouldReactivateTheme", () => {
  test("measures growth against the size at the decline, not a flat count", () => {
    // Declined at 2, now 5: doubled AND grew by 3, so it comes back.
    expect(shouldReactivateTheme("dismissed", 5, 2)).toBe(true);
    // Declined at 2, now 4: doubled but only grew by 2, so it stays quiet.
    expect(shouldReactivateTheme("dismissed", 4, 2)).toBe(false);
  });

  test("does not re-open a large decline on a single new signal", () => {
    // The old flat ">= 5" rule returned true here, which handed the user back a
    // decision they had just closed. It must not.
    expect(shouldReactivateTheme("dismissed", 41, 40)).toBe(false);
    expect(shouldReactivateTheme("dismissed", 80, 40)).toBe(true);
  });

  test("a theme declined before the column existed never escalates", () => {
    expect(shouldReactivateTheme("dismissed", 999, null)).toBe(false);
    expect(shouldReactivateTheme("dismissed", 999, undefined)).toBe(false);
  });

  test("only a dismissed theme is re-activatable", () => {
    // `merged` is deliberately NOT re-activatable: its evidence belongs to the
    // theme it was merged into, so reopening it strands that evidence.
    expect(shouldReactivateTheme("merged", 50, 2)).toBe(false);
    expect(shouldReactivateTheme("new", 50, 2)).toBe(false);
    expect(shouldReactivateTheme("active", 50, 2)).toBe(false);
    expect(shouldReactivateTheme(null, 50, 2)).toBe(false);
    expect(shouldReactivateTheme("", 50, 2)).toBe(false);
  });

  test("status matching stays case insensitive", () => {
    expect(shouldReactivateTheme("DISMISSED", 5, 2)).toBe(true);
  });
});

describe("isValidThemeMatch", () => {
  test("accepts a match at or above the attach threshold", () => {
    expect(isValidThemeMatch(THEME_ATTACH_THRESHOLD)).toBe(true);
    expect(isValidThemeMatch(0.95)).toBe(true);
    expect(isValidThemeMatch(1)).toBe(true);
  });

  test("rejects the merely-related band the old 0.7 bar let through", () => {
    expect(isValidThemeMatch(0.7)).toBe(false);
    expect(isValidThemeMatch(0.79)).toBe(false);
    expect(isValidThemeMatch(0.5)).toBe(false);
    expect(isValidThemeMatch(0)).toBe(false);
    expect(isValidThemeMatch(-0.1)).toBe(false);
  });

  test("stays pinned to the shared constant so the two cannot drift", () => {
    expect(isValidThemeMatch(THEME_ATTACH_THRESHOLD - 0.001)).toBe(false);
  });
});
