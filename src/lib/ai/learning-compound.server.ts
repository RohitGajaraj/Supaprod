/**
 * Mission 3.8b (SW-3 remainder): the compounding pass, sweep half.
 *
 * Runs as outcome-tick's fourth step, same hourly cadence, fail-soft. Scans
 * recent learnings, joins the cheap signal keys (opportunity theme link,
 * else opportunity/spec title stem), groups them deterministically
 * (learning-compound.ts), and writes ONE playbook_proposals row per group of
 * MIN_GROUP_SIZE or more that has no proposal yet. Always status 'proposed';
 * a human confirms or dismisses in playbooks.functions.ts, never this pass.
 *
 * Idempotency is double-locked: an existence check per (workspace, group_key)
 * up front, and the unique index playbook_proposals_ws_group_key underneath,
 * so a concurrent tick degrades to a benign duplicate-key skip. `db` is
 * expected to be supabaseAdmin (cron path, no session); user_id on the
 * proposal is the workspace owner, same convention as the other outcome-tick
 * passes. playbook_proposals postdates the generated Database types, hence
 * the plain SupabaseClient (structural) usage throughout.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  groupSameShapedLearnings,
  shapeProposal,
  MIN_GROUP_SIZE,
  type CompoundLearning,
} from "./learning-compound";
import { tierFromSampleSize } from "@/lib/confidence";

const LOOKBACK_DAYS = 90;
const LEARNINGS_SCAN_LIMIT = 400;
const PROPOSALS_PER_TICK = 5;

type LearningRow = {
  id: string;
  workspace_id: string | null;
  verdict: string;
  summary: string;
  opportunity_id: string | null;
  prd_id: string | null;
};

export type LearningCompoundResult = { scanned: number; groups: number; proposed: number };

export async function runLearningCompoundPass(
  db: SupabaseClient,
  now: Date = new Date(),
): Promise<LearningCompoundResult> {
  const result: LearningCompoundResult = { scanned: 0, groups: 0, proposed: 0 };

  const since = new Date(now.getTime() - LOOKBACK_DAYS * 86_400_000).toISOString();
  const { data: learningRows } = await db
    .from("learnings")
    .select("id,workspace_id,verdict,summary,opportunity_id,prd_id")
    .gte("created_at", since)
    .order("created_at", { ascending: true })
    .limit(LEARNINGS_SCAN_LIMIT);
  const learnings = ((learningRows ?? []) as LearningRow[]).filter((l) => !!l.workspace_id);
  result.scanned = learnings.length;
  if (!learnings.length) return result;

  // Join the cheap signal keys. Three bounded lookups, no AI.
  const oppIds = [
    ...new Set(learnings.map((l) => l.opportunity_id).filter((v): v is string => !!v)),
  ];
  const oppById = new Map<string, { title: string | null; theme_id: string | null }>();
  if (oppIds.length) {
    const { data: opps } = await db
      .from("opportunities")
      .select("id,title,theme_id")
      .in("id", oppIds);
    for (const o of (opps ?? []) as Array<{
      id: string;
      title: string | null;
      theme_id: string | null;
    }>) {
      oppById.set(o.id, { title: o.title, theme_id: o.theme_id });
    }
  }

  const themeIds = [
    ...new Set([...oppById.values()].map((o) => o.theme_id).filter((v): v is string => !!v)),
  ];
  const themeTitleById = new Map<string, string | null>();
  if (themeIds.length) {
    const { data: themes } = await db.from("themes").select("id,title").in("id", themeIds);
    for (const t of (themes ?? []) as Array<{ id: string; title: string | null }>) {
      themeTitleById.set(t.id, t.title);
    }
  }

  const prdIds = [
    ...new Set(
      learnings
        .filter((l) => !l.opportunity_id)
        .map((l) => l.prd_id)
        .filter((v): v is string => !!v),
    ),
  ];
  const prdTitleById = new Map<string, string | null>();
  if (prdIds.length) {
    const { data: prds } = await db.from("prds").select("id,title").in("id", prdIds);
    for (const p of (prds ?? []) as Array<{ id: string; title: string | null }>) {
      prdTitleById.set(p.id, p.title);
    }
  }

  const inputs: CompoundLearning[] = learnings.map((l) => {
    const opp = l.opportunity_id ? (oppById.get(l.opportunity_id) ?? null) : null;
    return {
      id: l.id,
      workspace_id: l.workspace_id as string,
      verdict: l.verdict,
      summary: l.summary,
      theme_id: opp?.theme_id ?? null,
      theme_title: opp?.theme_id ? (themeTitleById.get(opp.theme_id) ?? null) : null,
      opportunity_title: opp?.title ?? null,
      prd_title: l.prd_id ? (prdTitleById.get(l.prd_id) ?? null) : null,
    };
  });

  const groups = groupSameShapedLearnings(inputs);
  result.groups = groups.length;
  if (!groups.length) return result;

  // One proposal per group key, ever: any existing row (whatever its status,
  // so a dismissed proposal is never re-proposed) claims the key.
  const { data: existingRows } = await db
    .from("playbook_proposals")
    .select("workspace_id,group_key")
    .in("group_key", [...new Set(groups.map((g) => g.groupKey))]);
  const existing = new Set(
    ((existingRows ?? []) as Array<{ workspace_id: string; group_key: string }>).map(
      (r) => `${r.workspace_id}|${r.group_key}`,
    ),
  );

  const wsIds = [...new Set(groups.map((g) => g.workspaceId))];
  const { data: workspaces } = await db.from("workspaces").select("id,owner_id").in("id", wsIds);
  const ownerByWorkspace = new Map(
    ((workspaces ?? []) as Array<{ id: string; owner_id: string }>).map((w) => [w.id, w.owner_id]),
  );

  for (const group of groups) {
    if (result.proposed >= PROPOSALS_PER_TICK) break;
    if (existing.has(`${group.workspaceId}|${group.groupKey}`)) continue;
    const ownerId = ownerByWorkspace.get(group.workspaceId);
    if (!ownerId) continue;
    const draft = shapeProposal(group);
    // PC-11: confidence-gated execution. The cheap self-assessment signal
    // here is sample size -- a proposal compounded from more similar
    // learnings is more trustworthy. `low` sits at exactly the group's own
    // minimum-to-propose threshold; playbook_proposals already lands behind
    // a human accept/dismiss review, so the tier's job is honesty (the chip
    // on a thin group), not a new gate.
    const confidence = tierFromSampleSize(group.learnings.length, MIN_GROUP_SIZE);
    const { error } = await db.from("playbook_proposals").insert({
      user_id: ownerId,
      workspace_id: group.workspaceId,
      group_key: draft.groupKey,
      title: draft.title,
      body: draft.body,
      status: "proposed",
      source_learning_ids: draft.sourceLearningIds,
      confidence,
    });
    if (error) {
      // 23505 = the unique index caught a concurrent tick; benign.
      if (error.code !== "23505") {
        console.error(
          `learning-compound: proposal insert failed for ${group.groupKey}:`,
          error.message,
        );
      }
      continue;
    }
    result.proposed++;
  }
  return result;
}
