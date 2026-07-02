import { createFileRoute } from "@tanstack/react-router";
import { requireHookCaller } from "./-_auth.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { withJobRun } from "@/lib/observability";
import { sendDueDigests } from "@/lib/notifications.functions";

export const Route = createFileRoute("/api/public/hooks/digest-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await requireHookCaller(request);
        if (unauth) return unauth;

        return withJobRun("notifications.digest-tick", async () => {
          const { scanned, sent } = await sendDueDigests(supabaseAdmin);
          return new Response(JSON.stringify({ ok: true, scanned, sent }), {
            headers: { "Content-Type": "application/json" },
          });
        });
      },
    },
  },
});
