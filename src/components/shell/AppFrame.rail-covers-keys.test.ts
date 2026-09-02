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
    // A sanity floor, so a nav-model that silently emptied would not pass by
    // having nothing left to check. Three since P-11: Start, Run, Settings.
    expect(BOUND.length).toBe(3);
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
    expect(rows).toEqual(["/track"]);
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
    // One per row, so a row cannot drop the field and quietly go dark. Two
    // since P-11: Start's owns and Run's (empty, named rather than repeated).
    expect(owns.length).toBe(2);
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
    for (const path of stations) expect(railOwnerOf(path)).toBe(SIGNED_IN_HOME);
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
    const stations = new Set<string>(Object.values(STATION_ROUTE));
    expect(rows.filter((r) => stations.has(r))).toEqual([]);
    expect(rows).not.toContain("/runs");
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
   * THE RAIL ENTRY COUNT PER ROUTE (P-11's own acceptance line: "on /start
   * the rail shows exactly Start and Settings... on /track/:id it shows
   * Start, Run, Settings"), READ FROM THE FILTER RATHER THAN RENDERED.
   *
   * A full mount needs a RouterProvider this file does not carry. The
   * render's own filter — `RAIL_PRIMARY.filter((r) => r.to !== "/track" ||
   * trackId)` — is pure and small enough that pinning its exact source and
   * proving both rows resolve to real doors is a stronger, faster check
   * than a DOM render would be: `RAIL_PRIMARY` has exactly two rows (Start,
   * Run — proven by the ownership test above), Settings is the foot
   * control proven lit earlier in this file, and this is the one line that
   * decides whether Run joins them.
   */
  it("the render drops Run without a live track and keeps it with one", () => {
    expect(SRC).toContain('RAIL_PRIMARY.filter((r) => r.to !== "/track" || trackId).map(');
    // RAIL_DOORS (exported, real, RAIL.map(...) with no tier filter) is the
    // fixed set this filter draws from: Start and Run, two rows. Applying
    // the filter's own logic by hand for both states of `trackId` is what
    // "the rail shows exactly Start and Settings [...] Start, Run, Settings"
    // asks for, without a RouterProvider this file does not carry.
    expect(RAIL_DOORS.map((r) => r.to)).toEqual([SIGNED_IN_HOME, "/track"]);
    const visible = (trackId: string | null) =>
      RAIL_DOORS.filter((r) => r.to !== "/track" || trackId);
    // Plus one for Settings, the foot control proven lit above — neither
    // list this file reads carries it, so it is added back by hand on both
    // sides rather than silently dropped from the count.
    expect(visible(null).length + 1).toBe(2);
    expect(visible("abc123").length + 1).toBe(3);
  });

  it("Run's identity carries no ownership of its own beyond itself", () => {
    // Run answers only for a live track (its own `to`, resolved above); it
    // does not reach for anything else the way Start's `owns` list does.
    // Asserted so a future edit that quietly grows Run's territory is caught
    // here rather than discovered as a mislit row.
    expect(railOwnerOf("/track")).toBe("/track");
    expect(railOwnerOf("/track/abc123")).toBe("/track");
  });

  it("what left the rail is reachable by URL, but owned by no row", () => {
    // Approvals, Insights, Threads and Policies (P-11's own names for
    // /today, /brain, /threads, /engine-room) are named in the packet's own
    // "not in scope" line: real surfaces, kept, just no longer advertised —
    // and no longer owned. A row claiming one of these would be the fold
    // silently reappearing.
    for (const path of ["/today", "/approvals", "/outcomes", "/threads", "/engine-room"]) {
      expect(railOwnerOf(path)).toBeNull();
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
      for (const path of ["/crew", "/boundary", "/settings"]) {
        expect(railOwnerOf(path)).toBeNull();
      }
    });
  });
});
