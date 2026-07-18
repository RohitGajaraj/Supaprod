import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { TablesInsert } from "@/integrations/supabase/types";
import { track } from "@/lib/observability";
import { extractAssumptions } from "@/lib/ai/assumptions.server";
import { recordStageEvent } from "@/lib/stage-events.server";

export type DecisionSource = "meeting" | "mission" | "prd" | "manual";

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
        "id,title,rationale,status,source_kind,meeting_id,mission_id,prd_id,decided_by_agent_slug,snapshot_before,created_at",
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

    for (const d of decisions) {
      d.source_label =
        (d.mission_id && missionMap.get(d.mission_id)) ||
        (d.prd_id && prdMap.get(d.prd_id)) ||
        (d.meeting_id && meetingMap.get(d.meeting_id)) ||
        null;
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
