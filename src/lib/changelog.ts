/**
 * BYO-P3 WI4 — In-app changelog (pure core).
 *
 * A changelog entry is materialized from a MERGED studio changeset that carries
 * release notes (K1 `generateReleaseNotes` writes `release_notes`). Keeping the
 * decision ("does this changeset deserve a changelog entry?") and the row
 * shaping pure means the read fn can self-materialize entries for already-merged
 * changesets without any edit to the chokepoint-pinned merge handler.
 */

/** The subset of a studio changeset the changelog needs. */
export type ChangesetForChangelog = {
  id: string;
  workspace_id: string;
  user_id?: string | null;
  product_id?: string | null;
  prd_id?: string | null;
  status: string;
  title?: string | null;
  summary?: string | null;
  release_notes?: string | null;
  release_notes_at?: string | null;
  pr_number?: number | null;
  pr_url?: string | null;
  updated_at?: string | null;
};

/**
 * A changelog entry is publishable only when the change actually shipped
 * (status `merged`) and there is human-readable release copy to show. Drafts,
 * abandoned, and PR-open changesets are never auto-published.
 */
export function shouldPublishChangelog(cs: ChangesetForChangelog): boolean {
  return cs.status === "merged" && !!(cs.release_notes && cs.release_notes.trim());
}

/**
 * Derive the changelog headline. Prefer the changeset title; fall back to the
 * first line of the release notes, then a generic shipped label. Never returns
 * empty so the list always renders something meaningful.
 */
export function changelogTitleFor(cs: ChangesetForChangelog): string {
  const title = (cs.title ?? "").trim();
  if (title) return title.slice(0, 200);
  const firstLine = (cs.release_notes ?? "")
    .split(/\r?\n/)
    .map((l) => l.replace(/^#+\s*/, "").trim())
    .find((l) => l.length > 0);
  if (firstLine) return firstLine.slice(0, 200);
  return "Shipped an update";
}

export type ChangelogRow = {
  user_id: string;
  workspace_id: string;
  product_id: string | null;
  changeset_id: string;
  prd_id: string | null;
  title: string;
  body: string;
  pr_number: number | null;
  pr_url: string | null;
  released_at: string;
};

/**
 * Shape a publishable changeset into a `changelog_entries` upsert row. The DB
 * unique key is (changeset_id), so re-publishing the same merge is idempotent.
 * `released_at` falls back to release_notes_at, then the supplied now() - the
 * column is `released_at` (confirmed against the live schema; an earlier,
 * never-applied migration used `published_at`, which the table never had).
 */
export function changelogRowFor(cs: ChangesetForChangelog, now: string): ChangelogRow | null {
  if (!shouldPublishChangelog(cs)) return null;
  return {
    user_id: cs.user_id ?? "",
    workspace_id: cs.workspace_id,
    product_id: cs.product_id ?? null,
    changeset_id: cs.id,
    prd_id: cs.prd_id ?? null,
    title: changelogTitleFor(cs),
    body: (cs.release_notes ?? "").trim(),
    pr_number: cs.pr_number ?? null,
    pr_url: cs.pr_url ?? null,
    released_at: cs.release_notes_at ?? now,
  };
}

/**
 * Group already-fetched entries by product, in first-seen order. Generic over
 * any entry shape carrying `product_name` so this pure module never needs to
 * import the server-fn-adjacent `ChangelogEntry` type (OBS-10, folded from the
 * retired /changelog page's local helper of the same name).
 */
export function groupByProduct<T extends { product_name?: string | null }>(
  entries: T[],
): Array<{ label: string; entries: T[] }> {
  const groups = new Map<string, T[]>();
  for (const e of entries) {
    const label = e.product_name ?? "Unassigned";
    const arr = groups.get(label) ?? [];
    arr.push(e);
    groups.set(label, arr);
  }
  return Array.from(groups.entries()).map(([label, es]) => ({ label, entries: es }));
}

/**
 * The track a changeset's mission served, resolved changeset -> mission ->
 * track (P-14b, A-QUEUE.md). `changelog_entries` carries only `changeset_id`;
 * neither `missions` nor `studio_changesets` carries a `track_id` column at
 * all -- only the run that recorded it does (`agent_runs`, the same table and
 * the same last-non-null-wins-per-mission rule `listMissions` already uses:
 * a mission's runs all serve one piece of work, so an older run that recorded
 * the track is still telling the truth even when a newer one predates the
 * link). Most releases predate the spine and resolve to `null` -- that is a
 * real absence, not a bug, and every caller must treat it as "no door" rather
 * than guess a destination.
 */
export function trackIdByChangeset(
  changesets: readonly { id: string; mission_id: string | null }[],
  runs: readonly { mission_id: string | null; track_id: string | null }[],
): Map<string, string | null> {
  const missionByChangeset = new Map<string, string>();
  for (const c of changesets) {
    if (c.mission_id) missionByChangeset.set(c.id, c.mission_id);
  }
  const trackByMission = new Map<string, string>();
  for (const r of runs) {
    if (r.mission_id && r.track_id) trackByMission.set(r.mission_id, r.track_id);
  }
  const result = new Map<string, string | null>();
  for (const [changesetId, missionId] of missionByChangeset) {
    result.set(changesetId, trackByMission.get(missionId) ?? null);
  }
  return result;
}
