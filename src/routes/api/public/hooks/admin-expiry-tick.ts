import { createFileRoute } from "@tanstack/react-router";
import { requireHookCaller } from "./-_auth.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { withJobRunHttp } from "@/lib/observability";

/**
 * Nightly admin-expiry tick. Clears expired plan overrides on subscriptions
 * and marks expired invitations. Calls a single SECURITY DEFINER RPC so the
 * work is atomic and audit-coherent.
 */
export const Route = createFileRoute("/api/public/hooks/admin-expiry-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await requireHookCaller(request);
        if (unauth) return unauth;
        return withJobRunHttp("cron.admin-expiry-tick", async () => {
          // The try/catch that used to sit here turned `throw error` two lines
          // down into `return json(..., 500)`, and a returned Response resolves,
          // so withJobRun recorded status='ok'. The RPC could fail nightly -- plan
          // overrides never cleared, invitations never expired -- with a green
          // ledger row every time. The throw now travels all the way out;
          // withJobRunHttp rebuilds the same JSON 500 for the caller.
          const { data, error } = await supabaseAdmin.rpc("cron_tick_admin_expiries");
          if (error) throw new Error(`cron_tick_admin_expiries failed: ${error.message}`);
          return new Response(JSON.stringify({ ok: true, result: data }), {
            headers: { "Content-Type": "application/json" },
          });
        });
      },
    },
  },
});
