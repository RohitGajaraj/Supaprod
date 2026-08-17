/**
 * Settings navigates with Meridian's rail, and kept everything the hand-rolled one
 * had earned.
 *
 * ── WHY THIS FILE IS MOSTLY ABOUT WHAT DID NOT GET LOST ─────────────────────
 * The nav this replaced was on retired Cadence/ink tokens, and it had also built,
 * alone and correctly, the three things Meridian's rail was missing: a roving
 * tabindex, arrow keys and typeahead. Its own header recorded the reason -- 
 * "Diagnostics was a fourteen-press crawl".
 *
 * So the obvious version of this change was a REGRESSION dressed as an adoption:
 * prettier rail, twelve tab stops. The rail was taught the keyboard first
 * (`sidebar-keyboard-ring.test.ts`), and this file pins the surface half -- that the
 * swap actually happened, that one list of doors still feeds it, and that the skip
 * link survived.
 */
import { readFileSync } from "node:fs";

import { describe, expect, it } from "bun:test";

import { stripComments } from "@/__tests__/meridian-ratchet-scan";

const route = readFileSync(new URL("../_authenticated.settings.tsx", import.meta.url), "utf8");
/* Absence is asserted against shipping code only. Twice this session a guard was
   satisfied by the very comment explaining the change it was guarding. */
const shipping = stripComments(route);
const ships = (needle: string) => shipping.includes(needle);

describe("the rail is Meridian's", () => {
  it("renders SidebarNav", () => {
    expect(ships("<SidebarNav"), "Settings is not using the design system's rail").toBe(true);
  });

  it("does not hand-roll a door list on the retired tab class", () => {
    // `sp-tab` was the old row. Its presence would mean two navs on one surface.
    expect(ships('className="sp-tab"'), "the hand-rolled door survived the swap").toBe(false);
  });

  it("feeds the rail from the one list of what Settings contains", () => {
    /*
     * THE DEFECT THIS PREVENTS, which this route shipped for a month and its own
     * header describes: two lists of the doors, one private to the route and one in
     * settings-sections.ts, drifting apart with no test comparing them.
     */
    expect(ships("NAV_GROUPS.flatMap")).toBe(true);
  });

  it("states the workspace instead of pretending to switch it", () => {
    /*
     * The rail's workspace row is a real button only when given a handler. Settings
     * must NOT give it one: switching lives in the app shell's scope menu, and a
     * second switcher over one value is two controls that can disagree.
     */
    expect(ships("onWorkspaceClick"), "Settings drew a second workspace switcher").toBe(false);
  });
});

describe("nothing the old nav earned was dropped", () => {
  it("keeps the skip link, and keeps it on this surface rather than in the rail", () => {
    // It targets THIS page's pane, so pushing it into Meridian would put a
    // Settings-shaped hole in a shared component.
    expect(ships("Skip to the settings")).toBe(true);
    expect(ships("href={`#${PANE_ID}`}")).toBe(true);
  });

  it("still lands focus in the pane, or the skip link does not skip", () => {
    expect(ships("id={PANE_ID}")).toBe(true);
    expect(ships("tabIndex={-1}")).toBe(true);
  });

  it("drops the group description, which was a paragraph of chrome in a 200px column", () => {
    /*
     * `g.desc` rendered under whichever heading was active. The founder's complaint
     * about these surfaces was "just a dump of the content", and prose explaining a
     * heading is that complaint's shape in a sidebar. The words still exist in
     * settings-sections.ts; they are simply not in the way of a door.
     */
    expect(ships("{g.desc}"), "the description paragraph is still drawn in the nav").toBe(false);
  });
});

describe("search reaches inside the panes, not across the headings", () => {
  it("asks the IA which doors match, rather than filtering labels here", () => {
    /*
     * THE FIRST VERSION WAS `label.includes(query)` AND THE FOUNDER BROKE IT IN A
     * MINUTE: "credits" found nothing and "invite" found nothing, though the surface
     * does both. A search over twelve door names answers "which door is called this",
     * and nobody asks that.
     */
    expect(ships("searchSections(query)"), "the rail still searches door labels").toBe(true);
    expect(ships("i.label.toLowerCase().includes(needle)"), "the old label filter is back").toBe(
      false,
    );
  });

  it("says WHY a door matched when its label does not explain it", () => {
    // Being offered "Billing" for "credits" is correct and baffling on its own.
    expect(ships("matchReason(id, query)")).toBe(true);
  });

  it("falls back to the full list when nothing matches", () => {
    /*
     * THE ASSERTION THAT MATTERS MOST HERE. A nav that can empty itself is a set of
     * doors that can vanish, and a mistype must not strand somebody on the surface
     * they are standing on.
     */
    expect(ships("hits.length > 0")).toBe(true);
    expect(ships(": allItems")).toBe(true);
  });
});
