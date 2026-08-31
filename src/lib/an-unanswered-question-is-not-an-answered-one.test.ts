import { describe, expect, it } from "bun:test";
import { narrowHandoff, stringList, type HandoffRow } from "@/lib/handoff-fields";

/**
 * ABSENT AND EMPTY ARE DIFFERENT ANSWERS (S1's #29, 2026-08-31).
 *
 * `SPEC-STATION-MODEL-AND-ARTIFACTS.md` §2.1 rules that an empty *Open
 * questions* is **a defect, not a clean bill**, and §4.3 makes it the primary
 * human touchpoint of the product. Measured across all 143 handoffs on the
 * record: **3 carry an `open_questions` key at all** — two filled, one empty —
 * and **13 carry `constraints`, all filled.**
 *
 * So 140 do not claim emptiness; they say nothing. Collapsing those into `[]`
 * would turn 140 silences into 140 clean bills on the one field the spec calls
 * the touchpoint. Same law as F-76 (a failed read and an empty result are
 * different values) and as the schema rule adopted from S1 the same day: never
 * let a default stand in for an answer.
 */
const ROW: HandoffRow = {
  id: "a",
  created_at: "2026-08-31T00:00:00Z",
  from_agent_slug: "strategist",
  to_agent_slug: "critic",
  payload: { task: "t" },
  consumed_by_run_id: null,
};

describe("an unanswered question is not an answered one", () => {
  it("keeps a missing field and an empty list apart", () => {
    expect(narrowHandoff(ROW).openQuestions).toBe(null);
    expect(narrowHandoff({ ...ROW, payload: { open_questions: [] } }).openQuestions).toEqual([]);
  });

  it("reads a field that is present but not a list as absent, never as none", () => {
    // A writer defect. Reporting it as "the station filed none" would hide the
    // one thing worth knowing, which is that something wrote the wrong shape.
    expect(stringList("not a list")).toBe(null);
    expect(stringList({ 0: "a" })).toBe(null);
    expect(stringList(undefined)).toBe(null);
  });

  it("drops members it cannot render rather than stringifying them", () => {
    // The failure this narrowing exists to prevent is `[object Object]` on a
    // surface. A list that loses a malformed member is still an honest list of
    // what could be read; a list that renders one is not.
    expect(stringList(["a", { b: 1 }, 2, null, "  ", "c"])).toEqual(["a", "c"]);
  });

  it("treats a payload that is not an object as unfiled, not as empty", () => {
    for (const payload of [null, "nope", 7]) {
      const out = narrowHandoff({ ...ROW, payload });
      expect(out.openQuestions).toBe(null);
      expect(out.constraints).toBe(null);
      expect(out.task).toBe(null);
    }
  });

  it("reports whether a run has read the handoff", () => {
    // The loop's own evidence that a hop landed, which is what lets a surface
    // say "not picked up yet" instead of guessing.
    expect(narrowHandoff(ROW).pickedUp).toBe(false);
    expect(narrowHandoff({ ...ROW, consumed_by_run_id: "r" }).pickedUp).toBe(true);
  });
});
