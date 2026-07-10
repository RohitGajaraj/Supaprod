/**
 * PC-04: the no-signup demo. Read-only server functions scoped to ONE fixed
 * demo workspace id (the public demo@redcadence.app account, per
 * docs/operations/demo-credentials.md: "These accounts are public knowledge
 * by design"). Every query below is a plain SELECT with no input parameters
 * and no write path. There is nothing here for a demoGuard to reject,
 * because nothing here can mutate anything. Uses the service-role admin
 * client since there is no user session to authenticate as; never returns
 * anything beyond the narrow projections declared below (no owner ids, no
 * tokens, no cross-workspace data).
 */
import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const DEMO_WORKSPACE_ID = "b90da531-34aa-4009-bcce-2162b87f50ac";

export type DemoOverview = {
  workspaceName: string;
  openOpportunities: number;
  decisionsRecorded: number;
  missionsInFlight: number;
};

export const getDemoOverview = createServerFn({ method: "GET" }).handler(
  async (): Promise<DemoOverview> => {
    const [ws, opps, decisions, missions] = await Promise.all([
      supabaseAdmin.from("workspaces").select("name").eq("id", DEMO_WORKSPACE_ID).maybeSingle(),
      supabaseAdmin
        .from("opportunities")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", DEMO_WORKSPACE_ID)
        .in("status", ["discovery", "committed", "now"]),
      supabaseAdmin
        .from("decisions")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", DEMO_WORKSPACE_ID),
      supabaseAdmin
        .from("missions")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", DEMO_WORKSPACE_ID)
        .in("status", ["running", "proposed", "halted"]),
    ]);

    return {
      workspaceName: ws.data?.name ?? "Demo workspace",
      openOpportunities: opps.count ?? 0,
      decisionsRecorded: decisions.count ?? 0,
      missionsInFlight: missions.count ?? 0,
    };
  },
);

export type DemoTeardown = {
  title: string;
  iceScore: number | null;
  verdict: "ship" | "revise" | "kill" | null;
  summary: string | null;
  risks: string[];
  missingEvidence: string[];
  reviewedAt: string | null;
};

export const getDemoTeardown = createServerFn({ method: "GET" }).handler(
  async (): Promise<DemoTeardown | null> => {
    const { data } = await supabaseAdmin
      .from("opportunities")
      .select("title,ice_score,critic_review")
      .eq("workspace_id", DEMO_WORKSPACE_ID)
      .not("critic_review", "is", null)
      .order("ice_score", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    if (!data) return null;
    const review = (data.critic_review ?? {}) as {
      verdict?: string;
      summary?: string;
      risks?: string[];
      missing_evidence?: string[];
      reviewed_at?: string;
    };
    const verdict =
      review.verdict === "ship" || review.verdict === "revise" || review.verdict === "kill"
        ? review.verdict
        : null;

    return {
      title: data.title,
      iceScore: data.ice_score !== null ? Number(data.ice_score) : null,
      verdict,
      summary: review.summary ?? null,
      risks: review.risks ?? [],
      missingEvidence: review.missing_evidence ?? [],
      reviewedAt: review.reviewed_at ?? null,
    };
  },
);

export type DemoLedgerRow = {
  title: string;
  status: string;
  rationale: string | null;
  agentSlug: string | null;
  createdAt: string;
};

export const getDemoLedger = createServerFn({ method: "GET" }).handler(
  async (): Promise<DemoLedgerRow[]> => {
    const { data } = await supabaseAdmin
      .from("decisions")
      .select("title,status,rationale,decided_by_agent_slug,created_at")
      .eq("workspace_id", DEMO_WORKSPACE_ID)
      .order("created_at", { ascending: false })
      .limit(5);

    return (data ?? []).map((row) => ({
      title: row.title,
      status: row.status,
      rationale: row.rationale,
      agentSlug: row.decided_by_agent_slug,
      createdAt: row.created_at,
    }));
  },
);

export type DemoMissionTrace = {
  title: string;
  status: string;
  createdAt: string;
  steps: { agentSlug: string | null; subGoal: string | null; status: string }[];
};

export const getDemoMissionTrace = createServerFn({ method: "GET" }).handler(
  async (): Promise<DemoMissionTrace | null> => {
    const { data: mission } = await supabaseAdmin
      .from("missions")
      .select("id,title,status,created_at")
      .eq("workspace_id", DEMO_WORKSPACE_ID)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!mission) return null;

    const { data: steps } = await supabaseAdmin
      .from("mission_steps")
      .select("agent_slug,sub_goal,status,idx")
      .eq("mission_id", mission.id)
      .order("idx", { ascending: true });

    return {
      title: mission.title,
      status: mission.status,
      createdAt: mission.created_at,
      steps: (steps ?? []).map((s) => ({
        agentSlug: s.agent_slug,
        subGoal: s.sub_goal,
        status: s.status,
      })),
    };
  },
);
