import { describe, test, expect } from "bun:test";
import {
  decideStudioMergeShipStamp,
  stampSpecShippedOnStudioMerge,
  type StudioMergeShipInput,
} from "@/lib/studio.functions";

/**
 * THE DEFECT THESE PROTECT. The product's central claim is that past calls
 * surface before the next one is made. That needs settled outcomes, which need
 * shipped specs, and nothing stamped prds.shipped_at when a Studio changeset
 * merged: the chain was spec -> build -> merge -> nothing. These tests pin the
 * decision that closes it, and pin every case where stamping would be a lie.
 */

const ok: StudioMergeShipInput = {
  mergeConfirmed: true,
  mergeSha: "a1b2c3d4",
  baseBranch: "main",
  defaultBranch: "main",
  changesetStatus: "merged",
  prdId: "11111111-1111-4111-8111-111111111111",
  existingShippedAt: null,
};

describe("decideStudioMergeShipStamp", () => {
  test("a confirmed merge into the default branch stamps the spec", () => {
    expect(decideStudioMergeShipStamp(ok)).toEqual({ stamp: true, prdId: ok.prdId! });
  });

  test("refuses when GitHub did not confirm the merge", () => {
    const d = decideStudioMergeShipStamp({ ...ok, mergeConfirmed: false });
    expect(d.stamp).toBe(false);
    expect(d.stamp === false && d.reason).toBe("GitHub did not confirm the merge");
  });

  test("refuses a partial merge that produced no commit", () => {
    expect(decideStudioMergeShipStamp({ ...ok, mergeSha: null }).stamp).toBe(false);
    expect(decideStudioMergeShipStamp({ ...ok, mergeSha: "   " }).stamp).toBe(false);
  });

  test("refuses while the changeset is anything other than merged", () => {
    for (const status of ["staged", "committed", "pr_open", "abandoned"]) {
      const d = decideStudioMergeShipStamp({ ...ok, changesetStatus: status });
      expect(d.stamp).toBe(false);
      expect(d.stamp === false && d.reason).toContain(status);
    }
  });

  test("refuses a merge into a branch that is not the default one", () => {
    const d = decideStudioMergeShipStamp({ ...ok, baseBranch: "release/2026-08" });
    expect(d.stamp).toBe(false);
    expect(d.stamp === false && d.reason).toContain("release/2026-08");
  });

  test("an unconfirmed base branch is a refusal, never a guess", () => {
    expect(decideStudioMergeShipStamp({ ...ok, baseBranch: null }).stamp).toBe(false);
    expect(decideStudioMergeShipStamp({ ...ok, defaultBranch: null }).stamp).toBe(false);
  });

  test("refuses when no spec sits behind the change", () => {
    const d = decideStudioMergeShipStamp({ ...ok, prdId: null });
    expect(d.stamp).toBe(false);
    expect(d.stamp === false && d.reason).toBe("this change has no spec behind it");
  });

  test("never overwrites a ship the spec already records", () => {
    const d = decideStudioMergeShipStamp({
      ...ok,
      existingShippedAt: "2026-08-01T10:00:00.000Z",
    });
    expect(d.stamp).toBe(false);
    expect(d.stamp === false && d.reason).toBe("the spec already records when it shipped");
  });
});

/* ---------------------------------------------------------------- *
 * The write path, against a fake client. Verifies the shape of the
 * UPDATE, because the never-overwrite guard has to be on the query
 * itself: a production promote can land between the read and the
 * write, and only `shipped_at IS NULL` makes that safe.
 * ---------------------------------------------------------------- */

type Captured = {
  values?: Record<string, unknown>;
  filters: Array<[string, unknown]>;
  isNullOn: string[];
};

function fakeDb(opts: {
  changeset: Record<string, unknown> | null;
  prd?: Record<string, unknown> | null;
  /** Rows the guarded UPDATE returns. Empty means another writer won. */
  updateReturns?: Array<{ id: string }>;
  captured: Captured;
  stageEvents: Array<Record<string, unknown>>;
}) {
  const { captured } = opts;
  return {
    from(table: string) {
      if (table === "stage_events") {
        return {
          insert(values: Record<string, unknown>) {
            opts.stageEvents.push(values);
            return Promise.resolve({ error: null });
          },
        };
      }
      const builder = {
        _update: false,
        select() {
          if (builder._update) {
            return Promise.resolve({ data: opts.updateReturns ?? [{ id: "p1" }], error: null });
          }
          return builder;
        },
        update(values: Record<string, unknown>) {
          builder._update = true;
          captured.values = values;
          return builder;
        },
        eq(col: string, val: unknown) {
          captured.filters.push([col, val]);
          return builder;
        },
        is(col: string, val: unknown) {
          if (val === null) captured.isNullOn.push(col);
          return builder;
        },
        maybeSingle() {
          const data = table === "prds" ? (opts.prd ?? null) : opts.changeset;
          return Promise.resolve({ data, error: null });
        },
      };
      return builder;
    },
  };
}

describe("stampSpecShippedOnStudioMerge", () => {
  const args = {
    changesetId: "cs-1",
    userId: "u-1",
    mergeConfirmed: true,
    mergeSha: "deadbeef",
    baseBranch: "main",
    defaultBranch: "main",
    mergedAt: "2026-08-05T12:00:00.000Z",
  };

  test("stamps shipped_at, keeps the guard on the UPDATE, and files the stage event", async () => {
    const captured: Captured = { filters: [], isNullOn: [] };
    const stageEvents: Array<Record<string, unknown>> = [];
    const db = fakeDb({
      changeset: { id: "cs-1", status: "merged", prd_id: "p1", workspace_id: "w1" },
      prd: { id: "p1", status: "approved", shipped_at: null },
      captured,
      stageEvents,
    });

    const d = await stampSpecShippedOnStudioMerge(db as never, args);

    expect(d).toEqual({ stamp: true, prdId: "p1" });
    expect(captured.values?.status).toBe("shipped");
    expect(captured.values?.shipped_at).toBe("2026-08-05T12:00:00.000Z");
    // Without this the guard is a read-then-write race and a slower merge can
    // clobber a production promote's more precise record.
    expect(captured.isNullOn).toContain("shipped_at");
    expect(stageEvents).toHaveLength(1);
    expect(stageEvents[0]).toMatchObject({
      entity_type: "spec",
      entity_id: "p1",
      from_stage: "approved",
      to_stage: "shipped",
    });
  });

  test("writes nothing when the changeset is not merged", async () => {
    const captured: Captured = { filters: [], isNullOn: [] };
    const stageEvents: Array<Record<string, unknown>> = [];
    const db = fakeDb({
      changeset: { id: "cs-1", status: "pr_open", prd_id: "p1", workspace_id: "w1" },
      prd: { id: "p1", status: "approved", shipped_at: null },
      captured,
      stageEvents,
    });

    const d = await stampSpecShippedOnStudioMerge(db as never, args);

    expect(d.stamp).toBe(false);
    expect(captured.values).toBeUndefined();
    expect(stageEvents).toHaveLength(0);
  });

  test("writes nothing when the change has no spec behind it", async () => {
    const captured: Captured = { filters: [], isNullOn: [] };
    const stageEvents: Array<Record<string, unknown>> = [];
    const db = fakeDb({
      changeset: { id: "cs-1", status: "merged", prd_id: null, workspace_id: "w1" },
      captured,
      stageEvents,
    });

    const d = await stampSpecShippedOnStudioMerge(db as never, args);

    expect(d.stamp).toBe(false);
    expect(captured.values).toBeUndefined();
    expect(stageEvents).toHaveLength(0);
  });

  test("a concurrent writer that stamped first wins, and no stage event is filed", async () => {
    const captured: Captured = { filters: [], isNullOn: [] };
    const stageEvents: Array<Record<string, unknown>> = [];
    const db = fakeDb({
      changeset: { id: "cs-1", status: "merged", prd_id: "p1", workspace_id: "w1" },
      prd: { id: "p1", status: "approved", shipped_at: null },
      updateReturns: [],
      captured,
      stageEvents,
    });

    const d = await stampSpecShippedOnStudioMerge(db as never, args);

    expect(d.stamp).toBe(false);
    expect(d.stamp === false && d.reason).toBe("the spec already records when it shipped");
    expect(stageEvents).toHaveLength(0);
  });
});
