/**
 * FIFTH REVIEW, 2026-09-09. Three of the five tests here iterated
 * `LEGACY_REDIRECTS`, and that map is gone: P-10 deleted every route its thirty
 * keys named, so it documented thirty doors none of which existed and pointed
 * two of them at `/today`, itself deleted in the same commit. The tests passed
 * the whole time, because they only checked the map against itself.
 *
 * What survives is what the two lists are actually for: they are the canon
 * `nav-model.test.ts` and `palette-catalog.test.ts` read to answer "is this a
 * real destination", so their size and their disjointness are the properties
 * worth holding.
 */
import { describe, expect, it } from "bun:test";
import { CANONICAL_PATHS, DOOR_INTERNAL_PATHS } from "./legacy-redirects";

describe("the route canon", () => {
  it("has exactly eight canonical paths, one per primary destination still standing", () => {
    // Twelve since Approvals and Threads got doors 2026-08-24; eleven, ten,
    // nine, then eight since P-14 deleted /decide, /plan, /design and /build
    // (A-QUEUE.md, R-34). Still eight on 2026-09-09: /today left and /start,
    // the signed-in home it was standing in for, took its place.
    expect(CANONICAL_PATHS.length).toBe(8);
    expect(new Set(CANONICAL_PATHS).size).toBe(8);
  });

  it("no path appears in both the canonical set and the door-internal set", () => {
    const overlap = CANONICAL_PATHS.filter((p) =>
      (DOOR_INTERNAL_PATHS as readonly string[]).includes(p),
    );
    expect(overlap).toEqual([]);
  });
});
