// PC-12: the reconciler. Runs independently of loop.server.ts (zero touch
// to the pinned engine) -- it only ever READS agent_runs the existing loop
// already advances, and WRITES the fanout_batches row once every child of a
// batch has reached a terminal status. Mechanical merge (each child's own
// output, by its stamped fanout_section) plus one short AI synthesis line;
// never blocks on the synthesis call failing.
import { createFileRoute } from "@tanstack/react-router";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireHookCaller } from "./-_auth.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { callModel } from "@/lib/ai/runtime.server";
import { withJobRunHttp, recordErrorEvent } from "@/lib/observability";

const db = supabaseAdmin as unknown as SupabaseClient;
const TERMINAL_RUN_STATUSES = ["complete", "completed", "completed_with_failures", "failed"];
const MAX_BATCHES_PER_TICK = 10;
const BATCH_STALE_HOURS = 24; // Mark batches as 'failed' if still pending after 24h

async function synthesize(
  userId: string,
  workspaceId: string,
  title: string,
  sections: { draft: string | null; eval: string | null; risks: string | null },
): Promise<string | null> {
  try {
    const res = await callModel(db, userId, {
      surface: "agent",
      workspaceId,
      model: "claude-sonnet-4-5-20250929",
      messages: [
        {
          role: "system",
          content:
            "One sentence, plain language, no preamble: the single most useful thing a busy reader should take from these three notes before deciding.",
        },
        {
          role: "user",
          content: `On "${title}":\nDraft: ${sections.draft ?? "(none)"}\nEval: ${sections.eval ?? "(none)"}\nRisks: ${sections.risks ?? "(none)"}`,
        },
      ],
    });
    return res.status === "ok" && res.output ? res.output.trim().slice(0, 500) : null;
  } catch {
    return null;
  }
}

export const Route = createFileRoute("/api/public/hooks/fanout-reconcile-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await requireHookCaller(request);
        if (unauth) return unauth;

        // Wrapped 2026-08-02. This was the ONLY scheduled hook in the product not
        // inside withJobRun, so it wrote no job_runs row, which made it the one
        // job the cron watchdog could not see. It runs every two minutes: had it
        // died, nothing anywhere would ever have said so, and the health page
        // would have gone on reporting that every scheduled job was running.
        // Found by the feature-liveness audit, which is the point of that audit.
        return withJobRunHttp("fanout.reconcile-tick", async () => {
          const now = new Date();
          const staleCutoff = new Date(
            now.getTime() - BATCH_STALE_HOURS * 60 * 60 * 1000,
          ).toISOString();

          // FIX #1: Mark stale pending batches as 'failed' to prevent permanent stuck state.
          // Batches that have been pending for >24h are likely wedged (e.g., missing child run).
          const { error: staleError } = await db
            .from("fanout_batches")
            .update({ status: "failed" })
            .eq("status", "pending")
            .lt("created_at", staleCutoff);
          // Recorded, not printed: a console.error in a Worker reaches nobody
          // the founder can read, and a stale-batch sweep that silently stops
          // leaves every wedged batch pending forever. Not thrown, because the
          // reconciliation below is independent of it and still worth running.
          if (staleError) {
            await recordErrorEvent(staleError, {
              surface: "fanout.reconcile-tick",
              failure_kind: "db_error",
              request_path: "/api/public/hooks/fanout-reconcile-tick",
            });
          }

          // FIX #2: Fair per-workspace batch selection to prevent cross-tenant head-of-line starvation.
          // Sample batches across all workspaces using random ordering to avoid always hitting the
          // same stuck batches first. This ensures newer healthy batches from any workspace get
          // a fair chance at reconciliation even if older stuck batches exist elsewhere.
          // Use RPC to fetch batches with random sampling for fair distribution across workspaces.
          const { data: batches, error } = await db.rpc("get_pending_fanout_batches", {
            batch_limit: MAX_BATCHES_PER_TICK,
          });
          // Thrown, not returned as a 500. Returning a Response RESOLVES, and
          // withJobRun scored a resolved callback as status='ok' -- so this tick,
          // wrapped in 2026-08-02 precisely BECAUSE it was invisible, went on
          // being invisible whenever it actually failed.
          if (error) throw new Error(`get_pending_fanout_batches failed: ${error.message}`);

          let reconciled = 0;
          for (const batch of batches ?? []) {
            const childIds = (batch.child_run_ids as string[]) ?? [];
            if (childIds.length === 0) continue;
            const { data: runs } = await db
              .from("agent_runs")
              .select("id,status,output")
              .in("id", childIds);
            const found = runs ?? [];
            // If any child row is missing (not landed yet), skip but do NOT mark as failed.
            // Missing rows may still be in flight; only the stale-detection pass above marks truly stuck batches.
            if (found.length < childIds.length) continue;
            const allTerminal = found.every((r) =>
              TERMINAL_RUN_STATUSES.includes(r.status as string),
            );
            if (!allTerminal) continue;

            // Sections are matched by inbound handoff context.fanout_section, not run
            // order (agent_messages carries context; agent_runs.output is plain text).
            const { data: messages } = await db
              .from("agent_messages")
              .select("consumed_by_run_id,payload")
              .in("consumed_by_run_id", childIds)
              .eq("kind", "handoff");
            const sectionByRunId = new Map<string, string>();
            for (const m of messages ?? []) {
              const section = (m.payload as { context?: { fanout_section?: string } } | null)
                ?.context?.fanout_section;
              if (typeof section === "string" && m.consumed_by_run_id) {
                sectionByRunId.set(m.consumed_by_run_id as string, section);
              }
            }
            const sections: { draft: string | null; eval: string | null; risks: string | null } = {
              draft: null,
              eval: null,
              risks: null,
            };
            for (const r of found) {
              const section = sectionByRunId.get(r.id as string);
              const output = typeof r.output === "string" ? r.output : null;
              if (section === "draft") sections.draft = output;
              else if (section === "eval") sections.eval = output;
              else if (section === "risks") sections.risks = output;
            }

            const synthesis = await synthesize(
              batch.user_id as string,
              batch.workspace_id as string,
              batch.target_title as string,
              sections,
            );

            await db
              .from("fanout_batches")
              .update({
                status: "ready",
                composite: { ...sections, synthesis },
                ready_at: new Date().toISOString(),
              })
              .eq("id", batch.id);
            reconciled++;
          }

          return json({ ok: true, reconciled });
        });
      },
    },
  },
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
