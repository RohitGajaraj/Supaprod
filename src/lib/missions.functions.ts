/**
 * Mission server functions (Bundle 4).
 *
 * A mission groups multiple agent_runs under one operator intent. These fns
 * feed the /missions/$id page: the mission row, its ordered hops (runs), and
 * the structured A2A messages between them.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isSideEffectingTool } from "@/lib/tool-consequences";

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
    /** No longer shipped (2026-09-09): no reader drew it and it was 91 KB on one mission. */
    input: string | null;
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

/** One mission as the shell's marks and the live-agents hook read it. */
export type MissionMark = {
  id: string;
  title: string;
  status: string;
  /** When the mission was opened and dispatched: the one start instant the shell can say. */
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  current_agent_id: string | null;
  /** The newest run's agent on this mission, or null before a run. */
  current_agent_slug: string | null;
  /** The newest run's track on this mission, or null; `missions` has no track column. */
  trackId: string | null;
};

/**
 * ── THE SHELL READ 170 KB ON EVERY PAGE TO DRAW A FEW DOTS (2026-09-09) ────
 *
 * `useLiveAgents` and the shell's mark stack mount on every authenticated
 * page and read `listMissions`: fifty missions with their goals, every step
 * and every run of each, and a cost. On the run screen of 2fdf93b6 that
 * call answered in 5,045 to 5,311 ms carrying 170,843 bytes, the largest
 * handler in the product, and the two readers used seven fields of it:
 * status, title, completed_at (the hook's "last done" line) and the mission's
 * agent and track (the marks). `mission_marks` (migration 20260909100800)
 * answers exactly those in one round trip under the caller's own RLS, fifty
 * rows in about 7 KB. `listMissions` stays for the Build board and the Ask
 * pane, which draw the steps and the cost.
 */
export async function readMissionMarks(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
): Promise<{ missions: MissionMark[] }> {
  const { data, error } = await supabase.rpc("mission_marks", {
    p_workspace_id: workspaceId,
    p_limit: 50,
  });
  if (error) throw new Error(`The missions could not be read: ${error.message}`);
  return {
    missions: (data ?? []).map((r) => ({
      id: r.id,
      title: r.title,
      status: r.status,
      created_at: r.created_at,
      updated_at: r.updated_at,
      completed_at: r.completed_at ?? null,
      current_agent_id: r.current_agent_id ?? null,
      current_agent_slug: r.current_agent_slug ?? null,
      trackId: r.track_id ?? null,
    })),
  };
}

export const listMissionMarks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workspaceId: string }) =>
    z.object({ workspaceId: z.string().uuid() }).parse(d),
  )
  .handler(({ context, data }) => readMissionMarks(context.supabase, data.workspaceId));

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
      /* How many of the longest-waiting blocked rows travel alongside the
         recent page. Enough that the lane can reach past its own overflow
         control, small enough that it stays one bounded read. */
      const OLDEST_BLOCKED_ROWS = 25;
      let totalBlocked: number | null = null;
      let oldestBlockedAt: string | null = null;
      let oldestBlockedRows: typeof data = [];
      try {
        let countQ = supabase
          .from("missions")
          .select("id", { count: "exact", head: true })
          .in("status", BLOCKED_STATUSES as unknown as string[]);
        if (input?.workspaceId) countQ = countQ.eq("workspace_id", input.workspaceId);
        if (productMissionIds) countQ = countQ.in("id", productMissionIds);
        const { count } = await countQ;
        totalBlocked = count ?? null;

        /*
         * ── THE ROWS, NOT ONLY THE TIMESTAMP ────────────────────────────────
         *
         * This asked for the oldest blocked row's `updated_at` and threw the
         * row away, so the lane could SAY "the oldest has been waiting 40 days"
         * and could not show it. That sentence was written to explain the gap
         * honestly, and it did - but a lane whose stated job is "what needs a
         * person soonest" that structurally cannot reach the thing that has
         * waited longest is a capability gap wearing a disclosure.
         *
         * WHY THE ROW QUERY ABOVE CANNOT JUST FLIP TO ASCENDING, which is the
         * fix S1 applied to the approvals queue for the same defect (RUN-100:
         * six reads ordered DESC, so the cap discarded the OLDEST on a page
         * that sorts oldest-first). Here the 50 feed four lanes, and three of
         * them want recency: Running, Finished and the shell's live line are
         * about work in motion. Flipping would starve them to fix one lane.
         *
         * So both ends are fetched and merged. This query already existed and
         * already ordered ascending; it now returns rows instead of one column,
         * which costs no extra round trip. The enrichment below is batched over
         * whatever `missions` holds, so the extra rows are enriched with it.
         */
        let oldestQ = supabase
          .from("missions")
          .select(
            "id,title,goal,status,hop_count,current_agent_id,created_at,updated_at,completed_at,build_driver",
          )
          .in("status", BLOCKED_STATUSES as unknown as string[])
          .order("updated_at", { ascending: true })
          .limit(OLDEST_BLOCKED_ROWS);
        if (input?.workspaceId) oldestQ = oldestQ.eq("workspace_id", input.workspaceId);
        if (productMissionIds) oldestQ = oldestQ.in("id", productMissionIds);
        const { data: oldest } = await oldestQ;
        oldestBlockedRows = (oldest ?? []) as typeof data;
        /* Still the FIRST row of an ascending read, so this number did not
           change meaning when the query grew. */
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

      /* MERGED BY ID, RECENT PAGE FIRST. The two reads overlap whenever a
         blocked row is also recently touched, and a duplicate id would render
         the same run twice in one lane. Order is not asserted here: every lane
         on the board sorts for itself, and `the-waiting-lane-puts-the-oldest-first`
         pins the one that sorts by age. */
      const byId = new Map<string, NonNullable<typeof data>[number]>();
      for (const m of [...(data ?? []), ...(oldestBlockedRows ?? [])]) byId.set(m.id, m);
      const missions = [...byId.values()];
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
            /*
             * `spend_used_usd` — F-145. What this run actually cost, recorded on
             * the run itself. See the cost block below for why it replaced a
             * four-hop derivation.
             */
            .select("id,mission_id,status,created_at,agent_slug,track_id,spend_used_usd")
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
        /*
         * ── F-145: A FOUR-HOP DERIVATION SAID $0.00 OVER REAL SPEND ─────────
         *
         * S1 measured it on /inbox: **"Workspace spend: $0.00" for a workspace
         * whose 622 runs carry a populated `spend_used_usd` totalling $8.31.**
         *
         * The old path was mission -> runs -> NEWEST checkpoint per run ->
         * `state.traceId` -> `ai_events.est_cost_usd`. Four hops, and a break at
         * any one of them produced a mission that COST NOTHING rather than one
         * whose cost was UNKNOWN. Summing those gives a confident zero, which is
         * the same false-negative shape as every other read fixed tonight: a
         * narrow lookup returning empty and the surface reading empty as fact.
         *
         * The `seenRun` dedupe made it worse in a way that is invisible from the
         * code: it took only the newest checkpoint per run, so a run whose LAST
         * checkpoint carried no `traceId` contributed nothing even when an
         * earlier one did.
         *
         * ── WHY THE RUN COLUMN IS CANONICAL, AND IT IS NOT ONLY ROBUSTNESS ──
         * Measured: `spend_used_usd` is populated on **all 2,847 runs**, total
         * $30.35. So the direct read is one hop and complete.
         *
         * But the deciding argument is what the two numbers MEAN. `est_cost_usd`
         * is an ESTIMATE attached to a model event; `spend_used_usd` is what was
         * RECORDED against the run. The question this surface asks is "what did
         * this work cost", and the recorded spend is the answer while the
         * estimate is a model of it. A surface should not prefer a model of a
         * fact it already holds.
         *
         * `ai_events` keeps its own job — per-event attribution, which the run
         * column cannot give — and this is not a second cost source appearing on
         * one screen: it REPLACES the derivation rather than sitting beside it,
         * so there is still exactly one answer to "what did this cost".
         */
        for (const r of runs ?? []) {
          if (!r.mission_id) continue;
          const spend = Number(r.spend_used_usd ?? 0);
          if (!Number.isFinite(spend) || spend <= 0) continue;
          costByMission.set(r.mission_id, (costByMission.get(r.mission_id) ?? 0) + spend);
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
  .handler(({ context, data }): Promise<MissionDetail> =>
    readMission(context.supabase, context.userId, data.missionId),
  );

/**
 * THE HANDOFF ROWS ALONE. The run screen's transcript drew its handoff rows
 * by calling `getMission` once per mission on the track and reading
 * `.messages` off a response that also carried every run's brief and
 * output and the latest checkpoint of each (170 KB and five seconds on
 * 2fdf93b6, 2026-09-09; the build's resolver map named it). This is the one
 * read those rows need: one hop, a few rows.
 */
export async function readMissionHandoffs(
  supabase: SupabaseClient<Database>,
  missionId: string,
): Promise<{ messages: MissionDetail["messages"] }> {
  const { data, error } = await supabase
    .from("agent_messages")
    .select(
      "id,from_agent_slug,to_agent_slug,kind,payload,source_run_id,source_trace_id,consumed_by_run_id,created_at",
    )
    .eq("mission_id", missionId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`The handoffs on this run could not be read: ${error.message}`);
  return { messages: (data ?? []) as MissionDetail["messages"] };
}

export const listMissionHandoffs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { missionId: string }) => z.object({ missionId: z.string().uuid() }).parse(d))
  .handler(({ context, data }) => readMissionHandoffs(context.supabase, data.missionId));

/**
 * THE READ BEHIND `getMission`, three hops, driven by
 * `a-mission-detail-is-three-hops.test.ts` on the wire that counts rounds.
 *
 * It was nine sequential round trips (the mission three times, the owner's
 * identity, the runs, the messages, every checkpoint of every run with its
 * whole state, the tool calls, the token events) and it shipped each run's
 * `input`, which no reader draws. Now: the mission, its runs and its
 * messages leave together; the owner's identity and the latest checkpoint
 * per run (`latest_run_checkpoints`, migration 20260909100900: the trace,
 * the steps and the recalled memories, never the rest of the state) leave
 * together; the tool calls and the token events leave together. What the
 * relay and the replay diff draw (`relay.ts`, `mission-diff.ts`: steps,
 * output, tool calls, the seat) is unchanged.
 */
export async function readMission(
  supabase: SupabaseClient<Database>,
  userId: string,
  missionId: string,
): Promise<MissionDetail> {
  const [missionRes, runsRes, messagesRes] = await Promise.all([
    supabase
      .from("missions")
      .select(
        "id,title,goal,status,current_agent_id,hop_count,created_at,updated_at,completed_at,replayed_from_mission_id,user_id,workspace_id,auto_trigger_source",
      )
      .eq("id", missionId)
      .maybeSingle(),
    supabase
      .from("agent_runs")
      .select("id,agent_slug,agent_name,status,output,created_at,last_checkpoint_at,spend_used_usd")
      .eq("mission_id", missionId)
      .order("created_at", { ascending: true }),
    supabase
      .from("agent_messages")
      .select(
        "id,from_agent_slug,to_agent_slug,kind,payload,source_run_id,source_trace_id,consumed_by_run_id,created_at",
      )
      .eq("mission_id", missionId)
      .order("created_at", { ascending: true }),
  ]);
  if (missionRes.error) throw new Error(missionRes.error.message);
  const row = missionRes.data as
    | (MissionDetail["mission"] & {
        replayed_from_mission_id?: string | null;
        user_id?: string | null;
        workspace_id?: string | null;
        auto_trigger_source?: string | null;
      })
    | null;
  if (!row) throw new Error("Mission not found");
  const runs = (runsRes.data ?? []) as Array<{
    id: string;
    agent_slug: string;
    agent_name: string;
    status: string;
    output: string | null;
    created_at: string;
    last_checkpoint_at?: string | null;
    spend_used_usd?: number | null;
  }>;
  const runIds = runs.map((r) => r.id);
  const ownerId = row.user_id ?? null;
  const workspaceId = row.workspace_id ?? null;

  const [identityRes, cpsRes] = await Promise.all([
    ownerId && workspaceId
      ? supabase.rpc("workspace_members_with_identity", { _workspace_id: workspaceId })
      : Promise.resolve({ data: null, error: null }),
    runIds.length
      ? supabase.rpc("latest_run_checkpoints", { p_run_ids: runIds })
      : Promise.resolve({ data: [], error: null }),
  ]);

  let captain: MissionDetail["mission"]["captain"] = null;
  if (ownerId) {
    const identity = !identityRes.error && Array.isArray(identityRes.data) ? identityRes.data : [];
    const match = (
      identity as { user_id: string; display_name: string | null; email: string | null }[]
    ).find((m) => m.user_id === ownerId);
    captain = {
      owner_user_id: ownerId,
      owner_is_self: ownerId === userId,
      owner_display_name: match?.display_name ?? null,
      owner_email: match?.email ?? null,
      auto_dispatched: (row.auto_trigger_source ?? null) === "auto",
    };
  }

  type LatestCheckpoint = {
    run_id: string;
    step_index: number;
    trace_id: string | null;
    steps: unknown;
    recalled_memories: unknown;
  };
  const latestByRun = new Map<string, LatestCheckpoint>();
  for (const cp of (cpsRes.data ?? []) as LatestCheckpoint[]) latestByRun.set(cp.run_id, cp);
  const traceIds = [...latestByRun.values()]
    .map((cp) => cp.trace_id)
    .filter((t): t is string => typeof t === "string" && t.length > 0);

  const [tcsRes, eventsRes] = await Promise.all([
    traceIds.length
      ? supabase
          .from("tool_calls")
          .select("id,trace_id,tool_name,ok,error,latency_ms,created_at")
          .in("trace_id", traceIds)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] as never[] }),
    traceIds.length
      ? supabase
          .from("ai_events")
          .select("prompt_tokens,completion_tokens")
          .in("trace_id", traceIds)
      : Promise.resolve({
          data: [] as { prompt_tokens: number | null; completion_tokens: number | null }[],
        }),
  ]);

  const tcByTrace = new Map<string, HopToolCall[]>();
  for (const t of (tcsRes.data ?? []) as {
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
      /* Whether the hop CHANGED anything without a person, answered from the
         registry's category (it read true for every hop between 2026-08-19
         and 2026-08-22, when the predicate was catalogue membership). */
      is_unattended: isSideEffectingTool(t.tool_name),
    });
    tcByTrace.set(t.trace_id, arr);
  }

  const firstHopTrace =
    runs.map((r) => latestByRun.get(r.id)?.trace_id).find((t): t is string => !!t) ?? null;
  const usage: MissionDetail["usage"] = {
    cost_usd: 0,
    tokens_in: 0,
    tokens_out: 0,
    trace_id: firstHopTrace,
  };
  for (const r of runs) {
    const spend = Number(r.spend_used_usd ?? 0);
    if (Number.isFinite(spend) && spend > 0) usage.cost_usd += spend;
  }
  for (const e of eventsRes.data ?? []) {
    usage.tokens_in += e.prompt_tokens ?? 0;
    usage.tokens_out += e.completion_tokens ?? 0;
  }

  const { replayed_from_mission_id, user_id, workspace_id, auto_trigger_source, ...mission } = row;
  void user_id;
  void workspace_id;
  void auto_trigger_source;
  return {
    mission: {
      ...mission,
      replayed_from_mission_id: replayed_from_mission_id ?? null,
      captain,
    } as MissionDetail["mission"],
    usage,
    hops: runs.map((r) => {
      const cp = latestByRun.get(r.id);
      const traceId = cp?.trace_id ?? null;
      return {
        run_id: r.id,
        agent_slug: r.agent_slug,
        agent_name: r.agent_name,
        status: r.status,
        /* `input` is no longer shipped: no reader drew it, and on one mission it
           was 91 KB of the response. */
        input: null,
        output: r.output,
        created_at: r.created_at,
        last_checkpoint_at: r.last_checkpoint_at ?? null,
        trace_id: traceId,
        step_index: cp?.step_index ?? 0,
        steps: Array.isArray(cp?.steps) ? (cp.steps as HopStep[]) : [],
        tool_calls: traceId ? (tcByTrace.get(traceId) ?? []) : [],
        recalled_memories: Array.isArray(cp?.recalled_memories)
          ? (cp.recalled_memories as string[])
          : [],
      };
    }),
    messages: (messagesRes.data ?? []) as MissionDetail["messages"],
  };
}

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
