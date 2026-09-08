import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isStoppable, terminalStatusFilter } from "@/lib/run-status";
import { refundAbandonedRunCredits } from "@/lib/credits.functions";
import { resolveCreditAccountId } from "@/lib/ai/runtime.server";

// C4/E7 · Agent inspector data, the recent run history for one agent, so the
// operator can see what a given agent has actually been doing. Read-only,
// RLS-scoped (agent_runs is keyed on user_id, with an explicit filter as
// defense-in-depth and for the index). A null or errored query yields no rows.

export type AgentRun = {
  id: string;
  status: string | null;
  mission_id: string | null;
  step_index: number | null;
  created_at: string | null;
};

export const getAgentRuns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ agentId: z.string().min(1) }).parse(input))
  .handler(async ({ context, data }): Promise<{ runs: AgentRun[] }> => {
    const { supabase, userId } = context;
    const { data: rows } = await supabase
      .from("agent_runs")
      .select("id,status,mission_id,step_index,created_at")
      .eq("user_id", userId)
      .eq("agent_id", data.agentId)
      .order("created_at", { ascending: false })
      .limit(25);
    const runs: AgentRun[] = (rows ?? []).map((r) => ({
      id: r.id as string,
      status: (r.status as string | null) ?? null,
      mission_id: (r.mission_id as string | null) ?? null,
      step_index: (r.step_index as number | null) ?? null,
      created_at: (r.created_at as string | null) ?? null,
    }));
    return { runs };
  });

// C4/E7 · Agent memory inspector data, what a given agent knows: its own
// (private) memories plus the shared/global memories it can draw on. Two .eq
// queries merged (no `.or()` string interpolation, so a crafted agentId cannot
// alter the filter); RLS scopes every read to the caller.
export type AgentMemory = {
  id: string;
  scope: string | null;
  kind: string | null;
  content: string;
  importance: number | null;
  last_used_at: string | null;
};

export const getAgentMemory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ agentId: z.string().min(1) }).parse(input))
  .handler(async ({ context, data }): Promise<{ memories: AgentMemory[] }> => {
    const { supabase, userId } = context;
    const cols = "id,scope,kind,content,importance,last_used_at";
    const [own, shared] = await Promise.all([
      supabase
        .from("agent_memory")
        .select(cols)
        .eq("user_id", userId)
        .eq("agent_id", data.agentId)
        .order("importance", { ascending: false })
        .limit(20),
      supabase
        .from("agent_memory")
        .select(cols)
        .eq("user_id", userId)
        .eq("scope", "global")
        .order("importance", { ascending: false })
        .limit(20),
    ]);
    const byId = new Map<string, AgentMemory>();
    for (const m of [...(own.data ?? []), ...(shared.data ?? [])]) {
      const id = m.id as string;
      if (byId.has(id)) continue;
      byId.set(id, {
        id,
        scope: (m.scope as string | null) ?? null,
        kind: (m.kind as string | null) ?? null,
        content: (m.content as string | null) ?? "",
        importance: (m.importance as number | null) ?? null,
        last_used_at: (m.last_used_at as string | null) ?? null,
      });
    }
    return { memories: [...byId.values()] };
  });

/**
 * ── STOP A RUN ────────────────────────────────────────────────────────────────
 *
 * The audit's line was: `cancelRun|stopRun|abortRun|haltRun|pauseRun` returns
 * **zero hits repo-wide**, and the only stop that exists is a workspace-wide kill
 * switch. So the direction's §10 criterion 10 -- "runs stopped by a user, ever"
 * -- reads 0, and it reads 0 because it was impossible rather than because
 * nobody wanted it.
 *
 * THIS IS THE WRITER HALF ONLY, and the split is deliberate rather than
 * unfinished. A stop is three things and they fail in different ways:
 *
 *   1. a row saying the person stopped it            <- this function
 *   2. the loop noticing and abandoning its work     <- cooperative, see below
 *   3. a control to press                            <- a component, Kiro's lane
 *
 * Landing 1 alone is safe and useful: the run is marked, the money comes back,
 * and `finalize` can no longer overwrite the verdict (that precondition landed
 * first, deliberately, so this write cannot be silently undone).
 *
 * WHY THE LOOP MUST POLL RATHER THAN BE HANDED AN AbortController. `callModel`
 * already accepts a `signal?` and composes it with its timeout
 * (`runtime.server.ts:427`, `:604`), so the plumbing exists. What does not exist
 * is a way to REACH the controller: the loop runs in one worker invocation and
 * this request arrives in another, so there is no shared memory between them and
 * an in-process controller is unreachable by definition. The row is the channel.
 * The loop reads it between steps and aborts its own in-flight call, which is
 * the same shape `steerStudioSession` already uses and the reason that one
 * survives worker eviction.
 *
 * THE PRECONDITION IS THE WHOLE CORRECTNESS ARGUMENT. The write refuses to touch
 * a run that already reached a terminal status, in the same statement rather
 * than after a read, so a run that finished a millisecond ago is not retroped as
 * cancelled and a person is not told they stopped something that had already
 * completed. `TERMINAL_RUN_STATUSES` comes from K-12's module, so this predicate
 * and `finalize`'s cannot drift apart.
 *
 * `cancelMission`, which carried its own hand-written `TERMINAL` array on
 * `missions`, is gone (2026-09-08, no door since Board.tsx went); the copy that
 * survives is `MISSION_TERMINAL` in build/native.server.ts, still on
 * `missions` rather than `agent_runs`, so not simply substitutable for this.
 */
export const stopRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ runId: z.string().uuid() }).parse(input))
  .handler(
    async ({
      context,
      data,
    }): Promise<{ stopped: boolean; alreadyTerminal?: boolean; status?: string | null }> => {
      const { supabase, userId } = context;

      // RLS scopes this to the caller, so a runId belonging to somebody else
      // reads as absent rather than as forbidden. That is the existing idiom in
      // this file and it leaks nothing about whether the id exists.
      const { data: run, error: rErr } = await supabase
        .from("agent_runs")
        .select("id,status,workspace_id")
        .eq("id", data.runId)
        .maybeSingle();
      if (rErr) throw new Error(rErr.message);
      if (!run) throw new Error("Run not found");

      const current = (run.status as string | null) ?? null;
      if (!isStoppable(current)) {
        return { stopped: false, alreadyTerminal: true, status: current };
      }

      /*
       * One statement, so the check and the write cannot be separated by another
       * writer finishing the run in between. A zero-row result is not an error:
       * it means the run reached a terminal status while this request was in
       * flight, and that answer stands.
       */
      const { data: updated, error: uErr } = await supabase
        .from("agent_runs")
        .update({ status: "cancelled" })
        .eq("id", data.runId)
        .not("status", "in", terminalStatusFilter())
        .select("id,status");
      if (uErr) throw new Error(uErr.message);

      if (!updated || updated.length === 0) {
        const { data: after } = await supabase
          .from("agent_runs")
          .select("status")
          .eq("id", data.runId)
          .maybeSingle();
        return {
          stopped: false,
          alreadyTerminal: true,
          status: (after?.status as string | null) ?? current,
        };
      }

      /*
       * Hand the money back, on the same terms the halt path already uses:
       * best-effort, never throwing, because a metering hiccup must not turn a
       * successful stop into an error the person sees. The run is already
       * cancelled at this point and that is the fact that matters.
       */
      try {
        const accountId = await resolveCreditAccountId(
          supabase,
          userId,
          (run.workspace_id as string | null) ?? null,
        );
        if (accountId) {
          await refundAbandonedRunCredits(accountId, userId, data.runId, "stop-run");
        }
      } catch (e) {
        console.error("stopRun refund failed (run is still cancelled):", e);
      }

      return { stopped: true, status: "cancelled" };
    },
  );
