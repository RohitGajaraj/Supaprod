/**
 * RPT-45 - Changelog heartbeat projection (pure core).
 *
 * A weekly "what actually shipped, changed, and was decided" pulse: the
 * workspace's self-accountability heartbeat, materialized from real data. It
 * buckets shipped changesets and recorded decisions into ISO-week buckets so a
 * reader can see the beat (and the silence: empty weeks are kept in range, on
 * purpose, because a heartbeat that hides quiet weeks is lying).
 *
 * This module is pure. It reuses the changelog decision helpers so "did this
 * ship?" is answered exactly once, in one place (changelog.ts), and never
 * reimplemented. The caller passes nowIso so the projection is deterministic
 * and testable without a clock.
 */

import { shouldPublishChangelog, changelogTitleFor, type ChangesetForChangelog } from "./changelog";

/** The subset of a decision this projection reads. */
export type DecisionForHeartbeat = {
  title?: string | null;
  status?: string | null;
  created_at?: string | null;
  decided_by_agent_slug?: string | null;
};

/** One shipped line in a week's beat. */
export type HeartbeatShipped = {
  title: string;
  pr_url: string | null;
  notes: string;
};

/** One decision line in a week's beat. */
export type HeartbeatDecided = {
  title: string;
  agent: string;
};

/** A single week bucket, always present even when nothing happened. */
export type HeartbeatWeek = {
  /** ISO date (YYYY-MM-DD) of the Monday that starts this week, in UTC. */
  week_of: string;
  shipped: HeartbeatShipped[];
  decided: HeartbeatDecided[];
  shipped_count: number;
  decided_count: number;
};

export type Heartbeat = {
  weeks: HeartbeatWeek[];
  totals: { shipped: number; decided: number };
};

/**
 * The ISO date (YYYY-MM-DD, UTC) of the Monday that starts the ISO week
 * containing `iso`. ISO weeks start on Monday. Computed entirely in UTC so the
 * result never shifts with the machine timezone.
 */
export function isoWeekStart(iso: string): string {
  const d = new Date(iso);
  const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = utc.getUTCDay(); // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  const shiftToMonday = day === 0 ? -6 : 1 - day;
  utc.setUTCDate(utc.getUTCDate() + shiftToMonday);
  return utc.toISOString().slice(0, 10);
}

/** Shift a bare YYYY-MM-DD date by whole days, staying in UTC. */
function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Pull a short human note for a shipped line: the first meaningful line of the
 * release notes that is not just a repeat of the title. Heading and bullet
 * markers are stripped so the note reads as plain copy. Returns "" when there
 * is nothing worth adding beyond the title.
 */
function shipNote(cs: ChangesetForChangelog, title: string): string {
  const line = (cs.release_notes ?? "")
    .split(/\r?\n/)
    .map((l) =>
      l
        .replace(/^#+\s*/, "")
        .replace(/^[-*]\s*/, "")
        .trim(),
    )
    .find((l) => l.length > 0 && l !== title);
  return line ?? "";
}

/**
 * Build the heartbeat projection over the last `weeks` ISO weeks ending with
 * the week that contains `nowIso`.
 *
 * - Shipped: only changesets that actually shipped (shouldPublishChangelog),
 *   bucketed by release_notes_at, falling back to updated_at.
 * - Decided: every decision passed in, bucketed by created_at. Filtering which
 *   decisions count (for example, excluding pending) is the caller's job; this
 *   core faithfully buckets whatever it is handed.
 * - Weeks are newest first and include empty weeks inside the window.
 * - Items whose bucket falls outside the window are dropped, and totals reflect
 *   only what the returned weeks actually contain.
 */
export function buildHeartbeat(
  changesets: ChangesetForChangelog[],
  decisions: DecisionForHeartbeat[],
  nowIso: string,
  weeks: number,
): Heartbeat {
  const count = Math.max(1, Math.floor(weeks));
  const currentMonday = isoWeekStart(nowIso);

  // Ordered week starts (newest first) plus a lookup keyed by that Monday.
  const weekStarts: string[] = [];
  const buckets = new Map<
    string,
    {
      shipped: Array<{ item: HeartbeatShipped; t: number }>;
      decided: Array<{ item: HeartbeatDecided; t: number }>;
    }
  >();
  for (let i = 0; i < count; i++) {
    const ws = addDays(currentMonday, -7 * i);
    weekStarts.push(ws);
    buckets.set(ws, { shipped: [], decided: [] });
  }

  for (const cs of changesets) {
    if (!shouldPublishChangelog(cs)) continue;
    const when = cs.release_notes_at ?? cs.updated_at;
    if (!when) continue;
    const bucket = buckets.get(isoWeekStart(when));
    if (!bucket) continue;
    const title = changelogTitleFor(cs);
    bucket.shipped.push({
      item: { title, pr_url: cs.pr_url ?? null, notes: shipNote(cs, title) },
      t: new Date(when).getTime(),
    });
  }

  for (const d of decisions) {
    const when = d.created_at;
    if (!when) continue;
    const bucket = buckets.get(isoWeekStart(when));
    if (!bucket) continue;
    bucket.decided.push({
      item: {
        title: (d.title ?? "").trim() || "Untitled decision",
        agent: (d.decided_by_agent_slug ?? "").trim() || "human",
      },
      t: new Date(when).getTime(),
    });
  }

  let totalShipped = 0;
  let totalDecided = 0;
  const outWeeks: HeartbeatWeek[] = weekStarts.map((ws) => {
    const bucket = buckets.get(ws)!;
    const shipped = bucket.shipped.sort((a, b) => b.t - a.t).map((x) => x.item);
    const decided = bucket.decided.sort((a, b) => b.t - a.t).map((x) => x.item);
    totalShipped += shipped.length;
    totalDecided += decided.length;
    return {
      week_of: ws,
      shipped,
      decided,
      shipped_count: shipped.length,
      decided_count: decided.length,
    };
  });

  return { weeks: outWeeks, totals: { shipped: totalShipped, decided: totalDecided } };
}
