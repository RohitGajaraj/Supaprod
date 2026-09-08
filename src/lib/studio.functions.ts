/**
 * F-STUDIO — server functions for the Studio surface.
 *
 * Studio is the in-platform development engine (docs/features/studio.md).
 * `/studio` reads sessions/steps/changesets here, steers via
 * steerStudioSession, and clears gates with the existing decideApproval.
 *
 * P-29 (A-QUEUE.md, 2026-09-03): the agent door this file used to name here,
 * dispatchStudioSession, is deleted -- see the standalone note where it used
 * to live, just after formatDesignDispatchSections.
 *
 * Legacy equivalence: the engine agent keeps slug 'builder'; sessions list
 * includes legacy Builder missions for history continuity.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { formatScaffoldHtmlBlock } from "@/lib/build/ard-block";
import { runAgentLoop } from "@/lib/ai/loop.server";
import { callModel } from "@/lib/ai/runtime.server";
import { revertChangesetToRevision } from "@/lib/ai/studio-revert.server";
import { runRollbackRelease, ghHeaders } from "@/lib/studio-rollbacks";
import { pickChangesetForPrd } from "@/lib/studio-ship";
import { agentStation, AGENT_STATION_ORDER, type AgentStation } from "@/lib/agent-vocabulary";
import { resolveGitHub } from "@/lib/connectors/providers/github.server";
import { formatDesignMemoryContext } from "@/lib/design-memory.functions";
import { formatFlowContext, type PrdFlowRow } from "@/lib/design-parity.functions";
import type { DesignDispatchContext } from "@/lib/build/design-gate";
import { recordStageEvent } from "@/lib/stage-events.server";
/* `studio-format.ts` is a component-free module (zero imports, its own header
 * says "pure helpers, no components"), so pulling one formatter across the
 * lib/components line costs nothing at runtime and keeps the run surface and
 * this payload from summarizing the same args two different ways. 25 files
 * under src/lib already import from @/components on the same grounds —
 * decisions.functions.ts:11 and governance.functions.ts:11 among them. */

export type StudioChangesetSummary = {
  id: string;
  product_id: string | null;
  status: "staged" | "committed" | "pr_open" | "merged" | "abandoned";
  repo: string;
  branch: string | null;
  pr_url: string | null;
  pr_number: number | null;
  title: string;
  summary: string | null;
  file_count: number;
  release_notes?: string | null;
  release_notes_at?: string | null;
};

export type StudioSessionListItem = {
  mission_id: string;
  /** OBS-10: 'build' = dispatched through Studio (has a 'builder' agent run);
   * 'mission' = an orchestrator (or other-agent) goal-run, no changeset/PR of
   * its own — open it via `/build/$missionId`'s mission-kind branch. */
  kind: "build" | "mission";
  title: string;
  status: string;
  goal: string;
  created_at: string;
  updated_at: string;
  run_status: string | null;
  prd: { id: string; title: string } | null;
  changeset: StudioChangesetSummary | null;
  pending_approvals: number;
  cost_usd: number;
  /** SESSION-ORG: soft-archived (hidden from the default Build list). */
  archived: boolean;
  /**
   * Which of the seven stages this run is at, from the station of the agent on
   * its most recent run. Null when nothing has run yet, which is the true state
   * of a `proposed` mission: a trigger asked for it and no agent has touched it.
   *
   * This is the LIVE stage, not the furthest one reached. It is derived from
   * the same `agentStation(slug)` catalog the shell header and the run's own
   * strip use, so the board and the run agree on what "05 Build" means rather
   * than each inventing a rule. The full seven-stage walk (`getRunStages`) is
   * far too heavy to run per row and answers a different question anyway: what
   * this run has DONE, versus where it is standing.
   */
  station: AgentStation | null;
};

/** Serializable JSON for server-fn payloads (matches the loop's Json shape). */
export type StudioJson =
  string | number | boolean | null | StudioJson[] | { [k: string]: StudioJson };

export type StudioApproval = {
  id: string;
  tool_name: string;
  args: { [k: string]: StudioJson };
  rationale: string | null;
  status: string;
  created_at: string;
  expires_at: string | null;
  result: { [k: string]: StudioJson } | null;
  error: string | null;
};

/**
 * PURE. Everything the design station contributes to a work order, in the order
 * a builder needs to read it: the workspace's standing design language, the
 * flow the spec walks, then the gate-approved mockup as its OWN fenced html
 * section.
 *
 * THE DEFECT THIS SHAPE PREVENTS. Until 2026-08-05 the mockup travelled only as
 * a JSON string inside the ARD block, as the last field of the last key, and
 * that block met its 8,000-char budget by slicing characters. A real
 * 17,475-char mockup was therefore cut inside a string literal, which
 * invalidated the ENTIRE fence — the acceptance criteria and the outcome
 * contract went down with it even though both are small and sat thousands of
 * characters earlier in the document. The agent received a fence it could not
 * parse and silently built from the prose, so the failure looked like a build
 * that ignored the design rather than a serialisation bug. Markup in its own
 * fence competes with nothing, arrives as markup instead of an escaped blob,
 * and survives a cut the way JSON never can.
 *
 * It is extracted from `dispatchStudioSession` so it can be tested at all: the
 * handler needs a database and a live agent roster, so the wiring that decides
 * WHAT a builder sees had no guard while it lived inside one.
 */
export function formatDesignDispatchSections(ctx: DesignDispatchContext | null): string[] {
  if (!ctx) return [];
  const out: string[] = [];
  const memory = formatDesignMemoryContext(ctx.memory);
  if (memory) out.push(memory);
  const flow = formatFlowContext((ctx.flow as PrdFlowRow | null) ?? null);
  if (flow) out.push(flow);
  const scaffold = ctx.scaffoldHtml ? formatScaffoldHtmlBlock(ctx.scaffoldHtml) : "";
  if (scaffold) out.push(scaffold);
  return out;
}

/*
 * P-29 (A-QUEUE.md, 2026-09-03): `dispatchStudioSession` (the agent door
 * named in this file's own header) is deleted. It lost its only two real
 * callers -- OpportunityDetailSheet.tsx's "Start a mission" and
 * GraphNodeActions.tsx's equivalent -- to the same fix `startOrchestratedMission`
 * got (R-35: no door outside the track path may create a mission), and
 * plan.spec.$id.tsx's own "Send to Build" (its third caller) went with it
 * per the P-14 ruling table's own line for that page. Everything it alone
 * used (the design-gate/spec-gate lookups it called, `recordLineage`,
 * `nativeBuildDriver`, `WORK_ORDER_HEADER`, `ArdDesignSection`, `BuildSpec`)
 * is removed with it below; `formatDesignDispatchSections` and
 * `formatScaffoldHtmlBlock` stay -- both are real, tested, still-imported by
 * `build.functions.ts`'s own dispatch path, the sibling this file's header
 * already named as the OTHER contract-holder.
 */

/** Latest trace id per run, via the checkpoint JSON projection (no full-state read). */
async function traceByRun(
  supabase: SupabaseClient,
  runIds: string[],
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (!runIds.length) return out;
  const { data } = await supabase
    .from("agent_run_checkpoints")
    .select("run_id, step_index, trace:state->>traceId")
    .in("run_id", runIds)
    .order("step_index", { ascending: false })
    .limit(2000);
  for (const row of (data ?? []) as { run_id: string; trace: string | null }[]) {
    if (!out.has(row.run_id) && row.trace) out.set(row.run_id, row.trace);
  }
  return out;
}

/**
 * List Studio sessions (mission-centric), including legacy Builder missions
 * for history continuity.
 */
export const listStudioSessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        includeArchived: z.boolean().optional(),
        /*
         * ── F-141: A USER-SCOPED COUNT WAS RENDERED AS A WORKSPACE FACT ─────
         *
         * S2 measured it on the primary "where is the work" control. Both run
         * queries below read `.eq("user_id", userId)` with **no workspace
         * filter anywhere in the handler**, and the station strip renders the
         * tally directly under a breadcrumb reading "Helio Labs / Prism",
         * directly above a board whose every other number is workspace-scoped.
         * It said "89 runs waiting on you" at Discover, and switching workspace
         * would not have changed it.
         *
         * OPTIONAL, AND THE DEFAULT IS THE OLD BEHAVIOUR. Fifteen consumers
         * share this read and a scope change silently alters what every one of
         * them counts, which is exactly why S2 raised it twice rather than
         * changing it. This follows their own `listDueForecastsHere` shape: a
         * second door, the original read untouched, and each caller choosing.
         */
        workspaceId: z.string().uuid().optional(),
      })
      .optional()
      .parse(i ?? {}),
  )
  .handler(
    async ({ context, data }): Promise<{ sessions: StudioSessionListItem[]; bounded: boolean }> => {
      const { supabase, userId } = context;
      const db = supabase as unknown as SupabaseClient;
      const includeArchived = data?.includeArchived ?? false;
      const workspaceId = data?.workspaceId ?? null;
      /**
       * The per-kind read cap, named so the `bounded` flag below cannot drift
       * from it. Two separate reads keep their own page deliberately: a single
       * shared limit could push one kind's runs entirely out of the window.
       */
      const RUN_PAGE = 100;

      // OBS-10: Build is the one true missions home, so this lists every agent-
      // mesh mission (Studio/Build code-gen AND orchestrator goal-runs), not just
      // 'builder' ones. Two runs queries stay fully SEPARATE on purpose (adversarial
      // review finding) rather than one unfiltered query: (1) keeps the 'build'-kind
      // cost/run_status computation below byte-identical to the pre-fold behavior —
      // no risk of a mid-mission `agent.handoff` to a non-builder agent polluting a
      // Studio session's reported cost/status; (2) keeps each kind's own `.limit(100)`
      // window independent, so a busy orchestrator mesh can never push a real Studio
      // session's run out of the fetched window (a single shared limit could).
      /*
       * F-141. Scoped only when a caller asked for one workspace; absent, this is
       * byte-for-byte the read it always was. Built as a variable rather than one
       * chain because PostgREST's builder has no conditional step, and inventing
       * one is how I nearly shipped a `.apply` that does not exist.
       */
      let builderQ = db
        .from("agent_runs")
        .select("id,mission_id,status,created_at,agent_slug")
        .eq("user_id", userId)
        .eq("agent_slug", "builder");
      if (workspaceId) builderQ = builderQ.eq("workspace_id", workspaceId);
      const { data: runs, error } = await builderQ
        .order("created_at", { ascending: false })
        .limit(RUN_PAGE);
      if (error) throw new Error(error.message);
      /*
       * ── F-141, THE SECOND HALF: THREE CAPS AND NO EXACT COUNT ──────────────
       *
       * This read bounds twice at RUN_PAGE and once more at 200 on the assembled
       * array, and the station strip renders the per-station tallies as facts. So
       * the numbers were what SURVIVED the read, with nothing able to say so.
       *
       * Exactly the shape S1 measured on the approvals queue: 116 pending design
       * gates against a limit of 100, sixteen calls on no screen at all, and no
       * surface able to tell. There the fix was a field travelling with the items,
       * because a caller cannot infer a cap from a result that looks complete.
       *
       * `bounded` is that field. It does not say how many were dropped — we do not
       * know without a second count — only that the answer is a floor. A surface
       * can then say "at least N", which is weaker than N and true, rather than N,
       * which is stronger and sometimes false.
       */
      const ASSEMBLED_CAP = 200;
      const runRows = (runs ?? []) as {
        id: string;
        mission_id: string | null;
        status: string;
        created_at: string;
        agent_slug: string | null;
      }[];
      const builderMissionIds = [
        ...new Set(runRows.map((r) => r.mission_id).filter((m): m is string => !!m)),
      ];

      let otherQ = db
        .from("agent_runs")
        .select("id,mission_id,status,created_at,agent_slug")
        .eq("user_id", userId)
        .neq("agent_slug", "builder");
      if (workspaceId) otherQ = otherQ.eq("workspace_id", workspaceId);
      const { data: otherRuns, error: otherError } = await otherQ
        .order("created_at", { ascending: false })
        .limit(RUN_PAGE);
      if (otherError) throw new Error(otherError.message);
      /** True when either page filled, so a caller knows its count is a floor. */
      const bounded = (runs?.length ?? 0) >= RUN_PAGE || (otherRuns?.length ?? 0) >= RUN_PAGE;
      const otherRunRows = (otherRuns ?? []) as {
        id: string;
        mission_id: string | null;
        status: string;
        created_at: string;
        agent_slug: string | null;
      }[];

      /**
       * The stage each mission is standing at: the station of the agent on its
       * MOST RECENT run.
       *
       * The re-sort is load-bearing and not tidiness. Each query is ordered
       * created_at desc on its own, but they are two queries, so concatenating
       * them puts EVERY builder run ahead of EVERY other-agent run regardless of
       * time. A mission that built and then handed off to a shipper would read as
       * still building, which is the exact class of "further along than it is"
       * lie the strip's own state vocabulary was written to avoid. Merging by
       * timestamp is what makes "most recent" mean most recent.
       *
       * An unrecognised slug maps to null rather than to a guess. A run whose
       * agent is not in the catalog is at no stage we can name, and naming one
       * anyway would file a run under a heading it does not belong to.
       */
      const stationByMission = new Map<string, AgentStation | null>();
      for (const r of [...runRows, ...otherRunRows].sort((a, b) =>
        a.created_at < b.created_at ? 1 : -1,
      )) {
        if (!r.mission_id || stationByMission.has(r.mission_id)) continue;
        stationByMission.set(r.mission_id, agentStation(r.agent_slug));
      }
      const otherMissionIds = [
        ...new Set(otherRunRows.map((r) => r.mission_id).filter((m): m is string => !!m)),
      ].filter((id) => !builderMissionIds.includes(id));

      // A 'proposed' mission (the trigger-tick's own HITL gate)
      // has ZERO agent_runs by design — resume-runs ignores it until a human
      // promotes it — so it would never enter either runs query above, making its
      // "Review & launch" gate unreachable. Fetch these separately by status.
      const { data: proposedMissions } = await db
        .from("missions")
        .select("id")
        .eq("user_id", userId)
        .eq("status", "proposed");
      const proposedIds = ((proposedMissions ?? []) as { id: string }[])
        .map((p) => p.id)
        .filter((id) => !builderMissionIds.includes(id) && !otherMissionIds.includes(id));

      const missionIds = [...builderMissionIds, ...otherMissionIds, ...proposedIds];
      if (!missionIds.length) return { sessions: [], bounded };
      const missionKind = new Map<string, "build" | "mission">();
      for (const id of builderMissionIds) missionKind.set(id, "build");
      for (const id of otherMissionIds) missionKind.set(id, "mission");
      for (const id of proposedIds) missionKind.set(id, "mission");

      const [{ data: missions }, { data: changesets }, { data: pendings }, { data: edges }] =
        await Promise.all([
          db
            .from("missions")
            .select("id,title,goal,status,created_at,updated_at,archived_at,current_agent_id")
            .in("id", missionIds),
          db
            .from("studio_changesets")
            .select(
              "id,product_id,mission_id,status,repo,branch,pr_url,pr_number,title,summary,created_at",
            )
            .in("mission_id", missionIds)
            .neq("status", "abandoned")
            .order("created_at", { ascending: false }),
          db
            .from("agent_approvals")
            .select("id,mission_id")
            .in("mission_id", missionIds)
            .eq("status", "pending"),
          db
            .from("artifact_lineage")
            .select("parent_id,child_id")
            .eq("parent_kind", "prd")
            .eq("child_kind", "mission")
            .in("child_id", missionIds),
        ]);

      // Latest non-abandoned changeset per mission + file counts in one query.
      const changesetByMission = new Map<string, StudioChangesetSummary>();
      const changesetIds: string[] = [];
      for (const cs of (changesets ?? []) as Array<
        StudioChangesetSummary & { mission_id: string | null; created_at: string }
      >) {
        if (cs.mission_id && !changesetByMission.has(cs.mission_id)) {
          changesetByMission.set(cs.mission_id, { ...cs, file_count: 0 });
          changesetIds.push(cs.id);
        }
      }
      if (changesetIds.length) {
        const { data: changeRows } = await db
          .from("studio_changes")
          .select("changeset_id")
          .in("changeset_id", changesetIds);
        const counts = new Map<string, number>();
        for (const r of (changeRows ?? []) as { changeset_id: string }[]) {
          counts.set(r.changeset_id, (counts.get(r.changeset_id) ?? 0) + 1);
        }
        for (const cs of changesetByMission.values()) cs.file_count = counts.get(cs.id) ?? 0;
      }

      const pendingByMission = new Map<string, number>();
      for (const p of (pendings ?? []) as { mission_id: string | null }[]) {
        if (p.mission_id)
          pendingByMission.set(p.mission_id, (pendingByMission.get(p.mission_id) ?? 0) + 1);
      }

      const prdByMission = new Map<string, string>();
      for (const e of (edges ?? []) as { parent_id: string; child_id: string }[]) {
        prdByMission.set(e.child_id, e.parent_id);
      }
      const prdIds = [...new Set(prdByMission.values())];
      const { data: prds } = prdIds.length
        ? await db.from("prds").select("id,title").in("id", prdIds)
        : { data: [] as { id: string; title: string }[] };
      const prdTitle = new Map(
        (prds ?? []).map((p: { id: string; title: string }) => [p.id, p.title]),
      );

      // Cost: checkpoint trace → ai_events sum (legacy and new runs alike). Computed
      // separately per agent-kind run set (never merged) so a 'build'-kind mission's
      // cost/status can never absorb a different agent's contribution mid-mission.
      async function costAndStatusByMission(
        rows: { id: string; mission_id: string | null; status: string }[],
      ): Promise<{ cost: Map<string, number>; status: Map<string, string> }> {
        const traces = await traceByRun(
          supabase,
          rows.map((r) => r.id),
        );
        const traceList = [...new Set(traces.values())];
        const costByTrace = new Map<string, number>();
        if (traceList.length) {
          const { data: events } = await db
            .from("ai_events")
            .select("trace_id,est_cost_usd")
            .in("trace_id", traceList);
          for (const ev of (events ?? []) as {
            trace_id: string | null;
            est_cost_usd: number | null;
          }[]) {
            if (ev.trace_id)
              costByTrace.set(
                ev.trace_id,
                (costByTrace.get(ev.trace_id) ?? 0) + (ev.est_cost_usd ?? 0),
              );
          }
        }
        const cost = new Map<string, number>();
        const status = new Map<string, string>();
        for (const r of rows) {
          if (!r.mission_id) continue;
          if (!status.has(r.mission_id)) status.set(r.mission_id, r.status);
          const trace = traces.get(r.id);
          if (trace)
            cost.set(r.mission_id, (cost.get(r.mission_id) ?? 0) + (costByTrace.get(trace) ?? 0));
        }
        return { cost, status };
      }
      const builder = await costAndStatusByMission(runRows);
      const other = await costAndStatusByMission(otherRunRows);

      /**
       * The stage a mission that has NOT RUN YET is standing at.
       *
       * A `proposed` mission has zero agent_runs by design (the trigger tick's own
       * HITL gate: nothing runs until a human launches it), so the station derived
       * from runs above is null for every one of them. Dropping them would leave
       * the board's strip reading "none" seven times while the list underneath is
       * full, which looks broken and is not what the record says: the trigger
       * pre-routes these, `sensing/trigger.ts` sets `current_agent_id` so the
       * mission "arrives pre-routed to the right Sense agent".
       *
       * This is a FALLBACK, never an override. A mission that has run is at the
       * stage it ran at, because where an agent actually went beats where it was
       * once addressed.
       *
       * AND THE LAST RESORT, which is a derivation and not a guess. Cluster and
       * missed-outcome proposals carry no assignment at all (documented in
       * trigger.ts), and on a real workspace they are the majority: 17 of 19 runs
       * on the founder's board resolved to nothing, so the seven-stage strip read
       * "none" six times over a full list. That is not honesty, it is a broken
       * instrument.
       *
       * A `proposed` mission stands at the FIRST stage of the spine, because it
       * has not entered the lifecycle: nothing has been decided, planned,
       * designed, built, shipped or learned. Position zero in an ordered spine is
       * where a thing that has not moved is, which is a fact about the ordering
       * rather than a claim about the work.
       *
       * Two things keep this from drifting into a lie. It reads the ORDER rather
       * than hard-coding "sense", so re-ordering the spine moves it. And it is
       * scoped to `status === 'proposed'` rather than to "station came back
       * null", so it can never quietly absorb some other station-less case: an
       * uncatalogued agent slug still resolves to null and is still counted
       * nowhere. The trigger tick is the only writer of that status in the
       * product (`api/public/hooks/trigger-tick.ts`), and every proposal it
       * writes is sense-stage work.
       *
       * Deliberately NOT used: the stage event the tick records alongside, whose
       * actor falls back to "strategist". That agent's station is `decide`, so
       * taking it would file every unassigned cluster investigation one stage too
       * far along. It names who logged the proposal, not who will do it.
       */
      const routedIds = [
        ...new Set(
          ((missions ?? []) as Array<{ id: string; current_agent_id: string | null }>)
            .filter((m) => !stationByMission.get(m.id) && m.current_agent_id)
            .map((m) => m.current_agent_id as string),
        ),
      ];
      const slugByAgentId = new Map<string, string>();
      if (routedIds.length) {
        const { data: agentRows } = await db.from("agents").select("id,slug").in("id", routedIds);
        for (const a of (agentRows ?? []) as { id: string; slug: string }[]) {
          slugByAgentId.set(a.id, a.slug);
        }
      }

      const sessions = (
        (missions ?? []) as Array<{
          id: string;
          title: string;
          goal: string;
          status: string;
          created_at: string;
          updated_at: string;
          archived_at: string | null;
          current_agent_id: string | null;
        }>
      )
        // SESSION-ORG: hide archived sessions unless explicitly requested.
        .filter((m) => includeArchived || !m.archived_at)
        .map((m) => {
          const prdId = prdByMission.get(m.id) ?? null;
          const kind = missionKind.get(m.id) ?? "mission";
          const { cost: costByMission, status: runStatusByMission } =
            kind === "build" ? builder : other;
          return {
            mission_id: m.id,
            kind,
            title: m.title,
            status: m.status,
            goal: m.goal,
            created_at: m.created_at,
            updated_at: m.updated_at,
            run_status: runStatusByMission.get(m.id) ?? null,
            prd: prdId ? { id: prdId, title: prdTitle.get(prdId) ?? "Spec" } : null,
            changeset: changesetByMission.get(m.id) ?? null,
            pending_approvals: pendingByMission.get(m.id) ?? 0,
            cost_usd: Number((costByMission.get(m.id) ?? 0).toFixed(4)),
            archived: !!m.archived_at,
            station:
              stationByMission.get(m.id) ??
              (m.current_agent_id ? agentStation(slugByAgentId.get(m.current_agent_id)) : null) ??
              (m.status === "proposed" ? AGENT_STATION_ORDER[0] : null),
          };
        })
        .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));

      // PC-32 (super light, engine underneath): the underlying queries feeding
      // this (missions/proposed-missions fetches) are uncapped, so defensively
      // bound the assembled array we actually return. 200 stays generous
      // relative to the route's own ~8-visible-plus-reveal-door cap.
      return {
        sessions: sessions.slice(0, ASSEMBLED_CAP),
        // Either page filled, or the assembly itself was trimmed. Any of the
        // three means the tally below is a floor rather than a total.
        bounded: bounded || sessions.length > ASSEMBLED_CAP,
      };
    },
  );

/**
 * SESSION-ORG: soft-archive / un-archive a Build session — reversible, keeps
 * everything. The safe default for tidying the list. Owner-only (the "Owners can
 * write their missions" RLS policy scopes the UPDATE to the caller's own rows).
 */
export const setStudioSessionArchived = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ missionId: z.string().uuid(), archived: z.boolean() }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const db = context.supabase as unknown as SupabaseClient;
    const { error } = await db
      .from("missions")
      .update({ archived_at: data.archived ? new Date().toISOString() : null })
      .eq("id", data.missionId);
    if (error) throw new Error(error.message);
    return { ok: true, archived: data.archived };
  });

/**
 * SESSION-ORG: hard-delete a Build session. Removes the build's WORKING artifacts
 * — deleting the mission CASCADEs its steps, changesets (→ staged files), and
 * messages, and we delete its runs (→ checkpoints / idempotency keys) explicitly
 * since `agent_runs` has no mission FK. But the typed DECISION memory is
 * `ON DELETE SET NULL`, so what was decided/learned SURVIVES in the Brain (it just
 * detaches from this build). Deleting a build never erases the moat; forgetting
 * memory is a separate, deliberate act. Owner-only via the same RLS policy.
 */
export const deleteStudioSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ missionId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const db = context.supabase as unknown as SupabaseClient;
    // Mission first: its delete throws on failure (so nothing is half-removed) and
    // CASCADEs the working artifacts (steps / changesets / messages) while SET-NULLing
    // decisions, so the memory survives. Then best-effort clean up the now-orphaned
    // runs (agent_runs has no mission FK). If THAT step fails, the leftover runs are
    // invisible (the mission is gone, so the session no longer lists), never a ghost.
    const { error } = await db.from("missions").delete().eq("id", data.missionId);
    if (error) throw new Error(error.message);
    await db.from("agent_runs").delete().eq("mission_id", data.missionId);
    return { ok: true };
  });

/**
 * Mid-session natural-language steering (the Claude Code / Cursor interaction).
 * Lands as an agent_messages 'steer' row; the loop injects unconsumed steers
 * as operator guidance at its next step.
 */
export const steerStudioSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ missionId: z.string().uuid(), message: z.string().min(1).max(2000) }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: mission } = await supabase
      .from("missions")
      .select("id,workspace_id")
      .eq("id", data.missionId)
      .maybeSingle();
    if (!mission) throw new Error("Session not found");
    const { data: agent } = await supabase
      .from("agents")
      .select("id")
      .eq("user_id", userId)
      .eq("slug", "builder")
      .maybeSingle();
    if (!agent) throw new Error("Studio agent not found");
    const { error } = await supabase.from("agent_messages").insert({
      user_id: userId,
      workspace_id: (mission as { workspace_id: string }).workspace_id,
      mission_id: data.missionId,
      to_agent_id: (agent as { id: string }).id,
      to_agent_slug: "builder",
      kind: "steer",
      payload: { message: data.message },
    });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/** Per-file before/after contents for the Monaco DiffEditor. */
export const getChangesetDiff = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ changesetId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const db = context.supabase as unknown as SupabaseClient;
    const { data: rows, error } = await db
      .from("studio_changes")
      .select("id,path,op,base_content,new_content,updated_at")
      .eq("changeset_id", data.changesetId)
      .order("path");
    if (error) throw new Error(error.message);
    return { changes: rows ?? [] };
  });

export type StudioRevision = {
  id: string;
  revision_no: number;
  commit_sha: string;
  commit_url: string | null;
  message: string;
  files: Array<{ path: string; op: string }>;
  created_at: string;
};

/**
 * I1b: a changeset's revision history (one row per studio.commit), newest
 * first. Read-only; RLS scopes to the workspace via the parent changeset.
 */
export const getChangesetRevisions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ changesetId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const db = context.supabase as unknown as SupabaseClient;
    const { data: rows, error } = await db
      .from("studio_changeset_revisions")
      .select("id,revision_no,commit_sha,commit_url,message,files,created_at")
      .eq("changeset_id", data.changesetId)
      .order("revision_no", { ascending: false });
    if (error) throw new Error(error.message);
    return { revisions: (rows ?? []) as StudioRevision[] };
  });

/**
 * RPT-31: the Agent Inbox (verification cockpit) cross-mission feed of
 * APPLIED (merged) changesets. One workspace-scoped read: every merged
 * changeset the caller can see, newest first, carrying its mission title (for
 * "in {mission}"), product_id (so the row's rollback controls resolve their
 * history), the PR link, and a real file count. Read-only.
 *
 * Scoping: pinned to ONE workspace (the active one, else the caller's default),
 * the same posture as listChangelog, so a multi-workspace user never sees a
 * merged cross-workspace list under a single-workspace breadcrumb. RLS still
 * enforces access on top. No new table: it reads studio_changesets + missions +
 * studio_changes, the same tables getRollbacks / rollbackRelease already touch.
 */
export type AppliedChange = {
  id: string;
  product_id: string | null;
  mission_id: string | null;
  mission_title: string | null;
  /** The spec this changeset carries, straight off `studio_changesets.prd_id`
   *  (P-131, A-QUEUE.md) -- the live, trusted value, never the copy
   *  `changelog_entries.prd_id` holds, which the merge trigger does not keep
   *  in step with it. */
  prd_id: string | null;
  title: string;
  repo: string;
  branch: string | null;
  pr_url: string | null;
  pr_number: number | null;
  file_count: number;
  merged_at: string;
  /**
   * What GitHub's status rollup said at `studio.pr.merge`, pinned then
   * (P-139, A-QUEUE.md). `undefined` on a row this shape was fetched before
   * this column existed on the type; `null` on a real row the merge never
   * captured a rollup for. The release document tells the two apart.
   *
   * A concrete shape rather than `unknown`, deliberately: `createServerFn`'s
   * own serialization checker refuses `unknown` on a response type, since it
   * cannot prove what crosses the network is JSON-safe. This shape is
   * exactly what `studio.pr.merge` writes and nothing wider.
   */
  ci_checks?: {
    headSha?: string | null;
    at?: string | null;
    checks?: Array<{ name: string; conclusion: string }>;
  } | null;
};

export const listAppliedChanges = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        workspaceId: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(100).optional(),
      })
      .parse(i ?? {}),
  )
  .handler(async ({ context, data }): Promise<{ changes: AppliedChange[] }> => {
    const db = context.supabase as unknown as SupabaseClient;

    // Pin to ONE workspace (active, else the caller's default), matching
    // listChangelog. RLS still enforces access; this restores active-workspace
    // scoping so a merged cross-workspace list never shows under one breadcrumb.
    let workspaceId: string | null = data.workspaceId ?? null;
    if (!workspaceId) {
      const { data: ws } = await db.rpc("current_user_default_workspace");
      workspaceId = (ws as string | null) ?? null;
    }
    if (!workspaceId) return { changes: [] };

    const { data: rows, error } = await db
      .from("studio_changesets")
      .select(
        "id,product_id,mission_id,prd_id,repo,branch,pr_url,pr_number,title,updated_at,ci_checks",
      )
      .eq("workspace_id", workspaceId)
      .eq("status", "merged")
      .order("updated_at", { ascending: false })
      .limit(data.limit ?? 40);
    if (error) throw new Error(error.message);

    type Row = {
      id: string;
      product_id: string | null;
      mission_id: string | null;
      prd_id: string | null;
      repo: string | null;
      branch: string | null;
      pr_url: string | null;
      pr_number: number | null;
      title: string | null;
      updated_at: string;
      ci_checks: unknown;
    };
    const csRows = (rows ?? []) as Row[];
    if (!csRows.length) return { changes: [] };

    // Mission titles (for "in {mission}") and real file counts, one round trip each.
    const missionIds = [
      ...new Set(csRows.map((c) => c.mission_id).filter((id): id is string => !!id)),
    ];
    const changesetIds = csRows.map((c) => c.id);
    const [{ data: missions }, { data: changeRows }] = await Promise.all([
      missionIds.length
        ? db.from("missions").select("id,title").in("id", missionIds)
        : Promise.resolve({ data: [] as { id: string; title: string }[] }),
      db.from("studio_changes").select("changeset_id").in("changeset_id", changesetIds),
    ]);
    const titleByMission = new Map(
      ((missions ?? []) as { id: string; title: string }[]).map((m) => [m.id, m.title]),
    );
    const fileCount = new Map<string, number>();
    for (const r of (changeRows ?? []) as { changeset_id: string }[]) {
      fileCount.set(r.changeset_id, (fileCount.get(r.changeset_id) ?? 0) + 1);
    }

    const changes: AppliedChange[] = csRows.map((c) => ({
      id: c.id,
      product_id: c.product_id,
      mission_id: c.mission_id,
      prd_id: c.prd_id,
      mission_title: c.mission_id ? (titleByMission.get(c.mission_id) ?? null) : null,
      title: c.title ?? "Untitled change",
      repo: c.repo ?? "",
      branch: c.branch,
      pr_url: c.pr_url,
      pr_number: c.pr_number,
      file_count: fileCount.get(c.id) ?? 0,
      merged_at: c.updated_at,
      ci_checks: c.ci_checks as AppliedChange["ci_checks"],
    }));
    return { changes };
  });

/**
 * BYO-P3 WI2 — the studio changeset that best represents what shipped for a PRD.
 * Prefers a direct prd_id link (stamped at creation by the
 * studio_changeset_link_prd trigger); falls back to resolving the PRD's
 * dispatched missions via artifact_lineage for changesets that predate the
 * trigger. Among candidates, picks the one closest to shipped (merged > pr_open
 * > committed > staged, newest wins). Read-only; RLS scopes to the workspace.
 */
export type ChangesetByPrd = {
  id: string;
  product_id: string | null;
  status: string;
  repo: string | null;
  branch: string | null;
  pr_url: string | null;
  pr_number: number | null;
  title: string | null;
  summary: string | null;
  release_notes: string | null;
  release_notes_at: string | null;
  prd_id: string | null;
  mission_id: string | null;
  updated_at: string | null;
};

export const getChangesetByPrd = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ prdId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }): Promise<{ changeset: ChangesetByPrd | null }> => {
    const db = context.supabase as unknown as SupabaseClient;
    const cols =
      "id,product_id,status,repo,branch,pr_url,pr_number,title,summary,release_notes,release_notes_at,prd_id,mission_id,updated_at";

    const { data: direct, error: dErr } = await db
      .from("studio_changesets")
      .select(cols)
      .eq("prd_id", data.prdId)
      .order("updated_at", { ascending: false });
    if (dErr) throw new Error(dErr.message);

    let candidates = (direct ?? []) as unknown as ChangesetByPrd[];

    // Fallback for changesets whose prd_id was never stamped: resolve via the
    // dispatch lineage edge (prd → mission), then by mission_id.
    if (!candidates.length) {
      const { data: edges } = await db
        .from("artifact_lineage")
        .select("child_id")
        .eq("parent_kind", "prd")
        .eq("parent_id", data.prdId)
        .eq("child_kind", "mission");
      const missionIds = Array.from(
        new Set((edges ?? []).map((e) => e.child_id as string).filter(Boolean)),
      );
      if (missionIds.length) {
        const { data: byMission, error: mErr } = await db
          .from("studio_changesets")
          .select(cols)
          .in("mission_id", missionIds)
          .order("updated_at", { ascending: false });
        if (mErr) throw new Error(mErr.message);
        candidates = (byMission ?? []) as unknown as ChangesetByPrd[];
      }
    }

    const changeset = pickChangesetForPrd(candidates);
    return { changeset: changeset ?? null };
  });

/* ------------------------------------------------------------------------ *
 * SHIP STAMP - the write that closes spec -> build -> merge -> learn.
 * ------------------------------------------------------------------------ */

/**
 * THE DEFECT THIS PREVENTS. Merging a Studio changeset stamped nothing on the
 * spec it came from. Only two writers ever set prds.shipped_at: checkPrdShipped
 * (outcome.functions.ts), which needs a linked GitHub issue that closed, and the
 * production promote (deployments.functions.ts). The promote is unreachable on a
 * customer's own repo: it refuses without a successful PREVIEW deployment row,
 * and ci-poll-tick only creates those for Supaprod-managed repos (supaprod.json)
 * with Deno Deploy configured. So on a bring-your-own repo the chain ended at
 * "merged" and went no further: no shipped spec, so no outcome to settle, so no
 * outcome memory, so the precedent pool stayed empty and "past calls surface
 * before this one is made" was not true. Sixteen merged changesets stood in
 * production behind zero shipped specs.
 *
 * WHY MERGE IS THE HONEST TRIGGER AND NOT DEPLOY. A merged pull request is not
 * always a deploy, and this deliberately does not claim it is. It claims exactly
 * one thing: the change reached the repository's default branch. That is the
 * right moment for THIS record for three reasons.
 *
 *   1. It is the last event Supaprod performs and can verify for itself. Studio
 *      opens every pull request against the default branch (studio.pr.open
 *      passes `base: defaultBranch`), the merge runs only after the CI-green
 *      gate and the eval-regression gate, and GitHub answers with `merged:true`
 *      plus a commit SHA. Nothing is inferred. What a customer's own CD does
 *      afterwards is outside Supaprod's reach on a repo it does not host, so
 *      waiting for a deploy signal that can never arrive is precisely how the
 *      loop stayed broken.
 *   2. It is a STRICTLY STRONGER fact than the writer the product already
 *      trusts. checkPrdShipped stamps shipped_at when a linked GitHub issue
 *      closes, and an issue closes for any reason at all, wontfix and duplicate
 *      included. A merge into trunk behind green CI is better evidence than
 *      that. This raises the bar for the stamp; it does not lower it.
 *   3. It never displaces a stronger record. The stamp is refused when
 *      shipped_at is already set, and the UPDATE carries its own
 *      `shipped_at IS NULL` guard so a concurrent production promote cannot be
 *      clobbered by a slower merge. The production deploy keeps its own precise
 *      time on the deployments row regardless, so no information is lost.
 *
 * WHAT WOULD BE DISHONEST AND IS THEREFORE REFUSED. A merge into any branch
 * other than the default one is not shipping (a stacked branch, a release
 * train's integration branch), so an unconfirmed or non-default base refuses
 * rather than guesses. A merge GitHub did not confirm, or one that produced no
 * commit, refuses. A changeset with no spec behind it refuses, because there is
 * nothing to learn against.
 */
export type StudioMergeShipInput = {
  /** GitHub's own `merged` flag from the merge response, not an HTTP status. */
  mergeConfirmed: boolean;
  /** The commit the merge produced. GitHub returns one only on a real merge. */
  mergeSha: string | null;
  /** The branch the pull request actually targeted, read back from GitHub. */
  baseBranch: string | null;
  /** The repository's default branch, read back from GitHub. */
  defaultBranch: string | null;
  /** The changeset's status after the merge write (must already be 'merged'). */
  changesetStatus: string;
  /** The spec this changeset resolves to (studio_changesets.prd_id). */
  prdId: string | null;
  /** What the spec already records. A recorded ship is never restamped. */
  existingShippedAt: string | null;
};

export type StudioMergeShipDecision =
  { stamp: true; prdId: string } | { stamp: false; reason: string };

/**
 * The pure decision: does THIS merge result close the loop on a spec?
 *
 * Deny by default, and every refusal names what was missing so the Ship station
 * can say why rather than going quiet. Kept free of I/O so the rule can be
 * judged without a database, which is the only way a claim this load-bearing
 * stays checkable.
 */
export function decideStudioMergeShipStamp(input: StudioMergeShipInput): StudioMergeShipDecision {
  if (!input.mergeConfirmed) {
    return { stamp: false, reason: "GitHub did not confirm the merge" };
  }
  if (!input.mergeSha || input.mergeSha.trim().length === 0) {
    return { stamp: false, reason: "the merge produced no commit" };
  }
  if (input.changesetStatus !== "merged") {
    return { stamp: false, reason: `the change is ${input.changesetStatus}, not merged` };
  }
  // An unknown base is not a default base. Guessing here is how a release
  // train's integration branch would get recorded as a ship.
  if (!input.baseBranch || !input.defaultBranch) {
    return { stamp: false, reason: "the branch this merged into could not be confirmed" };
  }
  if (input.baseBranch !== input.defaultBranch) {
    return {
      stamp: false,
      reason: `this merged into ${input.baseBranch}, not the default branch`,
    };
  }
  if (!input.prdId) {
    return { stamp: false, reason: "this change has no spec behind it" };
  }
  if (input.existingShippedAt) {
    return { stamp: false, reason: "the spec already records when it shipped" };
  }
  return { stamp: true, prdId: input.prdId };
}

/**
 * Record the ship on the spec behind a Studio changeset that just merged.
 *
 * Call this ONLY from the merge path, immediately after GitHub confirms the
 * merge and the changeset row has been moved to 'merged'. It resolves the spec
 * through studio_changesets.prd_id (stamped at creation by the
 * studio_changeset_link_prd trigger), applies the pure decision above, and on a
 * yes writes status + shipped_at and files the stage event so the Ship to Learn
 * transition reads from a real row like every other transition.
 *
 * Returns the decision, including the refusal reason, so the caller can report
 * what it did instead of narrating a step that never happened.
 */
export async function stampSpecShippedOnStudioMerge(
  db: SupabaseClient,
  args: {
    changesetId: string;
    userId: string | null;
    mergeConfirmed: boolean;
    mergeSha: string | null;
    baseBranch: string | null;
    defaultBranch: string | null;
    /** When the merge landed. Defaults to now. */
    mergedAt?: string;
  },
): Promise<StudioMergeShipDecision> {
  const { data: csRow, error: csErr } = await db
    .from("studio_changesets")
    .select("id,status,prd_id,workspace_id")
    .eq("id", args.changesetId)
    .maybeSingle();
  if (csErr) return { stamp: false, reason: csErr.message };
  if (!csRow) return { stamp: false, reason: "the change no longer exists" };
  const cs = csRow as unknown as {
    status: string;
    prd_id: string | null;
    workspace_id: string | null;
  };

  let priorStatus: string | null = null;
  let existingShippedAt: string | null = null;
  if (cs.prd_id) {
    const { data: prdRow, error: prdErr } = await db
      .from("prds")
      .select("id,status,shipped_at")
      .eq("id", cs.prd_id)
      .maybeSingle();
    if (prdErr) return { stamp: false, reason: prdErr.message };
    if (!prdRow) return { stamp: false, reason: "the linked spec no longer exists" };
    const prd = prdRow as unknown as { status: string | null; shipped_at: string | null };
    priorStatus = prd.status ?? null;
    existingShippedAt = prd.shipped_at ?? null;
  }

  const decision = decideStudioMergeShipStamp({
    mergeConfirmed: args.mergeConfirmed,
    mergeSha: args.mergeSha,
    baseBranch: args.baseBranch,
    defaultBranch: args.defaultBranch,
    changesetStatus: cs.status,
    prdId: cs.prd_id,
    existingShippedAt,
  });
  if (!decision.stamp) return decision;

  const shippedAt = args.mergedAt ?? new Date().toISOString();
  // The never-overwrite rule lives on the UPDATE, not only in the decision
  // above: a production promote can stamp between the read and this write, and
  // a read-then-write check would let the slower merge clobber the better
  // record. `shipped_at IS NULL` makes the guard atomic.
  const { data: updated, error: upErr } = await db
    .from("prds")
    .update({
      status: "shipped",
      shipped_at: shippedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", decision.prdId)
    .is("shipped_at", null)
    .select("id");
  if (upErr) return { stamp: false, reason: upErr.message };
  if (!updated || (updated as unknown[]).length === 0) {
    return { stamp: false, reason: "the spec already records when it shipped" };
  }

  await recordStageEvent(db, {
    entityType: "spec",
    entityId: decision.prdId,
    from: priorStatus,
    to: "shipped",
    actor: "studio",
    workspaceId: cs.workspace_id,
    userId: args.userId,
  });

  return decision;
}

/**
 * K2: revert the changeset's branch to a prior revision's file state. Operator
 * door for the rollback in `studio-revert.server.ts` (non-destructive: a forward
 * commit restoring the target tree). Resolves GitHub auth for the changeset's
 * workspace, then delegates to the shared helper. The operator initiating it IS
 * the authorization (the same human-in-the-loop posture as the agent's gates).
 */
export const revertToRevision = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ changesetId: z.string().uuid(), revisionId: z.string().uuid() }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const db = supabase as unknown as SupabaseClient;
    const { data: csRow, error: csErr } = await db
      .from("studio_changesets")
      .select("id,workspace_id,branch,status")
      .eq("id", data.changesetId)
      .maybeSingle();
    if (csErr) throw new Error(csErr.message);
    if (!csRow) throw new Error("Changeset not found.");
    const cs = csRow as { id: string; workspace_id: string | null; branch: string | null };
    if (!cs.branch)
      throw new Error("This changeset has no commits yet, so there is nothing to revert to.");
    const { token, repo } = await resolveGitHub({
      userId,
      workspaceId: cs.workspace_id,
      userClient: db,
    });
    return await revertChangesetToRevision({
      supabase: db,
      userId,
      token,
      repo,
      changesetId: cs.id,
      branch: cs.branch,
      revisionId: data.revisionId,
    });
  });

/**
 * K2: roll back a merged release by synthesizing an inverse changeset.
 * Reads touched paths from the merge commit's parent (GitHub parent SHA),
 * reconstructs the undo (create->delete, update->restore, delete->create),
 * and creates a new rollback mission + revert changeset. The revert flows
 * through the existing commit->PR->J2-gated-merge rails. Returns the rollback
 * mission ID so the UI can navigate to it.
 */
export const rollbackRelease = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        changesetId: z.string().uuid(),
        reason: z.string().min(1).max(500),
      })
      .parse(i),
  )
  .handler(
    async ({
      context,
      data,
    }): Promise<{ rollbackId: string; revertChangesetId: string; revertMissionId: string }> => {
      const { supabase, userId } = context;
      const db = supabase as unknown as SupabaseClient;
      const result = await runRollbackRelease(db, userId, data);

      // Drive the staged revert through the existing Build rails: a Build agent
      // run on the rollback mission calls studio.commit -> studio.pr.open (each
      // confirm-gated for the operator). Mirrors build.functions.ts dispatch.
      // The loop returns once it hits the first approval gate; the operator then
      // clears the gates from the revert mission's build session.
      const goal = [
        "A revert changeset has already been staged on this mission (the inverse of a merged release).",
        "Commit the staged changes with studio.commit, then open a pull request with studio.pr.open.",
        "Do not stage new edits or modify any files - only commit what is already staged and open the PR.",
      ].join(" ");
      await runAgentLoop(db, userId, {
        agentSlug: "builder",
        goal,
        missionId: result.revertMissionId,
      });

      return result;
    },
  );

/**
 * K2 R3: kill an in-flight changeset (staged/committed/pr_open).
 * Closes any open PR, releases builder_file_claims, and marks the changeset abandoned.
 * Idempotent: safe to call multiple times.
 */
export const abandonChangeset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        changesetId: z.string().uuid(),
        reason: z.string().min(1).max(500),
      })
      .parse(i),
  )
  .handler(async ({ context, data }): Promise<{ success: boolean }> => {
    const db = context.supabase as unknown as SupabaseClient;
    const userId = context.userId;

    // Fetch changeset
    const { data: csRow } = await db
      .from("studio_changesets")
      .select("id,status,repo,pr_number,branch,mission_id,workspace_id")
      .eq("id", data.changesetId)
      .maybeSingle();
    if (!csRow) throw new Error("Changeset not found.");
    const cs = csRow as {
      id: string;
      status: string;
      repo: string;
      pr_number: number | null;
      branch: string | null;
      mission_id: string | null;
      workspace_id: string | null;
    };
    if (!["staged", "committed", "pr_open"].includes(cs.status)) {
      throw new Error(`Cannot abandon a ${cs.status} changeset.`);
    }

    // Resolve GitHub auth via the connector chain (same as studio.commit), only
    // when we actually touch GitHub. Avoids the wrong process.env.GITHUB_TOKEN path.
    const headers =
      cs.pr_number || cs.branch
        ? ghHeaders(
            (await resolveGitHub({ userId, workspaceId: cs.workspace_id, userClient: db })).token,
          )
        : null;

    // Close PR if open
    if (cs.pr_number && headers) {
      const prUrl = `https://api.github.com/repos/${cs.repo}/pulls/${cs.pr_number}`;
      try {
        await fetch(prUrl, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ state: "closed" }),
        });
      } catch (error) {
        console.error("Failed to close PR (best effort):", error);
      }
    }

    // Delete branch (best effort)
    if (cs.branch && headers) {
      const branchUrl = `https://api.github.com/repos/${cs.repo}/git/refs/heads/${encodeURIComponent(cs.branch)}`;
      try {
        await fetch(branchUrl, { method: "DELETE", headers });
      } catch (error) {
        console.error("Failed to delete branch (best effort):", error);
      }
    }

    // Release file claims
    if (cs.mission_id) {
      const { error: claimsErr } = await db
        .from("builder_file_claims")
        .update({
          status: "released",
          released_reason: "rollback_abandon",
          released_at: new Date().toISOString(),
        })
        .eq("mission_id", cs.mission_id)
        .eq("status", "held");
      if (claimsErr) console.error("Failed to release claims:", claimsErr.message);
    }

    // Abandon the changeset
    const { error: upErr } = await db
      .from("studio_changesets")
      .update({ status: "abandoned", updated_at: new Date().toISOString() })
      .eq("id", cs.id);
    if (upErr) throw new Error(upErr.message);

    return { success: true };
  });

/**
 * K2 R2: fetch rollback history for a product.
 * Pre-migration tolerant: returns empty array if table doesn't exist yet.
 */
export const getRollbacks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        productId: z.string().uuid(),
      })
      .parse(i),
  )
  .handler(
    async ({
      context,
      data,
    }): Promise<{
      rollbacks: Array<{
        id: string;
        original_changeset_id: string;
        original_pr_number: number | null;
        revert_changeset_id: string | null;
        revert_pr_number: number | null;
        reason: string;
        status: string;
        note: string | null;
        created_at: string;
      }>;
    }> => {
      const db = context.supabase as unknown as SupabaseClient;

      // Pre-migration tolerance: a missing table/column resolves to an empty list,
      // not a throw. PostgREST returns PGRST205 (missing table) / PGRST204 (missing
      // column); direct Postgres returns 42P01. None of these contain "does not exist".
      const isMissingRelation = (code: string | undefined | null) =>
        code === "42P01" || code === "PGRST205" || code === "PGRST204";

      try {
        // Two FKs to the same table must be aliased and disambiguated by the FK
        // name; PostgREST returns each under its alias as a to-one object (not a
        // positional array on a shared `studio_changesets` key).
        const { data: rows, error } = await db
          .from("studio_rollbacks")
          .select(
            `id,
            original_changeset_id,
            revert_changeset_id,
            reason,
            status,
            note,
            created_at,
            original:studio_changesets!original_changeset_id(pr_number),
            revert:studio_changesets!revert_changeset_id(pr_number,status)`,
          )
          .eq("product_id", data.productId)
          .order("created_at", { ascending: false });

        if (error) {
          if (isMissingRelation(error.code)) return { rollbacks: [] };
          throw new Error(error.message);
        }

        type CsEmbed = { pr_number: number | null; status?: string | null };
        type RollbackRow = {
          id: string;
          original_changeset_id: string;
          revert_changeset_id: string | null;
          reason: string;
          status: string;
          note: string | null;
          created_at: string;
          // PostgREST returns a to-one embed as an object, but supabase-js types
          // embeds as arrays; accept either shape and normalize with one().
          original?: CsEmbed | CsEmbed[] | null;
          revert?: CsEmbed | CsEmbed[] | null;
        };
        const one = (v: CsEmbed | CsEmbed[] | null | undefined): CsEmbed | null =>
          Array.isArray(v) ? (v[0] ?? null) : (v ?? null);
        const rollbacks = ((rows ?? []) as unknown as RollbackRow[]).map((r) => {
          const revert = one(r.revert);
          return {
            id: r.id,
            original_changeset_id: r.original_changeset_id,
            original_pr_number: one(r.original)?.pr_number ?? null,
            revert_changeset_id: r.revert_changeset_id,
            revert_pr_number: revert?.pr_number ?? null,
            reason: r.reason,
            // Show 'reverted' only when the revert changeset has actually merged;
            // otherwise the stored status ('initiated' / 'failed'). Avoids claiming
            // a revert shipped when it is still staged or in review.
            status: revert?.status === "merged" ? "reverted" : r.status,
            note: r.note,
            created_at: r.created_at,
          };
        });

        return { rollbacks };
      } catch (error) {
        if (isMissingRelation((error as { code?: string } | null)?.code)) {
          return { rollbacks: [] };
        }
        throw error;
      }
    },
  );

/**
 * K1: generate (or regenerate) release notes for a changeset. Factual notes
 * drawn ONLY from the changeset's files + commit revisions + linked work order,
 * via the AI chokepoint (the runtime sanitizer humanizes the output). Persisted
 * on the changeset so they are operator-reviewable and stable across views.
 * Deploy itself is external (Lovable); this is the ship artifact, not a trigger.
 */
/**
 * Core of generateReleaseNotes, factored out so promoteToProduction can call
 * it inline (best-effort, non-fatal) as well as the client-facing server fn -
 * the spec's own "release notes attach automatically on ship" line needs a
 * plain function, not a second HTTP round trip through the server-fn wrapper.
 */
export async function generateReleaseNotesCore(
  db: SupabaseClient,
  userId: string,
  changesetId: string,
): Promise<{ release_notes: string }> {
  const { data: csRow, error: csErr } = await db
    .from("studio_changesets")
    .select("id,workspace_id,mission_id,repo,branch,title,summary")
    .eq("id", changesetId)
    .maybeSingle();
  if (csErr) throw new Error(csErr.message);
  if (!csRow) throw new Error("Changeset not found.");
  const cs = csRow as {
    id: string;
    workspace_id: string | null;
    mission_id: string | null;
    repo: string;
    branch: string | null;
    title: string | null;
    summary: string | null;
  };

  const { data: fileRows } = await db
    .from("studio_changes")
    .select("path,op")
    .eq("changeset_id", cs.id)
    .order("path");
  const { data: revRows } = await db
    .from("studio_changeset_revisions")
    .select("revision_no,message")
    .eq("changeset_id", cs.id)
    .order("revision_no", { ascending: true });
  const files = (fileRows ?? []) as Array<{ path: string; op: string }>;
  const revs = (revRows ?? []) as Array<{ revision_no: number; message: string }>;
  if (files.length === 0 && revs.length === 0)
    throw new Error("Nothing to describe yet: stage and commit changes first.");

  let workOrder = "";
  if (cs.mission_id) {
    const { data: m } = await db
      .from("missions")
      .select("title,goal")
      .eq("id", cs.mission_id)
      .maybeSingle();
    const mm = m as { title?: string | null; goal?: string | null } | null;
    workOrder = (mm?.goal ?? mm?.title ?? "").slice(0, 4000);
  }

  const fileList = files.map((f) => `${f.op} ${f.path}`).join("\n") || "(none recorded)";
  // Cap each commit message (untrusted: an agent or member authored it) so a
  // crafted message can't dominate or hijack the release-notes prompt.
  const commits = revs.map((r) => `r${r.revision_no}: ${r.message.slice(0, 500)}`).join("\n");
  const system =
    "You write concise, factual software release notes. Output GitHub-flavored markdown: a one-line summary, then a short bulleted 'What changed' grounded ONLY in the provided files and commit messages, then a 'Notable' line only if warranted. No marketing tone, no hype, no invented features or claims. Under 180 words.";
  const user = [
    cs.title ? `Title: ${cs.title}` : "",
    cs.summary ? `Summary: ${cs.summary}` : "",
    workOrder ? `Work order context:\n${workOrder}` : "",
    `Files changed:\n${fileList}`,
    commits ? `Commits:\n${commits}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const result = await callModel(db, userId, {
    surface: "studio",
    surface_ref: `release-notes:${cs.id}`,
    model: "google/gemini-2.5-flash",
    workspaceId: cs.workspace_id,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  if (result.status !== "ok" || !result.output.trim())
    throw new Error(result.error || "Release-notes generation failed.");
  const notes = result.output.trim();

  // THE WRITE THAT DECIDES WHETHER A RELEASE IS VISIBLE AT ALL, so it is checked
  // rather than assumed. supabase-js RESOLVES a write the database refused as
  // `{ data: null, error: null }`, so the old `error`-only check returned
  // `{ release_notes }` to every caller as though the notes had landed. /ship is
  // spined on the changelog, and the only writer that fires on THIS path is
  // trg_studio_changeset_to_changelog, on a merged changeset whose release_notes
  // are non-empty. (Two TypeScript paths also upsert changelog_entries --
  // publishChangelogEntry at changelog.functions.ts:174 and recordOutcome at
  // outcome.functions.ts:690 -- but both are user-triggered and neither runs
  // here, so neither rescues a refusal on this write.) A silently refused update
  // therefore means the release never appears on /ship until a person finds one
  // of those other two doors, and because promote's best-effort catch only fires
  // on a throw, nothing anywhere reported why. Selecting the
  // row and requiring one back turns the refusal into the error the callers
  // already handle — promote files it as a warning on the Receipt, the CI tick
  // logs it, and the Studio button surfaces it in place of a false success.
  //
  // The `.select("id")` cannot itself invent a refusal here: the read at the top
  // of this function already proved this caller can SELECT this changeset, so an
  // empty row set means the UPDATE matched nothing, not that the return was
  // withheld.
  const { data: savedRows, error: upErr } = await db
    .from("studio_changesets")
    .update({ release_notes: notes, release_notes_at: new Date().toISOString() })
    .eq("id", cs.id)
    .select("id");
  if (upErr) throw new Error(upErr.message);
  if (!savedRows || (savedRows as unknown[]).length === 0) {
    throw new Error(
      "The release notes were written but the database refused to save them, so nothing downstream can see them. You may not have rights to update this changeset.",
    );
  }
  return { release_notes: notes };
}

export const generateReleaseNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ changesetId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }): Promise<{ release_notes: string }> => {
    const db = context.supabase as unknown as SupabaseClient;
    return generateReleaseNotesCore(db, context.userId, data.changesetId);
  });

/**
 * I1 curation: drop a whole staged file from a not-yet-committed changeset (reject the
 * entire file before commit). RLS scopes the delete to the workspace.
 */
export const rejectStagedFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ changesetId: z.string().uuid(), path: z.string().min(1).max(400) }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const db = context.supabase as unknown as SupabaseClient;
    const { data: cs, error: csErr } = await db
      .from("studio_changesets")
      .select("id,status")
      .eq("id", data.changesetId)
      .maybeSingle();
    if (csErr) throw new Error(csErr.message);
    if (!cs) throw new Error("Changeset not found.");
    if ((cs as { status: string }).status !== "staged")
      throw new Error("Only a staged changeset can be curated; this one is already committed.");
    const { error } = await db
      .from("studio_changes")
      .delete()
      .eq("changeset_id", data.changesetId)
      .eq("path", data.path);
    if (error) throw new Error(error.message);
    return { ok: true, path: data.path };
  });

// NOTE: the changeset-wide "merge across files" primitive lives as the pure,
// unit-tested applyChangesetHunkSelections() in src/lib/ai/studio-hunks.ts (the
// spec's home for the merge logic). It is not re-exposed as a TanStack server fn
// here because the operator path drives per-file curation via
// applyStagedHunkSelection; a changeset-wide server endpoint would be an
// un-driven surface. The agent/contract door can import the pure helper directly.

// SANDBOX: previewable file types + a payload cap for the $0 self-contained preview.
const PREVIEWABLE_HTML = /\.html?$/i;
const MAX_PREVIEW_BYTES = 512_000;
