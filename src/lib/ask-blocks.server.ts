/**
 * PC-36 workstream C: the server half of the typed answer-block vocabulary.
 * Resolves AnswerBlocks (entity cards, timeline, status digest) for an Ask
 * question deterministically: retrieval refs pick the cards, the intent
 * regexes in ask-blocks.ts pick the timeline/status extras. No model call
 * decides a block, so the vocabulary stays honest.
 *
 * The client passed in is the RLS-scoped per-user client from /api/chat, so
 * every query is already user/workspace scoped with no explicit filters
 * (same pattern as gatherInternal in ai/research.server.ts). Every failure
 * degrades to fewer blocks, never a throw: the chat stream must not break
 * because a card failed.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AnswerBlock, TimelineEvent } from "./ask-blocks";
import { capBlocks, isStatusQuestion, isTemporalQuestion, temporalWindowDays } from "./ask-blocks";
import { formatAuditId } from "./audit-id";

export type ChunkRef = { source_kind: string; source_id: string | null };

type EntityKind = "decision" | "opportunity" | "mission";
type EntityRef = { kind: EntityKind; id: string };

/** Cap matches capBlocks: the 420px panel renders at most 3 entity cards. */
const MAX_ENTITY_CARDS = 3;
/** Per-table fetch cap for the timeline; the merged list is capped at 10. */
const TIMELINE_PER_TABLE = 8;
const TIMELINE_MAX_EVENTS = 10;
const DAY_MS = 86_400_000;

type DecisionRow = {
  id: string;
  title: string;
  status: string;
  rationale: string | null;
  decided_by_agent_slug: string | null;
  source_kind: string | null;
  created_at: string;
};
type OpportunityRow = {
  id: string;
  title: string;
  status: string | null;
  ice_score: number | null;
};
type MissionRow = {
  id: string;
  title: string;
  status: string;
  goal: string | null;
  created_at: string;
};
type TimelineDecisionRow = { id: string; title: string; status: string; created_at: string };
type TimelineMissionRow = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  completed_at: string | null;
};
type ApprovalRow = { id: string; tool_name: string; status: string; decided_at: string };
type MissionStatusRow = { id: string; title: string; status: string };

function isEntityKind(k: string): k is EntityKind {
  return k === "decision" || k === "opportunity" || k === "mission";
}

/** First-seen order, deduped by kind:id, capped at MAX_ENTITY_CARDS total. */
function collectEntityRefs(chunkRefs: ChunkRef[]): EntityRef[] {
  const seen = new Set<string>();
  const out: EntityRef[] = [];
  for (const ref of chunkRefs) {
    if (!ref.source_id || !isEntityKind(ref.source_kind)) continue;
    const key = `${ref.source_kind}:${ref.source_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ kind: ref.source_kind, id: ref.source_id });
    if (out.length >= MAX_ENTITY_CARDS) break;
  }
  return out;
}

/** One `.in` query per kind; results reordered to the original ref order. */
async function resolveEntityCards(
  supabase: SupabaseClient,
  refs: EntityRef[],
): Promise<AnswerBlock[]> {
  if (refs.length === 0) return [];
  const idsByKind: Record<EntityKind, string[]> = { decision: [], opportunity: [], mission: [] };
  for (const r of refs) idsByKind[r.kind].push(r.id);

  const byKey = new Map<string, AnswerBlock>();
  const fetches: Promise<void>[] = [];

  if (idsByKind.decision.length) {
    fetches.push(
      (async () => {
        const { data, error } = await supabase
          .from("decisions")
          .select("id,title,status,rationale,decided_by_agent_slug,source_kind,created_at")
          .in("id", idsByKind.decision);
        if (error) {
          console.error("[ask-blocks] decision cards failed (skipping):", error);
          return;
        }
        for (const row of (data ?? []) as DecisionRow[]) {
          byKey.set(`decision:${row.id}`, {
            kind: "decision",
            id: row.id,
            title: row.title,
            status: row.status,
            rationale: row.rationale,
            decidedBy: row.decided_by_agent_slug,
            sourceKind: row.source_kind,
            createdAt: row.created_at,
          });
        }
      })(),
    );
  }
  if (idsByKind.opportunity.length) {
    fetches.push(
      (async () => {
        const { data, error } = await supabase
          .from("opportunities")
          .select("id,title,status,ice_score")
          .in("id", idsByKind.opportunity);
        if (error) {
          console.error("[ask-blocks] opportunity cards failed (skipping):", error);
          return;
        }
        for (const row of (data ?? []) as OpportunityRow[]) {
          byKey.set(`opportunity:${row.id}`, {
            kind: "opportunity",
            id: row.id,
            title: row.title,
            status: row.status,
            iceScore: row.ice_score,
          });
        }
      })(),
    );
  }
  if (idsByKind.mission.length) {
    fetches.push(
      (async () => {
        const { data, error } = await supabase
          .from("missions")
          .select("id,title,status,goal,created_at")
          .in("id", idsByKind.mission);
        if (error) {
          console.error("[ask-blocks] mission cards failed (skipping):", error);
          return;
        }
        for (const row of (data ?? []) as MissionRow[]) {
          byKey.set(`mission:${row.id}`, {
            kind: "mission",
            id: row.id,
            title: row.title,
            status: row.status,
            goal: row.goal,
            createdAt: row.created_at,
          });
        }
      })(),
    );
  }
  await Promise.all(fetches);

  // Fetch results come back unordered; the panel renders in retrieval order,
  // which is the relevance order the RAG layer already established.
  const out: AnswerBlock[] = [];
  for (const r of refs) {
    const block = byKey.get(`${r.kind}:${r.id}`);
    if (block) out.push(block);
  }
  return out;
}

/** Merged recent-activity feed: decisions + mission lifecycle + gate calls. */
async function resolveTimeline(
  supabase: SupabaseClient,
  question: string,
  productId: string | null = null,
): Promise<AnswerBlock | null> {
  const days = temporalWindowDays(question);
  const sinceMs = Date.now() - days * DAY_MS;
  const sinceIso = new Date(sinceMs).toISOString();

  // Product scope narrows decisions (they carry product_id); missions and
  // gates are workspace-level records with no product column, so they stay
  // in the timeline unfiltered rather than pretending to a scoping the data
  // model cannot express.
  let decisionsQuery = supabase
    .from("decisions")
    .select("id,title,status,created_at")
    .gte("created_at", sinceIso);
  if (productId) decisionsQuery = decisionsQuery.eq("product_id", productId);

  const [decisionsRes, missionsRes, approvalsRes] = await Promise.all([
    decisionsQuery.order("created_at", { ascending: false }).limit(TIMELINE_PER_TABLE),
    supabase
      .from("missions")
      .select("id,title,status,created_at,completed_at")
      // A mission belongs in the window if it STARTED or FINISHED inside it
      // (review fix 2026-07-16): filtering on created_at alone silently
      // dropped an older mission that completed yesterday, which is exactly
      // the outcome "what happened last week" is asking about.
      .or(`created_at.gte.${sinceIso},completed_at.gte.${sinceIso}`)
      .order("created_at", { ascending: false })
      .limit(TIMELINE_PER_TABLE),
    supabase
      .from("agent_approvals")
      .select("id,tool_name,status,decided_at")
      .not("decided_at", "is", null)
      .gte("decided_at", sinceIso)
      .order("decided_at", { ascending: false })
      .limit(TIMELINE_PER_TABLE),
  ]);

  const events: TimelineEvent[] = [];

  if (decisionsRes.error) {
    console.error("[ask-blocks] timeline decisions failed (skipping):", decisionsRes.error);
  } else {
    for (const row of (decisionsRes.data ?? []) as TimelineDecisionRow[]) {
      events.push({
        at: row.created_at,
        label: row.title,
        detail: "decision · " + row.status,
        ref: formatAuditId("decision", row.id),
      });
    }
  }

  if (missionsRes.error) {
    console.error("[ask-blocks] timeline missions failed (skipping):", missionsRes.error);
  } else {
    for (const row of (missionsRes.data ?? []) as TimelineMissionRow[]) {
      // The or-filter can return a mission whose kickoff predates the
      // window (it completed inside it); only in-window kickoffs are events.
      if (Date.parse(row.created_at) >= sinceMs) {
        events.push({
          at: row.created_at,
          label: row.title,
          detail: "mission · " + row.status,
          ref: formatAuditId("mission", row.id),
        });
      }
      // A completion inside the window is its own event: "what happened" is
      // about outcomes, not just kickoffs.
      if (row.completed_at && Date.parse(row.completed_at) >= sinceMs) {
        events.push({
          at: row.completed_at,
          label: row.title,
          detail: "mission completed",
          ref: formatAuditId("mission", row.id),
        });
      }
    }
  }

  if (approvalsRes.error) {
    console.error("[ask-blocks] timeline approvals failed (skipping):", approvalsRes.error);
  } else {
    for (const row of (approvalsRes.data ?? []) as ApprovalRow[]) {
      events.push({
        at: row.decided_at,
        label: row.tool_name,
        detail: "gate · " + row.status,
        ref: null,
      });
    }
  }

  events.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  const capped = events.slice(0, TIMELINE_MAX_EVENTS);
  if (capped.length === 0) return null;
  return { kind: "timeline", label: `Last ${days} days`, events: capped };
}

// Mission status buckets for the digest. "waiting_approval" counts as
// waiting but still shows in the running list: a gated mission is the one
// the user most needs to act on. "in_progress" and "proposed" are real
// statuses missions take in production (review fix 2026-07-16): in_progress
// is active work, proposed is pre-approval and therefore waiting.
const RUNNING_STATUSES = new Set(["running", "queued", "in_progress"]);
const WAITING_STATUSES = new Set(["waiting_approval", "blocked", "proposed"]);
const DONE_STATUSES = new Set(["completed", "done"]);
const FAILED_STATUSES = new Set(["failed", "halted", "cancelled", "completed_with_failures"]);
const LISTABLE_STATUSES = new Set(["running", "queued", "in_progress", "waiting_approval"]);

async function resolveStatusDigest(supabase: SupabaseClient): Promise<AnswerBlock | null> {
  const { data, error } = await supabase
    .from("missions")
    .select("id,title,status")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) {
    console.error("[ask-blocks] status digest failed (skipping):", error);
    return null;
  }
  const rows = (data ?? []) as MissionStatusRow[];
  // No missions at all means the digest would be an empty card; skip it.
  if (rows.length === 0) return null;

  const counts = { running: 0, waiting: 0, done: 0, failed: 0 };
  for (const r of rows) {
    if (RUNNING_STATUSES.has(r.status)) counts.running++;
    else if (WAITING_STATUSES.has(r.status)) counts.waiting++;
    else if (DONE_STATUSES.has(r.status)) counts.done++;
    else if (FAILED_STATUSES.has(r.status)) counts.failed++;
  }
  const running = rows
    .filter((r) => LISTABLE_STATUSES.has(r.status))
    .slice(0, 4)
    .map((r) => ({ id: r.id, title: r.title, status: r.status }));

  return { kind: "status", scopeLabel: "Missions", counts, running };
}

/**
 * Resolve the answer blocks for one Ask turn. Entity cards come from the
 * retrieval refs the RAG layer already fetched; timeline and status blocks
 * fire on question intent. Never throws: any failure returns fewer blocks.
 */
export async function resolveAnswerBlocks(
  supabase: SupabaseClient,
  opts: { question: string; chunkRefs: ChunkRef[]; productId?: string | null },
): Promise<AnswerBlock[]> {
  try {
    const [cards, timeline, status] = await Promise.all([
      resolveEntityCards(supabase, collectEntityRefs(opts.chunkRefs)).catch((e): AnswerBlock[] => {
        console.error("[ask-blocks] entity cards failed (skipping):", e);
        return [];
      }),
      isTemporalQuestion(opts.question)
        ? resolveTimeline(supabase, opts.question, opts.productId ?? null).catch((e): null => {
            console.error("[ask-blocks] timeline failed (skipping):", e);
            return null;
          })
        : Promise.resolve(null),
      isStatusQuestion(opts.question)
        ? resolveStatusDigest(supabase).catch((e): null => {
            console.error("[ask-blocks] status digest failed (skipping):", e);
            return null;
          })
        : Promise.resolve(null),
    ]);

    const blocks: AnswerBlock[] = [...cards];
    if (timeline) blocks.push(timeline);
    if (status) blocks.push(status);
    return capBlocks(blocks);
  } catch (e) {
    console.error("[ask-blocks] block resolution failed (returning none):", e);
    return [];
  }
}
