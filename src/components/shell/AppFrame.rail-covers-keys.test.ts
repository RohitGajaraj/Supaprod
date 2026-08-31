/**
 * THE RAIL MUST BE ABLE TO FOLLOW THE KEYBOARD.
 *
 * THE DEFECT, measured 2026-08-05. GotoShortcuts binds one bare key per door
 * over PRIMARY_NAV + FOOTER_NAV. Seven of those keys - 1..7, the loop stations
 * - navigated to /discover, /decide, /plan, /design, /build, /ship and /learn,
 * and the rail drew five rows, none of which matched any of them. So pressing
 * 3 took you to Plan and every row in the rail went dark at once. The shell
 * still knew the route; it had simply stopped saying where you were standing,
 * which is the one job a persistent rail has. A user who navigates by keyboard
 * was the only user who could see it, which is why it survived this long.
 *
 * WHY THIS IS A TEST AND NOT A FIX. The fix (AppFrame's `owns` field) closes
 * the seven that exist today. It does nothing about the eighth, and doors get
 * added: `/runs` and `/crew` were bound on this same day. A binding is one line
 * in nav-model.ts, the rail is a different file, and nothing connected them, so
 * the next door lands dark for free and is caught only if somebody happens to
 * press its key on the surface it opens.
 *
 * HOW IT READS THE TRUTH. Two sources, neither of them a copy:
 *   - `railOwnerOf`, imported from the shell, is the same function the rail
 *     renders `aria-current` from. Not a model of it - it.
 *   - the rail FOOT is read out of AppFrame.tsx with readFileSync, because
 *     Settings is not a row: it is a <Link> in the foot, and it lights only
 *     because it carries `activeProps`. Scanning the source means the day
 *     somebody drops that prop, this fails - a runtime list would not notice.
 *
 * It never asserts WHICH row lights, only that one can. Deciding that a
 * station belongs under Runs is a product judgement and belongs in the shell's
 * own comments; "the keyboard cannot take you somewhere the rail is blind to"
 * is an invariant and belongs here.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { railOwnerOf, settingsOwns } from "./AppFrame";
import { STATION_ROUTE } from "./run-strip";
import { ENGINE_ROOM_PATHS, FOOTER_NAV, PRIMARY_NAV, navKeyHint } from "@/lib/nav-model";
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
  it("finds a lit control for all thirteen bound doors", () => {
    /*
     * THREE WAYS A DOOR CAN BE LIT, and the third arrived on 2026-08-15 when
     * Agents moved off the rail and into Settings. A row can own it, a foot
     * control can BE it, or a foot control can own its TERRITORY -- which is
     * what `settingsOwns` answers for /crew and /boundary now that the roster
     * lives behind the gear.
     *
     * The third arm is read from the exported function rather than from a list
     * here, for the same reason the first is: this file must not become the
     * second place the answer is written down.
     */
    const foot = new Set(litFootDoors());
    const dark = BOUND.filter(
      (d) => railOwnerOf(d.to) === null && !foot.has(d.to) && settingsOwns(d.to) === undefined,
    ).map((d) => `${navKeyHint(d)} -> ${d.to}`);
    // Empty, and it is the whole point. A new binding whose destination no row
    // owns and no foot control matches shows up here by name and key, which is
    // enough to fix it without opening a browser.
    expect(dark).toEqual([]);
    // A sanity floor, so a nav-model that silently emptied would not pass by
    // having nothing left to check. Sixteen since 2026-08-25: Work (/start,
    // `g w`) joined the bound doors.
    expect(BOUND.length).toBe(16);
  });

  it("covers the standing `g` alias too, which no door declares", () => {
    // GotoShortcuts falls back to `g` -> Engine Room when no door claims `g`.
    // It is a binding like any other and the rail owes it the same answer.
    expect(railOwnerOf("/engine-room")).toBe("/engine-room");
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
     * FIVE SPELLED PATHS AND SIX ROWS, AND THE GAP IS THE POINT (F-144).
     *
     * The home row no longer spells its destination. It names
     * `SIGNED_IN_HOME`, so this scan - which reads the block as source text -
     * cannot see it, and the count drops by one while the rail does not.
     *
     * That is the fix, not a hole in it. The 2026-08-25 flip moved the landing
     * to /start and left the rail's first door at /today, because the two
     * facts were two literals in two files with nothing joining them. A person
     * landed third-in-the-list, read the top door as home, pressed it, and
     * arrived at the surface the flip existed to escape. Spelling "/start"
     * back into that row would restore this count and restore the defect with
     * it, so the count going DOWN is what proves the derivation is in place,
     * and the assertion below names the identifier so it cannot quietly
     * become a literal again.
     *
     * The count is still asserted rather than left open because an empty or
     * halved rail is exactly the failure this file exists to catch, and a
     * `>= 1` would sail past it.
     */
    expect(rows.length).toBe(4);
    for (const r of rows) expect(railOwnerOf(r)).toBe(r);
    // THE HOME DOOR IS DERIVED, NOT SPELLED. Asserted on the source, because
    // that is the only place the difference is visible: at runtime the row's
    // `to` is the string either way, so a test that only read the value could
    // not tell a derived door from a copied one.
    expect(railBlock()).toContain("to: SIGNED_IN_HOME");
    // And it really is a door, not just a name: the rail can light for it.
    expect(railOwnerOf(SIGNED_IN_HOME)).toBe(SIGNED_IN_HOME);
  });

  it("keeps the two ownership lists disjoint", () => {
    // The seven stations hang under the Work row (they were under Runs until
    // that door was deleted on 2026-08-31), the engine's inner paths under
    // Engine room. An overlap would make the lit row depend on row ORDER,
    // which is a layout accident and not a decision.
    const stations = new Set<string>(Object.values(STATION_ROUTE));
    for (const p of ENGINE_ROOM_PATHS) expect(stations.has(p)).toBe(false);
    for (const p of ENGINE_ROOM_PATHS) expect(railOwnerOf(p)).toBe("/engine-room");
  });

  it("never hand-types a path into `owns`", () => {
    // THE DERIVATION LAW, the same one nav-model.ts holds over the keycaps. A
    // literal array here would be a second copy of the station map, free to
    // drift the day Build's engine moves again (it moved once already:
    // /runs -> /build). Every `owns` must name a constant.
    const block = railBlock();
    expect(block).not.toMatch(/owns:\s*\[/);
    const owns = [...block.matchAll(/owns:\s*([A-Z][A-Z_]*)\b/g)].map((m) => m[1]);
    // One per row, so a row cannot drop the field and quietly go dark. SIX
    // since 2026-08-31, and this is the count that still sees every row: the
    // home row is invisible to the path scan above but not to this one, so
    // "how many rows are there" and "how many spell their path" are two
    // different questions and the pair of numbers answers both.
    expect(owns.length).toBe(5);
  });

  it("owns exactly the seven stations the strip navigates to", () => {
    // Read from STATION_ROUTE rather than listed, so this test cannot be the
    // place the drift hides either.
    const stations = Object.values(STATION_ROUTE);
    expect(stations.length).toBe(7);
    /*
     * THE OWNER MOVED ON 2026-08-31 AND THE RULING NAMED WHERE.
     *
     * These seven hung under the `/runs` row until F-145 deleted that door for
     * contradicting R-01. R-01's own sentence says where they go instead: a
     * station is the step list INSIDE ONE RUN, and the Work row already owns
     * the run - /start where work is handed over, /track/:id where it is
     * watched. So the same ruling that removed the door named the new owner.
     *
     * WHAT THIS TEST IS REALLY FOR, unchanged since 2026-08-05: pressing 3
     * navigates to /plan, and before `owns` existed every row in the rail went
     * dark when it did. Deleting a row deletes whatever it was speaking for,
     * so a fold is the single most likely way to reopen that.
     */
    for (const path of stations) expect(railOwnerOf(path)).toBe(SIGNED_IN_HOME);
    // And a station's own sub-surface stays under the same row: /plan/spec/<id>
    // is where a spec is written and it is still Plan.
    expect(railOwnerOf("/plan/spec/abc")).toBe(SIGNED_IN_HOME);
    expect(railOwnerOf("/build/mission-1")).toBe(SIGNED_IN_HOME);
    // /runs came with them: bare it is a redirect to the board, and
    // /runs/:missionId is a run screen. Neither is a door any more.
    expect(railOwnerOf("/runs")).toBe(SIGNED_IN_HOME);
    expect(railOwnerOf("/runs/mission-1")).toBe(SIGNED_IN_HOME);
  });

  it("puts no station in the rail, which is R-01 and the founder's F-146", () => {
    /*
     * THE RULING ENFORCED BY THE SUITE RATHER THAN BY A DOCUMENT.
     *
     * R-01: "no station in the rail, no station as a route a person browses
     * to." It was broken for twenty-six days by a row labelled `Stations`
     * pointing at /runs, and the founder found it before any test did, because
     * nothing here was asserting it. A ruling that only lives in a markdown
     * file is a ruling that gets walked into by the next person fixing a worse
     * defect - which is exactly how that row was created (S2's U-047 correctly
     * fixed a door that said "Runs" and opened /today, and landed here).
     *
     * Asserted on the row DESTINATIONS rather than the labels: renaming the
     * door would not make it stop being a station door, and the label is the
     * part somebody would change while trying to be helpful.
     */
    const rows = [...railBlock().matchAll(/to:\s*"([^"]+)"/g)].map((m) => m[1]);
    const stations = new Set<string>(Object.values(STATION_ROUTE));
    expect(rows.filter((r) => stations.has(r))).toEqual([]);
    // /runs is not a station route, but it was the station door's address and
    // it is the one a well-meaning restoration would reach for first.
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

  it("lights the appropriate row for surfaces that own paths (dead zone fix)", () => {
    // Previously, Approvals, Boundary, and Threads were unreachable dead zones.
    // Now each is owned: Today owns Approvals, Brain owns Threads, and the
    // Settings door owns Boundary since Agents moved behind it on 2026-08-15.
    // /approvals HAS NO ROW OF ITS OWN SINCE 2026-08-31 (F-145) and this
    // assertion is the whole reason the fold is safe: it folded into the
    // board, and the board's row must answer for it or `g v` lands somewhere
    // the shell cannot name. A fold that drops a caller is a silent
    // regression that typechecks, and this is where it would show.
    expect(railOwnerOf("/approvals")).toBe("/today");
    expect(railOwnerOf("/threads")).toBe("/threads");

    // Settings is a special case: it's not a row, it's a foot icon, so
    // `railOwnerOf` is silent about it and its own territory by design.
    expect(railOwnerOf("/settings")).toBeNull();
    expect(railOwnerOf("/crew")).toBeNull();
    expect(railOwnerOf("/boundary")).toBeNull();
  });

  /**
   * THE HALF A DEMOTION USUALLY DROPS.
   *
   * Crew came off the rail on 2026-08-15 and became Agents inside Settings.
   * The keyboard did not move with it: `g c` still fires at /crew, and
   * /boundary is still reached from that surface. Before this, both were owned
   * by the Crew ROW, and a foot control gets no ownership for free — so the
   * move would have left two destinations the shell could not name, which is
   * the precise defect this whole file was written after.
   *
   * Asserted on the exported function rather than on the markup, so it holds
   * whichever control ends up drawing it.
   */
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
