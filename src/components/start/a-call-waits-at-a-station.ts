/**
 * ── THE ROAD DID NOT KNOW WHAT WAS WAITING FOR YOU ────────────────────────
 *
 * MEASURED ON THE SERVED HOME, 2026-09-10 00:43 UTC, workspace A1 delete
 * probe:
 *
 *   the headline   "4 design gates and 2 other calls are waiting for you."
 *   the road        build 3 · decide 3 · learn 2 · DESIGN nothing at all
 *
 * Both numbers were right and neither could be reconciled with the other,
 * because they are different units read from different tables that were never
 * joined. `count` on the road is `spine_tracks.station` -- how many runs stand
 * at a stop. The gates are `prds.design_gate_status = 'pending'` -- four of
 * them, and `APPROVAL_KIND_STATION` maps `design_gate -> design`. So the
 * product already knew those four calls belonged at Design, and the one
 * drawing whose whole job is to show where work stands drew Design as a
 * station nothing had reached.
 *
 * A person reading the entry top-to-bottom got the road saying nothing is
 * happening at Design and the headline saying four things wait for them at
 * design. That is the founder's *"nothing joins up"* and *"it reads as a dump
 * of data"* in the space of forty pixels.
 *
 * WHY THIS IS A FOLD AND NOT A READ. The home already holds the queue
 * (`queueRead`), and every item already carries its `kindKey`. Nothing new is
 * fetched: this is the join that was missing, done on data already on the
 * page.
 *
 * WHY IT LIVES HERE RATHER THAN IN THE ROAD. `Journey` is the design system
 * and must not know what an approval is. It takes a number per station and
 * paints it. Deciding which station a call belongs to is product knowledge,
 * so it stays on the product side of that line.
 */
import { APPROVAL_KIND_STATION, type ApprovalKind } from "@/lib/approvals-queue.functions";
import type { AgentStation } from "@/lib/agent-vocabulary";

/**
 * How many calls wait on the person at each station.
 *
 * Kinds with no station stay out rather than landing in a default bucket.
 * `trust_graduation` and `playbook_proposal` are the two the map does not
 * place, and they are workspace-wide rather than about one stop on the road --
 * putting them on a station would be inventing a location for them, and a
 * number in the wrong place is worse on this drawing than a number missing
 * from it. The headline still counts them; it counts the whole queue.
 */
export function waitingByStation(
  kinds: readonly ApprovalKind[],
): Partial<Record<AgentStation, number>> {
  const out: Partial<Record<AgentStation, number>> = {};
  for (const kind of kinds) {
    const station = APPROVAL_KIND_STATION[kind];
    if (!station) continue;
    out[station] = (out[station] ?? 0) + 1;
  }
  return out;
}

/**
 * The stations a call is waiting at, in road order, named for a sentence.
 * Empty when nothing is waiting anywhere the map can place.
 */
export function stationsWaitingOnYou(
  waiting: Partial<Record<AgentStation, number>>,
  order: readonly AgentStation[],
): AgentStation[] {
  return order.filter((key) => (waiting[key] ?? 0) > 0);
}
