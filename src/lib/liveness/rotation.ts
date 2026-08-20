/**
 * Which capabilities this run checks, and it is an ORDER BY rather than a cursor.
 *
 * ── WHY THIS EXISTS ─────────────────────────────────────────────────────
 * `buildLivenessReport` costs roughly two queries per tracked capability, and
 * both callers -- the admin page and `cron.liveness-tick` -- compute the whole
 * report inside one Cloudflare Worker invocation. A Worker caps outbound
 * subrequests, and `report.test.ts` holds the report at 45 for that reason,
 * where it currently sits EXACTLY. Measured 2026-08-20.
 *
 * So the limit was never the page's latency. **It was a hard cap on how many
 * capabilities this product may ever watch** -- 13, against 36 scheduled jobs --
 * and it is why coverage stalled at 2 of 36 rather than because nobody cared.
 *
 * ── THE RULE, AND WHY IT NEEDS NO STATE ─────────────────────────────────
 * Check the least-recently-checked few each run, write down when. Never-checked
 * first, then oldest.
 *
 * **There is deliberately no cursor.** A newly registered capability has no row,
 * sorts first, and is picked up on the next run. A run that dies half way leaves
 * its rows older than the rest, so the next run takes them without being told.
 * Registering a capability changes nothing except that it now sorts first.
 *
 * A cursor would have to be correct across restarts, registry edits, and partial
 * failures. **`checked_at` is already the answer to all three**, so the absence
 * of state is the feature: there is nothing here that can be wrong.
 */

/** One entry of the registry, reduced to what scheduling needs. */
export type RotationEntry = {
  id: string;
  kind: "capability" | "integrity" | "vocabulary";
};

/** A row of `liveness_results`, reduced to what scheduling reads. */
export type StoredCheck = {
  capability_id: string;
  checked_at: string | null;
};

/**
 * How many entries one run checks.
 *
 * Six, because an integrity check with segments is the most expensive thing in
 * the registry at `2 + 2N` queries, and six of those worst-case entries stays
 * under the cap with room to spare. It is deliberately NOT tuned to the current
 * registry: the whole point is that the registry may now grow without this
 * number moving.
 */
export const ROTATION_BATCH = 6;

/**
 * The entries due for a check, oldest first, capped at `limit`.
 *
 * An entry with no stored row has never been checked and outranks every entry
 * that has, however old. That ordering is what makes registering a capability
 * take effect on the next run rather than after a full cycle.
 *
 * Ties break on `id`, so a run is reproducible and a test can assert an exact
 * list rather than a set. Stored rows for ids no longer in the registry are
 * ignored rather than deleted here: a removed capability is a registry edit and
 * cleaning up after it is not this function's business.
 */
export function selectDueEntries(
  registry: RotationEntry[],
  stored: StoredCheck[],
  limit: number = ROTATION_BATCH,
): RotationEntry[] {
  if (limit <= 0) return [];

  const checkedAt = new Map<string, number | null>();
  for (const row of stored) {
    const t = row.checked_at ? Date.parse(row.checked_at) : Number.NaN;
    checkedAt.set(row.capability_id, Number.isFinite(t) ? t : null);
  }

  return [...registry]
    .sort((a, b) => {
      const ta = checkedAt.has(a.id) ? checkedAt.get(a.id) : undefined;
      const tb = checkedAt.has(b.id) ? checkedAt.get(b.id) : undefined;

      /*
       * Never checked, or checked at a time nobody can read, both sort first.
       * An unparseable `checked_at` is treated as never rather than as now,
       * because the safe reading of "I cannot tell when this was checked" is to
       * check it, not to assume it is fresh.
       */
      const aNever = ta === undefined || ta === null;
      const bNever = tb === undefined || tb === null;
      if (aNever !== bNever) return aNever ? -1 : 1;
      if (!aNever && !bNever && ta !== tb) return (ta as number) - (tb as number);
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    })
    .slice(0, limit);
}
