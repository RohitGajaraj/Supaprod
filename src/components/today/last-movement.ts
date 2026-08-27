import { TRACK_FRESH_MS } from "@/components/today/tracks-feed";

/**
 * WHEN ANYTHING LAST ACTUALLY MOVED, WHICH IS THE THIRD GLANCE-FACT'S HONEST FORM.
 *
 * ── WHAT THE BRIEF ASKS FOR AND WHY IT CANNOT BE BUILT LITERALLY ───────────
 * The brief's third glance-fact is *"what changed in the last minute — the
 * deltas a person would have wanted to be interrupted for."* A delta needs two
 * things: a previous state, and a mark for where this person's attention
 * stopped. **The second does not exist.** `when.ts` records it in as many
 * words: there is no per-user last-seen watermark in the database, and
 * `today-lanes.functions.ts:542` says the same, so every window the server
 * offers is a fixed 24 hours. A surface cannot draw "since you last looked"
 * from data that never recorded when you looked.
 *
 * THE WATERMARK IS A GAP TO FIX, NOT A SHAPE TO BUILD AROUND, and this
 * paragraph used to read as though it were the second. The founder corrected
 * exactly that framing on another lane on 2026-08-27: designing around a gap
 * in the record bakes today's mess into the product permanently, and "a
 * measurement is a fair way to choose what to build FIRST, not a fair way to
 * choose what the thing IS". The brief asks for the deltas since a person last
 * looked. That is the real feature, it needs one column nobody has written
 * yet, and this file is what the board can honestly say until then — not a
 * decision that the brief's version is impossible.
 *
 * What IS knowable, exactly and without a watermark, is when the workspace last
 * moved at all. On a board whose whole job is to say whether anything is
 * happening, that is the fact underneath the question, and no surface in this
 * product says it.
 *
 * ── IT SPEAKS ONLY WHEN THE ANSWER IS UNCOMFORTABLE ────────────────────────
 * While work is moving, the rows already carry it: Running sorts newest-first
 * and every row prints its own clock. Repeating that above them would be the
 * surface talking about itself. So this returns null while things are fresh and
 * speaks only once movement has stopped, which is the state a person cannot
 * otherwise tell from a calm-looking screen.
 *
 * **The boundary is `TRACK_FRESH_MS`, not a number chosen here.** Ten minutes
 * is the spine tick's own freshness window, already used by `tracks-feed` to
 * decide whether a track is running or honestly stale. Inventing a second
 * threshold would put a boundary on screen that nobody ruled, and would let two
 * parts of one surface disagree about what "recent" means.
 *
 * ── THE FAILURE THIS IS BUILT AGAINST ──────────────────────────────────────
 * A truthfully empty board and a broken one look identical, and that is the
 * expensive confusion. Measured 2026-08-27: `agent_runs` holds zero rows in any
 * in-flight status, so the board is genuinely quiet, and a person reading it
 * has no way to know whether the crew finished or the sweep died three days
 * ago. Naming the silence is the difference. It is also the only honest way to
 * make a quiet board worth looking at: not by animating something, but by
 * telling the reader the one thing the calm surface is hiding.
 */

/** Anything the board holds that carries a last-touched instant. */
interface Movable {
  updated_at?: string | null;
  drivenAt?: string | null;
  updatedAt?: string | null;
}

/** Epoch ms, or null when the value is absent, unparseable, or in the future. */
function instant(iso: string | null | undefined, now: number): number | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  // A clock ahead of ours would otherwise become "moved in 0 minutes".
  if (!Number.isFinite(ms) || ms > now) return null;
  return ms;
}

/**
 * The most recent moment anything on this board moved, or null.
 *
 * Reads every source the board already holds rather than asking for a new one,
 * because "did anything move" must not be answerable only for missions when
 * tracks are moving, or the sentence would call a busy workspace still.
 */
export function lastMovedAt(now: number, ...groups: ReadonlyArray<readonly Movable[] | undefined>) {
  let latest: number | null = null;
  for (const group of groups) {
    for (const row of group ?? []) {
      for (const iso of [row.updated_at, row.updatedAt, row.drivenAt]) {
        const ms = instant(iso, now);
        if (ms !== null && (latest === null || ms > latest)) latest = ms;
      }
    }
  }
  return latest;
}

/**
 * The sentence, or null while the board is fresh or cannot tell.
 *
 * NULL ON "CANNOT TELL" IS DELIBERATE. If no row carries a usable instant, the
 * honest statement is not "nothing has moved" — that is a claim about the
 * workspace made from a gap in our own data. Silence claims nothing; the
 * sentence would claim something false.
 */
export function stillnessLine(
  lastMoved: number | null,
  now: number,
  ago: (iso: string | null | undefined) => string | null,
): string | null {
  if (lastMoved === null) return null;
  if (now - lastMoved < TRACK_FRESH_MS) return null;
  const since = ago(new Date(lastMoved).toISOString());
  if (!since) return null;
  return `Nothing has moved for ${since}.`;
}
