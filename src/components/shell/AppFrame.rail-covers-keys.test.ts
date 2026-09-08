/**
 * THE RAIL MUST BE ABLE TO FOLLOW THE KEYBOARD.
 *
 * THE DEFECT, measured 2026-08-05. GotoShortcuts binds one bare key per door
 * over PRIMARY_NAV + FOOTER_NAV. Doors got added without a matching rail row
 * (or removed without their binding following), and the rail went dark for
 * whoever pressed the orphaned key — the one job a persistent rail has is
 * saying where you are standing, and a binding with no lit row breaks that
 * silently, for a user only the keyboard would ever expose it to.
 *
 * P-11 (A-QUEUE.md, 2026-09-02) cut the rail to two rows, Start and the
 * conditional Run, and cut `PRIMARY_NAV` to match — Start · Run · Settings —
 * so the invariant this file protects still applies to a much smaller model.
 *
 * HOW IT READS THE TRUTH. Two sources, neither of them a copy:
 *   - `railOwnerOf`, imported from the shell, is the same function the rail
 *     renders `aria-current` from. Not a model of it - it.
 *   - the rail FOOT is read out of AppFrame.tsx with readFileSync, because
 *     Settings' visible control is not a rail row: it is a <Link> in the
 *     foot, and it lights only because it carries `activeProps`. Scanning
 *     the source means the day somebody drops that prop, this fails - a
 *     runtime list would not notice.
 *
 * It never asserts WHICH row lights, only that one can.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { railOwnerOf, settingsOwns, RAIL_DOORS } from "./AppFrame";
import { STATION_ROUTE } from "./run-strip";
import { FOOTER_NAV, PRIMARY_NAV, navKeyHint } from "@/lib/nav-model";
import { SIGNED_IN_HOME } from "./post-auth-home";

const SRC = readFileSync(join(import.meta.dir, "AppFrame.tsx"), "utf8");

/** Every door the keyboard reaches, in the order GotoShortcuts searches. */
const BOUND = [...PRIMARY_NAV, ...FOOTER_NAV].filter((d) => navKeyHint(d) !== "");

/** The `const RAIL = [ ... ] as const;` block, verbatim. Same extraction the
 *  nav-model suite uses, so the two guards read the rail the same way. */
function railBlock(): string {
  const start = SRC.indexOf("const RAIL = [");
  expect(start).toBeGreaterThan(-1);
  const end = SRC.indexOf("] as const;", start);
  expect(end).toBeGreaterThan(start);
  return SRC.slice(start, end);
}

/**
 * The paths of every control in the rail FOOT that can light itself, read off
 * the markup: a <Link> whose opening tag carries both a `to` and `activeProps`.
 * A foot control without `activeProps` is a door that never says you are behind
 * it, so it does not count and must not be counted.
 */
function litFootDoors(): string[] {
  const start = SRC.indexOf('className="sp-railfoot"');
  expect(start).toBeGreaterThan(-1);
  const end = SRC.indexOf("</aside>", start);
  expect(end).toBeGreaterThan(start);
  const foot = SRC.slice(start, end);
  const out: string[] = [];
  for (const chunk of foot.split("<Link").slice(1)) {
    const tagEnd = chunk.indexOf(">");
    if (tagEnd === -1) continue;
    const tag = chunk.slice(0, tagEnd);
    if (!tag.includes("activeProps")) continue;
    const to = /\bto="([^"]+)"/.exec(tag);
    if (to) out.push(to[1]);
  }
  return out;
}

describe("every bound key lands somewhere the rail can light", () => {
  it("finds a lit control for all three bound doors", () => {
    // Two ways a door can be lit today: a row owns it, or the foot control
    // IS it (Settings, via `activeProps`). Run's identity resolves through
    // its own row exactly like Start's, so both clear this the same way.
    const foot = new Set(litFootDoors());
    const dark = BOUND.filter((d) => railOwnerOf(d.to) === null && !foot.has(d.to)).map(
      (d) => `${navKeyHint(d)} -> ${d.to}`,
    );
    // Empty, and it is the whole point. A new binding whose destination no row
    // owns and no foot control matches shows up here by name and key, which is
    // enough to fix it without opening a browser.
    expect(dark).toEqual([]);
    /*
     * A sanity FLOOR, so a nav-model that silently emptied would not pass by
     * having nothing left to check. It was a fixed 3, which is a ceiling as
     * well as a floor and broke on P-60's nine without anything being wrong.
     * Derived from the list it is checking instead.
     */
    expect(BOUND.length).toBe(PRIMARY_NAV.filter((d) => navKeyHint(d) !== "").length);
    expect(BOUND.length).toBeGreaterThan(0);
  });

  it("keeps Settings lit from the foot, since it is deliberately not a row", () => {
    expect(litFootDoors()).toContain("/settings");
  });
});

describe("the rail's ownership is derived, and unambiguous", () => {
  it("never lets one row's ownership swallow another row's own door", () => {
    // Two rows that can both answer for one path is worse than none lighting:
    // it says you are in two places. A row whose own path resolves to a
    // NEIGHBOUR is the same bug seen from the other side - that row could
    // never light at all. Both are caught by the same assertion.
    const rows = [...railBlock().matchAll(/to:\s*"([^"]+)"/g)].map((m) => m[1]);
    /*
     * ONE SPELLED PATH AND TWO ROWS, AND THE GAP IS THE POINT (F-144, kept
     * through P-11). Start no longer spells its destination — it names
     * `SIGNED_IN_HOME`, so this scan, which reads the block as source text,
     * cannot see it, and the count is one lower than the row count while the
     * rail is not. Spelling "/start" back into that row would restore this
     * count and restore the six-day drift it existed to end, so the count
     * going down is what proves the derivation is in place.
     */
    /*
     * THE LOOP IS THE INVARIANT, and the list of paths above it was standing in
     * for it. This read `toEqual(["/track"])`, which held only while the rail
     * had two rows; P-60's nine broke it without breaking anything real. A
     * hardcoded list here says what the rail held on one day, and the way to
     * make it pass again is to retype it, which teaches nothing.
     */
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) expect(railOwnerOf(r)).toBe(r);
    // THE HOME DOOR IS DERIVED, NOT SPELLED. Asserted on the source, because
    // that is the only place the difference is visible: at runtime the row's
    // `to` is the string either way, so a test that only read the value could
    // not tell a derived door from a copied one.
    expect(railBlock()).toContain("to: SIGNED_IN_HOME");
    // And it really is a door, not just a name: the rail can light for it.
    expect(railOwnerOf(SIGNED_IN_HOME)).toBe(SIGNED_IN_HOME);
  });

  it("never hand-types a path into `owns`", () => {
    // THE DERIVATION LAW, the same one nav-model.ts holds over the keycaps. A
    // literal array here would be a second copy of the station map, free to
    // drift the day Build's engine moves again (it moved once already:
    // /runs -> /build). Every `owns` must name a constant.
    const block = railBlock();
    expect(block).not.toMatch(/owns:\s*\[/);
    const owns = [...block.matchAll(/owns:\s*([A-Z][A-Z_]*)\b/g)].map((m) => m[1]);
    /*
     * ONE PER ROW, so a row cannot drop the field and quietly go dark. Counted
     * against the rows themselves rather than a fixed number: the rule is
     * "every row names its ownership", and a literal count only records how
     * many rows there were the day it was written.
     */
    const rowCount = [...block.matchAll(/^\s{2}\{$/gm)].length;
    expect(owns.length).toBe(rowCount);
    expect(owns.length).toBeGreaterThan(0);
  });

  it("owns exactly the seven stations the strip navigates to", () => {
    // Read from STATION_ROUTE rather than listed, so this test cannot be the
    // place the drift hides either.
    const stations = Object.values(STATION_ROUTE);
    expect(stations.length).toBe(7);
    /*
     * UNCHANGED BY P-11. These hung under Start (then "Work", now "Start")
     * since F-145 deleted the old `Stations` door for contradicting R-01: a
     * station is the step list INSIDE ONE RUN, and Start already owns the
     * run — /start where work is handed over, /track/:id where it is
     * watched, which is now Run's own row rather than Start's territory, but
     * a station page itself (/plan, /build, …) is still Start's.
     */
    /*
     * ── AND ONE OF THE SEVEN NOW HAS ITS OWN ROW (P-60) ──────────────────
     *
     * `/arriving` is the door "What came in" as well as Discover's surface, so
     * standing there lights ITS row rather than Start's. That is the correct
     * reading and not an exception being carved out: the rule was always "the
     * row that owns this path", and Start owned the stations only because
     * nothing else did. A row must never be swallowed by a neighbour, which is
     * the assertion directly above this one.
     *
     * So the invariant is stated as it actually is: a station page lights its
     * own door when it has one, and Start when it does not. Never dark.
     */
    const railPaths = new Set(RAIL_DOORS.map((d) => d.to));
    for (const path of stations) {
      expect(railOwnerOf(path)).toBe(railPaths.has(path) ? path : SIGNED_IN_HOME);
      expect(railOwnerOf(path)).not.toBeNull();
    }
    // And a station's own sub-surface stays under the same row: /plan/spec/<id>
    // is where a spec is written and it is still Start's.
    expect(railOwnerOf("/plan/spec/abc")).toBe(SIGNED_IN_HOME);
    expect(railOwnerOf("/build/mission-1")).toBe(SIGNED_IN_HOME);
    // /runs/:missionId is a run screen and stays Start's; a live /track/:id
    // page is Run's own, resolved through Run's identity, not through this
    // list — see the ownership test above.
    expect(railOwnerOf("/runs")).toBe(SIGNED_IN_HOME);
    expect(railOwnerOf("/runs/mission-1")).toBe(SIGNED_IN_HOME);
  });

  it("puts no station in the rail, which is R-01 and the founder's F-146", () => {
    // R-01: "no station in the rail, no station as a route a person browses
    // to." Asserted on the row DESTINATIONS rather than the labels: renaming
    // the door would not make it stop being a station door.
    const rows = [...railBlock().matchAll(/to:\s*"([^"]+)"/g)].map((m) => m[1]);
    /*
     * R-01 IS ABOUT THE SEVEN STATIONS AS NAVIGATION, and `/arriving` is a rail
     * door under P-60 while also being Discover's surface. The rule that still
     * has to hold is that no row is a STATION door -- named for a step in the
     * route, taking a person to a stage of the machine. "What came in" is the
     * person's question and the six station-only routes stay out.
     */
    const stationOnly = new Set<string>(
      Object.values(STATION_ROUTE).filter((r) => r !== "/arriving"),
    );
    expect(rows.filter((r) => stationOnly.has(r))).toEqual([]);
    expect(rows).not.toContain("/runs");
    // And no row is LABELLED for a station, which is the other half of R-01.
    const labels = [...railBlock().matchAll(/label:\s*"([^"]+)"/g)].map((m) => m[1]);
    for (const word of ["Discover", "Decide", "Plan", "Design", "Build", "Ship", "Learn"]) {
      expect(labels).not.toContain(word);
    }
  });

  it("draws both aria-current tokens, so a section row is lit and not merely claimed", () => {
    // A row that merely CONTAINS the current page says aria-current="true";
    // only the page itself says "page". That distinction exists for a screen
    // reader, and it costs nothing visually ONLY while the stylesheet draws
    // both tokens. Tighten shell.css back to a single selector and every
    // section row goes dark again - the exact defect this file exists to
    // prevent, reintroduced from the CSS side, where no TypeScript test would
    // think to look. So the two halves are asserted together or not at all.
    const shell = readFileSync(join(import.meta.dir, "../../styles/shell.css"), "utf8");
    const frame = readFileSync(join(import.meta.dir, "./AppFrame.tsx"), "utf8");

    expect(frame).toContain('under(pathname, to) ? "page" : "true"');
    for (const token of ["page", "true"]) {
      expect(shell).toContain(`.sp-navrow[aria-current="${token}"]`);
      expect(shell).toContain(`.sp-navrow[aria-current="${token}"] .sp-navcount`);
    }
  });

  /**
   * ── RUN NO LONGER DROPS, AND THIS TEST USED TO PROVE THAT IT DID (P-109) ──
   *
   * P-11's own acceptance line, quoted here until this rewrite: "on /start the
   * rail shows exactly Start and Settings... on /track/:id it shows Start,
   * Run, Settings." That was right for the defect P-11 closed (a floating
   * fifth row with no fixed home) and wrong for what P-63 found six packets
   * later: a person NOT standing on a track had no Run door at all, which is
   * R-38's defect -- a door that goes nowhere -- in its most literal shape,
   * since here there was no door to go nowhere WITH. `runDoor` (the query in
   * `AppFrame` itself) now answers "where is my run" from anywhere in the
   * product: a live run, the most recently touched one, or `/start`. So the
   * primary rail's row COUNT is now constant across every page -- Start, Run,
   * Settings, always -- and this test's job changes from "prove Run can
   * vanish" to "prove it no longer can."
   */
  it("draws every row unconditionally, in two tiers, Home first (Lane 1, 2026-09-08)", () => {
    /*
     * The Run row left the rail: a row that was a shortcut to one list item
     * is not a place, and the home's rows and the header's live line already
     * open the current run. A run screen is Home's territory now.
     */
    expect(SRC).toContain("RAIL.map(");
    expect(SRC).toContain("data-tier={tier}");
    expect(RAIL_DOORS.map((r) => r.to)[0]).toBe(SIGNED_IN_HOME);
    expect(RAIL_DOORS.map((r) => r.to)).not.toContain("/track");
    expect(RAIL_DOORS.map((r) => r.to)).not.toContain("/threads");
  });

  it("a run screen lights Home, which is where the run was opened from", () => {
    expect(railOwnerOf("/track")).toBe(SIGNED_IN_HOME);
    expect(railOwnerOf("/track/abc123")).toBe(SIGNED_IN_HOME);
  });

  it("what left the rail is reachable by URL, but owned by no row", () => {
    // Approvals, Insights, Threads and Policies (P-11's own names for
    // /today, /brain, /threads, /engine-room) are named in the packet's own
    // "not in scope" line: real surfaces, kept, just no longer advertised —
    // and no longer owned. A row claiming one of these would be the fold
    // silently reappearing.
    /*
     * FOUR OF THE FIVE CAME BACK (P-60, R-38: a surface without a door is not
     * shipped). `/approvals`, `/outcomes` and `/threads` are rail doors now and
     * are correctly owned; what is still folded away is `/today`, which Start
     * genuinely absorbed, and `/engine-room`, reached from Crew and spend
     * because "where is the machinery" is not a question a person arrives with.
     */
    /*
     * AND CONVERSATIONS LEFT AGAIN (Lane 1, 2026-09-08): it is Ask's own
     * history, reached from AskSwitcher and Find, so it is reachable and owned
     * by no row, like /today and /engine-room.
     */
    for (const path of ["/today", "/engine-room", "/threads"]) {
      expect(railOwnerOf(path)).toBeNull();
    }
    for (const path of ["/approvals", "/outcomes", "/crew", "/sync"]) {
      expect(railOwnerOf(path)).toBe(path);
    }
  });

  describe("the Settings door speaks for what moved behind it", () => {
    it("lights itself on its own page and on the territory it holds", () => {
      expect(settingsOwns("/settings")).toBe("page");
      expect(settingsOwns("/settings/anything")).toBe("page");
      expect(settingsOwns("/crew")).toBe("true");
      expect(settingsOwns("/boundary")).toBe("true");
    });

    it("claims nothing it does not hold", () => {
      expect(settingsOwns("/today")).toBeUndefined();
      expect(settingsOwns("/runs")).toBeUndefined();
      expect(settingsOwns("/engine-room")).toBeUndefined();
    });

    it("never lets the two altitudes both answer for one path", () => {
      // A row and the foot both claiming a path would say you are in two
      // places. The rows are the authority; the foot only picks up what no row
      // owns.
      /*
       * `/crew` IS A ROW NOW (P-60), so it is owned by that row and no longer by
       * the foot -- which is the rule working, not an exception: the rows are
       * the authority and the foot picks up only what no row owns. The two that
       * still belong to the foot alone are asserted as before.
       */
      expect(railOwnerOf("/crew")).toBe("/crew");
      for (const path of ["/boundary", "/settings"]) {
        expect(railOwnerOf(path)).toBeNull();
      }
    });
  });
});
