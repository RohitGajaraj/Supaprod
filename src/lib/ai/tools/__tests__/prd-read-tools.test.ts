/**
 * THE CREW'S READ DOOR INTO THE SPECS MUST ACTUALLY OPEN ONTO THE SPECS.
 *
 * Specs were the one artifact the internal crew could not read back mid-run:
 * workspace.search returns fuzzy RAG snippets, never structure, while the
 * external MCP surface answered "what specs exist" (search_prds) and "what does
 * this one say" (get_prd) for months. The cost was concrete: prd.draft minted
 * duplicate specs partly because checking whether a spec already serves a bet
 * meant guessing at snippet fragments. What this file pins is the same three
 * properties brain-read-tools.test.ts pins for the decision reads, because they
 * are what make a read door trustworthy rather than decorative:
 *
 *   · READ-ONLY SHAPE -- no write verb appears anywhere in the two bodies.
 *
 *   · TENANCY FROM CONTEXT -- every tool refuses without ctx.workspaceId and
 *     none accepts a workspace argument; prd.get additionally scopes by user
 *     AND workspace like its sibling brain.get_decision.
 *
 *   · REUSE, NOT A SECOND COPY -- prd.search calls the SAME function the
 *     /api/mcp route dispatches for search_prds, so the internal and external
 *     answers cannot drift apart. prd.get has no MCP twin with this shape
 *     (get_prd predates contracts and gates), so it queries directly, and its
 *     bespoke shaping -- body excerpt, contract summary, critic verdict,
 *     outcome presence -- gets behavioural coverage with a fake client.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { TOOL_REGISTRY } from "@/lib/ai/tools/registry.server";
import { TOOL_DEFAULTS } from "@/lib/ai/tools/defaults";

const NAMES = ["prd.search", "prd.get"] as const;

const REGISTRY_SOURCE = readFileSync(join(import.meta.dir, "..", "registry.server.ts"), "utf8");

/** The full source of one tool def: from its `name:` to the next top-level const. */
function toolSource(name: string): string {
  const at = REGISTRY_SOURCE.indexOf(`name: "${name}"`);
  expect(at, `${name} has left the registry`).toBeGreaterThan(-1);
  const end = REGISTRY_SOURCE.indexOf("\nconst ", at);
  return REGISTRY_SOURCE.slice(at, end);
}

describe("the two spec reads are registered as reads", () => {
  it("registers every tool, categorised read", () => {
    for (const name of NAMES) {
      const tool = TOOL_REGISTRY[name];
      expect(tool, name).toBeTruthy();
      expect(tool!.category, name).toBe("read");
    }
  });

  it("descriptions answer the question the crew needs answered, not the mechanism", () => {
    // Same rule as the brain reads: each description names the decision the
    // tool serves ("check X before Y"), which is what makes an agent reach for
    // it before drafting instead of after minting a duplicate.
    expect(TOOL_REGISTRY["prd.search"]!.description).toMatch(/before.*draft|already serve/i);
    expect(TOOL_REGISTRY["prd.search"]!.description).toMatch(/status/i);
    expect(TOOL_REGISTRY["prd.get"]!.description).toMatch(/contract/i);
    expect(TOOL_REGISTRY["prd.get"]!.description).toMatch(/critic|gate/i);
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
  it("search takes an optional bounded query and limit", () => {
    const s = TOOL_REGISTRY["prd.search"]!.argsSchema;
    expect(s.safeParse({}).success).toBe(true);
    expect(s.safeParse({ query: "checkout address" }).success).toBe(true);
    expect(s.safeParse({ query: "checkout address", limit: 50 }).success).toBe(true);
    expect(s.safeParse({ query: "" }).success).toBe(true); // empty = list newest
    expect(s.safeParse({ query: "x", limit: 1000 }).success).toBe(false);
    expect(s.safeParse({ query: 42 }).success).toBe(false);
  });

  it("get demands a uuid id", () => {
    const s = TOOL_REGISTRY["prd.get"]!.argsSchema;
    expect(s.safeParse({ id: "11111111-1111-1111-1111-111111111111" }).success).toBe(true);
    expect(s.safeParse({ id: "not-a-uuid" }).success).toBe(false);
    expect(s.safeParse({}).success).toBe(false);
  });
});

describe("read-only shape", () => {
  it("no spec-read tool body contains a write verb", () => {
    // The static form of "these mirror GET surfaces only". A .insert/.update/
    // .delete/.upsert anywhere in the two defs fails here before it ships.
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
    // workspace. A null workspaceId on a spec read would either match nothing
    // or, worse, widen past the tenant.
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

  it("get scopes its own query by user AND workspace", () => {
    const src = toolSource("prd.get");
    expect(src).toContain('.eq("user_id", userId)');
    expect(src).toContain('.eq("workspace_id", workspaceId)');
  });
});

describe("the shared helpers are reused, not re-derived", () => {
  it("search calls the same function the MCP route dispatches", () => {
    expect(toolSource("prd.search")).toContain("searchPRDs(supabase, workspaceId");
  });

  it("the reused searchPRDs scopes itself by workspace", () => {
    // Pinned at the source so the shared helper cannot quietly lose the filter
    // the tool above relies on, the way listDueForecastsForAgent once did.
    const mcpSource = readFileSync(
      join(import.meta.dir, "..", "..", "..", "mcp.functions.ts"),
      "utf8",
    );
    const fn = mcpSource.slice(mcpSource.indexOf("export async function searchPRDs"));
    expect(fn).toContain('.eq("workspace_id", workspace_id)');
  });

  it("returns the fields the crew asks about, not a raw row dump", () => {
    const src = toolSource("prd.get");
    expect(src).toContain("body_excerpt");
    expect(src).toContain("contract_summary");
    expect(src).toContain("critic_verdict");
    expect(src).toContain("design_gate_status");
    expect(src).toContain("outcome_settled");
  });
});

describe("prd.get behaviour (fake client)", () => {
  const SPEC_ID = "11111111-1111-4111-8111-111111111111";

  function fakeSupabase(row: unknown) {
    const builder = {
      select: () => builder,
      eq: () => builder,
      maybeSingle: async () => ({ data: row, error: null }),
    };
    return { from: () => builder } as never;
  }

  const row = {
    id: SPEC_ID,
    title: "Saved address at checkout",
    status: "draft",
    body_md: "## Problem\nReturning shoppers retype their address.\n## Goals\nOne-tap reuse.",
    opportunity_id: "22222222-2222-4222-8222-222222222222",
    contract: { intent: "Returning shoppers check out in one tap.", success_metrics: [{}, {}, {}] },
    critic_review: { verdict: "revise", risks: ["No baseline checkout time recorded."] },
    design_gate_status: "pending",
    outcome: null,
    shipped_at: null,
    is_sample: false,
    created_at: "2026-08-20T00:00:00Z",
  };

  it("shapes the row into what the crew asked about", async () => {
    const tool = TOOL_REGISTRY["prd.get"]!;
    const out = (await tool.run({ id: SPEC_ID }, {
      supabase: fakeSupabase(row),
      userId: "u1",
      workspaceId: "w1",
    } as never)) as Record<string, unknown>;
    expect(out.title).toBe("Saved address at checkout");
    expect(out.status).toBe("draft");
    expect(out.body_excerpt).toContain("retype their address");
    expect((out.contract_summary as Record<string, unknown>).intent).toContain("one tap");
    expect((out.contract_summary as Record<string, unknown>).success_metric_count).toBe(3);
    expect(out.critic_verdict).toBe("revise");
    expect(out.design_gate_status).toBe("pending");
    expect(out.outcome_settled).toBe(false);
  });

  it("reads outcome presence as settled, not as the raw jsonb", async () => {
    const tool = TOOL_REGISTRY["prd.get"]!;
    const out = (await tool.run({ id: SPEC_ID }, {
      supabase: fakeSupabase({
        ...row,
        outcome: { verdict: "validated" },
        shipped_at: "2026-08-22T00:00:00Z",
      }),
      userId: "u1",
      workspaceId: "w1",
    } as never)) as Record<string, unknown>;
    expect(out.outcome_settled).toBe(true);
    expect(out.shipped_at).toBe("2026-08-22T00:00:00Z");
  });

  it("tolerates jsonb written as models write it: absent, stringified, or verdict-less", async () => {
    const tool = TOOL_REGISTRY["prd.get"]!;
    for (const critic_review of [null, undefined, '{"verdict":"kill"}', '{"risks":["x"]}']) {
      const out = (await tool.run({ id: SPEC_ID }, {
        supabase: fakeSupabase({ ...row, critic_review }),
        userId: "u1",
        workspaceId: "w1",
      } as never)) as Record<string, unknown>;
      const v = out.critic_verdict;
      if (critic_review === '{"verdict":"kill"}') expect(v).toBe("kill");
      else expect(v, `for ${JSON.stringify(critic_review)}`).toBeNull();
    }
  });

  it("names a spec it cannot see instead of reporting success on nothing", async () => {
    const tool = TOOL_REGISTRY["prd.get"]!;
    await expect(
      tool.run({ id: SPEC_ID }, {
        supabase: fakeSupabase(null),
        userId: "u1",
        workspaceId: "w1",
      } as never),
    ).rejects.toThrow(/No spec with that id/);
  });

  it("refuses to run without a context workspace", async () => {
    const tool = TOOL_REGISTRY["prd.search"]!;
    await expect(
      tool.run({}, { supabase: fakeSupabase([]), userId: "u1", workspaceId: null } as never),
    ).rejects.toThrow(/runs inside a workspace, and this run has none/);
  });
});
