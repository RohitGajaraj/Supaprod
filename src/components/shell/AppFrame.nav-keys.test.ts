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
    expect(keyed).toEqual(["/today", "/runs", "/brain", "/crew", "/engine-room"]);
    expect(unkeyed).toEqual([]);
  });

  it("leaves seven bound keys pointing at stations with no rail row", () => {
    const railPaths = new Set(RAIL_DOORS.map((r) => r.to));
    const homeless = DOORS.filter((d) => navKeyHint(d) !== "" && !railPaths.has(d.to)).map(
      (d) => d.to,
    );
    // The seven loop stations plus Settings, which has its own door in the
    // rail foot and carries its hint on that control's name.
    expect(homeless).toEqual([
      "/discover",
      "/decide",
      "/plan",
      "/design",
      "/build",
      "/ship",
      "/learn",
      "/settings",
    ]);
  });
});
