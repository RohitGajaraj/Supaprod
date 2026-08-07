/**
 * The door. Server-side validation and redemption of invite codes.
 *
 * Signup was wide open with auto-confirm until the founder closed it on
 * 2026-08-07 (private beta, entry by code). Schema, the atomic redeem and the
 * reasoning behind both live in
 * supabase/migrations/20260807210000_signup_closes_entry_is_by_invite_code.sql.
 *
 * THE DECIDING HAPPENS HERE AND NOWHERE ELSE. src/routes/signup.tsx asks and
 * obeys; it holds no rule about what makes a code good and cannot construct an
 * approval, because the only thing it ever receives is this file's verdict.
 * Anything the browser knows about a code it learned from a round trip.
 *
 * WHAT THE CALLER IS TOLD, AND WHAT IT IS NOT. A revoked code and a code that
 * never existed come back IDENTICAL: same reason, same sentence. They are
 * different facts and the admin surface reads the difference, but telling a
 * stranger "that code was real once" hands a prober a confirmed hit and turns a
 * guess into a fact worth guessing near. Expired and exhausted are reported
 * honestly, because both of those already prove the code existed and the person
 * holding one is almost always someone we invited, who needs to know which of
 * the two it is to know what to ask for.
 *
 * WHAT REMAINS OPEN, said out loud rather than left for someone to find. This
 * gate stands in front of `supabase.auth.signUp`, which the BROWSER calls with
 * the publishable key. Somebody who skips our form entirely and calls that
 * endpoint directly still gets an account, and no server function of ours is on
 * that path to stop them. Closing it for real means a gate inside the database
 * on auth.users itself, which is a higher blast radius change than this one and
 * has to be verified against a live project rather than reasoned about. What
 * this file does buy today is that every door the product SHOWS is locked, and
 * every account created through one is accounted for against a code.
 */
import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// invite_codes / invite_code_attempts postdate the generated types; the same
// relaxed pattern landing.functions.ts already runs on.
const db = supabaseAdmin as unknown as SupabaseClient;

export type InviteRefusal = "missing" | "unknown" | "expired" | "exhausted" | "busy" | "unreadable";

export type InviteVerdict = { ok: true } | { ok: false; reason: InviteRefusal; message: string };

/**
 * One sentence per refusal, each of which has to survive being read by somebody
 * we actually invited, at the moment they are least patient. So every one of
 * them names what happened AND what to do about it. "Invalid code" names
 * neither and is the version this replaces.
 */
const REFUSAL_COPY: Record<InviteRefusal, string> = {
  missing:
    "Supaprod is invite only right now, so this needs a code. Paste the one from your invite, or join the waitlist and we will send you one.",
  unknown:
    "That code is not one we recognise. Check it for a typo, and if it still will not take, join the waitlist and we will send you a fresh one.",
  expired:
    "That code has expired. Reply to the invite it came in and we will send a new one, or join the waitlist.",
  exhausted:
    "That code has been used as many times as it allows. Reply to the invite it came in and we will send a new one, or join the waitlist.",
  busy: "The door is busy right now. Try again in a minute; your code is fine.",
  unreadable: "We could not check that code just now. Try again in a moment.",
};

function refuse(reason: InviteRefusal): InviteVerdict {
  return { ok: false, reason, message: REFUSAL_COPY[reason] };
}

/**
 * Everything a person might reasonably paste, turned into the code.
 *
 * THE WHOLE INVITE LINK IS THE COMMON PASTE, not the exception. We send people a
 * URL, so what is on their clipboard is a URL, and a field that refused
 * `https://supaprod.ai/signup?invite=YC-COMPOUND-K7QR4V` would be rejecting the
 * exact string our own email put there. The code is lifted out of any `invite=`
 * query parameter, wherever in the string it appears, which covers the full URL,
 * a bare path, and a link that arrived with other parameters hanging off it.
 *
 * WHITESPACE COMES OUT OF THE MIDDLE as well as the ends. A code copied from an
 * email arrives with a trailing newline and, often, a soft wrap through the
 * middle of it. That is not a different code and must not be refused as one.
 *
 * CASING IS LEFT ALONE, deliberately. Both functions in the migration lower each
 * side of the comparison, so the casing on a card never has to be reproduced,
 * and lowering it here would only mean the field showing the person something
 * different from what they typed.
 */
export function normalizeInviteCode(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const trimmed = raw.trim();
  const fromLink = /[?&]invite=([^&#\s]+)/i.exec(trimmed);
  let candidate = trimmed;
  if (fromLink) {
    try {
      candidate = decodeURIComponent(fromLink[1]);
    } catch {
      // A malformed percent escape makes decodeURIComponent throw. The raw
      // capture is still the best guess at what the person meant, and the
      // database will refuse it plainly if it is not a code.
      candidate = fromLink[1];
    }
  }
  return candidate.replace(/\s+/g, "").slice(0, 64);
}

/**
 * The global rate brake, and the number is 200 attempts a minute.
 *
 * It is the same shape as the brake in joinWaitlist and it owes that comment its
 * argument: turning away a real person is UNRECOVERABLE, because they do not
 * come back and we never find out we lost them, while accepting a junk attempt
 * costs one row we can delete at leisure. The waitlist brake was set at 20, met
 * a launch, and had to be raised to 300 mid-flight for exactly that reason.
 *
 * Why 200 and not 300. The genuine ceiling here is smaller and known: you cannot
 * reach this door without already holding a code, so the traffic is the invited
 * cohort and nothing else. There is no Product Hunt shape to survive. A private
 * beta cohort is tens of people, low hundreds at the outside, and 200 in a
 * single minute is more than every one of them arriving simultaneously.
 *
 * Why not lower, given a code is a secret. Because this counter is not what
 * protects the secret and pretending otherwise would set it far too tight. Brute
 * force is defeated by the code's entropy: the seeded partner code carries a
 * six-character random tail on top of its stem, and even an attacker allowed the
 * full 200 a minute forever covers a rounding error of that space. What the
 * brake actually does is stop an automated flood filling the attempts table, and
 * for that job it only has to sit above anything a human population produces.
 */
export const INVITE_ATTEMPT_CEILING = 200;

/**
 * Every attempt writes one row, with the TRUE outcome from the database and not
 * the softened one the caller was handed: this table is admin-only, and an
 * admin needs to see that somebody is hammering a code that was revoked
 * yesterday. A completed signup writes two rows (the pre-flight check and the
 * redemption), so this is a count of attempts at the door, never of people.
 *
 * Never throws, and never fails the caller's request. A refusal we could not
 * log is still a correct refusal, and an approval we could not log is still a
 * person who is legitimately getting in.
 */
async function recordAttempt(client: SupabaseClient, outcome: string): Promise<void> {
  try {
    await client.from("invite_code_attempts").insert({ outcome });
  } catch {
    // Bookkeeping never gets to fail a door.
  }
}

/** The database's word, folded into what the caller is allowed to hear. */
function foldOutcome(outcome: string): InviteVerdict {
  if (outcome === "ok") return { ok: true };
  if (outcome === "expired" || outcome === "exhausted") return refuse(outcome);
  // 'revoked' and 'unknown' land in the same place on purpose (see the header),
  // and so does any word a future migration adds that this build has not been
  // taught: an unrecognised verdict is not an approval.
  return refuse("unknown");
}

/**
 * The one code path both public entry points run through.
 *
 * `commit` is the whole difference between them, and it maps onto two different
 * database functions rather than onto a branch in here: `invite_code_status`
 * reads and `redeem_invite_code` increments atomically. Splitting "is it valid"
 * and "spend it" across two round trips in JS is precisely the read-modify-write
 * the migration's single UPDATE exists to make impossible, so this file must
 * never do the arithmetic itself.
 */
async function decide(
  client: SupabaseClient,
  rawCode: unknown,
  commit: boolean,
): Promise<InviteVerdict> {
  const code = normalizeInviteCode(rawCode);
  if (!code) return refuse("missing");

  const minuteAgo = new Date(Date.now() - 60_000).toISOString();
  const recent = await client
    .from("invite_code_attempts")
    .select("id", { count: "exact", head: true })
    .gte("created_at", minuteAgo);
  // A read that failed is not a flood. If we cannot count the last minute the
  // door stays open, because the failure mode of guessing "too busy" here is the
  // unrecoverable one.
  if (!recent.error && (recent.count ?? 0) > INVITE_ATTEMPT_CEILING) {
    // Deliberately NOT recorded. A refused attempt that logs itself feeds the
    // counter that refused it, and the brake would hold itself down for as long
    // as anyone kept knocking.
    return refuse("busy");
  }

  const { data, error } = await client.rpc(commit ? "redeem_invite_code" : "invite_code_status", {
    _code: code,
  });
  if (error || typeof data !== "string") {
    await recordAttempt(client, "unreadable");
    // A failed read is not a bad code, and must never wear one's clothes: the
    // person is told to try again rather than told their code is wrong.
    return refuse("unreadable");
  }

  await recordAttempt(client, data);
  return foldOutcome(data);
}

/** Pre-flight. Reads, never spends. Called before the account is created. */
export function checkInviteCodeImpl(client: SupabaseClient, code: unknown): Promise<InviteVerdict> {
  return decide(client, code, false);
}

/** The real thing. Atomic, and the only call that moves the counter. */
export function redeemInviteCodeImpl(
  client: SupabaseClient,
  code: unknown,
): Promise<InviteVerdict> {
  return decide(client, code, true);
}

export const checkInviteCode = createServerFn({ method: "POST" })
  .inputValidator((i: unknown): { code: string } => ({
    code: normalizeInviteCode((i as { code?: unknown } | null)?.code),
  }))
  .handler(({ data }): Promise<InviteVerdict> => checkInviteCodeImpl(db, data.code));

export const redeemInviteCode = createServerFn({ method: "POST" })
  .inputValidator((i: unknown): { code: string } => ({
    code: normalizeInviteCode((i as { code?: unknown } | null)?.code),
  }))
  .handler(({ data }): Promise<InviteVerdict> => redeemInviteCodeImpl(db, data.code));

/* ------------------------------------------------------------------ *
 * The admin side: list, mint, revoke
 * ------------------------------------------------------------------ */

export type InviteCodeStatus = "live" | "revoked" | "expired" | "exhausted";

export type AdminInviteCode = {
  id: string;
  code: string;
  note: string | null;
  maxUses: number | null;
  uses: number;
  /** null means unlimited, which is a different fact from zero left. */
  remaining: number | null;
  expiresAt: string | null;
  createdAt: string;
  status: InviteCodeStatus;
};

export type AdminInviteDoor = {
  codes: AdminInviteCode[];
  /** Attempts at the door in the last 24 hours. Two per completed signup. */
  attemptsLastDay: number;
  /** Of those, how many were refused. A number climbing here with no signups
   *  behind it is a code circulating that no longer works. */
  refusedLastDay: number;
  pulledAt: string;
};

/**
 * The status vocabulary again, in TS this time, and the duplication is
 * deliberate rather than an oversight. The database owns the verdict for the
 * DOOR, where being wrong lets somebody in. This owns the verdict for a LIST,
 * where being wrong mislabels a row, and paying a round trip per row to avoid
 * restating four conditions would be the worse trade. Order matches
 * invite_code_status exactly: revoked outranks expired outranks exhausted.
 */
function statusOf(row: {
  revoked: boolean;
  expires_at: string | null;
  max_uses: number | null;
  uses: number;
}): InviteCodeStatus {
  if (row.revoked) return "revoked";
  if (row.expires_at && Date.parse(row.expires_at) <= Date.now()) return "expired";
  if (row.max_uses !== null && row.uses >= row.max_uses) return "exhausted";
  return "live";
}

type InviteCodeRow = {
  id: string;
  code: string;
  note: string | null;
  max_uses: number | null;
  uses: number;
  expires_at: string | null;
  revoked: boolean;
  created_at: string;
};

function present(row: InviteCodeRow): AdminInviteCode {
  return {
    id: row.id,
    code: row.code,
    note: row.note,
    maxUses: row.max_uses,
    uses: row.uses,
    remaining: row.max_uses === null ? null : Math.max(0, row.max_uses - row.uses),
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    status: statusOf(row),
  };
}

/**
 * Admin gate, the same one getLandingFunnel uses and for the same reason:
 * user_roles RLS restricts rows to auth.uid(), so a hit on the CALLER'S own
 * client means this person really is an admin and no input can fake it. The
 * reads then run on the service role because invite_codes has RLS on with no
 * policies at all, which is the point: the table holds unspent secrets.
 */
async function requireAdmin(caller: SupabaseClient): Promise<boolean> {
  const { data } = await caller.from("user_roles").select("role").eq("role", "admin").maybeSingle();
  return !!data;
}

export const getInviteDoor = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminInviteDoor | { error: string }> => {
    if (!(await requireAdmin(context.supabase as unknown as SupabaseClient))) {
      return { error: "Forbidden" };
    }
    const dayAgo = new Date(Date.now() - 86_400_000).toISOString();
    const [codes, attempts, refused] = await Promise.all([
      db.from("invite_codes").select("*").order("created_at", { ascending: false }).limit(500),
      db
        .from("invite_code_attempts")
        .select("id", { count: "exact", head: true })
        .gte("created_at", dayAgo),
      db
        .from("invite_code_attempts")
        .select("id", { count: "exact", head: true })
        .gte("created_at", dayAgo)
        .neq("outcome", "ok"),
    ]);
    // A read that did not complete is not an empty door. Every surface in this
    // product refuses to render "nothing here" when the truth is "we could not
    // find out", and a page about who can get in is the last place to start.
    if (codes.error) return { error: codes.error.message };
    return {
      codes: ((codes.data ?? []) as InviteCodeRow[]).map(present),
      attemptsLastDay: attempts.error ? 0 : (attempts.count ?? 0),
      refusedLastDay: refused.error ? 0 : (refused.count ?? 0),
      pulledAt: new Date().toISOString(),
    };
  });

/**
 * Minted codes read back cleanly out loud and cannot be misheard.
 *
 * The alphabet drops O, 0, I, 1 and L, which are the pairs that get transcribed
 * wrong off a screenshot or a phone call, and a code that fails because somebody
 * read a zero as an O is a person turned away by our own typography. Grouped in
 * fours for the same reason. 28 characters over 8 positions is 3.8e11
 * combinations, which is not guessable at any rate this door will ever serve.
 */
const MINT_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function mintCode(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const body = Array.from(bytes, (b) => MINT_ALPHABET[b % MINT_ALPHABET.length]).join("");
  return `SP-${body.slice(0, 4)}-${body.slice(4)}`;
}

/** A hand-written code still has to be a code: no spaces, nothing that would
 *  have to be URL-escaped to survive an ?invite= link. */
const CODE_RE = /^[A-Za-z0-9-]{4,64}$/;

export const adminMintInviteCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (
      i: unknown,
    ): { code: string; note: string; maxUses: number | null; expiresAt: string | null } => {
      const o = (i ?? {}) as Record<string, unknown>;
      const rawMax = Number(o.maxUses);
      const rawExpires = typeof o.expiresAt === "string" ? o.expiresAt.trim() : "";
      const parsedExpires = rawExpires ? Date.parse(rawExpires) : NaN;
      return {
        code: normalizeInviteCode(o.code),
        note: typeof o.note === "string" ? o.note.trim().slice(0, 400) : "",
        // Zero and negatives are rejected rather than clamped: an admin who
        // typed one meant something, and quietly turning it into "unlimited"
        // would mint the opposite of what they asked for.
        maxUses: Number.isFinite(rawMax) && rawMax >= 1 ? Math.floor(rawMax) : null,
        expiresAt: Number.isFinite(parsedExpires) ? new Date(parsedExpires).toISOString() : null,
      };
    },
  )
  .handler(async ({ context, data }): Promise<AdminInviteCode | { error: string }> => {
    if (!(await requireAdmin(context.supabase as unknown as SupabaseClient))) {
      return { error: "Forbidden" };
    }
    if (!data.note) {
      // Enforced rather than encouraged. A code with no note is untraceable the
      // moment it leaks, and "who did I give this to" is the only question ever
      // asked of this table in an emergency.
      return {
        error:
          "Say who or what the code is for. A code nobody can trace is a code nobody can safely revoke.",
      };
    }
    const code = data.code || mintCode();
    if (!CODE_RE.test(code)) {
      return { error: "A code can hold letters, digits and hyphens only, 4 to 64 characters." };
    }
    const inserted = await db
      .from("invite_codes")
      .insert({
        code,
        note: data.note,
        max_uses: data.maxUses,
        expires_at: data.expiresAt,
        created_by: context.userId,
      })
      .select("*")
      .maybeSingle();
    if (inserted.error) {
      // 23505 is the case-insensitive unique index, which is a real answer and
      // not a failure: the admin typed a code that already exists.
      if (inserted.error.code === "23505") {
        return { error: `${code} already exists. Codes are matched without regard to casing.` };
      }
      return { error: inserted.error.message };
    }
    if (!inserted.data) return { error: "The code was not written back, so nothing can be shown." };
    return present(inserted.data as InviteCodeRow);
  });

export const adminRevokeInviteCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown): { id: string } => ({
    id: String((i as { id?: unknown } | null)?.id ?? ""),
  }))
  .handler(async ({ context, data }): Promise<AdminInviteCode | { error: string }> => {
    if (!(await requireAdmin(context.supabase as unknown as SupabaseClient))) {
      return { error: "Forbidden" };
    }
    if (!data.id) return { error: "No code was named." };
    // A flag, never a DELETE: the redemption count is the only record of how far
    // a leaked code travelled, and deleting the row destroys the evidence at the
    // exact moment it becomes worth having.
    const updated = await db
      .from("invite_codes")
      .update({ revoked: true })
      .eq("id", data.id)
      .select("*")
      .maybeSingle();
    if (updated.error) return { error: updated.error.message };
    // An update that matched nothing RESOLVES in supabase-js rather than
    // throwing, so a revoke aimed at a row that is gone would otherwise report
    // success having changed nothing.
    if (!updated.data) return { error: "That code no longer exists, so nothing was revoked." };
    return present(updated.data as InviteCodeRow);
  });
