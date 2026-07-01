import { describe, expect, test } from "bun:test";
import { extractThemesJson } from "./cluster.server";

// Regression coverage for the 2026-07-01 cluster-tick incident: google/gemini-2.5-pro
// (called with responseFormat=json_object) sometimes returns the bare array of theme
// objects instead of the documented `{"themes": [...]}` wrapper. That response is valid,
// parseable JSON — the bug was clusterSignalsCore reading `.themes` off a top-level array
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
