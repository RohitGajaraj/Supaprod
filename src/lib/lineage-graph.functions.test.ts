import { describe, expect, test } from "bun:test";

import {
  KIND_TARGETS,
  kindFromEdges,
  resolveFocus,
  resolveNodeViews,
  type LineageDb,
} from "./lineage-graph.functions";

/**
 * The pure walk is covered in lineage-graph.test.ts. What is tested here is the
 * I/O layer around it: the kind -> table map, the unresolved path, `[auto]`
 * stripping, and the query budget.
 */

type Table = Array<Record<string, unknown>>;

/** A fake PostgREST that records every table it was asked for. */
function fakeDb(tables: Record<string, Table | { error: unknown }>) {
  const calls: Array<{ table: string; columns: string; ids?: string[] }> = [];
  const db: LineageDb = {
    from(table) {
      return {
        select(columns) {
          const entry = tables[table];
          const result = () =>
            entry === undefined
              ? { data: null, error: { message: `relation ${table} does not exist` } }
              : Array.isArray(entry)
                ? { data: entry, error: null }
                : { data: null, error: entry.error };
          return {
            in(_column: string, values: string[]) {
              calls.push({ table, columns, ids: values });
              return Promise.resolve(result());
            },
            or(filter: string) {
              return {
                limit(_n: number) {
                  calls.push({ table, columns });
                  const rows = Array.isArray(entry) ? entry : [];
                  const id = filter.match(/parent_id\.eq\.([^,]+)/)?.[1] ?? "";
                  const hit = rows.filter((r) => r.parent_id === id || r.child_id === id);
                  return Promise.resolve(
                    Array.isArray(entry) ? { data: hit, error: null } : result(),
                  );
                },
              };
            },
            limit(_n: number) {
              calls.push({ table, columns });
              return Promise.resolve(result());
            },
          };
        },
      };
    },
  };
  return { db, calls };
}

const tablesHit = (calls: Array<{ table: string }>) => calls.map((c) => c.table);

describe("KIND_TARGETS: the map covers what is actually in the data", () => {
  // Both vocabularies plus the kinds that exist only as edge-table strings.
  // Every table name was verified against src/integrations/supabase/types.ts.
  test.each([
    ["prd", "prds"],
    ["spec", "prds"],
    ["theme", "themes"],
    ["changeset", "studio_changesets"],
    ["deployment", "deployments"],
    ["learning", "learnings"],
    ["mission", "missions"],
    ["decision", "decisions"],
    ["opportunity", "opportunities"],
    ["signal", "signals"],
  ])("%s resolves to the %s table", (kind, table) => {
    expect(KIND_TARGETS[kind]?.table).toBe(table);
  });

  test("prd and spec are the same table, so they cost one query, not two", () => {
    expect(KIND_TARGETS.prd.table).toBe(KIND_TARGETS.spec.table);
  });

  test("only kinds with a stage prefix carry an audit tag", () => {
    expect(KIND_TARGETS.mission.audit).toBe("mission");
    expect(KIND_TARGETS.prd.audit).toBe("spec"); // the lineage word, the audit tag
    expect(KIND_TARGETS.changeset.audit).toBeNull();
    expect(KIND_TARGETS.deployment.audit).toBeNull();
    expect(KIND_TARGETS.theme.audit).toBeNull();
  });
});

describe("resolveNodeViews", () => {
  test("one query per TABLE, never one per node", async () => {
    // Twelve nodes over three tables. Twelve queries would be the bug.
    const missions: Table = Array.from({ length: 5 }, (_, i) => ({
      id: `m${i}`,
      title: `Mission ${i}`,
    }));
    const prds: Table = Array.from({ length: 5 }, (_, i) => ({ id: `p${i}`, title: `Spec ${i}` }));
    const { db, calls } = fakeDb({ missions, prds, themes: [{ id: "t1", title: "Theme" }] });

    const views = await resolveNodeViews(db, [
      ...missions.map((m) => ({ kind: "mission", id: m.id as string })),
      ...prds.map((p) => ({ kind: "prd", id: p.id as string })),
      { kind: "theme", id: "t1" },
    ]);

    expect(views.size).toBe(11);
    expect(calls).toHaveLength(3);
    expect(tablesHit(calls).sort()).toEqual(["missions", "prds", "themes"]);
  });

  test("prd and spec nodes collapse into a single read of prds", async () => {
    const { db, calls } = fakeDb({
      prds: [
        { id: "p1", title: "From the lineage vocabulary" },
        { id: "p2", title: "From the audit vocabulary" },
      ],
    });
    const views = await resolveNodeViews(db, [
      { kind: "prd", id: "p1" },
      { kind: "spec", id: "p2" },
    ]);
    expect(calls).toHaveLength(1);
    expect(calls[0].ids?.sort()).toEqual(["p1", "p2"]);
    expect(views.get("prd:p1")?.title).toBe("From the lineage vocabulary");
    expect(views.get("spec:p2")?.title).toBe("From the audit vocabulary");
  });

  test("duplicate refs are read once and returned once", async () => {
    const { db, calls } = fakeDb({ missions: [{ id: "m1", title: "One" }] });
    const views = await resolveNodeViews(db, [
      { kind: "mission", id: "m1" },
      { kind: "mission", id: "m1" },
    ]);
    expect(views.size).toBe(1);
    expect(calls[0].ids).toEqual(["m1"]);
  });

  // THE POINT OF THE MODULE. A resolver that validated kinds would drop
  // `mission -> changeset -> deployment -> learning`, the entire forward chain.
  describe("a kind we cannot name survives as a node", () => {
    test("an unknown kind is returned unresolved, not dropped", async () => {
      const { db, calls } = fakeDb({ missions: [{ id: "m1", title: "Shipped it" }] });
      const views = await resolveNodeViews(db, [
        { kind: "mission", id: "m1" },
        { kind: "wormhole", id: "w1" }, // in no vocabulary, present anyway
      ]);

      expect(views.size).toBe(2);
      const unknown = views.get("wormhole:w1");
      expect(unknown).toBeDefined();
      expect(unknown?.kind).toBe("wormhole");
      expect(unknown?.id).toBe("w1");
      expect(unknown?.title).toBeNull();
      expect(unknown?.resolved).toBe(false);
      expect(unknown?.ref).toBeNull();
      // And it cost nothing: no table to guess at, so no query was attempted.
      expect(tablesHit(calls)).toEqual(["missions"]);
    });

    test("the whole forward chain resolves, including the two kinds in no vocabulary", async () => {
      const { db } = fakeDb({
        missions: [{ id: "m1", title: "Ship the walk", status: "done" }],
        studio_changesets: [{ id: "c1", title: "feat: lineage walk", status: "merged" }],
        deployments: [{ id: "d1", environment: "production", status: "succeeded" }],
        learnings: [{ id: "l1", summary: "Users found the chain", verdict: "validated" }],
      });
      const views = await resolveNodeViews(db, [
        { kind: "mission", id: "m1" },
        { kind: "changeset", id: "c1" },
        { kind: "deployment", id: "d1" },
        { kind: "learning", id: "l1" },
      ]);
      expect([...views.values()].every((v) => v.resolved)).toBe(true);
      expect(views.get("changeset:c1")?.title).toBe("feat: lineage walk");
      // deployments has no title column at all; the candidate list still finds
      // something rather than hardcoding a per-kind title.
      expect(views.get("deployment:d1")?.title).toBe("production");
      expect(views.get("learning:l1")?.title).toBe("Users found the chain");
      expect(views.get("learning:l1")?.status).toBe("validated"); // verdict, not status
    });
  });

  describe("unresolved is not the same as unnamed", () => {
    test("a row the caller cannot see comes back unresolved, and leaks nothing", async () => {
      // RLS returns the visible subset, not an error.
      const { db } = fakeDb({ missions: [{ id: "mine", title: "Mine" }] });
      const views = await resolveNodeViews(db, [
        { kind: "mission", id: "mine" },
        { kind: "mission", id: "theirs" },
      ]);
      expect(views.get("mission:mine")?.resolved).toBe(true);
      const hidden = views.get("mission:theirs");
      expect(hidden?.resolved).toBe(false);
      expect(hidden?.title).toBeNull();
      expect(hidden?.status).toBeNull();
    });

    test("one failing table leaves the rest of the chain intact", async () => {
      const { db } = fakeDb({
        missions: [{ id: "m1", title: "Still here" }],
        deployments: { error: { code: "42P01", message: "relation does not exist" } },
      });
      const views = await resolveNodeViews(db, [
        { kind: "mission", id: "m1" },
        { kind: "deployment", id: "d1" },
      ]);
      expect(views.get("mission:m1")?.resolved).toBe(true);
      expect(views.get("deployment:d1")?.resolved).toBe(false);
      expect(views.size).toBe(2);
    });

    test("a resolved row with no title-like column is resolved with a null title", async () => {
      // `resolved` is what tells the two apart, which is why it exists.
      const { db } = fakeDb({ missions: [{ id: "m1", completed_at: "2026-07-30T00:00:00Z" }] });
      const view = (await resolveNodeViews(db, [{ kind: "mission", id: "m1" }])).get("mission:m1");
      expect(view?.resolved).toBe(true);
      expect(view?.title).toBeNull();
    });

    test("an unresolved node still carries its audit tag, because the id alone yields one", async () => {
      const { db } = fakeDb({ missions: [] });
      const view = (
        await resolveNodeViews(db, [
          { kind: "mission", id: "7e7d5900-0000-4000-8000-000000000001" },
        ])
      ).get("mission:7e7d5900-0000-4000-8000-000000000001");
      expect(view?.resolved).toBe(false);
      expect(view?.ref).toBe("MIS·7E7D59");
    });
  });

  describe("[auto] never reaches a user", () => {
    test("the trigger-pipeline dedup marker is stripped from the title", async () => {
      const { db } = fakeDb({
        missions: [{ id: "m1", title: "[auto] Fix the drift alert" }],
        decisions: [{ id: "d1", title: "[AUTO]  Re-open the bet" }],
      });
      const views = await resolveNodeViews(db, [
        { kind: "mission", id: "m1" },
        { kind: "decision", id: "d1" },
      ]);
      expect(views.get("mission:m1")?.title).toBe("Fix the drift alert");
      expect(views.get("decision:d1")?.title).toBe("Re-open the bet");
    });

    test("a title that is nothing but the marker becomes null, not an empty string", async () => {
      const { db } = fakeDb({ missions: [{ id: "m1", title: "[auto]" }] });
      const view = (await resolveNodeViews(db, [{ kind: "mission", id: "m1" }])).get("mission:m1");
      expect(view?.title).toBeNull();
    });
  });

  test("the timestamp comes from a candidate list, so a table without created_at still stamps", async () => {
    const { db } = fakeDb({
      deployments: [{ id: "d1", environment: "prod", deployed_at: "2026-07-30T09:00:00Z" }],
    });
    const view = (await resolveNodeViews(db, [{ kind: "deployment", id: "d1" }])).get(
      "deployment:d1",
    );
    expect(view?.at).toBe("2026-07-30T09:00:00Z");
  });

  test("no refs means no queries at all", async () => {
    const { db, calls } = fakeDb({ missions: [] });
    expect((await resolveNodeViews(db, [])).size).toBe(0);
    expect(calls).toHaveLength(0);
  });
});

describe("resolveFocus", () => {
  const UUID = "60000000-0005-4000-8000-000000000003";
  const edges: Table = [
    { parent_kind: "prd", parent_id: "p1", child_kind: "mission", child_id: UUID },
  ];

  test("a kind and a uuid are taken as given, with no lookup", async () => {
    const { db, calls } = fakeDb({});
    expect(await resolveFocus(db, { kind: "mission", id: UUID })).toEqual({
      kind: "mission",
      id: UUID,
    });
    expect(calls).toHaveLength(0);
  });

  test("a bare uuid asks the edge table what kind it is", async () => {
    const { db } = fakeDb({ artifact_lineage: edges });
    expect(await resolveFocus(db, { id: UUID })).toEqual({ kind: "mission", id: UUID });
  });

  test("a uuid in no edge resolves to nothing rather than guessing a kind", async () => {
    const { db } = fakeDb({ artifact_lineage: [] });
    expect(await resolveFocus(db, { id: "70000000-0005-4000-8000-000000000009" })).toBeNull();
  });

  // The trap: an audit tag resolves to the kind `spec`, but every edge in the
  // table says `prd`. Focusing on `spec` would walk from a node that exists
  // nowhere and report a spec with a full chain as having none.
  test("an audit tag adopts the kind the EDGE TABLE uses, not the audit vocabulary's", async () => {
    const specId = "1234abcd-0000-4000-8000-000000000001";
    const { db } = fakeDb({
      prds: [{ id: specId }],
      artifact_lineage: [
        { parent_kind: "decision", parent_id: "d1", child_kind: "prd", child_id: specId },
      ],
    });
    expect(await resolveFocus(db, { ref: "PRD·1234AB" })).toEqual({ kind: "prd", id: specId });
  });

  test("an audit tag for an entity with no edges falls back to the audit kind", async () => {
    const id = "1234abcd-0000-4000-8000-000000000002";
    const { db } = fakeDb({ missions: [{ id }], artifact_lineage: [] });
    expect(await resolveFocus(db, { ref: "MIS·1234AB" })).toEqual({ kind: "mission", id });
  });

  test("separators and case do not matter, because parseAuditId owns that", async () => {
    const id = "005c8200-0000-4000-8000-000000000003";
    const { db } = fakeDb({ opportunities: [{ id }], artifact_lineage: [] });
    expect(await resolveFocus(db, { ref: "opp-005c82" })).toEqual({ kind: "opportunity", id });
  });

  test("an audit tag pointing at no row resolves to nothing", async () => {
    const { db } = fakeDb({ missions: [{ id: "99999999-0000-4000-8000-000000000004" }] });
    expect(await resolveFocus(db, { ref: "MIS·1234AB" })).toBeNull();
  });

  test("a kind with a short id is tolerated rather than silently yielding an empty graph", async () => {
    const id = "7e7d5900-0000-4000-8000-000000000005";
    const { db } = fakeDb({ missions: [{ id }] });
    expect(await resolveFocus(db, { kind: "mission", id: "7e7d59" })).toEqual({
      kind: "mission",
      id,
    });
  });

  test("junk resolves to nothing rather than a fabricated node", async () => {
    const { db } = fakeDb({ artifact_lineage: edges });
    expect(await resolveFocus(db, { ref: "not an id" })).toBeNull();
    expect(await resolveFocus(db, {})).toBeNull();
  });
});

describe("kindFromEdges", () => {
  test("reads the kind off whichever side of the edge holds the id", async () => {
    const child = "60000000-0005-4000-8000-000000000003";
    const parent = "60000000-0005-4000-8000-000000000004";
    const { db } = fakeDb({
      artifact_lineage: [
        { parent_kind: "prd", parent_id: parent, child_kind: "mission", child_id: child },
      ],
    });
    expect(await kindFromEdges(db, child)).toBe("mission");
    expect(await kindFromEdges(db, parent)).toBe("prd");
  });

  test("a non-uuid never reaches the .or() filter string", async () => {
    // `.or()` takes a raw PostgREST filter, so the uuid gate is the injection
    // guard, not a convenience.
    const { db, calls } = fakeDb({ artifact_lineage: [] });
    expect(await kindFromEdges(db, "p1,child_id.eq.anything")).toBeNull();
    expect(calls).toHaveLength(0);
  });
});
