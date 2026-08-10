import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { SETTINGS_GROUPS, ALL_SECTION_IDS } from "@/lib/settings-sections";

/**
 * ONE LIST OF SECTIONS, AND THE ROUTE IS NOT ALLOWED A SECOND.
 *
 * WHY THIS EXISTS. Settings was fifteen sections in a flat list that the
 * founder described, accurately, as "never gave a thought about it, just
 * randomly designed and a little layer and tweaks". It is now five named groups
 * declared in `settings-sections.ts`, and the route renders them.
 *
 * The failure mode a regrouping invites is a SECOND list: a route that keeps
 * its own array of labels or ids "just for the nav", which agrees with the
 * canon on the day it is written and drifts the first time a section is added.
 * This product has already paid for that shape twice tonight -- a Settings gear
 * naming a key nothing bound, and a key registry that said `k, c, x` while the
 * route said `a, c, d`. Both were two facts in two files.
 *
 * The reviewer of the regrouping flagged that nothing enforced it: the single
 * list was a convention, and a convention is a rule nobody checks.
 */

const ROUTE = readFileSync(join(import.meta.dir, "..", "_authenticated.settings.tsx"), "utf8");
const stripComments = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const CODE = stripComments(ROUTE);

describe("the grouping is declared once", () => {
  it("the route reads the canon rather than declaring its own", () => {
    expect(CODE).toMatch(/from "@\/lib\/settings-sections"/);
  });

  it("the route holds no array of section labels of its own", () => {
    /**
     * The shape being banned is a literal list of section ids or labels inside
     * the route. Anything of the form `["profile", "workspace", …]` or a
     * `label:`-bearing array is a second source of truth.
     *
     * Matching on the ids themselves rather than on "an array literal" is
     * deliberate: the route legitimately holds arrays (of nodes, of queries),
     * and a rule that banned those would be deleted by the next person in a
     * hurry, taking the real rule with it.
     */
    const ids = ALL_SECTION_IDS.filter((id) => id !== "profile");
    const literalRuns = ids.filter((id) => {
      // Two ids as adjacent string literals is a list; one is a comparison.
      const re = new RegExp(`"${id}"\\s*,\\s*"`);
      return re.test(CODE);
    });
    expect(literalRuns).toEqual([]);
  });

  it("every group the canon declares has a label and at least one section", () => {
    // A group that renders as an empty heading is worse than no grouping: it
    // reads as a section that failed to load.
    for (const g of SETTINGS_GROUPS) {
      expect({ id: g.id, labelled: g.label.length > 0 }).toEqual({ id: g.id, labelled: true });
      expect({ id: g.id, sections: g.sections.length > 0 }).toEqual({ id: g.id, sections: true });
    }
  });

  it("no section appears in two groups", () => {
    // A section in two places is a person clicking one and being taken to the
    // other, and a nav that highlights two rows at once.
    const seen = new Set<string>();
    const twice: string[] = [];
    for (const g of SETTINGS_GROUPS) {
      for (const s of g.sections) {
        if (seen.has(s.id)) twice.push(s.id);
        seen.add(s.id);
      }
    }
    expect(twice).toEqual([]);
  });
});

describe("the pane says where focus went", () => {
  it("does not suppress its own focus ring", () => {
    /**
     * The pane takes focus when the nav moves between sections. `outline:
     * "none"` on it left a keyboard user with nothing on screen saying where
     * focus had gone -- on the one surface whose entire redesign was to become
     * a single tab stop driven by arrow keys. The regrouping made the
     * suppression worse than it had been, because it made the pane the thing
     * focus lands on.
     */
    expect(CODE).not.toMatch(/outline:\s*"none"/);
  });
});

/*
 * THE BRAND-LINK TEST IS GONE BECAUSE ITS SUBJECT IS, not because it stopped
 * mattering.
 *
 * A `a control that names a section goes to that section` block used to live
 * here. It asserted that the "Brand kit lives in Settings" link carried
 * `section: "brand"` rather than dumping the reader on Profile -- the same
 * defect as a keycap that does nothing, one layer up: a control that names an
 * act it does not perform.
 *
 * Its evidence source was `components/mission/faces.tsx`, deleted on 2026-08-10
 * with the unreachable Mission Control room. That string was checked across
 * `src/` before removing this: it existed ONLY in faces.tsx, so there is no
 * live surface to re-point the assertion at. Re-pointing it at the rebuilt
 * Settings would have meant inventing a subject, and an assertion with no
 * subject passes vacuously forever while reading like coverage.
 *
 * So it is recorded here instead of being re-homed. THE RULE SURVIVES THE TEST:
 * if a rebuilt surface reintroduces a link that names a Settings section, it
 * carries that section id, and this is the file that should say so again.
 */
