import { stripAutoPrefix } from "@/components/plan/format";

/**
 * THE SAME REQUEST, RAISED AGAIN, COUNTED ONCE.
 *
 * ── THE SECOND HALF OF THE FOURTH GLANCE-FACT. `OverlapNote` IS THE FIRST ──
 * The brief names two different things with an "or": "two pieces of work
 * touching the same THING, or two teammates about to redo each other's
 * OUTPUT". They are not one feature and they cannot share a key.
 *
 *   `overlaps.ts` + `OverlapNote`   the first. Two RUNNING pieces of work
 *                                   contesting the same target — a file, a
 *                                   spec — derived from what the tools
 *                                   actually named. Live write contention,
 *                                   drawn on the running row that owns it.
 *   this module                     the second. Two WAITING requests with the
 *                                   same subject. Redundant queued work,
 *                                   drawn on the waiting lane.
 *
 * A CORRECTION TO MY OWN FIRST VERSION, which said "nothing on the board says
 * it". Half of it already did, and had for a while: OverlapNote is imported by
 * this route and its own header claims the same brief line. I built this
 * without checking whether the fourth glance-fact was already served, which is
 * the mistake this repo names as paying twice for one thing. It survives
 * because the two halves key on genuinely different relations — `overlaps.ts`
 * has no notion of a redundant REQUEST, and this has none of a contested
 * target — and because they draw in different lanes, so neither can repeat the
 * other on screen.
 *
 * **If they ever converge on one key, one of them goes.** Two detectors for
 * one relation is how the next person gets two different counts for the same
 * board, which is the trap S1 named and the one the 7-versus-41 gap already
 * shows the shape of.
 *
 * ── MEASURED, AGAINST THE LIVE DATABASE, 2026-08-27 ────────────────────────
 * This workspace holds 111 missions under 60 distinct titles. Of the 89 that
 * are `proposed`:
 *
 *     89 rows  ->  48 distinct subjects,  so 41 are repeats
 *     5 of them ask for work whose subject is ALREADY COMPLETED, across 4
 *       subjects, one of which had been completed THREE times already
 *
 * The board draws "89 runs waiting on you" and says neither. A person reading
 * that believes they have 89 decisions to make. They have 48, and five of those
 * are asking them to authorise something the crew has already finished.
 *
 * ── EVERY SENTENCE IS SCOPED TO THE LIST, BECAUSE THE CLIENT HOLDS 50 OF 111 ─
 * `listMissions` is `.limit(50)` ordered by `updated_at` descending, and
 * `_authenticated.today.tsx` already carries the rule that follows from it: "a
 * number from a capped read is a wrong number wearing a fact's clothes". The
 * figures above are from the DATABASE and the board cannot see them.
 *
 * So nothing here claims to describe the workspace. `repeatLine` says "on this
 * list" and "this board already shows as finished", and both are exactly true
 * of the rows in front of the reader — checkable by scrolling, which is the
 * strongest form a count on this surface can take. When the repeats are
 * genuinely worse than the page can see, this UNDER-reports, which is the
 * direction that cannot mislead anyone into dismissing real work.
 *
 * ── THIS IS A FLOOR, AND THE REAL KEY IS MISSING UPSTREAM ──────────────────
 * The founder corrected S1 tonight on exactly the trap this file could fall
 * into: "a measurement is a fair way to choose what to build FIRST. It is not
 * a fair way to choose what the thing IS." Designing around a gap in today's
 * data bakes today's mess into the product permanently.
 *
 * So, checked rather than assumed. `missions` carries NO subject key:
 * archived_at, auto_trigger_source, build_driver, completed_at, created_at,
 * current_agent_id, goal, hop_count, id, replayed_from_mission_id, status,
 * title, updated_at, user_id, verify_cycles, workspace_id. No theme, no
 * cluster, no opportunity. `spine_tracks` HAS `theme_id`; missions do not. So
 * the title is not the key this chose over a better one, it is the only key
 * that exists, and matching on it is a floor rather than a design.
 *
 * `replayed_from_mission_id` NAMES A NARROWER RELATION AND IT IS FULLY WIRED.
 *
 * CORRECTING MYSELF, because the first version of this header said "NOTHING
 * WRITES IT" and that is false. The whole loop exists:
 * `MissionOrchestratorDetail` passes `replayedFrom` into
 * `startOrchestratedMission`, which writes the column, and the same file reads
 * it back to draw a "replayed from" door. It is non-null on 0 of 111 rows here
 * because nobody has clicked Replay in this workspace, not because anything is
 * missing.
 *
 * HOW I GOT IT WRONG IS THE POINT. I read 0 of 111 and concluded the write did
 * not exist — inferring the platform from whatever data happened to be sitting
 * in the table, which is precisely the error the founder had just corrected on
 * another lane, made inside my own note about that correction. The code was one
 * grep away and I reached for the database instead.
 *
 * WHAT IT DOES AND DOES NOT SOLVE. It records a deliberate re-run of one
 * specific mission. It says nothing about two DIFFERENT missions raised
 * independently about the same subject, which is what this module counts and
 * what the brief's fourth glance-fact asks for. So it is not the key this is
 * waiting for; a subject relation on `missions` would be, and there is none.
 *
 * AND IF ONE IS EVER ADDED, THIS GOES rather than staying as a fallback. Two
 * keys for one relation is how the next person gets a different count from the
 * same table, which is the 7-versus-41 gap this file is already living with.
 * (S1's caution, and it is right.)
 *
 * ── EXACT MATCHES ONLY, AND THAT IS A DELIBERATE FLOOR ─────────────────────
 * Nothing here is fuzzy: no stemming, no edit distance, no embedding. Two rows
 * collide when their titles are identical after trimming, collapsing runs of
 * whitespace, folding case and dropping the machine `[auto]` prefix that
 * `stripAutoPrefix` already removes at render.
 *
 * **A false collision is worse than a missed one**, and by a long way. Telling
 * someone two different requests are the same invites them to dismiss work that
 * was never duplicated, and it is unrecoverable: the dismissed one does not come
 * back to argue. Missing a near-duplicate costs them nothing they do not already
 * pay today. So this under-reports on purpose, and every number it produces can
 * be checked by reading two titles side by side.
 *
 * ── WHY `completed_with_failures` IS NOT "ALREADY DONE" ────────────────────
 * The live status vocabulary is `proposed`, `completed`, `completed_with_failures`,
 * `failed`, `halted`. Only the unambiguous finishes count as settled here. A run
 * that completed WITH FAILURES is exactly the case where raising the work again
 * may be the right call, and telling a person "this is already finished" about
 * one would be the surface talking them out of a decision it is not entitled to
 * make.
 */

/** Statuses that mean the work is finished and would genuinely be redone. */
const SETTLED = new Set(["completed", "done", "shipped"]);

/** What this module needs from a row. Narrow on purpose. */
interface Workish {
  id: string;
  title?: string | null;
  status?: string | null;
}

export interface RepeatGroup {
  /** The normalised subject these rows share. */
  key: string;
  /** The first row's title, as written, for anything that wants to show it. */
  title: string;
  ids: string[];
  /** How many rows share this subject. Always 2 or more. */
  total: number;
  /** How many of them are already finished. */
  settled: number;
}

export interface DuplicateWork {
  /** Distinct subjects across the rows given. */
  distinct: number;
  /** Rows beyond the first in each group: what the count is inflated by. */
  repeated: number;
  /** Groups of two or more, largest first. */
  groups: RepeatGroup[];
}

/** The comparison key. Everything fuzzy is deliberately absent. */
export function subjectKey(title: string | null | undefined): string {
  return stripAutoPrefix(String(title ?? ""))
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Group rows by subject and report what the repetition costs the reader.
 *
 * `rows` is the population the CALLER is showing. That matters: asking this
 * about the proposals answers "how many decisions do I really have", and asking
 * it about every mission answers a different question. Neither number is a
 * property of the workspace, so this never fetches its own.
 */
export function duplicateWork(rows: readonly Workish[] | undefined): DuplicateWork {
  const byKey = new Map<string, Workish[]>();
  for (const r of rows ?? []) {
    const k = subjectKey(r.title);
    if (!k) continue; // a row with no subject cannot collide with anything
    const bucket = byKey.get(k);
    if (bucket) bucket.push(r);
    else byKey.set(k, [r]);
  }

  const groups: RepeatGroup[] = [];
  let repeated = 0;
  for (const [key, bucket] of byKey) {
    if (bucket.length < 2) continue;
    repeated += bucket.length - 1;
    groups.push({
      key,
      title: stripAutoPrefix(String(bucket[0].title ?? "")),
      ids: bucket.map((b) => b.id),
      total: bucket.length,
      settled: bucket.filter((b) => SETTLED.has(String(b.status ?? ""))).length,
    });
  }
  groups.sort((a, b) => b.total - a.total);

  return { distinct: byKey.size, repeated, groups };
}

/**
 * How many of `rows` ask for work that is already finished ELSEWHERE.
 *
 * Separate from `duplicateWork` because it is a different question against a
 * different population: the settled sibling is usually NOT in the list being
 * shown. A person looking at 89 open proposals cannot see the completed run
 * that makes five of them redundant, which is exactly why the surface has to
 * say it.
 */
export function redoingSettledWork(
  rows: readonly Workish[] | undefined,
  everything: readonly Workish[] | undefined,
): number {
  const finished = new Set<string>();
  for (const r of everything ?? []) {
    if (SETTLED.has(String(r.status ?? ""))) {
      const k = subjectKey(r.title);
      if (k) finished.add(k);
    }
  }
  if (finished.size === 0) return 0;
  return (rows ?? []).filter((r) => {
    const k = subjectKey(r.title);
    return k !== "" && finished.has(k) && !SETTLED.has(String(r.status ?? ""));
  }).length;
}

/**
 * The sentence, or null when there is nothing true to say.
 *
 * NULL AT ZERO IS THE POINT. A board with no duplication must not print
 * "0 repeats": that is a sentence about our arithmetic rather than about their
 * work, and R-20 §8 says a region either carries a fact the person came for or
 * is removed. It speaks only when the count in front of them is inflated.
 */
export function repeatLine(dup: DuplicateWork, redoing: number): string | null {
  if (dup.repeated <= 0 && redoing <= 0) return null;
  const parts: string[] = [];
  if (dup.repeated > 0) {
    parts.push(
      dup.repeated === 1
        ? "1 of these repeats another on this list"
        : `${dup.repeated} of these repeat others on this list`,
    );
  }
  if (redoing > 0) {
    parts.push(
      redoing === 1
        ? "1 asks for work this board already shows as finished"
        : `${redoing} ask for work this board already shows as finished`,
    );
  }
  return `${parts.join(", and ")}.`;
}

/**
 * WHAT A SINGLE ROW SHOULD SAY ABOUT BEING ONE OF SEVERAL.
 *
 * The lane note says how much of the list repeats itself, which is the fact a
 * person needs before they start. This is the one they need while they are in
 * it: a row that looks like a decision to make is often the fourth copy of a
 * decision three rows above. Without it the count is a warning nobody can act
 * on, because the reader still cannot tell WHICH rows it was about.
 *
 * "on this list" for the same reason every other sentence in this file carries
 * it: the client holds 50 of 111 rows, so the true number of copies may be
 * higher and this must not be read as the workspace's total.
 */
export function repeatBadge(total: number): string | null {
  if (total < 2) return null;
  return `One of ${total} identical requests on this list.`;
}
