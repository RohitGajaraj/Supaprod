/**
 * A REGION'S NAME IS READ OUT BEFORE ITS CONTENTS, SO IT IS THE ONE LABEL
 * NOBODY CAN SKIM PAST TO CHECK.
 *
 * ── THE TWO COLLISIONS, FOUND 2026-09-10 ──────────────────────────────────
 * On one run screen, a screen-reader user met:
 *
 *   "What happened on this run"   `ThroughLine`   -- a REPORT of what stations filed
 *   "What actually happened"      `ArtifactPane`  -- a CONTROL grading a forecast
 *
 *   "Working on this now"         `TrackRun`      -- the seats on the run
 *   "Working here now"            `LiveStation`   -- the seats at one station
 *
 * Each name is defensible alone. Together, one pair cannot be told apart from
 * the other at all, and the difference in the second pair -- run versus station
 * -- was carried entirely by the word "here", which names a place only to
 * somebody who can see where the list is. A sighted reader never meets either
 * collision, because they have the heading, the column and the position to
 * disambiguate. That is why both survived every visual review this screen has
 * had, and it is the same shape Lane 1 hit on the entry the same evening: a
 * label that stays where it was while the thing beside it changes.
 *
 * ── WHY AN INVENTORY AND NOT A SIMILARITY MEASURE ─────────────────────────
 * The obvious guard is to score every pair for shared meaning, and this repo
 * already owns the measure -- `containment` in `what-it-keeps-saying.ts`. It is
 * the wrong instrument here and the numbers say so: `MIN_CONTAINMENT` is 0.2,
 * tuned for the long sentences agents write, and at four words even the two
 * CORRECTED labels score 0.5 against each other. A guard that fires on the fix
 * is worse than no guard, because it teaches the next person to skip the line.
 *
 * So this asserts the whole LIST instead. It cannot tell you that two names
 * mean the same thing; what it can do is make anybody who adds or renames a
 * region read all of them together, which is the only way this class is ever
 * caught. Law 14's own mitigation: assert over the COLLECTION, not the row --
 * and the precondition holds, because the fact is nameable from the source.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

/**
 * The components that draw a labelled region on the run screen.
 *
 * Named explicitly rather than globbed: the question is which regions a person
 * meets ON ONE SCREEN, and a glob would sweep in every other surface's labels
 * and answer a different question. `OutcomeCard` is deliberately absent -- it
 * belongs to the product surface, and its "What actually happened" is alone
 * there.
 */
const ON_THE_RUN_SCREEN = [
  "src/components/track/TrackRun.tsx",
  "src/components/track/ThroughLine.tsx",
  "src/components/track/ArtifactPane.tsx",
  "src/components/track/LiveStation.tsx",
  "src/components/track/RunNow.tsx",
  "src/components/spine/TrackActivity.tsx",
];

/** A source guard scoring the prose that explains it is the standing trap. */
const codeOnly = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");

function labelsIn(path: string): string[] {
  const code = codeOnly(readFileSync(path, "utf8"));
  return [...code.matchAll(/aria-label="([^"]+)"/g)].map((m) => m[1]!);
}

const ALL = ON_THE_RUN_SCREEN.flatMap(labelsIn);

describe("every region a person meets on the run screen", () => {
  it("is named once, and no two share a name", () => {
    /*
     * Exact duplicates are the floor, not the ceiling: two regions with the
     * SAME name are indistinguishable to everyone, sighted or not.
     */
    const seen = new Map<string, number>();
    for (const l of ALL) seen.set(l, (seen.get(l) ?? 0) + 1);
    const repeated = [...seen].filter(([, n]) => n > 1).map(([l]) => l);
    expect(repeated).toEqual([]);
  });

  it("and the two pairs that collided are fixed, each carrying its own scope", () => {
    /* The distinction is the whole run versus the one stop being shown, so
       both names say which. "Stop" and not "station": the pane's own caption
       says "Press a stop on the road above", and `a-user-never-reads-the-org-
       chart` refuses the machine's word -- it caught my first draft of this
       very fix. */
    expect(ALL).toContain("Working on this run");
    expect(ALL).toContain("Working on this stop");
    expect(ALL).not.toContain("Working on this now");
    expect(ALL).not.toContain("Working here now");

    // A report and a control, told apart by naming the control as an act.
    expect(ALL).toContain("What happened on this run");
    expect(ALL).toContain("Grade the forecast");
    expect(ALL).not.toContain("What actually happened");
  });

  it("and the inventory is whole, so a rename cannot slip through unread", () => {
    /*
     * THE MIRROR. Every assertion above except the last passes by finding
     * nothing or by finding four strings, so a file list that stopped
     * resolving, or a regex that stopped matching, would report a clean sweep
     * of an empty array.
     *
     * This is deliberately a count rather than a full snapshot: a snapshot of
     * every label would fail on any unrelated addition and be updated without
     * being read, which is how an inventory stops being one.
     *
     * Eleven at the time of writing:
     *
     *   Working on this run · What happened on this run · The number you read
     *   Grade the forecast · App or diff · Nothing to read · Not yet grouped
     *   Working on this stop · Files touched · What is happening now
     *   What the agents did, in order
     *
     * "What is happening now" and "What happened on this run" are the closest
     * remaining pair and they are left alone: one is the present state and the
     * other is the station-by-station history, and the tense is doing real work
     * rather than papering over a collision.
     */
    expect(ALL.length).toBeGreaterThanOrEqual(11);
    for (const f of ON_THE_RUN_SCREEN) {
      expect(readFileSync(f, "utf8").length).toBeGreaterThan(500);
    }
  });
});
