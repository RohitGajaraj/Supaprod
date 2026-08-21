import { createFileRoute } from "@tanstack/react-router";
import { requireHookCaller } from "./-_auth.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { withJobRun } from "@/lib/observability";
import { watchAssumptions } from "@/lib/ai/assumption-watch.server";

export const Route = createFileRoute("/api/public/hooks/assumption-watch-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await requireHookCaller(request);
        if (unauth) return unauth;

        return withJobRun("brain.assumption-watch-tick", async () => {
          const { data: workspaces, error } = await supabaseAdmin
            .from("workspaces")
            .select("id, owner_id")
            .eq("is_sample", false)
            .eq("auto_derive_enabled", true)
            .limit(20);

          if (error) {
            return json({ ok: false, error: error.message }, 500);
          }

          let totalChallenged = 0;
          const results: Array<{
            workspace_id: string;
            scanned?: number;
            challenged?: number;
            error?: string;
          }> = [];

          for (const ws of workspaces ?? []) {
            try {
              if (!ws.owner_id) {
                results.push({ workspace_id: ws.id, error: "no owner" });
                continue;
              }
              const r = await watchAssumptions(supabaseAdmin, ws.owner_id, ws.id);
              totalChallenged += r.challenged;
              results.push({ workspace_id: ws.id, scanned: r.scanned, challenged: r.challenged });
            } catch (e) {
              results.push({
                workspace_id: ws.id,
                error: e instanceof Error ? e.message : String(e),
              });
            }
          }

          return json({
            ok: true,
            processed: workspaces?.length ?? 0,
            challenged: totalChallenged,
          });
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
