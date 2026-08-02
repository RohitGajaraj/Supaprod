/**
 * AFD-05: Error capture façade (Sentry EU when keyed, no-op otherwise).
 * SW-6 (mission 3.12): plus the always-on in-house floor. `recordErrorEvent`
 * writes every capture to the `error_events` table (service-role, vendor-free,
 * works with zero keys and the gate off) so the founder can always see server
 * failures; the Sentry envelope send stays key-gated on top.
 *
 * Uses Sentry's "envelope" HTTP API directly so we don't pull a heavyweight SDK
 * into the Cloudflare Worker bundle (TanStack Start ships to Workers). Vendor
 * swap = replace this file.
 */
import { observabilityGateOn, readObservabilityConfig } from "./config";

export type ErrorContext = {
  user_id?: string;
  workspace_id?: string;
  surface?: string;
  failure_kind?: string;
  request_path?: string;
  request_method?: string;
  extras?: Record<string, unknown>;
  tags?: Record<string, string>;
};

const MESSAGE_CAP = 2_000;
const STACK_CAP = 8_000;
const PATH_CAP = 500;

// Per-isolate storm guard: an error loop (or a stranger hammering a broken
// route) must not turn the floor into a write amplifier. Coarse on purpose;
// each Worker isolate gets its own window.
const STORM_WINDOW_MS = 60_000;
const STORM_MAX_WRITES = 40;
let stormWindowStart = 0;
let stormWrites = 0;

function underStormLimit(now: number): boolean {
  if (now - stormWindowStart > STORM_WINDOW_MS) {
    stormWindowStart = now;
    stormWrites = 0;
  }
  stormWrites += 1;
  return stormWrites <= STORM_MAX_WRITES;
}

/** Test-only reset for the per-isolate storm window. */
export function resetErrorStormGuardForTests(): void {
  stormWindowStart = 0;
  stormWrites = 0;
}

// The generated Database types lag new tables until the next regeneration,
// so the insert goes through a narrow structural cast (the stage_events /
// SeedClient precedent) and call sites stay clean.
interface ErrorEventsClient {
  from(table: string): {
    insert(values: Record<string, unknown>): PromiseLike<{ error: { message: string } | null }>;
  };
}

/**
 * SW-6 floor: persist an error to the in-house `error_events` store.
 * Always on (no env key, no gate), never throws, storm-guarded per isolate.
 * `opts.client` is test-injectable (the recordStageEvent precedent); the
 * production path lazy-imports the admin client to stay client-bundle-safe.
 */
export async function recordErrorEvent(
  err: unknown,
  ctx: ErrorContext = {},
  opts: { client?: unknown } = {},
): Promise<boolean> {
  if (!underStormLimit(Date.now())) return false;
  try {
    const client =
      opts.client ?? (await import("@/integrations/supabase/client.server")).supabaseAdmin;
    const errObj = err instanceof Error ? err : new Error(String(err));
    const env = (typeof process !== "undefined" ? process.env : {}) as Record<
      string,
      string | undefined
    >;
    const { error } = await (client as ErrorEventsClient).from("error_events").insert({
      surface: (ctx.surface ?? "unknown").slice(0, 200),
      error_kind: (errObj.name || "Error").slice(0, 200),
      error_message: (errObj.message ?? "").slice(0, MESSAGE_CAP),
      stack: errObj.stack ? errObj.stack.slice(0, STACK_CAP) : null,
      request_path: ctx.request_path ? ctx.request_path.slice(0, PATH_CAP) : null,
      request_method: ctx.request_method ?? null,
      user_id: ctx.user_id ?? null,
      workspace_id: ctx.workspace_id ?? null,
      deployment_id: env.CF_VERSION_METADATA_ID?.trim() || null,
      // AFD-04 fix, 2026-08-02: `failure_kind` was accepted by ErrorContext,
      // forwarded to the Sentry tags, and then dropped on the floor here. The
      // floor is the half that is ALWAYS on and Sentry is the half that has no
      // key, so the taxonomy was reaching only the store that never runs. It
      // rides in `extras` because that column already exists and this needs no
      // migration; `extras->>'failure_kind'` is the query.
      extras:
        ctx.failure_kind || ctx.extras
          ? {
              ...(ctx.extras ?? {}),
              ...(ctx.failure_kind ? { failure_kind: ctx.failure_kind } : {}),
            }
          : null,
    });
    return !error;
  } catch {
    return false;
  }
}

/**
 * Capture an exception. Fire-and-forget. Never throws.
 * Writes the in-house floor first (always), then the vendor envelope (gated).
 */
export async function captureError(err: unknown, ctx: ErrorContext = {}): Promise<boolean> {
  const recorded = await recordErrorEvent(err, ctx);
  const sent = await sendSentryEnvelope(err, ctx);
  return recorded || sent;
}

/** Vendor half: Sentry envelope, key-gated and founder-gated (AFD-05 behavior). */
async function sendSentryEnvelope(err: unknown, ctx: ErrorContext = {}): Promise<boolean> {
  const cfg = readObservabilityConfig();
  if (!cfg.sentry.enabled) return false;
  if (!(await observabilityGateOn())) return false;

  // DSN format: https://<key>@<host>/<project_id>
  const dsnMatch = cfg.sentry.dsn!.match(/^https:\/\/([^@]+)@([^/]+)\/(\d+)$/);
  if (!dsnMatch) return false;
  const [, publicKey, host, projectId] = dsnMatch;

  const eventId = crypto.randomUUID().replace(/-/g, "");
  const now = new Date().toISOString();
  const errObj = err instanceof Error ? err : new Error(String(err));

  const event = {
    event_id: eventId,
    timestamp: now,
    platform: "javascript",
    environment: cfg.sentry.environment,
    release: cfg.sentry.release,
    level: "error",
    user: ctx.user_id ? { id: ctx.user_id } : undefined,
    tags: {
      surface: ctx.surface ?? "unknown",
      failure_kind: ctx.failure_kind ?? "unknown",
      workspace_id: ctx.workspace_id ?? "n/a",
      ...(ctx.tags ?? {}),
    },
    extra: ctx.extras ?? {},
    exception: {
      values: [
        {
          type: errObj.name,
          value: errObj.message,
          stacktrace: errObj.stack ? { frames: parseFrames(errObj.stack) } : undefined,
        },
      ],
    },
  };

  const envelope =
    JSON.stringify({ event_id: eventId, sent_at: now, dsn: cfg.sentry.dsn }) +
    "\n" +
    JSON.stringify({ type: "event" }) +
    "\n" +
    JSON.stringify(event);

  try {
    await fetch(`https://${host}/api/${projectId}/envelope/`, {
      method: "POST",
      headers: {
        "content-type": "application/x-sentry-envelope",
        "x-sentry-auth": `Sentry sentry_version=7, sentry_key=${publicKey}, sentry_client=supaprod-observability-facade/1.0`,
      },
      body: envelope,
    });
    return true;
  } catch {
    return false;
  }
}

function parseFrames(stack: string) {
  return stack
    .split("\n")
    .slice(1, 30)
    .map((line) => ({ filename: line.trim() }));
}
