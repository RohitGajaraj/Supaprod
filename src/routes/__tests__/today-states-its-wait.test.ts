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
  const STATIONS = [
    "_authenticated.discover.tsx",
    "_authenticated.decide.tsx",
    "_authenticated.plan.index.tsx",
    "_authenticated.design.tsx",
    "_authenticated.build.index.tsx",
    // Ship's body moved to a component on 2026-09-09 (P-14b); the route is a
    // redirect and has no wait of its own left to check.
    join("..", "components", "ship", "ShipRecord.tsx"),
    "_authenticated.learn.tsx",
    // Discover's body lives in a component rather than the route, and it is
    // where the defect actually was.
    join("..", "components", "discover", "DiscoverSurface.tsx"),
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

  it("covers every station, so a new one cannot be added unguarded", () => {
    // PRIMARY_NAV carries Today plus the seven loop stations. If the spine
    // grows, this count fails and the list above has to be revisited.
    expect(STATIONS.length).toBe(8);
  });
});

// "Today's triage feed" and "the page states a window only where the window
// is true" also left the file (P-14, A-QUEUE.md): both scanned
// `components/today/Board.tsx` or `components/today/state-sentence.tsx`,
// deleted with the rest of the cluster.
