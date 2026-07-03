import { createFileRoute } from "@tanstack/react-router";
import { requireHookCaller } from "./-_auth.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { withJobRun } from "@/lib/observability";
import {
  proposePromptOptimization,
  type ProposalOutcome,
} from "@/lib/prompt-optimization.functions";

/**
 * RF-07 - the weekly steward pass for eval-driven prompt optimization.
 *
 * For each user's prompt templates, mines their matching eval suite's graded
 * failures and, when there is a genuine pattern, drafts a revised system
 * prompt as a new 'draft' prompt_versions row (prompt-optimization.functions.ts).
 * A human reviews and publishes it via the existing Prompt Studio UI
 * (Settings > Prompts) - this route makes zero writes beyond the drafts and
 * never touches active_version_id itself.
 *
 * Idempotent: a template that already carries a recent RF-07 draft is
 * skipped (proposePromptOptimization's own check), so a cron double-fire
 * this week is a no-op. Runs weekly (migration schedules it Tuesday 10:00
 * UTC, a day after house-rules-tick's Monday slot).
 */

const MAX_USERS = 5;

export const Route = createFileRoute("/api/public/hooks/prompt-optimize-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await requireHookCaller(request);
        if (unauth) return unauth;

        return withJobRun("ambient.prompt-optimize-tick", async () => {
          const { data: users, error: usersErr } = await supabaseAdmin
            .from("profiles")
            .select("id")
            .order("created_at", { ascending: true })
            .limit(MAX_USERS);
          if (usersErr) return json({ ok: false, error: usersErr.message }, 500);

          const results: Array<{
            user_id: string;
            outcomes?: ProposalOutcome[];
            error?: string;
          }> = [];

          for (const u of (users ?? []) as { id: string }[]) {
            try {
              const { data: templates } = await supabaseAdmin
                .from("prompt_templates")
                .select("id,surface,key,active_version_id")
                .eq("user_id", u.id);

              const outcomes: ProposalOutcome[] = [];
              for (const t of (templates ?? []) as {
                id: string;
                surface: string;
                key: string;
                active_version_id: string | null;
              }[]) {
                const outcome = await proposePromptOptimization(supabaseAdmin as never, u.id, t);
                outcomes.push(outcome);
              }
              results.push({ user_id: u.id, outcomes });
            } catch (e) {
              results.push({ user_id: u.id, error: e instanceof Error ? e.message : String(e) });
            }
          }

          return json({ ok: true, processed: users?.length ?? 0, results });
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
