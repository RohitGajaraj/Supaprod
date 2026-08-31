/**
 * A BRIEF MUST NAME A TOOL THAT ACCEPTS ITS STATION'S ARTIFACT — F-168.
 *
 * Decide's critic seat was briefed *"Call critic.evaluate on the decision."*
 * `critic.evaluate` takes `target_kind: z.enum(["opportunity", "prd"])` and its
 * implementation selects from the `opportunities` or `prds` table. **So the one
 * station whose entire output IS a decision was told to red-team it with the one
 * tool that refuses one.**
 *
 * It survived because the sentence's SECOND half was right — `decision.revise`
 * exists and does what it says. **A brief that is half correct reads as
 * reasonable**, and that is the whole reason nobody caught it.
 *
 * Cost, measured on the first clean acceptance candidate this product has ever
 * had (S4-172, track `d2263583`): seven sweep drives, zero presses, 611,844
 * tokens with 261,771 at Decide alone, three contradictory attempts, dead at
 * station two holding `nothing-to-hand-on` — while having produced six decisions
 * that each carried a forecast.
 */
import { describe, expect, it } from "bun:test";

import { CREW_ROLE } from "./driver";
import { TOOL_REGISTRY } from "@/lib/ai/tools/registry.server";

/** Every tool name a seat brief mentions, as `tool.name` shaped tokens. */
const toolsNamedIn = (text: string): string[] =>
  [...text.matchAll(/\b([a-z][a-z0-9]*(?:\.[a-z][a-z0-9_]*)+)\b/g)]
    .map((m) => m[1])
    .filter((t) => t in TOOL_REGISTRY);

describe("F-168 · the Decide critic names a tool that can take a decision", () => {
  const critic = (CREW_ROLE as Record<string, { job: string; file: string }>).critic;

  it("does NOT name critic.evaluate, which refuses a decision outright", () => {
    expect(critic.file).not.toContain("Call critic.evaluate");
    // It may still MENTION it — the brief now warns the seat off it by name,
    // which is the F-153 lesson: name the thing and say what it costs.
    expect(critic.file).toContain("Do NOT call critic.evaluate");
  });

  it("names decision.revise, which does accept one", () => {
    expect(critic.file).toContain("decision.revise");
    expect(TOOL_REGISTRY["decision.revise"]).toBeDefined();
  });

  it("and it says WHY, so the seat does not try it anyway", () => {
    // The critic's own output on the failed run explained the refusal to itself.
    // A brief that only forbids invites the seat to relitigate it every attempt.
    expect(critic.file.toLowerCase()).toContain("refuses a decision");
  });
});

describe("F-168 · and the collision stays visible if anyone widens the tool", () => {
  it("critic.evaluate still does NOT accept a decision — if this fails, revisit the brief", () => {
    /*
     * Deliberately asserted rather than assumed. Widening `critic.evaluate` to
     * take a decision is a real and defensible feature -- it would need a
     * `decisions` branch, a decision-shaped prompt and a persistence path -- and
     * the day somebody builds it, THIS test fails and points them at the brief
     * that was written around its absence. Same shape as F-152's exemption
     * guard: keep the reason for a workaround visible, so the workaround dies
     * with the reason.
     */
    const desc = TOOL_REGISTRY["critic.evaluate"]?.description ?? "";
    expect(desc).toContain("opportunity or PRD");
    expect(desc.toLowerCase()).not.toContain("decision or");
  });

  it("every tool a seat brief names actually exists in the registry", () => {
    // The weaker guard, kept because it is free: it would NOT have caught F-168
    // (critic.evaluate exists), and saying so here stops it being mistaken for
    // the protection.
    for (const [seat, brief] of Object.entries(
      CREW_ROLE as Record<string, { job: string; file: string }>,
    )) {
      for (const tool of toolsNamedIn(brief.file)) {
        expect(TOOL_REGISTRY[tool], `${seat} names ${tool}`).toBeDefined();
      }
    }
  });
});
