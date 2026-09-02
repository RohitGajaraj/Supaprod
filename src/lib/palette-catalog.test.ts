import { describe, expect, it } from "bun:test";
import { CATALOG, filterCatalog } from "./palette-catalog";
import {
  ACT_VERBS,
  GLOBALLY_MOUNTED_EVENTS,
  JUMP_DESTINATIONS,
  type PaletteRun,
} from "./palette-sections";
import { CANONICAL_PATHS, DOOR_INTERNAL_PATHS } from "./legacy-redirects";
import { PRIMARY_NAV, navKeyHint } from "./nav-model";

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
  it("JUMP_DESTINATIONS has one entry per primary destination (derived from PRIMARY_NAV)", () => {
    expect(JUMP_DESTINATIONS.length).toBe(PRIMARY_NAV.length);
    // Three since P-11 (A-QUEUE.md, 2026-09-02): Start, Run, Settings.
    expect(JUMP_DESTINATIONS.length).toBe(3);
  });

  it("every JUMP destination's run.to is a canonical path or a keyed rail door", () => {
    // CANONICAL_PATHS is the legacy-redirect canon (paths a dead URL may land
    // on) and DOOR_INTERNAL_PATHS is reached-from-a-door-but-not-itself-one
    // (legacy-redirects.ts's own two lists). Neither was ever meant to cover
    // a rail door's own identity, so Start and Run are named here instead —
    // Settings is already a DOOR_INTERNAL_PATH.
    const RAIL_DOORS = ["/start", "/track"];
    for (const dest of JUMP_DESTINATIONS) {
      const known =
        (CANONICAL_PATHS as readonly string[]).includes(dest.run.to) ||
        (DOOR_INTERNAL_PATHS as readonly string[]).includes(dest.run.to) ||
        RAIL_DOORS.includes(dest.run.to);
      expect(known).toBe(true);
    }
  });

  it("JUMP hints are the derived rail hints, unique", () => {
    const hints = JUMP_DESTINATIONS.map((d) => d.hint);
    expect(hints).toEqual(PRIMARY_NAV.map((n) => navKeyHint(n)));
    expect(new Set(hints).size).toBe(hints.length);
  });

  it("ACT_VERBS is non-empty and every verb has a run target", () => {
    expect(ACT_VERBS.length).toBeGreaterThan(0);
    for (const verb of ACT_VERBS) {
      expect(verb.label.length).toBeGreaterThan(0);
      expect(verb.run.to.startsWith("/")).toBe(true);
    }
  });

  it("every ACT verb points at a route the app actually has", () => {
    // The check ACT never had while JUMP did. JUMP is DERIVED from PRIMARY_NAV
    // and so cannot drift; ACT is a hand-written literal array, which is why it
    // was the half that rotted -- a literal cannot notice that its destination
    // was rebuilt underneath it, and that is exactly what happened when Today
    // lost its Desk and four verbs kept pointing at it.
    for (const verb of ACT_VERBS) {
      expect(KNOWN_ROUTES.has(verb.run.to)).toBe(true);
    }
  });

  it("every ACT verb is one of the two legal shapes, never both", () => {
    for (const verb of ACT_VERBS) {
      expect(isLegalActShape(verb.run)).toBe(true);
    }
  });

  it("the shape check rejects each of the four verbs K-37 removed", () => {
    // PLANTED ON PURPOSE. This is the proof the guard above has teeth: the four
    // events below are the exact literals that shipped, and every one of them
    // dispatched into nothing while the verb navigated to /today and hoped a
    // card would mount inside a ten-second TTL. The old assertion -- a label
    // and a `run.to` starting with "/" -- passed all four, which is how they
    // shipped. A guard that cannot fail is a suggestion.
    const shapeThree: PaletteRun[] = [
      { to: "/today", event: "supaprod:task-compose" },
      { to: "/today", event: "supaprod:signal-compose" },
      { to: "/today", event: "supaprod:status-compose" },
      { to: "/today", event: "supaprod:focus-compose" },
    ];
    for (const run of shapeThree) {
      expect(isLegalActShape(run)).toBe(false);
    }
  });

  it("Decide is reachable from ACT, and a Discover verb always says which part it means", () => {
    // The two halves of K-37's B+ that are visible in the data. Pinned as
    // CLAIMS rather than as label spellings, so improving the copy does not
    // fail the build and losing the reach does.
    //
    // Decide owns NameABet (_authenticated.decide.tsx:3385), the most valuable
    // act in the product, and ACT offered nothing for it until 2026-08-21.
    expect(ACT_VERBS.map((v) => v.run.to)).toContain("/decide");
    // Discover is a 3,400-line surface with several destinations inside it. A
    // verb that names one of them and then lands on the top of the page is the
    // broken deep link that route's own header was written about.
    for (const verb of ACT_VERBS.filter((v) => v.run.to === "/arriving")) {
      expect(Object.keys(verb.run.search ?? {}).length).toBeGreaterThan(0);
    }
  });
});

/**
 * THE SHAPE LAW, K-37 (founder ruling 2026-08-21, option B+):
 *
 *   A palette verb either NAVIGATES to the station that owns the job, or it
 *   ACTS IN PLACE through something mounted globally. It never does both.
 *
 * So a legal verb has no event, or an event on the globally-mounted list. A
 * verb carrying any other event is shape 3 -- navigate AND open something on
 * arrival -- which needs the destination to mount a listener within a TTL of a
 * route change it does not control. Nothing in the codebase enforces that
 * contract, and all four verbs that relied on it were silently dead.
 *
 * Reasoning: docs/decisions/palette-verb-shapes.md
 */
function isLegalActShape(run: PaletteRun): boolean {
  return !run.event || GLOBALLY_MOUNTED_EVENTS.includes(run.event);
}
