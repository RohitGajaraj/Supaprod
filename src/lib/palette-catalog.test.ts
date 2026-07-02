import { describe, expect, it } from "bun:test";
import { CATALOG, filterCatalog } from "./palette-catalog";
import { ACT_VERBS, JUMP_DESTINATIONS } from "./palette-sections";
import { CANONICAL_PATHS, DOOR_INTERNAL_PATHS } from "./legacy-redirects";

const KNOWN_ROUTES = new Set<string>([...CANONICAL_PATHS, ...DOOR_INTERNAL_PATHS]);

describe("palette-catalog", () => {
  it("filterCatalog is case-insensitive and matches on pitch", () => {
    expect(filterCatalog("BELIEF").map((e) => e.id)).toContain("challenge-belief");
    expect(filterCatalog("belief").map((e) => e.id)).toContain("challenge-belief");
  });

  it("filterCatalog returns [] for a nonsense query", () => {
    expect(filterCatalog("xzzqfnotarealword")).toEqual([]);
  });

  it("filterCatalog with an empty query returns the full catalog in its declared order", () => {
    expect(filterCatalog("")).toEqual(CATALOG);
    expect(filterCatalog("   ")).toEqual(CATALOG);
  });

  it("every catalog entry's run.to is a known canonical or door-internal route", () => {
    for (const entry of CATALOG) {
      expect(KNOWN_ROUTES.has(entry.run.to)).toBe(true);
    }
  });

  it("every catalog entry has a non-empty pitch and a unique id", () => {
    const ids = new Set<string>();
    for (const entry of CATALOG) {
      expect(entry.pitch.length).toBeGreaterThan(0);
      expect(ids.has(entry.id)).toBe(false);
      ids.add(entry.id);
    }
  });
});

describe("palette-sections", () => {
  it("JUMP_DESTINATIONS has exactly five entries", () => {
    expect(JUMP_DESTINATIONS.length).toBe(5);
  });

  it("every JUMP destination's run.to is a canonical path", () => {
    for (const dest of JUMP_DESTINATIONS) {
      expect((CANONICAL_PATHS as readonly string[]).includes(dest.run.to)).toBe(true);
    }
  });

  it("JUMP hints are 1-5, unique", () => {
    const hints = JUMP_DESTINATIONS.map((d) => d.hint);
    expect(hints).toEqual(["1", "2", "3", "4", "5"]);
  });

  it("ACT_VERBS is non-empty and every verb has a run target", () => {
    expect(ACT_VERBS.length).toBeGreaterThan(0);
    for (const verb of ACT_VERBS) {
      expect(verb.label.length).toBeGreaterThan(0);
      expect(verb.run.to.startsWith("/")).toBe(true);
    }
  });
});
