import { describe, expect, it } from "bun:test";
import { CANONICAL_PATHS, DOOR_INTERNAL_PATHS, LEGACY_REDIRECTS } from "./legacy-redirects";

const ALLOWED_TARGETS = new Set<string>([...CANONICAL_PATHS, ...DOOR_INTERNAL_PATHS]);

describe("legacy-redirects", () => {
  it("every redirect target is canonical or door-internal, never another legacy key", () => {
    for (const [from, target] of Object.entries(LEGACY_REDIRECTS)) {
      expect(ALLOWED_TARGETS.has(target.to)).toBe(true);
      expect(Object.hasOwn(LEGACY_REDIRECTS, target.to)).toBe(false);
      expect(target.to).not.toBe(from);
    }
  });

  it("has exactly twelve canonical paths, one per primary destination (Option B 2026-07-13; twelve since Approvals and Threads got doors 2026-08-24)", () => {
    expect(CANONICAL_PATHS.length).toBe(12);
    expect(new Set(CANONICAL_PATHS).size).toBe(12);
  });

  it("no path appears in both the canonical set and the door-internal set", () => {
    const overlap = CANONICAL_PATHS.filter((p) =>
      (DOOR_INTERNAL_PATHS as readonly string[]).includes(p),
    );
    expect(overlap).toEqual([]);
  });

  it("no legacy key is also a canonical path (nothing redirects a real destination away)", () => {
    for (const key of Object.keys(LEGACY_REDIRECTS)) {
      expect((CANONICAL_PATHS as readonly string[]).includes(key)).toBe(false);
    }
  });

  it("search params, where present, are non-empty plain string maps", () => {
    for (const target of Object.values(LEGACY_REDIRECTS)) {
      if (target.search) {
        expect(Object.keys(target.search).length).toBeGreaterThan(0);
        for (const v of Object.values(target.search)) {
          expect(typeof v).toBe("string");
        }
      }
    }
  });
});
