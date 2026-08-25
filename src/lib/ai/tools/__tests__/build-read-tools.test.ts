/**
 * THE CREW'S READ DOOR INTO BUILD'S OWN PAST MUST ACTUALLY OPEN ONTO IT.
 *
 * Build carried eleven write tools -- stage through merge -- and zero reads,
 * so an agent mid-run could change a repo but never ask "what did previous
 * builds change?", "did they merge?", "why did they fail?" The cost is an
 * agent planning new work with nothing telling it the same work was already
 * attempted, succeeded or failed, and why. This file pins the same properties
 * ship-read-tools.test.ts pins for the ship reads, because they are what make
 * a read door trustworthy rather than decorative:
 *
 *   · READ-ONLY SHAPE -- no write verb appears anywhere in the three bodies.
 *
 *   · TENANCY FROM CONTEXT -- every tool refuses without ctx.workspaceId, none
 *     accepts a workspace argument, and the tenant gate runs on the missions
 *     row (NOT NULL workspace_id) before anything keyed by mission is read.
 *     Child queries key off the proven mission id deliberately: a belt over
 *     agent_runs' nullable legacy workspace column would silently undercount
 *     real history, and its absence here is asserted as intent.
 *
 *   · THE HUMAN PATH'S OWN DEFINITIONS, NOT INVENTED ONES -- list follows
 *     listStudioSessions (latest non-abandoned changeset per mission,
 *     archived hidden), history means status='merged' newest-updated-first
 *     exactly as listAppliedChanges asks it, and evidence counts sum the
 *     Trust Ledger's own receipt sources rather than inventing a counter.
 *
 * The fake-client tests cover what source scanning cannot reach: compact row
 * shaping, the first-changeset-wins fold, the checkpoint read, honest refusals,
 * and exact evidence counting.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { TOOL_REGISTRY } from "@/lib/ai/tools/registry.server";
import { TOOL_DEFAULTS } from "@/lib/ai/tools/defaults";

const NAMES = ["build.list_sessions", "build.get_run", "build.changeset_history"] as const;

const REGISTRY_SOURCE = readFileSync(join(import.meta.dir, "..", "registry.server.ts"), "utf8");

/** The full source of one tool def: from its `name:` to the next top-level const. */
function toolSource(name: string): string {
  const at = REGISTRY_SOURCE.indexOf(`name: "${name}"`);
  expect(at, `${name} has left the registry`).toBeGreaterThan(-1);
  const end = REGISTRY_SOURCE.indexOf("\nconst ", at);
  return REGISTRY_SOURCE.slice(at, end);
}

describe("the three build reads are registered as reads", () => {
  it("registers every tool, categorised read", () => {
    for (const name of NAMES) {
      const tool = TOOL_REGISTRY[name];
      expect(tool, name).toBeTruthy();
      expect(tool!.category, name).toBe("read");
    }
  });

  it("descriptions answer the question the crew needs answered, not the mechanism", () => {
    // Same rule as the brain, spec and ship reads: each description names the
    // decision the tool serves ("check X before Y"), which is what makes an
    // agent reach for it BEFORE proposing work instead of re-proposing
    // something a previous build already attempted.
    expect(TOOL_REGISTRY["build.list_sessions"]!.description).toMatch(/before.*plan/is);
    expect(TOOL_REGISTRY["build.list_sessions"]!.description).toMatch(
      /previous builds|merged|still open/i,
    );
    expect(TOOL_REGISTRY["build.get_run"]!.description).toMatch(/build\.list_sessions/i);
    expect(TOOL_REGISTRY["build.get_run"]!.description).toMatch(/failed|actually changed/i);
    expect(TOOL_REGISTRY["build.changeset_history"]!.description).toMatch(/merged/i);
    expect(TOOL_REGISTRY["build.changeset_history"]!.description).toMatch(/before.*propos/i);
  });

  it("carries a platform default, auto and enabled like every other read", () => {
    for (const name of NAMES) {
      const d = TOOL_DEFAULTS[name];
      expect(d, `${name} missing from TOOL_DEFAULTS (defaults.test would fail)`).toBeTruthy();
      expect(d!.mode, name).toBe("auto");
      expect(d!.enabled, name).toBe(true);
    }
  });
});

describe("args schemas", () => {
  it("list_sessions takes an optional bounded limit", () => {
    const s = TOOL_REGISTRY["build.list_sessions"]!.argsSchema;
    expect(s.safeParse({}).success).toBe(true);
    expect(s.safeParse({ limit: 50 }).success).toBe(true);
    expect(s.safeParse({ limit: 0 }).success).toBe(false);
    expect(s.safeParse({ limit: 51 }).success).toBe(false);
    expect(s.safeParse({ limit: "many" }).success).toBe(false);
  });

  it("get_run demands a uuid mission id", () => {
    const s = TOOL_REGISTRY["build.get_run"]!.argsSchema;
    expect(s.safeParse({ mission_id: "11111111-1111-4111-8111-111111111111" }).success).toBe(true);
    expect(s.safeParse({ mission_id: "not-a-uuid" }).success).toBe(false);
    expect(s.safeParse({}).success).toBe(false);
  });

  it("changeset_history takes an optional bounded limit", () => {
    const s = TOOL_REGISTRY["build.changeset_history"]!.argsSchema;
    expect(s.safeParse({}).success).toBe(true);
    expect(s.safeParse({ limit: 50 }).success).toBe(true);
    expect(s.safeParse({ limit: 51 }).success).toBe(false);
  });
});

describe("read-only shape", () => {
  it("no build-read tool body contains a write verb", () => {
    // The static form of "these mirror GET surfaces only". A .insert/.update/
    // .delete/.upsert anywhere in the three defs fails here before it ships.
    const WRITE_VERBS = [".insert(", ".update(", ".delete(", ".upsert("];
    for (const name of NAMES) {
      const src = toolSource(name);
      for (const verb of WRITE_VERBS) {
        expect(src.includes(verb), `${name} contains ${verb}`).toBe(false);
      }
    }
  });
});

describe("tenancy flows from context, never from a caller", () => {
  it("every tool refuses to run without a context workspace", () => {
    // Same posture as the brain and ship reads: no default, no coalesce, no
    // guessing a workspace.
    for (const name of NAMES) {
      const src = toolSource(name);
      expect(src.includes("if (!workspaceId)"), `${name} does not guard workspaceId`).toBe(true);
      expect(src).toMatch(/runs inside a workspace, and this run has none/);
    }
  });

  it("takes no workspace-shaped argument, so a caller cannot name another tenant", () => {
    // Scanned over the argsSchema block ONLY: the run bodies legitimately name
    // the workspace_id COLUMN when scoping queries; what must not exist is an
    // argument that would let a caller supply one.
    for (const name of NAMES) {
      const src = toolSource(name);
      const schema = src.slice(src.indexOf("argsSchema:"), src.indexOf("preview:"));
      expect(schema.includes("workspace"), `${name} accepts a workspace argument`).toBe(false);
    }
  });

  it("every tool scopes its gate query by workspace explicitly", () => {
    for (const name of NAMES) {
      const src = toolSource(name);
      expect(src.includes('.eq("workspace_id", workspaceId)'), `${name} scopes by workspace`).toBe(
        true,
      );
    }
  });

  it("get_run proves the mission in-workspace before reading anything keyed by mission", () => {
    // The tenant gate is the mission row itself (NOT NULL workspace_id); the
    // child reads key off the proven id, which cannot cross tenants because the
    // parent was verified first. A belt over agent_runs' nullable legacy
    // workspace column would silently undercount real history instead.
    const src = toolSource("build.get_run");
    const gateAt = src.indexOf('.eq("workspace_id", workspaceId)');
    const refuseAt = src.indexOf("No run with that id is visible in this workspace.");
    expect(gateAt).toBeGreaterThan(-1);
    expect(refuseAt).toBeGreaterThan(gateAt);
    expect(src.indexOf('.from("agent_runs")')).toBeGreaterThan(refuseAt);
  });

  it("no tool scopes by user, because Build artifacts belong to the workspace", () => {
    // The deliberate opposite of the human path, which still scopes missions by
    // user_id: these tools stand inside a workspace, where any member may ask
    // about any run. A user_id clause would hide teammates' work from the crew.
    for (const name of NAMES) {
      const src = toolSource(name);
      expect(src.includes('.eq("user_id"'), `${name} wrongly scopes by user`).toBe(false);
    }
  });
});

describe("the human path's own definitions, not invented ones", () => {
  it("list_sessions hides archived and folds the latest non-abandoned changeset per mission like listStudioSessions does", () => {
    const src = toolSource("build.list_sessions");
    expect(src).toContain('.from("missions")');
    expect(src).toContain('.is("archived_at", null)');
    expect(src).toContain('.neq("status", "abandoned")');
    expect(src).toContain('.order("created_at", { ascending: false })');
    // First-seen wins because the query arrives newest-created-first.
    expect(src).toContain("!latestByMission.has(cs.mission_id)");
  });

  it("changeset_history reads merged the way listAppliedChanges does: status=merged, newest updated first", () => {
    const src = toolSource("build.changeset_history");
    expect(src).toContain('.from("studio_changesets")');
    expect(src).toContain('.eq("status", "merged")');
    expect(src).toContain('.order("updated_at", { ascending: false })');
  });

  it("get_run walks valid-now prd->mission lineage, and names a failed walk", () => {
    // prd_id alone is null on most real rows while the missions hold valid spec
    // edges -- the finding that produced specsShippedByChangeset. A failed
    // lineage read is NAMED, never read as absence.
    const src = toolSource("build.get_run");
    expect(src).toContain('.eq("parent_kind", "prd")');
    expect(src).toContain('.eq("child_kind", "mission")');
    expect(src).toContain('.is("valid_to", null)');
    expect(src).toContain('"failed"');
  });

  it("get_run refuses an unknown id in the house phrasing", () => {
    expect(toolSource("build.get_run")).toContain(
      '"No run with that id is visible in this workspace."',
    );
  });

  it("evidence is counted exact server-side from the Trust Ledger receipt sources", () => {
    // decisions + approvals + learnings are the rows loadReceipts surfaces;
    // count:'exact' so a long run is never reported smaller than it was.
    const src = toolSource("build.get_run");
    for (const table of ["decisions", "agent_approvals", "learnings"]) {
      expect(src.includes(`.from("${table}")`), `${table} counted`).toBe(true);
    }
    expect(src).toContain('{ count: "exact", head: true }');
  });
});

// ── fake client ────────────────────────────────────────────────────────────
// Routes by table name; every builder method chains and the builder is thenable,
// resolving to the table's configured {data,error,count} exactly as supabase-js
// does. maybeSingle resolves the same payload as a single-or-null row.

type TableResponse = { data: unknown; error: { message: string } | null; count?: number };

function fakeSupabase(tables: Record<string, TableResponse>) {
  let calls = 0;
  const makeBuilder = (table: string) => {
    const b = {
      select: () => b,
      eq: () => b,
      neq: () => b,
      in: () => b,
      is: () => b,
      not: () => b,
      order: () => b,
      limit: () => b,
      maybeSingle: async () => tables[table] ?? { data: null, error: null },
      then: (resolve: (v: unknown) => unknown) =>
        Promise.resolve(tables[table] ?? { data: [], error: null }).then(resolve),
    };
    return b;
  };
  return {
    from: (table: string) => {
      calls += 1;
      return makeBuilder(table);
    },
    callCount: () => calls,
  } as never & { callCount: () => number };
}

const M_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const M_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const CS_1 = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const SPEC_1 = "11111111-1111-4111-8111-111111111111";
const SPEC_2 = "22222222-2222-4222-8222-222222222222";

describe("build.list_sessions behaviour (fake client)", () => {
  const missionRows = [
    {
      id: M_A,
      title: "Saved address at checkout",
      goal: "Let returning shoppers reuse a saved address.",
      status: "completed",
      created_at: "2026-08-22T00:00:00Z",
    },
    {
      id: M_B,
      title: "Dark mode",
      goal: "Ship a dark theme.",
      status: "failed",
      created_at: "2026-08-20T00:00:00Z",
    },
  ];

  it("shapes compact rows: goal, status, created_at, latest changeset state", async () => {
    const supabase = fakeSupabase({
      missions: { data: missionRows, error: null },
      studio_changesets: {
        data: [
          {
            id: CS_1,
            mission_id: M_A,
            status: "merged",
            title: "Saved address at checkout",
            pr_url: "https://github.com/x/y/pull/12",
            pr_number: 12,
          },
        ],
        error: null,
      },
    });
    const out = (await TOOL_REGISTRY["build.list_sessions"]!.run({}, {
      supabase,
      userId: "u1",
      workspaceId: "w1",
    } as never)) as { sessions: Array<Record<string, unknown>> };

    expect(out.sessions).toHaveLength(2);
    const [a, b] = out.sessions;
    expect(a.goal).toBe("Let returning shoppers reuse a saved address.");
    expect(a.status).toBe("completed");
    expect(a.created_at).toBe("2026-08-22T00:00:00Z");
    expect((a.latest_changeset as Record<string, unknown>).pr_url).toBe(
      "https://github.com/x/y/pull/12",
    );
    expect((a.latest_changeset as Record<string, unknown>).status).toBe("merged");
    // A run that produced no changeset reports that honestly rather than nulls.
    expect(b.latest_changeset).toBeNull();
  });

  it("an empty workspace answers an empty list without pretending otherwise", async () => {
    const supabase = fakeSupabase({ missions: { data: [], error: null } });
    const out = (await TOOL_REGISTRY["build.list_sessions"]!.run({}, {
      supabase,
      userId: "u1",
      workspaceId: "w1",
    } as never)) as { sessions: unknown[] };
    expect(out.sessions).toEqual([]);
  });

  it("a failed changeset read throws rather than answering without one", async () => {
    const supabase = fakeSupabase({
      missions: { data: missionRows, error: null },
      studio_changesets: { data: null, error: { message: "changesets read failed" } },
    });
    await expect(
      TOOL_REGISTRY["build.list_sessions"]!.run({}, {
        supabase,
        userId: "u1",
        workspaceId: "w1",
      } as never),
    ).rejects.toThrow(/changesets read failed/);
  });

  it("refuses to run without a context workspace", async () => {
    const supabase = fakeSupabase({});
    await expect(
      TOOL_REGISTRY["build.list_sessions"]!.run({}, {
        supabase,
        userId: "u1",
        workspaceId: null,
      } as never),
    ).rejects.toThrow(/runs inside a workspace, and this run has none/);
  });
});

describe("build.get_run behaviour (fake client)", () => {
  const missionRow = {
    id: M_A,
    title: "Saved address at checkout",
    goal: "Let returning shoppers reuse a saved address.",
    status: "completed",
    completed_at: "2026-08-22T05:00:00Z",
    current_agent_id: null,
    created_at: "2026-08-21T00:00:00Z",
    updated_at: "2026-08-22T05:00:00Z",
  };

  function tablesFor(overrides: Record<string, TableResponse> = {}) {
    return {
      missions: { data: missionRow, error: null, ...overrides.missions },
      agent_runs: overrides.agent_runs ?? {
        data: [
          {
            id: "run-2",
            status: "completed",
            agent_slug: "shipper",
            failure_kind: null,
            created_at: "2026-08-22T03:00:00Z",
          },
          {
            id: "run-1",
            status: "failed",
            agent_slug: "builder",
            failure_kind: "ci_failed",
            created_at: "2026-08-21T01:00:00Z",
          },
        ],
        error: null,
      },
      agent_run_checkpoints: overrides.agent_run_checkpoints ?? {
        data: [
          {
            run_id: "run-2",
            step_index: 7,
            created_at: "2026-08-22T04:30:00Z",
            trace: "trace-abc",
          },
        ],
        error: null,
      },
      studio_changesets: overrides.studio_changesets ?? {
        data: [
          {
            id: CS_1,
            status: "merged",
            title: "Saved address at checkout",
            summary: "Returning shoppers reuse a saved address.",
            repo: "x/y",
            branch: "studio/saved-address",
            pr_number: 12,
            pr_url: "https://github.com/x/y/pull/12",
            created_at: "2026-08-22T02:00:00Z",
            updated_at: "2026-08-22T04:00:00Z",
          },
        ],
        error: null,
      },
      artifact_lineage: overrides.artifact_lineage ?? {
        data: [{ parent_id: SPEC_1 }, { parent_id: SPEC_2 }],
        error: null,
      },
      prds: overrides.prds ?? {
        data: [
          { id: SPEC_1, title: "Guest checkout", status: "shipped" },
          { id: SPEC_2, title: "Address book", status: "validated" },
        ],
        error: null,
      },
      decisions: overrides.decisions ?? { data: null, count: 2, error: null },
      agent_approvals: overrides.agent_approvals ?? { data: null, count: 3, error: null },
      learnings: overrides.learnings ?? { data: null, count: 1, error: null },
    };
  }

  it("returns the full record: goal, current agent, changeset, checkpoint, evidence, specs", async () => {
    const supabase = fakeSupabase(tablesFor());
    const out = (await TOOL_REGISTRY["build.get_run"]!.run({ mission_id: M_A }, {
      supabase,
      userId: "u1",
      workspaceId: "w1",
    } as never)) as Record<string, any>;

    expect(out.goal).toBe("Let returning shoppers reuse a saved address.");
    expect(out.status).toBe("completed");
    // Who acted LAST, not who was dispatched first.
    expect(out.current_agent_slug).toBe("shipper");
    expect(out.latest_checkpoint.step_index).toBe(7);
    expect(out.latest_checkpoint.trace_id).toBe("trace-abc");
    expect(out.changesets).toHaveLength(1);
    expect(out.changesets[0].pr_url).toBe("https://github.com/x/y/pull/12");
    // Summed across all three Trust Ledger sources, not one of them.
    expect(out.evidence_count).toBe(6);
    expect(out.linked_specs.map((s: { id: string }) => s.id)).toEqual([SPEC_1, SPEC_2]);
    expect(out.lineage_read).toBe("ok");
  });

  it("names a run it cannot see instead of reporting success on nothing", async () => {
    const supabase = fakeSupabase(tablesFor({ missions: { data: null, error: null } }));
    await expect(
      TOOL_REGISTRY["build.get_run"]!.run({ mission_id: M_A }, {
        supabase,
        userId: "u1",
        workspaceId: "w1",
      } as never),
    ).rejects.toThrow(/No run with that id/);
  });

  it("a mission that never ran reports no agent, no checkpoint and no invented evidence", async () => {
    const supabase = fakeSupabase(
      tablesFor({
        agent_runs: { data: [], error: null },
        decisions: { data: null, count: 0, error: null },
        agent_approvals: { data: null, count: 0, error: null },
        learnings: { data: null, count: 0, error: null },
      }),
    );
    const out = (await TOOL_REGISTRY["build.get_run"]!.run({ mission_id: M_A }, {
      supabase,
      userId: "u1",
      workspaceId: "w1",
    } as never)) as Record<string, any>;
    expect(out.current_agent_slug).toBeNull();
    expect(out.latest_checkpoint).toBeNull();
    expect(out.evidence_count).toBe(0);
  });

  it("a failed lineage read is reported as failed, never read as absence", async () => {
    const supabase = fakeSupabase(
      tablesFor({
        artifact_lineage: { data: null, error: { message: "lineage read failed" } },
        prds: { data: [], error: null },
      }),
    );
    const out = (await TOOL_REGISTRY["build.get_run"]!.run({ mission_id: M_A }, {
      supabase,
      userId: "u1",
      workspaceId: "w1",
    } as never)) as Record<string, any>;
    expect(out.lineage_read).toBe("failed");
    expect(out.linked_specs).toEqual([]);
  });

  it("refuses to run without a context workspace", async () => {
    const supabase = fakeSupabase({});
    await expect(
      TOOL_REGISTRY["build.get_run"]!.run({ mission_id: M_A }, {
        supabase,
        userId: "u1",
        workspaceId: null,
      } as never),
    ).rejects.toThrow(/runs inside a workspace, and this run has none/);
  });
});

describe("build.changeset_history behaviour (fake client)", () => {
  it("lists merged changesets newest first with their spec links resolved", async () => {
    const supabase = fakeSupabase({
      studio_changesets: {
        data: [
          {
            id: CS_1,
            title: "Saved address at checkout",
            summary: "Returning shoppers reuse a saved address.",
            pr_url: "https://github.com/x/y/pull/12",
            pr_number: 12,
            prd_id: SPEC_1,
            updated_at: "2026-08-22T04:00:00Z",
          },
          {
            id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
            title: "Dark mode",
            summary: null,
            pr_url: null,
            pr_number: null,
            prd_id: null,
            updated_at: "2026-08-20T04:00:00Z",
          },
        ],
        error: null,
      },
      prds: { data: [{ id: SPEC_1, title: "Guest checkout" }], error: null },
    });
    const out = (await TOOL_REGISTRY["build.changeset_history"]!.run({}, {
      supabase,
      userId: "u1",
      workspaceId: "w1",
    } as never)) as { merged: Array<Record<string, unknown>> };

    expect(out.merged).toHaveLength(2);
    const [first, second] = out.merged;
    expect(first.title).toBe("Saved address at checkout");
    expect(first.merged_at).toBe("2026-08-22T04:00:00Z");
    expect(first.spec).toEqual({ id: SPEC_1, title: "Guest checkout" });
    // No spec behind this merge is a fact, reported as such.
    expect(second.spec).toBeNull();
  });

  it("answers honestly when nothing has merged yet", async () => {
    const supabase = fakeSupabase({ studio_changesets: { data: [], error: null } });
    const out = (await TOOL_REGISTRY["build.changeset_history"]!.run({}, {
      supabase,
      userId: "u1",
      workspaceId: "w1",
    } as never)) as { merged: unknown[] };
    expect(out.merged).toEqual([]);
  });

  it("a failed spec-title enrichment throws rather than shipping-for-nothing on every row", async () => {
    const supabase = fakeSupabase({
      studio_changesets: {
        data: [
          {
            id: CS_1,
            title: "Saved address at checkout",
            summary: null,
            pr_url: null,
            pr_number: null,
            prd_id: SPEC_1,
            updated_at: "2026-08-22T04:00:00Z",
          },
        ],
        error: null,
      },
      prds: { data: null, error: { message: "prds read failed" } },
    });
    await expect(
      TOOL_REGISTRY["build.changeset_history"]!.run({}, {
        supabase,
        userId: "u1",
        workspaceId: "w1",
      } as never),
    ).rejects.toThrow(/prds read failed/);
  });

  it("refuses to run without a context workspace", async () => {
    const supabase = fakeSupabase({});
    await expect(
      TOOL_REGISTRY["build.changeset_history"]!.run({}, {
        supabase,
        userId: "u1",
        workspaceId: null,
      } as never),
    ).rejects.toThrow(/runs inside a workspace, and this run has none/);
  });
});
