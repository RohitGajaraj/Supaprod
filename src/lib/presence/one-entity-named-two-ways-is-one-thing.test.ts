/**
 * ONE ENTITY NAMED TWO WAYS IS ONE THING (2026-08-26).
 *
 * ── THE DEFECT THIS PINS ───────────────────────────────────────────────────
 * Filed by S2 against live rows, not inferred from reading. `collisionsFrom`
 * grouped on the target KIND as well as the id, and the kind is derived from
 * which argument key named the entity: `prd_id` gives `row:prd`, a bare `id`
 * gives `row`. So one PRD, named two ways, landed in two buckets that were
 * never compared.
 *
 * Measured: PRD `e9e5b033-1bf7-4770-acd8-9589ad8aca43` anchored by FOUR distinct
 * runs. `design.draft` and `learning.record` named it `prd_id`; two `prd.get`
 * calls named it `id`. The truth is *somebody is drafting a design against a
 * spec two other runs are reading*, which is the sentence this whole surface
 * was built to say. The code reported two unrelated pairs instead.
 *
 * **And the two-run form is worse.** One run via `prd_id`, one via `id`, and the
 * result was two singleton buckets, no collision, and a confident *"Nobody is on
 * the same thing"* over a real overlap. That is F-76 wearing this surface's
 * clothes: it failed in the direction that matters, reporting people as apart
 * when they were together.
 *
 * ── AND THE LIMIT ON THE FIX ───────────────────────────────────────────────
 * Identity collapses across kinds for UUIDS ONLY. Every row id in this schema is
 * one, and two ids that are the same uuid are the same row. A non-uuid id keeps
 * its kind, because `signal_id: "1"` and `theme_id: "1"` are two different
 * things, and a mark that fires where nothing is shared is the other way this
 * surface dies.
 */
import { describe, expect, it } from "bun:test";

import { collisionsFrom, type Anchor } from "./collision";

/** The real uuid from the measurement above. */
const PRD = "e9e5b033-1bf7-4770-acd8-9589ad8aca43";

const anchor = (over: Partial<Anchor> & Pick<Anchor, "runId" | "toolName">): Anchor => ({
  agentSlug: "agent",
  missionId: null,
  targetKind: "row",
  targetId: PRD,
  createdAt: "2026-08-26T15:00:00Z",
  ...over,
});

describe("the live case: four runs on one spec", () => {
  const anchors = [
    anchor({ runId: "r1", agentSlug: "designer", toolName: "design.draft", targetKind: "row:prd" }),
    anchor({ runId: "r2", agentSlug: "learner", toolName: "learning.record", targetKind: "row:prd" }),
    anchor({ runId: "r3", agentSlug: "planner", toolName: "prd.get", targetKind: "row" }),
    anchor({ runId: "r4", agentSlug: "builder", toolName: "prd.get", targetKind: "row" }),
  ];

  it("is ONE collision, not two unrelated pairs", () => {
    expect(collisionsFrom(anchors)).toHaveLength(1);
  });

  it("counts all four teammates, so the mark cannot name one of three", () => {
    expect(collisionsFrom(anchors)[0]!.runs.map((r) => r.runId).sort()).toEqual([
      "r1",
      "r2",
      "r3",
      "r4",
    ]);
  });

  it("is contested, because design.draft writes", () => {
    expect(collisionsFrom(anchors)[0]!.contested).toBe(true);
  });

  it("keeps the specific noun for the reader: a spec, not an item", () => {
    expect(collisionsFrom(anchors)[0]!.targetKind).toBe("row:prd");
  });
});

describe("the two-run form, which used to return a confident all-clear", () => {
  it("one run via prd_id and one via a bare id is a collision", () => {
    const out = collisionsFrom([
      anchor({ runId: "r1", toolName: "prd.revise", targetKind: "row:prd" }),
      anchor({ runId: "r2", toolName: "prd.get", targetKind: "row" }),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]!.contested).toBe(true);
  });
});

describe("the limit: only uuids are one id under two names", () => {
  it("two different tables sharing a short id do NOT collide", () => {
    const out = collisionsFrom([
      anchor({ runId: "r1", toolName: "prd.revise", targetKind: "row:signal", targetId: "1" }),
      anchor({ runId: "r2", toolName: "prd.revise", targetKind: "row:theme", targetId: "1" }),
    ]);
    expect(out).toEqual([]);
  });

  it("the same non-uuid id under the same kind still collides", () => {
    const out = collisionsFrom([
      anchor({ runId: "r1", toolName: "prd.revise", targetKind: "row:theme", targetId: "1" }),
      anchor({ runId: "r2", toolName: "prd.get", targetKind: "row:theme", targetId: "1" }),
    ]);
    expect(out).toHaveLength(1);
  });
});

describe("files are untouched by any of this", () => {
  it("a path never merges into a row bucket", () => {
    const out = collisionsFrom([
      anchor({ runId: "r1", toolName: "prd.revise", targetKind: "file", targetId: PRD }),
      anchor({ runId: "r2", toolName: "prd.get", targetKind: "row:prd", targetId: PRD }),
    ]);
    expect(out).toEqual([]);
  });

  it("two runs on one path still collide", () => {
    const out = collisionsFrom([
      anchor({ runId: "r1", toolName: "repo.read", targetKind: "file", targetId: "src/app.ts" }),
      anchor({ runId: "r2", toolName: "repo.read", targetKind: "file", targetId: "src/app.ts" }),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]!.targetKind).toBe("file");
  });
});

describe("the displayed noun is deterministic", () => {
  it("does not depend on which row came back first", () => {
    const specific = anchor({ runId: "r1", toolName: "prd.get", targetKind: "row:prd" });
    const bare = anchor({ runId: "r2", toolName: "prd.get", targetKind: "row" });
    expect(collisionsFrom([specific, bare])[0]!.targetKind).toBe("row:prd");
    expect(collisionsFrom([bare, specific])[0]!.targetKind).toBe("row:prd");
  });
});
