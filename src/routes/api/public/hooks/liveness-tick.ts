import { createFileRoute } from "@tanstack/react-router";
import { requireHookCaller } from "./-_auth.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { withJobRun, captureError } from "@/lib/observability";
import { buildLivenessReport, summariseReport } from "@/lib/liveness/report";
import type { LivenessClient } from "@/lib/liveness/probe";
import {
  TRACKED_CAPABILITIES,
  TRACKED_INTEGRITY_CHECKS,
  TRACKED_VOCABULARY_CHECKS,
} from "@/lib/liveness/registry";
import { selectDueEntries, ROTATION_BATCH, type RotationEntry } from "@/lib/liveness/rotation";

/**
 * `liveness_results` is not in the generated Database types, so the client
 * crosses into it through a narrow structural interface instead. Same precedent
 * as the `error_events` writer and as `liveness.functions.ts`, which says so in
 * its own words: the generated types cannot express every table this layer
 * touches, and widening them is a regeneration rather than a cast.
 */
type LivenessResultsClient = {
  from: (table: "liveness_results") => {
    select: (cols: string) => PromiseLike<{
      data: Array<{ capability_id: string; checked_at: string | null }> | null;
    }>;
    upsert: (
      rows: unknown[],
      opts: { onConflict: string },
    ) => PromiseLike<{ error: { message: string } | null }>;
  };
};

/**
 * Feature liveness, evaluated on a schedule instead of when someone remembers
 * to open a page.
 *
 * WHY THIS EXISTS AND NOT JUST THE ADMIN SURFACE. The five features found dead
 * on 2026-08-02 had been dead for weeks, and the only reason anyone learned
 * about them was that somebody went looking. A report you have to remember to
 * read is a report with the same failure mode as the features it watches. This
 * tick reads it for you.
 *
 * WHERE THE ALARM GOES. Every finding is written to `error_events` through the
 * existing capture façade, which is always on, needs no vendor key, and is
 * already readable by an admin. So a dead capability becomes an error the
 * founder already has a place to see, and it reaches Sentry too once that key is
 * set. **That has not changed and is still the alarm channel.**
 *
 * THIS COMMENT USED TO SAY "no migration for a results table that would itself
 * need watching", and 2026-08-20 added one. The objection was right about
 * alarms and does not reach what the table is for:
 *
 *   * `error_events` is where a FINDING goes. Unchanged.
 *   * `liveness_results` is a SCHEDULE. It exists because the whole report costs
 *     about two queries per capability and a Worker caps outbound subrequests,
 *     so computing all of it every run capped the registry at 13 entries against
 *     36 scheduled jobs. Coverage stalled at 2 of 36 for that reason and not for
 *     want of caring.
 *
 * And it does not need watching in the way that sentence feared: **a row nobody
 * refreshed sorts FIRST in the rotation**, so a table going stale is the input
 * that fixes it rather than a second thing to monitor.
 *
 * IT DOES NOT THROW. A dead feature is not a failed job: throwing would mark
 * this run as an error in `job_runs` and every later reader would have to guess
 * whether the tick broke or the product did. The run succeeds and reports.
 *
 * NOT YET SCHEDULED. This route has no pg_cron registration in this change,
 * because migrations are the founder's to write. Until it is registered the
 * `liveness-tick` entry in the registry will report itself as never executed,
 * in the same words it uses for everything else, which is the correct behaviour
 * for a feature that has shipped and does nothing. See LIVENESS-NEEDS-MIGRATION.md.
 */
export const Route = createFileRoute("/api/public/hooks/liveness-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await requireHookCaller(request);
        if (unauth) return unauth;

        return withJobRun("cron.liveness-tick", async () => {
          const started = Date.now();
          const client = supabaseAdmin as unknown as LivenessClient;

          /*
           * ONE SLICE PER RUN, oldest first. See `rotation.ts` for why this needs
           * no cursor. A read of every row is one query and the table holds one
           * row per registry entry, so this costs the same at 13 entries as at
           * 50.
           */
          const store = supabaseAdmin as unknown as LivenessResultsClient;
          const { data: storedRows } = await store
            .from("liveness_results")
            .select("capability_id,checked_at");

          const registry: RotationEntry[] = [
            ...TRACKED_CAPABILITIES.map((c) => ({ id: c.id, kind: "capability" as const })),
            ...TRACKED_INTEGRITY_CHECKS.map((c) => ({ id: c.id, kind: "integrity" as const })),
            ...TRACKED_VOCABULARY_CHECKS.map((c) => ({ id: c.id, kind: "vocabulary" as const })),
          ];
          const due = selectDueEntries(
            registry,
            storedRows ?? [],
            ROTATION_BATCH,
          );
          const dueIds = new Set(due.map((d) => d.id));

          const report = await buildLivenessReport(client, {
            capabilities: TRACKED_CAPABILITIES.filter((c) => dueIds.has(c.id)),
            integrityChecks: TRACKED_INTEGRITY_CHECKS.filter((c) => dueIds.has(c.id)),
            vocabularyChecks: TRACKED_VOCABULARY_CHECKS.filter((c) => dueIds.has(c.id)),
          });
          const headline = summariseReport(report);

          /*
           * Written BEFORE the alarms, so a capture that throws cannot cost the
           * run its place in the rotation and make the same slice due forever.
           */
          const checkedAt = new Date().toISOString();
          const rows = [
            ...report.capabilities.map((c) => ({
              capability_id: c.id,
              kind: "capability",
              verdict: c.verdict,
              reason: c.reason,
              detail: { title: c.title, proof: c.proof, cadence: c.cadence, lastAt: c.lastAt,
                        countInWindow: c.countInWindow, neverExecuted: c.neverExecuted },
            })),
            ...report.integrity.map((c) => ({
              capability_id: c.id,
              kind: "integrity",
              verdict: c.verdict,
              reason: c.reason,
              detail: { title: c.title, readBy: c.readBy, totalRows: c.totalRows,
                        offendingRows: c.offendingRows, deadSegments: c.deadSegments },
            })),
            ...report.vocabulary.map((c) => ({
              capability_id: c.id,
              kind: "vocabulary",
              verdict: c.verdict,
              reason: c.reason,
              detail: { title: c.title, declaredBy: c.declaredBy, totalRows: c.totalRows,
                        undeclaredRows: c.undeclaredRows, unusedValues: c.unusedValues },
            })),
          ].map((r) => ({ ...r, window_days: report.windowDays, checked_at: checkedAt }));

          if (rows.length > 0) {
            await store.from("liveness_results").upsert(rows, { onConflict: "capability_id" });
          }

          // One error event per finding, per run. The tick is meant to run daily,
          // so a finding that stays broken produces one row a day: enough to be
          // impossible to miss, few enough to never become noise.
          const findings: Array<{ surface: string; message: string }> = [
            ...report.capabilities
              .filter((c) => c.verdict === "dead")
              .map((c) => ({
                surface: `liveness:${c.id}`,
                message: `${c.title} is doing nothing. ${c.reason} Proof it would leave: ${c.proof}.`,
              })),
            ...report.integrity
              .filter((c) => c.verdict === "broken")
              .map((c) => ({
                surface: `liveness:${c.id}`,
                message: `${c.title}. ${c.reason} Read by ${c.readBy}.`,
              })),
            ...report.vocabulary
              .filter((c) => c.verdict === "drifted")
              .map((c) => ({
                surface: `liveness:${c.id}`,
                message: `${c.title}. ${c.reason} Declared in ${c.declaredBy}.`,
              })),
          ];

          for (const f of findings) {
            const err = new Error(f.message);
            err.name = "FeatureLiveness";
            await captureError(err, { surface: f.surface, failure_kind: "feature_dead" });
          }

          return new Response(
            JSON.stringify({
              ok: true,
              headline,
              windowDays: report.windowDays,
              counts: report.counts,
              findings: findings.map((f) => f.surface),
              ms: Date.now() - started,
            }),
            { headers: { "Content-Type": "application/json" } },
          );
        });
      },
    },
  },
});
