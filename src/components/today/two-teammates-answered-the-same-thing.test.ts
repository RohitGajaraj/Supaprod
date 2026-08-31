/**
 * THE CASE IS REAL, AND IT IS THE WHOLE CORPUS.
 *
 * The first test below is not a fixture. It is the only two non-sample
 * `learnings` rows this product has ever recorded, read service-role on
 * 2026-08-31:
 *
 *   data-analyst    19:40:19  decision 663c7376  missed  "Spec required ≤5%…"
 *   insight-keeper  19:40:45  decision 663c7376  missed  "Spec required ≤5%…"
 *
 * **Two of two. A 100% duplication rate across every real learning that
 * exists** (F-158), twenty-six seconds apart, neither knowing the other had.
 * `SPEC-AGENT-COMMS` §3 defines `claim` to prevent exactly this, and `claim` has
 * zero rows ever — so detection is the half that can be true today.
 */
import { describe, expect, it } from "bun:test";
import { repeatedOutput, repeatedOutputLine, subjectOf, type OutputRow } from "./duplicate-output";

const DECISION = "663c7376-f79f-4691-8be1-ec54f497dc99";
const CLAIM = "Spec required <=5% abandonment on tablet address re-confirmation";

/** The two real rows, as `listLearnings` would hand them over. */
const F158: OutputRow[] = [
  {
    id: "l-1",
    recordedBy: "data-analyst",
    createdAt: "2026-08-25T19:40:19Z",
    subjectId: DECISION,
    subjectClaim: CLAIM,
    verdict: "missed",
  },
  {
    id: "l-2",
    recordedBy: "insight-keeper",
    createdAt: "2026-08-25T19:40:45Z",
    subjectId: DECISION,
    subjectClaim: CLAIM,
    verdict: "missed",
  },
];

describe("the real case, F-158", () => {
  it("finds it, names both teammates, and measures the gap", () => {
    const out = repeatedOutput(F158);
    expect(out).toHaveLength(1);
    expect(out[0]!.agents).toEqual(["data-analyst", "insight-keeper"]);
    expect(out[0]!.secondsApart).toBe(26);
    expect(out[0]!.sameVerdict).toBe(true);
  });

  it("says it in one sentence a person would say out loud", () => {
    expect(repeatedOutputLine(repeatedOutput(F158))).toBe(
      "Two teammates answered the same thing 26s apart.",
    );
  });

  it("still finds it when the payload carries no decision_id", () => {
    /* `listLearnings` does not select `decision_id` today - it selects the
       embedded `decision:decisions(forecast_claim)`. Two learnings on one
       decision carry the identical claim string because it is the same row's
       field, so the fallback is a key borrowed from the SUBJECT rather than a
       similarity judgement about the artifacts. */
    const noId = F158.map((r) => ({ ...r, subjectId: null }));
    expect(repeatedOutput(noId)).toHaveLength(1);
    expect(subjectOf(noId[0]!)).toBe(`claim:${CLAIM}`);
  });
});

describe("what is deliberately NOT grouped", () => {
  it("never groups on the artifact's own summary", () => {
    /* Two genuinely separate findings worded alike are not one finding. A mark
       that fires where nothing is shared is how this kind of surface dies -
       `collision.ts` names that failure, and my own earlier note said title
       matching is a floor that GOES once a real subject relation lands. One
       exists here, so there is no summary path at all: no subject, no group. */
    const orphans: OutputRow[] = [
      { id: "a", recordedBy: "one", createdAt: "2026-08-25T19:40:19Z", verdict: "missed" },
      { id: "b", recordedBy: "two", createdAt: "2026-08-25T19:40:45Z", verdict: "missed" },
    ];
    expect(orphans.map(subjectOf)).toEqual([null, null]);
    expect(repeatedOutput(orphans)).toEqual([]);
  });

  it("does not report one teammate that recorded twice", () => {
    /* §3's "a run never collides with itself", one object up. An agent
       repeating itself is a retry - a different problem, and reporting it as
       two teammates duplicating each other would be false. */
    const twice = F158.map((r) => ({ ...r, recordedBy: "data-analyst" }));
    expect(repeatedOutput(twice)).toEqual([]);
  });

  it("drops a row whose producer cannot be named", () => {
    const anon = [{ ...F158[0]!, recordedBy: null }, F158[1]!];
    expect(repeatedOutput(anon)).toEqual([]);
  });

  it("keeps an id and a claim in separate namespaces", () => {
    /* Prefixed, so a decision whose id happened to equal another's claim text
       could never merge two unrelated subjects. */
    expect(subjectOf({ ...F158[0]!, subjectId: "x" })).toBe("id:x");
    expect(subjectOf({ ...F158[0]!, subjectId: null, subjectClaim: "x" })).toBe("claim:x");
  });
});

describe("the gap is reported, never used to hide a duplicate", () => {
  it("still reports two teammates a fortnight apart", () => {
    /* Deliberately not windowed: two agents grading one decision a week apart
       is still both of them doing it. The gap is colour, not a filter. */
    const far = [F158[0]!, { ...F158[1]!, createdAt: "2026-09-08T19:40:45Z" }];
    const out = repeatedOutput(far);
    expect(out).toHaveLength(1);
    expect(out[0]!.secondsApart).toBeGreaterThan(300);
  });

  it("does not speak a gap it cannot claim is meaningful", () => {
    /* "26s apart" says neither could have seen the other. A fortnight needs a
       different sentence, so this one declines to make it. */
    const far = [F158[0]!, { ...F158[1]!, createdAt: "2026-09-08T19:40:45Z" }];
    expect(repeatedOutputLine(repeatedOutput(far))).toBe("Two teammates answered the same thing.");
  });

  it("reports 0 rather than NaN when a timestamp cannot be read", () => {
    const bad = [F158[0]!, { ...F158[1]!, createdAt: "not a date" }];
    expect(repeatedOutput(bad)[0]!.secondsApart).toBe(0);
  });

  it("puts the closest race first", () => {
    const other = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    const far: OutputRow[] = [
      { ...F158[0]!, id: "f1", subjectId: other, createdAt: "2026-08-01T00:00:00Z" },
      { ...F158[1]!, id: "f2", subjectId: other, createdAt: "2026-08-02T00:00:00Z" },
    ];
    const out = repeatedOutput([...far, ...F158]);
    expect(out.map((g) => g.secondsApart)).toEqual([26, 86_400]);
  });
});

describe("silence when there is nothing to say", () => {
  it("returns null rather than an all-clear", () => {
    /* This reads from a capped list, so an absence means "not in what we read",
       never "it did not happen". A reassuring sentence would claim the second. */
    expect(repeatedOutputLine([])).toBeNull();
    expect(repeatedOutput([])).toEqual([]);
    expect(repeatedOutput(undefined)).toEqual([]);
  });
});
