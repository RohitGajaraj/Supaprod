// SW-3 mission 3.2: the decision card proves its judgment loop. One server fn
// returns, from REAL rows only: the alternatives the call recorded, the Critic
// verdict on the linked spec where one exists, the Ambient Precedent recall
// (outcome-weighted learnings via loadDecisionPrecedent), and the running
// cited_by_count. When the recall serves a learning into this decision context
// it also writes the citation receipts: a learning_citations row per newly
// served learning, and bump_decision_cited_by on past decisions the precedent
// resolves to. Receipts are best-effort and deduped per decision (trace_id
// "decision:<id>"), so re-opening the card never inflates counts.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { loadDecisionPrecedent } from "@/lib/ai/decision-precedent.server";
import {
  assemblePrecedentBlock,
  parseAlternativesConsidered,
  planPrecedentCitations,
  type DecisionAlternativeRow,
  type JudgmentPrecedent,
} from "@/lib/decision-judgment";

export type DecisionCriticSummary = {
  verdict: "ship" | "revise" | "kill";
  summary: string;
  confidence: number;
  reviewed_at: string | null;
};

export type DecisionJudgment = {
  alternatives: DecisionAlternativeRow[];
  citedByCount: number;
  critic: DecisionCriticSummary | null;
  precedents: JudgmentPrecedent[];
};

const EMPTY: DecisionJudgment = { alternatives: [], citedByCount: 0, critic: null, precedents: [] };

export const getDecisionJudgment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }): Promise<DecisionJudgment> => {
    const { userId } = context;
    const db = context.supabase as unknown as SupabaseClient;

    const { data: row } = await db.from("decisions").select("*").eq("id", data.id).maybeSingle();
    if (!row) return EMPTY;
    // The seam-1 columns (alternatives_considered, cited_by_count) are newer
    // than the generated types; read structurally (the house idiom).
    const d = row as Record<string, unknown>;
    const alternatives = parseAlternativesConsidered(d.alternatives_considered);
    const citedByCount = typeof d.cited_by_count === "number" ? d.cited_by_count : 0;
    const prdId = (d.prd_id as string | null) ?? null;
    const workspaceId = (d.workspace_id as string | null) ?? null;

    // Critic verdict: the Critic persists to the reviewed row's OWN
    // critic_review column (prds/opportunities), so a decision reads it off
    // its linked spec.
    let critic: DecisionCriticSummary | null = null;
    if (prdId) {
      const { data: prd } = await db
        .from("prds")
        .select("critic_review")
        .eq("id", prdId)
        .maybeSingle();
      const cr = (prd?.critic_review ?? null) as Record<string, unknown> | null;
      if (cr && (cr.verdict === "ship" || cr.verdict === "revise" || cr.verdict === "kill")) {
        critic = {
          verdict: cr.verdict,
          summary: typeof cr.summary === "string" ? cr.summary : "",
          confidence: typeof cr.confidence === "number" ? cr.confidence : 0,
          reviewed_at: typeof cr.reviewed_at === "string" ? cr.reviewed_at : null,
        };
      }
    }

    // Ambient Precedent recall: semantic match over the workspace's recorded
    // outcomes ("last time we reasoned this way, here is what happened").
    const text = [d.title, d.rationale]
      .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
      .join(". ");
    const matches = text ? await loadDecisionPrecedent(db, { userId, workspaceId, text }) : [];
    const precedents = assemblePrecedentBlock(matches, { ownPrdId: prdId });

    // Citation receipts: never block the read.
    if (precedents.length) {
      try {
        await recordPrecedentCitations(db, {
          userId,
          workspaceId,
          decisionId: data.id,
          precedents,
        });
      } catch (e) {
        console.error("precedent citation receipts failed (non-fatal):", e);
      }
    }

    return { alternatives, citedByCount, critic, precedents };
  });

/** SW-7 step-3 oracle: the best bet on /decide must show its judgment, not
 * just the Critic - the precedent recall ("last time we reasoned this way,
 * here is what happened") and what the ranking weighed it against. Same
 * substrate as the decision card, anchored on the OPPORTUNITY text; READ-ONLY
 * (citation receipts stay decision-scoped, an opportunity view never bumps a
 * past decision). Same structural-read posture as getDecisionJudgment. */
export type OpportunityJudgment = {
  precedents: JudgmentPrecedent[];
  /** The nearest live peers in the same workspace queue - the real
   * alternative set this bet was ranked against. */
  consideredAgainst: { id: string; title: string; ice: number | null }[];
};

const EMPTY_OPP: OpportunityJudgment = { precedents: [], consideredAgainst: [] };

export const getOpportunityJudgment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }): Promise<OpportunityJudgment> => {
    const { userId } = context;
    const db = context.supabase as unknown as SupabaseClient;

    const { data: row } = await db
      .from("opportunities")
      .select("id,title,problem,hypothesis,workspace_id")
      .eq("id", data.id)
      .maybeSingle();
    if (!row) return EMPTY_OPP;
    const o = row as {
      id: string;
      title: string | null;
      problem: string | null;
      hypothesis: string | null;
      workspace_id: string | null;
    };

    // Precedent recall anchored on the bet's own words; a bet never cites
    // its own outcome as "last time".
    const text = [o.title, o.problem, o.hypothesis]
      .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
      .join(". ");
    let precedents: JudgmentPrecedent[] = [];
    if (text) {
      const matches = await loadDecisionPrecedent(db, {
        userId,
        workspaceId: o.workspace_id,
        text,
      });
      precedents = assemblePrecedentBlock(matches).filter((p) => p.opportunityId !== o.id);
    }

    // The live queue peers this bet was ranked against (real rows, strongest
    // first) - the honest "alternatives considered" of a ranked bet.
    let consideredAgainst: OpportunityJudgment["consideredAgainst"] = [];
    if (o.workspace_id) {
      const { data: peers } = await db
        .from("opportunities")
        .select("id,title,ice_score")
        .eq("workspace_id", o.workspace_id)
        .in("status", ["backlog", "now", "next"])
        .neq("id", o.id)
        .order("ice_score", { ascending: false })
        .limit(3);
      consideredAgainst = (
        (peers ?? []) as Array<{
          id: string;
          title: string | null;
          ice_score: number | string | null;
        }>
      ).map((p) => ({
        id: p.id,
        title: p.title ?? "Untitled bet",
        ice: p.ice_score == null ? null : Number(p.ice_score),
      }));
    }

    return { precedents, consideredAgainst };
  });

/** Resolve served precedents to learnings + past decisions, then write the
 * receipts the pure planner approves: learning_citations inserts and
 * bump_decision_cited_by RPCs. Deduped via trace_id "decision:<id>". */
async function recordPrecedentCitations(
  db: SupabaseClient,
  args: {
    userId: string;
    workspaceId: string | null;
    decisionId: string;
    precedents: JudgmentPrecedent[];
  },
): Promise<void> {
  const prdIds = [...new Set(args.precedents.map((p) => p.prdId).filter((x): x is string => !!x))];
  const oppIds = [
    ...new Set(args.precedents.map((p) => p.opportunityId).filter((x): x is string => !!x)),
  ];
  if (!prdIds.length && !oppIds.length) return;

  type LearningRow = { id: string; prd_id: string | null; opportunity_id: string | null };
  const [byPrd, byOpp] = await Promise.all([
    prdIds.length
      ? db
          .from("learnings")
          .select("id,prd_id,opportunity_id,created_at")
          .in("prd_id", prdIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as LearningRow[] }),
    oppIds.length
      ? db
          .from("learnings")
          .select("id,prd_id,opportunity_id,created_at")
          .in("opportunity_id", oppIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as LearningRow[] }),
  ]);
  const learnings: LearningRow[] = [];
  const seenIds = new Set<string>();
  for (const l of [
    ...((byPrd.data ?? []) as LearningRow[]),
    ...((byOpp.data ?? []) as LearningRow[]),
  ]) {
    if (seenIds.has(l.id)) continue;
    seenIds.add(l.id);
    learnings.push(l);
  }
  if (!learnings.length) return;

  const trace = `decision:${args.decisionId}`;
  const { data: prior } = await db
    .from("learning_citations")
    .select("learning_id")
    .eq("trace_id", trace);
  const alreadyCited = new Set(
    ((prior ?? []) as Array<{ learning_id: string }>).map((r) => r.learning_id),
  );

  const { data: decRows } = prdIds.length
    ? await db.from("decisions").select("id,prd_id").in("prd_id", prdIds)
    : { data: [] as Array<{ id: string; prd_id: string | null }> };

  const plan = planPrecedentCitations({
    precedents: args.precedents,
    learnings,
    alreadyCitedLearningIds: alreadyCited,
    decisions: (decRows ?? []) as Array<{ id: string; prd_id: string | null }>,
    viewingDecisionId: args.decisionId,
  });

  if (plan.citeLearningIds.length) {
    await db.from("learning_citations").insert(
      plan.citeLearningIds.map((learning_id) => ({
        user_id: args.userId,
        workspace_id: args.workspaceId,
        learning_id,
        cited_by: "decision-precedent",
        trace_id: trace,
      })),
    );
  }
  for (const id of plan.bumpDecisionIds) {
    await db.rpc("bump_decision_cited_by", { _decision_id: id });
  }
}
