import { describe, it, expect } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PRIMARY_NAV, FOOTER_NAV, navItemActive, navKeyHint, NAV_CHORD_PREFIX } from "./nav-model";
import { CANONICAL_PATHS } from "./legacy-redirects";

/**
 * IA — THREE DOORS (P-11, A-QUEUE.md, 2026-09-02): Start · Run · Settings.
 * See nav-model.ts's own header for the fuller history this replaces.
 */

describe("nav-model - the three primary destinations", () => {
  it("is one flat ordered list of exactly three destinations", () => {
    expect(PRIMARY_NAV.length).toBe(3);
    expect(PRIMARY_NAV.map((n) => n.label)).toEqual(["Start", "Run", "Settings"]);
    expect(PRIMARY_NAV.map((n) => n.to)).toEqual(["/start", "/track", "/settings"]);
    for (const n of PRIMARY_NAV) expect(n.zone).toBe("home");
  });

  it("every destination carries a non-empty tagline (the reason-for-everything)", () => {
    for (const n of PRIMARY_NAV) {
      expect(typeof n.tagline).toBe("string");
      expect(n.tagline.length).toBeGreaterThan(0);
    }
  });

  it("the Ledger and every folded-away door stay off the rail", () => {
    const all = [...PRIMARY_NAV, ...FOOTER_NAV].map((n) => n.to);
    for (const gone of [
      "/trust-ledger",
      "/today",
      "/approvals",
      "/runs",
      "/crew",
      "/outcomes",
      "/threads",
      "/engine-room",
      "/arriving",
      "/decide",
      "/plan",
      "/design",
      "/build",
      "/ship",
      "/learn",
    ]) {
      expect(all).not.toContain(gone);
    }
  });

  it("Start and Settings are canonical; Run's identity is proven real below instead", () => {
    // CANONICAL_PATHS is the legacy-redirect canon and was never meant to
    // cover a rail door's own identity string. "/track" is not a redirect
    // target — it never was, even before P-11 — so it is proven real on disk
    // in the "every door resolves" describe block below rather than checked
    // against a list built for a different question.
    expect(CANONICAL_PATHS as readonly string[]).not.toContain("/track");
  });

  it("Run's identity is a real route prefix, not a key pointing at nothing", () => {
    const routes = join(import.meta.dir, "..", "routes");
    expect(PRIMARY_NAV.map((n) => n.to)).toContain("/track");
    expect(existsSync(join(routes, "_authenticated.track.$trackId.tsx"))).toBe(true);
  });

  it("navKeyHint is the second key of the chord, one letter per destination", () => {
    expect(PRIMARY_NAV.map((n) => navKeyHint(n))).toEqual([
      "t", // sTart; `s` is Settings
      "r", // Run's own first letter, free
      "s", // Settings
    ]);
  });

  it("binds no digit anywhere, so a number on a row can only mean identity", () => {
    for (const n of [...PRIMARY_NAV, ...FOOTER_NAV]) {
      expect(navKeyHint(n)).not.toMatch(/[0-9]/);
    }
  });

  it("every key is a letter of the label it is drawn next to, so it is derivable", () => {
    for (const n of [...PRIMARY_NAV, ...FOOTER_NAV]) {
      const hint = navKeyHint(n);
      if (hint === "") continue;
      expect(n.label.toLowerCase()).toContain(hint);
    }
  });
});

describe("nav-model - the footer (Admin only; Settings moved into PRIMARY_NAV)", () => {
  it("Admin console is the one footer row", () => {
    expect(FOOTER_NAV.map((n) => n.to)).toEqual(["/admin"]);
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
 * once. Two doors on one key is an ambiguous keycap. These tests hold the
 * namespace: they fail on a duplicate, on a shadowed alias, and on a rail row
 * that draws no key.
 */
describe("nav-model - one key, one door, across the WHOLE nav model", () => {
  const DOORS = [...PRIMARY_NAV, ...FOOTER_NAV];

  it("binds no key twice, anywhere in the model", () => {
    const bound = DOORS.map((d) => navKeyHint(d)).filter((k) => k !== "");
    expect(new Set(bound).size).toBe(bound.length);
    // Three: Start (t), Run (r), Settings (s). Admin console draws no key —
    // see navKeyHint's own `/admin` case for why.
    expect(bound.length).toBe(3);
  });

  it("never binds the prefix itself, which would eat every chord", () => {
    // `g` arms the chord. A door that also answered to `g` would be reachable
    // only by pressing it twice, and would shadow the arming press.
    expect(DOORS.map((d) => navKeyHint(d))).not.toContain(NAV_CHORD_PREFIX);
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

    // Two rows: Run's `to: "/track"` is the only quoted string the block
    // carries (Start names SIGNED_IN_HOME, deliberately invisible to this
    // scan — see the comment above `RAIL` in AppFrame.tsx).
    expect(paths).toEqual(["/track"]);
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
    expect(navItemActive({ to: "/start" }, "/start", null)).toBe(true);
    expect(navItemActive({ to: "/start" }, "/settings", null)).toBe(false);
  });

  it("navItemActive respects a tab scope when the item declares one", () => {
    const item = { to: "/settings", search: { tab: "billing" } };
    expect(navItemActive(item, "/settings", "billing")).toBe(true);
    expect(navItemActive(item, "/settings", "workspace")).toBe(false);
    expect(navItemActive(item, "/settings", null)).toBe(false);
  });
});

/**
 * EVERY DOOR RESOLVES TO A ROUTE FILE.
 *
 * A ratchet, not a repair. AGENTS.md §4 names "a capability with no door" as
 * this repo's dominant defect; the inverse is the one a user sees, because a
 * door onto nothing ships a 404 in the primary rail.
 */
describe("nav-model - every door resolves to a route file on disk", () => {
  const ROUTES = join(import.meta.dir, "..", "routes");

  /**
   * TanStack's flat file convention: dots are slashes, and a `.index` file
   * serves the bare path. So /outcomes is `_authenticated.outcomes.tsx` and
   * /plan is `_authenticated.plan.index.tsx`, and either spelling resolves.
   *
   * Run's identity, "/track", resolves through its `$trackId` param file
   * rather than a bare or `.index` one — checked on its own line above,
   * because a param segment cannot be spelled as a literal candidate here.
   */
  function candidateFiles(to: string): string[] {
    const seg = to.replace(/^\//, "").split("/").join(".");
    return [`_authenticated.${seg}.tsx`, `_authenticated.${seg}.index.tsx`];
  }

  function resolves(to: string): boolean {
    return candidateFiles(to).some((f) => existsSync(join(ROUTES, f)));
  }

  it("the resolver can fail, so a pass below is evidence rather than a vacuum", () => {
    expect(resolves("/settings")).toBe(true); // a plain route file
    expect(resolves("/plan")).toBe(true); // reached through its .index child
    expect(resolves("/no-such-door")).toBe(false);
  });

  /*
   * Each case NAMES the offender instead of counting it. A count tells you the
   * rail is broken; the label and path tell you which keycap goes nowhere,
   * which is the whole diagnosis. Start's own resolver check is skipped —
   * SIGNED_IN_HOME already IS "/start", proven real the same way — and Run's
   * "/track" is the one identity this resolver cannot spell as a candidate
   * file, checked directly above instead.
   */
  it("every PRIMARY_NAV `to` has a route file, or is a known identity", () => {
    const dead = PRIMARY_NAV.filter((n) => n.to !== "/track" && !resolves(n.to)).map(
      (n) => `${n.label} (${n.to})`,
    );
    expect(dead).toEqual([]);
  });

  it("every FOOTER_NAV `to` has a route file", () => {
    const dead = FOOTER_NAV.filter((n) => !resolves(n.to)).map((n) => `${n.label} (${n.to})`);
    expect(dead).toEqual([]);
  });
});
