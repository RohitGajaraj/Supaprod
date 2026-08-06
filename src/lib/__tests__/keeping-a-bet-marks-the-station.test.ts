import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * THE STATION'S PRIMARY ANSWER LEFT NO MARK ON THE STATION.
 *
 * "Keep it" is the one thing /decide exists to let a person say. What it wrote
 * to the bet was `{ roadmap_bucket: "next" }` and nothing else -- while the
 * stage event and the judgment written three lines below both claimed the lane
 * had moved. Every place /decide shows a placement reads `status`: the lane
 * control's value, the queue row's `StatusPill`, and `verdictFor`. So a person
 * kept a bet, came back, and found it still ranked #1 with its pill reading
 * Backlog, its verdict reading "not reviewed yet", and its primary button still
 * reading "Keep it".
 *
 * The client half was the same defect from the other end: `draftSpec.onSuccess`
 * invalidated nothing at all, so even a correct write could not reach the
 * screen, and it read `r.prd.id` alone out of a result carrying `placement` and
 * `existing` -- the two fields that say whether the bet actually reached Plan.
 *
 * SOURCE ASSERTIONS, for the reason `the-gate-records-why.test.ts` gives: these
 * are writes behind an authenticated server function and a React Query cache,
 * and the thing worth pinning is the WIRING rather than a mocked round trip.
 * Each one asserts the shape, never a sentence, so improving the copy does not
 * turn this file red.
 */

const SRC = readFileSync(join(import.meta.dir, "..", "discovery.functions.ts"), "utf8");
const DECIDE = readFileSync(
  join(import.meta.dir, "..", "..", "routes", "_authenticated.decide.tsx"),
  "utf8",
);

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

describe("the surface that presses the key reads what the press reported", () => {
  /** `draftSpec`'s success handler, whitespace collapsed. */
  const onSuccess = (() => {
    const start = DECIDE.indexOf("const draftSpec = useMutation(");
    expect(start).toBeGreaterThan(-1);
    const body = DECIDE.slice(start, start + 4000);
    return body.slice(body.indexOf("onSuccess:")).replace(/\s+/g, " ");
  })();

  it("drops the caches that hold the two columns the keep just wrote", () => {
    // Without these the queue keeps serving the pre-keep row and /plan's board
    // keeps serving the lane the bet was in before the press.
    expect(onSuccess).toContain('queryKey: ["opportunities"]');
    expect(onSuccess).toContain('queryKey: ["roadmap"]');
  });

  it("reads the placement report instead of throwing it away", () => {
    // `generatePrd` returns `{ prd, existing, placement }` and `placement`
    // carries a written sentence for the refused case. /decide is the only
    // caller that passes an opportunity_id, so nobody else can surface it.
    expect(onSuccess).toMatch(/r\.placement/);
    expect(onSuccess).toMatch(/r\.existing/);
  });

  it("still arrives at the spec it wrote", () => {
    // The ratchet: the report is added, the navigation is not taken away.
    expect(onSuccess).toContain('to: "/plan/spec/$id"');
  });
});

describe("the gate stops asking the question it just answered", () => {
  it("skips a bet this session settled when it picks what to ask about", () => {
    // Nothing removes a settled bet from the ranking and the comparator cannot:
    // ICE is its first term and dropping a bet does not change ICE, so the
    // highest-scoring bet stayed at rank #1 after it was killed.
    expect(DECIDE).toContain("settledRef");
    expect(DECIDE).toMatch(/ranked\.find\(\(r\) => !settledIds\.has\(r\.opp\.id\)/);
  });

  it("falls back to the whole queue once every bet has been settled", () => {
    // A skip list, not a filter: the station must not empty itself.
    const memo = DECIDE.slice(DECIDE.indexOf("const active = React.useMemo(")).slice(0, 700);
    expect(memo).toMatch(/ranked\.find\(\(r\) => !r\.opp\.is_sample\) \?\?\s*ranked\[0\]/);
  });

  it("does not send the reader to Today for a teardown Today cannot show", () => {
    // `runCritic` writes `critic_review` on the bet's own row and nothing on
    // Today reads it. The teardown lands here, in this page's context column.
    //
    // ASSERTED ON THE HANDLER, NOT ON THE FILE: the sentence that used to ship
    // is quoted verbatim in the comment that replaced it, so a file-wide
    // `not.toContain` would go red on the very note explaining the fix.
    const start = DECIDE.indexOf("const challenge = useMutation(");
    expect(start).toBeGreaterThan(-1);
    const body = DECIDE.slice(start, DECIDE.indexOf("const draftSpec = useMutation("));
    const handler = body.slice(body.indexOf("onSuccess:")).replace(/\s+/g, " ");
    // A receipt, which stays beside the teardown it points at, rather than a
    // toast that confirms the click and vanishes.
    expect(handler).toContain("setReceipt(");
    expect(handler).not.toMatch(/toast\(`/);
    // And it names the record it landed on, which is the thing the old copy
    // got wrong.
    expect(handler).toContain("are on the record");
  });
});

describe("the lane control commits on settle, not on every key the arrows pass", () => {
  it("goes through the picker rather than straight to the mutation", () => {
    // `Choices` fires onPick on every arrow and on a click of the option that
    // is already on, and every one of those reached `recordJudgment`.
    expect(DECIDE).toContain("<LanePicker");
    expect(DECIDE).not.toMatch(/onPick=\{\(status\) => setStatus\.mutate\(/);
  });

  it("refuses a write that would name the lane the bet is already in", () => {
    const picker = DECIDE.slice(DECIDE.indexOf("function LanePicker(")).slice(0, 3000);
    expect(picker.replace(/\s+/g, " ")).toContain("if (next === latest.current.stored) return");
  });

  it("keeps the keyboard live, which is the constraint the debounce exists to respect", () => {
    // A radio group that disables itself mid-decision throws focus to the body
    // and loses the arrow keys, which is the worse failure.
    const picker = DECIDE.slice(DECIDE.indexOf("function LanePicker(")).slice(0, 3000);
    expect(picker).not.toMatch(/<Choices[^>]*disabled/);
  });
});
