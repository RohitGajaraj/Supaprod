/**
 * RPT-47 (finish): the pure core that turns a brief link + assumption status
 * into a ranking signal, so watched assumptions feed the opportunity order.
 *
 * A human ties an opportunity to a strategic top bet (opportunities
 * .linked_brief_item_id). Each top bet carries watched assumptions (FS-02); when
 * a signal contradicts one, it flips to 'challenged'. This maps that state to a
 * comparable tier the ranking comparator folds in, exactly like the existing
 * outcome-support seam:
 *   +1  linked to a STANDING bet whose assumptions still hold   -> rank up
 *   -1  linked to a bet with a CHALLENGED assumption            -> rank down
 *    0  not linked, or linked to a bet that is gone/superseded  -> neutral
 *
 * Pure and deterministic: the DB read that produces the map lives in the
 * server fn (brief-opportunity.functions.ts); this file just interprets it, so
 * the tiering is unit-tested without a database.
 */

/** Per standing top-bet brief item: whether any of its watched assumptions is challenged. */
export type BriefAlignmentEntry = { challenged: boolean };

/** brief_item_id -> its alignment entry. Only STANDING top-bet items appear; a
 * missing key means the bet is gone, superseded, or not a bet, i.e. neutral. */
export type BriefAlignmentMap = Record<string, BriefAlignmentEntry>;

export type Alignment = 1 | 0 | -1;

/**
 * The ranking tier for one opportunity's brief link. Neutral (0) unless the
 * opportunity is linked to a live top bet in the map; then a held assumption
 * lifts it (+1) and a challenged one sinks it (-1).
 */
export function alignmentForOpportunity(
  linkedBriefItemId: string | null | undefined,
  map: BriefAlignmentMap,
): Alignment {
  if (!linkedBriefItemId) return 0;
  const entry = map[linkedBriefItemId];
  if (!entry) return 0;
  return entry.challenged ? -1 : 1;
}
