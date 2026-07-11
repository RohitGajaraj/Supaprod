import { createFileRoute } from "@tanstack/react-router";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireHookCaller } from "./-_auth.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { withJobRun } from "@/lib/observability";
import { computeSelfImprovementForWorkspace } from "@/lib/self-improve.functions";

/**
 * RPT-50 (deterministic slice): recompute each workspace's self-improvement
 * proposals and materialize them into self_improve_proposals. Pure deterministic
 * recompute (eval pass rates, agent correction rates, playbook win rates). NO AI
 * calls, so this is not gated on AI spend. Upserts on the deterministic key
 * (workspace_id, kind, subject_ref): a re-run refreshes an existing proposal
 * rather than duplicating it, and a human's status (acknowledged/dismissed) is
 * preserved because the upsert payload omits `status`.
 */
export const Route = createFileRoute("/api/public/hooks/self-improve-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await requireHookCaller(request);
        if (unauth) return unauth;

        return withJobRun("self-improve.tick", async () => {
          // self_improve_proposals postdates the generated Database types, so the
          // admin client is used untyped for it (same cast the other ticks use).
          const admin = supabaseAdmin as unknown as SupabaseClient;
          const { data: workspaces, error } = await admin
            .from("workspaces")
            .select("id, owner_id")
            .limit(50);

          if (error) {
            return json({ ok: false, error: error.message }, 500);
          }

          let totalProposals = 0;
          const results: Array<{ workspace_id: string; proposals?: number; error?: string }> = [];

          for (const ws of workspaces ?? []) {
            try {
              if (!ws.owner_id) {
                results.push({ workspace_id: ws.id, error: "no owner" });
                continue;
              }
              const { proposals } = await computeSelfImprovementForWorkspace(admin, {
                userId: ws.owner_id,
                workspaceId: ws.id,
              });
              if (proposals.length > 0) {
                const rows = proposals.map((p) => ({
                  workspace_id: ws.id,
                  user_id: ws.owner_id,
                  kind: p.kind,
                  severity: p.severity,
                  title: p.title,
                  detail: p.detail,
                  evidence: p.evidence,
                  subject_ref: p.subject_ref,
                }));
                const { error: upErr } = await admin
                  .from("self_improve_proposals")
                  .upsert(rows, { onConflict: "workspace_id,kind,subject_ref" });
                if (upErr) {
                  results.push({ workspace_id: ws.id, error: upErr.message });
                  continue;
                }
              }
              totalProposals += proposals.length;
              results.push({ workspace_id: ws.id, proposals: proposals.length });
            } catch (e) {
              results.push({
                workspace_id: ws.id,
                error: e instanceof Error ? e.message : String(e),
              });
            }
          }

          return json({ ok: true, processed: workspaces?.length ?? 0, proposals: totalProposals });
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
