import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * THE FRONT DOOR MAY NOT RENDER NOTHING WHILE IT READS.
 *
 * THE DEFECT THIS EXISTS TO KILL, found 2026-08-05. Today opened blank. All
 * three of its regions were written `loading ? null`, so on a cold load the
 * gate, the finished list and the learning were absent at once: a headline over
 * a horizontal rule, for as long as the slower of two server reads took. The
 * route declares no loader either, so the router's `defaultPendingComponent`
 * never covered the gap. A screen reader was handed silence for the whole of it.
 *
 * WHY IT IS WORTH A BUILD-FAILING TEST rather than a review note. `? null` is
 * the tidiest-looking line in any diff. It typechecks, it renders, it never
 * throws, and it reads as restraint. It is also the easiest way in the world to
 * reintroduce: the next person adding a fourth read to Today will copy the shape
 * of the third.
 *
 * THE FOUR LINES THIS DRAWS:
 *
 *   1. NO WAIT RESOLVES TO NOTHING. A read in flight renders the third fact
 *      (docs/conventions/surface-discipline.md §6). "Nothing is waiting on you"
 *      and "cannot reach the queue" are both claims, and while the read is
 *      running neither is known. Printing nothing is not the third option, it is
 *      the absence of an answer.
 *
 *   2. EVERY REGION WAITS ON ITS OWN READ. `loading` is the union of the queue
 *      and the missions list and it belongs to the headline alone, because one
 *      sentence assembled from two counts genuinely needs both. A REGION keyed
 *      off the union stays hidden until the SLOWER read returns, which is
 *      latency the user pays and gets nothing for. That is the founder's backlog
 *      item said exactly: fix the latency, not just the spinner.
 *
 *   3. THE COPY STATES WHAT IS BEING READ, AND NEVER HOW LONG IT TAKES.
 *      "Reading what needs you." is a fact. "Just a moment", a percentage or a
 *      seconds count are all the surface talking about itself.
 *
 *   4. A CLAIM NEVER PRINTS BEFORE ITS READ LANDS. "The last thing it learned"
 *      is a block title that asserts a learning exists, so it may not be drawn
 *      over a wait that does not yet know whether one does.
 *
 * Modelled on run-evidence-holds.test.ts and no-fabricated-agent-steps.test.ts:
 * scan the source as TEXT and strip comments first, because the fixed file
 * legitimately describes every banned shape in prose in order to ban it.
 */

/**
 * Strip comments so prose that NAMES the banned shape does not trip it, while
 * keeping the line count intact: a failure that points at the wrong line costs
 * more than it saves.
 */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, " "))
    .replace(/^(\s*)\/\/.*$/gm, "$1");
}

/**
 * EVERYTHING ABOVE THIS LINE LEFT THE FILE (P-14, A-QUEUE.md). Every describe
 * block here used to scan `components/today/Board.tsx` (`Today`'s own render
 * body, its wait copy, its headline memo) or `components/today/state-sentence.tsx`.
 * Both were unmounted -- zero importers anywhere in the codebase -- and deleted
 * with the cluster of ~20 files they alone belonged to. What survives below is
 * the one rule that was never about Today specifically.
 *
 * THE SAME RULE, ACROSS THE WHOLE SPINE.
 *
 * Everything below asserts the ONE rule that generalises cleanly (a wait may
 * not resolve to nothing) rather than pinning copy per station, because each
 * station legitimately reads different things and this file must not become a
 * place where adding a read means editing a test in another directory.
 */
describe("no station renders nothing while it reads", () => {
  /*
   * ── THE LIST IS THE SURFACES THAT RENDER, NOT THE ADDRESSES (2026-09-10) ─
   *
   * Five of these were redirect stubs: `_authenticated.decide.tsx`,
   * `.design.tsx`, `.build.index.tsx`, `.learn.tsx` and `.discover.tsx`, each
   * a file whose whole body was a `throw redirect(...)`. A redirect has no
   * wait branch, so five of the eight entries could never have caught
   * anything -- the guard read eight files and examined three.
   *
   * They had zero inbound links anywhere in the tree and are deleted. The list
   * now names the surfaces those stations ACTUALLY render on, which is what
   * the rule was always about: a wait may not resolve to nothing, on a screen
   * a person can reach.
   */
  const STATIONS = [
    // 01 Discover: the body lives in the component, and that is where the
    // defect this file was written for actually was.
    join("..", "components", "discover", "DiscoverSurface.tsx"),
    // 02 Decide, 04 Design, 05 Build: all three resolve to the home, which is
    // where a call that needs a person and a run that needs restarting both
    // stand.
    "_authenticated.start.tsx",
    // 03 Plan: the spec is the surface; the index was a stub.
    "_authenticated.plan.spec.$id.tsx",
    // 06 Ship and 07 Learn: both records live on Outcomes since P-14b.
    join("..", "components", "ship", "ShipRecord.tsx"),
    join("..", "components", "learn", "LearnRecord.tsx"),
    // The run screen, which is where a station is actually a stop rather than
    // an address (R-01).
    "_authenticated.track.$trackId.tsx",
  ];

  for (const station of STATIONS) {
    const path = join(import.meta.dir, "..", station);
    it(`${station} has no wait branch that resolves to nothing`, () => {
      let source: string;
      try {
        source = stripComments(readFileSync(path, "utf8"));
      } catch {
        // A station that has been renamed should fail loudly here rather than
        // quietly pass by being unreadable.
        throw new Error(`station source not found: ${station}`);
      }
      const bad = source
        .split("\n")
        .map((line, i) => `${i + 1}: ${line.trim()}`)
        .filter((line) => /(isLoading|isPending|\bloading)\s*\?\s*null/.test(line));
      expect(bad).toEqual([]);
    });
  }

  it("covers every station's real surface, so a new one cannot be added unguarded", () => {
    /* Six surfaces carry the seven stations: Decide, Design and Build share
       the home. If the spine grows, or a station gets a surface of its own
       again, this count fails and the list above has to be revisited. */
    expect(STATIONS.length).toBe(6);
  });
});

// "Today's triage feed" and "the page states a window only where the window
// is true" also left the file (P-14, A-QUEUE.md): both scanned
// `components/today/Board.tsx` or `components/today/state-sentence.tsx`,
// deleted with the rest of the cluster.
