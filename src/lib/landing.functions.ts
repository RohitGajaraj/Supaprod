/**
 * Landing page server functions (docs/planning/landing-page-v2-plan.md sections 3-7).
 *
 * getLandingStats: the receipts beat's live counters, pulled from the DB at
 * render time. Claims law: if a number cannot be pulled live it does not render,
 * so this returns null on ANY failure and the page degrades to the artifact row.
 *
 * joinWaitlist: the beta waitlist with the teardown hook (optional bet field)
 * and the referral queue bump. Honeypot + a global rate brake instead of captcha.
 *
 * trackLandingEvent: funnel capture. Writes a first-party row (verifiable on
 * launch day even with no vendor key) and forwards through the observability
 * facade, never a raw vendor SDK (the AFD rule).
 */
import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { track, type TrackEvent } from "@/lib/observability";

// waitlist_signups / landing_events postdate the generated types; same relaxed
// pattern as proof-surface.functions.ts.
const db = supabaseAdmin as unknown as SupabaseClient;

export type LandingStats = {
  missionsRun: number;
  decisionsRecorded: number;
  outcomesGraded: number;
  aiCallsGoverned: number;
  /** Signups in line; the close beat's social nudge (hidden under a floor). */
  waitlistCount: number;
  pulledAt: string;
};

export const getLandingStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<LandingStats | null> => {
    try {
      // Receipts law: the public counters exclude seeded sample/demo workspaces,
      // so a visitor's demo signup can never inflate them. Undercounting is
      // acceptable; inflating never is. Rows with a null workspace_id drop out
      // of a not-in filter, which errs in the same safe direction.
      const sampleWs = await db
        .from("workspaces")
        .select("id")
        .or('is_sample.eq.true,name.in.("Sample workspace","Demo workspace")');
      if (sampleWs.error) return null;
      const excluded = (sampleWs.data ?? []).map((w: { id: string }) => w.id);
      // Loose builder typing on purpose: supabase-js generics recurse too deep
      // here (TS2589), and this file already runs on a relaxed client cast.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const scoped = (q: any) =>
        excluded.length ? q.not("workspace_id", "in", `(${excluded.join(",")})`) : q;

      const [missions, decisions, learnings, aiEvents, waitlist] = await Promise.all([
        scoped(db.from("missions").select("id", { count: "exact", head: true })),
        scoped(db.from("decisions").select("id", { count: "exact", head: true })),
        scoped(
          db
            .from("learnings")
            .select("id", { count: "exact", head: true })
            .not("verdict", "is", null),
        ),
        scoped(db.from("ai_events").select("id", { count: "exact", head: true })),
        db.from("waitlist_signups").select("id", { count: "exact", head: true }),
      ]);
      if (missions.error || decisions.error || learnings.error || aiEvents.error) return null;
      if (
        missions.count == null ||
        decisions.count == null ||
        learnings.count == null ||
        aiEvents.count == null
      ) {
        return null;
      }
      return {
        missionsRun: missions.count,
        decisionsRecorded: decisions.count,
        outcomesGraded: learnings.count,
        aiCallsGoverned: aiEvents.count,
        waitlistCount: waitlist.error ? 0 : (waitlist.count ?? 0),
        pulledAt: new Date().toISOString(),
      };
    } catch {
      return null;
    }
  },
);

const LANDING_EVENTS = ["landing_visit", "waitlist_join", "referral_share", "demo_click"] as const;
export type LandingEventName = (typeof LANDING_EVENTS)[number];

type LandingEventInput = {
  event: LandingEventName;
  sessionKey?: string;
  props?: Record<string, string | number | boolean>;
};

/** Shared capture: first-party row + facade forward. Never throws. */
async function recordLandingEvent(
  event: LandingEventName,
  sessionKey: string | undefined,
  props: Record<string, string | number | boolean> | undefined,
): Promise<void> {
  try {
    await db.from("landing_events").insert({
      event,
      props: props ?? {},
      session_key: sessionKey ?? null,
    });
  } catch {
    // Analytics must never break the page.
  }
  try {
    await track(event as TrackEvent, sessionKey || "landing-anon", props);
  } catch {
    // Same rule.
  }
}

export const trackLandingEvent = createServerFn({ method: "POST" })
  .inputValidator((i: unknown): LandingEventInput => {
    const o = (i ?? {}) as Record<string, unknown>;
    const event = LANDING_EVENTS.find((e) => e === o.event);
    if (!event) throw new Error("Unknown landing event");
    const rawProps = (o.props ?? {}) as Record<string, unknown>;
    const props: Record<string, string | number | boolean> = {};
    for (const [k, v] of Object.entries(rawProps).slice(0, 8)) {
      if (typeof v === "string") props[k] = v.slice(0, 200);
      else if (typeof v === "number" || typeof v === "boolean") props[k] = v;
    }
    return {
      event,
      sessionKey: typeof o.sessionKey === "string" ? o.sessionKey.slice(0, 64) : undefined,
      props,
    };
  })
  .handler(async ({ data }): Promise<{ ok: true }> => {
    await recordLandingEvent(data.event, data.sessionKey, data.props);
    return { ok: true };
  });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const REFERRAL_RE = /^[a-z0-9]{4,16}$/i;

/** Each signup that arrives through your link moves you up one hour in queue order. */
const REFERRAL_BUMP_MS = 3_600_000;

type JoinWaitlistInput = {
  email: string;
  betText?: string;
  referredBy?: string;
  /** Honeypot. Humans never see this field; bots fill it. */
  website?: string;
};

export type JoinWaitlistResult =
  | {
      ok: true;
      position: number;
      total: number;
      referralCode: string;
      alreadyJoined: boolean;
    }
  | { ok: false; error: string };

function generateReferralCode(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => (b % 36).toString(36)).join("");
}

export const joinWaitlist = createServerFn({ method: "POST" })
  .inputValidator((i: unknown): JoinWaitlistInput => {
    const o = (i ?? {}) as Record<string, unknown>;
    return {
      email: String(o.email ?? "")
        .trim()
        .toLowerCase()
        .slice(0, 320),
      betText:
        typeof o.betText === "string" && o.betText.trim()
          ? o.betText.trim().slice(0, 2000)
          : undefined,
      referredBy:
        typeof o.referredBy === "string" && o.referredBy.trim()
          ? o.referredBy.trim().slice(0, 32)
          : undefined,
      website: typeof o.website === "string" && o.website ? o.website : undefined,
    };
  })
  .handler(async ({ data }): Promise<JoinWaitlistResult> => {
    // Honeypot tripped: report success, store nothing, tell the bot nothing.
    if (data.website) {
      return { ok: true, position: 0, total: 0, referralCode: "", alreadyJoined: false };
    }
    if (!EMAIL_RE.test(data.email)) {
      return { ok: false, error: "That email does not look right." };
    }

    try {
      // Global rate brake (no captcha, no IP storage): more than 20 signups in
      // the last minute means a flood, not a launch spike worth losing data over.
      const minuteAgo = new Date(Date.now() - 60_000).toISOString();
      const recent = await db
        .from("waitlist_signups")
        .select("id", { count: "exact", head: true })
        .gte("created_at", minuteAgo);
      if (!recent.error && (recent.count ?? 0) > 20) {
        return { ok: false, error: "The queue is busy right now. Try again in a minute." };
      }

      const existing = await db
        .from("waitlist_signups")
        .select("referral_code")
        .eq("email", data.email)
        .maybeSingle();

      let referralCode = existing.data?.referral_code as string | undefined;
      let alreadyJoined = Boolean(referralCode);

      if (!alreadyJoined) {
        referralCode = generateReferralCode();
        const referredBy =
          data.referredBy && REFERRAL_RE.test(data.referredBy) && data.referredBy !== referralCode
            ? data.referredBy
            : null;
        const inserted = await db.from("waitlist_signups").insert({
          email: data.email,
          bet_text: data.betText ?? null,
          referral_code: referralCode,
          referred_by: referredBy,
          source: "landing",
        });
        if (inserted.error) {
          // Unique race: someone (or a double-click) beat us to this email.
          if (inserted.error.code === "23505") {
            const again = await db
              .from("waitlist_signups")
              .select("referral_code")
              .eq("email", data.email)
              .maybeSingle();
            referralCode = (again.data?.referral_code as string | undefined) ?? "";
            alreadyJoined = true;
          } else {
            return { ok: false, error: "Could not save that just now. Try again in a minute." };
          }
        } else if (referredBy) {
          await db.rpc("bump_waitlist_referral", { _code: referredBy });
        }
      }

      // Queue position: signup order, with each referral worth an hour's bump.
      const all = await db
        .from("waitlist_signups")
        .select("email,created_at,referral_count")
        .limit(10_000);
      if (all.error || !referralCode) {
        return { ok: false, error: "Could not read the queue just now. Try again in a minute." };
      }
      const rows = (all.data ?? []) as {
        email: string;
        created_at: string;
        referral_count: number | null;
      }[];
      const scoreOf = (r: { created_at: string; referral_count: number | null }) =>
        +new Date(r.created_at) - (r.referral_count ?? 0) * REFERRAL_BUMP_MS;
      const mine = rows.find((r) => r.email === data.email);
      const myScore = mine ? scoreOf(mine) : Number.MAX_SAFE_INTEGER;
      const position = rows.filter((r) => scoreOf(r) < myScore).length + 1;

      if (!alreadyJoined) {
        await recordLandingEvent("waitlist_join", undefined, {
          hasBet: Boolean(data.betText),
          referred: Boolean(data.referredBy),
        });
      }

      return { ok: true, position, total: rows.length, referralCode, alreadyJoined };
    } catch {
      return { ok: false, error: "Could not save that just now. Try again in a minute." };
    }
  });
