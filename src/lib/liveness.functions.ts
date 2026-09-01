/**
 * Feature liveness: the read the admin surface calls.
 *
 * Admin only, gated the same way the Observability surface gates: user_roles is
 * RLS-scoped to auth.uid(), so a hit means this caller is an admin. The probes
 * then run on the service-role client, because a liveness report scoped to one
 * person's rows would answer a different and much less useful question.
 *
 * ── IT READS WHAT THE TICK WROTE, RATHER THAN RECOMPUTING ───────────────
 * `buildLivenessReport` costs about two queries per tracked capability, and this
 * ran the whole thing on every page load inside one Cloudflare Worker
 * invocation. A Worker caps outbound subrequests, `report.test.ts` holds the
 * report at 45 for that reason, and it sits exactly on that number.
 *
 * That was never a latency problem. **It was a hard cap on how many capabilities
 * the product may watch** -- 13, against 36 scheduled jobs -- because the page
 * and the tick each had to fit the whole registry into one invocation. Coverage
 * stalled at 2 of 36 for that reason.
 *
 * So `cron.liveness-tick` now checks the least-recently-checked few per run and
 * writes `liveness_results`, and this reads those rows in ONE query. The page
 * cannot trip the cap again whatever the registry grows to.
 *
 * ── A NON-DEFAULT WINDOW STILL COMPUTES, AND THAT IS DELIBERATE ─────────
 * `windowDays` is a caller parameter from 1 to 90. Stored rows record the window
 * they were measured in, so they can only answer the window the tick used. Any
 * other window is a live computation, exactly as before, including its exposure
 * to the cap. The default is the page's own request and is free; a deliberate
 * 30-day question is rare, asked by an admin who is already looking, and worth
 * the queries.
 *
 * ── A CAPABILITY THE ROTATION HAS NOT REACHED IS PROBED LIVE ────────────
 * This file first said such an entry should simply read `unknown`, on the
 * grounds that computing it would "hand the cap straight back". **That was
 * wrong, and the founder caught it on 2026-08-20.** It conflated recomputing the
 * WHOLE report with filling in the entries that are missing. One missing
 * capability costs TWO queries, not 45.
 *
 * So the missing ones are probed live and shown, because a page that says "I do
 * not know" about something it could answer in two queries is a worse page, and
 * because the point of this surface is to tell you what is happening now.
 *
 * The budget exists for the pathological case rather than the ordinary one: a
 * fresh table where EVERY entry is missing, at a registry of any size, would
 * otherwise blow the cap and render nothing. `planLiveFill` spends up to
 * `LIVE_FILL_BUDGET` subrequests on the missing entries, costed per entry
 * (`2 + 2N` for an integrity check with N segments), and anything past that
 * honestly reads `unknown` until the rotation reaches it.
 *
 * **Nothing is silently dropped.** A deferred entry says it was not checked; it
 * does not say it is fine.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  buildLivenessReport,
  summariseReport,
  DEFAULT_WINDOW_DAYS,
  type LivenessReport,
} from "@/lib/liveness/report";
import type { LivenessClient } from "@/lib/liveness/probe";
import {
  TRACKED_CAPABILITIES,
  TRACKED_INTEGRITY_CHECKS,
  TRACKED_VOCABULARY_CHECKS,
} from "@/lib/liveness/registry";
import { reportFromStoredRows, type StoredResultRow } from "@/lib/liveness/stored";
import { planLiveFill } from "@/lib/liveness/rotation";

export type LivenessResponse = LivenessReport & { headline: string };

/**
 * `liveness_results` is not in the generated Database types. Narrow structural
 * interface instead, the precedent this file already names below and the one the
 * `error_events` writer uses.
 */
type LivenessResultsClient = {
  from: (table: "liveness_results") => {
    select: (cols: string) => PromiseLike<{ data: StoredResultRow[] | null }>;
  };
};

export const getLivenessReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { windowDays?: number } | undefined) => d ?? {})
  .handler(async ({ context, data }): Promise<LivenessResponse | { error: string }> => {
    const { data: adminRole } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("role", "admin")
      .maybeSingle();
    if (!adminRole) return { error: "Forbidden" };

    const windowDays = Math.min(Math.max(data.windowDays ?? DEFAULT_WINDOW_DAYS, 1), 90);

    // The generated Database types cannot express a table named by a string from
    // the registry, so the client crosses into the probe layer through its
    // narrow structural interface. Same precedent as the error_events writer.
    const client = supabaseAdmin as unknown as LivenessClient;

    /*
     * ONE PATH, AND IT IS ALWAYS BOUNDED.
     *
     * This used to branch: the default window read stored rows, and any other
     * window recomputed the WHOLE registry. That second branch was unbounded --
     * it is the exact thing the budget test guards, and it would have started
     * rendering nothing the moment the registry grew past the cap.
     *
     * So both cases are the same case. Read whatever the tick has stored for this
     * window, probe what is missing within a costed budget, and report the
     * overflow honestly as unchecked. For the default window almost everything is
     * stored and the fill is a handful of queries; for a 30-day window nothing is
     * stored and the fill is the budget, which is bounded by construction.
     */
    const store = supabaseAdmin as unknown as LivenessResultsClient;
    const { data: rows } = await store
      .from("liveness_results")
      .select("capability_id,kind,window_days,verdict,reason,detail,checked_at");

    const stored = (rows ?? []).filter((r) => r.window_days === windowDays);
    const have = new Set(stored.map((r) => r.capability_id));

    const { fill } = planLiveFill([
      ...TRACKED_CAPABILITIES.filter((c) => !have.has(c.id)).map((entry) => ({
        entry: entry as { id: string },
        kind: "capability" as const,
      })),
      ...TRACKED_INTEGRITY_CHECKS.filter((c) => !have.has(c.id)).map((entry) => ({
        entry: entry as { id: string },
        kind: "integrity" as const,
        segments: entry.probe.segments?.length ?? 0,
      })),
      ...TRACKED_VOCABULARY_CHECKS.filter((c) => !have.has(c.id)).map((entry) => ({
        entry: entry as { id: string },
        kind: "vocabulary" as const,
      })),
    ]);
    const fillIds = new Set(fill.map((f) => f.id));

    let live: StoredResultRow[] = [];
    if (fillIds.size > 0) {
      const fresh = await buildLivenessReport(client, {
        windowDays,
        capabilities: TRACKED_CAPABILITIES.filter((c) => fillIds.has(c.id)),
        integrityChecks: TRACKED_INTEGRITY_CHECKS.filter((c) => fillIds.has(c.id)),
        vocabularyChecks: TRACKED_VOCABULARY_CHECKS.filter((c) => fillIds.has(c.id)),
      });
      /*
       * Shaped as stored rows so there is ONE path that turns a verdict into the
       * report. A second mapping here is a second place for the two to disagree,
       * and this layer's whole subject is surfaces disagreeing.
       *
       * `checked_at` is now, truthfully: this one WAS just measured, and the page
       * can say so beside rows measured hours ago.
       */
      const now = new Date().toISOString();
      live = [
        ...fresh.capabilities.map((c) => ({
          capability_id: c.id,
          kind: "capability",
          window_days: windowDays,
          verdict: c.verdict,
          reason: c.reason,
          checked_at: now,
          detail: {
            countInWindow: c.countInWindow,
            lastAt: c.lastAt,
            neverExecuted: c.neverExecuted,
          },
        })),
        ...fresh.integrity.map((c) => ({
          capability_id: c.id,
          kind: "integrity",
          window_days: windowDays,
          verdict: c.verdict,
          reason: c.reason,
          checked_at: now,
          detail: {
            totalRows: c.totalRows,
            offendingRows: c.offendingRows,
            deadSegments: c.deadSegments,
          },
        })),
        ...fresh.vocabulary.map((c) => ({
          capability_id: c.id,
          kind: "vocabulary",
          window_days: windowDays,
          verdict: c.verdict,
          reason: c.reason,
          checked_at: now,
          detail: {
            totalRows: c.totalRows,
            undeclaredRows: c.undeclaredRows,
            unusedValues: c.unusedValues,
          },
        })),
      ];
    }

    const report = reportFromStoredRows([...stored, ...live], {
      windowDays,
      capabilities: TRACKED_CAPABILITIES,
      integrityChecks: TRACKED_INTEGRITY_CHECKS,
      vocabularyChecks: TRACKED_VOCABULARY_CHECKS,
    });
    return { ...report, headline: summariseReport(report) };
  });
