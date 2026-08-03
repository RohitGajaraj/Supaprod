/**
 * Semantic search over the WORKSPACE's judgment record — the decisions it made, the
 * bets it considered, the specs it wrote, and the outcomes those reached.
 *
 * WHY THIS EXISTS SEPARATELY FROM `decision-precedent.server.ts`. That module recalls
 * outcomes from `agent_memory`, which is scoped to the user who wrote the row. It is
 * the layer CLAUDE.md names as the known limit on the core claim: "the successor
 * inherits the record today, and not yet the compounded recall." This module reads the
 * source tables instead — `decisions` and `learnings` — whose RLS SELECT policy is
 * `is_workspace_member(workspace_id)`. So what it returns is the whole team's judgment,
 * not the caller's own copy of it, and a person who joined last week can recall what
 * the person who left last month decided and how it turned out.
 *
 * It does not replace precedent recall; it runs alongside it. Vector similarity over
 * outcome memories and vector similarity over the decision record answer different
 * questions and disagree usefully.
 *
 * Fail-safe by contract: every entry point returns an empty result on any failure, so
 * an embeddings outage degrades the Critic's context and never breaks a review. That
 * is the same posture as `loadDecisionPrecedent` and it is deliberate — but note the
 * cost of it, learned the hard way on 2026-08-03: a recall path that silently returns
 * nothing is indistinguishable from a workspace with nothing to recall. Failures here
 * are counted, and the caller can surface the count.
 *
 * .server.ts — Worker-only; never bundled to the client.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { embedThroughChokepointWithModel } from "@/lib/rag/embed.server";

export type JudgmentKind = "decision" | "opportunity" | "prd" | "learning";

/** One row of the workspace's judgment record, normalised across the four tables. */
export type JudgmentHit = {
  kind: JudgmentKind;
  id: string;
  /** Human-facing name. `learnings` has none, so it stays null and the body carries it. */
  title: string | null;
  /** The substance: a decision's rationale, an opportunity's problem, a spec's body, an outcome's summary. */
  body: string | null;
  /** Outcomes only: validated / missed / mixed. */
  verdict: string | null;
  /** Decisions only. */
  status: string | null;
  /** Which agent decided it, when one did. */
  agentSlug: string | null;
  createdAt: string | null;
  similarity: number;
};

export type JudgmentSearchResult = {
  hits: JudgmentHit[];
  /** Kinds whose RPC errored. Non-empty means the record was searched INCOMPLETELY. */
  failedKinds: JudgmentKind[];
  /** The embedding model the query vector was produced with, or null if embedding failed. */
  model: string | null;
};

/**
 * Similarity floor, 1 - cosine distance. Deliberately equal to
 * `PRECEDENT_THRESHOLD` so the two recall paths admit evidence on the same terms and a
 * difference in what they surface is a difference in the DATA, not in two arbitrary
 * constants.
 *
 * This is the one number here worth tuning on live data. Too low and the Critic cites
 * a decision that merely shares vocabulary, which is worse than citing nothing because
 * it looks like rigour. Too high and a genuine precedent phrased differently is missed.
 * 0.3 is the conservative end: it errs toward admitting weak matches, which is
 * tolerable ONLY because every consumer shows the score and the model is asked to weigh
 * relevance rather than to trust the list.
 */
export const JUDGMENT_THRESHOLD = 0.3;

/** Candidates pulled per kind before thresholding. */
const POOL_PER_KIND = 8;

/** Rows admitted into a prompt block, across all kinds. */
export const JUDGMENT_MAX = 6;

/** Per-row body cap, so one verbose spec cannot dominate a block. */
const MAX_BODY = 220;

/** PURE: threshold, sort by similarity, cap. Kind order never overrides relevance. */
export function rankJudgment(
  hits: JudgmentHit[],
  threshold = JUDGMENT_THRESHOLD,
  max = JUDGMENT_MAX,
): JudgmentHit[] {
  return hits
    .filter((h) => h.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, max);
}

function clip(s: string | null | undefined, n = MAX_BODY): string {
  const t = (s ?? "").replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n)}...` : t;
}

const KIND_LABEL: Record<JudgmentKind, string> = {
  decision: "DECISION",
  opportunity: "BET",
  prd: "SPEC",
  learning: "OUTCOME",
};

/**
 * PURE: format ranked hits into a prompt block. Empty input returns "" so the caller
 * omits the block entirely rather than injecting an empty heading.
 *
 * Each line carries its kind, its own status/verdict, and the age of the row, because
 * a decision from last week and one from last year deserve different weight and the
 * model cannot infer that from similarity alone.
 */
export function formatWorkspaceRecord(hits: JudgmentHit[], now = new Date()): string {
  if (!hits.length) return "";
  const lines = hits.map((h) => {
    const label = KIND_LABEL[h.kind];
    const state = h.verdict?.trim() || h.status?.trim() || "";
    const name = h.title?.trim() || "(untitled)";
    const age = ageLabel(h.createdAt, now);
    const by = h.agentSlug ? `, decided by ${h.agentSlug}` : "";
    const head = `- [${label}${state ? ` ${state.toUpperCase()}` : ""}] "${name}"${age ? ` (${age}${by})` : by ? ` (${by.slice(2)})` : ""}`;
    const body = clip(h.body);
    return body ? `${head}: ${body}` : head;
  });
  return [
    "Workspace record (this workspace's own past judgment, semantically matched, whoever wrote it):",
    ...lines,
  ].join("\n");
}

/** Coarse age, because "18 months ago" changes how a precedent should be weighed. */
function ageLabel(createdAt: string | null, now: Date): string {
  if (!createdAt) return "";
  const t = Date.parse(createdAt);
  if (!Number.isFinite(t)) return "";
  const days = Math.floor((now.getTime() - t) / 86_400_000);
  if (days < 0) return "";
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

type RpcRow = Record<string, unknown>;

const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);

/** PURE: normalise one RPC payload into the common shape. Exported for tests. */
export function toHits(kind: JudgmentKind, rows: RpcRow[]): JudgmentHit[] {
  return rows
    .filter((r) => typeof r.id === "string")
    .map((r) => ({
      kind,
      id: r.id as string,
      title: kind === "learning" ? null : str(r.title),
      body: str(
        kind === "decision"
          ? r.rationale
          : kind === "opportunity"
            ? r.problem
            : kind === "prd"
              ? r.body_md
              : r.summary,
      ),
      verdict: kind === "learning" ? str(r.verdict) : null,
      status: kind === "decision" ? str(r.status) : null,
      agentSlug: kind === "decision" ? str(r.decided_by_agent_slug) : null,
      createdAt: str(r.created_at),
      similarity: num(r.similarity),
    }));
}

const RPC_BY_KIND: Record<JudgmentKind, string> = {
  decision: "match_decisions",
  opportunity: "match_opportunities",
  prd: "match_prds",
  learning: "match_learnings",
};

export type JudgmentSearchOpts = {
  userId: string;
  /** Required. There is no workspace-less search: the RPC returns nothing for a null. */
  workspaceId: string | null;
  text: string;
  /** Never return this row as its own nearest neighbour. */
  excludeId?: string;
  /** Defaults to decisions + outcomes, the two that carry judgment rather than intent. */
  kinds?: JudgmentKind[];
  max?: number;
  threshold?: number;
};

/** Judgment, as opposed to intent: what was decided and what actually happened. */
export const DEFAULT_JUDGMENT_KINDS: JudgmentKind[] = ["decision", "learning"];

/**
 * Live search. Embeds once through the chokepoint (so the call is attributed, costed
 * and BYO-routed like every other embedding) and fans the SAME vector across the
 * requested kinds in parallel.
 *
 * The query is pinned to the model that produced it via `for_model`. This is not
 * decoration: on 2026-08-02 a provider key change silently moved production onto a
 * second embedding model, and rows from two vector spaces sat in the same column where
 * cosine distance between them is arithmetic without meaning. Pinning makes a
 * mixed-space comparison return NOTHING rather than confident nonsense.
 */
export type JudgmentSearchDeps = {
  /** Seam for tests. Production always uses the embeddings chokepoint. */
  embed: typeof embedThroughChokepointWithModel;
};

export async function searchWorkspaceRecord(
  supabase: SupabaseClient,
  opts: JudgmentSearchOpts,
  deps: JudgmentSearchDeps = { embed: embedThroughChokepointWithModel },
): Promise<JudgmentSearchResult> {
  const empty: JudgmentSearchResult = { hits: [], failedKinds: [], model: null };
  const text = opts.text?.trim();
  if (!text || !opts.workspaceId) return empty;

  const kinds = opts.kinds?.length ? opts.kinds : DEFAULT_JUDGMENT_KINDS;

  let vector: number[];
  let model: string;
  try {
    const res = await deps.embed([text.slice(0, 4000)], {
      supabase,
      userId: opts.userId,
      surfaceRef: "judgment_search",
    });
    vector = res.vectors?.[0] ?? [];
    model = res.model;
    if (!Array.isArray(vector) || vector.length === 0) return empty;
  } catch {
    return empty;
  }

  const settled = await Promise.all(
    kinds.map(async (kind) => {
      try {
        const { data, error } = await supabase.rpc(RPC_BY_KIND[kind], {
          query_embedding: vector as unknown as string,
          for_workspace: opts.workspaceId,
          match_count: POOL_PER_KIND,
          exclude_id: opts.excludeId ?? null,
          for_model: model,
        });
        if (error) return { kind, hits: [] as JudgmentHit[], failed: true };
        return { kind, hits: toHits(kind, (data ?? []) as RpcRow[]), failed: false };
      } catch {
        return { kind, hits: [] as JudgmentHit[], failed: true };
      }
    }),
  );

  return {
    hits: rankJudgment(
      settled.flatMap((s) => s.hits),
      opts.threshold ?? JUDGMENT_THRESHOLD,
      opts.max ?? JUDGMENT_MAX,
    ),
    failedKinds: settled.filter((s) => s.failed).map((s) => s.kind),
    model,
  };
}

/**
 * Convenience for prompt assembly: the formatted block, or "" when there is nothing to
 * say. Fail-safe, so a caller can inline it without a try/catch.
 */
export async function loadWorkspaceRecordBlock(
  supabase: SupabaseClient,
  opts: JudgmentSearchOpts,
  deps?: JudgmentSearchDeps,
): Promise<string> {
  try {
    const { hits } = await searchWorkspaceRecord(supabase, opts, deps);
    return formatWorkspaceRecord(hits);
  } catch {
    return "";
  }
}
