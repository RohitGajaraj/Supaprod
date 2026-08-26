/**
 * A SHARED READ IS NOT A COLLISION (2026-08-26).
 *
 * ── THE TWO WAYS THIS FEATURE DIES ─────────────────────────────────────────
 * S2's brief names the first: *"a dedupe screen that returns nothing is worse
 * than none"* — the restatement fold answered `ids: []` and produced a ~46-track
 * graveyard. The second is the mirror image and just as fatal: a mark that fires
 * on every shared read is technically true and always on, and **a mark that is
 * always on is furniture.**
 *
 * Measured 2026-08-26, the tools that actually name a target are mostly READS —
 * `repo.read` 64 calls, `github.readFile` 35, `prd.get` 25, `brain.get_decision`
 * 6 — against a handful that write: `design.draft` 10, `decision.revise` 7,
 * `prd.revise` 4. **So a naive implementation would be wrong nearly all of the
 * time**, and it would be wrong in the direction that trains people to ignore it.
 *
 * Two agents reading one PRD is a healthy afternoon. Two agents revising it is
 * worth interrupting someone about.
 */
import { describe, expect, it } from "bun:test";

import { targetOf, collisionsFrom, type Anchor } from "./collision";

const anchor = (over: Partial<Anchor> & Pick<Anchor, "runId" | "toolName">): Anchor => ({
  agentSlug: "agent",
  missionId: null,
  targetKind: "file",
  targetId: "src/app.ts",
  createdAt: "2026-08-26T15:00:00Z",
  ...over,
});

describe("what a call names, read from its real argument shapes", () => {
  it("a path becomes a file target", () => {
    expect(targetOf({ path: "src/app.ts" })).toEqual({
      targetKind: "file",
      targetId: "src/app.ts",
    });
  });

  it("a list of paths anchors on the first, because one anchor per run is the contract", () => {
    expect(targetOf({ paths: ["a.ts", "b.ts"] })?.targetId).toBe("a.ts");
  });

  it("a specific id names its table; a bare id cannot and does not pretend to", () => {
    expect(targetOf({ prd_id: "p1" })).toEqual({ targetKind: "row:prd", targetId: "p1" });
    expect(targetOf({ id: "x1" })).toEqual({ targetKind: "row", targetId: "x1" });
  });

  it("a specific key wins over a bare id, because it is better evidence", () => {
    expect(targetOf({ id: "x1", decision_id: "d1" })?.targetKind).toBe("row:decision");
  });

  it("a call that names nothing contributes NO anchor", () => {
    // The real shape of most calls: signals.list({tag, limit, lookback_days}).
    // No anchor is NOT "this run touched nothing" — the run is simply absent
    // from the view rather than shown as safe.
    expect(targetOf({ tag: "checkout", limit: 20, lookback_days: 90 })).toBeNull();
    expect(targetOf({ query: "saved payment method" })).toBeNull();
    expect(targetOf(null)).toBeNull();
  });
});

describe("a collision needs two DISTINCT runs", () => {
  it("one run touching a thing is not a collision", () => {
    expect(collisionsFrom([anchor({ runId: "r1", toolName: "prd.revise" })])).toEqual([]);
  });

  it("the same run twice is one teammate, not a crowd", () => {
    const out = collisionsFrom([
      anchor({ runId: "r1", toolName: "prd.revise" }),
      anchor({ runId: "r1", toolName: "prd.revise" }),
    ]);
    expect(out).toEqual([]);
  });

  it("different targets do not collide", () => {
    const out = collisionsFrom([
      anchor({ runId: "r1", toolName: "prd.revise", targetId: "a.ts" }),
      anchor({ runId: "r2", toolName: "prd.revise", targetId: "b.ts" }),
    ]);
    expect(out).toEqual([]);
  });
});

describe("THE RULE: shared reads are reported, but not contested", () => {
  it("two readers on one file are NOT contested", () => {
    // Both CATALOGUED reads. My first version used `github.readFile`, which has
    // 35 production calls and appears nowhere in the registry — so
    // `isSideEffectingTool` fail-closes it to true and the test failed. The code
    // was right and the test was wrong: an uncatalogued name means "nothing is
    // written down about what this changes", which is not a read.
    const out = collisionsFrom([
      anchor({ runId: "r1", toolName: "repo.read" }),
      anchor({ runId: "r2", toolName: "github.ci.read" }),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]!.contested).toBe(false);
  });

  it("an UNCATALOGUED tool counts as contested, and that is the safe default", () => {
    /*
     * Fail-closed, deliberately. `github.readFile` really does only read, but
     * nothing in the registry says so, and a collision surface that assumed
     * "unknown means harmless" would go quiet exactly where the product knows
     * least. Better a mark that over-reports an unlisted tool than one that
     * stays silent because nobody catalogued it. Cataloguing it is the fix; this
     * is the behaviour until someone does.
     */
    const out = collisionsFrom([
      anchor({ runId: "r1", toolName: "repo.read" }),
      anchor({ runId: "r2", toolName: "github.readFile" }),
    ]);
    expect(out[0]!.contested).toBe(true);
  });

  it("one writer among them makes it contested", () => {
    const out = collisionsFrom([
      anchor({ runId: "r1", toolName: "repo.read" }),
      anchor({ runId: "r2", toolName: "prd.revise" }),
    ]);
    expect(out[0]!.contested).toBe(true);
  });

  it("contested collisions sort first, so one glance lands on the writer", () => {
    const out = collisionsFrom([
      anchor({ runId: "r1", toolName: "repo.read", targetId: "quiet.ts" }),
      anchor({ runId: "r2", toolName: "repo.read", targetId: "quiet.ts" }),
      anchor({ runId: "r3", toolName: "prd.revise", targetId: "hot.ts" }),
      anchor({ runId: "r4", toolName: "repo.read", targetId: "hot.ts" }),
    ]);
    expect(out).toHaveLength(2);
    expect(out[0]!.targetId).toBe("hot.ts");
    expect(out[0]!.contested).toBe(true);
    expect(out[1]!.contested).toBe(false);
  });

  it("it names who and with what, so the mark can say something", () => {
    const out = collisionsFrom([
      anchor({ runId: "r1", agentSlug: "builder", toolName: "prd.revise" }),
      anchor({ runId: "r2", agentSlug: "planner", toolName: "repo.read" }),
    ]);
    expect(out[0]!.runs.map((r) => r.agentSlug).sort()).toEqual(["builder", "planner"]);
    expect(out[0]!.runs.map((r) => r.toolName)).toContain("prd.revise");
  });
});

describe("ONE ENTITY, NAMED TWO WAYS, IS ONE ENTITY (S2's defect, 2026-08-26)", () => {
  /*
   * S2 measured this on live data and it is the failure this surface exists to
   * prevent, arriving from the side the file was not watching.
   *
   * PRD `e9e5b033` was anchored by four runs. Two named it `prd_id`, giving
   * `row:prd`. Two named it `id`, giving a bare `row`, because `id` alone cannot
   * name its table. Both readings are correct; keying the bucket on the reading
   * was not. One of the four was `design.draft`, which WRITES.
   *
   * The truth was: somebody is drafting a design against a spec two other runs
   * are reading. Keyed by kind, that came back as two unrelated pairs.
   *
   * The two-run version is worse and trivially reachable: one run via `prd_id`,
   * one via `id`, two singleton buckets, `[]` returned, and the surface prints
   * "Nobody is on the same thing" over a real overlap. **A confident all-clear,
   * which is F-76 wearing this surface's clothes.**
   */
  const onPrd = (runId: string, toolName: string, namedBy: "prd_id" | "id"): Anchor =>
    anchor({
      runId,
      toolName,
      targetKind: namedBy === "prd_id" ? "row:prd" : "row",
      targetId: "e9e5b033-1bf7-4770-acd8-9589ad8aca43",
    });

  it("the two-run case no longer returns a confident all-clear", () => {
    const out = collisionsFrom([
      onPrd("r1", "design.draft", "prd_id"),
      onPrd("r2", "prd.get", "id"),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]!.contested, "design.draft writes, so this is worth interrupting for").toBe(true);
  });

  it("S2's exact four runs come back as ONE overlap, not two pairs", () => {
    const out = collisionsFrom([
      onPrd("r1", "design.draft", "prd_id"),
      onPrd("r2", "learning.record", "prd_id"),
      onPrd("r3", "prd.get", "id"),
      onPrd("r4", "prd.get", "id"),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]!.runs).toHaveLength(4);
    expect(out[0]!.contested).toBe(true);
  });

  it("and it reports the reading that names the table", () => {
    // `row:prd` over a bare `row`: the mark should say which spec.
    const out = collisionsFrom([
      onPrd("r1", "prd.get", "id"),
      onPrd("r2", "design.draft", "prd_id"),
    ]);
    expect(out[0]!.targetKind).toBe("row:prd");
  });

  it("but a FILE and a ROW that share an id are still kept apart", () => {
    // The family split is why this fix does not trade a false negative for a
    // false positive: a path and a row id are different namespaces.
    const out = collisionsFrom([
      anchor({ runId: "r1", toolName: "prd.revise", targetKind: "row", targetId: "same" }),
      anchor({ runId: "r2", toolName: "repo.read", targetKind: "file", targetId: "same" }),
    ]);
    expect(out).toEqual([]);
  });
});
