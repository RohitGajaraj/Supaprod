import { describe, it, expect } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  PRIMARY_NAV,
  WORKFLOW_NAV,
  LOOP_NAV,
  HOME_NAV,
  OPERATIONS_NAV,
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
 * story in four zones — HOME (Today) · THE LOOP (01 Discover · 02 Decide · 03
 * Plan · 04 Design · 05 Build · 06 Ship · 07 Learn) · OPERATIONS (Runs · Crew)
 * · INTELLIGENCE (Brain · Pulse). Twelve primary destinations: digit keys 0-9
 * carry the lifecycle spine, then letters (u, e, s) take the doors that are
 * not lifecycle stations, plus Engine Room's standing `g` alias.
 */

describe("nav-model - the twelve primary destinations (the Loop)", () => {
  it("is one flat ordered list of exactly twelve destinations", () => {
    expect(PRIMARY_NAV.length).toBe(12);
    expect(PRIMARY_NAV.map((n) => n.label)).toEqual([
      "Today",
      "Discover",
      "Decide",
      "Plan",
      "Design",
      "Build",
      "Ship",
      "Learn",
      "Runs",
      "Crew",
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
      "/runs",
      "/crew",
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

  it("OPERATIONS is Runs and Crew, the two rail doors that are not loop stations", () => {
    expect(OPERATIONS_NAV.map((n) => n.label)).toEqual(["Runs", "Crew"]);
    expect(OPERATIONS_NAV.map((n) => n.to)).toEqual(["/runs", "/crew"]);
    for (const n of OPERATIONS_NAV) {
      expect(n.index).toBe("");
      expect(n.group).toBeUndefined();
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
      // CANONICAL_PATHS is the legacy-redirect canon: the ten lifecycle
      // destinations a dead URL is allowed to land on. Runs and Crew are rail
      // doors, not redirect targets, and legacy-redirects.test.ts pins that
      // list at ten - so they are exempt HERE and proven real below, which is
      // the stronger check anyway (a key bound to a route that does not exist
      // is worse than a key bound to a non-canonical one).
      if (t === "/runs" || t === "/crew") continue;
      expect(CANONICAL_PATHS as readonly string[]).toContain(t);
    }
    expect(targets).not.toContain("/chat");
    expect(targets).not.toContain("/knowledge");
  });

  it("the two exempt doors are real routes on disk, not a key pointing at nothing", () => {
    const routes = join(import.meta.dir, "..", "routes");
    for (const [path, file] of [
      ["/runs", "_authenticated.runs.index.tsx"],
      ["/crew", "_authenticated.crew.tsx"],
    ] as const) {
      expect(PRIMARY_NAV.map((n) => n.to)).toContain(path);
      expect(existsSync(join(routes, file))).toBe(true);
    }
  });

  it("navKeyHint = the visible number, then a letter of the label: 0, 1-7, u, e, 8, 9", () => {
    expect(PRIMARY_NAV.map((n) => navKeyHint(n))).toEqual([
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "u",
      "e",
      "8",
      "9",
    ]);
  });

  it("every letter key is a letter of the label it is drawn next to", () => {
    // The rule that picks the letter (see navKeyHint): the first letter of the
    // visible word no in-page action has claimed. A key from outside the word
    // is unguessable, so it fails here.
    for (const n of [...PRIMARY_NAV, ...FOOTER_NAV]) {
      const hint = navKeyHint(n);
      if (hint === "" || /^[0-9]$/.test(hint)) continue;
      expect(n.label.toLowerCase()).toContain(hint);
    }
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

/**
 * THE KEYBOARD IS A NAMESPACE, AND IT IS SHARED.
 *
 * Every binding here is a WINDOW listener, so it fires on every surface at
 * once. Two doors on one key is an ambiguous keycap; a door on a letter a gate
 * already uses fires BOTH (the `a`/admin incident, 2026-07-29). These tests
 * hold the namespace: they fail on a duplicate, on a shadowed alias, on a
 * collision with a decided in-page key, and on a rail row that draws no key.
 */
describe("nav-model - one key, one door, across the WHOLE nav model", () => {
  const DOORS = [...PRIMARY_NAV, ...FOOTER_NAV];

  it("binds no key twice, anywhere in the model", () => {
    const bound = DOORS.map((d) => navKeyHint(d)).filter((k) => k !== "");
    expect(new Set(bound).size).toBe(bound.length);
    // And the count is the thing the rail promises: every non-empty hint is a
    // keycap somewhere, so a shrinking set is a lost shortcut, not a tidy-up.
    // 12 primary destinations + Settings; Admin console is the one deliberate
    // blank (it gave `a` back to Approve).
    expect(bound.length).toBe(13);
  });

  it("leaves the standing `g` alias unshadowed", () => {
    // GotoShortcuts falls back to `g` -> Engine Room only when no door claims
    // `g` first. A door that took it would silently eat the alias.
    expect(DOORS.map((d) => navKeyHint(d))).not.toContain("g");
  });

  it("never takes a letter a surface already spends on an in-page action", () => {
    // Claimed elsewhere, each a decided contract on its own surface:
    //   a, d, z  the Today gate        (routes/_authenticated.today.tsx)
    //   c, k, x  the decide gate       (routes/_authenticated.decide.tsx)
    //   j, k, a, r  the approvals queue (routes/_authenticated.approvals.tsx)
    //   h        snooze                (components/mission/ApprovalsTray.tsx)
    // Digits are deliberately not checked here: /discover binds 1/2/3 for its
    // own lens switch, which predates this model and is that surface's to fix.
    const CLAIMED = new Set(["a", "c", "d", "h", "j", "k", "r", "x", "z"]);
    for (const d of DOORS) {
      const hint = navKeyHint(d);
      if (hint === "" || /^[0-9]$/.test(hint)) continue;
      expect(CLAIMED.has(hint)).toBe(false);
    }
  });

  it("gives every rail row in AppFrame a key, so no row draws a blank", () => {
    // Read from the shell rather than copied: AppFrame owns the rail, this
    // file owns the keys, and the whole point is that neither can drift. A new
    // rail row with no binding fails here, which is the defect this closes.
    const file = join(import.meta.dir, "..", "components", "shell", "AppFrame.tsx");
    const src = readFileSync(file, "utf8");
    const start = src.indexOf("const RAIL = [");
    expect(start).toBeGreaterThan(-1);
    const end = src.indexOf("] as const;", start);
    expect(end).toBeGreaterThan(start);
    const paths = [...src.slice(start, end).matchAll(/to:\s*"([^"]+)"/g)].map((m) => m[1]);

    expect(paths.length).toBeGreaterThanOrEqual(5);
    expect(paths).toContain("/runs");
    expect(paths).toContain("/crew");
    for (const p of paths) {
      const door = DOORS.find((d) => d.to === p);
      expect(door).toBeDefined();
      expect(navKeyHint(door!)).not.toBe("");
    }
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
