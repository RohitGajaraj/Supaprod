/**
 * The seven stages of one run, resolved from the record.
 *
 * WHY THIS EXISTS. The run screen used to be able to speak about exactly one
 * stage, Build, because that is the only one a `missions` row knows about by
 * itself. The founder's complaint on 2026-07-29 was that the spine reads as
 * Build and nothing else: "for everything right from Discover to Ship it's not
 * well thought through ... it should not be half done, half baked cookie".
 *
 * So the lineage is walked properly, once, on the server:
 *
 *   mission
 *     -> studio_changesets.mission_id           the build, and the ship
 *          -> prds (via changeset.prd_id)       the spec
 *               -> opportunities                what was noticed   (01 Discover)
 *               -> decisions.prd_id             the call           (02 Decide)
 *               -> prd_flows.prd_id             the plan           (03 Plan)
 *               -> prd_scaffolds.prd_id         the drawing        (04 Design)
 *               -> learnings.prd_id             what it taught     (07 Learn)
 *
 * `decisions` and `learnings` also carry `mission_id`, so a run dispatched
 * without a spec still resolves those two directly. That is the whole reason
 * both edges are queried rather than only the spec path.
 *
 * THE RULE THIS FILE OBEYS, AND IT IS THE IMPORTANT ONE. A stage with no row
 * behind it returns state `quiet` and a note that says so in plain words. It
 * never borrows a neighbouring stage's fact, never counts something it did not
 * read, and never renders a stage as finished because the run moved past it.
 * The prototype's strip says "04 Design - no surface to change", which is a
 * real editorial judgement a person made about one run; this function cannot
 * make that judgement, so where it does not know it says it does not know.
 * That is the same discipline that made the earlier build agent refuse to draw
 * a fabricated diffstat, applied one layer up.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { AGENT_STATION_ORDER, type AgentStation } from "@/lib/agent-vocabulary";

/** Mirrors RunStageState in components/shell/run-strip.tsx. */
export type RunStageState = "done" | "working" | "gate" | "next" | "quiet";

export type RunStageFact = {
  station: AgentStation;
  state: RunStageState;
  /** The stage's second line, in the run's own words. Never a status word. */
  note: string;
  /**
   * Where the evidence for this stage lives, when it has a home the user can
   * open. Null means the stage panel renders what it has and offers no exit.
   */
  href: string | null;
};

export type RunStages = {
  stages: RunStageFact[];
  /** The stage the run is actually in, which is where the screen opens. */
  focus: AgentStation;
};

type PrdRow = {
  id: string;
  title: string;
  status: string;
  opportunity_id: string | null;
  shipped_at: string | null;
  design_gate_status: string | null;
};

/** Plain-words count, because "1 signals" is how software sounds. */
function count(n: number, one: string, many: string): string {
  return n === 1 ? `1 ${one}` : `${n} ${many}`;
}

export const getRunStages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ missionId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }): Promise<RunStages> => {
    const { supabase } = context;
    const { missionId } = data;

    // Everything below is RLS-scoped to the caller by the middleware's client,
    // so a mission in another workspace resolves to an empty, honest strip
    // rather than leaking a neighbour's lineage.
    const [{ data: missionRow }, { data: csRows }, { data: runRows }] = await Promise.all([
      supabase
        .from("missions")
        .select("id,status,current_agent_id,created_at,completed_at")
        .eq("id", missionId)
        .maybeSingle(),
      // No file_count here: `studio_changesets` has no such column. It is a
      // derived figure elsewhere in the codebase, computed from the child rows,
      // and it is counted the same way below rather than selected as if it were
      // stored. Selecting a column that does not exist fails at runtime and NOT
      // at tsc, because Supabase select strings are loosely typed.
      supabase
        .from("studio_changesets")
        .select("id,status,prd_id,pr_number,repo")
        .eq("mission_id", missionId)
        .order("created_at", { ascending: false }),
      supabase.from("agent_runs").select("id,status").eq("mission_id", missionId),
    ]);

    const mission = missionRow as {
      id: string;
      status: string;
      current_agent_id: string | null;
      created_at: string;
      completed_at: string | null;
    } | null;

    const changeset =
      (
        (csRows ?? []) as Array<{
          id: string;
          status: string;
          prd_id: string | null;
          pr_number: number | null;
          repo: string | null;
        }>
      )[0] ?? null;

    const runs = (runRows ?? []) as Array<{ id: string; status: string }>;
    const missionLive = mission?.status === "running" || mission?.status === "queued";
    const runLive = runs.some((r) => ["queued", "running", "waiting_approval"].includes(r.status));
    const live = missionLive || runLive;
    const gated = runs.some((r) => r.status === "waiting_approval");

    // The spec. Two ways in, because a run dispatched from a goal has no
    // changeset and therefore no prd_id on it.
    let prd: PrdRow | null = null;
    if (changeset?.prd_id) {
      const { data } = await supabase
        .from("prds")
        .select("id,title,status,opportunity_id,shipped_at,design_gate_status")
        .eq("id", changeset.prd_id)
        .maybeSingle();
      prd = (data as PrdRow | null) ?? null;
    }

    // The four spec-hung stages plus the two mission-hung ones, in one round.
    const prdId = prd?.id ?? null;
    const [
      { data: decisionRows },
      { data: learningRows },
      { data: flowRows },
      { data: scaffoldRows },
      { data: oppRows },
      { data: approvalRows },
    ] = await Promise.all([
      prdId
        ? supabase
            .from("decisions")
            .select("id,title,rationale,created_at")
            .or(`prd_id.eq.${prdId},mission_id.eq.${missionId}`)
            .order("created_at", { ascending: false })
            .limit(1)
        : supabase
            .from("decisions")
            .select("id,title,rationale,created_at")
            .eq("mission_id", missionId)
            .order("created_at", { ascending: false })
            .limit(1),
      prdId
        ? supabase
            .from("learnings")
            .select("id,summary,metric_label,metric_value")
            .or(`prd_id.eq.${prdId},mission_id.eq.${missionId}`)
            .order("created_at", { ascending: false })
            .limit(1)
        : supabase
            .from("learnings")
            .select("id,summary,metric_label,metric_value")
            .eq("mission_id", missionId)
            .order("created_at", { ascending: false })
            .limit(1),
      prdId
        ? supabase.from("prd_flows").select("id,steps").eq("prd_id", prdId).limit(1)
        : Promise.resolve({ data: null }),
      prdId
        ? supabase.from("prd_scaffolds").select("id,source").eq("prd_id", prdId).limit(1)
        : Promise.resolve({ data: null }),
      prd?.opportunity_id
        ? supabase
            .from("opportunities")
            .select("id,title,theme_id")
            .eq("id", prd.opportunity_id)
            .limit(1)
        : Promise.resolve({ data: null }),
      supabase
        .from("agent_approvals")
        .select("id,status,agent_slug")
        .eq("mission_id", missionId)
        .eq("status", "pending"),
    ]);

    const decision =
      ((decisionRows ?? []) as Array<{ id: string; title: string | null }>)[0] ?? null;
    const learning =
      (
        (learningRows ?? []) as Array<{
          id: string;
          summary: string;
          metric_label: string | null;
          metric_value: string | null;
        }>
      )[0] ?? null;
    const flow = ((flowRows ?? []) as Array<{ id: string; steps: unknown }>)[0] ?? null;
    const scaffold = ((scaffoldRows ?? []) as Array<{ id: string; source: string }>)[0] ?? null;
    const opportunity =
      ((oppRows ?? []) as Array<{ id: string; title: string; theme_id: string | null }>)[0] ?? null;
    const pendingApprovals = (approvalRows ?? []) as Array<{ agent_slug: string | null }>;

    // How many signals stand behind the opportunity this run came from.
    // `opportunities` has no evidence counter of its own; signals and
    // opportunities meet on `theme_id`, so that join IS the evidence, and it is
    // counted rather than estimated. No theme means no count, and the stage
    // then names the opportunity instead of showing a zero it did not measure.
    // The file count, counted. `head: true` so this is a COUNT and not a read
    // of every file's content just to measure the length of the list.
    let fileCount: number | null = null;
    if (changeset) {
      const { count: n } = await supabase
        .from("studio_changes")
        .select("id", { count: "exact", head: true })
        .eq("changeset_id", changeset.id);
      fileCount = typeof n === "number" ? n : null;
    }

    let signalCount: number | null = null;
    if (opportunity?.theme_id) {
      const { count: n } = await supabase
        .from("signals")
        .select("id", { count: "exact", head: true })
        .eq("theme_id", opportunity.theme_id);
      signalCount = typeof n === "number" ? n : null;
    }

    /* ---------------- 01 Discover ---------------- */
    const discover: RunStageFact = opportunity
      ? {
          station: "sense",
          state: "done",
          note:
            signalCount && signalCount > 0
              ? count(signalCount, "signal", "signals")
              : opportunity.title,
          href: "/discover",
        }
      : {
          station: "sense",
          state: "quiet",
          // Honest, and deliberately not "no signals": we did not read zero
          // signals, we read no link from this run back to any.
          note: "not traced to a signal",
          href: null,
        };

    /* ---------------- 02 Decide ---------------- */
    const decide: RunStageFact = decision
      ? { station: "decide", state: "done", note: "the call is on the record", href: "/decide" }
      : { station: "decide", state: "quiet", note: "no decision recorded", href: null };

    /* ---------------- 03 Plan ---------------- */
    const stepCount = Array.isArray(flow?.steps) ? (flow.steps as unknown[]).length : 0;
    const plan: RunStageFact = prd
      ? {
          station: "define",
          state: "done",
          note: stepCount > 0 ? count(stepCount, "step", "steps") : prd.title,
          href: `/prds/${prd.id}`,
        }
      : { station: "define", state: "quiet", note: "no spec behind this run", href: null };

    /* ---------------- 04 Design ---------------- */
    const design: RunStageFact = scaffold
      ? {
          station: "design",
          state: prd?.design_gate_status === "pending" ? "gate" : "done",
          note:
            prd?.design_gate_status === "pending"
              ? "waiting on your call"
              : scaffold.source === "speculative"
                ? "drawn while you reviewed"
                : "a scaffold was drawn",
          href: prd ? `/prds/${prd.id}` : null,
        }
      : { station: "design", state: "quiet", note: "nothing was drawn", href: null };

    /* ---------------- 05 Build ---------------- */
    const buildNote = gated
      ? "waiting on your call"
      : live
        ? "writing the change"
        : changeset && fileCount != null && fileCount > 0
          ? count(fileCount, "file", "files")
          : changeset
            ? "the change is staged"
            : runs.length > 0
              ? "the run finished"
              : "not started";
    const build: RunStageFact = {
      station: "build",
      state: gated ? "gate" : live ? "working" : changeset || runs.length > 0 ? "done" : "quiet",
      note: buildNote,
      href: null,
    };

    /* ---------------- 06 Ship ---------------- */
    const shipState: RunStageState = !changeset
      ? "quiet"
      : changeset.status === "merged"
        ? "done"
        : changeset.status === "pr_open"
          ? "next"
          : "quiet";
    const ship: RunStageFact = {
      station: "ship",
      state: shipState,
      note: !changeset
        ? "nothing to ship yet"
        : changeset.status === "merged"
          ? prd?.shipped_at
            ? "merged and shipped"
            : "merged"
          : changeset.status === "pr_open"
            ? changeset.pr_number != null
              ? `pull request ${changeset.pr_number}, your call`
              : "pull request open, your call"
            : "not opened yet",
      href: null,
    };

    /* ---------------- 07 Learn ---------------- */
    const learn: RunStageFact = learning
      ? {
          station: "learn",
          state: "done",
          note:
            learning.metric_label && learning.metric_value
              ? `${learning.metric_label} ${learning.metric_value}`
              : "it recorded what happened",
          href: "/learn",
        }
      : {
          station: "learn",
          state: changeset?.status === "merged" ? "next" : "quiet",
          note: changeset?.status === "merged" ? "waiting on the outcome" : "not yet",
          href: null,
        };

    const byStation: Record<AgentStation, RunStageFact> = {
      sense: discover,
      decide,
      define: plan,
      design,
      build,
      ship,
      learn,
    };
    const stages = AGENT_STATION_ORDER.map((s) => byStation[s]);

    // Where the screen opens: whatever needs a human first, else whatever is
    // moving, else the furthest stage that actually happened. A run you come
    // back to after it finished should open on its result, not on its origin.
    const gate = stages.find((s) => s.state === "gate");
    const working = stages.find((s) => s.state === "working");
    const lastDone = [...stages].reverse().find((s) => s.state === "done");
    const focus = (gate ?? working ?? lastDone ?? byStation.build).station;

    // `pendingApprovals` is read but only used to prove a gate exists on this
    // mission; the Build stage above already reflects it through `gated`.
    void pendingApprovals;

    return { stages, focus };
  });
