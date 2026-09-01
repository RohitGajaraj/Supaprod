/**
 * THE CREW'S READ DOOR INTO THE RECORD MUST ACTUALLY OPEN ONTO THE RECORD.
 *
 * Until these five existed, the internal crew wrote the workspace's entire
 * history -- decision.record, learning.record -- and could read almost none of
 * it back mid-run, while the external MCP surface answered exactly those
 * questions (search_decisions, outcome_history, get_contradiction_history,
 * list_due_forecasts). The moat's loop closes only if the agent making the
 * next call consults past verdicts before deciding, so what this file pins is
 * the three properties that make the door trustworthy rather than decorative:
 *
 *   · READ-ONLY SHAPE -- no write verb appears anywhere in the five bodies.
 *     A read that mutates is not a stricter read; it is the external MCP
 *     contract leaking into a surface that never agreed to carry it.
 *
 *   · TENANCY FROM CONTEXT -- every tool refuses without ctx.workspaceId and
 *     none accepts a workspace argument, because a caller-supplied tenant on
 *     an agent tool is the exact hole requireSupabaseAuth exists to close.
 *
 *   · REUSE, NOT A SECOND COPY -- the three tools with an MCP twin must call
 *     the SAME function the /api/mcp route dispatches, so the internal and
 *     external answers cannot drift apart. Asserted by scanning for the call,
 *     the way tenancy-stamp.test.ts asserts the stamp.
 *
 * brain.get_decision gets one behavioural test with a fake client because it
 * has bespoke logic (the bitemporal standing/superseded tag) that source
 * scanning cannot reach.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { TOOL_REGISTRY } from "@/lib/ai/tools/registry.server";
import { TOOL_DEFAULTS } from "@/lib/ai/tools/defaults";

const NAMES = [
  "brain.search_decisions",
  "brain.outcome_history",
  "brain.get_decision",
  "brain.contradictions",
  "brain.due_forecasts",
] as const;

const REGISTRY_SOURCE = readFileSync(join(import.meta.dir, "..", "registry.server.ts"), "utf8");

/** The full source of one tool def: from its `name:` to the next top-level const. */
function toolSource(name: string): string {
  const at = REGISTRY_SOURCE.indexOf(`name: "${name}"`);
  expect(at, `${name} has left the registry`).toBeGreaterThan(-1);
  const end = REGISTRY_SOURCE.indexOf("\nconst ", at);
  return REGISTRY_SOURCE.slice(at, end);
}

describe("the five brain reads are registered as reads", () => {
  it("registers every tool, categorised read", () => {
    for (const name of NAMES) {
      const tool = TOOL_REGISTRY[name];
      expect(tool, name).toBeTruthy();
      expect(tool!.category, name).toBe("read");
    }
  });

  it("descriptions answer the question the crew needs answered, not the mechanism", () => {
    // Descriptions are prompts the crew reads. Each names the decision the
    // tool serves ("check X before Y"), which is what makes an agent reach
    // for it mid-run instead of deciding from memory.
    expect(TOOL_REGISTRY["brain.search_decisions"]!.description).toMatch(/before/i);
    expect(TOOL_REGISTRY["brain.outcome_history"]!.description).toMatch(
      /(validated|came back|verdict)/i,
    );
    expect(TOOL_REGISTRY["brain.get_decision"]!.description).toMatch(/forecast/i);
    expect(TOOL_REGISTRY["brain.contradictions"]!.description).toMatch(/contradict|conflict/i);
    expect(TOOL_REGISTRY["brain.due_forecasts"]!.description).toMatch(
      /(no graded resolution|waiting)/i,
    );
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
  it("search_decisions requires a query and bounds it", () => {
    const s = TOOL_REGISTRY["brain.search_decisions"]!.argsSchema;
    expect(s.safeParse({ query: "onboarding copy" }).success).toBe(true);
    expect(s.safeParse({ query: "onboarding copy", limit: 50 }).success).toBe(true);
    expect(s.safeParse({}).success).toBe(false);
    expect(s.safeParse({ query: "" }).success).toBe(false);
    expect(s.safeParse({ query: "x", limit: 1000 }).success).toBe(false);
  });

  it("outcome_history takes an optional bounded limit", () => {
    const s = TOOL_REGISTRY["brain.outcome_history"]!.argsSchema;
    expect(s.safeParse({}).success).toBe(true);
    expect(s.safeParse({ limit: 5 }).success).toBe(true);
    expect(s.safeParse({ limit: 0 }).success).toBe(false);
  });

  it("get_decision demands a uuid id", () => {
    const s = TOOL_REGISTRY["brain.get_decision"]!.argsSchema;
    expect(s.safeParse({ id: "11111111-1111-1111-1111-111111111111" }).success).toBe(true);
    expect(s.safeParse({ id: "not-a-uuid" }).success).toBe(false);
    expect(s.safeParse({}).success).toBe(false);
  });

  it("contradictions and due_forecasts take no arguments at all", () => {
    expect(TOOL_REGISTRY["brain.contradictions"]!.argsSchema.safeParse({}).success).toBe(true);
    expect(TOOL_REGISTRY["brain.due_forecasts"]!.argsSchema.safeParse({}).success).toBe(true);
  });
});

describe("read-only shape", () => {
  it("no brain tool body contains a write verb", () => {
    // The static form of "these mirror GET surfaces only". A .insert/.update/
    // .delete/.upsert anywhere in the five defs fails here before it ships.
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
    // Same posture as signals.log's tenant guard: no default, no coalesce, no
    // guessing a workspace. A null workspaceId on a brain read would either
    // match nothing or, worse, widen past the tenant.
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

  it("get_decision scopes its own query by user AND workspace", () => {
    const src = toolSource("brain.get_decision");
    expect(src).toContain('.eq("user_id", userId)');
    expect(src).toContain('.eq("workspace_id", workspaceId)');
  });

  it("contradictions scopes the graph load by workspace", () => {
    const src = toolSource("brain.contradictions");
    expect(src).toContain('.eq("workspace_id", workspaceId)');
  });
});

describe("the shared helpers are reused, not re-derived", () => {
  it("search_decisions calls the same function the MCP route dispatches", () => {
    expect(toolSource("brain.search_decisions")).toContain("searchDecisions(supabase, workspaceId");
  });

  it("outcome_history calls the same function the MCP route dispatches", () => {
    expect(toolSource("brain.outcome_history")).toContain("outcomeHistory(supabase, workspaceId");
  });

  it("due_forecasts calls listDueForecastsForAgent, which scopes by workspace", () => {
    expect(toolSource("brain.due_forecasts")).toContain(
      "listDueForecastsForAgent(supabase, workspaceId",
    );
    // The helper used to ignore the workspace argument entirely, which on the
    // service-role route meant cross-workspace due forecasts. Pinned at the
    // source so it cannot quietly lose the filter again.
    const mcpSource = readFileSync(
      join(import.meta.dir, "..", "..", "..", "mcp.functions.ts"),
      "utf8",
    );
    const fn = mcpSource.slice(mcpSource.indexOf("listDueForecastsForAgent"));
    expect(fn).toContain('.eq("workspace_id", workspace_id)');
    // The signature takes the tenant plainly; the underscore-prefixed
    // "unused on purpose" spelling is what let the filter go missing.
    //
    // PINNED ON THE CLAIM, NOT THE SPELLING. This used to read
    // `/supabaseClient: any,\s*\n\s*workspace_id: string/` -- which made the
    // client's TYPE part of the assertion even though the client has nothing to
    // do with whether the tenant argument is used. It duly failed on 2026-09-01
    // when `supabaseClient` was typed `SupabaseClient<Database>` (the `any` was
    // the reason the tenant filter could go missing unnoticed in the first
    // place, so the test was pinning the defect in place). The claim is that
    // the second parameter is `workspace_id`, not `_workspace_id`; that is what
    // is asserted now, and it is checked against the same 200-char window.
    expect(fn.slice(0, 200)).toMatch(/supabaseClient:[^\n]*,\s*\n\s*workspace_id: string/);
    expect(fn.slice(0, 200)).not.toContain("_workspace_id: string");
  });

  it("contradictions reuses the Brain panel's pure lens rules", () => {
    expect(toolSource("brain.contradictions")).toContain("activeContradictions(edges)");
    expect(toolSource("brain.contradictions")).toContain("resolvedChildIds(edges)");
  });
});

describe("brain.get_decision behaviour (fake client)", () => {
  const DECISION_ID = "11111111-1111-1111-1111-111111111111";

  function fakeSupabase(decision: unknown, edges: unknown[]) {
    const decisionsBuilder = {
      select: () => decisionsBuilder,
      eq: () => decisionsBuilder,
      maybeSingle: async () => ({ data: decision, error: null }),
    };
    // A thenable: the tool awaits the bare builder chain and destructures
    // { data }, exactly as supabase-js resolves it.
    const lineageBuilder = {
      select: () => lineageBuilder,
      eq: () => lineageBuilder,
      in: () => lineageBuilder,
      then: (resolve: (v: unknown) => unknown) =>
        Promise.resolve({ data: edges, error: null }).then(resolve),
    };
    return {
      from: (table: string) => (table === "decisions" ? decisionsBuilder : lineageBuilder),
    } as never;
  }

  const row = {
    id: DECISION_ID,
    title: "Ship inline editor",
    rationale: "Users asked for it in eleven signals.",
    alternatives_considered: ["embed a third-party editor"],
    status: "approved",
    source_kind: "agent",
    decided_by_agent_slug: "decider",
    mission_id: null,
    prd_id: null,
    created_at: "2026-08-01T00:00:00Z",
    forecast_claim: "Editing sessions double",
    forecast_how_we_will_know: "Sessions metric, 14 days",
    forecast_horizon_date: "2026-09-01T00:00:00Z",
    forecast_resolution: "hit",
    forecast_resolution_rationale: "Sessions went from 12/day to 31/day.",
    forecast_resolved_at: "2026-09-02T10:00:00Z",
  };

  it("returns the full row including forecast fields and resolution", async () => {
    const tool = TOOL_REGISTRY["brain.get_decision"]!;
    const out = (await tool.run({ id: DECISION_ID }, {
      supabase: fakeSupabase(row, []),
      userId: "u1",
      workspaceId: "w1",
    } as never)) as Record<string, unknown>;
    expect(out.title).toBe("Ship inline editor");
    expect(out.forecast_claim).toBe("Editing sessions double");
    expect(out.forecast_resolution).toBe("hit");
    expect(out.outcome).toBe("standing");
    expect(out.superseded_by).toBeNull();
  });

  it("tags a decision superseded when an active lineage edge replaces it", async () => {
    const tool = TOOL_REGISTRY["brain.get_decision"]!;
    const out = (await tool.run({ id: DECISION_ID }, {
      supabase: fakeSupabase(row, [
        {
          parent_id: "22222222-2222-2222-2222-222222222222",
          child_id: DECISION_ID,
          relation: "supersedes",
          valid_to: null,
        },
      ]),
      userId: "u1",
      workspaceId: "w1",
    } as never)) as Record<string, unknown>;
    expect(out.outcome).toBe("superseded");
    expect(out.superseded_by).toBe("22222222-2222-2222-2222-222222222222");
  });

  it("a retired (bitemporally reversed) supersession leaves the decision standing", async () => {
    const tool = TOOL_REGISTRY["brain.get_decision"]!;
    const out = (await tool.run({ id: DECISION_ID }, {
      supabase: fakeSupabase(row, [
        {
          parent_id: "33333333-3333-3333-3333-333333333333",
          child_id: DECISION_ID,
          relation: "supersedes",
          valid_to: "2026-08-05T00:00:00Z",
        },
      ]),
      userId: "u1",
      workspaceId: "w1",
    } as never)) as Record<string, unknown>;
    expect(out.outcome).toBe("standing");
  });

  it("names a decision it cannot see instead of reporting success on nothing", async () => {
    const tool = TOOL_REGISTRY["brain.get_decision"]!;
    await expect(
      tool.run({ id: DECISION_ID }, {
        supabase: fakeSupabase(null, []),
        userId: "u1",
        workspaceId: "w1",
      } as never),
    ).rejects.toThrow(/No decision with that id/);
  });
});
