import { createFileRoute } from "@tanstack/react-router";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireHookCaller } from "./-_auth.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { resolveGitHub } from "@/lib/connectors/providers/github.server";
import { withJobRun } from "@/lib/observability";
import { generateOutcomeSuggestion } from "@/lib/outcome-suggestion.server";

/**
 * Outcome tick (F-V5-LOOP-CLOSE Phase D) — hourly pg_cron sweep that finds
 * approved PRDs with a linked GitHub issue and no shipped_at, checks the
 * issue state on GitHub, and stamps status='shipped' + shipped_at when the
 * issue has closed. Service-level (no user session) — uses supabaseAdmin,
 * same as the other /api/public/hooks/* ticks. prds.shipped_at is not yet in
 * the generated Database types, hence the untyped-client cast.
 *
 * F-CONN Phase 1: GitHub auth resolves per workspace via resolveGitHub
 * (workspace binding → env fallback; admin path, no user session). Workspaces
 * with no resolvable GitHub connection are skipped silently — this tick never
 * throws for config absence.
 *
 * RF-01: a second pass, same tick — for PRDs already shipped with no
 * recorded outcome yet, draft/refresh a confidence-tiered outcome suggestion
 * (generateOutcomeSuggestion chains the Historian draft with SEN-05 usage
 * deltas + the BYO-P3 changeset join). Best-effort per PRD; one failure never
 * blocks the rest of the sweep.
 */
export const Route = createFileRoute("/api/public/hooks/outcome-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await requireHookCaller(request);
        if (unauth) return unauth;
        return withJobRun("cron.outcome-tick", async () => {
          try {
            const admin = supabaseAdmin as unknown as SupabaseClient;
            const { data: prds } = await admin
              .from("prds")
              .select("id,github_issue_url,workspace_id")
              .eq("status", "approved")
              .not("github_issue_url", "is", null)
              .is("shipped_at", null)
              .limit(20);

            // Group due PRDs by workspace so each group resolves its own binding.
            type DuePrd = { id: string; github_issue_url: string; workspace_id: string | null };
            const groups = new Map<string | null, DuePrd[]>();
            for (const prd of (prds ?? []) as DuePrd[]) {
              const key = prd.workspace_id ?? null;
              const list = groups.get(key);
              if (list) list.push(prd);
              else groups.set(key, [prd]);
            }

            let checked = 0;
            let shipped = 0;
            for (const [workspaceId, group] of groups) {
              let gh: Awaited<ReturnType<typeof resolveGitHub>>;
              try {
                gh = await resolveGitHub({ workspaceId, userId: null });
              } catch {
                // No binding and no env fallback for this workspace — skip silently.
                continue;
              }
              for (const prd of group) {
                const match = String(prd.github_issue_url).match(/\/issues\/(\d+)/);
                if (!match) continue;
                checked++;
                const res = await fetch(
                  `https://api.github.com/repos/${gh.repo}/issues/${match[1]}`,
                  {
                    headers: {
                      Authorization: `Bearer ${gh.token}`,
                      Accept: "application/vnd.github+json",
                      "X-GitHub-Api-Version": "2022-11-28",
                      "User-Agent": "cadence-agent",
                    },
                  },
                );
                if (!res.ok) continue;
                const issue = (await res.json()) as { state?: string; closed_at?: string | null };
                if (issue.state !== "closed") continue;
                const { error: upErr } = await admin
                  .from("prds")
                  .update({
                    status: "shipped",
                    shipped_at: issue.closed_at ?? new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", prd.id)
                  .is("shipped_at", null);
                if (!upErr) shipped++;
              }
            }

            // RF-01 second pass: shipped PRDs with no recorded outcome yet get a
            // provisional suggestion drafted/refreshed. Capped batch so the tick
            // stays fast; oldest-shipped-first so a backlog drains in order
            // instead of an unordered LIMIT starving the same tail every run.
            let suggested = 0;
            const { data: pending } = await admin
              .from("prds")
              .select("id,workspace_id,outcome,outcome_suggestion,shipped_at")
              .eq("status", "shipped")
              .is("outcome", null)
              .order("shipped_at", { ascending: true, nullsFirst: true })
              .limit(15);
            type PendingPrd = {
              id: string;
              workspace_id: string | null;
              outcome: unknown;
              outcome_suggestion: { confidence_tier?: string; generated_at?: string } | null;
            };
            const pendingRows = (pending ?? []) as PendingPrd[];
            if (pendingRows.length) {
              const workspaceIds = [
                ...new Set(pendingRows.map((p) => p.workspace_id).filter((v): v is string => !!v)),
              ];
              const { data: workspaces } = await admin
                .from("workspaces")
                .select("id, owner_id")
                .in("id", workspaceIds);
              const ownerByWorkspace = new Map(
                ((workspaces ?? []) as Array<{ id: string; owner_id: string }>).map((w) => [
                  w.id,
                  w.owner_id,
                ]),
              );
              for (const prd of pendingRows) {
                const ownerId = prd.workspace_id ? ownerByWorkspace.get(prd.workspace_id) : undefined;
                if (!ownerId) continue;
                try {
                  const suggestion = await generateOutcomeSuggestion(admin, ownerId, prd.id);
                  if (suggestion) suggested++;
                } catch (e) {
                  console.error(`outcome-tick: suggestion generation failed for ${prd.id}:`, e);
                }
              }
            }

            return new Response(JSON.stringify({ ok: true, checked, shipped, suggested }), {
              headers: { "Content-Type": "application/json" },
            });
          } catch (e) {
            return new Response(
              JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }),
              { status: 500, headers: { "Content-Type": "application/json" } },
            );
          }
        });
      },
    },
  },
});
