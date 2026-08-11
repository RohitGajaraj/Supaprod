import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { TablesInsert } from "@/integrations/supabase/types";
import { track } from "@/lib/observability";
import { recordDecisionOrigins } from "@/lib/lineage.functions";
import { extractAssumptions } from "@/lib/ai/assumptions.server";
import { recordStageEvent } from "@/lib/stage-events.server";
// Pure string helpers, zero imports of their own, so they are safe on the server.
import { stripAutoPrefix } from "@/components/plan/format";

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
};

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
    let q = supabase
      .from("decisions")
      .select(
        "id,title,rationale,status,source_kind,meeting_id,mission_id,prd_id,decided_by_agent_slug,snapshot_before,created_at,auto_origin",
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
        ? supabase.from("missions").select("id,title").in("id", missionIds)
        : Promise.resolve({ data: [] as { id: string; title: string }[] }),
      prdIds.length
        ? supabase.from("prds").select("id,title").in("id", prdIds)
        : Promise.resolve({ data: [] as { id: string; title: string }[] }),
      meetingIds.length
        ? supabase.from("meetings").select("id,title").in("id", meetingIds)
        : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    ]);
    const missionMap = new Map<string, string>(
      (missions.data ?? []).map((r) => [r.id as string, r.title as string]),
    );
    const prdMap = new Map<string, string>(
      (prds.data ?? []).map((r) => [r.id as string, r.title as string]),
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
    }
    return { decisions };
  });

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
    const { data: row, error } = await context.supabase
      .from("decisions")
      .insert(insertPayload)
      .select()
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
    if (!challenge || challenge.status !== "open") return { ok: true };

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
      return { ok: true };
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
    return { ok: true };
  });
