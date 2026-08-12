import { createFileRoute } from "@tanstack/react-router";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireHookCaller } from "./-_auth.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { withJobRun } from "@/lib/observability";
import {
  computeSelfImprovementForWorkspace,
  enrichProposalCore,
  applyFixCore,
} from "@/lib/self-improve.functions";
import {
  isAutoPassDue,
  mayAutoApply,
  computeStaleness,
  type SelfImproveMode,
} from "@/lib/self-improve-governance";

/**
 * RPT-50: recompute each workspace's self-improvement proposals, materialize them,
 * and -- per the workspace's chosen MODE -- run the bounded AI pass.
 *
 * The deterministic recompute + materialize is unconditional (no AI, no spend). On
 * top of it:
 *   - off       -> nothing more (manual). Only checked for staleness (health).
 *   - scheduled -> when an auto pass is DUE (>= the interval since the last one),
 *                  ENRICH the top open flags so they are ready for a human Apply.
 *                  No unattended apply.
 *   - auto      -> same enrich, plus AUTO-APPLY the grounded fixes (each still
 *                  injection-screened, reversible, and receipted by applyFixCore).
 *
 * Spend is bounded three ways: the per-workspace interval gate (a workspace gets an
 * AI pass at most once per interval), a per-tick cap on how many workspaces get an
 * AI pass (spreads load across runs), and a per-pass cap on flags (top N by the
 * recompute's built-in severity ordering). The enrich cache means a re-pass over an
 * already-explained flag costs nothing. The run's summary (ai_passes / auto_applied
 * / stale) is our own health check: it shows the engine is alive and flags
 * workspaces going stale.
 */

/** At most this many workspaces get an AI pass per tick run (load spreading). */
const MAX_AI_WORKSPACES_PER_TICK = 5;
/** Per workspace per pass, enrich/auto-apply at most this many (top by severity). */
const MAX_FLAGS_PER_PASS = 3;

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
          const now = Date.now();
          const { data: workspaces, error } = await admin
            .from("workspaces")
            .select("id, owner_id")
            .limit(50);

          if (error) {
            return json({ ok: false, error: error.message }, 500);
          }

          // Preload every workspace's governance row once (mode + the two clocks).
          const settingsByWs = new Map<
            string,
            { mode?: string; last_auto_run_at?: string | null; last_human_touch_at?: string | null }
          >();
          const { data: settingsRows } = await admin
            .from("self_improve_settings")
            .select("workspace_id,mode,last_auto_run_at,last_human_touch_at");
          for (const r of (settingsRows ?? []) as Array<{
            workspace_id: string;
            mode?: string;
            last_auto_run_at?: string | null;
            last_human_touch_at?: string | null;
          }>) {
            settingsByWs.set(r.workspace_id, r);
          }

          let totalProposals = 0;
          let aiPassesUsed = 0;
          let autoApplied = 0;
          let staleCount = 0;
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

              // --- Mode-driven AI pass (RPT-50 increment 2) ---
              const setting = settingsByWs.get(ws.id);
              const mode = ((setting?.mode as SelfImproveMode) ?? "scheduled") as SelfImproveMode;

              // Health: an engine left off with open flags going unaddressed is stale.
              if (
                computeStaleness({
                  mode,
                  lastHumanTouchAt: setting?.last_human_touch_at ?? null,
                  openFlagCount: proposals.length,
                  now,
                }).stale
              ) {
                staleCount++;
              }

              if (
                aiPassesUsed < MAX_AI_WORKSPACES_PER_TICK &&
                isAutoPassDue(mode, setting?.last_auto_run_at ?? null, now)
              ) {
                aiPassesUsed++;
                // Top flags with a real subject to act on, in the recompute's
                // built-in severity order.
                const flags = proposals.filter((p) => p.subject_ref).slice(0, MAX_FLAGS_PER_PASS);
                for (const f of flags) {
                  try {
                    const enr = await enrichProposalCore(
                      admin,
                      { workspaceId: ws.id, kind: f.kind, subjectRef: f.subject_ref as string },
                      ws.owner_id,
                    );
                    if (
                      mayAutoApply({ mode, grounded_on: enr.grounded_on, alreadyApplied: false })
                    ) {
                      const applied = await applyFixCore(
                        admin,
                        { workspaceId: ws.id, kind: f.kind, subjectRef: f.subject_ref as string },
                        ws.owner_id,
                        // Nobody is here. `ws.owner_id` is read off the workspaces
                        // row above: it names the owner, not an actor who did
                        // anything, so the decisions row must not read as theirs.
                        { unattended: true },
                      );
                      if (applied.applied && !applied.cached) autoApplied++;
                    }
                  } catch {
                    // One flag's AI pass failing must not abort the workspace or tick.
                  }
                }
                // Stamp the auto-run clock (preserve mode; seed the default on first insert).
                await admin
                  .from("self_improve_settings")
                  .upsert(
                    { workspace_id: ws.id, last_auto_run_at: new Date().toISOString() },
                    { onConflict: "workspace_id" },
                  );
              }

              results.push({ workspace_id: ws.id, proposals: proposals.length });
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
            proposals: totalProposals,
            ai_passes: aiPassesUsed,
            auto_applied: autoApplied,
            stale: staleCount,
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
