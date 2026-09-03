/**
 * ── ONE LIST, THREE SURFACES (P-60) ──────────────────────────────────────
 *
 * The rail draws the doors, the shortcut sheet teaches their keys, and ⌘K jumps
 * to them. Three places a door can be missing from, and the only defence that
 * has ever held here is that all three READ THE SAME LIST rather than each
 * keeping its own copy.
 *
 * That defence is not hypothetical. P-60 walked into two live copies while
 * adding six doors: `RAIL_DOORS` in palette-catalog.test.ts was the literal
 * `["/start", "/track"]`, and this file's own subject -- the rail -- keeps its
 * rows in `AppFrame.tsx` rather than in `nav-model.ts`, which is why the guard
 * below reads the rendered rail rather than trusting the model.
 */
import { describe, it, expect } from "bun:test";
import { PRIMARY_NAV, navKeyHint, NAV_CHORD_PREFIX } from "./nav-model";
import { JUMP_DESTINATIONS } from "./palette-sections";
import { RAIL_DOORS } from "@/components/shell/AppFrame";

describe("the rail, the sheet and the palette agree", () => {
  it("gives every door in the model a rail row or the foot", () => {
    const rail = new Set(RAIL_DOORS.map((d) => d.to));
    for (const door of PRIMARY_NAV) {
      // Settings is the foot control, not a row; every other door draws one.
      if (door.to === "/settings") continue;
      expect({ to: door.to, drawn: rail.has(door.to) }).toEqual({ to: door.to, drawn: true });
    }
  });

  it("gives every rail row a door in the model, so none is unreachable by key", () => {
    const model = new Set(PRIMARY_NAV.map((d) => d.to));
    for (const row of RAIL_DOORS) {
      expect({ to: row.to, known: model.has(row.to) }).toEqual({ to: row.to, known: true });
    }
  });

  it("lists every door in the palette, in the model's own order", () => {
    expect(JUMP_DESTINATIONS.map((d) => d.run.to)).toEqual(PRIMARY_NAV.map((d) => d.to));
  });

  it("teaches the same chord on all three", () => {
    // The palette's hint IS the rail's hint; a second derivation is how the
    // sheet once taught a key the rail did not draw.
    expect(JUMP_DESTINATIONS.map((d) => d.hint)).toEqual(PRIMARY_NAV.map((d) => navKeyHint(d)));
    for (const row of RAIL_DOORS) {
      const door = PRIMARY_NAV.find((d) => d.to === row.to);
      expect(row.key).toBe(door ? navKeyHint(door) : "");
    }
  });

  it("binds one distinct letter per door, and never the prefix itself", () => {
    const keys = PRIMARY_NAV.map((d) => navKeyHint(d));
    expect(keys.filter((k) => k === "")).toEqual([]);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).not.toContain(NAV_CHORD_PREFIX);
    for (const k of keys) expect(k).toMatch(/^[a-z]$/);
  });

  it("keeps every key a letter of the word it is drawn beside", () => {
    // The letter rule: a key you can derive from the label is a key you can
    // remember without the sheet.
    for (const door of PRIMARY_NAV) {
      expect(door.label.toLowerCase()).toContain(navKeyHint(door));
    }
  });

  it("says one word per door, which is the founder's rail ruling", () => {
    // FOUNDER 2026-09-01: "It has to be one single verb... Don't put the
    // sentence as the name of the shell." The question lives in the tagline.
    for (const door of PRIMARY_NAV) {
      expect(door.label.trim().split(/\s+/)).toHaveLength(1);
      expect(door.tagline.length).toBeGreaterThan(0);
    }
  });
});
