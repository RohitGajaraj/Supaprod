import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database, Json, TablesInsert } from "@/integrations/supabase/types";
import { track } from "@/lib/observability";
import { recordDecisionOrigins } from "@/lib/lineage.functions";
import { extractAssumptions } from "@/lib/ai/assumptions.server";
import { recordStageEvent } from "@/lib/stage-events.server";
// The pure parser for prds.outcome, so this file never grows a second
// definition of "what counts as an overturn". Type-only for OutcomeOverturn.
import { priorSettlement, type OutcomeOverturn } from "@/lib/outcome.functions";
// Pure string helpers, zero imports of their own, so they are safe on the server.
import { stripAutoPrefix } from "@/components/plan/format";
import { creditsSpentByTrace } from "@/lib/credits.functions";

/**
 * Every origin `decisions.source_kind` can hold, and the ONLY place the list is
 * written down on this side of the wire.
 *
 * IT USED TO BE A HAND-WRITTEN UNION OF FOUR, and it had fallen three
 * migrations behind the database. The check constraint has been widened three
 * times -- 'opportunity' 2026-08-06, 'mcp' 2026-08-10, 'agent' 2026-08-11 --
 * and 'roadmap', 'retrospective' and 'critic' predate all of them. None reached
 * this union, so `d.source_kind as DecisionSource` at DecisionDetail.tsx told
 * tsc a value was one of four when the database permits ten, and
 * `SOURCE_LABEL[sourceKind]` returned undefined for every row outside the four.
 *
 * Measured 2026-08-11:
 *
 *   select source_kind, count(*) from decisions group by 1 order by 2 desc;
 *   -- mission 205, prd 29, roadmap 28, manual 10, critic 8,
 *   -- retrospective 8, opportunity 6, meeting 2
 *
 * 50 of 296 rows -- roadmap, critic, retrospective, opportunity -- rendered a
 * blank source label, and none of the four was reachable from the panel's
 * filter, which hard-coded the same stale list a second time.
 *
 * A CONST ARRAY RATHER THAN A UNION, because the union could only be kept in
 * step by remembering to. Deriving the type from the array makes
 * `Record<DecisionSource, string>` an exhaustiveness check: add a value here
 * and every label map that does not cover it fails to compile, which is what
 * should have happened the first time this drifted.
 *
 * Adding a value here is HALF the change. The database's check constraint is
 * the other half, and `the-source-kinds-agree.test.ts` reads the migrations and
 * fails when the two disagree in either direction.
 */
export const DECISION_SOURCES = [
  "meeting",
  "mission",
  "prd",
  "manual",
  "roadmap",
  "retrospective",
  "critic",
  "opportunity",
  /** Recorded by an external agent through POST /api/mcp under a scoped token. */
  "mcp",
  /** The Decide station's own hand, `decision.record`, called inside a mission. */
  "agent",
] as const;

export type DecisionSource = (typeof DECISION_SOURCES)[number];

export type DecisionRow = {
  id: string;
  title: string;
  rationale: string | null;
  status: "pending" | "approved" | "rejected";
  source_kind: DecisionSource | null;
  meeting_id: string | null;
  mission_id: string | null;
  prd_id: string | null;
  decided_by_agent_slug: string | null;
  // PC-10: the prior rationale captured before the last in-place edit (agent or
  // human). Non-null = the decision was revised and can be one-key Rewound.
  snapshot_before: string | null;
  created_at: string;
  source_label?: string | null;
  /* Provenance, since the title no longer carries it. The "[auto] " prefix was
   * retired from the data in migration 20260805120000, and stripAutoPrefix now
   * runs at the read boundary anyway, so isAutoTitle(title) returns false for
   * every row and the "Auto" chip would have silently vanished. Read this. */
  auto_origin?: boolean | null;
  /* FC-01 read side: what was believed beforehand and how the belief settled.
   * Optional (like source_label) because DecisionRow is a cast over the select
   * result, and every fixture and caller that predates the forecast keeps
   * compiling. An absent claim is ordinary; nothing may infer one. */
  forecast_claim?: string | null;
  forecast_how_we_will_know?: string | null;
  forecast_horizon_date?: string | null;
  /** "hit" | "miss" | "inconclusive", or null while waiting on its horizon. */
  forecast_resolution?: string | null;
  forecast_resolved_at?: string | null;
  /** The status of the mission this decision came from, read in the same hop
   *  as its title. The approvals queue drops a decision whose mission is still
   *  `proposed` (the launch gate is the one call); it used to re-read the
   *  mission to learn that. */
  mission_status?: string | null;
  /** The project of the spec this decision came from, same hop as its title;
   *  the queue names the project on the card. */
  prd_project_id?: string | null;
};

/**
 * FC-01: the two ways a forecast can be malformed, in one place.
 *
 * PURE AND EXPORTED so it can be tested directly. Both callers below live
 * inside `createServerFn(...).inputValidator(...)`, which is not reachable from
 * a unit test without standing up a request, and this rule is the part worth
 * pinning: it is what stops an unresolvable forecast being counted as one.
 *
 * Returns the refusal in the words the person should read, or null when the
 * shape is fine. `null` for "no forecast at all" is deliberate and is not the
 * same as invalid: a decision with no forecast is ordinary, and the moment we
 * make the field mandatory people write "it will go well" to get past it, which
 * is a forecast-shaped object that settles nothing.
 */
export function forecastRefusal(input: {
  forecast_claim?: string | null;
  forecast_how_we_will_know?: string | null;
  forecast_horizon_date?: string | null;
  now?: number;
}): { path: "forecast_claim" | "forecast_horizon_date"; message: string } | null {
  const given = [
    input.forecast_claim,
    input.forecast_how_we_will_know,
    input.forecast_horizon_date,
  ].filter((p) => p != null).length;

  // ALL THREE OR NONE. The three fields are one artifact and each missing piece
  // breaks it differently. A claim with no observable reads as a forecast and
  // resolves as an argument. A claim with no horizon is never due, so the
  // calibrator's partial index (idx_decisions_forecast_due) never surfaces it
  // and it silently never resolves. Either shape makes a decision look
  // forecast-bearing while being ungradeable, which is worse than carrying no
  // forecast, because the count would then overstate what can ever be settled.
  if (given > 0 && given < 3) {
    return {
      path: "forecast_claim",
      message:
        "A forecast needs all three parts: what you expect, how you will know, and by when. Without the observable it cannot be settled, and without the horizon it never comes due.",
    };
  }

  // A HORIZON THAT HAS ALREADY PASSED is being written with the answer
  // available. The immutability trigger cannot catch this one: it fires BEFORE
  // UPDATE and this arrives on an insert, so it is refused here or not at all.
  if (
    input.forecast_horizon_date &&
    Date.parse(input.forecast_horizon_date) <= (input.now ?? Date.now())
  ) {
    return {
      path: "forecast_horizon_date",
      message:
        "The horizon has already passed, so this would be recorded with the answer available. A forecast is only a forecast before the outcome is known.",
    };
  }

  return null;
}

export const listDecisions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        source: z.enum(["meeting", "mission", "prd", "manual"]).optional(),
        status: z.enum(["pending", "approved", "rejected"]).optional(),
        q: z.string().max(200).optional(),
        limit: z.number().int().min(1).max(200).default(100),
        // The federated approvals queue's workspace scoping (Change 3): when
        // given, narrows to one workspace's decisions; omitted keeps the
        // RLS-wide read every other caller of listDecisions already relies on.
        workspaceId: z.string().uuid().optional(),
      })
      .partial()
      .parse(i ?? {}),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    return readDecisions(supabase, data ?? {});
  });

export type DecisionsFilter = {
  source?: DecisionSource;
  status?: "pending" | "approved" | "rejected";
  q?: string;
  limit?: number;
  workspaceId?: string;
};

/**
 * THE READ BEHIND `listDecisions`, callable with a client you already hold.
 * The approvals queue called the server function from inside its own handler,
 * which re-ran the auth middleware for one nested call on the Inbox's critical
 * path (2026-09-08, the 7.7 s queue). The hydration hop also carries a
 * mission's status and a spec's project now, because the queue had been paying
 * a THIRD round trip to ask for exactly those two columns on rows this read
 * had just fetched by id.
 */
export async function readDecisions(
  supabase: SupabaseClient<Database>,
  data: DecisionsFilter,
): Promise<{
  decisions: DecisionRow[];
  /**
   * The first error among the three hydration reads (missions, specs,
   * meetings), or null. A decision whose source did not come back keeps its
   * place with `source_label`, `mission_status` and `prd_project_id` null:
   * cannot-tell keeps a call. The approvals queue reports this as a gap so a
   * dedup it could not run is visible rather than silent.
   */
  hydrationError: { message: string } | null;
}> {
  {
    let q = supabase
      .from("decisions")
      /*
       * THE FORECAST COLUMNS ARE HERE BECAUSE THE MOAT IS THE FORECAST.
       *
       * Added 2026-08-24 answering REQ-014. Both agent doors REFUSE a decision
       * without all three parts -- `registry.server.ts` and MCP's
       * `record_decision` both reject an incomplete forecast -- and this read,
       * which is what a human sees when approving that same decision, selected
       * none of them. So a person could approve an agent's bet without ever
       * being shown what the agent believed would happen.
       *
       * Selecting them is inert until a surface renders them, and that is the
       * point: the reader could not have been built while the read carried no
       * fields. This is the half that unblocks the other half.
       *
       * EVERY NAME HERE CARRIES THE `forecast_` PREFIX, and two of them do not
       * look like they should. `forecast_how_we_will_know` and
       * `forecast_horizon_date` are the real columns; REQ-014 asked for them as
       * `how_we_will_know` and `horizon_date`, and a first draft of this select
       * used those. Neither exists. Verified against `information_schema` on
       * 2026-08-24 rather than inferred from the request, because a select with
       * a wrong column name throws at RUNTIME on a surface nobody was watching.
       */
      .select(
        "id,title,rationale,status,source_kind,meeting_id,mission_id,prd_id,decided_by_agent_slug,snapshot_before,created_at,auto_origin,forecast_claim,forecast_how_we_will_know,forecast_horizon_date,forecast_resolution,forecast_resolved_at",
      )
      .order("created_at", { ascending: false })
      .limit(data?.limit ?? 100);
    if (data?.source) q = q.eq("source_kind", data.source);
    if (data?.status) q = q.eq("status", data.status);
    if (data?.workspaceId) q = q.eq("workspace_id", data.workspaceId);
    if (data?.q && data.q.trim()) q = q.ilike("title", `%${data.q.trim()}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    // Hydrate source labels in one batch per kind.
    const decisions = (rows ?? []) as DecisionRow[];
    const missionIds = [
      ...new Set(decisions.map((d) => d.mission_id).filter((x): x is string => !!x)),
    ];
    const prdIds = [...new Set(decisions.map((d) => d.prd_id).filter((x): x is string => !!x))];
    const meetingIds = [
      ...new Set(decisions.map((d) => d.meeting_id).filter((x): x is string => !!x)),
    ];

    const [missions, prds, meetings] = await Promise.all([
      missionIds.length
        ? supabase.from("missions").select("id,title,status").in("id", missionIds)
        : Promise.resolve({
            data: [] as { id: string; title: string; status: string }[],
            error: null as { message: string } | null,
          }),
      prdIds.length
        ? supabase.from("prds").select("id,title,project_id").in("id", prdIds)
        : Promise.resolve({
            data: [] as { id: string; title: string; project_id: string | null }[],
            error: null as { message: string } | null,
          }),
      meetingIds.length
        ? supabase.from("meetings").select("id,title").in("id", meetingIds)
        : Promise.resolve({
            data: [] as { id: string; title: string }[],
            error: null as { message: string } | null,
          }),
    ]);
    const missionMap = new Map<string, string>(
      (missions.data ?? []).map((r) => [r.id as string, r.title as string]),
    );
    const missionStatus = new Map<string, string>(
      (missions.data ?? []).map((r) => [r.id as string, r.status as string]),
    );
    const prdMap = new Map<string, string>(
      (prds.data ?? []).map((r) => [r.id as string, r.title as string]),
    );
    const prdProject = new Map<string, string | null>(
      (prds.data ?? []).map((r) => [r.id as string, (r.project_id as string | null) ?? null]),
    );
    const meetingMap = new Map<string, string>(
      (meetings.data ?? []).map((r) => [r.id as string, r.title as string]),
    );

    /**
     * WHERE `[auto]` STOPPED LEAKING, and why the fix belongs here.
     *
     * `source_label` is a mission/PRD/meeting TITLE, and a mission raised by the
     * sensing tick carries `AUTO_TITLE_PREFIX` in its stored title. So every
     * consumer that printed this field printed the marker: Today's evidence
     * bullet read `From [auto] Investigate the "Alert Fatigue..." cluster`. The
     * founder has reported this class of leak twice.
     *
     * `stripAutoPrefix`'s own contract is "call this on ANY title that may have
     * come from the trigger pipeline", and this is the single point where those
     * titles become a display string, so stripping here fixes every consumer at
     * once instead of leaving the next surface to rediscover the bug. The
     * provenance is not lost: the caller still has `source_kind`, and the auto
     * origin is drawn as its own chip where it is worth showing.
     */
    for (const d of decisions) {
      const label =
        (d.mission_id && missionMap.get(d.mission_id)) ||
        (d.prd_id && prdMap.get(d.prd_id)) ||
        (d.meeting_id && meetingMap.get(d.meeting_id)) ||
        null;
      d.source_label = label ? stripAutoPrefix(label) : null;
      d.mission_status = d.mission_id ? (missionStatus.get(d.mission_id) ?? null) : null;
      d.prd_project_id = d.prd_id ? (prdProject.get(d.prd_id) ?? null) : null;
    }
    return {
      decisions,
      hydrationError: missions.error ?? prds.error ?? meetings.error ?? null,
    };
  }
}

/**
 * WHAT ONE OUTCOME GRADED, AND WHAT IT REPLACED, in a single keyed read.
 *
 * `learnings.decision_id` is written by applyOutcome and was read by no
 * surface; `prds.outcome.overturns[]` rendered only transiently inside the
 * settle flow. Both facts live one drill away from LearningDetail and neither
 * rides listLearnings' select, so this is the one small door that carries them:
 * the decision's title (the learning row itself already has prd_id), and the
 * overturn pairs off the outcome jsonb.
 *
 * Deliberately NOT folded into listLearnings: every feed caller would pay for
 * two extra reads per page to render nothing, when only an opened detail can
 * use the answer. One fetch per opened outcome, keyed by its id.
 */
export const getLearningGradeContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        learningId: z.string().uuid(),
        prdId: z.string().uuid().nullish(),
      })
      .parse(input ?? {}),
  )
  .handler(
    async ({
      context,
      data,
    }): Promise<{
      /**
       * F-65. The bet this verdict settles — now including the FORECAST ITSELF.
       *
       * `title` alone answers "which decision", which is a pointer. The three
       * forecast fields answer "were we right", which is the only question the
       * brain exists for: the claim as it was written **before the outcome was
       * known**, the date it comes due, and how it settled.
       *
       * Added because `learnings.decision_id` only started being written today
       * (F-65) — 133 production learnings carry NULL — so until now there was
       * nothing on the far side of this join to render, and no reason to select
       * more than a title.
       */
      decision: {
        id: string;
        title: string;
        forecastClaim: string | null;
        forecastHorizonDate: string | null;
        forecastResolution: string | null;
      } | null;
      overturns: OutcomeOverturn[];
    }> => {
      const { supabase } = context;
      const { data: lr, error: lrError } = await supabase
        .from("learnings")
        .select("decision_id")
        .eq("id", data.learningId)
        .maybeSingle();
      if (lrError) throw new Error(lrError.message);
      const decisionId = (lr as { decision_id: string | null } | null)?.decision_id ?? null;

      // Absent pieces are ordinary here: most outcomes grade a spec, not a
      // decision, and most verdicts were never overturned. Null and [] are the
      // honest shapes for both, never placeholders.
      let decision: {
        id: string;
        title: string;
        forecastClaim: string | null;
        forecastHorizonDate: string | null;
        forecastResolution: string | null;
      } | null = null;
      if (decisionId) {
        const { data: d, error } = await supabase
          .from("decisions")
          .select("id,title,forecast_claim,forecast_horizon_date,forecast_resolution")
          .eq("id", decisionId)
          .maybeSingle();
        if (error) throw new Error(error.message);
        const row = d as {
          id: string;
          title: string;
          forecast_claim?: string | null;
          forecast_horizon_date?: string | null;
          forecast_resolution?: string | null;
        } | null;
        // Mapped rather than spread, so a surface reads camelCase like every other
        // server fn here, and an unresolved forecast stays NULL rather than
        // becoming an empty string that renders as a settled blank.
        decision = row
          ? {
              id: row.id,
              title: row.title,
              forecastClaim: row.forecast_claim ?? null,
              forecastHorizonDate: row.forecast_horizon_date ?? null,
              forecastResolution: row.forecast_resolution ?? null,
            }
          : null;
      }

      let overturns: OutcomeOverturn[] = [];
      if (data.prdId) {
        const { data: p, error } = await supabase
          .from("prds")
          .select("outcome")
          .eq("id", data.prdId)
          .maybeSingle();
        if (error) throw new Error(error.message);
        // priorSettlement is the one parser for prds.outcome; reusing it keeps
        // "what counts as an overturn" single-sourced with SettlePanel.
        overturns = priorSettlement((p as { outcome: unknown } | null)?.outcome)?.overturns ?? [];
      }

      return { decision, overturns };
    },
  );

export const createDecision = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        title: z.string().min(1).max(280),
        rationale: z.string().max(2000).optional(),
        status: z.enum(["pending", "approved", "rejected"]).default("pending"),
        mission_id: z.string().uuid().optional(),
        prd_id: z.string().uuid().optional(),
        meeting_id: z.string().uuid().optional(),
        source_kind: z.enum(["meeting", "mission", "prd", "manual"]).optional(),
        decided_by_agent_slug: z.string().max(80).optional(),
        // v12 ARD convention: the paths not taken, stored alongside the call.
        alternatives_considered: z
          .array(z.object({ title: z.string().max(280), reason_rejected: z.string().max(500) }))
          .max(8)
          .optional(),

        /**
         * FC-01: the forecast, captured at the moment the decision is committed.
         *
         * This is the door the whole moat argument depends on, and until now it
         * did not exist. Migration 20260810180000 shipped the columns, the
         * resolution constraint and the immutability trigger on 2026-08-10 under
         * a founder ruling that reads "Build now, P0", and no application code
         * ever referenced any of them. A schema with a guard and no writer
         * captures nothing.
         *
         * Why it belongs on the INSERT rather than on a later edit: a forecast
         * recorded after the fact is a retrospective. The trigger enforces that
         * from below by freezing these three once set, and the honest place to
         * write them is the one moment we know the outcome is not yet known.
         */
        forecast_claim: z.string().min(1).max(500).optional(),
        forecast_how_we_will_know: z.string().min(1).max(500).optional(),
        forecast_horizon_date: z.string().datetime({ offset: true }).optional(),
      })
      // All three or none, and a horizon that has not already passed. Both
      // rules and the reasoning behind them live in `forecastRefusal`.
      .superRefine((v, ctx) => {
        const bad = forecastRefusal(v);
        if (bad)
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: [bad.path], message: bad.message });
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const source_kind =
      data.source_kind ??
      (data.mission_id ? "mission" : data.prd_id ? "prd" : data.meeting_id ? "meeting" : "manual");
    // decisions.alternatives_considered (jsonb) is newer than the generated
    // types, so the payload is structurally cast (the house idiom).
    const insertPayload = {
      ...data,
      source_kind,
      user_id: context.userId,
    } as unknown as TablesInsert<"decisions">;
    // P-35: named columns, embedding excluded.
    const { data: row, error } = await context.supabase
      .from("decisions")
      .insert(insertPayload)
      .select(
        "alternatives_considered,auto_origin,cited_by_count,created_at,decided_by_agent_slug,embedding_model,forecast_band_drifting_at,forecast_band_missed_at,forecast_baseline,forecast_claim,forecast_deferred_at,forecast_deferred_count,forecast_direction,forecast_horizon_date,forecast_how_we_will_know,forecast_if_drifting,forecast_if_missed,forecast_metric,forecast_next_check_at,forecast_observations,forecast_predicted,forecast_resolution,forecast_resolution_rationale,forecast_resolution_suggestion,forecast_resolved_at,forecast_resolved_by_agent_slug,id,intent,is_public,is_sample,meeting_id,mission_id,prd_id,product_id,project_id,rationale,share_slug,snapshot_before,source_kind,status,title,user_id,workspace_id",
      )
      .single();
    if (error) throw new Error(error.message);
    void track("decision_made", context.userId, { prd_id: data.prd_id ?? undefined });

    // SEAM-1: stage history for the created decision.
    if (row) {
      await recordStageEvent(context.supabase, {
        entityType: "decision",
        entityId: row.id,
        from: null,
        to: row.status,
        actor: data.decided_by_agent_slug ?? "human",
        workspaceId: row.workspace_id,
        userId: context.userId,
      });
    }

    /**
     * THE ORIGIN EDGE, at the door every hand-made and captured decision walks
     * through.
     *
     * `mission_id` and `prd_id` are inputs to this handler and go straight into
     * the row, and until now that was the ONLY record of what the call was made
     * about: `listDecisions` resolves them into a `source_label`, and the graph
     * saw nothing. The Capture press on a mission, the capture on a spec page
     * and the ask-stream promote all arrive here, so one write covers all three.
     *
     * ORDER: `row` is what the insert returned, and the `error` above already
     * threw. supabase-js RESOLVES a refused write, so `row?.id` — not the
     * absence of a throw — is the thing that proves a decision exists to point
     * at.
     *
     * WORKSPACE: the PARENT'S, read from the mission or spec itself. It is not
     * taken from the decision row, because `createDecision` does not pass a
     * workspace on the insert either — `decisions.workspace_id` resolves the
     * same `current_user_default_workspace()` default the lineage column would,
     * so copying it forward would launder the caller's default into an
     * "explicit" value and assert a workspace nobody checked. The read is also
     * the only confirmation available that the parent is visible to this caller
     * at all. It falls back to the decision's own workspace only when the
     * parent read comes back empty, and that fallback is named as what it is.
     *
     * ONE READ, NOT TWO, AND SAY SO RATHER THAN IMPLY OTHERWISE. The schema
     * permits both ids on one decision; no caller of this handler sends both
     * today. If one ever does, the mission's workspace is what both edges
     * carry — an approximation, and a visible one, rather than a second round
     * trip on every capture in the product for a case that does not occur.
     */
    if (row?.id && (data.mission_id || data.prd_id)) {
      const { data: parent } = data.mission_id
        ? await context.supabase
            .from("missions")
            .select("workspace_id")
            .eq("id", data.mission_id)
            .maybeSingle()
        : await context.supabase
            .from("prds")
            .select("workspace_id")
            .eq("id", data.prd_id as string)
            .maybeSingle();
      const parentWorkspaceId = (parent?.workspace_id as string | null | undefined) ?? null;
      await recordDecisionOrigins(context.supabase, context.userId, {
        decisionId: row.id as string,
        missionId: data.mission_id ?? null,
        prdId: data.prd_id ?? null,
        workspaceId:
          parentWorkspaceId ?? (row as { workspace_id?: string | null }).workspace_id ?? null,
        createdByAgent: data.decided_by_agent_slug ?? null,
        rationale: "The artifact this call was recorded against",
      });
    }

    // FS-02: extract the assumptions this decision stands on. Fail-safe —
    // the decision is already recorded above, so an extraction error never
    // loses the write, matching the recordOutcome/inferDirectEdge convention.
    if (row?.id) {
      try {
        const { data: member } = await context.supabase
          .from("workspace_members")
          .select("workspace_id")
          .eq("user_id", context.userId)
          .limit(1)
          .maybeSingle();
        const workspaceId = (member?.workspace_id as string | undefined) ?? null;
        if (workspaceId) {
          await extractAssumptions(
            context.supabase,
            context.userId,
            workspaceId,
            row.id as string,
            data.title,
            data.rationale ?? null,
          );
        }
      } catch (e) {
        console.error("extractAssumptions failed (non-fatal):", e);
      }
    }

    return { decision: row };
  });

/**
 * FC-01: attach a forecast to a decision that does not have one yet.
 *
 * WHY THIS EXISTS ALONGSIDE THE INSERT PATH. `createDecision` is not the only
 * door: decisions are also written by the meeting extractor, the discovery
 * pipeline, the MCP surface, the tool registry and the trigger tick. A person
 * who wants to record what they expect from a call an agent captured for them
 * has no insert to attach it to, and telling them to delete and re-create the
 * decision would destroy its lineage to say one sentence about the future.
 *
 * SET-ONCE HERE, MIRRORING THE TRIGGER RATHER THAN TRUSTING IT. The database
 * already refuses to change a forecast that exists (`enforce_forecast_immutable`
 * raises `check_violation`), so this could be written as a bare update and let
 * the trigger fail it. Two reasons it is not. The trigger's message is written
 * for whoever reads the logs, not for the person at the keyboard, and a raised
 * `check_violation` surfaces as a generic write failure that reads like an
 * outage rather than a refusal. And a caller with `service_role` is exempt from
 * the trigger entirely, so any future server-side path would silently overwrite
 * a belief. The guard belongs in both places.
 *
 * The WHERE clauses repeat the read rather than trusting it, so a row that
 * gains a forecast between the check and the write is refused by the database
 * rather than by a check that raced, and `.select("id")` makes an empty result
 * an error instead of a silent success. Same shape as `extendApprovalTtl`.
 *
 * It deliberately does NOT touch `forecast_resolution` or `forecast_resolved_at`.
 * Those are written after the horizon passes, by the calibrator or a human, and
 * re-scoring on better evidence is legitimate. What must not move is what was
 * believed beforehand.
 */
export const setDecisionForecastSchema = z
  .object({
    decisionId: z.string().uuid(),
    forecast_claim: z.string().min(1).max(500),
    forecast_how_we_will_know: z.string().min(1).max(500),
    forecast_horizon_date: z.string().datetime({ offset: true }),
  })
  // All three are required by the object above, so only the horizon rule
  // can fire here. Shared with the insert path rather than restated.
  .superRefine((v, ctx) => {
    const bad = forecastRefusal(v);
    if (bad) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [bad.path], message: bad.message });
  });

/**
 * THE IMPLEMENTATION, SEPARATED FROM THE DOOR, because for its whole life this
 * function had no door at all.
 *
 * Written 2026-08-11 and shipped with ZERO CALLERS: a repo-wide grep found the
 * symbol in its own definition and in two documents claiming it was wired.
 * Meanwhile the documented reason for its existence stayed true and unaddressed
 * -- nine of the ten paths that write a decision cannot attach a forecast, so
 * every decision an agent captured was permanently forecast-less, which is
 * exactly the case the docblock above says this exists to solve.
 *
 * Taking the client and user id as parameters rather than reading them from a
 * request context is what lets the MCP tool reuse this instead of writing a
 * second copy against a token-scoped client. One implementation, two doors, the
 * same shape settleOutcome uses to reach applyOutcome.
 */
export async function setDecisionForecastImpl(
  db: SupabaseClient,
  userId: string,
  input: z.infer<typeof setDecisionForecastSchema>,
): Promise<{ ok: true; decisionId: string }> {
  const { data: row } = await db
    .from("decisions")
    .select("id,forecast_claim")
    .eq("id", input.decisionId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!row) throw new Error("We could not find that decision, so nothing changed.");
  if ((row as { forecast_claim: string | null }).forecast_claim != null) {
    throw new Error(
      "This decision already records what you expected to happen, and that cannot be rewritten. A forecast you can edit after the outcome is known is a retrospective.",
    );
  }

  const { data: written, error } = await db
    .from("decisions")
    .update({
      forecast_claim: input.forecast_claim,
      forecast_how_we_will_know: input.forecast_how_we_will_know,
      forecast_horizon_date: input.forecast_horizon_date,
    })
    .eq("id", input.decisionId)
    .eq("user_id", userId)
    .is("forecast_claim", null)
    .select("id");
  if (error) throw new Error(error.message);
  if (!written || written.length === 0) {
    throw new Error(
      "We could not confirm that the forecast was recorded, so treat it as not recorded.",
    );
  }
  return { ok: true as const, decisionId: input.decisionId };
}

export const setDecisionForecast = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => setDecisionForecastSchema.parse(input))
  .handler(async ({ context, data }) =>
    setDecisionForecastImpl(context.supabase as unknown as SupabaseClient, context.userId, data),
  );

export const updateDecision = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "approved", "rejected"]),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    // SEAM-1: capture the prior stage before the status update.
    const { data: prior } = await context.supabase
      .from("decisions")
      .select("status,workspace_id")
      .eq("id", data.id)
      .maybeSingle();
    const { error } = await context.supabase
      .from("decisions")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await recordStageEvent(context.supabase, {
      entityType: "decision",
      entityId: data.id,
      from: prior?.status ?? null,
      to: data.status,
      actor: "human",
      workspaceId: prior?.workspace_id ?? null,
      userId: context.userId,
    });
    return { ok: true };
  });

// FS-02: the human decision on a supersession-candidate Call. Confirming
// reopens the decision for review and writes a real artifact_lineage
// contradicts edge (the receipt the Decision Brain graph reasons over
// later); dismissing just closes the Call and the assumption stands.
// JNY-02: a brief_item-sourced assumption (no decision/prd exists yet) has
// no natural "reopen for review" state of its own — the item just stays
// standing, and Today's assumptionCalls surfacing already gives the operator
// visibility regardless of source — so it only gets the lineage receipt.
export const resolveAssumptionChallenge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), action: z.enum(["confirm", "dismiss"]) }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: challenge, error } = await supabase
      .from("assumption_challenges")
      .select("id,assumption_id,signal_id,learning_id,rationale,status")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    // P-54: gone or already decided is the SAME observable no-op PostgREST
    // gives a zero-row write, and it used to report `{ ok: true }` here same as
    // a real one. `changed` is what the approvals tray's settled list reads to
    // tell the two apart, so a challenge someone else just closed does not
    // print as this press's own verdict.
    if (!challenge || challenge.status !== "open") return { ok: true, changed: false };

    const nowIso = new Date().toISOString();
    await supabase
      .from("assumption_challenges")
      .update({
        status: data.action === "confirm" ? "confirmed" : "dismissed",
        decided_at: nowIso,
        decided_by: userId,
      })
      .eq("id", data.id);

    if (data.action === "dismiss") {
      await supabase
        .from("assumptions")
        .update({ status: "standing" })
        .eq("id", challenge.assumption_id);
      return { ok: true, changed: true };
    }

    const { data: assumption } = await supabase
      .from("assumptions")
      .select("decision_id,prd_id,brief_item_id")
      .eq("id", challenge.assumption_id)
      .maybeSingle();
    const decisionId = (assumption?.decision_id as string | undefined) ?? null;
    // CNV-02: an unverifiable spec clause files as an assumption with a
    // prd_id instead of a decision_id (no decision exists yet). A confirmed
    // challenge reopens whichever one it actually stands under, mirroring
    // the decision path so a spec's stale acceptance criterion gets the same
    // "reopened for review" treatment a stale decision already gets.
    const prdId = decisionId ? null : ((assumption?.prd_id as string | undefined) ?? null);
    // JNY-02: a brief_item source (see the comment above this handler).
    const briefItemId =
      decisionId || prdId ? null : ((assumption?.brief_item_id as string | undefined) ?? null);
    if (decisionId || prdId || briefItemId) {
      if (decisionId) {
        // SEAM-1: capture the prior stage before reopening the decision.
        const { data: priorDecision } = await supabase
          .from("decisions")
          .select("status,workspace_id")
          .eq("id", decisionId)
          .maybeSingle();
        await supabase.from("decisions").update({ status: "pending" }).eq("id", decisionId);
        await recordStageEvent(supabase, {
          entityType: "decision",
          entityId: decisionId,
          from: priorDecision?.status ?? null,
          to: "pending",
          actor: "human",
          workspaceId: priorDecision?.workspace_id ?? null,
          userId,
        });
      } else if (prdId) {
        // SEAM-1: capture the prior stage before reopening the spec.
        const { data: priorPrd } = await supabase
          .from("prds")
          .select("status,workspace_id")
          .eq("id", prdId)
          .maybeSingle();
        await supabase.from("prds").update({ status: "review" }).eq("id", prdId);
        await recordStageEvent(supabase, {
          entityType: "spec",
          entityId: prdId,
          from: priorPrd?.status ?? null,
          to: "review",
          actor: "human",
          workspaceId: priorPrd?.workspace_id ?? null,
          userId,
        });
      }
      const parent_kind = challenge.signal_id
        ? "signal"
        : challenge.learning_id
          ? "learning"
          : null;
      const parent_id = challenge.signal_id ?? challenge.learning_id ?? null;
      const child_kind = decisionId ? "decision" : prdId ? "prd" : "brief_item";
      const child_id = decisionId ?? prdId ?? briefItemId;
      if (parent_kind && parent_id && child_id) {
        try {
          await supabase.from("artifact_lineage").upsert(
            {
              user_id: userId,
              parent_kind,
              parent_id,
              child_kind,
              child_id,
              relation: "contradicts",
              rationale: challenge.rationale,
              created_by_agent: "assumption-watcher",
            },
            { onConflict: "user_id,parent_kind,parent_id,child_kind,child_id,relation" },
          );
        } catch (e) {
          console.error("artifact_lineage upsert failed (non-fatal):", e);
        }
      }
    }
    return { ok: true, changed: true };
  });

// ─────────────────────────────────────────────────────────────────────────────
// ASK INTEGRATION (Queue L0-4): Query decisions and learnings for Ask responses
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get decisions with learnings for a track, for rendering decision cards in Ask.
 *
 * Returns all decisions from a specific track, joined with their learning outcomes
 * if resolved. Used by Ask to show "here's what we forecast would happen and here's
 * what actually happened" side-by-side.
 */
export const getDecisionsForAsk = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        trackId: z.string().uuid(),
      })
      .parse(i ?? {}),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context;

    try {
      /*
       * -- `decisions` HAS NO `track_id`, AND NEVER HAS (found 2026-09-03) ----
       *
       * This read said `.eq("track_id", data.trackId)`. That column is not on
       * the table: a track's decisions are reached through its
       * `spine_track_members` rows of kind `decision`, the same join
       * `listRunsForStart` and the driver both use.
       *
       * PostgREST answers an unknown column with 42703, so `decisionsError` was
       * always set, the `throw` below always fired, and the `catch` at the end
       * of this handler swallowed it into `{ decisions: [] }`. The feature has
       * never returned a single row in its life and said nothing about it: it
       * looked exactly like a track with no decisions.
       *
       * Nothing calls it -- `grep -rn "getDecisionsForAsk" src/` finds only this
       * definition -- so it is a feature that was written, never wired, and
       * could not have worked if it had been.
       */
      const { data: memberRows, error: memberError } = await supabase
        .from("spine_track_members")
        .select("artifact_id")
        .eq("track_id", data.trackId)
        .eq("artifact_kind", "decision");
      if (memberError) throw memberError;
      const decisionIds = ((memberRows ?? []) as Array<{ artifact_id: string | null }>)
        .map((m) => m.artifact_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0);
      if (decisionIds.length === 0) return { decisions: [] };

      const { data: decisions, error: decisionsError } = await supabase
        .from("decisions")
        .select(
          "id,title,rationale,forecast_claim,forecast_how_we_will_know,forecast_horizon_date,forecast_resolution,forecast_resolved_at,created_at",
        )
        .in("id", decisionIds)
        .order("created_at", { ascending: false });

      if (decisionsError) throw decisionsError;
      if (!decisions || decisions.length === 0) {
        return { decisions: [] };
      }

      // Fetch learnings for each decision
      const decisionsWithLearnings = await Promise.all(
        decisions.map(async (decision) => {
          const { data: learning } = await supabase
            .from("learnings")
            /* `learnings` has no `metadata` column. The reading this was reaching for is
               `metric_label` / `metric_value`, which is what the grader writes and
               what the Learn tab renders. */
            .select("id,verdict,summary,metric_label,metric_value,created_at")
            .eq("decision_id", decision.id)
            .maybeSingle();

          return {
            decision,
            learning: learning || null,
          };
        }),
      );

      return { decisions: decisionsWithLearnings };
    } catch (error) {
      console.error("Failed to fetch decisions for Ask:", error);
      return { decisions: [] };
    }
  });

/**
 * Search decisions by intent/keywords for Ask autocomplete and discovery.
 *
 * When user asks "what did we decide about signup flow?", this searches all
 * decisions in the workspace for matches on forecast_claim and returns both
 * the forecast and the actual outcome (learning).
 */
export const searchDecisionsForAsk = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        query: z.string().max(200),
        limit: z.number().int().min(1).max(50).default(10),
      })
      .parse(i ?? {}),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context;

    try {
      if (!data.query || data.query.trim().length === 0) {
        return { decisions: [] };
      }

      // Text search on forecast_claim (future: semantic via embeddings)
      const { data: decisions, error: decisionsError } = await supabase
        .from("decisions")
        .select(
          "id,title,rationale,forecast_claim,forecast_how_we_will_know,forecast_horizon_date,forecast_resolution,forecast_resolved_at,created_at",
        )
        .or(`forecast_claim.ilike.%${data.query.trim()}%,title.ilike.%${data.query.trim()}%`)
        .order("created_at", { ascending: false })
        .limit(data.limit);

      if (decisionsError) throw decisionsError;
      if (!decisions || decisions.length === 0) {
        return { decisions: [] };
      }

      // Fetch learnings for each decision
      const decisionsWithLearnings = await Promise.all(
        decisions.map(async (decision) => {
          const { data: learning } = await supabase
            .from("learnings")
            /* `learnings` has no `metadata` column. The reading this was reaching for is
               `metric_label` / `metric_value`, which is what the grader writes and
               what the Learn tab renders. */
            .select("id,verdict,summary,metric_label,metric_value,created_at")
            .eq("decision_id", decision.id)
            .maybeSingle();

          return {
            decision,
            learning: learning || null,
          };
        }),
      );

      return { decisions: decisionsWithLearnings };
    } catch (error) {
      console.error("Failed to search decisions for Ask:", error);
      return { decisions: [] };
    }
  });

/**
 * A decision's own total spend, in credits, summed across every run any of
 * its own tracks ever ran (P-141, A-QUEUE.md).
 *
 * A decision's work is not one run: it can span more than one track over its
 * lifetime, and a run-shaped figure ("credits on this run row") is not a
 * question Outcomes' own unit -- the decision -- can answer. Summing every
 * trace's own total, already computed per-trace by `creditsSpentByTrace`,
 * answers the question this page actually asks: what did this call cost,
 * altogether.
 */
export function decisionSpendCredits(creditsByTrace: Record<string, number>): number {
  return Object.values(creditsByTrace).reduce((sum, c) => sum + c, 0);
}

/**
 * The decision's own spend, read live.
 *
 * TWO HOPS, THE SAME ONES `getDecisionsForAsk` ABOVE DOCUMENTS IN REVERSE.
 * `decisions` has no `track_id` and never has; a decision's tracks are its
 * `spine_track_members` rows of kind "decision". From each of those tracks,
 * `agent_runs.trace_id` feeds `creditsSpentByTrace` -- the exact join P-136
 * verified on the run screen and P-140 reused for Start, never a third
 * reader that could disagree with the other two.
 *
 * `credits: null` for a decision with nothing debited yet is a real, common
 * answer (no track, no run, or a real run that spent nothing), never a
 * fabricated zero -- the same rule P-140's Start figure already keeps.
 */
export const getDecisionSpend = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ decisionId: z.string().uuid() }).parse(i ?? {}))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    try {
      const { data: memberRows, error: memberError } = await supabase
        .from("spine_track_members")
        .select("track_id")
        .eq("artifact_kind", "decision")
        .eq("artifact_id", data.decisionId);
      if (memberError) throw memberError;
      const trackIds = [
        ...new Set(
          ((memberRows ?? []) as Array<{ track_id: string | null }>)
            .map((m) => m.track_id)
            .filter((t): t is string => typeof t === "string" && t.length > 0),
        ),
      ];
      if (trackIds.length === 0) return { credits: null, trackCount: 0, runCount: 0 };

      const { data: runRows, error: runRowsErr } = await supabase
        .from("agent_runs")
        .select("trace_id")
        .in("track_id", trackIds)
        .not("trace_id", "is", null);
      if (runRowsErr) throw runRowsErr;
      const traceIds = [
        ...new Set(
          ((runRows ?? []) as Array<{ trace_id: string | null }>)
            .map((r) => r.trace_id)
            .filter((t): t is string => typeof t === "string" && t.length > 0),
        ),
      ];
      if (traceIds.length === 0) return { credits: null, trackCount: trackIds.length, runCount: 0 };

      const creditsByTrace = await creditsSpentByTrace(traceIds);
      const total = decisionSpendCredits(creditsByTrace);
      return {
        credits: total > 0 ? total : null,
        trackCount: trackIds.length,
        runCount: traceIds.length,
      };
    } catch (error) {
      console.error("getDecisionSpend failed:", error);
      return { credits: null, trackCount: 0, runCount: 0 };
    }
  });

/** One decision an agent made on a run, with its reasons, in the order made. */
export type TrackDecision = {
  id: string;
  title: string;
  rationale: string | null;
  /** The options the agent weighed, as it recorded them (jsonb). */
  alternatives_considered: Json;
  decided_by_agent_slug: string | null;
  status: string;
  source_kind: string | null;
  created_at: string;
  /** How this decision reached the run: written on it, or made on one of its missions. */
  via: "track" | "mission";
  forecast: {
    claim: string | null;
    how_we_will_know: string | null;
    horizon_date: string | null;
    resolution: string | null;
    resolution_rationale: string | null;
    resolved_at: string | null;
  };
};

/**
 * THE DECISIONS A RUN'S AGENTS MADE, IN ORDER, WITH THEIR REASONS (Lane 2's
 * ask, 2026-09-09: "the decisions, not the tool calls"). Two hops on the wire:
 * the track's members (its decisions, and its missions), then the decisions
 * themselves: the ones written on the track and the ones made on its
 * missions, oldest first, each with its rationale, the alternatives it
 * weighed and the bet it was taken under. The driver's own holds and their
 * why are on getTrackActivity as selfChecks; the two together are what the
 * agent decided and why.
 */
export async function readTrackDecisions(
  supabase: SupabaseClient<Database>,
  trackId: string,
): Promise<{ decisions: TrackDecision[] }> {
  const { data: members, error: membersErr } = await supabase
    .from("spine_track_members" as never)
    .select("artifact_kind,artifact_id")
    .eq("track_id", trackId)
    .in("artifact_kind", ["decision", "mission"]);
  if (membersErr) throw new Error(`The run's record could not be read: ${membersErr.message}`);
  const rows = (members ?? []) as unknown as Array<{
    artifact_kind: string;
    artifact_id: string | null;
  }>;
  const decisionIds = rows
    .filter((m) => m.artifact_kind === "decision" && m.artifact_id)
    .map((m) => m.artifact_id as string);
  const missionIds = rows
    .filter((m) => m.artifact_kind === "mission" && m.artifact_id)
    .map((m) => m.artifact_id as string);
  if (decisionIds.length === 0 && missionIds.length === 0) return { decisions: [] };

  const COLUMNS =
    "id,title,rationale,alternatives_considered,decided_by_agent_slug,status,source_kind,mission_id,created_at,forecast_claim,forecast_how_we_will_know,forecast_horizon_date,forecast_resolution,forecast_resolution_rationale,forecast_resolved_at";
  type Row = {
    id: string;
    title: string;
    rationale: string | null;
    alternatives_considered: Json;
    decided_by_agent_slug: string | null;
    status: string;
    source_kind: string | null;
    mission_id: string | null;
    created_at: string;
    forecast_claim: string | null;
    forecast_how_we_will_know: string | null;
    forecast_horizon_date: string | null;
    forecast_resolution: string | null;
    forecast_resolution_rationale: string | null;
    forecast_resolved_at: string | null;
  };
  const [onTrack, onMissions] = await Promise.all([
    decisionIds.length
      ? supabase.from("decisions").select(COLUMNS).in("id", decisionIds)
      : Promise.resolve({ data: [] as Row[], error: null }),
    missionIds.length
      ? supabase.from("decisions").select(COLUMNS).in("mission_id", missionIds)
      : Promise.resolve({ data: [] as Row[], error: null }),
  ]);
  if (onTrack.error)
    throw new Error(`The run's decisions could not be read: ${onTrack.error.message}`);
  if (onMissions.error)
    throw new Error(`The run's decisions could not be read: ${onMissions.error.message}`);

  const seen = new Set<string>();
  const out: TrackDecision[] = [];
  const take = (r: Row, via: TrackDecision["via"]) => {
    if (seen.has(r.id)) return;
    seen.add(r.id);
    out.push({
      id: r.id,
      title: stripAutoPrefix(r.title),
      rationale: r.rationale,
      alternatives_considered: r.alternatives_considered ?? null,
      decided_by_agent_slug: r.decided_by_agent_slug,
      status: r.status,
      source_kind: r.source_kind,
      created_at: r.created_at,
      via,
      forecast: {
        claim: r.forecast_claim,
        how_we_will_know: r.forecast_how_we_will_know,
        horizon_date: r.forecast_horizon_date,
        resolution: r.forecast_resolution,
        resolution_rationale: r.forecast_resolution_rationale,
        resolved_at: r.forecast_resolved_at,
      },
    });
  };
  for (const r of (onTrack.data ?? []) as Row[]) take(r, "track");
  for (const r of (onMissions.data ?? []) as Row[]) take(r, "mission");
  out.sort((a, b) => a.created_at.localeCompare(b.created_at));
  return { decisions: out };
}

export const listTrackDecisions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ trackId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }): Promise<{ decisions: TrackDecision[] }> =>
    readTrackDecisions(context.supabase, data.trackId),
  );
