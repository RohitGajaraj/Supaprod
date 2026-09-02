import { describe, it, expect } from "bun:test";

import { actorName, actorSlug, actorVerb } from "./run-state";

/**
 * ATTRIBUTION GUARD.
 *
 * THE DEFECT THIS EXISTS TO KILL, found 2026-08-05. The run DETAIL page held its
 * own `const BUILDER = "builder"` and spent it unconditionally: the headline
 * ("Engineer is lining up the next run"), "Who is on it", "What happens next",
 * every ledger row, the gate's rationale line and every receipt's handoff arrow.
 * `getStudioSession` selects a session's runs by `agent_slug='builder'`, so that
 * name is a FACT for a 'build' session and an INVENTION for every other one.
 * "From a goal" is the default composer door, so most runs are orchestrator
 * goal-runs with no build agent in them at all, and the run LIST one click back
 * was correctly calling the very same row "The crew".
 *
 * WHY IT IS WORTH A BUILD-FAILING TEST rather than a review note. Attribution is
 * the proof of this whole product: the claim is that you can see which agent did
 * what. A fabricated name is the one screenshot that makes that claim false, and
 * a surface that disagrees with the surface next to it about who did the work
 * destroys trust in both at once. It is also easy to reintroduce, because a
 * concrete name reads better on a page than "The crew" does.
 *
 * TWO HALVES ORIGINALLY, because the values alone would not have caught it:
 * the mapping had to be right, AND the run detail page had to actually go
 * through it rather than around it with a literal of its own. The second
 * half's guard, a source-text read of `_authenticated.runs.$missionId.tsx`,
 * went with that page (P-14, A-QUEUE.md, R-35): a mission without a track is
 * not a run, and the page holds no literal of its own to guard any more.
 */

describe("who a run may be attributed to", () => {
  it("names Engineer only where a builder run is what was selected", () => {
    expect(actorName("build")).toBe("Engineer");
    expect(actorSlug("build")).toBe("builder");
  });

  it("says The crew for a goal-run, and offers no slug to draw a mark from", () => {
    expect(actorName("mission")).toBe("The crew");
    // Null, not "orchestrator" and not the holder's uuid. `missions.current_agent_id`
    // has no client-reachable slug resolver, so there is nothing honest to name.
    expect(actorSlug("mission")).toBeNull();
  });

  it("falls to the crew while the kind is still unknown, not to a name", () => {
    // A page mid-load must not spend a second crediting the wrong agent.
    expect(actorName(undefined)).toBe("The crew");
    expect(actorName(null)).toBe("The crew");
    expect(actorSlug(undefined)).toBeNull();
  });

  it("gives every run a verb, including the one with no catalog entry", () => {
    // The verb is what the live caption falls back to when the latest step is a
    // thought rather than a tool call, so an empty string would print "is ".
    expect(actorVerb("build").length).toBeGreaterThan(0);
    expect(actorVerb("mission")).toBe("working");
    expect(actorVerb(undefined)).toBe("working");
  });
});
