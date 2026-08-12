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
 *
 * getLandingFunnel: the read side of all of the above, admin-gated. Everything
 * here was write-only until it existed, which meant the one table built to make
 * launch day verifiable could only be verified by someone with a psql prompt.
 */
import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { LANDING_SESSION_KEY_RE } from "@/lib/landing-session";
import { sendWaitlistWelcome } from "@/lib/waitlist-email.server";
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

/**
 * ⚠️ NOT ON ANY RENDER PATH, as of 2026-08-11, and it must not be put back on
 * one without deciding first what renders. `/` now loads `getWaitlistCount`
 * instead. Four of the five fields below have had no consumer since the
 * counters beat was deleted on 2026-08-09.
 *
 * It is kept rather than deleted because the predicate is the valuable part and
 * it was expensive to get right: identity read from `production_workspace_ids()`
 * rather than asserted from a name, an id shape, or an `is_sample` flag that a
 * sign-in never sets. That is the lesson three separate wrong censuses taught,
 * and deleting the function would delete the only place it is written down as
 * running code. Anything that wires these counters to a surface should start
 * here, not from a fresh query.
 */
export const getLandingStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<LandingStats | null> => {
    try {
      /**
       * THE PUBLIC COUNTERS COUNT ONLY WHAT IS PROVABLY REAL, AND THIS USED TO
       * BE THE OTHER WAY AROUND.
       *
       * The law has always been right and is worth restating: undercounting is
       * acceptable, inflating never is. The predicate was wrong.
       *
       * It built a BLOCKLIST — every workspace with `is_sample` set, plus two
       * names — and excluded those. A blocklist fails OPEN: anything it has not
       * heard of counts. Measured on production 2026-08-11, two things it had
       * not heard of were counting.
       *
       *   * SIX OF THE SEVEN "Helio Labs" fixture workspaces carry
       *     `is_sample = false`. Only `10000000-…` has the flag set, so the
       *     other six passed a filter written specifically to catch them, and
       *     33 graded fixture outcomes counted as real.
       *   * AN ORPHANED `workspace_id` CANNOT BE IN A LIST BUILT BY QUERYING
       *     `workspaces`. Sixteen more graded outcomes point at a workspace id
       *     with NO ROW in that table at all, fifteen of them dated before this
       *     repo's first commit. They passed too.
       *
       * Together that was every single "outcome graded" this function would
       * report — 49 of 49 — plus roughly 110 missions and 126 decisions. The
       * old comment claimed a null `workspace_id` "errs in the same safe
       * direction", and for a null it does; the case it missed is an id that is
       * PRESENT and matches nothing, which is not a null and does not drop out.
       *
       * THE DEFECT IS LATENT, NOT LIVE, AND THE COMMIT THAT FIXED IT SAID
       * OTHERWISE. Its message claims these numbers were on the public homepage.
       * They were not: the counters beat was deleted on 2026-08-09 and only the
       * prop survived, so `Receipts` takes `_props` and ignores it, and no field
       * this function returns except `waitlistCount` reaches a rendered surface.
       * Nothing false was ever shown to a visitor. Corrected here rather than
       * left, because a reader who believes the message concludes a live public
       * claim was repaired and stops looking for the one that still could be.
       *
       * It is worth having fixed anyway, and that is the whole argument for
       * doing it now rather than when the fields are next used: the exposure is
       * that the day someone wires `outcomesGraded` to a surface, they ship a
       * seed count, and the field name makes it look safe. A predicate that
       * fails closed is only cheap to write before there is a surface depending
       * on the number it produces.
       *
       * So the shape is inverted. Read the workspaces that are provably NOT
       * samples and count only those, with `.in`. An unknown, orphaned or
       * newly-seeded workspace is now excluded by default rather than admitted
       * by default, which is the only direction a public counter may fail. An
       * empty allowlist returns no counters at all rather than counting
       * everything, for the same reason.
       *
       * This is the same root cause as the `artifact_lineage` census fixed in
       * `20260811090000`: identity asserted by a name or an id shape instead of
       * read from a column. `is_sample` is the column here, and the migration
       * beside this change sets it on the six fixtures where it was simply
       * false.
       */
      /**
       * THE ALLOWLIST COMES FROM THE DATABASE, because `is_sample` alone was
       * still wrong. It records what a SEED did, and the case it misses is what
       * a SIGN-IN does: `current_user_default_workspace()` mints "My Workspace"
       * for any account on first use, so a demo or investor account looking
       * around produces an unflagged workspace that this counted as production.
       * Three exist. Whether a workspace is production depends on WHO OWNS IT,
       * and ownership is not a column on the workspace, so it cannot be another
       * boolean somebody must remember to set. `production_workspace_ids()`
       * (20260811120000) is the one definition, and it fails closed.
       */
      const realWs = await db.rpc("production_workspace_ids");
      if (realWs.error) return null;
      const allowed = ((realWs.data ?? []) as unknown as Array<string | { id: string }>).map((w) =>
        typeof w === "string" ? w : w.id,
      );
      if (!allowed.length) return null;
      // Loose builder typing on purpose: supabase-js generics recurse too deep
      // here (TS2589), and this file already runs on a relaxed client cast.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const scoped = (q: any) => q.in("workspace_id", allowed);

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

/**
 * The ONE count `/` actually renders.
 *
 * WHY THIS EXISTS RATHER THAN THE ROUTE CALLING `getLandingStats`. That
 * function makes SIX round trips: the `production_workspace_ids` RPC, four
 * scoped COUNTs, and this one. Exactly one of the six reaches a pixel.
 * `Receipts` takes `_props` and ignores them, so `missionsRun`,
 * `decisionsRecorded`, `outcomesGraded` and `aiCallsGoverned` are computed and
 * discarded on every render. `/` is server-rendered on the login and signup
 * paths too, so that ran on the three hottest public routes in the product.
 *
 * THE COUPLING WAS THE WORSE HALF, AND IT IS THE REASON THIS IS A SPLIT RATHER
 * THAN A COMMENT. `getLandingStats` returns null if the RPC fails, if the
 * allowlist comes back empty, or if ANY of the four counters errors. Every one
 * of those outcomes also threw away `waitlistCount`, so the social-proof nudge
 * on the close beat would silently vanish for a reason that has nothing to do
 * with the waitlist, and it would look like the queue had emptied rather than
 * like a census had failed. A rendered number should not depend on the health
 * of four numbers nobody renders.
 *
 * Unscoped on purpose: a waitlist signup has no workspace, so the demo and real
 * split the counters need does not apply here and there is nothing to exclude.
 *
 * Null rather than 0 on failure, because `WaitlistForm` hides the nudge on null
 * and the floor already hides small true totals. A failed count must not read
 * as a real "0 in line", which is the one number that beat must never publish.
 */
export const getWaitlistCount = createServerFn({ method: "GET" }).handler(
  async (): Promise<number | null> => {
    try {
      const { count, error } = await db
        .from("waitlist_signups")
        .select("id", { count: "exact", head: true });
      if (error) return null;
      return count ?? 0;
    } catch {
      return null;
    }
  },
);

// `film_play` added 2026-08-12 with the film embed. It carries a `surface`
// prop ("landing" | "demo" | "film") because the film has three mounts and the
// only interesting question about it is which door people press play behind.
const LANDING_EVENTS = [
  "landing_visit",
  "waitlist_join",
  "referral_share",
  "demo_click",
  "film_play",
] as const;
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
      // Global rate brake (no captcha, no IP storage).
      //
      // ⚠️ RAISED FROM 20 TO 300 ON 2026-08-07, and the old comment here read
      // "more than 20 signups in the last minute means a flood, not a launch
      // spike worth losing data over." That is backwards for the one event this
      // brake was about to meet. This counter is GLOBAL, not per-IP, so at 20 a
      // Product Hunt feature turns away the 21st genuine person of any minute
      // and everyone after them, with "the queue is busy". A launch going well
      // is indistinguishable from an attack to this check, and 20/min is a
      // number a good launch clears in its first thirty seconds.
      //
      // The number matters less than the ASYMMETRY it has to respect. Turning
      // away a real signup is unrecoverable: that person does not come back and
      // we never learn we lost them. Accepting a spam row costs one DELETE we
      // can run at leisure. So the brake must be set where only an automated
      // flood reaches it, and never where a good day does.
      //
      // 300/min is 18,000/hour, which no organic launch produces and no human
      // typing reaches. If this ever fires, it is a bot, which is what it is for.
      const minuteAgo = new Date(Date.now() - 60_000).toISOString();
      const recent = await db
        .from("waitlist_signups")
        .select("id", { count: "exact", head: true })
        .gte("created_at", minuteAgo);
      if (!recent.error && (recent.count ?? 0) > 300) {
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

        // A1, the welcome. Until 2026-08-07 this branch sent NOTHING: the row
        // was captured correctly and the person heard silence, which reads as a
        // broken form even when the data is safe. Copy and constraints live in
        // src/lib/waitlist-email.server.ts.
        //
        // Guarded by !alreadyJoined on purpose. A repeat submission of the same
        // address is common (people forget, or hit the button twice) and must
        // not re-send: a duplicate welcome is the cheapest possible way to earn
        // a spam complaint on a domain with no sending history to absorb it.
        //
        // NOT awaited into the response path's success condition, and it cannot
        // throw. If Resend is down the signup still succeeds, because losing a
        // real signup is unrecoverable and a missing welcome is not.
        await sendWaitlistWelcome(data.email);
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

/* ------------------------------------------------------------------ *
 * The read side: getLandingFunnel
 * ------------------------------------------------------------------ */

/**
 * WHY THIS EXISTS. `landing_events` was written by recordLandingEvent above and
 * read by NOTHING. The whole argument for a first-party events table is that
 * launch day stays verifiable with no vendor key, and that argument is void if
 * the only way to see the funnel is to open a psql prompt at the exact hour the
 * founder is doing eight other things. This is that table's reader.
 *
 * ADMIN-GATED, deliberately the same gate as getObservabilityStatus and
 * getMoatMetrics: `requireSupabaseAuth`, then a user_roles lookup on the
 * CALLER'S OWN client. user_roles RLS restricts rows to auth.uid(), so a hit
 * means this user really is an admin and the check cannot be spoofed by input.
 * The reads themselves then run on the service-role client because both tables
 * have RLS on with no policies at all (see the 20260715 migration): authenticated
 * gets nothing directly, by design. This is funnel data over an identified
 * table, so leaving it open would leak signup volume and referrer sources to
 * anyone with an account.
 *
 * AGGREGATION, AND WHERE IT HONESTLY HAPPENS. The per-event totals are exact
 * because they are four `count: exact, head: true` reads that hit
 * `landing_events_event_created_idx` (event, created_at) dead on, and no rows cross
 * the wire for those. Everything else needs GROUP BY over a day expression and a
 * jsonb key, which PostgREST cannot express without an RPC or a view, and this
 * lane is not adding a migration. So the day series, the referrer breakdown and
 * the source breakdown are computed in JS over a CAPPED row pull, and the cap is
 * reported rather than hidden: `eventsTruncated` / `signupsTruncated` tell the
 * surface that a breakdown is partial so it can say so instead of quietly
 * understating. The exact totals stay right either way, which is the number that
 * matters most on the day.
 */
const FUNNEL_ROW_CAP = 20_000;

/** Default window. Two weeks covers a launch and the tail that follows it. */
const FUNNEL_DEFAULT_DAYS = 14;
const FUNNEL_MAX_DAYS = 90;

export type LandingFunnelDay = {
  /** UTC calendar day, YYYY-MM-DD. Buckets are UTC, not the reader's zone. */
  day: string;
  events: Record<LandingEventName, number>;
  signups: number;
};

/**
 * `host` distinguishes two facts a single "unknown" bucket would destroy:
 * `""` means the browser sent no referrer (direct, a bookmark, or a link whose
 * referrer policy stripped it), while `null` means the visit row carries no
 * referrer field AT ALL, which is a row written before the capture existed or a
 * client that failed before it ran. One is a visitor behaviour and the other is
 * a gap in our own data, and they are read differently.
 */
export type LandingReferrer = { host: string | null; count: number };

export type LandingSource = { source: string | null; count: number };

export type LandingFunnel = {
  windowDays: number;
  /** Inclusive lower bound of the window, ISO. */
  since: string;
  pulledAt: string;
  /** Exact, from indexed head counts. Never truncated by the row cap. */
  totals: Record<LandingEventName, number>;
  /** Newest first, and ONLY days that actually carried something. A day with
   *  nothing in it is omitted rather than rendered as a zero row: a fabricated
   *  fourteen-row series of zeroes is the placeholder the claims law bans. */
  days: LandingFunnelDay[];
  /** Exact head counts, both of them. */
  signupsInWindow: number;
  signupsAllTime: number;
  /** Referrer hostnames from landing_visit props, commonest first. */
  referrers: LandingReferrer[];
  /** waitlist_signups.source over the window, commonest first. */
  sources: LandingSource[];
  /** True when the row cap bit, so the breakdowns above cover only the most
   *  recent FUNNEL_ROW_CAP rows of the window and the surface must say so. */
  eventsTruncated: boolean;
  signupsTruncated: boolean;
};

/** Empty per-event tally. Written out so a new event name is a type error here
 *  rather than a silently missing column on the surface. */
function zeroEventCounts(): Record<LandingEventName, number> {
  return { landing_visit: 0, waitlist_join: 0, referral_share: 0, demo_click: 0, film_play: 0 };
}

export const getLandingFunnel = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown): { days: number } => {
    const o = (i ?? {}) as Record<string, unknown>;
    const raw = Number(o.days);
    const days = Number.isFinite(raw) ? Math.floor(raw) : FUNNEL_DEFAULT_DAYS;
    return { days: Math.min(Math.max(days, 1), FUNNEL_MAX_DAYS) };
  })
  .handler(async ({ context, data }): Promise<LandingFunnel | { error: string }> => {
    // Admin gate, mirroring getObservabilityStatus: user_roles RLS restricts
    // rows to auth.uid(), so a hit here means this caller is an admin.
    const { data: adminRole } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("role", "admin")
      .maybeSingle();
    if (!adminRole) return { error: "Forbidden" };

    const since = new Date(Date.now() - data.days * 86400_000).toISOString();

    // Four indexed head counts (no rows cross the wire) plus two capped pulls
    // and two signup counts. Fired together: they are independent reads and
    // serialising them would put eight round trips in the founder's way.
    const [eventCounts, eventRows, signupRows, signupsWindow, signupsAll] = await Promise.all([
      Promise.all(
        LANDING_EVENTS.map((event) =>
          db
            .from("landing_events")
            .select("id", { count: "exact", head: true })
            .eq("event", event)
            .gte("created_at", since),
        ),
      ),
      db
        .from("landing_events")
        .select("event, created_at, props")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(FUNNEL_ROW_CAP),
      db
        .from("waitlist_signups")
        .select("created_at, source")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(FUNNEL_ROW_CAP),
      db
        .from("waitlist_signups")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since),
      db.from("waitlist_signups").select("id", { count: "exact", head: true }),
    ]);

    // A read that did not complete is not an empty funnel. Everything on this
    // page is a claim about launch day, and "nothing happened" must never be
    // returned when the truth is "we could not find out".
    const failed =
      eventCounts.find((c) => c.error)?.error ??
      eventRows.error ??
      signupRows.error ??
      signupsWindow.error ??
      signupsAll.error;
    if (failed) return { error: failed.message };

    const totals = zeroEventCounts();
    LANDING_EVENTS.forEach((event, i) => {
      totals[event] = eventCounts[i]?.count ?? 0;
    });

    const events = (eventRows.data ?? []) as Array<{
      event: string;
      created_at: string;
      props: Record<string, unknown> | null;
    }>;
    const signups = (signupRows.data ?? []) as Array<{
      created_at: string;
      source: string | null;
    }>;

    const byDay = new Map<string, LandingFunnelDay>();
    const dayOf = (iso: string): LandingFunnelDay => {
      const day = iso.slice(0, 10);
      const found = byDay.get(day);
      if (found) return found;
      const fresh: LandingFunnelDay = { day, events: zeroEventCounts(), signups: 0 };
      byDay.set(day, fresh);
      return fresh;
    };

    // Referrer lives in props.ref, set by the landing_visit effect in
    // src/routes/index.tsx, which stores the HOSTNAME only, never the path and
    // never the query string (the privacy rule this file already follows for
    // session keys). It is read from landing_visit alone because no other event
    // carries it, and counting a missing key on demo_click as "direct" would
    // invent a fact about three quarters of the table.
    const referrers = new Map<string | null, number>();
    for (const r of events) {
      const name = LANDING_EVENTS.find((e) => e === r.event);
      if (!name) continue;
      dayOf(r.created_at).events[name] += 1;
      if (name !== "landing_visit") continue;
      const raw = r.props?.ref;
      const host = typeof raw === "string" ? raw.slice(0, 200) : raw === undefined ? null : "";
      referrers.set(host, (referrers.get(host) ?? 0) + 1);
    }

    const sources = new Map<string | null, number>();
    for (const s of signups) {
      dayOf(s.created_at).signups += 1;
      const key = typeof s.source === "string" && s.source ? s.source : null;
      sources.set(key, (sources.get(key) ?? 0) + 1);
    }

    return {
      windowDays: data.days,
      since,
      pulledAt: new Date().toISOString(),
      totals,
      days: [...byDay.values()].sort((a, b) => b.day.localeCompare(a.day)),
      signupsInWindow: signupsWindow.count ?? 0,
      signupsAllTime: signupsAll.count ?? 0,
      referrers: [...referrers.entries()]
        .map(([host, count]) => ({ host, count }))
        .sort((a, b) => b.count - a.count),
      sources: [...sources.entries()]
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count),
      eventsTruncated: events.length >= FUNNEL_ROW_CAP,
      signupsTruncated: signups.length >= FUNNEL_ROW_CAP,
    };
  });
