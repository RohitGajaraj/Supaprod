import { describe, it, expect } from "bun:test";
import { getArdDocument, outcomeHistory } from "./mcp.functions";

/**
 * Two read paths on the MCP surface, exercised against fixture-backed fakes:
 * `outcomeHistory` and `getArdDocument`.
 *
 * `ingestSignal` USED TO BE THE FIRST THIRD OF THIS FILE and moved out on
 * 2026-08-23, when that door stopped inserting its own row and started filing
 * through the signal sink. Its tests asserted on rows captured from a fake client
 * passed into the function, and the sink writes through its own service-role
 * client, so every one of them was pinning a call that no longer happens. They were
 * replaced rather than rewritten, in
 * mcp-ingest-signal-files-through-the-sink.test.ts: that file needs a module mock,
 * bun applies module mocks process-wide, and putting one in a file whose remaining
 * two subjects are tested with a plain fake client would have made an unrelated
 * pair of suites depend on mock ordering.
 */

/**
 * RPT-16 · outcomeHistory. A minimal fixture-based chainable fake standing in
 * for the real Supabase query builder: `.eq`/`.ilike`/`.in` filter an
 * in-memory row set for the table named in `.from()`, `.limit` truncates, and
 * the builder itself is thenable so `await q` resolves `{ data, error }` -
 * mirrors real supabase-js closely enough to exercise this function's own
 * filtering/flattening logic without a live database.
 */
function makeOutcomeClient(tables: Record<string, Record<string, unknown>[]>) {
  return {
    from(table: string) {
      let rows = tables[table] ?? [];
      const builder: {
        select: () => typeof builder;
        eq: (col: string, val: unknown) => typeof builder;
        ilike: (col: string, pattern: string) => typeof builder;
        in: (col: string, vals: unknown[]) => typeof builder;
        order: () => typeof builder;
        limit: (n: number) => typeof builder;
        then: (resolve: (v: { data: unknown[]; error: null }) => void) => void;
      } = {
        select: () => builder,
        eq(col, val) {
          rows = rows.filter((r) => r[col] === val);
          return builder;
        },
        ilike(col, pattern) {
          const needle = pattern.replace(/%/g, "").toLowerCase();
          rows = rows.filter((r) =>
            String(r[col] ?? "")
              .toLowerCase()
              .includes(needle),
          );
          return builder;
        },
        in(col, vals) {
          const set = new Set(vals);
          rows = rows.filter((r) => set.has(r[col]));
          return builder;
        },
        order: () => builder,
        limit(n) {
          rows = rows.slice(0, n);
          return builder;
        },
        then(resolve) {
          resolve({ data: rows, error: null });
        },
      };
      return builder;
    },
  };
}

describe("outcomeHistory", () => {
  const opportunities = [
    { id: "opp-1", workspace_id: "ws-1", title: "Faster onboarding" },
    { id: "opp-2", workspace_id: "ws-1", title: "Retry flow" },
    { id: "opp-3", workspace_id: "ws-2", title: "Faster onboarding elsewhere" },
  ];
  const learnings = [
    {
      id: "l-1",
      workspace_id: "ws-1",
      opportunity_id: "opp-1",
      verdict: "validated",
      summary: "Adoption doubled.",
      metric_label: "WAU",
      metric_value: "+120%",
      prior_ice: 5,
      new_ice: 7,
      created_at: "2026-07-05T00:00:00.000Z",
      opportunity: { title: "Faster onboarding" },
    },
    {
      id: "l-2",
      workspace_id: "ws-1",
      opportunity_id: "opp-2",
      verdict: "missed",
      summary: null,
      metric_label: null,
      metric_value: null,
      prior_ice: 4,
      new_ice: 3,
      created_at: "2026-07-01T00:00:00.000Z",
      opportunity: { title: "Retry flow" },
    },
  ];

  it("returns only the initiative's own outcome history, workspace-scoped", async () => {
    const client = makeOutcomeClient({ opportunities, learnings });
    const rows = (await outcomeHistory(client, "ws-1", "onboarding", 20)) as Array<{
      id: string;
      initiative: string | null;
    }>;
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe("l-1");
    expect(rows[0].initiative).toBe("Faster onboarding");
  });

  it("never crosses into another workspace's matching opportunity", async () => {
    const client = makeOutcomeClient({ opportunities, learnings });
    // ws-2 has a matching title ("Faster onboarding elsewhere") but no
    // learnings fixture points at opp-3, so this also proves the tenant
    // boundary rather than merely an empty fixture coincidence.
    const rows = await outcomeHistory(client, "ws-2", "onboarding", 20);
    expect(rows).toEqual([]);
  });

  it("returns [] immediately when no opportunity matches, without querying learnings", async () => {
    const client = makeOutcomeClient({ opportunities, learnings });
    const rows = await outcomeHistory(client, "ws-1", "nonexistent bet", 20);
    expect(rows).toEqual([]);
  });

  it("returns the workspace's most recent outcomes overall when initiative is empty", async () => {
    const client = makeOutcomeClient({ opportunities, learnings });
    const rows = (await outcomeHistory(client, "ws-1", "", 20)) as Array<{ id: string }>;
    expect(rows.map((r) => r.id).sort()).toEqual(["l-1", "l-2"]);
  });

  it("flattens an array-shaped opportunity embed the same way exportSkillpack does", async () => {
    const client = makeOutcomeClient({
      opportunities,
      learnings: [{ ...learnings[0], opportunity: [{ title: "Faster onboarding" }] }],
    });
    const rows = (await outcomeHistory(client, "ws-1", "onboarding", 20)) as Array<{
      initiative: string | null;
    }>;
    expect(rows[0].initiative).toBe("Faster onboarding");
  });
});

/**
 * CNV-03 / mission 3.4 · get_ard IS the recovery path.
 *
 * THE DEFECT THESE PROTECT. When the ARD work-order block ran out of budget it
 * told the dispatched agent to "fetch it with the MCP get_ard tool" — and
 * get_ard returned an envelope with no design key at all, so the mockup was
 * unreachable by the one route the product named. A control that promises an
 * act it cannot perform. Nothing caught it because the notice and the tool were
 * written months apart and no test held them to each other.
 */
function ardClient(tables: Record<string, unknown>) {
  return {
    from(table: string) {
      const rows = tables[table];
      const result = { data: rows ?? null, error: null as { message: string } | null };
      const builder: Record<string, unknown> = {};
      const self = () => builder;
      Object.assign(builder, {
        select: self,
        eq: self,
        in: self,
        order: () => Promise.resolve(result),
        single: () => Promise.resolve(result),
        maybeSingle: () => Promise.resolve(result),
        then: (onOk: (r: typeof result) => unknown) => Promise.resolve(result).then(onOk),
      });
      return builder;
    },
  };
}

const CONTRACT = {
  version: 1,
  intent: "Ship the design station handoff",
  evidence_links: [],
  success_metrics: [
    {
      id: "22222222-2222-4222-8222-222222222222",
      text: "p95 under 200ms",
      status: "standing",
      superseded_by: null,
      oracle_kind: "ci",
      oracle_ref: null,
      created_at: "2026-07-07T00:00:00.000Z",
    },
  ],
  non_goals: [],
  budget: null,
  ambiguity_policy: null,
  drafted_by: "agent",
  drafted_at: "2026-07-07T00:00:00.000Z",
};

describe("getArdDocument — the design section the truncation notice promises", () => {
  const mockup = '<section class="row"><h2>Station</h2></section>'.repeat(500);

  it("returns the mockup, the flow and the design memory, not just the contract", async () => {
    const client = ardClient({
      prds: { id: "p1", title: "A spec", contract: CONTRACT },
      design_memory: [
        {
          id: "m1",
          workspace_id: "ws-1",
          category: "token",
          title: "Accent color",
          content: "Indigo 600 for primary actions.",
          status: "approved",
          created_at: "2026-07-07T00:00:00.000Z",
        },
      ],
      prd_flows: { steps: [{ label: "Land on the station" }], edges: [] },
      prd_scaffolds: { html: mockup },
    });

    const doc = await getArdDocument(client, "ws-1", "p1", "https://app.supaprod.com");

    expect(doc.contract.intent).toBe("Ship the design station handoff");
    expect(doc.design).toBeDefined();
    // The whole point: this is the value the work order dropped for budget.
    expect(doc.design!.scaffold_html).toBe(mockup);
    expect(doc.design!.flow_steps).toEqual([{ label: "Land on the station" }]);
    expect(doc.design!.memory).toEqual([
      {
        category: "token",
        title: "Accent color",
        content: "Indigo 600 for primary actions.",
      },
    ]);
  });

  it("returns the mockup WHOLE — the dispatch budget must not follow it into the recovery", async () => {
    // 25k: past ARD_SCAFFOLD_HTML_CAP, the cap that is right for a work order
    // and wrong for the route an agent takes to escape a truncated one.
    const huge = "<div>x</div>".repeat(2500);
    expect(huge.length).toBeGreaterThan(20_000);
    const client = ardClient({
      prds: { id: "p1", title: "A spec", contract: CONTRACT },
      prd_scaffolds: { html: huge },
    });
    const doc = await getArdDocument(client, "ws-1", "p1", "");
    expect(doc.design!.scaffold_html).toBe(huge);
  });

  it("a spec whose design station never ran carries no design key at all", async () => {
    const client = ardClient({ prds: { id: "p1", title: "A spec", contract: CONTRACT } });
    const doc = await getArdDocument(client, "ws-1", "p1", "");
    expect(doc.contract.intent).toBe("Ship the design station handoff");
    expect(doc.design).toBeUndefined();
  });
});
