/**
 * ── A PENDING OUTCOMES READ IS TWO HOPS ──────────────────────────────────────
 *
 * `listPendingOutcomes` was nine sequential Worker-to-PostgREST round trips on
 * a live desk (the run screen read it at a `worker-total` of 1.2 to 2.0 s for
 * a 964-byte answer, 2026-09-09). `readPendingOutcomes` is two: both
 * populations with their launch plan and decisions embedded, then everything
 * keyed on them in one go. Driven on the wire that counts rounds.
 *
 * THE FIXTURE IS THE WORST CASE ON PURPOSE. A shipped spec with an
 * opportunity on a theme, a launch plan, two agent-made decisions and one a
 * person made; a window-closed spec that never shipped, with its own plan and
 * a missed verdict on the table; a second closed window on the spec that
 * already shipped, which the desk must show once. Every branch that used to
 * cost a hop is live, so an emptier fixture would prove nothing.
 */
import { describe, expect, it } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { readPendingOutcomes } from "./outcome.functions";
import {
  FakeWire,
  drive,
  eqValue,
  inList,
  type Filter,
  type Row,
} from "@/__tests__/a-wire-that-counts-rounds";

const AT = "2026-09-09T01:00:00.000Z";
const EARLIER = "2026-09-01T01:00:00.000Z";

const suggestion = (verdict: "validated" | "missed") => ({
  verdict,
  summary: "s",
  predicted: "p",
  metric_label: "activation",
  metric_value: "12%",
  confidence: 0.8,
  confidence_tier: "high",
  basis: {
    sample_users: 40,
    sample_events: 400,
    data_days: 14,
    has_shipped_changeset: true,
    has_prediction: true,
  },
  generated_at: AT,
});

const SHIPPED = {
  id: "p1",
  title: "Faster onboarding",
  shipped_at: EARLIER,
  opportunity_id: "o1",
  outcome_suggestion: suggestion("validated"),
  contract: null,
  workspace_id: "ws-1",
  launch_plans: { success_metric: "activation up 10%", workspace_id: "ws-1" },
  decisions: [
    { prd_id: "p1", decided_by_agent_slug: "builder", created_at: EARLIER },
    { prd_id: "p1", decided_by_agent_slug: null, created_at: AT },
    { prd_id: "p1", decided_by_agent_slug: "shipper", created_at: AT },
  ],
};

const NEVER_SHIPPED = {
  id: "p2",
  title: "  ",
  shipped_at: null,
  opportunity_id: "o2",
  outcome_suggestion: suggestion("missed"),
  contract: null,
  workspace_id: "ws-2",
  decisions: [],
};

const fixture = (table: string, cols: string, filters: Filter[]): Row[] | unknown => {
  switch (table) {
    case "prds":
      return [SHIPPED];
    case "launch_plans":
      return [
        {
          prd_id: "p2",
          check_by: EARLIER,
          success_metric: null,
          workspace_id: "ws-2",
          prds: NEVER_SHIPPED,
        },
        // The same spec the shipped read returned: shown once, shipped first.
        {
          prd_id: "p1",
          check_by: EARLIER,
          success_metric: "activation up 10%",
          workspace_id: "ws-1",
          prds: { ...SHIPPED, launch_plans: undefined },
        },
      ];
    case "opportunities": {
      const ids = inList(filters, "id");
      if (ids) {
        return [
          {
            id: "o1",
            title: "Onboarding",
            impact: 8,
            confidence: 6,
            ease: 5,
            ice_score: "240",
            theme_id: "t1",
          },
          {
            id: "o2",
            title: "Exports",
            impact: 3,
            confidence: 5,
            ease: 5,
            ice_score: null,
            theme_id: null,
          },
        ];
      }
      // The sibling scan, by the desk's own workspaces.
      expect(cols).toBe("id,theme_id");
      expect(inList(filters, "workspace_id")).toEqual(["ws-1", "ws-2"]);
      return [
        { id: "o1", theme_id: "t1" },
        { id: "o7", theme_id: "t1" },
        { id: "o8", theme_id: "t1" },
      ];
    }
    case "workspaces":
      return [
        {
          id: "ws-1",
          promotion_min_frequency: null,
          promotion_min_severity: null,
          promotion_min_confidence: null,
          settle_evidence_floor: null,
          settle_stakes_span: null,
          never_settle_above_impact: 5,
        },
      ];
    case "agents":
      expect(eqValue(filters, "user_id")).toBe("user-1");
      expect(inList(filters, "slug")).toEqual(["shipper"]);
      return [{ id: "a1", slug: "shipper", agent_autonomy: [{ arc: "proving" }] }];
    default:
      throw new Error(`unexpected read of ${table}`);
  }
};

describe("a pending outcomes read is two hops", () => {
  it("reads both populations with their plan and decisions, then everything keyed on them together", async () => {
    const wire = new FakeWire(fixture);
    const { result, rounds } = await drive(
      wire,
      readPendingOutcomes(wire as unknown as SupabaseClient, "user-1"),
    );
    expect(rounds).toBe(2);
    // One read per table on the first hop; the second never touches the
    // tables that used to be their own hops.
    expect(wire.reads.slice(0, 2).sort()).toEqual(["launch_plans", "prds"]);
    expect(wire.reads.slice(2).sort()).toEqual([
      "agents",
      "opportunities",
      "opportunities",
      "workspaces",
    ]);
    expect(wire.reads).not.toContain("decisions");
    expect(wire.reads).not.toContain("agent_autonomy");

    // Shipped first, the closed window after, the duplicate shown once.
    expect(result.pending.map((p) => p.prdId)).toEqual(["p1", "p2"]);

    const shipped = result.pending[0];
    expect(shipped.workspaceId).toBe("ws-1");
    expect(shipped.planMetric).toBe("activation up 10%");
    // Newest agent-made decision wins; the person's decision is not an agent.
    expect(shipped.decidedBy).toEqual({ slug: "shipper", arc: "proving", holdsPromotion: true });
    expect(shipped.opportunity?.priorIce).toBe(240);
    expect(shipped.opportunity?.projected?.validated).toBeGreaterThan(
      shipped.opportunity?.projected?.missed ?? Infinity,
    );
    expect(shipped.verdictOnTable).toBe("validated");
    // The workspace's own carve-out reached the rule: impact 8 sits above the
    // ceiling of 5 the policy read returned, so the call stays a person's.
    expect(shipped.settlement?.action).toBe("escalate");
    expect(shipped.settlement?.reason).toMatch(/above impact 5/);

    const closed = result.pending[1];
    expect(closed.title).toBe("Untitled spec");
    expect(closed.shippedAt).toBeNull();
    expect(closed.planMetric).toBeNull();
    expect(closed.decidedBy).toBeNull();
    expect(closed.opportunity?.priorIce).toBeNull();
    expect(closed.verdictOnTable).toBe("missed");
    expect(closed.settlement).not.toBeNull();
  });

  it("an empty desk is one hop and asks nothing else", async () => {
    const wire = new FakeWire((table) => {
      if (table === "prds" || table === "launch_plans") return [];
      throw new Error(`unexpected read of ${table}`);
    });
    const { result, rounds } = await drive(
      wire,
      readPendingOutcomes(wire as unknown as SupabaseClient, "user-1"),
    );
    expect(rounds).toBe(1);
    expect(result.pending).toEqual([]);
  });
});
