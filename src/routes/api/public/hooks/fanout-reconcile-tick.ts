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

const db = supabaseAdmin as unknown as SupabaseClient;
const TERMINAL_RUN_STATUSES = ["complete", "completed", "completed_with_failures", "failed"];
const MAX_BATCHES_PER_TICK = 10;

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

        const { data: batches, error } = await db
          .from("fanout_batches")
          .select("id,user_id,workspace_id,target_title,child_run_ids")
          .eq("status", "pending")
          .order("created_at", { ascending: true })
          .limit(MAX_BATCHES_PER_TICK);
        if (error) return json({ ok: false, error: error.message }, 500);

        let reconciled = 0;
        for (const batch of batches ?? []) {
          const childIds = (batch.child_run_ids as string[]) ?? [];
          if (childIds.length === 0) continue;
          const { data: runs } = await db
            .from("agent_runs")
            .select("id,status,output")
            .in("id", childIds);
          const found = runs ?? [];
          if (found.length < childIds.length) continue; // a child row hasn't landed yet
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
            const section = (m.payload as { context?: { fanout_section?: string } } | null)?.context
              ?.fanout_section;
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
