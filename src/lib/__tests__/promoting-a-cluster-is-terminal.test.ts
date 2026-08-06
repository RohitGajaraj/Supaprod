import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { INELIGIBLE_STATUSES, qualifies } from "../spine/promote";

/**
 * SIX BETS FROM ONE CLUSTER, AND SIX CRITIC PASSES BILLED FOR THEM.
 *
 * MEASURED ON THE LIVE DATABASE, 2026-08-06: ten themes carried more than one
 * opportunity, fifty opportunities between them, and one theme had SIX. Every
 * duplicate ran its own Critic pass, so this was charging the founder repeatedly
 * for the same judgment and putting six identical bets in front of the user in
 * /decide, each looking like an independent call.
 *
 * THE CAUSE. `promoteThemeToOpportunity` wrote the opportunity and its lineage
 * and never touched the theme. Discover's `ranked` filter drops only `dismissed`
 * and `merged`, so a promoted cluster stayed in the queue, `focusedId` still
 * pointed at it, and the Gate re-rendered the identical question with "Make it a
 * bet" still armed on `a` -- the fastest key on the station and the one the
 * surface tells you to press. Two presses was all it took, and the autonomous
 * sweep in `promote.server.ts` could mint one independently on top.
 *
 * THREE PLACES HAVE TO AGREE or the fix is decoration: the write that marks the
 * theme, the manual queue that hides it, and the autonomous sweep that skips it.
 * Any one of them missing and duplicates come back through that door.
 */

const ROOT = join(import.meta.dir, "..", "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

describe("the autonomous sweep will not re-promote a settled cluster", () => {
  it("treats promoted as ineligible", () => {
    expect(INELIGIBLE_STATUSES).toContain("promoted");
  });

  it("refuses a promoted theme outright, whatever its score", () => {
    // Behavioural, not a grep: a theme that would otherwise sail through the
    // bar must still be refused on status alone.
    const strong = {
      id: "t1",
      title: "A cluster with real weight behind it",
      status: "promoted",
      frequency: 99,
      severity: 5,
      confidence: 1,
    };
    const verdict = qualifies(strong as never);
    expect(verdict.ok).toBe(false);
    expect(verdict.why).toMatch(/already settled/);
  });

  it("still promotes a live cluster, so the bar did not just close", () => {
    // The opposite failure: if this started refusing everything, the station
    // would go quiet and look healthy doing it.
    const live = {
      id: "t2",
      title: "A cluster with real weight behind it",
      status: "new",
      frequency: 99,
      severity: 5,
      confidence: 1,
    };
    expect(qualifies(live as never).ok).toBe(true);
  });

  it("keeps the states that were already terminal", () => {
    for (const s of ["dismissed", "merged", "archived", "done"]) {
      expect(INELIGIBLE_STATUSES).toContain(s);
    }
  });
});

describe("promotion writes the state the rest of the system reads", () => {
  const SRC = read(join("lib", "discovery.functions.ts"));

  it("marks the theme promoted", () => {
    expect(SRC).toMatch(/\.update\(\{ status: "promoted" \}\)/);
  });

  it("marks it AFTER the bet exists, never before", () => {
    // A failure above this point must leave the cluster promotable. Marking
    // first and failing later strands a theme with no bet behind it, which is
    // unrecoverable from the surface.
    const handler = SRC.slice(SRC.indexOf("export const promoteThemeToOpportunity"));
    const insert = handler.indexOf('.from("opportunities")');
    const mark = handler.indexOf('.update({ status: "promoted" })');
    expect(insert).toBeGreaterThan(-1);
    expect(mark).toBeGreaterThan(insert);
  });

  it("does not abort the promotion if the mark fails", () => {
    // Fail-soft on purpose: an unmarked bet that exists is recoverable, a mark
    // with no bet behind it is not.
    const handler = SRC.slice(SRC.indexOf("export const promoteThemeToOpportunity"));
    const after = handler.slice(handler.indexOf('.update({ status: "promoted" })'));
    expect(after.slice(0, 400)).toMatch(/console\.error/);
    expect(after.slice(0, 400)).not.toMatch(/throw new Error/);
  });
});

describe("the manual queue stops offering it", () => {
  it("Discover's ranking drops promoted alongside dismissed and merged", () => {
    expect(read(join("components", "discover", "DiscoverSurface.tsx"))).toMatch(
      /st !== "dismissed" && st !== "merged" && st !== "promoted"/,
    );
  });
});
