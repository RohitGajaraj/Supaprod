/**
 * ── WHAT THE PLATFORM RECORDED WHEN IT REFUSED TO RUN THIS ────────────────
 *
 * One reader of `agent_runs.halted_reason`, shared, because two would be the
 * defect this repo has spent a week removing: two surfaces answering one
 * question and drifting apart between deploys.
 *
 * ── A HOLD IS INFERRED; A HALT IS RECORDED ────────────────────────────────
 * `spine_tracks.last_hold` is the DRIVER's reading of a shape -- run many
 * times, moved once never, so stop. `agent_runs.halted_reason` is the PLATFORM
 * saying it refused to run at all: out of credit, kill switch, over a cap.
 * Until 2026-09-10 only the inferred one reached a surface, so a run stopped by
 * an empty wallet said *"Design has been run many times over and the work has
 * not moved on once"* while the record held twelve `out_of_credit` refusals
 * averaging 612ms. Design law 23.
 *
 * ── THE SLUG, NEVER THE PROSE ─────────────────────────────────────────────
 * `halted_reason` holds two vocabularies and both are live in production: the
 * halt path writes a slug (`out_of_credit`), and the stall sweeper writes a
 * whole English sentence (*"Stopped automatically: no progress for 4 hours..."*).
 * A surface keying on the second would be matching prose in a field that merely
 * LOOKS structured, which is worse than matching prose openly. So anything with
 * whitespace in it is not a slug and is not returned. That test is exact rather
 * than clever, and it is Lane 2's, from `activity.ts`.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

/** Whether the wall a run hit is still standing. */
export type WallNow =
  /** Checked, and the thing that caused it has gone. */
  | "gone"
  /** Checked, and it is still there. */
  | "standing"
  /**
   * NOT CHECKED, AND THIS IS A REAL VALUE RATHER THAN A MISSING ONE.
   *
   * Lane 2's condition and they are right to insist on it: a failed wallet read
   * that collapsed to "gone" would delete a real wall from a card, which is
   * worse than the stale count it replaced. Every read here fails to `unknown`,
   * and a surface must degrade to naming the wall without claiming it has
   * lifted -- which is still true.
   */
  | "unknown";

export type PlatformWall = {
  /** The slug, verbatim. Never a sentence, never a classification. */
  kind: string;
  /** When that run was recorded. */
  at: string;
  /**
   * Whether THIS wall is still standing.
   *
   * ON THE WALL AND NOT ON THE TRACK, which is Lane 2's second condition. A run
   * can hold a credit halt AND a repository refusal at once; a bare boolean on
   * the track would let a surface apply the credit answer to the repository
   * wall, which is the between-elements defect law 14 names. Only a wallet wall
   * can be answered by a balance, so every other kind is `unknown` here and
   * says so rather than borrowing the wallet's answer.
   */
  now: WallNow;
};

/** Slugs whose standing a balance can actually answer. */
const WALLET_WALLS = new Set(["out_of_credit"]);

/** A slug has no whitespace. The stall sweeper writes whole sentences. */
export function isSlug(reason: string | null | undefined): reason is string {
  return typeof reason === "string" && reason.trim().length > 0 && !/\s/.test(reason);
}

/**
 * The newest recorded halt per track, and whether its wall still stands.
 *
 * ONE ROUND TRIP FOR THE HALTS, AND IT IS THE SMALLEST READ IN THE HOME.
 * `status = 'halted'` is 46 rows in the ENTIRE product across eight tracks
 * (measured 2026-09-10); scoped to 50 track ids it is a handful. Two more for
 * the balance, chained, and only when a wallet wall was actually found -- a
 * feed with no credit halts pays nothing for this.
 *
 * THE ACCOUNT COMES FROM THE WORKSPACE, NEVER FROM THE READER. The wallet a
 * halt was recorded against belongs to the workspace, so resolving it from
 * whoever is looking reads the wrong balance for any track they can see and do
 * not own. And there is NO foreign key from `spine_tracks.workspace_id` to
 * `workspaces`, so this is a read and not a PostgREST embed -- an embed there
 * 400s and takes the whole reader down with it, which is how the home's largest
 * read died for half an hour on 2026-09-10.
 */
export async function wallsByTrack(
  supabase: SupabaseClient,
  tracks: ReadonlyArray<{ id: string; workspaceId: string | null }>,
): Promise<Map<string, PlatformWall>> {
  const out = new Map<string, PlatformWall>();
  const ids = tracks.map((t) => t.id);
  if (ids.length === 0) return out;

  const { data: halts, error } = await supabase
    .from("agent_runs")
    .select("track_id, halted_reason, created_at")
    .in("track_id", ids)
    .eq("status", "halted")
    .not("halted_reason", "is", null)
    .order("created_at", { ascending: false });
  if (error) {
    /* A refused read must not read as "this run was never stopped by the
       platform". Nothing is returned and every caller degrades to the hold. */
    console.error(`[wallsByTrack] halts read failed: ${error.message}`);
    return out;
  }

  for (const h of (halts ?? []) as Array<{
    track_id: string | null;
    halted_reason: string | null;
    created_at: string;
  }>) {
    if (!h.track_id || !isSlug(h.halted_reason)) continue;
    /* Ordered newest-first, so the first slug seen for a track wins. A track
       can hit two different walls weeks apart; the one in front of it is the
       last one recorded. */
    if (!out.has(h.track_id)) {
      out.set(h.track_id, { kind: h.halted_reason, at: h.created_at, now: "unknown" });
    }
  }

  const needsBalance = [...out.entries()].filter(([, w]) => WALLET_WALLS.has(w.kind));
  if (needsBalance.length === 0) return out;

  const byId = new Map(tracks.map((t) => [t.id, t.workspaceId]));
  const workspaceIds = [
    ...new Set(
      needsBalance
        .map(([id]) => byId.get(id))
        .filter((w): w is string => typeof w === "string" && w.length > 0),
    ),
  ];
  if (workspaceIds.length === 0) return out;

  const { data: wsRows, error: wsErr } = await supabase
    .from("workspaces")
    .select("id, account_id")
    .in("id", workspaceIds);
  if (wsErr) {
    console.error(`[wallsByTrack] workspace account read failed: ${wsErr.message}`);
    return out;
  }
  const accountOf = new Map<string, string>();
  for (const w of (wsRows ?? []) as Array<{ id: string; account_id: string | null }>) {
    if (w.account_id) accountOf.set(w.id, w.account_id);
  }
  const accountIds = [...new Set(accountOf.values())];
  if (accountIds.length === 0) return out;

  const { data: creds, error: credErr } = await supabase
    .from("account_credits")
    .select("account_id, balance_credits, topup_credits")
    .in("account_id", accountIds);
  if (credErr) {
    console.error(`[wallsByTrack] credit balance read failed: ${credErr.message}`);
    return out;
  }
  /*
   * `balance + topup > 0` AND NOTHING CLEVERER. This answers one question --
   * is there money -- and the moment it tried to answer "is there ENOUGH for
   * the next run" it would need the projected cost of a run nobody has
   * planned. Enough-to-try is the honest bar for a fact whose whole job is
   * telling somebody the door is worth pushing again.
   */
  const hasCredit = new Map<string, boolean>();
  for (const c of (creds ?? []) as Array<{
    account_id: string;
    balance_credits: number | null;
    topup_credits: number | null;
  }>) {
    hasCredit.set(c.account_id, (c.balance_credits ?? 0) + (c.topup_credits ?? 0) > 0);
  }

  for (const [trackId, wall] of needsBalance) {
    const account = accountOf.get(byId.get(trackId) ?? "");
    const answer = account ? hasCredit.get(account) : undefined;
    /* An account we could not read stays `unknown`, never `standing`: we did
       not look, so we claim nothing either way. */
    if (answer === undefined) continue;
    out.set(trackId, { ...wall, now: answer ? "gone" : "standing" });
  }
  return out;
}
