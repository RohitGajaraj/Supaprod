import { createFileRoute } from "@tanstack/react-router";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireHookCaller } from "./-_auth.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { withJobRun } from "@/lib/observability";
import { runStrategyBriefPass } from "@/lib/scout/strategy-brief.server";

/**
 * JNY-01: the strategy head, weekly competitor + tech-shift briefs.
 *
 * Upgrades scout-tick from "raw diff signals in the feed" to a structured,
 * weekly-summarized registry. The per-workspace pass lives in
 * src/lib/scout/strategy-brief.server.ts (SW-4 moved it there so loop mode
 * can run the same pass as a user-owned governed loop); this route is the
 * all-opted-in-workspaces sweep.
 *
 * Runs weekly (migration schedules it Monday 08:00 UTC). No FIRECRAWL gate:
 * this reads signals scout-tick already collected, it makes zero new web
 * calls. Idempotent: externalId is keyed by ISO week, so a re-run this week
 * is a no-op at the sink.
 */

const MAX_WORKSPACES = 5;

export const Route = createFileRoute("/api/public/hooks/competitor-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await requireHookCaller(request);
        if (unauth) return unauth;

        return withJobRun("ambient.competitor-tick", async () => {
          const { data: workspaces, error: wsErr } = await supabaseAdmin
            .from("workspaces")
            .select("id, owner_id")
            .eq("auto_scout_enabled", true)
            .limit(MAX_WORKSPACES);
          if (wsErr) return json({ ok: false, error: wsErr.message }, 500);

          const db = supabaseAdmin as unknown as SupabaseClient;
          const results: Array<{
            workspace_id: string;
            competitor?: { raw: number; briefWritten: boolean };
            tech_shift?: { raw: number; briefWritten: boolean };
            error?: string;
          }> = [];

          for (const ws of (workspaces ?? []) as Array<{ id: string; owner_id: string }>) {
            try {
              const pass = await runStrategyBriefPass(db, ws.owner_id, ws.id);
              results.push({ workspace_id: ws.id, ...pass });
            } catch (e) {
              results.push({
                workspace_id: ws.id,
                error: e instanceof Error ? e.message : String(e),
              });
            }
          }

          return json({ ok: true, processed: workspaces?.length ?? 0, results });
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
