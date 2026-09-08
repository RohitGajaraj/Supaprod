/**
 * THE CREW'S READ DOOR INTO SHIPPED WORK MUST ACTUALLY OPEN ONTO SHIPPED WORK.
 *
 * Ship had one tool -- release.publish, a review-gated write -- and zero reads,
 * so an agent mid-run could ship but never ask "what already shipped?", "is
 * there a merged change for this?", "what is live right now?" The cost is an
 * agent re-proposing work that shipped last week with nothing warning it. What
 * this file pins is the same three properties brain-read-tools.test.ts and
 * prd-read-tools.test.ts pin for their reads, because they are what make a read
 * door trustworthy rather than decorative:
 *
 *   · READ-ONLY SHAPE -- no write verb appears anywhere in the three bodies.
 *
 *   · TENANCY FROM CONTEXT -- every tool refuses without ctx.workspaceId, none
 *     accepts a workspace argument, and every query carries the explicit
 *     workspace filter. Ship artifacts are WORKSPACE records (their SELECT
 *     policies are membership, not ownership), so unlike prd.get there is no
 *     user_id clause here to pin -- and its absence is asserted, because a
 *     user-scoped release read would hide half the workspace's shipped record.
 *
 *   · THE HUMAN PATH'S OWN DEFINITIONS, NOT INVENTED ONES -- merged means
 *     status='merged' newest-updated-first exactly as listAppliedChanges asks
 *     it, and "live" means environment='production' status='success' exactly
 *     as listChangelog reads it. Pinned at the source so a tool cannot quietly
 *     start answering a different question than the /ship surface beside it.
 *
 * The fake-client tests cover what source scanning cannot reach: row shaping,
 * the prd_id-plus-lineage spec walk (prd_id alone is null on most real rows),
 * de-duplication of re-promotes in the live list, and honest refusals.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { TOOL_REGISTRY } from "@/lib/ai/tools/registry.server";
import { TOOL_DEFAULTS } from "@/lib/ai/tools/defaults";

const NAMES = ["ship.list_releases", "ship.get_release", "ship.in_production"] as const;

const REGISTRY_SOURCE = readFileSync(join(import.meta.dir, "..", "registry.server.ts"), "utf8");

/** The full source of one tool def: from its `name:` to the next top-level const. */
function toolSource(name: string): string {
  const at = REGISTRY_SOURCE.indexOf(`name: "${name}"`);
  expect(at, `${name} has left the registry`).toBeGreaterThan(-1);
  const end = REGISTRY_SOURCE.indexOf("\nconst ", at);
  return REGISTRY_SOURCE.slice(at, end);
}

describe("the three ship reads are registered as reads", () => {
  it("registers every tool, categorised read", () => {
    for (const name of NAMES) {
      const tool = TOOL_REGISTRY[name];
      expect(tool, name).toBeTruthy();
      expect(tool!.category, name).toBe("read");
    }
  });

  it("descriptions answer the question the crew needs answered, not the mechanism", () => {
    // Same rule as the brain and spec reads: each description names the
    // decision the tool serves ("check X before Y"), which is what makes an
    // agent reach for it before proposing work instead of after re-proposing
    // something that already shipped.
    expect(TOOL_REGISTRY["ship.list_releases"]!.description).toMatch(/before.*propos/is);
    expect(TOOL_REGISTRY["ship.list_releases"]!.description).toMatch(/already shipped|shipped/i);
    expect(TOOL_REGISTRY["ship.list_releases"]!.description).toMatch(/production/i);
    expect(TOOL_REGISTRY["ship.get_release"]!.description).toMatch(/release notes/i);
    expect(TOOL_REGISTRY["ship.get_release"]!.description).toMatch(/ship\.list_releases/i);
    expect(TOOL_REGISTRY["ship.in_production"]!.description).toMatch(/live in production/i);
    expect(TOOL_REGISTRY["ship.in_production"]!.description).toMatch(/before.*propos|claiming/is);
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
  it("list_releases takes an optional bounded limit", () => {
    const s = TOOL_REGISTRY["ship.list_releases"]!.argsSchema;
    expect(s.safeParse({}).success).toBe(true);
    expect(s.safeParse({ limit: 50 }).success).toBe(true);
    expect(s.safeParse({ limit: 0 }).success).toBe(false);
    expect(s.safeParse({ limit: 51 }).success).toBe(false);
    expect(s.safeParse({ limit: "many" }).success).toBe(false);
  });

  it("get_release demands a uuid changeset id", () => {
    const s = TOOL_REGISTRY["ship.get_release"]!.argsSchema;
    expect(s.safeParse({ changeset_id: "11111111-1111-4111-8111-111111111111" }).success).toBe(
      true,
    );
    expect(s.safeParse({ changeset_id: "not-a-uuid" }).success).toBe(false);
    expect(s.safeParse({}).success).toBe(false);
  });

  it("in_production takes no arguments at all", () => {
    expect(TOOL_REGISTRY["ship.in_production"]!.argsSchema.safeParse({}).success).toBe(true);
  });
});

describe("read-only shape", () => {
  it("no ship-read tool body contains a write verb", () => {
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
    // Same posture as the brain reads: no default, no coalesce, no guessing a
    // workspace. A null workspaceId on a release read would either match
    // nothing or, worse, widen past the tenant.
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

  it("every tool scopes every query by workspace explicitly", () => {
    for (const name of NAMES) {
      const src = toolSource(name);
      expect(src.includes('.eq("workspace_id", workspaceId)'), `${name} scopes by workspace`).toBe(
        true,
      );
    }
  });

  it("no tool scopes by user, because Ship artifacts belong to the workspace", () => {
    // The deliberate opposite of prd.get: studio_changesets, deployments and
    // changelog_entries carry SELECT policies of workspace MEMBERSHIP, and the
    // human ship paths scope them the same way. A user_id clause here would
    // hide a teammate's releases from an agent standing inside the workspace.
    for (const name of NAMES) {
      const src = toolSource(name);
      expect(src.includes('.eq("user_id"'), `${name} wrongly scopes by user`).toBe(false);
    }
  });
});

describe("the human path's own definitions, not invented ones", () => {
  it("list_releases reads merged the way listAppliedChanges does: status=merged, newest updated first", () => {
    const src = toolSource("ship.list_releases");
    expect(src).toContain('.from("studio_changesets")');
    expect(src).toContain('.eq("status", "merged")');
    expect(src).toContain('.order("updated_at", { ascending: false })');
  });

  it("production state is read the way listChangelog reads it: env=production, status=success", () => {
    // Both tools that answer "is this live" must agree with the surface that
    // renders the same fact, or the crew and the person disagree about reality.
    for (const name of ["ship.list_releases", "ship.in_production"] as const) {
      const src = toolSource(name);
      expect(src.includes('.eq("environment", "production")'), `${name} env filter`).toBe(true);
      expect(src.includes('.eq("status", "success")'), `${name} status filter`).toBe(true);
    }
  });

  it("get_release walks valid-now prd->mission lineage, because prd_id alone is null on real rows", () => {
    // Live, nine of nine real merged changesets carry prd_id null while their
    // missions hold valid spec edges -- the exact finding that produced
    // specsShippedByChangeset. A spec walk over the column alone would answer
    // "no specs" on every real release, which is worse than not asking.
    const src = toolSource("ship.get_release");
    expect(src).toContain('.eq("parent_kind", "prd")');
    expect(src).toContain('.eq("child_kind", "mission")');
    expect(src).toContain('.is("valid_to", null)');
    // And a failed lineage read is NAMED, never read as absence.
    expect(src).toContain('"failed"');
  });

  it("get_release refuses an unknown id in the house phrasing", () => {
    expect(toolSource("ship.get_release")).toContain(
      '"No release with that id is visible in this workspace."',
    );
  });
});

// ── fake client ────────────────────────────────────────────────────────────
// Routes by table name; every builder method chains and the builder is thenable,
// resolving to the table's configured {data,error} exactly as supabase-js does.
// maybeSingle resolves the same payload as a single-or-null row.

type TableResponse = { data: unknown; error: { message: string } | null };

function fakeSupabase(tables: Record<string, TableResponse>) {
  let calls = 0;
  const makeBuilder = (table: string) => {
    const b = {
      select: () => b,
      eq: () => b,
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

const CS_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const CS_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const SPEC_1 = "11111111-1111-4111-8111-111111111111";
const SPEC_2 = "22222222-2222-4222-8222-222222222222";

describe("ship.list_releases behaviour (fake client)", () => {
  const csRows = [
    {
      id: CS_A,
      title: "Saved address at checkout",
      pr_url: "https://github.com/x/y/pull/12",
      pr_number: 12,
      prd_id: SPEC_1,
      updated_at: "2026-08-22T00:00:00Z",
    },
    {
      id: CS_B,
      title: "Dark mode",
      pr_url: "https://github.com/x/y/pull/9",
      pr_number: 9,
      prd_id: null,
      updated_at: "2026-08-20T00:00:00Z",
    },
  ];

  it("shapes compact rows: title, pr, released date, spec link, production state", async () => {
    const supabase = fakeSupabase({
      studio_changesets: { data: csRows, error: null },
      changelog_entries: {
        data: [{ changeset_id: CS_A, released_at: "2026-08-22T01:00:00Z" }],
        error: null,
      },
      deployments: { data: [{ changeset_id: CS_B }], error: null },
    });
    const out = (await TOOL_REGISTRY["ship.list_releases"]!.run({}, {
      supabase,
      userId: "u1",
      workspaceId: "w1",
    } as never)) as { releases: Array<Record<string, unknown>> };

    expect(out.releases).toHaveLength(2);
    const [a, b] = out.releases;
    expect(a.title).toBe("Saved address at checkout");
    expect(a.released_at).toBe("2026-08-22T01:00:00Z");
    expect(a.spec_id).toBe(SPEC_1);
    expect(a.in_production).toBe(false);
    expect(b.title).toBe("Dark mode");
    expect(b.released_at).toBeNull();
    expect(b.spec_id).toBeNull();
    expect(b.in_production).toBe(true);
  });

  it("an empty workspace answers an empty list without pretending otherwise", async () => {
    const supabase = fakeSupabase({
      studio_changesets: { data: [], error: null },
      changelog_entries: { data: [], error: null },
      deployments: { data: [], error: null },
    });
    const out = (await TOOL_REGISTRY["ship.list_releases"]!.run({}, {
      supabase,
      userId: "u1",
      workspaceId: "w1",
    } as never)) as { releases: unknown[] };
    expect(out.releases).toEqual([]);
  });

  it("a failed enrichment read throws rather than answering undated or not-live", async () => {
    // A swallowed error here would render every release as lacking a changelog
    // entry -- evidence of absence manufactured from a question never answered.
    const supabase = fakeSupabase({
      studio_changesets: { data: csRows, error: null },
      changelog_entries: { data: null, error: { message: "changelog read failed" } },
      deployments: { data: [], error: null },
    });
    await expect(
      TOOL_REGISTRY["ship.list_releases"]!.run({}, {
        supabase,
        userId: "u1",
        workspaceId: "w1",
      } as never),
    ).rejects.toThrow(/changelog read failed/);
  });

  it("refuses to run without a context workspace", async () => {
    const supabase = fakeSupabase({});
    await expect(
      TOOL_REGISTRY["ship.list_releases"]!.run({}, {
        supabase,
        userId: "u1",
        workspaceId: null,
      } as never),
    ).rejects.toThrow(/runs inside a workspace, and this run has none/);
  });
});

describe("ship.get_release behaviour (fake client)", () => {
  const csRow = {
    id: CS_A,
    status: "merged",
    title: "Saved address at checkout",
    summary: "Returning shoppers reuse a saved address.",
    repo: "x/y",
    branch: "studio/saved-address",
    pr_number: 12,
    pr_url: "https://github.com/x/y/pull/12",
    release_notes: "Checkout got faster.",
    prd_id: SPEC_1,
    mission_id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    created_at: "2026-08-21T00:00:00Z",
    updated_at: "2026-08-22T00:00:00Z",
  };

  function tablesFor(overrides: Record<string, TableResponse> = {}) {
    return {
      studio_changesets: {
        data: csRow,
        error: null,
        ...overrides.studio_changesets,
      },
      artifact_lineage: overrides.artifact_lineage ?? {
        data: [{ parent_id: SPEC_2, created_at: "2026-08-19T00:00:00Z" }],
        error: null,
      },
      prds: overrides.prds ?? {
        data: [
          {
            id: SPEC_2,
            title: "Guest checkout",
            status: "shipped",
            shipped_at: "2026-08-22T02:00:00Z",
          },
          {
            id: SPEC_1,
            title: "Saved address",
            status: "shipped",
            shipped_at: "2026-08-22T02:00:00Z",
          },
        ],
        error: null,
      },
      deployments: overrides.deployments ?? {
        data: [
          {
            environment: "production",
            status: "success",
            deploy_url: "https://live.example",
            deployed_at: "2026-08-22T03:00:00Z",
          },
          {
            environment: "preview",
            status: "success",
            deploy_url: "https://prev.example",
            deployed_at: "2026-08-21T05:00:00Z",
          },
        ],
        error: null,
      },
      changelog_entries: overrides.changelog_entries ?? {
        data: [
          {
            title: "Saved address at checkout",
            body: "Faster checkout.",
            released_at: "2026-08-22T01:00:00Z",
          },
        ],
        error: null,
      },
    };
  }

  it("returns the full record: notes, both specs, deploys by env, changelog entry", async () => {
    const supabase = fakeSupabase(tablesFor());
    const out = (await TOOL_REGISTRY["ship.get_release"]!.run({ changeset_id: CS_A }, {
      supabase,
      userId: "u1",
      workspaceId: "w1",
    } as never)) as Record<string, unknown>;

    expect(out.title).toBe("Saved address at checkout");
    expect(out.release_notes).toBe("Checkout got faster.");
    // prd_id leads; the lineage edge appends the second spec behind it.
    expect(out.linked_specs.map((s: { id: string }) => s.id)).toEqual([SPEC_1, SPEC_2]);
    expect(out.lineage_read).toBe("ok");
    expect(out.deployments).toHaveLength(2);
    expect(
      out.deployments.some((d: { environment: string }) => d.environment === "production"),
    ).toBe(true);
    expect(out.changelog_entry.body_excerpt).toBe("Faster checkout.");
  });

  it("names a release it cannot see instead of reporting success on nothing", async () => {
    const supabase = fakeSupabase(tablesFor({ studio_changesets: { data: null, error: null } }));
    await expect(
      TOOL_REGISTRY["ship.get_release"]!.run({ changeset_id: CS_A }, {
        supabase,
        userId: "u1",
        workspaceId: "w1",
      } as never),
    ).rejects.toThrow(/No release with that id/);
  });

  it("a failed lineage read is reported as failed, and prd_id still answers alone", async () => {
    const supabase = fakeSupabase(
      tablesFor({
        artifact_lineage: { data: null, error: { message: "lineage read failed" } },
        // The fake ignores .in(id) filters, so this row list stands in for the
        // server-side one: with the walk failed, only prd_id is ever asked for.
        prds: {
          data: [
            {
              id: SPEC_1,
              title: "Saved address",
              status: "shipped",
              shipped_at: "2026-08-22T02:00:00Z",
            },
          ],
          error: null,
        },
      }),
    );
    const out = (await TOOL_REGISTRY["ship.get_release"]!.run({ changeset_id: CS_A }, {
      supabase,
      userId: "u1",
      workspaceId: "w1",
    } as never)) as Record<string, unknown>;
    expect(out.lineage_read).toBe("failed");
    expect(out.linked_specs.map((s: { id: string }) => s.id)).toEqual([SPEC_1]);
  });

  it("tolerates a prompt-only release: no mission means no lineage walk and no specs invented", async () => {
    const supabase = fakeSupabase(
      tablesFor({
        studio_changesets: {
          ...tablesFor().studio_changesets,
          data: { ...csRow, prd_id: null, mission_id: null },
        },
        prds: { data: [], error: null },
      }),
    );
    const out = (await TOOL_REGISTRY["ship.get_release"]!.run({ changeset_id: CS_A }, {
      supabase,
      userId: "u1",
      workspaceId: "w1",
    } as never)) as Record<string, unknown>;
    expect(out.lineage_read).toBe("skipped");
    expect(out.linked_specs).toEqual([]);
    expect(out.changelog_entry).not.toBeNull();
  });
});

describe("ship.in_production behaviour (fake client)", () => {
  it("keeps the newest successful deploy per changeset, newest first", async () => {
    const supabase = fakeSupabase({
      deployments: {
        data: [
          {
            changeset_id: CS_B,
            deploy_url: "https://b.example",
            deployed_at: "2026-08-23T09:00:00Z",
          },
          {
            changeset_id: CS_A,
            deploy_url: "https://a2.example",
            deployed_at: "2026-08-23T08:00:00Z",
          },
          {
            changeset_id: CS_A,
            deploy_url: "https://a1.example",
            deployed_at: "2026-08-22T07:00:00Z",
          },
        ],
        error: null,
      },
      studio_changesets: {
        data: [
          { id: CS_A, title: "Saved address at checkout" },
          { id: CS_B, title: "Dark mode" },
        ],
        error: null,
      },
    });
    const out = (await TOOL_REGISTRY["ship.in_production"]!.run({}, {
      supabase,
      userId: "u1",
      workspaceId: "w1",
    } as never)) as { live_count: number; live: Array<Record<string, unknown>> };

    // A re-promote appends another success row for the same release; the crew
    // asked what is live, not how many times it was pushed.
    expect(out.live_count).toBe(2);
    expect(out.live.map((r) => r.changeset_id)).toEqual([CS_B, CS_A]);
    expect(out.live.find((r) => r.changeset_id === CS_A)?.deploy_url).toBe("https://a2.example");
    expect(out.live.find((r) => r.changeset_id === CS_A)?.title).toBe("Saved address at checkout");
  });

  it("answers honestly when nothing is live", async () => {
    const supabase = fakeSupabase({
      deployments: { data: [], error: null },
      studio_changesets: { data: [], error: null },
    });
    const out = (await TOOL_REGISTRY["ship.in_production"]!.run({}, {
      supabase,
      userId: "u1",
      workspaceId: "w1",
    } as never)) as { live_count: number; live: unknown[] };
    expect(out.live_count).toBe(0);
    expect(out.live).toEqual([]);
  });

  it("a failed deploy read throws rather than reporting an empty production", async () => {
    const supabase = fakeSupabase({
      deployments: { data: null, error: { message: "deployments read failed" } },
      studio_changesets: { data: [], error: null },
    });
    await expect(
      TOOL_REGISTRY["ship.in_production"]!.run({}, {
        supabase,
        userId: "u1",
        workspaceId: "w1",
      } as never),
    ).rejects.toThrow(/deployments read failed/);
  });
});
