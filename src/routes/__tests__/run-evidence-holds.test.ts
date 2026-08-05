import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * THE RUN'S EVIDENCE MAY NOT ERASE ITSELF.
 *
 * THE DEFECT THIS EXISTS TO KILL, found 2026-08-05. The run surface paints its
 * body from `getStudioSession` and its seven-stage strip from `getRunStages`,
 * and the second query lands roughly a second after the first. Two lines then
 * conspired:
 *
 *   `const stage = pickedStage ?? stagesQ.data?.focus ?? "build"` read the
 *   server's focus straight through on every render, and `getRunStages` puts
 *   focus on ship or learn for any merged changeset, which is every successful
 *   run.
 *
 *   The work region was one ternary whose FALSE branch held the whole Build
 *   body, so the moment focus moved off build the ledger, the steer box and the
 *   diff were unmounted.
 *
 * Net effect: you opened a finished run, read its proof for about a second, and
 * watched it delete itself with no message and nothing you did to cause it. The
 * 8s refetch could do it again while you read.
 *
 * WHY IT IS WORTH A BUILD-FAILING TEST rather than a review note. This is the
 * ratchet (docs/conventions/surface-discipline.md §0.1) at its sharpest: the
 * diff and the ledger ARE the reason the page exists, and both regressions are
 * the kind that typecheck perfectly and read as tidy in a diff. "Follow the
 * server's focus" and "one ternary, one region" are both things a person would
 * reintroduce believing they were simplifying.
 *
 * THE TWO LINES THIS DRAWS, and neither is about the copy on the panel:
 *   1. The stage the region shows is never read straight out of the query. An
 *      arriving or refetching server value may not move the region under
 *      someone; it is latched once and the latch is what the region follows.
 *   2. A non-Build stage ADDS a panel. The conditional that renders it must
 *      terminate in `null`, so the run body can never be its alternative.
 *
 * Modelled on no-fabricated-agent-steps.test.ts: scan source as TEXT and strip
 * comments first, because the fixed file legitimately describes the banned
 * shapes in prose in order to ban them.
 */

const ROUTE = join(import.meta.dir, "..", "_authenticated.runs.$missionId.tsx");

/** Strip comments so prose that NAMES the banned shape does not trip it. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

const src = stripComments(readFileSync(ROUTE, "utf8"));

describe("the run surface never takes back what it already showed", () => {
  it("resolves the shown stage from a latch, not from the live query result", () => {
    const m = /const stage:\s*AgentStation\s*=\s*([^;]+);/.exec(src);
    expect(m).not.toBeNull();
    const expr = m![1];
    // Naming the query here is exactly the defect: it re-reads on every render,
    // so a late arrival and every later refetch both move the region.
    expect(expr).not.toContain("stagesQ");
    expect(expr).not.toContain("data?.focus");
    // And "build" stays the fallback, so the region holds the body already on
    // screen for as long as the stages query has not settled.
    expect(expr).toContain('"build"');
  });

  it("adds a stage panel above the run body instead of replacing it", () => {
    const gate = src.indexOf('stage !== "build"');
    expect(gate).toBeGreaterThan(-1);

    const tail = src.slice(gate);
    // Anchored to its own line so it is the JSX conditional closing, not a
    // `? … : null` inside a prop. StagePanel's own `error` prop ends in
    // `: null}` and matched an unanchored pattern, which made an earlier draft
    // of this guard pass against the very code it was written to reject.
    const close = /^[ \t]*\)\s*:\s*null\}[ \t]*$/m.exec(tail);
    // No `null` alternative means something else is being rendered instead of
    // the body, which is the regression.
    expect(close).not.toBeNull();

    const branch = tail.slice(0, close!.index);
    expect(branch).toContain("<StagePanel");

    // The proof of the run sits outside that conditional, after it has closed,
    // so it is on screen whichever stage the strip is pointing at.
    const afterConditional = gate + close!.index;
    for (const marker of ['title="What happened, in order"', 'title="What it produced"']) {
      const at = src.indexOf(marker);
      expect(at).toBeGreaterThan(afterConditional);
    }
  });
});
