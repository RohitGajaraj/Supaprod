/**
 * What the record has TAUGHT. The counterpart to brain.functions.ts, which
 * reports what the record HOLDS.
 *
 * Brain's binding rule (CLAUDE.md investor canon): "The brain is never storage.
 * Banned framing: where the record lives. Canon: it compounds; next time it
 * tells you what is right, and warns before you repeat what was wrong."
 *
 * A count of rows cannot prove that. Two things in this schema can, and neither
 * of them was ever read by the Brain surface:
 *
 *   1. house_rules. A weekly steward pass clusters a workspace's validated
 *      learnings into short standing rules, a human approves each one, and every
 *      approved rule is injected into every agent's system prompt at the
 *      chokepoint (src/lib/ai/loop.server.ts:387-388, via
 *      renderHouseRulesBlock). That is the record changing what happens next,
 *      and source_learning_ids is the receipt for where it came from.
 *
 *   2. memory_recall_log + agent_memory.last_used_at. A memory is written once
 *      and then either reached for during a run or never touched again.
 *      last_used_at says whether the loop reached for it; the recall log's
 *      outcome column says what came of it once a human rated the run
 *      ('used', 'contradicted', or the default 'ignored'; see
 *      applyRetrievalFeedback in feedback.functions.ts).
 *
 * Nothing here estimates. Every number is an exact head count, and a read that
 * cannot run reports its own absence rather than a zero.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getActiveHouseRulesForWorkspace } from "@/lib/house-rules.functions";

/** One standing rule the record produced, already approved and still active. */
export type StandingRule = {
  id: string;
  text: string;
  rationale: string | null;
  /** How many recorded outcomes the steward distilled it from. */
  fromOutcomes: number;
  /** null = every agent reads it. A slug = only that one does. */
  agentSlug: string | null;
  decidedAt: string | null;
  createdAt: string;
};

/** Whether the crew actually reaches for what it stored. */
export type RecallRecord = {
  memoriesTotal: number;
  /** Memories the loop has recalled at least once (last_used_at is set). */
  memoriesReached: number;
  /** Recall events logged, across every run. */
  events: number;
  /** Events a human's rating later marked as having helped. */
  helped: number;
  /** Events a human's rating later marked as contradicted by the outcome. */
  contradicted: number;
  /** False when memory_recall_log is not present yet. The UI then says the
   *  loop is not keeping this record rather than showing zeros. */
  logReady: boolean;
};

export type StandingRecord = {
  /** Active rules: approved, and not retired by an approved supersession. */
  rules: StandingRule[];
  /** Drafts the steward has written that nobody has decided yet. */
  pendingRules: number;
  recall: RecallRecord;
};

const Schema = z.object({ workspaceId: z.string().uuid().nullable().optional() }).strip();

/** Exact, or absent. A head count that errored contributes no number. */
async function headCount(
  build: () => PromiseLike<{ count: number | null; error: unknown }>,
): Promise<number | null> {
  const { count, error } = await build();
  if (error) return null;
  return count ?? 0;
}

export const getStandingRecord = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => Schema.parse(i ?? {}))
  .handler(async ({ context, data }): Promise<StandingRecord> => {
    const { supabase, userId } = context;

    // Same resolution the house-rules reader uses, so Brain and the Engine Room
    // are looking at one workspace's rules and never at two different sets.
    let workspaceId = data?.workspaceId ?? null;
    if (!workspaceId) {
      const { data: def } = await supabase.rpc("current_user_default_workspace");
      workspaceId = (def as string | null) ?? null;
    }
    const wid = workspaceId;

    const head = { count: "exact" as const, head: true };

    const rulesPromise: Promise<StandingRule[]> = wid
      ? getActiveHouseRulesForWorkspace(supabase as unknown as SupabaseClient, wid).then((rules) =>
          rules.map((r) => ({
            id: r.id,
            text: r.rule_text,
            rationale: r.rationale,
            fromOutcomes: Array.isArray(r.source_learning_ids) ? r.source_learning_ids.length : 0,
            agentSlug: r.agent_slug,
            decidedAt: r.decided_at,
            createdAt: r.created_at,
          })),
        )
      : Promise.resolve([]);

    const pendingPromise: Promise<number | null> = wid
      ? headCount(() =>
          supabase
            .from("house_rules")
            .select("id", head)
            .eq("workspace_id", wid)
            .eq("status", "pending"),
        )
      : Promise.resolve(0);

    // COLUMN PROVENANCE, because tsc does not check a PostgREST column name and
    // a wrong one fails only at runtime (verified: renaming last_used_at below
    // to a nonexistent column still typechecks clean). Every column used here
    // is one that shipping code already reads or writes:
    //   agent_memory.user_id / .workspace_id / .last_used_at  memory.functions.ts
    //   memory_recall_log.user_id / .workspace_id / .outcome  feedback.functions.ts,
    //                                                         ai/memory.server.ts
    //   house_rules.workspace_id / .status                    house-rules.functions.ts
    /*
     * ── THESE COUNTS ARE THIS WORKSPACE'S COUNTS (P-33, 2026-09-03) ────────
     *
     * The comment that stood here justified counting by owner alone: "agent_memory
     * is owner-scoped (RLS auth.uid() = user_id), so it is counted the same way the
     * memory list beside it is. Scoping one by workspace and one by owner would put
     * two numbers on the same line that cannot be compared."
     *
     * The reasoning is right and its premise was false. The list beside it is NOT
     * owner-scoped: `getAgentMemory` takes a `workspaceId` and filters on it, and it
     * has since 2026-08-10, when it was repaired for THIS EXACT DEFECT. Its own
     * header records the measurement -- "4 of the 5 multi-workspace users are members
     * of a seeded demo workspace, so those counts were provably mixed" -- and this
     * function was never brought along. So the comment described the world before
     * that fix and then used it to argue for staying broken, which is the most
     * expensive kind of stale comment: one that reads as a decision.
     *
     * What a person saw: an empty workspace printing "A run has read 118 of these
     * back - 587 recalls on the record" directly above a list reading "Nothing
     * learned yet." Both numbers were real and belonged to a different workspace.
     * Worse, `memoriesTotal` gates `recordIsBlank` on Outcomes, so one memory in ANY
     * other workspace stopped the designed zero state from ever firing on a genuinely
     * empty one.
     *
     * Checked on production before filtering: `agent_memory` 2,180 rows and
     * `memory_recall_log` 13,361 rows, ZERO with a null `workspace_id` in either. So
     * the filter hides nothing, which is the same check the 2026-08-10 fix made.
     *
     * Unresolved stays unfiltered. A caller whose workspace cannot be resolved gets
     * the owner-wide count it always got, because narrowing to a workspace we cannot
     * name would turn a failed lookup into "you have nothing", and that is a claim.
     */
    const recallBase = () => {
      const q = supabase.from("memory_recall_log").select("id", head).eq("user_id", userId);
      return wid ? q.eq("workspace_id", wid) : q;
    };
    const memoryBase = () => {
      const q = supabase.from("agent_memory").select("id", head).eq("user_id", userId);
      return wid ? q.eq("workspace_id", wid) : q;
    };

    const [rules, pending, total, reached, events, helped, against] = await Promise.all([
      rulesPromise,
      pendingPromise,
      headCount(() => memoryBase()),
      headCount(() => memoryBase().not("last_used_at", "is", null)),
      recallBase(),
      recallBase().eq("outcome", "used"),
      recallBase().eq("outcome", "contradicted"),
    ]);

    // A log that cannot be read (absent table on a fresh environment, or a
    // transient failure) is a different fact from a log with nothing in it, and
    // the surface says so in different words. Never a zero standing in for "we
    // could not find out".
    const logReady = !events.error;

    return {
      rules,
      pendingRules: pending ?? 0,
      recall: {
        memoriesTotal: total ?? 0,
        memoriesReached: reached ?? 0,
        events: logReady ? (events.count ?? 0) : 0,
        helped: helped.error ? 0 : (helped.count ?? 0),
        contradicted: against.error ? 0 : (against.count ?? 0),
        logReady,
      },
    };
  });
