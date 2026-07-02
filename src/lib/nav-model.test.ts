import { describe, it, expect } from "bun:test";
import {
  PRIMARY_NAV,
  ENGINE_ROOM_DOOR,
  ENGINE_ROOM_LINKS,
  ENGINE_ROOM_PATHS,
  navItemActive,
  engineRoomActive,
} from "./nav-model";
import { CANONICAL_PATHS } from "./legacy-redirects";

/**
 * IA-NAV-V11 (v11 #12) -> OBS-02 -> OBS-10 - the nav must collapse the four
 * competing metaphors into one calm flat list + one engine-room door, WITHOUT
 * orphaning any destination the old 5-icon Trust row exposed. These tests
 * lock both, plus OBS-10's final-state invariant: exactly five unique
 * canonical routes, no shared interim `/product` tab-scoping, no `/chat`.
 */

describe("nav-model - the calm front (primary destinations)", () => {
  it("is one flat list of exactly five outcome-named destinations", () => {
    expect(PRIMARY_NAV.length).toBe(5);
    const labels = PRIMARY_NAV.map((n) => n.label);
    expect(labels).toEqual(["Today", "Discover", "Plan", "Build", "Brain"]);
  });

  it("every destination has a route, a label, and a mono index", () => {
    for (const n of PRIMARY_NAV) {
      expect(n.to.startsWith("/")).toBe(true);
      expect(n.label.length).toBeGreaterThan(0);
      expect(n.index).toMatch(/^0[1-5]$/);
    }
  });

  it("indices are 01-05, in order, and unique", () => {
    const indices = PRIMARY_NAV.map((n) => n.index);
    expect(indices).toEqual(["01", "02", "03", "04", "05"]);
    expect(new Set(indices).size).toBe(indices.length);
  });

  it("no lucide icon field survives on a primary destination", () => {
    for (const n of PRIMARY_NAV) {
      expect((n as { icon?: unknown }).icon).toBeUndefined();
    }
  });

  it("the five `to` values equal the canonical set (OBS-10: no more shared /product)", () => {
    const targets = PRIMARY_NAV.map((n) => n.to);
    expect(new Set(targets).size).toBe(targets.length);
    for (const t of targets) {
      expect(CANONICAL_PATHS as readonly string[]).toContain(t);
    }
  });

  it("no entry is /chat (Ask is not a rail destination - it returns as the ⌘J panel, OBS-12)", () => {
    expect(PRIMARY_NAV.some((n) => n.label === "Ask")).toBe(false);
    expect(PRIMARY_NAV.some((n) => n.to === "/chat")).toBe(false);
  });
});

describe("nav-model - the engine room door (deep engine behind one door)", () => {
  it("the door points at the new ported glance /engine-room and is labelled Engine Room", () => {
    expect(ENGINE_ROOM_DOOR.to).toBe("/engine-room");
    expect(ENGINE_ROOM_DOOR.label).toBe("Engine Room");
  });

  it("Approvals is not in the door links (approvals are Calls on Today, never in the door)", () => {
    expect(ENGINE_ROOM_LINKS.some((l) => l.label === "Approvals")).toBe(false);
  });

  it("reveals every surface the old Trust row exposed - nothing is orphaned", () => {
    const targets = ENGINE_ROOM_LINKS.map((l) => l.to);
    // Trust Ledger and Connectors are NOT in the ⌘K palette, so the door is their
    // only sidebar path - they must be present.
    expect(targets).toContain("/trust-ledger");
    expect(targets).toContain("/sync");
    const spend = ENGINE_ROOM_LINKS.find((l) => l.label === "Spend");
    expect(spend?.to).toBe("/engine-room");
    expect(spend?.search?.room).toBe("spend");
  });

  it("every door link resolves to a live path (canonical or door-internal)", () => {
    for (const l of ENGINE_ROOM_LINKS) {
      expect(l.to === "/engine-room" || l.to === "/trust-ledger" || l.to === "/sync").toBe(true);
    }
  });

  it("keeps four engine-room door links (Approvals dropped)", () => {
    expect(ENGINE_ROOM_LINKS.length).toBe(4);
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
    expect(engineRoomActive("/govern/anything")).toBe(true);
    expect(engineRoomActive("/trust-ledger")).toBe(true);
    expect(engineRoomActive("/sync")).toBe(true);
    expect(engineRoomActive("/")).toBe(false);
    expect(engineRoomActive("/discover")).toBe(false);
    // a path that merely starts with a prefix string but isn't a sub-route stays out
    expect(engineRoomActive("/governance-board")).toBe(false);
  });

  it("ENGINE_ROOM_PATHS covers exactly the door's deep surfaces", () => {
    expect([...ENGINE_ROOM_PATHS].sort()).toEqual([
      "/engine-room",
      "/govern",
      "/sync",
      "/trust-ledger",
    ]);
  });
});
