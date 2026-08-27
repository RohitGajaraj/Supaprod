/**
 * THE ROW A PERSON CLICKS AND THE PAGE THEY LAND ON MUST NAME THE SAME THING.
 *
 * The rail row read "Outside access" and the pane it opened was headed "Agent
 * access" -- two names for one destination, visible side by side on one screen,
 * because the plain-words rename moved the INDEX and not the DESTINATION.
 *
 * This is the same defect class the nav model file already records from
 * 2026-08-15, when one door had THREE names at once (rail "Engine room", label
 * "Pulse", route `/engine-room`) and "nobody noticed because no test compares
 * them and each file reads only itself". This is that test, for settings.
 *
 * SCOPE, stated rather than implied: it checks the sections whose heading is
 * written inline in the route, which is where a literal title can drift from a
 * literal label. Sections that mount a component and let it draw its own head
 * are not covered here -- naming those would mean parsing every pane, and a
 * guard that pretends to cover more than it does is worse than one that says
 * what it checks.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SETTINGS_GROUPS, type SectionId } from "@/lib/settings-sections";

const route = readFileSync(
  join(import.meta.dir, "..", "..", "routes", "_authenticated.settings.tsx"),
  "utf8",
);

const labelOf = new Map<SectionId, string>(
  SETTINGS_GROUPS.flatMap((g) => g.sections.map((s) => [s.id, s.label] as const)),
);

describe("a settings door and the page behind it share a name", () => {
  it("every inline pane heading matches its door label", () => {
    const mismatched: string[] = [];
    let checked = 0;
    for (const [id, label] of labelOf) {
      /*
       * BOUNDED TO THE BRANCH. The first version searched 400 characters past
       * `active === "<id>"` and happily ran into the NEXT section's heading, so
       * it reported two sections as renaming themselves to "Brand". A guard
       * that invents drift is worse than none, because the fix for a false
       * positive is usually to weaken the guard.
       */
      const from = route.indexOf(`active === "${id}" &&`);
      if (from === -1) continue;
      /*
       * AND CAPPED, because the LAST branch has no next one to stop at. Without
       * this, `health` ran to end of file and matched a heading inside a helper
       * component defined hundreds of lines below, reporting "Diagnostics vs
       * Profile". The cap is generous enough for an inline heading and its
       * comment, and short enough that it cannot reach the next component.
       */
      const next = route.indexOf('active === "', from + 20);
      const stop = Math.min(next === -1 ? route.length : next, from + 800);
      const branchSrc = route.slice(from, stop);
      const head = /<PageHeading\s+title="([^"]+)"/.exec(branchSrc);
      if (!head) continue;
      checked++;
      if (head[1] !== label) mismatched.push(`${id}: door "${label}" vs page "${head[1]}"`);
    }
    // The rule must have subjects, or a refactor could silently empty it.
    expect(checked).toBeGreaterThan(0);
    expect(mismatched, "the row a person clicks and the page they land on disagree").toEqual([]);
  });
});
