/**
 * The one place a product moment gets a name.
 *
 * ─── THE READING (GTM audit, 2026-08-05) ────────────────────────────────────
 *
 * There are two tables, and there were three vocabularies describing the same
 * five moments.
 *
 *   1. `activation_events` (migration 20260710210000, PC-04) — an append-only
 *      STREAM. `user_id` / `workspace_id` are NULLABLE, `session_id` is the only
 *      key a pre-signup visitor has, `event_name` is free TEXT with no CHECK,
 *      and there is no UNIQUE anywhere. Zero RLS policies on purpose: service
 *      role writes only, so an open spam vector never exists.
 *
 *   2. `funnel_milestones` (migration 20260710160000, PC-06) — a deduplicated
 *      LEDGER. `workspace_id` / `user_id` are NOT NULL, `stage` is CHECK-limited
 *      to five values, and UNIQUE(workspace_id, user_id, stage) is what makes
 *      cohort conversion arithmetic honest. Its `signup` row is written by the
 *      `trigger_funnel_signup` DB trigger the instant a workspace is inserted.
 *
 * TWO TABLES IS A REAL DESIGN, NOT AN ACCIDENT, and neither can hold the
 * other's rows. A demo visitor has no user_id, so funnel_milestones physically
 * rejects them (NOT NULL). A conversion percentage needs at most one row per
 * person per stage, which activation_events cannot promise (no UNIQUE). The
 * split is IDENTITY, and the boundary is signup. Both survive, and this file
 * is where the relationship stops being folklore.
 *
 * WHAT WAS ACTUALLY BROKEN WAS THE NAMING, NOT THE TABLES. The same moment
 * carried up to three names, one per vocabulary:
 *
 *   moment              this file              funnel_milestones   observability/analytics.ts
 *   ------------------  ---------------------  ------------------  --------------------------
 *   account created     signup_completed       signup              signup_completed
 *   data arrived        source_connected /     connected           connection_connected
 *                       notes_pasted
 *   first teardown      first_teardown_viewed  first_teardown      (none)
 *   first mission       first_mission_dispatch first_mission       mission_started
 *
 * ...plus a fourth spelling inside onboarding (`data_connected`,
 * `critic_completed`) which onboarding.functions.ts translated privately. Five
 * of this file's seven names had zero call sites, which read as "five moments
 * are unmeasured". Two of those five were in fact already being recorded, under
 * their funnel name, by server code: `signup` by the DB trigger above, and
 * `first_mission` by createMission (src/lib/ai/handoff.server.ts). The audit's
 * count was right and its conclusion was half wrong: the defect was duplicate
 * names, not five silent moments.
 *
 * ─── THE RULE ───────────────────────────────────────────────────────────────
 *
 * A moment is recorded ONCE, in the one sink that can hold its identity, under
 * the canonical name of that sink. Every alias any vocabulary ever used resolves
 * here, in ACTIVATION_MOMENTS + FUNNEL_STAGE_BY_MOMENT. If a moment resolves to
 * a funnel stage it belongs in the ledger and nowhere else; if it does not, the
 * stream is its home. Nothing is written to both.
 *
 * `week_2_return` deliberately has no moment name: nobody performs it. It is
 * computed by a batch scan (src/routes/api/public/hooks/funnel-week2.ts) and
 * inventing a name for an action the product cannot detect would be a lie in
 * the vocabulary.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { readObservabilityConfig } from "@/lib/observability/config";
import type { FunnelStage } from "@/lib/activation-funnel.types";

/**
 * The public, unauthenticated write boundary's vocabulary. Unchanged since
 * PC-04/PC-06: nothing is removed, because a name that has already been posted
 * by a deployed client must keep resolving.
 */
export const ACTIVATION_EVENTS = [
  "demo_viewed",
  "demo_to_signup",
  "signup_completed",
  "source_connected",
  "notes_pasted",
  "first_teardown_viewed",
  "first_mission_dispatched",
] as const;

export type ActivationEventName = (typeof ACTIVATION_EVENTS)[number];

/** Onboarding's own spelling of the same funnel, plus its two extra steps. */
export const ONBOARDING_MILESTONES = [
  "signup",
  "product_named",
  "data_connected",
  "critic_completed",
  "onboarding_completed",
] as const;

export type OnboardingMilestoneName = (typeof ONBOARDING_MILESTONES)[number];

/**
 * Every name from every vocabulary, in one list. Written out literally rather
 * than spread from the two above so the const-assertion stays a true tuple; the
 * colocated test asserts both source lists are fully contained here, which is
 * what stops a fifth vocabulary appearing quietly.
 */
export const ACTIVATION_MOMENTS = [
  "demo_viewed",
  "demo_to_signup",
  "signup_completed",
  "source_connected",
  "notes_pasted",
  "first_teardown_viewed",
  "first_mission_dispatched",
  "signup",
  "product_named",
  "data_connected",
  "critic_completed",
  "onboarding_completed",
] as const;

export type ActivationMoment = (typeof ACTIVATION_MOMENTS)[number];

/**
 * The reconciliation itself. A moment with a stage IS that stage; the alias is
 * only how a given caller happens to say it. A moment with no stage has no
 * funnel row to own, because funnel_milestones' CHECK admits five values and
 * widening it would need a migration this file has no business writing.
 */
export const FUNNEL_STAGE_BY_MOMENT: Readonly<Partial<Record<ActivationMoment, FunnelStage>>> = {
  signup_completed: "signup",
  signup: "signup",
  source_connected: "connected",
  notes_pasted: "connected",
  data_connected: "connected",
  first_teardown_viewed: "first_teardown",
  critic_completed: "first_teardown",
  first_mission_dispatched: "first_mission",
};

/** Moments a visitor produces before an account exists. Never deduplicated. */
export const ANONYMOUS_MOMENTS = ["demo_viewed", "demo_to_signup"] as const;

export type MomentSink = "funnel_milestones" | "activation_events";

/** Which table is the record of this moment. */
export function sinkForMoment(moment: ActivationMoment): MomentSink {
  return FUNNEL_STAGE_BY_MOMENT[moment] ? "funnel_milestones" : "activation_events";
}

/** The name the moment is stored under, after aliases are resolved. */
export function canonicalNameForMoment(moment: ActivationMoment): string {
  return FUNNEL_STAGE_BY_MOMENT[moment] ?? moment;
}

export function isAnonymousMoment(moment: ActivationMoment): boolean {
  return (ANONYMOUS_MOMENTS as readonly string[]).includes(moment);
}

// ─── Narrow structural client ────────────────────────────────────────────────
// The generated Supabase types lag both tables, and the tests must be able to
// hand in a fake. Same precedent as recordStageEvent / recordErrorEvent.

type MomentRows = { data: unknown[] | null; error: { message: string } | null };

interface MomentQuery extends PromiseLike<MomentRows> {
  eq(column: string, value: unknown): MomentQuery;
  limit(n: number): MomentQuery;
}

interface MomentTable {
  select(columns: string): MomentQuery;
  insert(values: Record<string, unknown>): PromiseLike<{ error: { message: string } | null }>;
  upsert(
    values: Record<string, unknown>,
    options: { onConflict: string; ignoreDuplicates: boolean },
  ): {
    select(columns: string): PromiseLike<{
      data: unknown[] | null;
      error: { message: string } | null;
    }>;
  };
}

export interface MomentClient {
  from(table: string): MomentTable;
}

const db = supabaseAdmin as unknown as MomentClient;

// ─── The absence of vendor analytics, said out loud, once ────────────────────

const VENDOR_SINK_ABSENT_MESSAGE =
  "Vendor analytics is off: POSTHOG_API_KEY is unset, so observability track() answers false for every event and no vendor funnel exists. Activation moments are still recorded first-party, in activation_events and funnel_milestones.";

type ReportFn = (err: unknown, ctx: Record<string, unknown>) => Promise<boolean>;

let vendorSinkReported = false;

/** Test-only reset for the once-per-isolate latch. */
export function __resetVendorSinkReportForTests(): void {
  vendorSinkReported = false;
}

/**
 * track() returning false with no key is a swallowed failure on the one path
 * nobody checks, and it swallows it once per call, which is the worst rate: too
 * cheap to notice and too frequent to log. So it is said ONCE per isolate, at
 * the first moment recorded after boot, and it is said into `error_events` —
 * the always-on, keyless, gate-free store the admin observability surface
 * already reads — not only into a console nobody tails on launch day.
 *
 * A Cloudflare Worker has no process-start hook, so "once per isolate at first
 * use" is the closest honest thing to "once at startup", and it is stated here
 * rather than implied.
 */
export async function reportAnalyticsSinkOnce(
  opts: {
    report?: ReportFn;
    readConfig?: () => { posthog: { enabled: boolean } };
  } = {},
): Promise<{ ran: boolean; vendorConfigured: boolean }> {
  const readConfig = opts.readConfig ?? readObservabilityConfig;
  let vendorConfigured = false;
  try {
    vendorConfigured = readConfig().posthog.enabled;
  } catch {
    vendorConfigured = false;
  }

  if (vendorSinkReported) return { ran: false, vendorConfigured };
  vendorSinkReported = true;

  if (vendorConfigured) {
    console.info(
      "[activation] vendor analytics is configured; activation_events and funnel_milestones remain the first-party record.",
    );
    return { ran: true, vendorConfigured: true };
  }

  console.error(`[activation] ${VENDOR_SINK_ABSENT_MESSAGE}`);
  try {
    const report = opts.report ?? (await import("@/lib/observability/errors")).recordErrorEvent;
    await report(new Error(VENDOR_SINK_ABSENT_MESSAGE), {
      surface: "activation.vendor-sink",
      failure_kind: "analytics_vendor_unconfigured",
    });
  } catch {
    // The report of a missing sink must never be the thing that breaks a write.
  }
  return { ran: true, vendorConfigured: false };
}

// ─── The single write path ───────────────────────────────────────────────────

export type ActivationMomentInput = {
  moment: ActivationMoment;
  /** Always from a verified session on the server. Never from request input. */
  userId: string;
  workspaceId?: string | null;
  sessionId?: string | null;
  metadata?: Record<string, unknown>;
};

export type ActivationMomentResult = {
  sink: MomentSink;
  /** The canonical name the row carries, after alias resolution. */
  name: string;
  /** True only when THIS call created the row. */
  recorded: boolean;
  reason?: "already_recorded" | "write_failed" | "no_workspace";
};

async function alreadyInStream(
  client: MomentClient,
  userId: string,
  eventName: string,
): Promise<boolean> {
  const { data } = await client
    .from("activation_events")
    .select("id")
    .eq("user_id", userId)
    .eq("event_name", eventName)
    .limit(1);
  return Array.isArray(data) && data.length > 0;
}

/**
 * Record one moment, server-side, from a caller that already knows who the
 * person is. This is the path instruction 3 exists for: a moment fired here
 * survives a browser that navigated away mid-request, which a client-side
 * fire-and-forget does not.
 *
 * Never throws. A telemetry write may not be the reason a seed or an
 * onboarding step fails.
 */
export async function recordActivationMoment(
  input: ActivationMomentInput,
  opts: { client?: MomentClient; report?: ReportFn } = {},
): Promise<ActivationMomentResult> {
  const client = opts.client ?? db;
  const stage = FUNNEL_STAGE_BY_MOMENT[input.moment];
  const name = canonicalNameForMoment(input.moment);

  await reportAnalyticsSinkOnce({ report: opts.report });

  if (stage) {
    if (!input.workspaceId) {
      // Refused, not silently dropped: funnel_milestones.workspace_id is NOT
      // NULL, so there is no row to write, and a caller that reached a funnel
      // moment without a workspace is a bug worth seeing.
      console.error(
        `[activation] ${name} could not be recorded: the funnel ledger needs a workspace and none was resolved.`,
      );
      return { sink: "funnel_milestones", name, recorded: false, reason: "no_workspace" };
    }
    try {
      // UNIQUE(workspace_id, user_id, stage) does the deduplication in the
      // database, so a second "first mission" is a no-op at the storage layer
      // and not a race between two callers. ignoreDuplicates + select() also
      // answers WHICH happened: rows back means this call wrote it, no rows
      // means it was already there. completed_at is left to the column default
      // so a late backfill can never invent an earlier timestamp.
      const { data, error } = await client
        .from("funnel_milestones")
        .upsert(
          {
            workspace_id: input.workspaceId,
            user_id: input.userId,
            stage,
            metadata: input.metadata ?? {},
          },
          { onConflict: "workspace_id,user_id,stage", ignoreDuplicates: true },
        )
        .select("id");
      if (error) {
        console.error(`[activation] ${name} ledger write failed: ${error.message}`);
        return { sink: "funnel_milestones", name, recorded: false, reason: "write_failed" };
      }
      const wrote = Array.isArray(data) && data.length > 0;
      return {
        sink: "funnel_milestones",
        name,
        recorded: wrote,
        reason: wrote ? undefined : "already_recorded",
      };
    } catch (err) {
      console.error(`[activation] ${name} ledger write threw`, err);
      return { sink: "funnel_milestones", name, recorded: false, reason: "write_failed" };
    }
  }

  // No funnel stage: the stream is the record. These are identified moments
  // (product_named, onboarding_completed) that the funnel CHECK cannot hold.
  // Before this registry they were accepted by recordOnboardingMilestone and
  // then dropped on the floor, which is why nobody could see where onboarding
  // stopped.
  try {
    if (await alreadyInStream(client, input.userId, name)) {
      return { sink: "activation_events", name, recorded: false, reason: "already_recorded" };
    }
    const { error } = await client.from("activation_events").insert({
      event_name: name,
      user_id: input.userId,
      workspace_id: input.workspaceId ?? null,
      session_id: input.sessionId ?? null,
      props: input.metadata ?? {},
    });
    if (error) {
      console.error(`[activation] ${name} stream write failed: ${error.message}`);
      return { sink: "activation_events", name, recorded: false, reason: "write_failed" };
    }
    return { sink: "activation_events", name, recorded: true };
  } catch (err) {
    console.error(`[activation] ${name} stream write threw`, err);
    return { sink: "activation_events", name, recorded: false, reason: "write_failed" };
  }
}

// ─── The public, unauthenticated boundary ────────────────────────────────────

/**
 * The demo page's write path. It has no session by definition, which is the
 * whole point of activation_events.
 *
 * IT NEVER WRITES funnel_milestones, and that is deliberate. This endpoint
 * takes userId / workspaceId from the request body, so a funnel row written
 * from here would be a cohort number anybody on the internet could forge, and
 * conversion percentages are the one thing on this table that must not be
 * forgeable. Identified moments go through recordActivationMoment, called by
 * server code holding a verified session.
 *
 * If an identified name does arrive here anyway, the row is still kept, in the
 * stream, annotated with the funnel stage it corresponds to, so it is
 * joinable later and is never confused with the ledger.
 */
export const trackActivation = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        event: z.enum(ACTIVATION_EVENTS),
        sessionId: z.string().max(200).optional(),
        userId: z.string().uuid().optional(),
        workspaceId: z.string().uuid().optional(),
        props: z.record(z.string(), z.unknown()).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<{ ok: true }> => {
    // Best-effort: a failed analytics write must never break the page it
    // instruments (a demo visitor should never see an error from this).
    try {
      await reportAnalyticsSinkOnce();
      const stage = FUNNEL_STAGE_BY_MOMENT[data.event];
      await db.from("activation_events").insert({
        event_name: data.event,
        session_id: data.sessionId ?? null,
        user_id: data.userId ?? null,
        workspace_id: data.workspaceId ?? null,
        props: stage
          ? { ...(data.props ?? {}), canonical_stage: stage, reported_by: "client" }
          : (data.props ?? {}),
      });
    } catch (err) {
      console.error("[trackActivation] write failed", err);
    }
    return { ok: true };
  });
