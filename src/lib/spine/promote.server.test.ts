/**
 * The sweep must be able to tell its three zeroes apart.
 *
 * WHY THIS FILE EXISTS. Promotion shipped on 2026-08-01 and could not be
 * verified afterwards, because every failure path returned an empty list and the
 * only way to check it from outside was `select ... from spine_tracks where
 * theme_id is not null`, which returns zero rows for all of:
 *
 *   1. nothing cleared the bar          (healthy, and the common case)
 *   2. the link column does not exist   (structurally dead, forever)
 *   3. the themes read failed           (transient)
 *
 * A feature whose healthy state and whose dead state are indistinguishable from
 * the outside is not observable, and this repo has deleted that same defect
 * under other names repeatedly: the driver advancing on silence, a station that
 * filed nothing looking identical to one that did its job.
 *
 * These tests assert the DISTINCTION, not the happy path. Each one would have
 * passed before the change and told you nothing.
 */
import { describe, expect, it } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";

import { promoteClustersOnce } from "./promote.server";
import { MAX_PROMOTIONS_PER_SWEEP } from "./promote";
import { ARTIFACT_SOURCE } from "./chain";

type ThemeFixture = {
  id: string;
  title: string | null;
  summary: string | null;
  frequency: number | null;
  severity: number | null;
  confidence: number | null;
  status: string | null;
  workspace_id: string | null;
  product_id: string | null;
};

/** A cluster that clears all three conditions of DEFAULT_PROMOTION_BAR. */
function strong(over: Partial<ThemeFixture> = {}): ThemeFixture {
  return {
    id: "theme-1",
    title: "Checkout drops the saved address",
    summary: "Nine people lost a saved address at the address step.",
    frequency: 9,
    severity: 5,
    confidence: 0.9,
    status: "open",
    workspace_id: "ws-1",
    product_id: "prod-1",
    ...over,
  };
}

/**
 * The two reads and the one write this module makes, and nothing else.
 *
 * The chains are spelled out exactly as `promoteClustersOnce` and
 * `startTrackCore` call them, so a future refactor that drops the `order` calls
 * (the fix that made the 200-row window deterministic) breaks these tests rather
 * than silently reintroducing an arbitrary window.
 */
function mockSupabase(config: {
  takenRows?: Array<{ theme_id: string }>;
  takenErr?: { code?: string; message?: string } | null;
  themes?: ThemeFixture[];
  themesErr?: { code?: string; message?: string } | null;
  /** Refuse the insert, e.g. the unique index or a missing column. */
  insertErr?: { code?: string; message?: string } | null;
  /** Refuse the post-promotion status write, which must never fail the sweep. */
  statusErr?: { code?: string; message?: string } | null;
  /** Refuse the origin-cluster member write, which must also never fail it. */
  memberErr?: { code?: string; message?: string } | null;
}) {
  const inserted: Array<Record<string, unknown>> = [];
  const statusMarked: Array<{ id: string; status: string }> = [];
  const members: Array<Record<string, unknown>> = [];

  const client = {
    __inserted: inserted,
    __statusMarked: statusMarked,
    __members: members,
    from: (table: string) => {
      if (table === "spine_tracks") {
        return {
          // The read: which clusters have already become work.
          select: (_cols: string) => ({
            eq: (_c: string, _v: unknown) => ({
              not: async (_c2: string, _op: string, _v2: unknown) => ({
                data: config.takenErr ? null : (config.takenRows ?? []),
                error: config.takenErr ?? null,
              }),
            }),
          }),
          // The write: startTrackCore's insert.
          insert: (row: Record<string, unknown>) => {
            inserted.push(row);
            return {
              select: (_cols: string) => ({
                single: async () => {
                  if (config.insertErr) return { data: null, error: config.insertErr };
                  return {
                    data: {
                      id: `track-for-${row.theme_id}`,
                      user_id: row.user_id,
                      workspace_id: row.workspace_id,
                      title: row.title,
                      origin: row.origin,
                      entry_station: row.entry_station,
                      station: row.station,
                      status: "open",
                      path: row.path,
                      waived: row.waived,
                      updated_at: "2026-08-02T00:00:00.000Z",
                      last_hold: null,
                      driven_at: null,
                    },
                    error: null,
                  };
                },
              }),
            };
          },
        };
      }
      if (table === "themes") {
        return {
          /**
           * The status write the sweep makes after a track starts, so the theme
           * it acted on says so.
           *
           * Recorded into `statusMarked` rather than discarded, because the
           * whole reason this write exists is that the autonomous path used to
           * leave no mark and two separate investigations then read
           * `themes.status` and concluded the sweep was broken. A stub that
           * swallows it would let that regress silently, which is the exact
           * shape of defect this file's own header is about.
           */
          update: (patch: Record<string, unknown>) => ({
            eq: async (_c: string, id: unknown) => {
              statusMarked.push({ id: String(id), status: String(patch.status ?? "") });
              return { error: config.statusErr ?? null };
            },
          }),
          select: (_cols: string) => ({
            eq: (_c: string, _v: unknown) => ({
              gte: (_c2: string, _v2: unknown) => ({
                order: (_c3: string, _o3: unknown) => ({
                  order: (_c4: string, _o4: unknown) => ({
                    order: (_c5: string, _o5: unknown) => ({
                      limit: async (_n: number) => ({
                        data: config.themesErr ? null : (config.themes ?? []),
                        error: config.themesErr ?? null,
                      }),
                    }),
                  }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === "spine_track_members") {
        return {
          /**
           * The origin cluster filed against the track it started.
           *
           * THIS IS THE HANDOFF AT THE DOOR. Without it a promoted track reaches
           * Discover carrying no members, so `loadUpstream` returns nothing and
           * the crew whose job is to gather evidence for a cluster is briefed
           * with the cluster's title and nothing else.
           */
          upsert: async (row: Record<string, unknown>, _opts: unknown) => {
            members.push(row);
            return { error: config.memberErr ?? null };
          },
        };
      }
      throw new Error(`mockSupabase: unexpected table "${table}"`);
    },
  };

  return client as unknown as SupabaseClient & {
    __inserted: typeof inserted;
    __statusMarked: typeof statusMarked;
    __members: typeof members;
  };
}

describe("promoteClustersOnce tells its zeroes apart", () => {
  it("names a missing theme_id column instead of reporting a quiet sweep", async () => {
    // This is the state the whole return shape exists for. Before the change
    // this returned [] and read as "nothing qualified", so a permanently dead
    // feature was indistinguishable from a calm workspace.
    const db = mockSupabase({ takenErr: { code: "42703", message: "column does not exist" } });
    const sweep = await promoteClustersOnce(db, "user-1");

    expect(sweep.blocked).toBeTruthy();
    expect(sweep.blocked).toContain("theme_id");
    expect(sweep.blocked).toContain("20260802020000");
    expect(sweep.outcomes).toEqual([]);
    // It must not have attempted a write it could not possibly complete.
    expect(db.__inserted).toHaveLength(0);
  });

  it("a refused status write does not fail the promotion that succeeded", async () => {
    // The track IS the promotion. Marking the theme is how the promotion becomes
    // legible, and legibility must never be able to undo the thing it describes
    // — the same fail-soft rule every provenance stamp in this repo follows.
    const db = mockSupabase({
      themes: [strong()],
      statusErr: { message: "permission denied for table themes" },
    });
    const sweep = await promoteClustersOnce(db, "user-1");

    expect(sweep.blocked).toBeNull();
    expect(sweep.outcomes[0].why).toBe("started");
    expect(sweep.outcomes[0].trackId).toBe("track-for-theme-1");
  });

  it("marks nothing when the track was REFUSED, because a refusal is not a promotion", async () => {
    // The inverse error, and the easier one to write by accident: marking the
    // theme before checking whether the track actually started would leave a row
    // claiming it became work when nothing did.
    const db = mockSupabase({
      themes: [strong()],
      insertErr: { message: "duplicate key value violates unique constraint" },
    });
    const sweep = await promoteClustersOnce(db, "user-1");

    expect(sweep.outcomes[0].trackId).toBeNull();
    expect(db.__statusMarked).toEqual([]);
  });

  it("names a failed themes read rather than swallowing it", async () => {
    const db = mockSupabase({ themesErr: { message: "statement timeout" } });
    const sweep = await promoteClustersOnce(db, "user-1");

    expect(sweep.blocked).toContain("statement timeout");
    expect(sweep.outcomes).toEqual([]);
  });

  it("reports a genuinely quiet sweep as NOT blocked", async () => {
    // The healthy zero, and the one that must never wear a fault's clothes.
    const db = mockSupabase({
      themes: [strong({ id: "weak", frequency: 2, severity: 4, confidence: 0.8 })],
    });
    const sweep = await promoteClustersOnce(db, "user-1");

    expect(sweep.blocked).toBeNull();
    expect(sweep.qualified).toBe(0);
    expect(sweep.outcomes).toEqual([]);
  });

  it("starts qualifying work and reports what it started", async () => {
    const db = mockSupabase({ themes: [strong()] });
    const sweep = await promoteClustersOnce(db, "user-1");

    expect(sweep.blocked).toBeNull();
    expect(sweep.qualified).toBe(1);
    expect(sweep.outcomes).toHaveLength(1);
    expect(sweep.outcomes[0].trackId).toBe("track-for-theme-1");
    expect(sweep.outcomes[0].why).toBe("started");

    // The link is what makes a repeated sweep safe, so assert it is WRITTEN and
    // not merely passed. A version of startTrackCore that accepted themeId and
    // dropped it would re-promote the same cluster every ten minutes forever,
    // each track spending against its own ceiling.
    expect(db.__inserted[0].theme_id).toBe("theme-1");

    /**
     * AND THE THEME ITSELF SAYS SO, which it did not until 2026-08-11.
     *
     * The link above makes a repeated sweep safe. It does NOT make the promotion
     * legible: `spine_tracks.theme_id` answers "did this become work" only if
     * you already know to look there. Everyone asks `themes.status` instead,
     * including the manual Gate, which writes it.
     *
     * Two promotion paths writing two different records of the same event
     * produced two false alarms on one day — "the bar is mathematically
     * unreachable" and "seven themes clear the bar and sit unpromoted". Both
     * were investigated as defects. Both were this sweep working correctly and
     * saying nothing on the row it acted upon.
     */
    expect(db.__statusMarked).toEqual([{ id: "theme-1", status: "promoted" }]);
  });

  it("never re-promotes a cluster that already became work", async () => {
    const db = mockSupabase({
      takenRows: [{ theme_id: "theme-1" }],
      themes: [strong()],
    });
    const sweep = await promoteClustersOnce(db, "user-1");

    expect(sweep.alreadyPromoted).toBe(1);
    expect(sweep.qualified).toBe(0);
    expect(db.__inserted).toHaveLength(0);
    // Still not a fault: this workspace is working exactly as intended.
    expect(sweep.blocked).toBeNull();
  });

  it("counts the whole qualifying backlog even though it only starts a couple", async () => {
    // Without this, a reader cannot tell whether the per-sweep bound is doing
    // any work, and the bound is the thing standing between 181 themes and 181
    // simultaneous spends.
    const many = Array.from({ length: 9 }, (_, i) => strong({ id: `theme-${i}` }));
    const db = mockSupabase({ themes: many });
    const sweep = await promoteClustersOnce(db, "user-1");

    expect(sweep.qualified).toBe(9);
    expect(sweep.outcomes).toHaveLength(MAX_PROMOTIONS_PER_SWEEP);
    expect(db.__inserted).toHaveLength(MAX_PROMOTIONS_PER_SWEEP);
  });

  it("treats an all-refused sweep as blocked, not as a quiet one", async () => {
    // The write-side twin of the first test: if the read somehow succeeds and
    // every insert is refused for a structural reason, that is still a fault and
    // must not report as "two attempted, none started" with no cause.
    const db = mockSupabase({
      themes: [strong()],
      insertErr: {
        code: "42703",
        message: 'column "theme_id" of relation "spine_tracks" does not exist',
      },
    });
    const sweep = await promoteClustersOnce(db, "user-1");

    expect(sweep.blocked).toBeTruthy();
    expect(sweep.outcomes).toHaveLength(1);
    expect(sweep.outcomes[0].trackId).toBeNull();
  });

  it("does not call a lost race a fault", async () => {
    // 23505 is the partial unique index: another tick promoted this cluster
    // first. startTrackCore maps that to "already promoted", which is a refusal
    // the design expects to hit sometimes, so `blocked` must stay quiet-ish
    // about cause while still reporting that nothing started.
    const db = mockSupabase({
      themes: [strong()],
      insertErr: { code: "23505", message: "duplicate key value violates unique constraint" },
    });
    const sweep = await promoteClustersOnce(db, "user-1");

    expect(sweep.outcomes[0].why).toBe("already promoted");
    expect(sweep.outcomes[0].trackId).toBeNull();
  });
});

describe("the cluster a promoted track came from reaches the station that must work it", () => {
  /**
   * WHY THIS BLOCK EXISTS. `promoteClustersOnce` wrote `spine_tracks.theme_id`
   * and stopped, and nothing on the drive path reads that column. The driver
   * briefs every station from `spine_track_members`, so the autonomous half of
   * the loop opened work and then handed Discover a one-line title: no summary,
   * no frequency or severity, no evidence. Discover reported that it could find
   * nothing, which was true, and the driver counted a clean run that filed
   * nothing as a station worth retrying until the work froze.
   *
   * The link existed the whole time. It was written into a column the loop does
   * not read, which is the same defect as a flag with no writer wearing the other
   * face: a writer with no reader.
   */
  it("files the origin cluster as the track's first member", async () => {
    const db = mockSupabase({ themes: [strong()] });
    const sweep = await promoteClustersOnce(db, "user-1");

    expect(sweep.outcomes[0].trackId).toBe("track-for-theme-1");
    expect(db.__members).toHaveLength(1);
    expect(db.__members[0]).toMatchObject({
      track_id: "track-for-theme-1",
      artifact_kind: "theme",
      artifact_id: "theme-1",
      // Filed AT Discover, because that is the station whose brief it belongs in
      // and the station a person reads it under on the chain.
      station: "sense",
    });
  });

  it("names a kind the chain reader can actually resolve", async () => {
    // A member whose kind is absent from ARTIFACT_SOURCE is dropped silently by
    // loadUpstream, so a typo here would reproduce the empty brief exactly while
    // every row looked present in the table.
    const db = mockSupabase({ themes: [strong()] });
    await promoteClustersOnce(db, "user-1");
    const kind = String(db.__members[0].artifact_kind);
    expect(ARTIFACT_SOURCE[kind]).toBeTruthy();
    expect(ARTIFACT_SOURCE[kind].table).toBe("themes");
  });

  it("files nothing when the track was refused, because there is no track to file against", async () => {
    const db = mockSupabase({
      themes: [strong()],
      insertErr: { message: "duplicate key value violates unique constraint" },
    });
    await promoteClustersOnce(db, "user-1");
    expect(db.__members).toEqual([]);
  });

  it("keeps the promotion when the member write is refused", async () => {
    // Same fail-soft rule as the status mark, and for the same reason: the track
    // is the promotion. Losing the index is recoverable, losing the work is not.
    const db = mockSupabase({
      themes: [strong()],
      memberErr: { message: "permission denied for table spine_track_members" },
    });
    const sweep = await promoteClustersOnce(db, "user-1");
    expect(sweep.blocked).toBeNull();
    expect(sweep.outcomes[0].why).toBe("started");
    expect(sweep.outcomes[0].trackId).toBe("track-for-theme-1");
  });

  it("files one member per promoted cluster and never one for an unpromoted one", async () => {
    const db = mockSupabase({
      themes: [strong(), strong({ id: "theme-2", title: "Search returns nothing for exact SKUs" })],
    });
    await promoteClustersOnce(db, "user-1");

    const promoted = new Set(
      db.__members.map((m) => `${m.track_id}:${String(m.artifact_id)}`),
    );
    expect(promoted).toEqual(
      new Set(["track-for-theme-1:theme-1", "track-for-theme-2:theme-2"]),
    );
  });
});
