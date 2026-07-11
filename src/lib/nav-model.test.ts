import { describe, it, expect } from "bun:test";
import {
  PRIMARY_NAV,
  WORKFLOW_NAV,
  FOOTER_NAV,
  ENGINE_ROOM_PATHS,
  navItemActive,
  navKeyHint,
  engineRoomActive,
} from "./nav-model";
import { CANONICAL_PATHS } from "./legacy-redirects";

/**
 * IA SPINE (2026-07-11): ONE rail, seven primary destinations, keys 1-7:
 * Today (pinned, unnumbered) · WORKFLOW (01 Discover · 02 Plan · 03 Design ·
 * 04 Build — mono indexes live only here) · Memory (/brain) · Engine Room.
 * THE ENGINE group is gone; Decide and Ledger left the rail (redirect stubs).
 * These tests lock the invariants; the derivation law (palette JUMP + key
 * hints + shortcut range derive from PRIMARY_NAV) is locked in
 * __tests__/nav-model.test.ts.
 */

describe("nav-model - the seven primary destinations", () => {
  it("is one flat ordered list of exactly seven destinations", () => {
    expect(PRIMARY_NAV.length).toBe(7);
    expect(PRIMARY_NAV.map((n) => n.label)).toEqual([
      "Today",
      "Discover",
      "Plan",
      "Design",
      "Build",
      "Memory",
      "Engine Room",
    ]);
    expect(PRIMARY_NAV.map((n) => n.to)).toEqual([
      "/today",
      "/discover",
      "/plan",
      "/design",
      "/build",
      "/brain",
      "/engine-room",
    ]);
  });

  it("Today is pinned first, unnumbered, and ungrouped", () => {
    expect(PRIMARY_NAV[0].to).toBe("/today");
    expect(PRIMARY_NAV[0].index).toBe("");
    expect(PRIMARY_NAV[0].group).toBeUndefined();
  });

  it("the WORKFLOW group is Discover, Plan, Design, Build with mono indexes 01-04", () => {
    expect(WORKFLOW_NAV.map((n) => n.label)).toEqual(["Discover", "Plan", "Design", "Build"]);
    expect(WORKFLOW_NAV.map((n) => n.index)).toEqual(["01", "02", "03", "04"]);
    for (const n of WORKFLOW_NAV) expect(n.group).toBe("workflow");
  });

  it("mono indexes live ONLY in the WORKFLOW group", () => {
    for (const n of PRIMARY_NAV) {
      if (n.group === "workflow") expect(n.index).toMatch(/^0[1-4]$/);
      else expect(n.index).toBe("");
    }
  });

  it("Memory's URL is /brain (label renamed, slug unchanged)", () => {
    const memory = PRIMARY_NAV.find((n) => n.label === "Memory");
    expect(memory?.to).toBe("/brain");
  });

  it("Decide and Ledger left the rail (both are redirect stubs now)", () => {
    const all = [...PRIMARY_NAV, ...FOOTER_NAV].map((n) => n.to);
    expect(all).not.toContain("/decide");
    expect(all).not.toContain("/trust-ledger");
  });

  it("every `to` is canonical, unique, and never /chat or /knowledge", () => {
    const targets = PRIMARY_NAV.map((n) => n.to);
    expect(new Set(targets).size).toBe(targets.length);
    for (const t of targets) {
      expect(CANONICAL_PATHS as readonly string[]).toContain(t);
    }
    expect(targets).not.toContain("/chat");
    expect(targets).not.toContain("/knowledge");
  });

  it("navKeyHint is the 1-based rail position (keys 1-7)", () => {
    expect(PRIMARY_NAV.map((n) => navKeyHint(n))).toEqual(["1", "2", "3", "4", "5", "6", "7"]);
  });
});

describe("nav-model - the footer (Settings + admins-only Admin)", () => {
  it("Settings and Admin console are the footer rows", () => {
    expect(FOOTER_NAV.map((n) => n.to)).toEqual(["/settings", "/admin"]);
  });

  it("all rail paths (primary + footer) are unique", () => {
    const all = [...PRIMARY_NAV, ...FOOTER_NAV].map((n) => n.to);
    expect(new Set(all).size).toBe(all.length);
  });
});

describe("nav-model - active-state math", () => {
  it("navItemActive matches an exact bare path and rejects others", () => {
    expect(navItemActive({ to: "/" }, "/", null)).toBe(true);
    expect(navItemActive({ to: "/discover" }, "/discover", null)).toBe(true);
    expect(navItemActive({ to: "/discover" }, "/build", null)).toBe(false);
  });

  it("navItemActive respects a tab scope when the item declares one", () => {
    const item = { to: "/discover", search: { tab: "queue" } };
    expect(navItemActive(item, "/discover", "queue")).toBe(true);
    expect(navItemActive(item, "/discover", "signals")).toBe(false);
    expect(navItemActive(item, "/discover", null)).toBe(false);
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

  it("ENGINE_ROOM_PATHS covers the engine surfaces incl. the redirect stubs that land there", () => {
    expect([...ENGINE_ROOM_PATHS].sort()).toEqual([
      "/engine-room",
      "/govern",
      "/sync",
      "/trust-ledger",
    ]);
  });
});
