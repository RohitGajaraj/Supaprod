/**
 * Mission server functions (Bundle 4).
 *
 * A mission groups multiple agent_runs under one operator intent. These fns
 * feed the /missions/$id page: the mission row, its ordered hops (runs), and
 * the structured A2A messages between them.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isSideEffectingTool } from "@/lib/tool-consequences";
import { recordStageEvent } from "@/lib/stage-events.server";
import { runAgentLoop } from "@/lib/ai/loop.server";

type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

export type MissionDetail = {
  mission: {
    id: string;
    title: string;
    goal: string;
    status: string;
    current_agent_id: string | null;
    hop_count: number;
    created_at: string;
    updated_at: string;
    completed_at: string | null;
    /** D4-REPLAY: the mission this one was replayed from (null otherwise). */
    replayed_from_mission_id: string | null;
    /**
     * RPT-24: the accountable owner + dispatch origin, rendered on the mission
     * receipt so accountability never silently transfers to the agent.
     * `missions.user_id` is NOT NULL at the DB level (no default) — a mission
     * literally cannot be created without an owning human, so this is never
     * null in practice; it is typed nullable only so a resolution failure
     * degrades to an honest "unknown" instead of a thrown page.
     */
    captain: {
      owner_user_id: string;
      owner_is_self: boolean;
      /** From workspace_members_with_identity (own-row-only RLS on `profiles`
       * otherwise blocks reading a teammate's name) — null if unresolved. */
      owner_display_name: string | null;
      owner_email: string | null;
      /** true when a reactor/trigger tick auto-promoted this mission
       * (`auto_trigger_source='auto'`) rather than a human clicking launch. */
      auto_dispatched: boolean;
    } | null;
  };
  /** Aggregated from ai_events over the mission's run traces (F-DESIGN-EMBER
   * screen 4: the detail hero's started/cost/tokens/trace stat row). */
  usage: {
    cost_usd: number;
    tokens_in: number;
    tokens_out: number;
    /** First hop's trace id — the mission's entry point into /traces. */
    trace_id: string | null;
  };
  hops: {
    run_id: string;
    agent_slug: string;
    agent_name: string;
    status: string;
    input: string;
    output: string | null;
    created_at: string;
    last_checkpoint_at: string | null;
    trace_id: string | null;
    step_index: number;
    steps: HopStep[];
    tool_calls: HopToolCall[];
    recalled_memories: string[];
  }[];
  messages: {
    id: string;
    from_agent_slug: string | null;
    to_agent_slug: string | null;
    kind: string;
    payload: JsonValue;
    source_run_id: string | null;
    source_trace_id: string | null;
    consumed_by_run_id: string | null;
    created_at: string;
  }[];
};

export type HopStep =
  | { kind: "thought"; text: string }
  | {
      kind: "tool_call";
      name: string;
      args: JsonValue;
      reason?: string;
      ok: boolean;
      result?: JsonValue;
      error?: string;
      approval_id?: string;
      status: "executed" | "queued" | "error" | "denied";
    }
  | { kind: "final"; message: string };

export type HopToolCall = {
  id: string;
  tool_name: string;
  ok: boolean;
  error: string | null;
  latency_ms: number;
  created_at: string;
  /**
   * v6 Phase 2 (W2): true when this was a side-effecting tool that ran inline
   * with no human gate (the agent's trust arc dialed it to auto). Every
   * tool_calls row IS an inline execution — gated tools queue an approval
   * instead of writing here — so a side-effecting one is unattended delegation.
   */
  is_unattended: boolean;
};

export type MissionListRow = {
  id: string;
  title: string;
  goal: string;
  status: string;
  hop_count: number;
  current_agent_id: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  /** Ordered step statuses for the row's StepDot strip — mission_steps when
   * orchestrated, else the run statuses. Empty for queued missions. */
  steps: { status: string }[];
  /** Summed ai_events est_cost_usd over the mission's traces; null = unknown
   * (no checkpointed traces yet) — render "—", never a fake $0.00. */
  cost_usd: number | null;
  /**
   * The slug of the agent on this mission's most recent run, so a reader can
   * NAME the agent. `current_agent_id` is a uuid, needs the roster to resolve,
   * and is not reliably set: the live workspace's one running mission has none.
   * Null only when the mission has never run.
   */
  current_agent_slug: string | null;
  /**
   * The track this mission's work belongs to, when a run recorded one.
   *
   * REQ-023. `missions` has NO `track_id` column — asking for one there returns
   * 42703 and takes the whole read down — so the link lives on the run and is
   * carried up here, because the shell-facing type IS the contract and AppFrame
   * cannot read a column this row does not name.
   *
   * THREE HONEST STATES, and the null is not a failure: a live line opens
   * `/track/:trackId` when the run knew its track, falls back to the mission
   * door when it did not (runs that predate the loop), and falls back again to
   * `driven_at` freshness when the mission has never run at all.
   */
  trackId: string | null;
  /**
   * WHAT THIS MISSION IS ACTUALLY DOING: the `sub_goal` of its in-flight step —
   * the sentence the planner wrote when it cut the goal into steps, e.g.
   * "Implement a /health JSON endpoint and a plain landing page in the starter
   * app, preparing a multi-file changeset".
   *
   * WHY IT IS WORTH CARRYING. Every live-agent surface could say a NAME and a
   * STATE and nothing else, so the strongest thing this product does — a named
   * agent reasoning about one specific piece of work — read as a spinner with a
   * name on it. The sentence was already written, already stored, and already
   * fetched adjacent: `mission_steps` is queried below for the step dots, so
   * this is one more column on a query that was running anyway.
   *
   * WHICH STEP, exactly. The lowest-idx step whose status is `running`, else
   * the lowest-idx `dispatched` one. A dispatched step is work an agent already
   * holds: mission-advance.server.ts:418-419 flips it to `running` only once
   * its run reports running, so excluding it would blank the line for the first
   * stretch of every step. `waiting_approval` is deliberately NOT in the set —
   * that step is waiting on a PERSON, and reporting it as an agent working
   * would be the one lie this indicator exists to avoid.
   *
   * NULL IS COMMON AND IS THE HONEST ANSWER. A mission with no step in either
   * state gets null, and so does every single-run mission, which has no
   * `mission_steps` rows at all (the step dots fall back to run statuses for
   * exactly that reason). A caller must fall back to the mission title, never
   * invent a sentence.
   *
   * `mission_steps.sub_goal` is NOT NULL in the schema
   * (supabase/migrations/20260606120924_1647f92e-4f06-48eb-8737-19e70211d791.sql:9)
   * and measured non-empty on 291 of 291 rows on 2026-08-06, so a mission with
   * a live step reliably has one to show.
   */
  current_sub_goal: string | null;
  /** Which build engine ran this mission (missions.build_driver), or null.
   * Named honestly for the user via buildDriverLabel (Gate #1 B3). */
  build_driver: string | null;
};

export const listMissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        productId: z.string().uuid().optional(),
        workspaceId: z.string().uuid().optional(),
      })
      .optional()
      .parse(i ?? {}),
  )
  .handler(
    async ({
      context,
      data: input,
    }): Promise<{
      missions: MissionListRow[];
      /**
       * Every blocked mission, not just the first page. See the note below.
       *
       * **NULL WHEN THE COUNT COULD NOT BE TAKEN, never 0.** S2 made the call
       * and it is right: a failed read degrading to zero puts "Waiting on you 0"
       * at the head of the lane whose entire job is saying what needs a person.
       * That is a false all-clear produced by a broken read, which is the exact
       * failure this repo has spent two days removing. A count that cannot be
       * taken is not a count of zero, and the surface renders the row count with
       * no total claim rather than printing a number it does not have.
       */
      totalBlocked: number | null;
      /** When the longest-waiting one last moved, so a count can say if it is stale. */
      oldestBlockedAt: string | null;
    }> => {
      const { supabase } = context;

      // Build-face scoping: a mission carries only workspace_id, so its product
      // link lives on the studio_changeset it produced (product_id) or on the
      // spec it was dispatched from (prds.product_id → the prd→mission lineage
      // edge). When a productId is given, restrict to exactly that product's
      // builds; no builds yet is an honest empty state, never a cross-product leak.
      let productMissionIds: string[] | null = null;
      if (input?.productId) {
        const productId = input.productId;
        const [{ data: csRows }, { data: prdRows }] = await Promise.all([
          supabase.from("studio_changesets").select("mission_id").eq("product_id", productId),
          supabase.from("prds").select("id").eq("product_id", productId),
        ]);
        const set = new Set<string>();
        for (const r of (csRows ?? []) as { mission_id: string | null }[]) {
          if (r.mission_id) set.add(r.mission_id);
        }
        const prdIds = ((prdRows ?? []) as { id: string }[]).map((p) => p.id);
        if (prdIds.length) {
          const { data: edges } = await supabase
            .from("artifact_lineage")
            .select("child_id")
            .eq("parent_kind", "prd")
            .in("parent_id", prdIds)
            .eq("child_kind", "mission");
          for (const e of (edges ?? []) as { child_id: string | null }[]) {
            if (e.child_id) set.add(e.child_id);
          }
        }
        productMissionIds = [...set];
        if (productMissionIds.length === 0)
          return { missions: [], totalBlocked: null, oldestBlockedAt: null };
      }

      let query = supabase
        .from("missions")
        .select(
          "id,title,goal,status,hop_count,current_agent_id,created_at,updated_at,completed_at,build_driver",
        )
        .order("updated_at", { ascending: false })
        .limit(50);
      if (input?.workspaceId) query = query.eq("workspace_id", input.workspaceId);
      if (productMissionIds) query = query.in("id", productMissionIds);
      const { data, error } = await query;
      if (error) throw new Error(error.message);

      /*
       * ── THE COUNT IS NOT THE LIST, AND THE CAP IS ONLY RIGHT FOR ONE ────────
       *
       * `.limit(50)` bounds the ROWS, which is correct: a lane must not render a
       * thousand of them. It also silently bounded the NUMBER, which is not.
       *
       * S2 measured what that costs on one screen: the Waiting-on-you lane read
       * 35 while the station strip above it read 89 for the same population, six
       * words apart. `use-spine-strip.ts` already records that shape as the thing
       * that makes a screen read as broken, and it is worse than a wrong number
       * because the reader can see both and knows one is lying.
       *
       * So the cap stays on the rows and the count is asked for exactly, with
       * `head: true` so no row travels for it. **The statuses are the ones the
       * board actually routes on** rather than a second opinion about what
       * "blocked" means: two definitions of stuck is how this disagreement
       * started.
       *
       * `oldestBlockedAt` travels with it because a count alone cannot say
       * whether the pile is fresh or a month old, and the lane's whole job is
       * "what needs a person soonest".
       */
      const BLOCKED_STATUSES = ["failed", "halted", "cancelled", "blocked", "proposed"] as const;
      let totalBlocked: number | null = null;
      let oldestBlockedAt: string | null = null;
      try {
        let countQ = supabase
          .from("missions")
          .select("id", { count: "exact", head: true })
          .in("status", BLOCKED_STATUSES as unknown as string[]);
        if (input?.workspaceId) countQ = countQ.eq("workspace_id", input.workspaceId);
        if (productMissionIds) countQ = countQ.in("id", productMissionIds);
        const { count } = await countQ;
        totalBlocked = count ?? null;

        let oldestQ = supabase
          .from("missions")
          .select("updated_at")
          .in("status", BLOCKED_STATUSES as unknown as string[])
          .order("updated_at", { ascending: true })
          .limit(1);
        if (input?.workspaceId) oldestQ = oldestQ.eq("workspace_id", input.workspaceId);
        if (productMissionIds) oldestQ = oldestQ.in("id", productMissionIds);
        const { data: oldest } = await oldestQ;
        oldestBlockedAt = (oldest?.[0] as { updated_at?: string } | undefined)?.updated_at ?? null;
      } catch {
        // Best-effort, like the enrichment below. A lane that cannot count still
        // renders its rows; it simply does not claim a total it does not have.
        // NULL rather than 0. A failed read degrading to zero puts "Waiting on
        // you 0" at the head of the lane whose job is saying what needs a person,
        // which is a false all-clear produced by a broken read. A count that
        // cannot be taken is not a count of zero.
        totalBlocked = null;
      }

      const missions = data ?? [];
      if (missions.length === 0) return { missions: [], totalBlocked, oldestBlockedAt };
      const ids = missions.map((m) => m.id);

      // Batched enrichment (3 queries across ALL rows, never per-mission):
      // step dots AND the in-flight step's sub_goal from mission_steps; run
      // fallback + trace ids from agent_runs + latest checkpoints; cost from
      // ai_events over those traces. Best-effort — any failure degrades to empty
      // dots / unknown cost / no sub_goal.
      const stepsByMission = new Map<string, { status: string }[]>();
      const runsByMission = new Map<string, { status: string }[]>();
      /**
       * The slug of the agent on a mission's MOST RECENT run.
       *
       * WHY THIS IS NOT `missions.current_agent_id`. That column is a uuid and it
       * is not reliably maintained: on the live workspace the one running mission
       * has none, so the shell header could not name the agent working on it and
       * fell back to "1 run working" with the generic crew mark. The product's
       * whole claim is that named agents do the work, and the most-seen line in
       * it could not name one.
       *
       * `agent_runs.agent_slug` is NOT NULL and is written by the thing that
       * actually runs. It is already fetched here for the step dots, so this
       * costs one extra column and no extra query. Same lesson as the seven-stage
       * strip: the fact existed, the reader was looking in the wrong place.
       */
      const slugByMission = new Map<string, string>();
      // REQ-023. Declared out here beside the slug rather than beside `missionByRun`,
      // because the row map below is outside that block — the first attempt put it
      // in the inner scope and tsc caught it at the read site.
      const trackByMission = new Map<string, string>();
      /**
       * The sentence the mission is on, keyed by mission. Two maps rather than
       * one, because `running` must beat `dispatched` no matter which arrives
       * first in idx order, and a single map with an overwrite rule could not
       * express that without re-reading what it had already written.
       *
       * Both are first-write-wins, which is what makes them "lowest idx": the
       * select below orders by idx ascending, so a mission's rows arrive in step
       * order and the earliest live step is the first one seen. This is the same
       * ordering the step dots already depend on — reverse it and the strip and
       * the sentence both silently describe the wrong step.
       */
      const runningGoalByMission = new Map<string, string>();
      const dispatchedGoalByMission = new Map<string, string>();
      const costByMission = new Map<string, number>();
      try {
        const [{ data: planSteps }, { data: runs }] = await Promise.all([
          supabase
            // `sub_goal` rides along on the query that was already fetching the
            // step dots. It is the only column here that carries a sentence.
            .from("mission_steps")
            .select("mission_id,idx,status,sub_goal")
            .in("mission_id", ids)
            .order("idx", { ascending: true }),
          supabase
            .from("agent_runs")
            /*
             * `track_id` SO A WORKING MISSION CAN NAME THE WORK IT SERVES.
             *
             * The loop writes it on every run (`loop.server.ts:610`), and this
             * select dropped it, so the rail's live line could never prove WHICH
             * piece of work was moving and fell back to the mission row. The
             * watchable address is `/track/:id`; a mission id is a container id.
             *
             * ON THE RUN AND NOT ON THE MISSION, deliberately: `missions` has no
             * `track_id` column at all (checked, not assumed), so asking for one
             * there returns 42703 and takes the whole read with it. The run is
             * where the link is written and therefore where it can be read.
             */
            .select("id,mission_id,status,created_at,agent_slug,track_id")
            .in("mission_id", ids)
            .order("created_at", { ascending: true }),
        ]);
        for (const s of planSteps ?? []) {
          const arr = stepsByMission.get(s.mission_id) ?? [];
          arr.push({ status: s.status });
          stepsByMission.set(s.mission_id, arr);
          // An empty sub_goal is not a sentence. The column is NOT NULL and every
          // row measured non-empty (291/291, 2026-08-06), but a blank one would
          // render as a stray empty line rather than as nothing, so it is dropped
          // here and the caller falls back to the title.
          const goal = (s.sub_goal ?? "").trim();
          if (!goal) continue;
          if (s.status === "running" && !runningGoalByMission.has(s.mission_id)) {
            runningGoalByMission.set(s.mission_id, goal);
          }
          if (s.status === "dispatched" && !dispatchedGoalByMission.has(s.mission_id)) {
            dispatchedGoalByMission.set(s.mission_id, goal);
          }
        }
        const missionByRun = new Map<string, string>();
        for (const r of runs ?? []) {
          if (!r.mission_id) continue;
          missionByRun.set(r.id, r.mission_id);
          const arr = runsByMission.get(r.mission_id) ?? [];
          arr.push({ status: r.status });
          runsByMission.set(r.mission_id, arr);
          // Ascending by created_at, so each row overwrites the one before it and
          // the last write per mission is its latest run. Reversing the order
          // here would silently pin every mission to its FIRST agent.
          if (r.agent_slug) slugByMission.set(r.mission_id, r.agent_slug);
          /*
           * REQ-023. Same last-non-null-wins rule as the slug directly above, and
           * for the same reason: the runs arrive ascending by `created_at`, so the
           * final write per mission is its most recent run that knew its track.
           *
           * NON-NULL rather than simply latest, deliberately. A mission's runs all
           * serve one piece of work, so an older run that recorded the track is
           * still telling the truth about which work this is, whereas a newer run
           * that recorded none is only telling us it predates the link. Taking the
           * newest value unconditionally would let a pre-loop run erase a good
           * answer and send the reader back to the mission door for no gain.
           */
          if (r.track_id) trackByMission.set(r.mission_id, r.track_id);
        }
        const runIds = [...missionByRun.keys()];
        if (runIds.length) {
          const { data: cps } = await supabase
            .from("agent_run_checkpoints")
            .select("run_id,step_index,state")
            .in("run_id", runIds)
            .order("step_index", { ascending: false });
          const missionByTrace = new Map<string, string>();
          const seenRun = new Set<string>();
          for (const cp of cps ?? []) {
            if (seenRun.has(cp.run_id)) continue;
            seenRun.add(cp.run_id);
            const traceId = (cp.state as { traceId?: string } | null)?.traceId;
            const missionId = missionByRun.get(cp.run_id);
            if (traceId && missionId) missionByTrace.set(traceId, missionId);
          }
          const traceIds = [...missionByTrace.keys()];
          if (traceIds.length) {
            const { data: events } = await supabase
              .from("ai_events")
              .select("trace_id,est_cost_usd")
              .in("trace_id", traceIds);
            for (const e of events ?? []) {
              const missionId = e.trace_id ? missionByTrace.get(e.trace_id) : undefined;
              if (!missionId) continue;
              costByMission.set(
                missionId,
                (costByMission.get(missionId) ?? 0) + Number(e.est_cost_usd ?? 0),
              );
            }
          }
        }
      } catch (e) {
        console.error("[missions] list enrichment failed (degrading):", e);
      }

      return {
        missions: missions.map((m) => ({
          ...m,
          steps: stepsByMission.get(m.id) ?? runsByMission.get(m.id) ?? [],
          cost_usd: costByMission.has(m.id) ? costByMission.get(m.id)! : null,
          current_agent_slug: slugByMission.get(m.id) ?? null,
          trackId: trackByMission.get(m.id) ?? null,
          // `running` first, then `dispatched`, then nothing. Never a done step:
          // a finished sentence presented in the present tense is the same defect
          // as a fabricated one.
          current_sub_goal:
            runningGoalByMission.get(m.id) ?? dispatchedGoalByMission.get(m.id) ?? null,
        })),
        totalBlocked,
        oldestBlockedAt,
      };
    },
  );

export const getMission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { missionId: string }) => z.object({ missionId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<MissionDetail> => {
    const { supabase } = context;
    const { data: mission, error } = await supabase
      .from("missions")
      .select("id,title,goal,status,current_agent_id,hop_count,created_at,updated_at,completed_at")
      .eq("id", data.missionId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!mission) throw new Error("Mission not found");

    // D4-REPLAY: resolve the branch link in a SEPARATE error-tolerant read so the
    // main mission select (and the whole detail page) keeps working before the
    // replayed_from migration applies. On a missing-column error, default null.
    const { data: rfRow, error: rfErr } = await supabase
      .from("missions")
      .select("replayed_from_mission_id")
      .eq("id", data.missionId)
      .maybeSingle();
    const replayedFrom =
      !rfErr && rfRow
        ? ((rfRow as { replayed_from_mission_id?: string | null }).replayed_from_mission_id ?? null)
        : null;

    // RPT-24 (captain on every dispatch): same error-tolerant separate-read
    // pattern as D4-REPLAY above, so a schema hiccup never breaks the page.
    // Resolves the owner's name via the existing membership-gated
    // workspace_members_with_identity RPC (workspaces.functions.ts) rather
    // than querying `profiles` directly — profiles RLS is own-row-only, so a
    // teammate's row is invisible to a plain select from this RLS-scoped
    // client.
    const { data: captainRow, error: captainErr } = await supabase
      .from("missions")
      .select("user_id,workspace_id,auto_trigger_source")
      .eq("id", data.missionId)
      .maybeSingle();
    let captain: MissionDetail["mission"]["captain"] = null;
    if (!captainErr && captainRow?.user_id) {
      const ownerId = captainRow.user_id as string;
      const workspaceId = (captainRow as { workspace_id?: string | null }).workspace_id ?? null;
      let ownerDisplayName: string | null = null;
      let ownerEmail: string | null = null;
      if (workspaceId) {
        const { data: identity, error: identityErr } = await supabase.rpc(
          "workspace_members_with_identity",
          { _workspace_id: workspaceId },
        );
        if (!identityErr && Array.isArray(identity)) {
          const match = (
            identity as { user_id: string; display_name: string | null; email: string | null }[]
          ).find((m) => m.user_id === ownerId);
          ownerDisplayName = match?.display_name ?? null;
          ownerEmail = match?.email ?? null;
        }
      }
      captain = {
        owner_user_id: ownerId,
        owner_is_self: ownerId === context.userId,
        owner_display_name: ownerDisplayName,
        owner_email: ownerEmail,
        auto_dispatched:
          ((captainRow as { auto_trigger_source?: string | null }).auto_trigger_source ?? null) ===
          "auto",
      };
    }

    // Pull trace_id from the first ai_events row per run (cheap, no join).
    const { data: runs } = await supabase
      .from("agent_runs")
      .select("id,agent_slug,agent_name,status,input,output,created_at,last_checkpoint_at")
      .eq("mission_id", data.missionId)
      .order("created_at", { ascending: true });

    const { data: messages } = await supabase
      .from("agent_messages")
      .select(
        "id,from_agent_slug,to_agent_slug,kind,payload,source_run_id,source_trace_id,consumed_by_run_id,created_at",
      )
      .eq("mission_id", data.missionId)
      .order("created_at", { ascending: true });

    const runIds = (runs ?? []).map((r) => r.id);
    // Latest checkpoint per run gives us in-flight progress: steps[] + traceId.
    const { data: cps } = runIds.length
      ? await supabase
          .from("agent_run_checkpoints")
          .select("run_id,step_index,state,created_at")
          .in("run_id", runIds)
          .order("step_index", { ascending: false })
      : {
          data: [] as {
            run_id: string;
            step_index: number;
            state: Record<string, unknown>;
            created_at: string;
          }[],
        };
    const latestByRun = new Map<string, { step_index: number; state: Record<string, unknown> }>();
    for (const row of (cps ?? []) as {
      run_id: string;
      step_index: number;
      state: Record<string, unknown>;
    }[]) {
      if (!latestByRun.has(row.run_id))
        latestByRun.set(row.run_id, { step_index: row.step_index, state: row.state });
    }
    const traceIds = [...latestByRun.values()]
      .map((cp) => (cp.state as { traceId?: string }).traceId)
      .filter((t): t is string => typeof t === "string" && t.length > 0);
    const { data: tcs } = traceIds.length
      ? await supabase
          .from("tool_calls")
          .select("id,trace_id,tool_name,ok,error,latency_ms,created_at")
          .in("trace_id", traceIds)
          .order("created_at", { ascending: true })
      : {
          data: [] as {
            id: string;
            trace_id: string;
            tool_name: string;
            ok: boolean;
            error: string | null;
            latency_ms: number;
            created_at: string;
          }[],
        };
    const tcByTrace = new Map<string, HopToolCall[]>();
    for (const t of (tcs ?? []) as {
      id: string;
      trace_id: string;
      tool_name: string;
      ok: boolean;
      error: string | null;
      latency_ms: number;
      created_at: string;
    }[]) {
      const arr = tcByTrace.get(t.trace_id) ?? [];
      arr.push({
        id: t.id,
        tool_name: t.tool_name,
        ok: t.ok,
        error: t.error,
        latency_ms: t.latency_ms,
        created_at: t.created_at,
        /* A `tool_calls` row is always an inline execution — a gated tool queues
           an approval instead — so this flag is asking whether the hop CHANGED
           anything without a person. It read `true` for every hop between
           2026-08-19 and 2026-08-22, when the predicate behind it was catalogue
           membership and the catalogue had just been completed to all 59 tools;
           a mission whose hops were all reads showed as fully unattended. It
           answers from the registry's `category` now. */
        is_unattended: isSideEffectingTool(t.tool_name),
      });
      tcByTrace.set(t.trace_id, arr);
    }

    // Hero stat row (screen 4): cost + tokens summed from ai_events over the
    // mission's traces; trace_id = the FIRST hop's trace (runs are ordered
    // created_at asc; traceIds order follows the checkpoint query, not hops).
    const firstHopTrace =
      (runs ?? [])
        .map((r) => (latestByRun.get(r.id)?.state as { traceId?: string } | undefined)?.traceId)
        .find((t): t is string => typeof t === "string" && t.length > 0) ?? null;
    const usage: MissionDetail["usage"] = {
      cost_usd: 0,
      tokens_in: 0,
      tokens_out: 0,
      trace_id: firstHopTrace,
    };
    if (traceIds.length) {
      const { data: events } = await supabase
        .from("ai_events")
        .select("est_cost_usd,prompt_tokens,completion_tokens")
        .in("trace_id", traceIds);
      for (const e of events ?? []) {
        usage.cost_usd += Number(e.est_cost_usd ?? 0);
        usage.tokens_in += e.prompt_tokens ?? 0;
        usage.tokens_out += e.completion_tokens ?? 0;
      }
    }

    return {
      mission: {
        ...mission,
        replayed_from_mission_id: replayedFrom,
        captain,
      } as MissionDetail["mission"],
      usage,
      hops: (runs ?? []).map((r) => {
        const cp = latestByRun.get(r.id);
        const state = (cp?.state ?? {}) as {
          traceId?: string;
          steps?: HopStep[];
          recalledMemories?: string[];
        };
        const traceId = state.traceId ?? null;
        return {
          run_id: r.id,
          agent_slug: r.agent_slug,
          agent_name: r.agent_name,
          status: r.status,
          input: r.input,
          output: r.output,
          created_at: r.created_at,
          last_checkpoint_at: (r as { last_checkpoint_at?: string }).last_checkpoint_at ?? null,
          trace_id: traceId,
          step_index: cp?.step_index ?? 0,
          steps: Array.isArray(state.steps) ? state.steps : [],
          tool_calls: traceId ? (tcByTrace.get(traceId) ?? []) : [],
          recalled_memories: Array.isArray(state.recalledMemories) ? state.recalledMemories : [],
        };
      }),
      messages: (messages ?? []) as MissionDetail["messages"],
    };
  });

/**
 * D4 (cancellation slice): the per-mission brake pedal. Stop a mission mid-run.
 *
 * Setting `missions.status='cancelled'` is sufficient to halt advancement — the
 * auto-advance tick selects missions by `.in("status", ["running","in_progress"])`
 * and `advanceMissionCore` early-returns for any non-running mission, so a
 * cancelled mission is never advanced (no loop surgery). But the resume cron
 * (`resume-runs.ts`) resumes individual `agent_runs` by their OWN status
 * (queued / running / waiting_approval), independent of the mission — so we MUST
 * also flip this mission's in-flight runs to cancelled, or the cron would keep
 * resuming orphaned children. We also: mark non-terminal `mission_steps`
 * cancelled (UI honesty); release any held Build file claims (the
 * `release_claims_for_terminal_run` trigger only fires on completed/halted/failed,
 * NOT cancelled, so they would otherwise orphan and block future builds); and
 * cancel this mission's pending approvals (so a cancelled mission stops asking
 * for your sign-off). Every write is RLS-scoped to the caller's own rows.
 *
 * No migration: `missions.status` and `agent_runs.status` carry no CHECK
 * constraint, and `agent_approvals.status` already allows 'cancelled'.
 */
export const cancelMission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { missionId: string }) => z.object({ missionId: z.string().uuid() }).parse(d))
  .handler(
    async ({
      context,
      data,
    }): Promise<{ cancelled: boolean; alreadyTerminal?: boolean; approvalsCancelled?: number }> => {
      const { supabase, userId } = context;
      const now = new Date().toISOString();
      // A stopped mission can't be cancelled — it already reached a terminal end.
      const TERMINAL = ["completed", "done", "failed", "halted", "cancelled"];
      const RUN_IN_FLIGHT = ["queued", "running", "dispatched", "waiting_approval"];
      const STEP_IN_FLIGHT = ["planned", "queued", "dispatched", "running", "waiting_approval"];

      const { data: mission, error: mErr } = await supabase
        .from("missions")
        .select("id,status,workspace_id")
        .eq("id", data.missionId)
        .maybeSingle();
      if (mErr) throw new Error(mErr.message);
      if (!mission) throw new Error("Mission not found");
      if (TERMINAL.includes(mission.status)) {
        return { cancelled: false, alreadyTerminal: true };
      }

      // 1. Flip the mission to cancelled — but ONLY if it is still non-terminal,
      //    so a mission that finished in the read→write window keeps its honest
      //    terminal state (no overwriting 'completed' with 'cancelled'). Ownership
      //    is already confirmed above (RLS would have nulled the select), so a
      //    null result here means it raced to a terminal status.
      const { data: updated, error: uErr } = await supabase
        .from("missions")
        .update({ status: "cancelled", completed_at: now })
        .eq("id", data.missionId)
        .not("status", "in", `(${TERMINAL.join(",")})`)
        .select("id")
        .maybeSingle();
      if (uErr) throw new Error(uErr.message);
      if (!updated) return { cancelled: false, alreadyTerminal: true };

      // SEAM-1: the operator cancelled this mission.
      await recordStageEvent(supabase, {
        entityType: "mission",
        entityId: data.missionId,
        from: mission.status,
        to: "cancelled",
        actor: "human",
        workspaceId: mission.workspace_id,
        userId,
      });

      // 2. Stop the cron resuming this mission's individual child runs.
      await supabase
        .from("agent_runs")
        .update({ status: "cancelled" })
        .eq("mission_id", data.missionId)
        .in("status", RUN_IN_FLIGHT);

      // 3. Reflect onto the plan (the tick never reads a cancelled mission's steps;
      //    this is purely so the cockpit shows the steps stopped, not stuck).
      await supabase
        .from("mission_steps")
        .update({ status: "cancelled" })
        .eq("mission_id", data.missionId)
        .in("status", STEP_IN_FLIGHT);

      // 4. Release held Build file claims (the terminal-run trigger skips
      //    'cancelled', so do it here or the per-(repo,path) locks orphan).
      await supabase
        .from("builder_file_claims")
        .update({ status: "released", released_at: now, released_reason: "mission_cancelled" })
        .eq("mission_id", data.missionId)
        .eq("status", "held");

      // 5. Cancel pending approvals tied to this mission's runs so it stops
      //    asking for sign-off (clears the Attention feed). Best-effort.
      let approvalsCancelled = 0;
      try {
        const { data: runs } = await supabase
          .from("agent_runs")
          .select("id")
          .eq("mission_id", data.missionId);
        const runIds = (runs ?? []).map((r) => (r as { id: string }).id);
        if (runIds.length) {
          const { data: appr } = await supabase
            .from("agent_approvals")
            .update({ status: "cancelled", decided_at: now })
            .in("run_id", runIds)
            .eq("status", "pending")
            .select("id");
          approvalsCancelled = (appr ?? []).length;
        }
      } catch (e) {
        console.error("[cancelMission] approval cleanup skipped (non-fatal):", e);
      }

      return { cancelled: true, approvalsCancelled };
    },
  );

/**
 * Manual override for the AI-synthesized title (`createMission` in
 * handoff.server.ts generates it at dispatch time) - same rename-affordance
 * pattern as renameConversation.
 *
 * RLS ("Owners can write their missions", cmd ALL, auth.uid() = user_id)
 * already blocks a cross-user rename, but the explicit user_id filter here
 * (matching cancelMission/promoteMission in this same file) means a missing
 * or misconfigured policy fails closed with a clear "not found" instead of a
 * silent zero-row update.
 */
export const renameMission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { missionId: string; title: string }) =>
    z.object({ missionId: z.string().uuid(), title: z.string().min(1).max(200) }).parse(d),
  )
  .handler(async ({ context, data }): Promise<{ ok: boolean }> => {
    const { supabase, userId } = context;
    const { data: updated, error } = await supabase
      .from("missions")
      .update({ title: data.title, updated_at: new Date().toISOString() })
      .eq("id", data.missionId)
      .eq("user_id", userId)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!updated) throw new Error("Mission not found");
    return { ok: true };
  });

/**
 * HITL gate: the human's "launch this mission" action. Flips a proposed mission
 * to 'running' AND actually starts the orchestrator on it.
 *
 * WHAT THIS USED TO SAY, AND WHY IT WAS WRONG. The old comment here promised
 * "promote a proposed mission to queued so the resume-runs cron picks it up",
 * and "the resume-runs executor only processes 'queued' missions". Neither is
 * true and neither ever was: every missions select in
 * src/routes/api/public/hooks/resume-runs.ts reads 'blocked' (:203) or
 * ['running','in_progress'] (:308, :344, :430) — the one `.eq("status","queued")`
 * in that file (:242) is on agent_runs, not missions. Nothing anywhere consumes a
 * mission at 'queued'. So the old write was a terminal state wearing a
 * non-terminal label: the toast said an agent would pick it up shortly, nothing
 * ever did, and the detail page then read the mission as live with no Start and
 * no Advance — only Cancel. Eight missions had been sitting there, the oldest 32
 * days, with zero steps and zero runs.
 *
 * WHAT DRIVES A MISSION, FOR REAL. `createMission` inserts at status 'running'
 * (src/lib/ai/handoff.server.ts) and `startOrchestratedMission` then calls
 * runAgentLoop('orchestrator', …) to plan and dispatch wave 0
 * (src/lib/orchestrator.functions.ts:112). From there the deterministic engine
 * carries it: resume-runs advances every running/in_progress mission through
 * advanceMissionCore, and re-plans one that never persisted a DAG. Launching is
 * therefore the same two moves, in that order, and this uses exactly that path
 * rather than inventing a second one.
 *
 * This fn enforces:
 *   - Caller owns the mission (RLS-scoped via the authenticated Supabase
 *     client — if the row is not visible, .maybeSingle() returns null).
 *   - Only a not-yet-started mission is accepted: 'proposed' (the trigger-tick's
 *     HITL gate) or 'queued'. 'queued' is accepted so the eight missions stranded
 *     by the old behaviour above are recoverable rather than dead — but note the
 *     door for it is not built yet: MissionOrchestratorDetail.tsx renders Launch
 *     only when status === 'proposed' (missionProposed, :820) and reads 'queued'
 *     as already-live (missionRunning, :816), so this half of the fix is
 *     unreachable from the UI until that component learns the difference. Every
 *     other status is rejected, so a running / completed / cancelled mission can
 *     never be relaunched.
 *   - The account has at least one enabled specialist agent, checked BEFORE the
 *     status flip so a roster-less launch leaves the mission 'proposed' and
 *     relaunchable rather than halted. This is the pre-flight
 *     startOrchestratedMission runs (orchestrator.functions.ts:70-81); an earlier
 *     version of this function skipped it, which bought a paid orchestrator plan
 *     whose every dispatch then failed on a missing agent. See the check itself
 *     for the one place it deliberately diverges from the path it mirrors.
 */
export const promoteMission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { missionId: string }) => z.object({ missionId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<{ ok: boolean; missionId: string }> => {
    const { supabase, userId } = context;
    const LAUNCHABLE = ["proposed", "queued"];

    const { data: mission, error: fetchErr } = await supabase
      .from("missions")
      .select("id,status,goal,workspace_id")
      .eq("id", data.missionId)
      .maybeSingle();
    if (fetchErr) throw new Error(fetchErr.message);
    if (!mission) throw new Error("Mission not found");
    if (!LAUNCHABLE.includes(mission.status)) {
      throw new Error(
        `Only a mission that has not started yet can be launched (current status: ${mission.status})`,
      );
    }

    // PRE-FLIGHT THE ROSTER BEFORE THE FLIP. startOrchestratedMission refuses to
    // start when the account has no enabled specialist
    // (orchestrator.functions.ts:70-81) and this path did not, which mattered more
    // than it looks: without the check the orchestrator model is paid for, plans a
    // DAG, and then every dispatch in it throws "Target agent 'X' is disabled or
    // not in the roster" (mission-advance.server.ts:722), each step terminalizes,
    // the skip-cascade takes the rest, and the mission lands
    // 'completed_with_failures' with nothing to show. Ordering is the whole value
    // here: refusing BEFORE the status flip leaves the mission at 'proposed' and
    // relaunchable once a specialist is enabled, where refusing after would leave
    // it halted.
    //
    // The filter is user-scoped with no workspace clause on purpose — it is the
    // same lookup dispatchReadySteps will actually perform (user_id + enabled,
    // mission-advance.server.ts:672-676), so this predicts that lookup rather than
    // approximating it.
    //
    // ONE DELIBERATE DIVERGENCE from the path it mirrors: the error is checked.
    // supabase-js resolves a refused or failed read, leaving `count` null, and
    // `(count ?? 0) === 0` would then report an empty roster as a fact when the
    // roster was never read. It fails closed either way, so the cost is only a
    // wrong reason — but a wrong reason is what sends someone to create agents
    // they already have.
    const { count: specialists, error: rosterErr } = await supabase
      .from("agents")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("enabled", true)
      .neq("slug", "orchestrator");
    if (rosterErr) {
      throw new Error(
        `Could not read your agent roster, so this mission was not launched: ${rosterErr.message}`,
      );
    }
    if ((specialists ?? 0) === 0) {
      throw new Error(
        "No specialist agents enabled. Create at least one specialist (e.g. discovery, strategist, builder) before launching this mission.",
      );
    }

    // 'running' is the live state the whole engine keys on, so the flip IS the
    // hand-off to the sweeper. Guarded on the status we read, so two clicks
    // cannot both launch. supabase-js RESOLVES a refused write, so an empty row
    // set here is the refusal case and must be read as one: without the
    // .select("id"), an RLS denial or a lost race would look identical to a
    // successful launch and we would go on to start an agent on a mission this
    // caller does not own.
    const { data: updated, error: updateErr } = await supabase
      .from("missions")
      .update({ status: "running", updated_at: new Date().toISOString() })
      .eq("id", data.missionId)
      .eq("status", mission.status)
      .select("id")
      .maybeSingle();
    if (updateErr) throw new Error(updateErr.message);
    if (!updated) {
      // Two causes reach here and the comment above names both, so the message
      // does too. Saying only "changed status" tells a workspace member who can
      // READ this mission but not update it (RLS refuses the write, resolves it,
      // and returns no rows) to reload — which will never help them.
      throw new Error(
        "This mission was not launched: either it changed status while you were launching it, or your account cannot update it. Reload; if it still says it has not started, ask its owner to launch it.",
      );
    }

    // SEAM-1: the operator promoted (launched) this proposed mission.
    await recordStageEvent(supabase, {
      entityType: "mission",
      entityId: data.missionId,
      from: mission.status,
      to: "running",
      actor: "human",
      workspaceId: mission.workspace_id,
      userId,
    });

    // Start the work. Everything below mirrors startOrchestratedMission's launch
    // step, including its failure handling, because that is the path a mission is
    // genuinely driven by today.
    try {
      // Self-healing, exactly as the resume-runs re-plan does before its own
      // runAgentLoop: seed_default_agents seeds 'orchestrator' at signup, but an
      // account restored from an older backup would otherwise fail here forever
      // with "Unknown agent: orchestrator". Idempotent; cheap.
      const { error: seedErr } = await supabase.rpc("seed_orchestrator_agent", {
        p_user_id: userId,
      });
      if (seedErr) throw new Error(`seed orchestrator failed: ${seedErr.message}`);
      await runAgentLoop(supabase, userId, {
        agentSlug: "orchestrator",
        goal: mission.goal,
        missionId: data.missionId,
        workspaceId: mission.workspace_id,
      });
    } catch (e) {
      // A launch that threw must not leave the mission at 'running' with no run
      // and no plan: the UI's retry affordance is gated on failed/halted, and the
      // sweeper's re-plan path gives up on an unplanned mission older than
      // ABANDON_MS measured from missions.created_at — which, for a proposal that
      // sat for days before anyone pressed launch, is already in the past. So TRY
      // to mark it halted here, where the cause is known, rather than let it be
      // swept. The missions table has no halted_reason column, so status +
      // updated_at is the whole record, matching startOrchestratedMission's own
      // halt-mark.
      //
      // "TRY" IS THE ACCURATE WORD and the earlier version of this comment used
      // "So mark it halted here", which claimed a guarantee the code does not
      // have. supabase-js RESOLVES a refused write, so an RLS denial and a
      // successful halt are the same value here, and the CAS on 'running' matches
      // zero rows if anything else moved the row first. Both are checked below,
      // and the stage event is now written ONLY on the branch where a row really
      // changed — before, it fired unconditionally, so a refused halt produced a
      // stage_events row asserting running->halted for a mission still sitting at
      // 'running'. The proof surfaces read stage_events; a halt that only exists
      // there is worse than no record at all. When the mark does not land the
      // mission stays 'running' and resume-runs converges it; that is a slower
      // recovery, not a lost one, so this logs rather than throws — the launch
      // error below is the one the caller needs to see.
      try {
        const { data: haltedRows, error: haltErr } = await supabase
          .from("missions")
          .update({ status: "halted", updated_at: new Date().toISOString() })
          .eq("id", data.missionId)
          .eq("status", "running")
          .select("id");
        if (haltErr) {
          console.error("[promoteMission] mission halt-mark refused (launch):", haltErr.message);
        } else if (!haltedRows?.length) {
          console.error(
            "[promoteMission] mission halt-mark matched no row (launch): the mission is no longer at 'running', so it was left as whoever moved it wrote it",
          );
        } else {
          // SEAM-1: recorded only now that the halt is known to have landed.
          await recordStageEvent(supabase, {
            entityType: "mission",
            entityId: data.missionId,
            from: "running",
            to: "halted",
            actor: "system",
            workspaceId: mission.workspace_id,
            userId,
          });
        }
      } catch (markErr) {
        console.error("[promoteMission] mission halt-mark failed (launch):", markErr);
      }
      throw new Error(
        `Launch failed, so the mission is halted rather than left looking live: ${
          e instanceof Error ? e.message : String(e)
        }`,
      );
    }

    return { ok: true, missionId: data.missionId };
  });
