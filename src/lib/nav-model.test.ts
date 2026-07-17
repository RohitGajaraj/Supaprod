import { describe, it, expect } from "bun:test";
import {
  PRIMARY_NAV,
  WORKFLOW_NAV,
  LOOP_NAV,
  HOME_NAV,
  INTELLIGENCE_NAV,
  FOOTER_NAV,
  ENGINE_ROOM_PATHS,
  navItemActive,
  navKeyHint,
  engineRoomActive,
} from "./nav-model";
import { CANONICAL_PATHS } from "./legacy-redirects";

/**
 * IA — THE SUPAPROD LOOP (Option B, 2026-07-13): the rail tells the product
 * story in three zones — HOME (Today) · THE LOOP (01 Discover · 02 Decide · 03
 * Plan · 04 Design · 05 Build · 06 Ship · 07 Learn) · INTELLIGENCE (Memory ·
 * Engine Room). Ten primary destinations; digit keys 1-9 plus Engine Room's
 * `g` alias (the 10th has no single-digit key).
 */

describe("nav-model - the ten primary destinations (the Loop)", () => {
  it("is one flat ordered list of exactly ten destinations", () => {
    expect(PRIMARY_NAV.length).toBe(10);
    expect(PRIMARY_NAV.map((n) => n.label)).toEqual([
      "Today",
      "Discover",
      "Decide",
      "Plan",
      "Design",
      "Build",
      "Ship",
      "Learn",
      "Brain",
      "Pulse",
    ]);
    expect(PRIMARY_NAV.map((n) => n.to)).toEqual([
      "/today",
      "/discover",
      "/decide",
      "/plan",
      "/design",
      "/build",
      "/ship",
      "/learn",
      "/brain",
      "/engine-room",
    ]);
  });

  it("Today is pinned first, in the home zone, unnumbered", () => {
    expect(PRIMARY_NAV[0].to).toBe("/today");
    expect(PRIMARY_NAV[0].index).toBe("");
    expect(PRIMARY_NAV[0].zone).toBe("home");
    expect(HOME_NAV.map((n) => n.to)).toEqual(["/today"]);
  });

  it("THE LOOP is the seven lifecycle stages with mono indexes 01-07", () => {
    expect(WORKFLOW_NAV).toBe(LOOP_NAV);
    expect(LOOP_NAV.map((n) => n.label)).toEqual([
      "Discover",
      "Decide",
      "Plan",
      "Design",
      "Build",
      "Ship",
      "Learn",
    ]);
    expect(LOOP_NAV.map((n) => n.index)).toEqual(["01", "02", "03", "04", "05", "06", "07"]);
    for (const n of LOOP_NAV) {
      expect(n.zone).toBe("loop");
      expect(n.group).toBe("workflow");
    }
  });

  it("mono indexes live ONLY in the loop zone", () => {
    for (const n of PRIMARY_NAV) {
      if (n.zone === "loop") expect(n.index).toMatch(/^0[1-7]$/);
      else expect(n.index).toBe("");
    }
  });

  it("INTELLIGENCE is Brain and Pulse (always-on layers, unnumbered on the rail body)", () => {
    expect(INTELLIGENCE_NAV.map((n) => n.label)).toEqual(["Brain", "Pulse"]);
    expect(INTELLIGENCE_NAV.map((n) => n.to)).toEqual(["/brain", "/engine-room"]);
    for (const n of INTELLIGENCE_NAV) expect(n.index).toBe("");
  });

  it("Decide is a first-class loop stage (the judgment gate), not a Discover tab", () => {
    const decide = PRIMARY_NAV.find((n) => n.label === "Decide");
    expect(decide?.to).toBe("/decide");
    expect(decide?.zone).toBe("loop");
    expect(decide?.index).toBe("02");
  });

  it("Decide, Ship and Learn are first-class loop stages, not folded away", () => {
    const targets = PRIMARY_NAV.map((n) => n.to);
    expect(targets).toContain("/decide");
    expect(targets).toContain("/ship");
    expect(targets).toContain("/learn");
  });

  it("every destination carries a non-empty tagline (the reason-for-everything)", () => {
    for (const n of PRIMARY_NAV) {
      expect(typeof n.tagline).toBe("string");
      expect(n.tagline.length).toBeGreaterThan(0);
    }
  });

  it("the Ledger stays off the rail (a redirect stub into the Engine Room)", () => {
    const all = [...PRIMARY_NAV, ...FOOTER_NAV].map((n) => n.to);
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

  it("navKeyHint = the visible number: Today 0, the loop 1-7, Brain 8, Pulse 9", () => {
    expect(PRIMARY_NAV.map((n) => navKeyHint(n))).toEqual([
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
    ]);
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
