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
  NAV_CHORD_PREFIX,
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
      "Agents",
      "Brain",
      "Guardrails",
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

  it("OPERATIONS is Runs and Agents, the two doors that are not loop stations", () => {
    expect(OPERATIONS_NAV.map((n) => n.label)).toEqual(["Runs", "Agents"]);
    expect(OPERATIONS_NAV.map((n) => n.to)).toEqual(["/runs", "/crew"]);
    for (const n of OPERATIONS_NAV) {
      expect(n.index).toBe("");
      expect(n.group).toBeUndefined();
    }
  });

  it("INTELLIGENCE is Brain and Guardrails (always-on layers, unnumbered on the rail body)", () => {
    expect(INTELLIGENCE_NAV.map((n) => n.label)).toEqual(["Brain", "Guardrails"]);
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

  it("navKeyHint is the second key of the chord, one letter per destination", () => {
    expect(PRIMARY_NAV.map((n) => navKeyHint(n))).toEqual([
      "t", // Today
      "d", // Discover
      "e", // dEcide
      "p", // Plan
      "n", // desigN
      "b", // Build
      "h", // sHip
      "l", // Learn
      "r", // Runs
      "a", // Agents, renamed from Crew 2026-08-15; there is no `c` in it
      "k", // Brain, what the product Knows
      "u", // gUardrails, renamed from Pulse the same day; the letter survived
    ]);
  });

  /**
   * FOUNDER RULING 2026-08-05: numbers and letters must not be mixed.
   *
   * The old scheme was Today `0`, the loop `1`-`7`, Brain `8`, Engine `9`, then
   * letters. His objection: a number beside a rail row could be the station's
   * 01-07 identity, its shortcut, or a count, and the reader had to work out
   * which. Now the marker is the only number on a row.
   */
  it("binds no digit anywhere, so a number on a row can only mean identity", () => {
    for (const n of [...PRIMARY_NAV, ...FOOTER_NAV]) {
      expect(navKeyHint(n)).not.toMatch(/[0-9]/);
    }
  });

  it("every key is a letter of the label it is drawn next to, so it is derivable", () => {
    for (const n of [...PRIMARY_NAV, ...FOOTER_NAV]) {
      const hint = navKeyHint(n);
      if (hint === "") continue;
      // Brain is the one deliberate exception: `k` for what the product KNOWS,
      // which is this model's own definition of it, because `b` is Build.
      if (n.to === "/brain") {
        expect(hint).toBe("k");
        continue;
      }
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
    // 13: 12 primary destinations + Settings. Admin console is still the one
    // deliberate blank, though no longer because of the Approve collision --
    // the chord ends that. It is blank because AppFrame renders no admin
    // control at all, so a key there would go where the rail cannot follow.
    expect(bound.length).toBe(13);
  });

  it("never binds the prefix itself, which would eat every chord", () => {
    // `g` arms the chord. A door that also answered to `g` would be reachable
    // only by pressing it twice, and would shadow the arming press.
    expect(DOORS.map((d) => navKeyHint(d))).not.toContain(NAV_CHORD_PREFIX);
  });

  /**
   * THE CONTEST IS OVER, so this test inverts.
   *
   * It used to assert that navigation never took a letter an in-page action had
   * claimed, which is why Runs was `u` and Crew was `e` and Admin had nothing.
   * Under the chord the two live in different namespaces: `r` alone is Reject
   * and `g` then `r` is Runs, so overlap is not merely tolerated, it is the
   * point. What must still hold is that the PREFIX does not collide, since `g`
   * is the one key that is still pressed bare.
   */
  it("lets a door share a letter with an in-page action, because the prefix separates them", () => {
    const byPath = new Map(DOORS.map((d) => [d.to, navKeyHint(d)]));
    // Each of these was previously impossible and is now the natural key.
    expect(byPath.get("/runs")).toBe("r"); // `r` is also Reject
    /*
     * `a` SINCE 2026-08-15, and it makes this test's point harder than the
     * `c`/Challenge pair it replaces. Bare `a` is APPROVE on every gate, and
     * nav-model.ts's `/admin` case records the live consequence: on
     * 2026-07-29 pressing `a` on a gate approved the call AND navigated, both
     * listeners firing. That is the worst collision the old law produced, and
     * the chord holds it apart -- `a` alone still approves, `g` then `a` opens
     * Agents. If the prefix ever stops separating them, this is the pair that
     * breaks first and it breaks destructively.
     */
    expect(byPath.get("/crew")).toBe("a");
  });

  it("keeps the prefix off every surface's in-page action set", () => {
    // `g` is pressed bare to arm, so it is the ONE letter that must stay free.
    // Claimed elsewhere, each a decided contract on its own surface:
    //   a, d, z  the Today gate        (routes/_authenticated.today.tsx)
    //   c, k, x  the decide gate       (routes/_authenticated.decide.tsx)
    //   j, k, a, r  the approvals queue (routes/_authenticated.approvals.tsx)
    //   h        snooze                (components/mission/ApprovalsTray.tsx)
    const CLAIMED = new Set(["a", "c", "d", "h", "j", "k", "r", "x", "z"]);
    expect(CLAIMED.has(NAV_CHORD_PREFIX)).toBe(false);
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

    /*
     * WHAT THIS HOLDS, RESTATED 2026-08-15 SO IT PINS THE CLAIM AND NOT A ROSTER.
     *
     * It used to require at least five rows including /crew. That was a copy of
     * the rail's SHAPE, and the shape is a product decision that moved: the
     * founder took Crew off the rail and into Settings, measuring that
     * `agent_autonomy.set_at` covers 14 distinct days in two months, which is a
     * configuration cadence rather than a working one.
     *
     * The invariant underneath it never moved and is what is asserted now:
     * EVERY RAIL ROW IS A DOOR THE KEYBOARD CAN REACH. /runs stays named
     * because it is the one row whose presence has been argued twice and is
     * load-bearing (the strip navigates to a STATION; /runs lists RUNS, and
     * removing it leaves no door to the list of work items at all).
     */
    expect(paths.length).toBeGreaterThanOrEqual(4);
    expect(paths).toContain("/runs");
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
/**
 * EVERY DOOR RESOLVES TO A ROUTE FILE.
 *
 * A ratchet, not a repair. All 18 paths across the three constants resolve
 * today, and only two of them were held: the spot-check above pins /runs and
 * /crew because they are the pair CANONICAL_PATHS exempts, which left the
 * other sixteen correct and unguarded. AGENTS.md §4 names "a capability with
 * no door" as this repo's dominant defect; the inverse is the one a user sees,
 * because a door onto nothing ships a 404 in the primary rail. The measured
 * cleanliness is the argument for pinning it now: the list is short today and
 * will not be short after the next feature.
 *
 * SCOPE, so this never grows into a second inventory. `route-inventory.test.ts`
 * owns the opposite direction, every authenticated surface has a live door, and
 * owns the only exemption lists in the repo (AUTH_EXEMPT, RETIRED_LINKERS). It
 * cannot answer this question, because it walks the routes folder and never
 * reads the nav model. This walks the nav model and needs no exemption list at
 * all: a rail entry has no legitimate reason to point at nothing.
 */
describe("nav-model - every door resolves to a route file on disk", () => {
  const ROUTES = join(import.meta.dir, "..", "routes");

  /**
   * TanStack's flat file convention: dots are slashes, and a `.index` file
   * serves the bare path. So /brain is `_authenticated.brain.tsx` and /plan is
   * `_authenticated.plan.index.tsx`, and either spelling resolves.
   *
   * A REDIRECT STUB COUNTS AS RESOLVED, deliberately. /govern and
   * /trust-ledger are stubs that land in the engine room, and ENGINE_ROOM_PATHS
   * lists them for exactly that reason: they answer the URL whose active state
   * engineRoomActive is asked about. The question here is whether the path
   * exists, never what it renders.
   */
  function candidateFiles(to: string): string[] {
    const seg = to.replace(/^\//, "").split("/").join(".");
    return [`_authenticated.${seg}.tsx`, `_authenticated.${seg}.index.tsx`];
  }

  function resolves(to: string): boolean {
    return candidateFiles(to).some((f) => existsSync(join(ROUTES, f)));
  }

  it("the resolver can fail, so a pass below is evidence rather than a vacuum", () => {
    expect(resolves("/today")).toBe(true); // a plain route file
    expect(resolves("/plan")).toBe(true); // reached through its .index child
    expect(resolves("/no-such-door")).toBe(false);
  });

  /*
   * Each case NAMES the offender instead of counting it. A count tells you the
   * rail is broken; the label and path tell you which keycap goes nowhere,
   * which is the whole diagnosis.
   */
  it("every PRIMARY_NAV `to` has a route file", () => {
    const dead = PRIMARY_NAV.filter((n) => !resolves(n.to)).map((n) => `${n.label} (${n.to})`);
    expect(dead).toEqual([]);
  });

  it("every FOOTER_NAV `to` has a route file", () => {
    const dead = FOOTER_NAV.filter((n) => !resolves(n.to)).map((n) => `${n.label} (${n.to})`);
    expect(dead).toEqual([]);
  });

  it("every ENGINE_ROOM_PATHS entry has a route file", () => {
    // Strings, not NavItemDefs, so the path IS the name. These drive the rail
    // row's active state, so an entry with no route file lights a row for a
    // URL nobody can be standing on.
    const dead = ENGINE_ROOM_PATHS.filter((p) => !resolves(p));
    expect(dead).toEqual([]);
  });
});
