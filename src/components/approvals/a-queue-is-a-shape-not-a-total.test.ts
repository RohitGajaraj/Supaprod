/**
 * The served Helio Labs approvals page said "66 decisions are ready for you"
 * and, one region below, "65 pieces of work are stopped, waiting on you" -- the
 * same rows, the second being the first minus the card already open. A visitor
 * totals them and reads 131. These guards hold both halves of the fix.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { queueShape, shapeSentence } from "./a-queue-is-a-shape-not-a-total";
import type { ApprovalKind } from "@/lib/approvals-queue.functions";

/** The live population, read from production 2026-09-03 (sums to 66). */
const HELIO: ApprovalKind[] = [
  ...Array<ApprovalKind>(35).fill("design_gate"),
  ...Array<ApprovalKind>(10).fill("assumption_challenge"),
  ...Array<ApprovalKind>(8).fill("decision"),
  ...Array<ApprovalKind>(4).fill("tool_call"),
  ...Array<ApprovalKind>(4).fill("house_rule"),
  ...Array<ApprovalKind>(3).fill("opportunity"),
  ...Array<ApprovalKind>(2).fill("memory_candidate"),
];

describe("a queue is a shape, not a total", () => {
  it("turns the served 66 into the shape a person can start on", () => {
    expect(shapeSentence(queueShape(HELIO), false)).toBe(
      "35 design gates, 10 assumption challenges, 8 decisions, 4 agent actions, " +
        "4 house rules, 3 opportunities and 2 memory notes waiting for you.",
    );
  });

  it("names every family and omits the empty ones", () => {
    const shape = queueShape(HELIO);
    expect(shape.length).toBe(7);
    // spec, playbook_proposal and trust_graduation are zero on this workspace
    // and must not appear as "0 specs".
    for (const f of shape) expect(f.n).toBeGreaterThan(0);
    // Not `not.toContain("0 ")`, which "10 assumption challenges" satisfies.
    for (const f of shape) expect(f.label).not.toStartWith("0 ");
  });

  it("orders largest first, and breaks ties stably so it cannot reshuffle", () => {
    const tied: ApprovalKind[] = ["spec", "spec", "decision", "decision", "tool_call"];
    const a = queueShape(tied).map((f) => f.kind);
    const b = queueShape([...tied].reverse()).map((f) => f.kind);
    expect(a).toEqual(b);
    expect(a[0]).toBe("decision"); // ties on 2 break alphabetically
    expect(queueShape(HELIO)[0]?.kind).toBe("design_gate");
  });

  it("says the total ONLY as the sum of what it names", () => {
    // The number a person cannot act on is what goes; every row is still on
    // screen inside a family it can be acted on through.
    const shape = queueShape(HELIO);
    expect(shape.reduce((t, f) => t + f.n, 0)).toBe(66);
    expect(shapeSentence(shape, false)).not.toContain("66");
  });

  it("keeps the floor when a family read was capped", () => {
    expect(shapeSentence(queueShape(HELIO), true)).toStartWith("At least 35 design gates");
  });

  it("gets the singular right, on its own and in a list", () => {
    expect(shapeSentence(queueShape(["decision"]), false)).toBe("1 decision waiting for you.");
    expect(shapeSentence(queueShape(["decision", "spec", "spec"]), false)).toBe(
      "2 specs and 1 decision waiting for you.",
    );
  });

  it("counts an unmapped family rather than dropping it", () => {
    // A family reaching this page before this file does. Silently omitting one
    // is the defect `design_gate` already shipped once, invisible for weeks.
    const shape = queueShape(["a-new-kind" as ApprovalKind, "a-new-kind" as ApprovalKind]);
    expect(shape[0]?.n).toBe(2);
    expect(shape[0]?.label).toBe("2 items");
  });

  it("says nothing at all when there is nothing, so the zero branch still owns it", () => {
    expect(shapeSentence(queueShape([]), false)).toBe("");
  });
});

describe("the page states its obligation once", () => {
  const ROUTE = readFileSync("src/routes/_authenticated.approvals.tsx", "utf8");
  const STALLED = readFileSync("src/components/meridian/StalledWork.tsx", "utf8");
  const HEADING = STALLED.slice(STALLED.indexOf("<h2"), STALLED.indexOf("</h2>"));

  /*
   * COMMENTS ARE NOT CODE, and the first draft of this file failed on that: the
   * "no old sentence" guard matched the comment that QUOTES the old sentence to
   * explain why it went. A guard that a correct fix cannot pass is worse than
   * no guard, because the way to make it pass is to delete the explanation.
   */
  const code = (src: string): string =>
    src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const ROUTE_CODE = code(ROUTE);

  it("removes the second count from the same population", () => {
    // `waitingOnPerson` is `rest`, the queue minus the focused card, so any
    // sentence built from its length restates the heading minus one.
    expect(code(STALLED)).not.toContain("pieces of work are stopped, waiting on you");
    expect(code(STALLED)).not.toContain("One piece of work is stopped, waiting on you");
    // Proves the stripper left the component behind rather than emptying it.
    expect(code(STALLED)).toContain("export function StalledWork");
    // The defect is RENDERING the count, not consulting it: `length === 0`
    // chooses a branch and puts no number on screen, which is why the guard
    // names the interpolations rather than the identifier.
    expect(code(HEADING)).not.toContain("{waitingOnPerson.length}");
    expect(code(HEADING)).not.toContain("${waitingOnPerson.length}");
    expect(code(HEADING)).not.toMatch(/\{\s*waitingOnPerson\.length\s*\}/);
  });

  it("keeps what only StalledWork holds: the oldest wait, and the row list", () => {
    expect(code(HEADING)).toContain("The oldest has been stopped for");
    expect(HEADING).toContain("stoppedFor(oldest.since, now)");
    expect(STALLED).toContain("Work is stopped, and none of it is waiting on you.");
    // Every row undated is a real state and must not print an invented age.
    expect(STALLED).toContain("Work is stopped, and nothing here says how long.");
  });

  it("leaves the heading as the one place a count is stated", () => {
    // Proves the stripper above did not simply eat the file, which would make
    // the second assertion pass vacuously.
    expect(ROUTE_CODE).toContain(
      "shapeSentence(queueShape(visibleItems.map((i) => i.kindKey)), floor)",
    );
    expect(ROUTE_CODE).not.toContain("decisions are ready for you.");
    // And the comment explaining the change is still there to be read.
    expect(ROUTE).toContain("A SHAPE, NOT A TOTAL");
  });

  it("keeps the failed-read and floor guards the heading already had", () => {
    // A failed read must never fall through to "Nothing is ready for you."
    expect(ROUTE_CODE).toContain("queue.isError");
    expect(ROUTE_CODE).toContain('"Nothing is ready for you."');
    expect(ROUTE_CODE).toContain("countIsAFloor(gaps)");
  });
});
