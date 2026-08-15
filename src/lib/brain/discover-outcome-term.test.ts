/**
 * WHY DISCOVER'S RANKING HAS NO OUTCOME TERM, and what would have to change first.
 *
 * AGENTS.md states the moat as a verdict being "used to re-rank what Discover and
 * Decide surface next". The obvious reading of that sentence is that `scoreTheme`
 * is missing a term, and the obvious fix is to fold `outcomeSupportFromCounts`
 * into it the way /decide folds it into `compareOpportunities`.
 *
 * THAT FIX WOULD DO NOTHING, and it would look like it did something, which is
 * worse than leaving the gap visible. The reasoning, in the order it has to hold:
 *
 *   1. A learning reaches a cluster only through a bet (`opportunities.theme_id`)
 *      or through a track (`spine_tracks.theme_id`).
 *   2. `promoteThemeToOpportunity` is the ONLY writer of `opportunities.theme_id`,
 *      and it writes `themes.status = 'promoted'` in the same function. The
 *      autonomous sweep writes that status too.
 *   3. So a theme with ANY settled outcome is necessarily a promoted theme.
 *   4. Discover's ranking excludes promoted themes.
 *
 * Therefore an outcome term on `scoreTheme` would be evaluated against an empty
 * set on that surface. It would typecheck, it would be unit-testable, it would
 * read as the moat being wired, and it would change no row a person ever sees.
 * That is precisely the "claim that outruns its wiring" the gates exist to catch.
 *
 * WHAT DISCOVER DOES INSTEAD, and it is the honest version: a settled cluster is
 * reported as settled rather than hidden, with a door to the chain that came out of
 * it, and `getThemePrecedent` tells a person when a NEW cluster resembles something
 * already decided. Guidance a person can see and argue with, rather than a silent
 * reweighting whose direction nobody agreed.
 *
 * AND THE DIRECTION WOULD NOT HAVE BEEN /decide's ANYWAY. /decide ranks bets, where
 * a missed history sensibly sinks a new bet on the same evidence. Discover ranks
 * PROBLEMS, and a missed bet means the problem is real and still unsolved, so the
 * same sign would bury the thing most worth looking at. Reusing the sign would have
 * been a product error, not just a no-op.
 *
 * THIS FILE IS A TRIPWIRE ON PREMISE 4. If promoted themes ever return to the
 * ranking, every sentence above stops being true and the term becomes necessary.
 * The test fails then, which is the only moment anyone needs to reread this.
 */
import { readFileSync } from "node:fs";

import { describe, expect, it } from "bun:test";

import { INELIGIBLE_STATUSES } from "@/lib/spine/promote";
import { scoreTheme, type ScoreInputs } from "./score";

const surface = readFileSync(
  new URL("../../components/discover/DiscoverSurface.tsx", import.meta.url),
  "utf8",
);

describe("the premise that makes an outcome term pointless on Discover", () => {
  it("keeps promoted clusters out of the ranking a person triages", () => {
    // PREMISE 4. If this stops being true, the reasoning in this file's header
    // collapses and scoreTheme genuinely does need an outcome term.
    const excludes = surface.includes('st !== "promoted"');
    expect(
      excludes,
      "Discover's ranking now includes promoted clusters, so a theme with settled " +
        "outcomes can reach it. Re-read the header of this file: the argument for " +
        "scoreTheme having no outcome term no longer holds.",
    ).toBe(true);
  });

  it("keeps promoted clusters out of the autonomous sweep too, for the same reason", () => {
    // The sweep and the surface have to agree about what settled means, or one of
    // them re-offers work the other has already taken.
    expect(INELIGIBLE_STATUSES).toContain("promoted");
  });

  it("has no outcome input to score a theme with, deliberately", () => {
    // Stated as a compile-time fact rather than a comment: ScoreInputs carries no
    // verdict slot, so nothing can quietly start feeding one.
    const inputs: ScoreInputs = {
      severity: 4,
      confidence: 0.8,
      createdAt: new Date().toISOString(),
      frequency: 9,
    };
    expect(Object.keys(inputs)).not.toContain("outcomeSupport");
    expect(scoreTheme(inputs, Date.now())).toBeGreaterThan(0);
  });

  it("still tells a person when a new cluster resembles a settled decision", () => {
    // The honest edge, and it must stay wired: this is what replaces the silent
    // reweighting. A door, not a nudge.
    expect(surface).toContain("getThemePrecedent");
  });

  it("reports a settled cluster rather than hiding it", () => {
    // The other half. A cluster that left the queue is still answerable, which is
    // where "what happened to the work" is reachable from.
    expect(surface).toContain("focusSettled");
  });
});
