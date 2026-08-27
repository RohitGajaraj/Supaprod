/**
 * F-123: NOT ONE DECISION IN THE DATABASE POINTS AT A SPEC.
 *
 * Measured 2026-08-27 on real (non-sample) workspaces: of 33 open specs, **3
 * carry an `opportunity_id` and ZERO have any decision pointing at them.** Every
 * `decisions.prd_id` in the product is null. So the chain the whole thing is
 * built on, a bet then the spec that serves it then the outcome that grades it,
 * is broken at its first joint on every row that exists.
 *
 * ── WHY IT WAS NEVER WRITTEN ───────────────────────────────────────────────
 * It cannot be written at Decide. `decisions.prd_id` is null by construction
 * there because Decide runs BEFORE Define, so the spec does not exist yet when
 * the bet is recorded. The link can only be closed from the other end, by the
 * station that creates the thing being pointed at, and nothing did.
 *
 * ── WHAT IT UNBLOCKS, WHICH LOOKED LIKE THREE SEPARATE PROBLEMS ────────────
 *   · `spec-gate.ts` gate 3 refuses a spec attached to no recorded bet, because
 *     nothing could grade it afterwards. Without this link it would have refused
 *     **30 of 33 real specs for a reason about our own plumbing**, and a gate
 *     that refuses honest work for its own internal reasons is worse than no
 *     gate: the refusal reads as a judgement on the work.
 *   · `learning.record` needs the decision a verdict is about, and its own
 *     comment says both existing recoveries are dead on the driver's route.
 *   · S4 measured 369 decisions with `cited_by_count` 0, max 0, and called it
 *     "the compounding half of the moat with no instance in the product's life".
 *     A decision nothing points at cannot be cited by anything.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SRC = readFileSync(fileURLToPath(new URL("./registry.server.ts", import.meta.url)), "utf8");
/** Comments stripped: the explanation names every symbol the guard asserts on. */
const CODE = SRC.split("\n")
  .filter((l) => {
    const t = l.trim();
    return !t.startsWith("*") && !t.startsWith("//") && !t.startsWith("/*");
  })
  .join("\n");

/** prd.draft's body, so a match in another tool cannot satisfy these. */
const DRAFT = (() => {
  const start = CODE.indexOf('name: "prd.draft"');
  const next = CODE.indexOf('name: "prd.revise"', start);
  expect(start, "prd.draft not found").toBeGreaterThan(-1);
  expect(next, "prd.revise not found after it").toBeGreaterThan(start);
  return CODE.slice(start, next);
})();

describe("prd.draft closes the link Decide cannot", () => {
  it("it reads the track it is running on", () => {
    expect(DRAFT).toContain("trackId");
  });

  it("finds that track's decision the same way learning.record does", () => {
    // One lookup shape for one question. A second way to find the track's
    // decision is a second way for two readers to disagree about which bet
    // this work belongs to.
    expect(DRAFT).toContain('.eq("artifact_kind", "decision")');
    expect(DRAFT).toContain('.order("created_at", { ascending: false })');
  });

  it("and writes prd_id onto it", () => {
    expect(DRAFT).toContain('.from("decisions")');
    expect(DRAFT).toContain("update({ prd_id: prd.id })");
  });
});

describe("writing the WRONG link would be worse than none", () => {
  it("only a bet that has no spec yet can be claimed", () => {
    /*
     * `.is("prd_id", null)` is the guard. Without it, a second spec drafted on
     * the same track would steal the first one's bet, and the decision would end
     * up pointing at whichever spec happened to be written last rather than at
     * the one it authorised.
     */
    expect(DRAFT).toContain('.is("prd_id", null)');
  });

  it("only on a track, because a loose spec has no bet to claim", () => {
    expect(DRAFT).toContain("if (trackId) {");
  });

  it("no rows changed is reported as a fact, not as an error and not as silence", () => {
    expect(DRAFT).toContain("already names a different spec");
  });
});

describe("a failed link never claims the spec does not exist", () => {
  it("the failures are reported in the result rather than thrown", () => {
    /*
     * The spec row is written and real by the time this runs. Throwing over a
     * missing cross-reference would tell the seat its spec does not exist when
     * it does, which is F-68 from the other side: a step reported as failed over
     * evidence that it landed.
     */
    expect(DRAFT).toContain("bet_link_note");
    expect(DRAFT).not.toContain("throw new Error(linkErr");
  });

  it("both failure paths say which one happened", () => {
    // "could not be looked up" and "could not be attached" send a person to
    // different places, and one sentence for both would send them to neither.
    expect(DRAFT).toContain("could not be looked up");
    expect(DRAFT).toContain("could not be attached to the bet it serves");
  });

  it("and the success is reported too, so the seat is not guessing", () => {
    expect(DRAFT).toContain("serves_decision_id");
  });
});

describe("what it deliberately leaves alone", () => {
  it("the existing return fields are unchanged", () => {
    // src/lib/spine/attach.ts reads `prd_id` off this result to file the spec as
    // a track member. Renaming or dropping it would silently unattach every spec.
    for (const field of ["prd_id: prd.id", "title: prd.title", "status: prd.status"]) {
      expect(DRAFT).toContain(field);
    }
  });

  it("opportunity_id still distinguishes a bet-served spec from a mid-lifecycle one", () => {
    expect(DRAFT).toContain("opportunity_id: opp?.id ?? null");
  });
});
