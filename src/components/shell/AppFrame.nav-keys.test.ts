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
 * THE MEASURED GAP, pinned so it cannot widen quietly.
 *
 * Three of the five rail rows hold a key. /runs and /crew hold none: neither
 * path is in PRIMARY_NAV at all, so no key navigates to them. This is recorded
 * rather than fixed here, because fixing it means either a new binding or a
 * new rail row, and the five rows are decided.
 *
 * If someone later binds a key to /runs or /crew, this test fails and the rail
 * is already drawing the new hint by then. That is the intended failure: it
 * says "the gap closed", not "something broke".
 */
describe("which rail doors the keyboard reaches today", () => {
  it("keys three of the five rows, and says which two are unreachable", () => {
    const keyed = RAIL_DOORS.filter((r) => r.key !== "").map((r) => r.to);
    const unkeyed = RAIL_DOORS.filter((r) => r.key === "").map((r) => r.to);
    expect(keyed).toEqual(["/today", "/brain", "/engine-room"]);
    expect(unkeyed).toEqual(["/runs", "/crew"]);
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
