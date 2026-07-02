import { describe, it, expect } from "bun:test";
import {
  PRIMARY_NAV,
  ENGINE_ROOM_DOOR,
  ENGINE_ROOM_LINKS,
  ENGINE_ROOM_PATHS,
  navItemActive,
  engineRoomActive,
} from "./nav-model";

/**
 * IA-NAV-V11 (v11 #12) → OBS-02 — the nav must collapse the four competing
 * metaphors into one calm flat list + one engine-room door, WITHOUT orphaning
 * any destination the old 5-icon Trust row exposed. These tests lock both.
 *
 * OBS-02: Obsidian has no icon set (mono numeral index 01-05 instead), Ask
 * leaves the rail, and Discover/Plan are added. Discover and Plan share the
 * interim `/product` route (differentiated by `search.tab`) until OBS-10
 * renames the routes and adds redirects — the old "routes are unique" /
 * "nothing is tab-scoped" invariants are relaxed to match that interim state.
 */

describe("nav-model — the calm front (primary destinations)", () => {
  it("is one flat list of outcome-named destinations", () => {
    expect(PRIMARY_NAV.length).toBeGreaterThanOrEqual(5);
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

  it("destinations are unique by route+tab (interim: Discover/Plan share /product until OBS-10)", () => {
    const keys = PRIMARY_NAV.map((n) => `${n.to}?${n.search?.tab ?? ""}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("Ask is not a rail destination (it returns as the ⌘J panel, OBS-12)", () => {
    expect(PRIMARY_NAV.some((n) => n.label === "Ask")).toBe(false);
    expect(PRIMARY_NAV.some((n) => n.to === "/chat")).toBe(false);
  });

  it("Discover and Plan (interim /product siblings) are never both active for the same tab", () => {
    const discover = PRIMARY_NAV.find((n) => n.label === "Discover")!;
    const plan = PRIMARY_NAV.find((n) => n.label === "Plan")!;
    for (const tab of ["signals", "opportunities", "roadmap", "specs", "releases", null]) {
      const activeCount = [discover, plan].filter((n) =>
        navItemActive(n, "/product", tab),
      ).length;
      expect(activeCount).toBeLessThanOrEqual(1);
    }
  });
});

describe("nav-model — the engine room door (deep engine behind one door)", () => {
  it("the door points at the engine room and is labelled Engine Room", () => {
    expect(ENGINE_ROOM_DOOR.to).toBe("/govern");
    expect(ENGINE_ROOM_DOOR.label).toBe("Engine Room");
  });

  it("reveals every surface the old Trust row exposed — nothing is orphaned", () => {
    const targets = ENGINE_ROOM_LINKS.map((l) => l.to);
    // Trust Ledger and Connectors are NOT in the ⌘K palette, so the door is their
    // only sidebar path — they must be present.
    expect(targets).toContain("/trust-ledger");
    expect(targets).toContain("/sync");
    // Approvals + Spend live as tabs on /govern.
    const approvals = ENGINE_ROOM_LINKS.find((l) => l.label === "Approvals");
    expect(approvals?.to).toBe("/govern");
    expect(approvals?.search?.tab).toBe("approvals");
    const spend = ENGINE_ROOM_LINKS.find((l) => l.label === "Spend");
    expect(spend?.search?.tab).toBe("budgets");
  });

  it("keeps all five engine-room destinations", () => {
    expect(ENGINE_ROOM_LINKS.length).toBe(5);
  });
});

describe("nav-model — active-state math", () => {
  it("navItemActive matches an exact bare path and rejects others", () => {
    expect(navItemActive({ to: "/" }, "/", null)).toBe(true);
    expect(navItemActive({ to: "/product" }, "/product", null)).toBe(true);
    expect(navItemActive({ to: "/product" }, "/build", null)).toBe(false);
  });

  it("navItemActive respects a tab scope when the item declares one", () => {
    const item = { to: "/govern", search: { tab: "approvals" } };
    expect(navItemActive(item, "/govern", "approvals")).toBe(true);
    expect(navItemActive(item, "/govern", "budgets")).toBe(false);
    expect(navItemActive(item, "/govern", null)).toBe(false);
  });

  it("engineRoomActive is true anywhere inside the engine room, false outside", () => {
    expect(engineRoomActive("/govern")).toBe(true);
    expect(engineRoomActive("/govern/anything")).toBe(true);
    expect(engineRoomActive("/trust-ledger")).toBe(true);
    expect(engineRoomActive("/sync")).toBe(true);
    expect(engineRoomActive("/")).toBe(false);
    expect(engineRoomActive("/product")).toBe(false);
    // a path that merely starts with a prefix string but isn't a sub-route stays out
    expect(engineRoomActive("/governance-board")).toBe(false);
  });

  it("ENGINE_ROOM_PATHS covers exactly the door's deep surfaces", () => {
    expect([...ENGINE_ROOM_PATHS].sort()).toEqual(["/govern", "/sync", "/trust-ledger"]);
  });
});
