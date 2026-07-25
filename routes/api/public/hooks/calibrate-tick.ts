import { createFileRoute } from "@tanstack/react-router";
import { requireHookCaller } from "./-_auth.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { withJobRun } from "@/lib/observability";
import { calibrateExpiredInsights } from "@/lib/brain/calibrate-insights.server";

export const Route = createFileRoute("/api/public/hooks/calibrate-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await requireHookCaller(request);
        if (unauth) return unauth;

        return withJobRun("brain.calibrate-tick", async () => {
          const { data: workspaces, error } = await supabaseAdmin
            .from("workspaces")
            .select("id, owner_id")
            .eq("auto_derive_enabled", true)
            .limit(20);

          if (error) {
            return json({ ok: false, error: error.message }, 500);
          }

          let totalScored = 0;
          const results: Array<{ workspace_id: string; scored?: number; error?: string }> = [];

          for (const ws of workspaces ?? []) {
            try {
              if (!ws.owner_id) {
                results.push({ workspace_id: ws.id, error: "no owner" });
                continue;
              }
              const r = await calibrateExpiredInsights(supabaseAdmin, ws.owner_id, ws.id);
              totalScored += r.scored;
              results.push({ workspace_id: ws.id, scored: r.scored });
            } catch (e) {
              results.push({
                workspace_id: ws.id,
                error: e instanceof Error ? e.message : String(e),
              });
            }
          }

          return json({ ok: true, processed: workspaces?.length ?? 0, scored: totalScored });
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
