import { stripAutoPrefix } from "@/components/plan/format";

/**
 * THE SAME REQUEST, RAISED AGAIN, COUNTED ONCE.
 *
 * ── WHY THIS IS THE LANE'S WHOLE BET ───────────────────────────────────────
 * The brief's fourth glance-fact is "where two efforts are about to collide:
 * two pieces of work touching the same thing, or two teammates about to redo
 * each other's output", and it names the value line: coordinated agents SPLIT
 * duplicate work instead of repeating it. Nothing on the board says it.
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
