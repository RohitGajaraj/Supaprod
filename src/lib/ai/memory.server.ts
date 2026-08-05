/**
 * Agent memory recall + use-tracking (v6 Phase 1).
 *
 * Shared by the planner/executor loop (prompt injection) and the deterministic
 * mission advance (handoff threading). `recallMemoryRefs` returns BOTH:
 *   - `lines`: human-readable memory strings for system-prompt injection, and
 *   - `refs`:  `{ id, summary }` for `HandoffPayload.memory_refs[]` + the
 *     `last_used_at` write-back — the seam through which compounding memory
 *     threads across mid-loop hops (v6 §5, Appendix D).
 *
 * Both source RPCs (`match_agent_memory`, `recent_agent_reflections`) already
 * return the memory `id` alongside `content`, so no schema change is needed to
 * populate the refs — Phase 0 (W5) added the contract field; this fills it.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { embedOne } from "@/lib/rag/embed.server";
import { OUTCOME_MEMORY_KIND } from "./outcome-memory";
import { entitlementsFor, normalizePlanTier } from "@/lib/entitlements";

export type MemoryRef = { id: string; summary?: string };
export type RecalledMemory = { lines: string[]; refs: MemoryRef[] };

const SUMMARY_LEN = 140;

/**
 * WM-F2: which account (if any) to pool recall across. Returns the account id when the
 * active workspace's account is on a paid tier (crossWorkspaceMemory) — so the agent
 * recalls decision memory compounded across ALL the account's workspaces (the moat
 * flywheel) — and null otherwise (free / single-workspace: recall stays scoped to the
 * active workspace, byte-identical to WM-F1). `entitlements.ts` is the single source of
 * truth for which tiers pool. Resolved INTERNALLY (not threaded through callers) so the
 * pooling is actually driven without touching every recall call site. Pre-publish-
 * tolerant: if the accounts schema (WM-M2) is not live yet, any read error degrades to
 * null, so recall never widens incorrectly.
 */
async function resolvePoolAccountId(
  supabase: SupabaseClient,
  workspaceId: string | null,
): Promise<string | null> {
  if (!workspaceId) return null;
  try {
    const ws = await supabase
      .from("workspaces")
      .select("account_id")
      .eq("id", workspaceId)
      .maybeSingle();
    const accountId = (ws.data as { account_id?: string } | null)?.account_id;
    if (ws.error || !accountId) return null;
    const acc = await supabase
      .from("accounts")
      .select("plan_tier")
      .eq("id", accountId)
      .maybeSingle();
    if (acc.error || !acc.data) return null;
    const tier = normalizePlanTier((acc.data as { plan_tier?: unknown }).plan_tier);
    return entitlementsFor(tier).crossWorkspaceMemory ? accountId : null;
  } catch {
    return null;
  }
}

/**
 * Recall memory for `agentSlug` relevant to `query`. Two sources, deduped by
 * content: semantic match across all memory kinds + the top recent reflections.
 * `opts.touch` writes `last_used_at = now()` on the recalled ids (decay input).
 */
export async function recallMemoryRefs(
  supabase: SupabaseClient,
  userId: string,
  agentSlug: string,
  query: string,
  // WM-F1: the ACTIVE workspace. Recall is scoped to it (a multi-workspace user
  // recalls only this workspace, not everything they own). null = no workspace
  // filter (legacy / single-workspace behavior). The recall RPCs treat a NULL
  // memory.workspace_id as global, so untagged rows stay recallable everywhere.
  // WM-F2: for paid accounts this widens to pool across the account's workspaces,
  // resolved internally from the workspace's account tier (see resolvePoolAccountId).
  workspaceId: string | null,
  opts?: { maxItems?: number; touch?: boolean },
): Promise<RecalledMemory> {
  const maxItems = opts?.maxItems ?? 8;
  const lines: string[] = [];
  const refs: MemoryRef[] = [];
  const seenContent = new Set<string>();
  const seenId = new Set<string>();
  const push = (id: unknown, content: unknown) => {
    if (typeof content !== "string") return;
    const t = content.trim();
    if (!t || seenContent.has(t)) return;
    seenContent.add(t);
    lines.push(t);
    if (typeof id === "string" && id && !seenId.has(id)) {
      seenId.add(id);
      refs.push({ id, summary: t.slice(0, SUMMARY_LEN) });
    }
  };

  // WM-F2: pool recall across the account's workspaces for paid tiers; null = single.
  const poolAccountId = await resolvePoolAccountId(supabase, workspaceId);

  try {
    const v = await embedOne(query, { supabase, userId, surfaceRef: "memory-recall" });
    const matchArgs = {
      query_embedding: v as unknown as string,
      for_user: userId,
      for_agent_slug: agentSlug,
      match_count: 5,
    };
    const baseArgs = { ...matchArgs, for_workspace: workspaceId };
    let res = await supabase.rpc(
      "match_agent_memory",
      poolAccountId ? { ...baseArgs, for_account: poolAccountId } : baseArgs,
    );
    // Pre-migration tolerance: PGRST202 means that overload does not exist yet (the
    // deploy window before the migration applies). Step the signature back so recall
    // never goes dark: drop for_account (pre-WM-F2), then for_workspace (pre-WM-F1).
    // Degrading a paid account to single-workspace recall in the window is safe — it
    // never WIDENS recall. Any OTHER error stays non-fatal with no fallback, so a
    // transient error can never silently widen recall. Post-migration none of this runs.
    if (res.error?.code === "PGRST202" && poolAccountId) {
      res = await supabase.rpc("match_agent_memory", baseArgs);
    }
    if (res.error?.code === "PGRST202") {
      res = await supabase.rpc("match_agent_memory", matchArgs);
    }
    (res.data ?? []).forEach((m: { id?: string; content: string }) => push(m.id, m.content));
  } catch {
    /* embed/RPC failure is non-fatal */
  }

  try {
    const reflArgs = { for_user: userId, for_agent_slug: agentSlug, match_count: 3 };
    const baseRefl = { ...reflArgs, for_workspace: workspaceId };
    let res = await supabase.rpc(
      "recent_agent_reflections",
      poolAccountId ? { ...baseRefl, for_account: poolAccountId } : baseRefl,
    );
    if (res.error?.code === "PGRST202" && poolAccountId) {
      res = await supabase.rpc("recent_agent_reflections", baseRefl);
    }
    if (res.error?.code === "PGRST202") {
      res = await supabase.rpc("recent_agent_reflections", reflArgs);
    }
    (res.data ?? []).forEach((m: { id?: string; content: string }) => push(m.id, m.content));
  } catch {
    /* non-fatal */
  }

  const out: RecalledMemory = { lines: lines.slice(0, maxItems), refs: refs.slice(0, maxItems) };
  if (opts?.touch && out.refs.length) {
    await touchMemory(
      supabase,
      out.refs.map((r) => r.id),
    );
  }
  return out;
}

/** Mark recalled memories as used — feeds `last_used_at` decay sweeps. Non-fatal. */
export async function touchMemory(supabase: SupabaseClient, ids: string[]): Promise<void> {
  if (!ids.length) return;
  try {
    await supabase
      .from("agent_memory")
      .update({ last_used_at: new Date().toISOString() })
      .in("id", ids);
  } catch (e) {
    console.error("touchMemory failed:", e);
  }
}

/**
 * RF-03 — extends the touchMemory seam: touchMemory only knows a memory was
 * recalled, never whether the run that recalled it turned out useful. Call
 * this alongside touchMemory at recall time with the run's traceId (not an
 * eventId — one recall's lines are baked into the system prompt once and
 * reused by every callModel call in the run's step loop, so traceId is the
 * correct correlation key). Rows default to 'ignored'; feedback.functions.ts's
 * submitFeedback upgrades them to 'used'/'contradicted' when a rating arrives
 * for any event in the trace. Best-effort — never breaks the loop.
 */
export async function logMemoryRecall(
  supabase: SupabaseClient,
  args: {
    memoryIds: string[];
    traceId: string | null;
    userId: string;
    workspaceId: string | null;
  },
): Promise<void> {
  if (!args.memoryIds.length || !args.traceId) return;
  try {
    await supabase.from("memory_recall_log").insert(
      args.memoryIds.map((memory_id) => ({
        memory_id,
        trace_id: args.traceId,
        user_id: args.userId,
        workspace_id: args.workspaceId,
      })),
    );
  } catch (e) {
    console.error("logMemoryRecall failed:", e);
  }
}

/**
 * What `rememberOutcome` did, in a shape the caller can put ON THE RECORD.
 *
 * It used to return `{ id } | null`, and null meant three different things:
 * the content could not be embedded, the insert was refused, or something
 * threw. All three landed in a `console.error` in a Cloudflare Worker, which
 * is to say nowhere. `prds.outcome` would then read as a settled outcome whose
 * lesson silently never reached the brain, the row would leave the pending
 * queue forever, and nothing would ever retry it. That is the defect this type
 * prevents: the failure now travels back to `applyOutcome`, which writes it
 * into `prds.outcome` so a settled-but-unremembered outcome is findable with
 * one query instead of being lost.
 */
export type RememberOutcomeResult = {
  /** The agent_memory row written. Null when nothing was written. */
  id: string | null;
  /** Prior outcome memories for this PRD that this one supersedes. They are
   *  MARKED, never deleted, so the record accumulates. */
  supersedes: string[];
  /** One line saying why nothing was written. Null when a row was written. */
  error: string | null;
};

/**
 * The sentinel that makes the supersession note idempotent.
 *
 * A spec can be settled, overturned, then re-measured, and each pass would
 * otherwise staple another note onto the same row until the content was mostly
 * notes. Cutting at this mark before re-appending means a row carries exactly
 * one supersession line, always naming its immediate successor.
 */
export const SUPERSEDED_MARK = "\n\n[Superseded]";

/**
 * Append the supersession note to a prior outcome memory's content.
 *
 * Pure, so the exact wording the loop reads is unit-tested rather than assumed.
 *
 * WHY APPEND RATHER THAN DELETE OR REWRITE. The prior verdict is a true fact
 * about a real moment and the highest-signal thing this product owns: "we
 * called it validated in March and it was missed by June" is the precedent a
 * decision brain exists to hold. Deleting it removed that. Rewriting the
 * original sentence would falsify it. Appending keeps the original text
 * verbatim and adds what later happened to it, so the row gains information
 * and never loses any, and an agent that recalls both rows can tell which one
 * is current instead of reading two verdicts as two independent data points.
 */
export function supersededContent(prior: string, nextVerdict: string, at: string): string {
  const base = prior.split(SUPERSEDED_MARK)[0].trimEnd();
  const verdict = nextVerdict.trim().toUpperCase() || "A DIFFERENT VERDICT";
  // Date only: the day is what a reader needs to order two verdicts, and a full
  // timestamp reads as false precision in a sentence an agent is about to quote.
  const day = at.slice(0, 10);
  // A row whose content was empty gets the note with no leading blank lines, so
  // the separator never becomes the whole first paragraph of what the loop reads.
  const mark = base ? SUPERSEDED_MARK : SUPERSEDED_MARK.trimStart();
  return `${base}${mark} Later re-recorded as ${verdict} on ${day}. This line is the record of what was believed at the time, not the current verdict.`;
}

type PriorOutcomeMemory = {
  id: string;
  content: string | null;
  metadata: Record<string, unknown> | null;
};

/** Prior rows this write supersedes: every outcome memory for the PRD that has
 *  not already been superseded by a later one. Pure, so the selection rule is
 *  tested rather than inferred from a PostgREST filter chain. Already-superseded
 *  rows are left alone deliberately: re-stamping them would make each note name
 *  the newest verdict rather than the one that actually replaced it. */
export function selectSupersedable(rows: PriorOutcomeMemory[]): PriorOutcomeMemory[] {
  return rows.filter((r) => !r.metadata?.superseded_at);
}

/**
 * Persist a recorded outcome as a durable, searchable, GLOBAL-scope memory so
 * EVERY future agent run recalls it (v6 Phase 2 — close the compounding loop).
 * Embedded so it surfaces via `match_agent_memory`; metadata entity-links the
 * PRD / opportunity / learning that produced it.
 *
 * IT ACCUMULATES. It used to DELETE the prior outcome memory for the PRD before
 * inserting, which capped the corpus at one row per spec forever: a cache, not a
 * moat. Two callers write here (the human settling on /learn, and the agent's
 * learning.record) against the same prd_id key, so under the old rule a person
 * settling an outcome silently destroyed the agent's memory of it, and an agent
 * recording twice in one mission kept only its last word. Nothing that compounds
 * can be built on a store whose row count per subject is capped at one. Prior
 * rows are now marked superseded and kept.
 *
 * Never throws: a memory write must not break outcome recording. But it no
 * longer swallows either, see RememberOutcomeResult.
 */
export async function rememberOutcome(
  supabase: SupabaseClient,
  args: {
    userId: string;
    workspaceId: string | null;
    prdId: string;
    opportunityId: string | null;
    learningId: string | null;
    content: string;
    importance: number;
    verdict: string;
    priorIce: number | null;
    newIce: number | null;
    prdTitle: string | null;
    oppTitle: string | null;
  },
): Promise<RememberOutcomeResult> {
  const nothing = (error: string): RememberOutcomeResult => ({ id: null, supersedes: [], error });
  try {
    // A memory the loop can't recall is worse than none: match_agent_memory
    // hard-filters `embedding IS NOT NULL` and there is no re-embed sweep. So if
    // we can't produce an embedding, skip the write entirely — never insert an
    // unrecallable ghost row, and never delete a prior good row to replace it
    // with one. (embedOne can also return a sparse/undefined value — coerce it.)
    let emb: number[] | null = null;
    try {
      const v = await embedOne(args.content, {
        supabase,
        userId: args.userId,
        surfaceRef: "outcome-memory",
      });
      emb = Array.isArray(v) && v.length > 0 ? v : null;
    } catch {
      emb = null;
    }
    if (!emb) {
      return nothing(
        "the outcome could not be embedded, and match_agent_memory hard filters embedding IS NOT NULL, so an unrecallable row would be worse than none",
      );
    }

    // Read the prior outcome memories for this PRD. READ, not delete: the new
    // row supersedes them, it does not replace them. (Repo jsonb-filter
    // convention: `.filter("col->>key")`.) A failed read is non-fatal and simply
    // supersedes nothing, because losing the chain is better than losing the write.
    let priors: PriorOutcomeMemory[] = [];
    try {
      const { data: priorRows } = await supabase
        .from("agent_memory")
        .select("id,content,metadata")
        .eq("user_id", args.userId)
        .filter("metadata->>source", "eq", "outcome")
        .filter("metadata->>prd_id", "eq", args.prdId);
      priors = selectSupersedable((priorRows ?? []) as PriorOutcomeMemory[]);
    } catch (e) {
      console.error("rememberOutcome prior-memory read failed (non-fatal):", e);
    }
    const supersedes = priors.map((p) => p.id);

    const { data, error } = await supabase
      .from("agent_memory")
      .insert({
        user_id: args.userId,
        agent_id: null,
        agent_slug: null,
        scope: "global",
        kind: OUTCOME_MEMORY_KIND,
        content: args.content,
        importance: args.importance,
        metadata: {
          source: "outcome",
          workspace_id: args.workspaceId,
          prd_id: args.prdId,
          opportunity_id: args.opportunityId,
          learning_id: args.learningId,
          verdict: args.verdict,
          prior_ice: args.priorIce,
          new_ice: args.newIce,
          prd_title: args.prdTitle,
          opp_title: args.oppTitle,
          // The chain, walkable in both directions: this row names what it
          // replaced, and each replaced row names this one (below).
          supersedes,
        },
        embedding: emb as unknown as string,
      })
      .select("id")
      .single();
    if (error) throw new Error(`agent_memory insert refused: ${error.message}`);
    const insertedId = (data as { id?: string } | null)?.id ?? null;
    if (!insertedId) {
      return nothing("agent_memory insert returned no row id");
    }
    // WM-F1: tag the row with its workspace (the column is nullable and has no
    // DEFAULT bridge, so a plain insert leaves it null). Done as a separate,
    // error-tolerant update so it stays pre-migration safe: before the column
    // exists the update simply no-ops, and a null workspace_id recalls as global.
    if (args.workspaceId) {
      try {
        await supabase
          .from("agent_memory")
          .update({ workspace_id: args.workspaceId })
          .eq("id", insertedId);
      } catch {
        /* column not present yet (pre-migration) — non-fatal */
      }
    }

    // Mark the priors, AFTER the new row exists. Order is the whole safety
    // argument: if this half fails, the corpus holds two live outcome memories
    // for one spec, which is recoverable and honest. The old code did the
    // destructive half FIRST, so the same failure left the spec with no memory
    // at all and no way to tell it had ever had one.
    //
    // The embedding is deliberately left as it was. It still points at the same
    // subject, so the row stays recallable, and the text the agent actually
    // reads now carries the correction. Re-embedding here would spend a call to
    // move a vector that was already in the right place.
    const at = new Date().toISOString();
    for (const p of priors) {
      try {
        await supabase
          .from("agent_memory")
          .update({
            content: supersededContent(p.content ?? "", args.verdict, at),
            metadata: {
              ...(p.metadata ?? {}),
              superseded_at: at,
              superseded_by: insertedId,
              superseded_by_verdict: args.verdict,
            },
          })
          .eq("id", p.id);
      } catch (e) {
        // Non-fatal by design: an unmarked prior is a stale row, a lost prior
        // is a lost fact, and only one of those is recoverable.
        console.error("rememberOutcome supersede-mark failed (non-fatal):", e);
      }
    }

    return { id: insertedId, supersedes, error: null };
  } catch (e) {
    console.error("rememberOutcome failed:", e);
    return nothing(e instanceof Error ? e.message : String(e));
  }
}
