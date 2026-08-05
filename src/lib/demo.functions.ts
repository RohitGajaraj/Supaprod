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
 *
 * ENGINE-ROOM DOCTRINE. Nothing in here hands a raw row status to the page.
 * `missions.status` and `mission_steps.status` are orchestrator enums; a
 * visitor gets an OUTCOME word derived from them, and the derivation lives
 * here so the page cannot invent a second, disagreeing vocabulary.
 *
 * LAUNCH AUDIT 2026-08-05. This module used to count `running | proposed |
 * halted` as one number and let the page label it "missions in flight". The
 * live demo workspace is 32 halted and 1 completed, so the page rendered
 * "32 missions in flight" for a workspace with zero running missions. A
 * halted run is not in flight. The buckets below are mutually exclusive and
 * exhaustive - delivered + open + stopped always equals the mission total,
 * so no status can quietly fall out of the accounting the way it did before.
 */
import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const DEMO_WORKSPACE_ID = "b90da531-34aa-4009-bcce-2162b87f50ac";

/**
 * What actually happened to a mission, in words a visitor can read.
 *
 *   delivered  it finished the job
 *   open       nothing has ended it yet, so it is still on the board
 *   stopped    it ended without delivering
 */
export type MissionOutcome = "delivered" | "open" | "stopped";

/** Orchestrator statuses that mean the mission finished the job. */
export const DELIVERED_MISSION_STATUSES = ["completed", "done", "succeeded"] as const;

/**
 * Orchestrator statuses that mean the mission is still live. `blocked` and
 * `waiting_approval` belong here, not in `stopped`: a mission waiting on a
 * human has not ended, it is waiting, and calling that "stopped" would be
 * the same class of lie the audit caught.
 */
export const OPEN_MISSION_STATUSES = [
  "running",
  "queued",
  "proposed",
  "dispatched",
  "blocked",
  "waiting_approval",
] as const;

// Everything else - halted, failed, cancelled, completed_with_failures - ended
// without delivering. Derived as the remainder rather than listed, so a status
// nobody anticipated reads as "stopped" instead of vanishing from the counts.

/** Row status to outcome word. Unknown statuses read as `stopped`, never as a win. */
export function missionOutcome(status: string | null | undefined): MissionOutcome {
  const s = (status ?? "").toLowerCase();
  if ((DELIVERED_MISSION_STATUSES as readonly string[]).includes(s)) return "delivered";
  if ((OPEN_MISSION_STATUSES as readonly string[]).includes(s)) return "open";
  return "stopped";
}

/** What one agent's step came to. Same doctrine, one level down. */
export type DemoStepState = "done" | "working" | "planned" | "stopped";

/**
 * Step statuses use their own vocabulary: this table writes `done`, not
 * `completed`. Matching on "completed" alone silently reports a finished
 * four-agent trace as zero work done, which is how a real demo mission gets
 * passed over for a stalled one.
 */
export function stepState(status: string | null | undefined): DemoStepState {
  const s = (status ?? "").toLowerCase();
  if (s === "done" || s === "completed" || s === "succeeded") return "done";
  if (s === "running" || s === "dispatched" || s === "in_progress") return "working";
  if (s === "planned" || s === "queued" || s === "pending") return "planned";
  return "stopped";
}

export type DemoOverview = {
  workspaceName: string;
  openOpportunities: number;
  decisionsRecorded: number;
  /** Missions that finished the job. */
  missionsDelivered: number;
  /** Missions still live: running, queued, proposed, or waiting on a human. */
  missionsOpen: number;
  /** Missions that ended without delivering. */
  missionsStopped: number;
};

export const getDemoOverview = createServerFn({ method: "GET" }).handler(
  async (): Promise<DemoOverview> => {
    const [ws, opps, decisions, missionsTotal, missionsDelivered, missionsOpen] = await Promise.all(
      [
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
          .eq("workspace_id", DEMO_WORKSPACE_ID),
        supabaseAdmin
          .from("missions")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", DEMO_WORKSPACE_ID)
          .in("status", DELIVERED_MISSION_STATUSES as unknown as string[]),
        supabaseAdmin
          .from("missions")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", DEMO_WORKSPACE_ID)
          .in("status", OPEN_MISSION_STATUSES as unknown as string[]),
      ],
    );

    const total = missionsTotal.count ?? 0;
    const delivered = missionsDelivered.count ?? 0;
    const open = missionsOpen.count ?? 0;

    return {
      workspaceName: ws.data?.name ?? "the demo workspace",
      openOpportunities: opps.count ?? 0,
      decisionsRecorded: decisions.count ?? 0,
      missionsDelivered: delivered,
      missionsOpen: open,
      // The remainder, so the three always add up to every mission in the
      // workspace. Clamped only against a torn read across the parallel
      // counts; it can never invent a mission that is not there.
      missionsStopped: Math.max(0, total - delivered - open),
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

export type DemoMissionStep = {
  agentSlug: string | null;
  subGoal: string | null;
  state: DemoStepState;
};

export type DemoMissionTrace = {
  title: string;
  outcome: MissionOutcome;
  createdAt: string;
  /** When it finished, when it did. Null while a mission is still open. */
  finishedAt: string | null;
  steps: DemoMissionStep[];
};

/** The shape the picker ranks. Kept plain so the ranking is pure and testable. */
export type MissionCandidate = {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  finishedAt: string | null;
};

/**
 * How good a demonstration of the loop this mission is, lowest is best.
 *
 * The audit found this page headlining "One mission, in motion" over the
 * NEWEST mission, which was a 16-day-old halted chore. Newest is not the same
 * as best, and on a launch page it was neither. The ranking below prefers
 * proof the loop closes - a delivered mission with agents that actually
 * finished their steps - and only reaches a stopped one when the workspace
 * genuinely holds nothing better. It never dresses a stop up as motion: the
 * outcome travels with the mission and the page states it.
 */
export function missionDemoRank(candidate: MissionCandidate, finishedSteps: number): number {
  const outcome = missionOutcome(candidate.status);
  if (outcome === "delivered") return finishedSteps > 0 ? 0 : 2;
  if (outcome === "open") return finishedSteps > 0 ? 1 : 3;
  return finishedSteps > 0 ? 4 : 5;
}

/**
 * Pick the mission that best demonstrates the loop. Ties break on the most
 * recent finish, then the most recent start, so among equally good evidence
 * the freshest wins.
 */
export function pickDemoMission(
  candidates: MissionCandidate[],
  finishedStepsByMission: Map<string, number>,
): MissionCandidate | null {
  let best: MissionCandidate | null = null;
  let bestRank = Number.POSITIVE_INFINITY;
  let bestTime = Number.NEGATIVE_INFINITY;

  for (const c of candidates) {
    const rank = missionDemoRank(c, finishedStepsByMission.get(c.id) ?? 0);
    const time = Date.parse(c.finishedAt ?? c.createdAt);
    const at = Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time;
    if (rank < bestRank || (rank === bestRank && at > bestTime)) {
      best = c;
      bestRank = rank;
      bestTime = at;
    }
  }

  return best;
}

export const getDemoMissionTrace = createServerFn({ method: "GET" }).handler(
  async (): Promise<DemoMissionTrace | null> => {
    // Two reads, both scoped to the one demo workspace. The limits are far
    // above the seeded volume (33 missions, ~55 steps); ordering newest-first
    // means a workspace that ever outgrew them still ranks recent work, and
    // an unseen older mission can only be passed over, never miscounted.
    const [missionsRes, stepsRes] = await Promise.all([
      supabaseAdmin
        .from("missions")
        .select("id,title,status,created_at,completed_at")
        .eq("workspace_id", DEMO_WORKSPACE_ID)
        .order("created_at", { ascending: false })
        .limit(500),
      supabaseAdmin
        .from("mission_steps")
        .select("mission_id,agent_slug,sub_goal,status,idx")
        .eq("workspace_id", DEMO_WORKSPACE_ID)
        .order("idx", { ascending: true })
        .limit(4000),
    ]);

    const candidates: MissionCandidate[] = (missionsRes.data ?? []).map((m) => ({
      id: m.id,
      title: m.title,
      status: m.status,
      createdAt: m.created_at,
      finishedAt: m.completed_at,
    }));
    if (candidates.length === 0) return null;

    const steps = stepsRes.data ?? [];
    const finishedByMission = new Map<string, number>();
    for (const s of steps) {
      if (stepState(s.status) !== "done") continue;
      finishedByMission.set(s.mission_id, (finishedByMission.get(s.mission_id) ?? 0) + 1);
    }

    const mission = pickDemoMission(candidates, finishedByMission);
    if (!mission) return null;

    const outcome = missionOutcome(mission.status);
    return {
      title: mission.title,
      outcome,
      createdAt: mission.createdAt,
      // Only a mission that actually ended gets a finish time. An open
      // mission reports null rather than borrowing its start.
      finishedAt: outcome === "open" ? null : mission.finishedAt,
      steps: steps
        .filter((s) => s.mission_id === mission.id)
        .map((s) => ({
          agentSlug: s.agent_slug,
          subGoal: s.sub_goal,
          state: stepState(s.status),
        })),
    };
  },
);
