/**
 * THE DERIVATION LAW, held on the surface that draws it.
 *
 * nav-model.ts declares that the displayed key hint and the bound key can
 * never drift, because both come from `navKeyHint`. Until now the only file
 * that obeyed it was the command palette, which _authenticated.tsx documents
 * as unmounted, so twelve bare keys fired and none of them was drawn anywhere
 * a user could see. AppFrame now draws the hint on the rail rows themselves.
 *
 * These tests fail the moment that hint stops being derived: if someone types
 * a literal "0" onto the Today row, or rebinds a key in nav-model and the rail
 * keeps drawing the old one, or invents a keycap for a row the keyboard cannot
 * actually reach.
 *
 * Pure module-level values only, deliberately: no render, no router, no
 * providers. What is being protected is the derivation, not the markup.
 */
import { describe, expect, it } from "bun:test";
import { RAIL_DOORS, SETTINGS_KEY } from "./AppFrame";
import { FOOTER_NAV, PRIMARY_NAV, navKeyHint } from "@/lib/nav-model";

const DOORS = [...PRIMARY_NAV, ...FOOTER_NAV];

describe("the rail hint is derived from the binding", () => {
  it("draws exactly what navKeyHint binds, for every rail row", () => {
    for (const row of RAIL_DOORS) {
      const bound = DOORS.find((d) => d.to === row.to);
      expect(row.key).toBe(bound ? navKeyHint(bound) : "");
    }
  });

  it("never draws a keycap for a row the keyboard cannot reach", () => {
    for (const row of RAIL_DOORS) {
      if (row.key === "") continue;
      // A drawn key must resolve back to a real destination in the same list
      // GotoShortcuts searches, or the keycap is a promise nothing keeps.
      const bound = DOORS.filter((d) => navKeyHint(d) === row.key);
      expect(bound.map((d) => d.to)).toContain(row.to);
    }
  });

  it("gives one key to one door, so no keycap is ambiguous", () => {
    const drawn = RAIL_DOORS.filter((r) => r.key !== "").map((r) => r.key);
    expect(new Set(drawn).size).toBe(drawn.length);
  });

  it("draws nothing for a path outside the nav model", () => {
    // /runs and /crew are in the rail and in no nav list, which is exactly the
    // "no binding" case: the row must come back with an empty key, not a
    // guessed one.
    for (const row of RAIL_DOORS) {
      if (DOORS.some((d) => d.to === row.to)) continue;
      expect(row.key).toBe("");
    }
  });

  it("carries the footer door's key too", () => {
    expect(SETTINGS_KEY).toBe(navKeyHint(FOOTER_NAV.find((d) => d.to === "/settings")!));
  });
});

/**
 * THE MEASURED GAP, CLOSED 2026-08-05 - and now pinned shut.
 *
 * This block used to record three of five rail rows holding a key, with /runs
 * and /crew in no nav list at all, and it said: "If someone later binds a key
 * to /runs or /crew, this test fails and the rail is already drawing the new
 * hint by then. That is the intended failure: it says the gap closed."
 *
 * (The second block below was itself rewritten on 2026-08-05, for the same
 * reason: it recorded "seven bound keys pointing at stations with no rail row"
 * as a standing gap, and that gap is closed by AppFrame's `owns` field. A test
 * that keeps asserting a defect after the defect is fixed teaches the next
 * reader something false.)
 *
 * That is what happened. Both paths are destinations in PRIMARY_NAV now
 * (nav-model.ts), keyed `u` and `e` - a letter of each label, because `r` is
 * Reject on the approvals queue and `c` is Challenge on the decide gate, and a
 * window-level shortcut that lands on a gate letter fires both. AppFrame drew
 * the two new keycaps with no edit of its own: that is the derivation working.
 *
 * The assertion is inverted deliberately. It no longer records how many rows
 * are unreachable; it forbids ANY rail row from being unreachable, so the gap
 * cannot reopen one row at a time.
 */
describe("which rail doors the keyboard reaches", () => {
  it("keys every rail row, and leaves none unreachable", () => {
    const keyed = RAIL_DOORS.filter((r) => r.key !== "").map((r) => r.to);
    const unkeyed = RAIL_DOORS.filter((r) => r.key === "").map((r) => r.to);
    // SIX since 2026-08-31 (F-144/145/146 fold): /runs removed, folds into
    // /today. Approvals and Threads arrived 2026-08-24 with doors of their own
    // (Today gave its `t` to Threads and took `o` - g o, the word the chord
    // acts). Work arrived 2026-08-25: the /start composer and every /track/:id
    // run screen finally have a named, keyed door - the founder's "no home or
    // entry door" ruling, `g w`.
    expect(keyed).toEqual([
      "/today",
      "/approvals",
      "/start",
      "/brain",
      "/threads",
      "/engine-room",
    ]);
    expect(unkeyed).toEqual([]);
  });

  it("still draws no ROW for the seven stations or for Settings", () => {
    const railPaths = new Set(RAIL_DOORS.map((r) => r.to));
    const noRow = DOORS.filter((d) => navKeyHint(d) !== "" && !railPaths.has(d.to)).map(
      (d) => d.to,
    );
    // The seven loop stations plus Settings. This list is a RECORD OF THE
    // DECIDED SHAPE, not of a defect: the seven stations live on the 01-07
    // strip (run-strip.tsx chose that on 2026-08-05 and paid 97px for it) and
    // Settings is a door in the rail foot rather than a place you live.
    //
    // What used to be wrong is that none of these eight lit ANYTHING in the
    // rail, so the keyboard took you somewhere the shell could not name. That
    // is now impossible and the impossibility is enforced next door, in
    // AppFrame.rail-covers-keys.test.ts: the seven hang under the /runs row
    // via `owns`, Settings lights its own control in the foot. A row for any
    // of them would be a nav change; a lit row is a fact about where you are.
    // /crew joined this list on 2026-08-15 for the same reason Settings is on
    // it: it is a door you open from the foot, not a place you live. Its
    // surface, its route and its key are unchanged.
    expect(noRow).toEqual([
      "/discover",
      "/decide",
      "/plan",
      "/design",
      "/build",
      "/ship",
      "/learn",
      "/crew",
      "/settings",
    ]);
  });
});
