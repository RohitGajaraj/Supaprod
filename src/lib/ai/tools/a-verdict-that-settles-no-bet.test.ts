/**
 * F-65. THE FORECAST AND ITS OUTCOME HAVE NEVER BEEN JOINED.
 *
 * `learnings.decision_id` has existed as a column since the table did. Measured
 * in production on 2026-08-25: **133 learnings, `decision_id` NULL on all 133.**
 * Nothing has ever written it, because `learning.record` — the only tool that
 * can produce a learning, and the only way the Learn station arrives — had no
 * such argument.
 *
 * **THIS IS THE PRODUCT'S OWN CLAIM, UNWIRED.** The forecast is written at
 * Decide and nowhere else. The verdict is written at Learn. Everything this
 * product says about itself lives in the join between them: *what a team
 * believed would happen, recorded before the outcome was known.* A verdict that
 * attaches to a spec but not to the bet it settles cannot answer "were we
 * right?", and that is the only question the brain exists to answer.
 *
 * It was invisible because every station looked correct in isolation: Decide
 * files a real forecast, Learn files a real verdict, and no test asked whether
 * anything pointed one at the other.
 */
import { describe, expect, it } from "bun:test";

import { TOOL_REGISTRY } from "@/lib/ai/tools/registry.server";

const learningRecord = TOOL_REGISTRY["learning.record"];

describe("learning.record can attach a verdict to the bet it settles", () => {
  const shape = (learningRecord.argsSchema as { shape?: Record<string, unknown> }).shape ?? {};

  it("accepts a decision_id", () => {
    expect(Object.keys(shape)).toContain("decision_id");
  });

  /**
   * OPTIONAL, not required, and that is deliberate rather than lax. Required
   * would make the tool uncallable on the path that matters most — a track whose
   * Decide station was waived carries no decision at all (F-61's `3fbf73c9` is
   * exactly that shape), and forcing an id there would either block the station
   * or invite the agent to invent one. An invented link is worse than none: it
   * re-grades a bet nobody made.
   */
  it("keeps it optional, because a waived Decide leaves no bet to point at", () => {
    const parsed = learningRecord.argsSchema.safeParse({
      summary: "The digest cut muted alerts to 9%.",
      verdict: "validated",
    });
    expect(parsed.success).toBe(true);
  });

  it("still refuses a verdict outside the three that exist", () => {
    const parsed = learningRecord.argsSchema.safeParse({
      summary: "Partly worked.",
      verdict: "deferred",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects a decision_id that is not a uuid, rather than storing a dangling string", () => {
    const parsed = learningRecord.argsSchema.safeParse({
      summary: "x",
      verdict: "mixed",
      decision_id: "the-one-from-tuesday",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("the link is resolved, not merely accepted", () => {
  const src = learningRecord.run.toString();

  /**
   * An argument alone would fix nothing: the agent has to remember to pass it,
   * and the 133 orphaned rows are what "the agent will remember" looks like. The
   * resolution chain is the actual fix — the same one `prd_id` already uses, in
   * the same order of trust.
   */
  it("falls back to the mission, then the track, when the agent names none", () => {
    expect(src).toContain("resolvedDecisionId");
    expect(src).toMatch(/artifact_kind[^\n]*decision/);
  });

  it("writes the RESOLVED id, never the raw argument", () => {
    expect(src).toContain("decision_id: resolvedDecisionId");
  });

  /**
   * Left NULL when nothing resolves. The failure direction matters: a verdict
   * attached to the WRONG decision re-ranks a bet nobody made here and compounds
   * into later guidance, which is the harm the tool's own description warns
   * about — "a wrong confident verdict is not a wrong row, it is wrong advice
   * for months".
   */
  it("fails to NULL rather than to a guess", () => {
    // Matched loosely on purpose: the assertion is that the seed is the AGENT'S
    // argument defaulting to null, not the exact formatting a bundler may change.
    expect(src).toMatch(/resolvedDecisionId[\s\S]{0,60}decision_id[\s\S]{0,20}null/);
    expect(src).not.toMatch(/resolvedDecisionId\s*=\s*["'`]/);
  });
});
