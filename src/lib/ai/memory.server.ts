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
   *  MARKED, never deleted, so the record accumulates. Always empty when the
   *  verdict named no spec: see the supersede scan for why there is no correct
   *  key to group spec-less verdicts by. */
  supersedes: string[];
  /** One line saying why nothing was written. Null when a row was written. */
  error: string | null;
  /**
   * One line saying the row is NOT pinned to the workspace that earned it.
   * Null is the only reading that means "recallable from where it was settled".
   *
   * IT IS SEPARATE FROM `error` ON PURPOSE. A memory in the wrong workspace
   * exists and holds its lesson; a memory that was never written does not, and
   * only the second should ever make `id` null. Folding them would also make
   * `prds.outcome.settled_memory_error` mean two different things, and would
   * break the invariant every reader here relies on — that exactly one of `id`
   * and `error` is set.
   */
  workspaceError: string | null;
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
 * rows are now marked superseded and kept — for verdicts that named a spec.
 * A verdict with no spec has no key to chain on; see below.
 *
 * Never throws: a memory write must not break outcome recording. But it no
 * longer swallows either, see RememberOutcomeResult.
 *
 * `prdId` IS NULLABLE, AND THAT IS THE WHOLE MOAT ON THE AGENT PATH.
 *
 * It used to be `string`, so the agent's `learning.record` could only reach the
 * pool when it could resolve a spec, and `registry.server.ts` wrapped this call
 * in `if (resolvedPrdId)`. Measured live on 2026-08-06: 84 of 119 learnings
 * carry no `prd_id`, and all three non-seed learnings this database has ever
 * held (2026-08-01, data-analyst and insight-keeper) carry `prd_id` null AND
 * `opportunity_id` null. So on the only settle path that has ever run in
 * production the memory write was skipped before it started — no insert, no
 * error, nothing that could land in `settled_memory_error`. `agent_memory`
 * holds 879 reflection / 28 precedent / 26 note / 8 correction rows and ZERO of
 * kind 'outcome'. The pool the Critic's red team and `loadDecisionPrecedent`
 * read has never held a row, and this parameter is one of the reasons.
 *
 * A VERDICT WITH NO SPEC IS WORTH STORING. This was judged, not assumed:
 *   · Retrieval never looks at `prd_id`. `match_agent_memory` ranks on the
 *     embedding of `content` and filters on user, workspace-or-account, agent
 *     slug or global scope, and expiry; the only metadata it touches is
 *     `verdict`, as a small ranking nudge. `loadDecisionPrecedent` filters to
 *     kind='outcome' client-side and fetches the metadata afterwards, for
 *     citation. The lesson text is the payload; a spec id is not what makes it
 *     findable.
 *   · The read side already models a spec-less precedent as first class:
 *     `PrecedentMatch.prdId` is `string | null`, `rankPrecedent` falls back
 *     `prd_title || opp_title || null`, and `getPrecedentCitations` filters
 *     nulls out of its prd lookup (decision-precedent.server.ts:29/:69,
 *     decision-judgment.functions.ts:245). Nothing downstream requires one.
 *   · It is spec-LESS, not anchor-less. `learningId` is non-null at that call
 *     site by construction (the `learnings` insert throws on error above it),
 *     so every such row names the audit row it came from, which carries the
 *     verdict, the summary, the metric, the agent slug and the time.
 * WHAT IT COSTS, because storing it is not free:
 *   · NO SUPERSESSION. The chain is keyed on `prd_id` and there is no correct
 *     substitute — `opportunity_id` would supersede a sibling spec's verdict,
 *     and "every prior memory with no spec" is not a supersede set. Two
 *     spec-less verdicts about the same subject therefore both stay current,
 *     and an agent recalling both reads two independent data points. That is
 *     precisely what `supersededContent` exists to prevent, and it is not
 *     prevented here.
 *   · The Critic's precedent block renders a null title as "an untitled spec"
 *     (outcome-memory.ts, `formatDecisionPrecedent`), which names a spec that
 *     does not exist. Reachable the moment a spec-less verdict is recalled.
 */
export async function rememberOutcome(
  supabase: SupabaseClient,
  args: {
    userId: string;
    workspaceId: string | null;
    /** The spec this verdict was given on, or null when none could be resolved.
     *  Null is a real, supported case — see the docblock. */
    prdId: string | null;
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
  const nothing = (error: string): RememberOutcomeResult => ({
    id: null,
    supersedes: [],
    error,
    // Nothing was written, so there is no row whose tenancy could be wrong.
    // Reporting a workspace problem here would invent one.
    workspaceError: null,
  });
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
    //
    // SKIPPED ENTIRELY WHEN THERE IS NO SPEC, and skipped rather than widened.
    // `.filter("metadata->>prd_id", "eq", null)` is a malformed PostgREST
    // filter, and the set it would stand for — every prior outcome memory this
    // user wrote that named no spec — is not a supersede set: those verdicts
    // are about different subjects and none of them replaced the others. The
    // consequence is written into `RememberOutcomeResult.supersedes` and into
    // the docblock rather than hidden: a spec-less verdict never supersedes and
    // is never superseded, so the accumulation guarantee this function was
    // rewritten to provide holds only for verdicts that named a spec.
    let priors: PriorOutcomeMemory[] = [];
    if (args.prdId) {
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
    // WM-F1: pin the row to the workspace whose spec was settled.
    //
    // THE COMMENT THAT USED TO BE HERE WAS FALSE, and its two false halves are
    // why this is worth spelling out. It said the column "has no DEFAULT bridge,
    // so a plain insert leaves it null", and that "a null workspace_id recalls
    // as global". Checked against the live database on 2026-08-06: `agent_memory`
    // carries a BEFORE INSERT trigger, `trg_set_agent_memory_workspace` ->
    // `set_row_workspace_from_user()`, which fills a null workspace_id with
    // `ensure_user_default_workspace(NEW.user_id)`. So the insert above never
    // leaves it null. It lands the row in the workspace that function picks:
    // the user's EARLIEST `workspace_members` row by `created_at`, which for a
    // signup seeded into an example workspace is that example workspace. The
    // state the old comment called safe is unreachable; the state that does
    // occur is worse than the one it described.
    //
    // MEASURED, so the size of it is not guessed (re-measured 2026-08-06): of
    // 16 users with a workspace membership, 11 belong to exactly one, and for
    // those the trigger's pick is necessarily the right one and nothing is
    // stranded. Five belong to more than one, three of them to exactly two.
    //
    // AN EARLIER VERSION OF THIS PARAGRAPH SAID OF THOSE THREE THAT "all three
    // have a SAMPLE workspace as their earliest membership". Re-running the
    // query says only TWO do, and the third case is worse than an off-by-one.
    // 9e7958c5 resolves to "Sample sandbox" and 1339eea2 to "Sample workspace",
    // both correctly. But 868ae33b's two `workspace_members` rows carry an
    // IDENTICAL `created_at` (2026-07-22 15:47:26.270201+00) — one for "My
    // Workspace" (is_sample false) and one for "Sample workspace" (is_sample
    // true) — and `ensure_user_default_workspace` picks with `ORDER BY
    // m.created_at LIMIT 1` and no tiebreak. So for that user the trigger's
    // choice is NONDETERMINISTIC between a real workspace and a seeded one, and
    // which workspace their outcome memory lands in is not a fact anyone can
    // state, this comment included. So the exposure is real, it is small today,
    // and it grows with every user who gets a second workspace.
    //
    // WHERE A STRANDED ROW CAN AND CANNOT BE REACHED, AND IT DEPENDS ENTIRELY
    // ON WHICH ARGUMENTS THE READER PASSES. Three earlier versions of this
    // comment each got a piece of it and each stated it as the whole, so all of
    // them are written out rather than replaced.
    //
    // The FIRST version quoted `match_agent_memory`'s tenancy filter as
    // `m.workspace_id = for_workspace or m.workspace_id is null` and concluded
    // it "cannot reach it". That is only the `for_account is null` branch. The
    // live function also carries `for_account is not null and (m.workspace_id
    // is null or m.workspace_id in (select w.id from workspaces w where
    // w.account_id = for_account))`.
    //
    // The SECOND version therefore said a stranded row "IS still reachable" on
    // a pooled account. A THIRD narrowed that to "it is true of exactly ONE of
    // the four callers of this RPC, and it is the one in this file", and THAT
    // is wrong in the other direction.
    //
    // REACHABILITY IS A PROPERTY OF THE ARGUMENTS, NOT OF THE CALLER, which is
    // why every version of this so far has landed on the wrong side of it.
    // Re-pulled from the live function body on 2026-08-06, the tenancy clause is
    // `(for_account is not null and ...) or (for_account is null and
    // (for_workspace is null or m.workspace_id = for_workspace or
    // m.workspace_id is null))`. Pass NEITHER argument and both disjuncts of the
    // second branch's inner test collapse to TRUE, so the clause narrows
    // NOTHING: every row the caller is otherwise entitled to see survives it.
    // And a stranded row sits in a workspace the settler is a member of by
    // construction (the trigger picked it out of that user's own
    // `workspace_members`), so it clears the membership clauses too. Passing no
    // narrowing is therefore the LOOSEST call, not a restricted one.
    //   · `recallMemory` (:112 above) passes `for_account` when
    //     `resolvePoolAccountId` returns one, so on a POOLED account a stranded
    //     row IS reachable there, provided the workspace it was stranded in
    //     belongs to the same account. On a free / single-workspace account it
    //     is not.
    //   · `brain/novelty.server.ts:42` passes NEITHER argument, so
    //     `computeNovelty` is in the loose case UNCONDITIONALLY and a stranded
    //     row is reachable there on ANY tier, paid or free. The bullet this
    //     replaces read "`brain/novelty.server.ts:42` passes neither. On those
    //     three a stranded row is NOT reachable on any tier, paid or free": it
    //     got the fact right and inverted the consequence.
    //   · `memory-candidates.functions.ts:101` passes `for_workspace`, but
    //     `resolveWorkspaceId` (:68 there) is typed `string | null` and a NULL
    //     `for_workspace` is not a narrowing, it is the novelty case above. That
    //     reader is out of reach only while it resolves a workspace.
    //   · `loadDecisionPrecedent` (decision-precedent.server.ts:98) builds
    //     `{ ...base, for_workspace: args.workspaceId }` and never passes
    //     `for_account` — but its own signature is `workspaceId: string | null`
    //     (:84 there), so IT narrows only when its caller hands it a workspace.
    //     Which of its callers do is the question below, and it is the one that
    //     decides whether the moat claim survives.
    // Both `loadDecisionPrecedent` and `memory-candidates` additionally carry a
    // PGRST202 fallback that RE-CALLS the RPC without `for_workspace`, which
    // would put either in the loose case. It is dead today, because the overload
    // carrying `for_workspace` and `for_account` is live (signature pulled
    // 2026-08-06), and it is worth knowing it is there.
    //
    // SO, WHICH OF ITS CALLERS ACTUALLY HAND IT ONE. An earlier version of this
    // paragraph named three surfaces and treated them as a group; there are six
    // caller modules and they do not behave as one. Rather than list all six and
    // watch the list rot, the rule and the two exceptions, checked 2026-08-06:
    //   · THE PRECEDENT SURFACE NARROWS ON EVERY CALL, and it is the one the
    //     docblock above (:324) means by "the pool the Critic's red team and
    //     `loadDecisionPrecedent` read". The Critic's red team
    //     (critic.server.ts:245), the bet judgment (all three sites in
    //     decision-judgment.functions.ts), the proactive nudge
    //     (decision-precedent.functions.ts:24) and the theme brief
    //     (`getThemePrecedent` in discovery.functions.ts, by symbol because that
    //     file is under concurrent edit) all source their `workspaceId` from an
    //     `opportunities`, `decisions`, `prds` or `themes` row, and ALL FOUR OF
    //     THOSE COLUMNS ARE NOT NULL (verified live). The `?? null` at those
    //     call sites is defensive, not a reachable branch. For the moat,
    //     "cannot reach it" was right.
    //   · TWO CALLERS PASS NULL AND ARE THEREFORE IN THE LOOSE CASE. The
    //     supersession engine (supersession.server.ts:87) passes
    //     `workspaceId: null` literally, and chat (routes/api/chat.ts:1220)
    //     passes a `workspaceId` that its own guards at :626 and :638 prove can
    //     be null. A stranded row is a candidate at both. For supersession that
    //     direction is benign and arguably the useful one, since supersession
    //     exists to find the PRIOR outcome and mark it replaced and a row
    //     stranded in the wrong workspace is precisely the one a narrowed read
    //     would miss. Benign or not, neither is a narrowing and neither may be
    //     counted as one.
    //
    // So this update is not a nicety, it is a MOVE, and it is what makes the
    // outcome recallable where it was earned on every tier. It stays a separate
    // statement for pre-migration tolerance (before the column exists it simply
    // no-ops), and it stays best-effort because a memory in the wrong workspace
    // still beats no memory.
    //
    // AND ITS RESULT IS NOW READ, which it was not. supabase-js resolves an RLS
    // refusal as a success with zero rows, so without `.select("id")` a refused
    // move was invisible and the row stayed put while `settled_memory_id` read
    // as a clean success. Verified live, `agent_memory`'s UPDATE policy is
    // USING and WITH CHECK `auth.uid() = user_id AND is_workspace_member(
    // workspace_id)` — USING against the row's CURRENT workspace (the trigger's
    // pick) and WITH CHECK against the target — so a silent refusal needs a
    // caller who is not a member of one of the two. It is unreachable from
    // `applyOutcome`: `prds.workspace_id` is NOT NULL (verified) and a settler
    // who can read the spec is a member of its workspace.
    //
    // A NULL `workspaceId` FAILS DIFFERENTLY AND MORE QUIETLY, and the previous
    // comment attributed the swallowed refusal to it, which was wrong: the
    // guard below skips the statement entirely, so there is no result to
    // swallow. Nothing is refused; the row simply keeps the tenancy the trigger
    // chose and nobody asked whether that was the right one. The agent path
    // (`registry.server.ts` -> `resolvedWorkspace`) can pass null, so that case
    // reports too — as what it is, an unverified tenancy rather than a refusal.
    let workspaceError: string | null = null;
    if (args.workspaceId) {
      try {
        const moved = await supabase
          .from("agent_memory")
          .update({ workspace_id: args.workspaceId })
          .eq("id", insertedId)
          .select("id");
        // 42703 / PGRST204 are "no such column": the pre-migration window this
        // statement was split out for. Named rather than reported as a refusal,
        // because calling a missing column an RLS refusal would be a false
        // claim in the other direction — but not silent either, since the
        // column exists in this database today and its absence would mean the
        // schema regressed.
        const code = (moved.error as { code?: string } | null)?.code ?? null;
        if (code === "42703" || code === "PGRST204") {
          workspaceError = `agent_memory.workspace_id does not exist in the schema cache (${code}), so the memory kept the tenancy the insert trigger chose`;
        } else if (moved.error) {
          workspaceError = `pinning the outcome memory to workspace ${args.workspaceId} failed: ${moved.error.message}`;
        } else if (!(moved.data ?? []).length) {
          // The row was inserted moments ago and its id came back from the
          // insert, so "no rows matched" cannot mean "no such row". Under RLS
          // it means the UPDATE policy refused, which supabase-js reports as a
          // success. This is the branch the house rule exists for.
          workspaceError = `pinning the outcome memory to workspace ${args.workspaceId} was refused (no rows updated), so it stays in the workspace the insert trigger chose and cannot be recalled from the one that settled it`;
        }
      } catch (e) {
        workspaceError = `pinning the outcome memory to workspace ${args.workspaceId} threw: ${e instanceof Error ? e.message : String(e)}`;
      }
    } else {
      workspaceError =
        "no workspace was supplied, so the memory kept the tenancy the insert trigger chose (the author's earliest workspace), which is not known to be the one that earned it";
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

    return { id: insertedId, supersedes, error: null, workspaceError };
  } catch (e) {
    console.error("rememberOutcome failed:", e);
    return nothing(e instanceof Error ? e.message : String(e));
  }
}
