import { createFileRoute } from "@tanstack/react-router";
import { requireHookCaller } from "./-_auth.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { withJobRunHttp, recordErrorEvent } from "@/lib/observability";

/**
 * PC-06: the week_2_return activation-funnel writer.
 *
 * Unlike the other four funnel stages (signup/connected/first_teardown/
 * first_mission), which are event-driven and written the moment a user acts,
 * "did they come back in week 2" is a time-window question with no triggering
 * action. So it lives here as a scheduled batch scan: for every signup that is
 * now 7-16 days old, it asks whether that user has signed in AT LEAST 7 days
 * after signup (i.e. returned after week one) and, if so, records the
 * week_2_return milestone (idempotent via trackFunnelMilestone's existence
 * check). This closes the 5th and final funnel stage.
 *
 * ACTIVATION (the one founder step, identical to every other tick): add a
 * pg_cron entry that POSTs this endpoint with the x-cron-key, e.g. daily --
 *   select cron.schedule('funnel-week2', '0 6 * * *',
 *     $$ select net.http_post('https://<host>/api/public/hooks/funnel-week2',
 *        headers => jsonb_build_object('x-cron-key', '<secret>')) $$);
 * Until that cron exists the endpoint is dormant (never self-fires); the code is
 * complete and verified-compiling, matching how sense/cluster/derive/etc. all
 * ship code first and are founder-activated on their own schedule.
 */

const WEEK = 7 * 24 * 60 * 60 * 1000;
const WINDOW_MIN_DAYS = 7; // signup at least a week old (week 2 has begun)
const WINDOW_MAX_DAYS = 16; // and at most ~16 days old, so we scan a fresh cohort once
const MAX_SIGNUPS = 200;

type SignupRow = { user_id: string; workspace_id: string; completed_at: string };

/** A signup "returned in week 2" iff the user signed in at least a week after
 *  signing up. Pure so the window rule is testable and obvious. Returns false
 *  on any missing/blank timestamp (fail closed: never fabricate a return). */
export function qualifiesForWeek2Return(
  signupAt: string,
  lastSignInAt: string | null | undefined,
): boolean {
  if (!lastSignInAt) return false;
  const signup = new Date(signupAt).getTime();
  const lastSignIn = new Date(lastSignInAt).getTime();
  if (Number.isNaN(signup) || Number.isNaN(lastSignIn)) return false;
  return lastSignIn - signup >= WEEK;
}

export const Route = createFileRoute("/api/public/hooks/funnel-week2")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await requireHookCaller(request);
        if (unauth) return unauth;

        return withJobRunHttp("funnel.week2-return", async () => {
          // Table not in the generated types yet (post-PC-06-migration).
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const db = supabaseAdmin as any;
          const now = Date.now();
          const oldest = new Date(now - WINDOW_MAX_DAYS * 24 * 60 * 60 * 1000).toISOString();
          const newest = new Date(now - WINDOW_MIN_DAYS * 24 * 60 * 60 * 1000).toISOString();

          const { data: signups, error } = await db
            .from("funnel_milestones")
            .select("user_id,workspace_id,completed_at")
            .eq("stage", "signup")
            .gte("completed_at", oldest)
            .lte("completed_at", newest)
            .limit(MAX_SIGNUPS);

          if (error) {
            // Thrown, not returned as a 500. Returning a Response RESOLVES,
            // and withJobRun scored any resolved callback as status='ok', so
            // this line wrote a green ledger row for a tick that could not read
            // its own inputs. withJobRunHttp rebuilds the identical JSON 500
            // outside the wrapper, so pg_cron sees exactly what it saw before.
            throw new Error(`funnel_milestones read failed: ${error.message}`);
          }

          const { trackFunnelMilestone } = await import("@/lib/activation-funnel.server");

          let checked = 0;
          let recorded = 0;
          for (const s of (signups ?? []) as SignupRow[]) {
            if (!s.user_id || !s.workspace_id) continue;
            checked++;
            // last_sign_in_at is only reachable via the auth admin API (the auth
            // schema is not exposed through PostgREST). Fail-safe per user.
            let lastSignInAt: string | null | undefined;
            try {
              const { data } = await supabaseAdmin.auth.admin.getUserById(s.user_id);
              lastSignInAt = data?.user?.last_sign_in_at;
            } catch (e) {
              // Still fail-safe per user (a deleted user must not stop the scan),
              // but no longer silent. This catch also covers a revoked service
              // key and an auth API outage, and under either of those EVERY user
              // in the cohort is skipped: the tick would report checked=200,
              // recorded=0, which reads as "nobody came back in week 2" rather
              // than "this never asked".
              await recordErrorEvent(e, {
                surface: "funnel.week2-return",
                failure_kind: "tool_error",
                request_path: "/api/public/hooks/funnel-week2",
                user_id: s.user_id,
                workspace_id: s.workspace_id,
              });
              continue;
            }
            if (!qualifiesForWeek2Return(s.completed_at, lastSignInAt)) continue;
            const wrote = await trackFunnelMilestone(s.workspace_id, s.user_id, "week_2_return");
            if (wrote) recorded++;
          }

          return json({ ok: true, checked, recorded });
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
