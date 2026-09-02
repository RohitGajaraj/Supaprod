import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * THE STATION'S PRIMARY ANSWER LEFT NO MARK ON THE STATION.
 *
 * "Keep it" was the one thing /decide existed to let a person say. What it
 * wrote to the bet was `{ roadmap_bucket: "next" }` and nothing else -- while
 * the stage event and the judgment written three lines below both claimed the
 * lane had moved.
 *
 * P-14 (A-QUEUE.md, R-34: "there are no lanes, priority is Put first")
 * deleted /decide and the client half of this file's own history with it --
 * `draftSpec.onSuccess`, `settledRef`'s skip-list and `LanePicker` all lived
 * only in that route, and their describe blocks (and the `DECIDE` source
 * read they shared) left with it. What remains is the server half:
 * `placeKeptBetInNext` (`discovery.functions.ts`) is not proven called by
 * anything today -- its one caller was /decide's own "Keep it" button --
 * flagged in P-14's own Report rather than deleted alongside the client
 * tests here, since excising a function from a shared, heavily-used lib file
 * is a more deliberate act than removing a route's own dead assertions.
 *
 * SOURCE ASSERTIONS, for the reason `the-gate-records-why.test.ts` gives: this
 * is a write behind an authenticated server function, and the thing worth
 * pinning is the WIRING rather than a mocked round trip. Each one asserts the
 * shape, never a sentence, so improving the copy does not turn this file red.
 */

const SRC = readFileSync(join(import.meta.dir, "..", "discovery.functions.ts"), "utf8");

/** The body of the one function that runs the keep, whitespace collapsed.
 *  Bounded by the function's own closing brace rather than a character count:
 *  the writes sit either side of a long docblock, and a fixed window cut the
 *  judgment call out of the slice while the test still read as passing. */
const KEEP = (() => {
  const start = SRC.indexOf("async function placeKeptBetInNext(");
  expect(start).toBeGreaterThan(-1);
  const rest = SRC.slice(start);
  const end = rest.indexOf("\n}\n");
  expect(end).toBeGreaterThan(0);
  return rest.slice(0, end).replace(/\s+/g, " ");
})();

describe("keeping a bet writes the lane into both columns", () => {
  it("puts a status in the patch, not only a roadmap bucket", () => {
    // The whole defect in one line: `patch` carried the bucket and no lifecycle
    // lane, so nothing the surface reads ever changed.
    expect(KEEP).toContain("patch.status = lane");
    expect(KEEP).toContain("roadmap_bucket: lane");
  });

  it("never overwrites a lane the record already states more strongly", () => {
    // A human who said `now` said something more specific than a keep's default
    // can, and a bet that has shipped is not waiting on a lane at all.
    expect(KEEP).toMatch(/stated === "shipped"/);
    expect(KEEP).toMatch(/stated === "now" \? "now" : "next"/);
  });

  it("files the stage event and the judgment only when the lane actually moved", () => {
    // `recordStageEvent` drops a `from === to` event on its own; `judgmentFor`
    // has no such guard, so an unguarded call on an already-`next` bet would
    // file an approval reading "from next to next" for a call nobody made.
    expect(KEEP).toContain("const laneMoved = stated !== lane");
    const stage = KEEP.slice(KEEP.indexOf("const laneMoved"));
    expect(stage).toMatch(/if \(laneMoved\) \{ await recordStageEvent\(/);
    expect(stage).toMatch(/if \(laneMoved\) \{ await recordJudgment\(/);
  });

  it("names the move it made rather than hard-coding a null prior lane", () => {
    const stage = KEEP.slice(KEEP.indexOf("const laneMoved"));
    expect(stage).toContain("from: stated");
    expect(stage).toContain("to: lane");
  });
});

// The client-side describe blocks that lived here -- "the surface that
// presses the key reads what the press reported", "the gate stops asking the
// question it just answered", "the lane control commits on settle, not on
// every key the arrows pass" -- tested /decide's own draftSpec handler,
// settledRef skip-list and LanePicker component. All three, and the DECIDE
// source read they shared, left with the route (P-14, A-QUEUE.md, R-34).
