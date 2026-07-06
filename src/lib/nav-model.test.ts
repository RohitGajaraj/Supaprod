import { describe, it, expect } from "bun:test";
import {
  PRIMARY_NAV,
  ENGINE_GROUP,
  FOOTER_NAV,
  ENGINE_ROOM_PATHS,
  navItemActive,
  engineRoomActive,
} from "./nav-model";
import { CANONICAL_PATHS } from "./legacy-redirects";

/**
 * IA-NAV-V11 → OBS-02 → OBS-10 → LOOM W1 → Decide (2026-07-07): the rail is
 * one calm grouped list where EVERYTHING is reachable by clicking (the LOOM
 * visibility law): THE LOOP (6 destinations, Decide is its own decide stage
 * between Discover and Plan) + THE ENGINE (2 visible rows: Engine Room, Trust
 * Ledger) + the footer (Settings, role-gated Admin). Connections was removed
 * from the rail (2026-07-06): connecting lives in Settings > Connections and
 * /sync (Sync & bindings) is reached from there. These tests lock the
 * invariants: unique live paths, no /chat, no /knowledge (renamed /brain).
 */

describe("nav-model - THE LOOP (primary destinations)", () => {
  it("is one flat list of exactly six outcome-named destinations", () => {
    expect(PRIMARY_NAV.length).toBe(6);
    const labels = PRIMARY_NAV.map((n) => n.label);
    expect(labels).toEqual(["Today", "Discover", "Decide", "Define", "Build", "Brain"]);
  });

  it("every destination has a route, a label, and a mono index 01-06", () => {
    for (const n of PRIMARY_NAV) {
      expect(n.to.startsWith("/")).toBe(true);
      expect(n.label.length).toBeGreaterThan(0);
      expect(n.index).toMatch(/^0[1-6]$/);
    }
    expect(PRIMARY_NAV.map((n) => n.index)).toEqual(["01", "02", "03", "04", "05", "06"]);
  });

  it("Brain's URL and label agree: /brain, never /knowledge (LOOM rename)", () => {
    const brain = PRIMARY_NAV.find((n) => n.label === "Brain");
    expect(brain?.to).toBe("/brain");
    expect(PRIMARY_NAV.some((n) => n.to === "/knowledge")).toBe(false);
  });

  it("Decide is its own destination at index 03, between Discover and Plan", () => {
    const decide = PRIMARY_NAV.find((n) => n.label === "Decide");
    expect(decide?.to).toBe("/decide");
    expect(decide?.index).toBe("03");
    const order = PRIMARY_NAV.map((n) => n.to);
    expect(order.indexOf("/decide")).toBe(order.indexOf("/discover") + 1);
    expect(order.indexOf("/plan")).toBe(order.indexOf("/decide") + 1);
  });

  it("the six `to` values equal the canonical set", () => {
    const targets = PRIMARY_NAV.map((n) => n.to);
    expect(new Set(targets).size).toBe(targets.length);
    for (const t of targets) {
      expect(CANONICAL_PATHS as readonly string[]).toContain(t);
    }
  });

  it("no entry is /chat (Ask is the ⌘J panel, not a rail destination)", () => {
    expect(PRIMARY_NAV.some((n) => n.to === "/chat")).toBe(false);
  });
});

describe("nav-model - THE ENGINE (visible machinery group)", () => {
  it("exposes exactly Engine Room and Trust Ledger with indices 07-08 (Connections moved to Settings)", () => {
    expect(ENGINE_GROUP.map((n) => n.label)).toEqual(["Engine Room", "Trust Ledger"]);
    expect(ENGINE_GROUP.map((n) => n.index)).toEqual(["07", "08"]);
  });

  it("keeps engine-room + trust-ledger in the rail; /sync is off the rail (reached from Settings > Connections)", () => {
    const targets = ENGINE_GROUP.map((n) => n.to);
    expect(targets).toContain("/engine-room");
    expect(targets).toContain("/trust-ledger");
    expect(targets).not.toContain("/sync");
  });

  it("Approvals never appears here (approvals are Calls on Today, contract §8)", () => {
    expect(ENGINE_GROUP.some((l) => l.label === "Approvals")).toBe(false);
  });

  it("all rail paths (loop + engine + footer) are unique", () => {
    const all = [...PRIMARY_NAV, ...ENGINE_GROUP, ...FOOTER_NAV].map((n) => n.to);
    expect(new Set(all).size).toBe(all.length);
  });
});

describe("nav-model - the footer (Settings + role-gated Admin)", () => {
  it("Settings and Admin console are visible rail rows (the visibility law)", () => {
    expect(FOOTER_NAV.map((n) => n.to)).toEqual(["/settings", "/admin"]);
  });
});

describe("nav-model - active-state math", () => {
  it("navItemActive matches an exact bare path and rejects others", () => {
    expect(navItemActive({ to: "/" }, "/", null)).toBe(true);
    expect(navItemActive({ to: "/discover" }, "/discover", null)).toBe(true);
    expect(navItemActive({ to: "/discover" }, "/build", null)).toBe(false);
  });

  it("navItemActive respects a tab scope when the item declares one", () => {
    const item = { to: "/govern", search: { tab: "approvals" } };
    expect(navItemActive(item, "/govern", "approvals")).toBe(true);
    expect(navItemActive(item, "/govern", "budgets")).toBe(false);
    expect(navItemActive(item, "/govern", null)).toBe(false);
  });

  it("engineRoomActive is true anywhere inside the engine room, false outside", () => {
    expect(engineRoomActive("/engine-room")).toBe(true);
    expect(engineRoomActive("/engine-room/anything")).toBe(true);
    expect(engineRoomActive("/govern")).toBe(true);
    expect(engineRoomActive("/trust-ledger")).toBe(true);
    expect(engineRoomActive("/sync")).toBe(true);
    expect(engineRoomActive("/")).toBe(false);
    expect(engineRoomActive("/discover")).toBe(false);
    expect(engineRoomActive("/governance-board")).toBe(false);
  });

  it("ENGINE_ROOM_PATHS covers exactly the engine surfaces incl. the /govern drill layer", () => {
    expect([...ENGINE_ROOM_PATHS].sort()).toEqual([
      "/engine-room",
      "/govern",
      "/sync",
      "/trust-ledger",
    ]);
  });
});
