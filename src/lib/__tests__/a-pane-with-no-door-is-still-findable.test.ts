/**
 * TWO SETTINGS PANES WERE REACHABLE BY TYPING THE URL AND BY NOTHING ELSE.
 *
 * `door: false` means "the ADDRESS still answers, but no door is drawn in the
 * rail" -- the mechanism a folded or quiet section uses to keep every saved link
 * alive without spending a row of the index. For a section that also does not
 * fold into another pane, that leaves SEARCH as its only route.
 *
 * And search could not see it. `searchSections` iterated `NAV_GROUPS`, which is
 * the DRAWING list and filters `door: false` out. So Diagnostics -- a live
 * report with two real server reads -- and Memory could be opened only by
 * someone who already knew the query string.
 *
 * That is the same defect this surface has had before, in the other direction:
 * the Diagnostics door was once taken out of the rail with a comment claiming
 * the Engine Room drew it instead, and nothing did. A door removed on the
 * belief that something else leads there is how a working page disappears.
 *
 * Probed with sixty words a person would plausibly type, twenty found nothing.
 * Several named capabilities this surface genuinely has: "budget", "cap",
 * "spend", "limit" and "stop" all missed, on the very pane that had just
 * inherited every one of those controls. Keywords describing a pane have to
 * move when the pane does, and nothing made them.
 *
 * These assertions are the two halves that must both hold.
 */
import { describe, it, expect } from "bun:test";
import {
  SETTINGS_GROUPS,
  NAV_DOOR_IDS,
  searchSections,
  type SectionId,
} from "@/lib/settings-sections";

const ALL = SETTINGS_GROUPS.flatMap((g) => g.sections);

describe("a pane with no door is still findable", () => {
  it("every section that draws no door and folds into nothing carries keywords", () => {
    // A folded section is reachable through the pane it folds into, so it needs
    // no words of its own. A door-less, unfolded one has search or nothing.
    const orphans = ALL.filter((s) => s.door === false && !s.foldsInto);
    expect(orphans.length).toBeGreaterThan(0); // the rule must have subjects
    for (const s of orphans) {
      expect(s.keywords ?? []).not.toHaveLength(0);
    }
  });

  it("and search actually returns them, which reading the door list could not", () => {
    for (const s of ALL.filter((x) => x.door === false && !x.foldsInto)) {
      const word = (s.keywords ?? [])[0]!;
      expect(searchSections(word)).toContain(s.id);
    }
  });

  it("searching reaches sections the rail never draws", () => {
    // The point of the fix, stated as a difference: there is at least one
    // findable section that is not a door. If this ever equals the door list,
    // the search has quietly narrowed back to what is drawn.
    const findable = new Set<SectionId>();
    for (const s of ALL)
      for (const k of s.keywords ?? []) searchSections(k).forEach((i) => findable.add(i));
    const notDoors = [...findable].filter((id) => !NAV_DOOR_IDS.includes(id));
    expect(notDoors.length).toBeGreaterThan(0);
  });

  /*
   * THE BOUNDARY'S SEVEN WORDS MOVED WITH THE PANE, 2026-09-09 (fifth review).
   *
   * An `it` here read `searchSections(word)` for "spend", "budget", "cap",
   * "limit", "stop", "tool" and "approve" and expected "autonomy". That
   * section is Team's now, so `searchSections` -- which reads the settings
   * groups and nothing else -- cannot answer for it and asserting that it
   * still does would be asserting the fold did not happen.
   *
   * The claim it was making is not dropped, it is re-homed: the same seven
   * words are asserted against the real search in `spine/find-anything.test.ts`
   * ("the boundary's own words reach Team"), where they now have to reach
   * `/team`. Deleting a guard because its subject moved and not following it
   * is how a capability goes quiet, so the pointer is written here rather than
   * left to be noticed.
   */
});
