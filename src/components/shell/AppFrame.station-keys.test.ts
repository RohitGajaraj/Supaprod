import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { STATION_DOORS, RAIL_DOORS } from "./AppFrame";
import { NAV_CHORD_PREFIX, PRIMARY_NAV } from "@/lib/nav-model";
import { AGENT_STATION_ORDER } from "@/lib/agent-vocabulary";

/**
 * A KEY THAT FIRES AND IS DRAWN NOWHERE IS A KEY NOBODY HAS.
 *
 * THE DEFECT THIS PREVENTS, founder-reported 2026-08-06. His words: "I could
 * see those things only for the app panels — Today, Runs, accept/reject.
 * Don't we have those for the seven strips, Discover, Decide and so on?"
 *
 * He was reading the screen correctly. `navKeyHint` binds THIRTEEN doors and
 * GotoShortcuts fires all thirteen, but the only surface drawing a keycap was
 * the RAIL, and the rail has five rows — Today, Runs, Brain, Crew, Engine room.
 * The seven loop stations have never been rail rows and were decided against
 * twice (see the RAIL comment in AppFrame.tsx); they live on the spine strip,
 * which drew number, name, note and dot and no key. So `g d`, `g e`, `g p`,
 * `g n`, `g b`, `g h` and `g l` had been live and invisible since the chord
 * shipped — a majority of the product's navigation.
 *
 * AppFrame's own comment block had CONFESSED it in writing: "Seven more keys
 * fire at the loop stations, which have no rail row; inventing rows for them is
 * a nav change and the five rows are decided. That gap is reported, not papered
 * over." A reported gap with no test is a gap that reopens, which is exactly
 * what this file is for.
 *
 * NOTHING ELSE COULD SEE IT. Every existing keyboard guard asks its question of
 * the RAIL: AppFrame.nav-keys.test.ts checks RAIL_DOORS draws what navKeyHint
 * binds, and AppFrame.rail-covers-keys.test.ts checks no bound key lands where
 * the rail cannot follow. Both passed the whole time, because both were correct
 * about the five rows and neither knew the strip existed.
 */

const SRC = readFileSync(join(import.meta.dir, "AppFrame.tsx"), "utf8");
const CSS = readFileSync(join(import.meta.dir, "..", "..", "styles", "shell.css"), "utf8");
const PALETTE = readFileSync(join(import.meta.dir, "..", "supaprod", "GotoShortcuts.tsx"), "utf8");

describe("every station draws the key that opens it", () => {
  /*
   * P-11 (A-QUEUE.md, 2026-09-02) CUT THE SEVEN LOOP STATIONS FROM
   * PRIMARY_NAV, AND THAT IS NOT A REGRESSION OF THIS FILE'S OWN INVARIANT.
   *
   * R-01 and F-146 already retired stations as navigation before P-11 ever
   * touched this file: `use-spine-strip.ts`'s "nav" publisher deliberately
   * stopped supplying `onSelect` ("NO onSelect, AND THAT IS THE WHOLE
   * CHANGE"), and the render's own `asTab || !interactive` gate (AppFrame.tsx,
   * a few hundred lines below the rail this test does not touch) was ALREADY
   * forcing every live station chip's keycap to "" before this packet — a
   * live station chip has drawn no key since F-146, on either strip mode.
   * `doorKey` now agreeing with what every render call site already showed
   * is the derivation catching up to the doctrine, not a capability lost.
   */
  it("resolves no key for any of the seven, matching what the strip already drew", () => {
    expect(STATION_DOORS.length).toBe(AGENT_STATION_ORDER.length);
    const keyed = STATION_DOORS.filter((d) => d.key !== "");
    expect(keyed).toEqual([]);
  });

  it("finds no PRIMARY_NAV row for a station, because a station is not a door", () => {
    // The DERIVATION LAW (nav-model.ts) still holds: station -> route ->
    // PRIMARY_NAV row -> navKeyHint is the same path GotoShortcuts walks in
    // reverse, and it correctly finds nothing for a route the rail does not
    // own — a keycap can only be honest about a control that exists.
    for (const door of STATION_DOORS) {
      /*
       * A STATION'S ROUTE MAY NOW ALSO BE A DOOR, and that is not a violation.
       * P-60 gave `/arriving` the row "What came in"; `STATION_ROUTE` maps
       * `sense` to the same URL, because the same surface answers a person's
       * question and shows a station's output. What R-01 forbids is a station
       * CHIP claiming a key, and that is what is asserted.
       */
      expect(door.key).toBe("");
    }
  });

  it("gives each station its own letter, shared with no other door", () => {
    const all = [...STATION_DOORS.map((d) => d.key), ...RAIL_DOORS.map((d) => d.key)].filter(
      (k) => k !== "",
    );
    expect(new Set(all).size).toBe(all.length);
  });

  it("never binds a digit, because the marker beside it is already a number", () => {
    // The founder's ruling: "either you go with numbers or you go with
    // alphabets". The chip renders 01..07 as IDENTITY. A digit shortcut on the
    // same chip would put two numbers side by side meaning different things,
    // which is the ambiguity the chord was adopted to remove.
    for (const door of STATION_DOORS) expect(door.key).not.toMatch(/[0-9]/);
  });
});

describe("the keycap is rendered, and only where it tells the truth", () => {
  it("the chip derives its key rather than typing one", () => {
    expect(SRC).toMatch(/doorKey\(STATION_ROUTE\[stage\.station\]\)/);
    expect(SRC).toMatch(/className="sp-stage-key"/);
  });

  it("draws the prefix with the letter, never a bare letter", () => {
    // A keycap reading "d" would promise a key that does nothing: `d` alone is
    // unbound, `g` then `d` opens Discover.
    expect(SRC.replace(/\s+/g, " ")).toMatch(
      /<kbd className="sp-stage-key" data-shortcut=\{`\$\{NAV_CHORD_PREFIX\} \$\{stageKey\}`\}/,
    );
  });

  it("stands down wherever the chip is not a door", () => {
    /*
     * WIDENED 2026-08-31 (F-146), AND THE OLD PREMISE IS NOW FALSE.
     *
     * This asserted `asTab ? "" : doorKey(...)` and explained it as: "on the
     * spine a chip NAVIGATES to the station, so the keycap is the keyboard
     * equivalent of the click." **The spine chip no longer navigates.** R-01
     * has always said stations are the step list inside one run and never
     * doors, and the founder reported the consequence himself — a rail door
     * and a station chip both clickable, with nothing saying which was which.
     *
     * So the condition grew a second arm and the RULE underneath it is
     * unchanged and now says more: **a keycap is drawn only where a key would
     * do something.** Two ways that can be false now — inside a run, where the
     * chip switches tab and `g d` would abandon the run; and on the workspace
     * strip, where the chip is no longer a control at all.
     */
    expect(SRC).toMatch(/const stageKey = asTab \|\| !interactive \? "" : doorKey\(/);
  });

  it("makes the handler itself the switch, so a flag cannot disagree with it", () => {
    /* `interactive` is read off `strip.onSelect` rather than off the mode. A
       `readOnly` flag could be set wrong while a handler still existed, and the
       two would disagree about whether the chip is a door; there is nothing to
       disagree with when the handler IS the switch. */
    expect(SRC).toMatch(/const interactive = typeof strip\.onSelect === "function";/);
    // And the non-control branch really is not a button.
    expect(SRC.replace(/\s+/g, " ")).toMatch(/return interactive \? \( <button/);
  });

  it("says it in words for a reader who cannot see a revealed keycap", () => {
    const flat = SRC.replace(/\s+/g, " ");
    expect(flat).toMatch(
      /className="sp-sr-only"> Shortcut: \{NAV_CHORD_PREFIX\} then \{stageKey\}/,
    );
    // And it must NOT have been done with aria-label, which REPLACES the
    // accessible name: the chip's name carries "9 runs waiting on you", the
    // most valuable thing on it, and that must never be traded for a hint.
    expect(flat).not.toMatch(/className="sp-stage"[^>]*aria-label=/);
  });
});

describe("the rail speaks the chord it actually binds", () => {
  it("says the prefix out loud, not just the letter", () => {
    // This read "Today, shortcut t" while the visible keycap correctly read
    // "g t" — so the sighted user was told the truth and the screen-reader
    // user was told a key that does nothing. In the narrow rail that string is
    // ALSO the tooltip (shell.css draws it from attr(aria-label)), so the wrong
    // key reached everybody. Left over from the bare-key scheme.
    expect(SRC.replace(/\s+/g, " ")).toMatch(
      /aria-label=\{ shortcut \? `\$\{label\}, shortcut \$\{NAV_CHORD_PREFIX\} then \$\{shortcut\}` : label \}/,
    );
  });
});

describe("pressing the prefix reveals what it can open", () => {
  it("arming the chord stamps the document, and every exit clears it", () => {
    // The attribute is what lets one keypress reach surfaces this component
    // has never heard of. It is set on arm and removed in `disarm`, which is
    // the single funnel every exit routes through: the second key, a key that
    // is not a letter, the 2s timeout, and unmount. A keycap left lit after
    // the window closed promises a shortcut that no longer fires.
    expect(PALETTE).toMatch(/document\.documentElement\.setAttribute\(CHORD_ATTR, "armed"\)/);
    expect(PALETTE).toMatch(/document\.documentElement\.removeAttribute\(CHORD_ATTR\)/);
    const disarm = PALETTE.slice(PALETTE.indexOf("const disarm ="));
    expect(disarm.slice(0, disarm.indexOf("};"))).toContain("removeAttribute(CHORD_ATTR)");
  });

  it("the stylesheet reveals on the armed chord, on hover, and on focus", () => {
    const flat = CSS.replace(/\s+/g, " ");
    expect(flat).toMatch(
      /:root\[data-chord="armed"\] \.sp-stage-key, \.sp-stage:hover \.sp-stage-key, \.sp-stage:focus-visible \.sp-stage-key \{ opacity: 1; \}/,
    );
  });

  it("hides the keycap with opacity, never display, so nothing reflows", () => {
    // `display: none` would relayout the marker line on every hover — seven
    // chips of jitter for a hint, and the strip's height is load-bearing (the
    // state line carries a min-height for exactly this reason).
    const block = CSS.slice(CSS.indexOf(".sp-stage-key {"));
    const decl = block.slice(0, block.indexOf("}"));
    expect(decl).toContain("opacity: 0");
    expect(decl).not.toContain("display");
  });

  it("the rail rises with the strip rather than looking untouched by the press", () => {
    expect(CSS).toMatch(/:root\[data-chord="armed"\] \.sp-navkey/);
  });

  it("the prefix itself is never a destination letter", () => {
    // If any station took `g`, arming the chord would open it instead.
    for (const door of STATION_DOORS) expect(door.key).not.toBe(NAV_CHORD_PREFIX);
  });

  /**
   * THE NARROW RAIL, WHICH HAD NOTHING TO RAISE.
   *
   * FOUND IN A BROWSER AND BY NOTHING ELSE, minutes after the rule above was
   * written. Raising the rail's keycaps assumed the rail draws them. It does
   * not: `.sp-navcount` — which the keycap wears precisely so it drops with the
   * label it annotates — is set to `display: none` by TWO rules the moment the
   * rail is 64px, once for the user's own collapse and once for the 900px
   * viewport. So arming lit all seven stations and left all five rail rows
   * blank.
   *
   * That state is not an edge case. The rail AUTO-COLLAPSES once a person has
   * visited enough distinct stations (FAMILIARITY_KEY in AppFrame), so the
   * narrow rail is what a RETURNING user sees — the exact person most likely to
   * be reaching for a keyboard shortcut.
   */
  it("the collapsed rail shows its keys too, and does not just stay blank", () => {
    // Both narrow paths must be answered separately: the viewport one fires
    // with no [data-rail] attribute in play, so the attribute-scoped selector
    // cannot reach it, and a media query's contents carry no extra specificity.
    expect(CSS).toMatch(
      /:root\[data-chord="armed"\] \.sp-app\[data-rail="narrow"\] \.sp-navrow \.sp-navkey/,
    );
    const at900 = CSS.slice(
      CSS.indexOf('@media (max-width: 900px) {\n  :root[data-chord="armed"]'),
    );
    expect(at900.slice(0, 200)).toContain(".sp-navkey");
  });

  it("the icon stands down for the key rather than crowding it", () => {
    // The measurement, kept here because it is the whole argument: `.sp-nav`
    // leaves a 47px row inside a 64px rail, and an 18px icon plus an 11px gap
    // plus a 28px keycap is 57px. They cannot both be shown. A person who has
    // pressed `g` is looking for the letter, not the icon.
    expect(CSS).toMatch(
      /:root\[data-chord="armed"\] \.sp-app\[data-rail="narrow"\] \.sp-navrow > svg \{\s*display: none;/,
    );
  });
});
