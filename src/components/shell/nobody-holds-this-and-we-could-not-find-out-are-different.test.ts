/**
 * THE TWO STATES THIS MODULE EXISTS TO KEEP APART.
 *
 * *"Nobody holds this object"* and *"we could not find out whether anybody
 * holds it"* are the same empty collection and the same silence on screen, and
 * only one of them is safe to act on. Every test below is ultimately about that
 * one distinction.
 *
 * **It is not hypothetical in this lane.** `getWorkspaceAnchors` swallows a
 * failed `agent_runs` read and returns an empty result rather than throwing, so
 * `isError` stays false and one branch is reached by both meanings. The rail
 * crew's quiet state had to become a door rather than a sentence because of it.
 * This file makes the same mistake fail a test instead of shipping.
 *
 * **What these tests do NOT prove:** that anything renders. `claim` has zero
 * rows ever, so the surface is empty until S0's writer lands. That is stated in
 * the module and in my log rather than dressed up as a driven unit.
 */
import { describe, expect, it } from "bun:test";
import {
  claimLine,
  claimsUnknown,
  heldBy,
  indexClaims,
  UNKNOWN_HOLDER,
  type ClaimRow,
} from "./claim-check";

const DECISION = "663c7376-f79f-4691-8be1-ec54f497dc99";
const NOW = Date.parse("2026-08-31T20:00:00Z");

function claim(over: Partial<ClaimRow> = {}): ClaimRow {
  return {
    id: "c-1",
    fromAgentSlug: "data-analyst",
    runId: "run-1",
    targetKind: "row:decision",
    targetId: DECISION,
    createdAt: "2026-08-31T19:59:00Z",
    ...over,
  };
}

describe("a read that did not answer is not a workspace where nobody claimed anything", () => {
  it("refuses to index an absent read", () => {
    const i = indexClaims(undefined);
    expect(i.known).toBe(false);
    if (!i.known) expect(i.why).toContain("has not answered");
  });

  it("hands UNKNOWN through to the caller instead of an empty list", () => {
    /* The whole point. An empty array here would be indistinguishable from
       "free" at every call site, and the call site is a control that TAKES
       something. */
    const held = heldBy(
      claimsUnknown("the backend refused"),
      { targetKind: "row", targetId: DECISION },
      null,
    );
    expect(held).toBe(UNKNOWN_HOLDER);
  });

  it("SPEAKS when it does not know, because silence beside a take control reads as permission", () => {
    expect(claimLine(UNKNOWN_HOLDER)).toBe("We could not check whether anyone has this.");
    // ...and says nothing at all only when the object is genuinely free.
    expect(claimLine([])).toBeNull();
  });

  it("an empty list of rows IS an answer, and a different one from no rows at all", () => {
    const i = indexClaims([]);
    expect(i.known).toBe(true);
    expect(heldBy(i, { targetKind: "row:decision", targetId: DECISION }, null)).toEqual([]);
  });
});

describe("a run never collides with itself", () => {
  it("does not report my own claim back to me", () => {
    /* §3's rule, and the same one `collisionsFrom` applies a layer down. A run
       re-reading an object it already took is not contention, and marking it
       would fire on the most common case there is. */
    const i = indexClaims([claim({ runId: "run-1" })], NOW);
    expect(heldBy(i, { targetKind: "row:decision", targetId: DECISION }, "run-1")).toEqual([]);
  });

  it("still reports a DIFFERENT run on the same object", () => {
    const i = indexClaims([claim({ runId: "run-2", fromAgentSlug: "insight-keeper" })], NOW);
    const held = heldBy(i, { targetKind: "row:decision", targetId: DECISION }, "run-1");
    expect(held).toHaveLength(1);
    expect(held !== UNKNOWN_HOLDER && held[0]!.agentSlug).toBe("insight-keeper");
  });
});

describe("the object key is the one already on screen, not a second copy of it", () => {
  it("treats `row:prd` and bare `row` over one uuid as ONE object", () => {
    /* A-006's rule, reached through the imported `groupKeyOf`. Re-deriving it
       here would make a second copy of a rule that has already produced one
       wrong all-clear, which is exactly why it was exported. */
    const i = indexClaims([claim({ targetKind: "row:prd", targetId: DECISION })], NOW);
    const held = heldBy(i, { targetKind: "row", targetId: DECISION }, null);
    expect(held).toHaveLength(1);
  });

  it("keeps two different objects apart", () => {
    const other = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    const i = indexClaims([claim()], NOW);
    expect(heldBy(i, { targetKind: "row:decision", targetId: other }, null)).toEqual([]);
  });

  it("does not confuse a file path with a row id", () => {
    const i = indexClaims([claim({ targetKind: "file", targetId: "src/app.ts" })], NOW);
    expect(heldBy(i, { targetKind: "file", targetId: "src/app.ts" }, null)).toHaveLength(1);
    expect(heldBy(i, { targetKind: "row", targetId: "src/app.ts" }, null)).toEqual([]);
  });
});

describe("the clock is the row's, never ours", () => {
  it("drops a claim past its own expiry", () => {
    const i = indexClaims([claim({ expiresAt: "2026-08-31T19:00:00Z" })], NOW);
    expect(heldBy(i, { targetKind: "row:decision", targetId: DECISION }, null)).toEqual([]);
  });

  it("keeps a claim with no expiry rather than inventing a timeout", () => {
    /* `presence-trace.ts` settled this one layer down: a lifetime we start is a
       lifetime that lies when the tab was closed. If a crashed run should
       release its object, the WRITER stamps that; this reader does not guess. */
    const i = indexClaims([claim({ expiresAt: null })], NOW);
    expect(heldBy(i, { targetKind: "row:decision", targetId: DECISION }, null)).toHaveLength(1);
  });

  it("does not free an object because of a typo in its timestamp", () => {
    /* An unreadable stamp is not an expired claim. Dropping it would quietly
       release something somebody is holding - the exact failure this module
       exists to prevent, arriving through a malformed string. */
    const i = indexClaims([claim({ expiresAt: "not a date" })], NOW);
    expect(heldBy(i, { targetKind: "row:decision", targetId: DECISION }, null)).toHaveLength(1);
  });
});

describe("a row we cannot place is absent, never counted as free", () => {
  it("skips a claim that names no object", () => {
    const i = indexClaims([claim({ targetId: "" }), claim({ id: "c-2", targetKind: "" })], NOW);
    expect(i.known).toBe(true);
    if (i.known) expect(i.byObject.size).toBe(0);
  });
});

describe("the sentence a person reads", () => {
  const holder = (slug: string) => ({ agentSlug: slug, runId: "r", since: "2026-08-31T19:59:00Z" });

  it("names one holder", () => {
    expect(claimLine([holder("data-analyst")])).toBe("data-analyst has this.");
  });

  it("names both at two, because the reader's next question is WHICH", () => {
    expect(claimLine([holder("data-analyst"), holder("insight-keeper")])).toBe(
      "data-analyst and insight-keeper both have this.",
    );
  });

  it("counts past two, because a list that wraps is worse than a number", () => {
    expect(claimLine([holder("a"), holder("b"), holder("c")])).toBe("3 teammates have this.");
  });

  it("falls back to a person-shaped word when the holder cannot be named", () => {
    expect(claimLine([{ agentSlug: null, runId: "r", since: "2026-08-31T19:59:00Z" }])).toBe(
      "A teammate has this.",
    );
  });
});

describe("today's database, stated rather than implied", () => {
  it("returns nobody for every object, because `claim` has zero rows ever", () => {
    /* Measured 2026-08-31 service-role: agent_messages holds handoff 143,
       kickoff 14, steer 4 - three of the seven types in the spec, and `claim`
       is not one of them. This test is here so the emptiness is a RECORDED
       state of the product rather than something a later reader mistakes for a
       broken module. */
    const i = indexClaims([], NOW);
    expect(heldBy(i, { targetKind: "row:decision", targetId: DECISION }, null)).toEqual([]);
    expect(claimLine([])).toBeNull();
  });
});
