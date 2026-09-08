/**
 * ── A QUEUE IS TWO HOPS DEEP ─────────────────────────────────────────────────
 *
 * 2026-09-08, the Inbox on Helio Labs: `getApprovalsQueue` took 7,694 ms. Every
 * query it runs was then timed as the signed-in user with RLS on and came back
 * at 0.05 to 6 ms, about 20 ms for the lot. The cost was the SHAPE: twelve
 * sequential Worker-to-PostgREST round trips on the critical path, seven of
 * them inside `listGovernApprovals`, at the ~275 ms warm / ~550 ms cold this
 * deployment pays per hop. Nothing in a test can see that latency, so this one
 * measures the thing that produces it: how many ROUNDS of reads the handler
 * issues before it can answer, driven with a fake client that resolves nothing
 * until asked and counts each time it is.
 *
 * THE FIXTURE IS THE WORST CASE ON PURPOSE. Every family returns a row, every
 * row carries the id that used to trigger a dependent read (a pending gate
 * with a mission and an agent, a pending decision from a mission and a spec,
 * a challenge with an assumption under a decision, a spec, a proposal and a
 * design gate each in a project, a snoozed nothing). An empty fixture would
 * skip the branches that cost the hops and prove nothing.
 *
 * The wire itself, and why a count rather than a source read, is
 * `src/__tests__/a-wire-that-counts-rounds.ts`.
 */
import { describe, expect, it } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { readApprovalsQueue } from "./approvals-queue.functions";
import {
  FakeWire,
  drive as driveWire,
  eqValue,
  inList,
  type Filter,
  type Row,
} from "@/__tests__/a-wire-that-counts-rounds";

const AT = "2026-09-08T10:00:00.000Z";

const drive = (wire: FakeWire, wsId: string) =>
  driveWire(wire, readApprovalsQueue(wire as unknown as SupabaseClient<Database>, "user-1", wsId));

function worstCase(decisionSpecProject: string) {
  return (table: string, cols: string, filters: Filter[]): Row[] => {
    switch (table) {
      case "agent_approvals":
        // The decided-history read names decision_reason; the queue read does not.
        if (cols.includes("decision_reason")) return [];
        return [
          {
            id: "ap1",
            agent_slug: "builder",
            tool_name: "studio.commit",
            args: {},
            rationale: "ship it",
            status: "pending",
            escalation_state: null,
            expires_at: null,
            created_at: AT,
            decided_at: null,
            error: null,
            mission_id: "m1",
          },
        ];
      case "missions":
        return [{ id: "m1", title: "Mission one", status: "running" }];
      case "agent_runs":
        return [{ mission_id: "m1", status: "waiting_approval", created_at: AT }];
      case "decisions":
        return [
          {
            id: "d1",
            title: "Decide the thing",
            rationale: "because",
            status: "pending",
            source_kind: "prd",
            meeting_id: null,
            mission_id: "m1",
            prd_id: "p1",
            decided_by_agent_slug: null,
            snapshot_before: null,
            created_at: AT,
            auto_origin: null,
            forecast_claim: null,
            forecast_how_we_will_know: null,
            forecast_horizon_date: null,
            forecast_resolution: null,
            forecast_resolved_at: null,
          },
        ];
      case "prds": {
        if (eqValue(filters, "design_gate_status") === "pending") {
          return [{ id: "p3", title: "Design gate", updated_at: AT, project_id: "proj-1" }];
        }
        if (eqValue(filters, "status") === "review") {
          return [
            {
              id: "p2",
              title: "Spec in review",
              status: "review",
              critic_review: null,
              updated_at: AT,
              project_id: "proj-1",
            },
          ];
        }
        // The decisions read hydrating its spec by id.
        return [{ id: "p1", title: "The spec", project_id: decisionSpecProject }];
      }
      case "opportunities":
        return [
          {
            id: "o1",
            title: "An opportunity",
            critic_review: { verdict: "revise", summary: "tighten it" },
            created_at: AT,
            project_id: "proj-1",
          },
        ];
      case "memory_candidates":
        return [
          {
            id: "mc1",
            content: "Remember this",
            status: "pending",
            importance: null,
            source_kind: "chat",
            created_at: AT,
          },
        ];
      case "house_rules":
        return [
          {
            id: "hr1",
            workspace_id: "ws-1",
            rule_text: "Never ship on Friday",
            rationale: null,
            status: "pending",
            source_learning_ids: [],
            decided_by: null,
            decided_at: null,
            created_at: AT,
            agent_slug: null,
          },
        ];
      case "assumption_challenges":
        return [
          {
            id: "c1",
            assumption_id: "a1",
            signal_id: null,
            learning_id: null,
            rationale: "the signal moved",
            created_at: AT,
            assumption: {
              id: "a1",
              statement: "Users want speed",
              decision_id: "d1",
              prd_id: null,
              decision: {
                id: "d1",
                title: "Decide the thing",
                forecast_claim: null,
                forecast_how_we_will_know: null,
                forecast_horizon_date: null,
                forecast_resolution: null,
              },
              prd: null,
            },
          },
        ];
      case "workspaces":
        return [{ id: "ws-1", design_stage_enabled: true }];
      case "projects": {
        const ids = inList(filters, "id") ?? [];
        return [
          { id: "proj-1", name: "Project one" },
          { id: "proj-late", name: "The late one" },
        ].filter((p) => ids.includes(p.id));
      }
      case "trust_graduation_proposals":
      case "playbook_proposals":
      case "approval_snoozes":
      case "learnings":
        return [];
      default:
        throw new Error(`unexpected read of ${table}`);
    }
  };
}

describe("a queue is two hops deep", () => {
  it("answers the worst-case fixture in three rounds, the third only for the late project", async () => {
    // The pending decision's spec sits in a project no spec, proposal or
    // design gate named, so its name has to be read after the barrier.
    const client = new FakeWire(worstCase("proj-late"));
    const { result, rounds } = await drive(client, "ws-1");
    expect(rounds).toBe(3);
    expect(result.incomplete).toEqual([]);
    const ids = result.items.map((i) => i.id).sort();
    expect(ids).toEqual(
      [
        "tool_call:ap1",
        "decision:d1",
        "memory_candidate:mc1",
        "house_rule:hr1",
        "spec:p2",
        "opportunity:o1",
        "assumption_challenge:c1",
        "design_gate:p3",
      ].sort(),
    );
    const decision = result.items.find((i) => i.id === "decision:d1");
    expect(decision?.projectName).toBe("The late one");
    const challenge = result.items.find((i) => i.id === "assumption_challenge:c1");
    expect(challenge?.title).toBe("Decide the thing");
    expect(challenge?.evidence[0]).toBe("Users want speed. the signal moved");
    const gate = result.items.find((i) => i.id === "tool_call:ap1");
    expect(gate?.gatesLiveWork).toBe(true);
  });

  it("answers in two rounds when the decision's project was already named", async () => {
    const client = new FakeWire(worstCase("proj-1"));
    const { result, rounds } = await drive(client, "ws-1");
    expect(rounds).toBe(2);
    expect(result.items.find((i) => i.id === "decision:d1")?.projectName).toBe("Project one");
    // The late read did not run: projects was read exactly once.
    expect(client.reads.filter((t) => t === "projects")).toHaveLength(1);
  });

  it("drops a decision whose mission is still proposed without a read of its own", async () => {
    const base = worstCase("proj-1");
    const client = new FakeWire((table, cols, filters) =>
      table === "missions"
        ? [{ id: "m1", title: "Mission one", status: "proposed" }]
        : base(table, cols, filters),
    );
    const { result, rounds } = await drive(client, "ws-1");
    expect(rounds).toBe(2);
    expect(result.items.find((i) => i.id === "decision:d1")).toBeUndefined();
  });

  it("never reads agent_tools, learnings or assumptions on the queue path", async () => {
    // agent_tools fed a risk grade toolRisk replaced; learnings and the
    // decisions-by-prd read behind it feed outcomeByAgent, which the queue
    // does not render; assumptions ride the challenge read as an embed.
    const client = new FakeWire(worstCase("proj-1"));
    await drive(client, "ws-1");
    expect(client.reads).not.toContain("agent_tools");
    expect(client.reads).not.toContain("learnings");
    expect(client.reads).not.toContain("assumptions");
  });
});
