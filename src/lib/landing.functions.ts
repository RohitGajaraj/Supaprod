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
 *
 * claimLandingSession: the seam that makes the funnel a funnel. Every event
 * above carries the browser's anonymous session key (src/lib/landing-session.ts);
 * this records, once, that a named account came out of one of those sessions.
 */
import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { LANDING_SESSION_KEY_RE } from "@/lib/landing-session";
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

/**
 * A session key is accepted only in the exact shape the client mints, which is
 * 32 hex characters and nothing else. These endpoints are public and
 * unauthenticated, so any other string arriving here is either a bug or an
 * attempt to write something that is not an anonymous key into a column that
 * has to stay anonymous. Anything that does not match is dropped and the event
 * still records with a null key. The request is never rejected over this:
 * telemetry does not get to fail a user action.
 */
function readSessionKey(v: unknown): string | undefined {
  return typeof v === "string" && LANDING_SESSION_KEY_RE.test(v) ? v : undefined;
}

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
    return { event, sessionKey: readSessionKey(o.sessionKey), props };
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
  /**
   * The browser's anonymous landing session, so the waitlist_join event lands
   * on the same key as the visit that led to it. It is used for the event row
   * only and is never written next to the email: waitlist_signups holds an
   * address, which makes it an identified table, and putting the anonymous key
   * in there would tie the whole anonymous trail to a person through a route
   * nobody asked for. The claim at signup is the one place that link is made,
   * and it is made deliberately.
   */
  sessionKey?: string;
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
      sessionKey: readSessionKey(o.sessionKey),
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
        // The key travels with the conversion event too. This is the beat the
        // whole page is built to produce, so it is the last one that should
        // have been landing with a null session_key.
        await recordLandingEvent("waitlist_join", data.sessionKey, {
          hasBet: Boolean(data.betText),
          referred: Boolean(data.referredBy),
        });
      }

      return { ok: true, position, total: rows.length, referralCode, alreadyJoined };
    } catch {
      return { ok: false, error: "Could not save that just now. Try again in a minute." };
    }
  });

/**
 * Claim an anonymous landing session for the account it became.
 *
 * THE SEAM THIS CLOSES. landing_events rows are anonymous by design and stay
 * that way. This writes one row somewhere else saying "session X became account
 * Y", which is what lets a launch-day query walk from a signup back to the
 * visit, the demo click and the waitlist join that produced it. One fact,
 * recorded once, at the one moment it becomes true.
 *
 * WHY A SEPARATE TABLE AND NOT A COLUMN ON landing_events. A column would mean
 * updating every row the session already wrote, and then updating again for any
 * row it writes after signup, which turns an append-only telemetry table into
 * one that gets rewritten. It would also mean the same fact stored once per
 * event instead of once. And it is the wrong shape: the account is not a
 * property of a click, it is a property of the session.
 *
 * WHY NOT AN EVENT PROPERTY. props is a jsonb blob with no index and no
 * constraint. The claim would sit inside one arbitrary row, and reading it back
 * would mean digging it out of json on that row and then joining to the rest by
 * session_key anyway. That is the join table, built by accident and without the
 * uniqueness guarantee.
 *
 * WHY THIS SHAPE IS ALSO THE PRIVACY ANSWER. The link between a person and
 * their anonymous trail lives in exactly one row in one table. Deleting that
 * row makes the trail anonymous again, permanently and completely, with no
 * rewrite of the event history and nothing left behind. An erasure request is
 * one delete. That is not achievable with a column or a json property.
 *
 * SECURITY. The account id comes from the verified session on the server and is
 * never accepted from the caller, so this cannot be used to claim somebody
 * else's session or to attach a session to an account that is not yours. The
 * session key is checked against the exact minted shape, so nothing else can be
 * smuggled into the column.
 *
 * NEEDS A MIGRATION. landing_session_claims does not exist yet. Until it is
 * applied this insert fails and is swallowed, exactly like every other write in
 * this file: the account is created, the signup event still fires, and the only
 * thing lost is the join. See LANDING-NEEDS-MIGRATION.md at the repo root.
 */
export const claimLandingSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown): { sessionKey: string } => {
    const o = (i ?? {}) as Record<string, unknown>;
    const sessionKey = readSessionKey(o.sessionKey);
    if (!sessionKey) throw new Error("Not a landing session key");
    return { sessionKey };
  })
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const userId = context.userId;
    try {
      // Idempotent: a second signup attempt in the same tab, or a retry, must
      // not fail and must not produce a second claim. The session belongs to
      // the first account that came out of it; a later one is a different
      // person on a shared browser and claiming it for them would be wrong.
      await db
        .from("landing_session_claims")
        .insert({ session_key: data.sessionKey, user_id: userId });
    } catch {
      // A claim that cannot be written is a missing join, never a failed signup.
    }
    return { ok: true };
  });
