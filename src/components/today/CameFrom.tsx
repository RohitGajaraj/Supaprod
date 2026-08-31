/**
 * WHERE THIS CAME FROM, AND WHAT IT FED — the board's half of §0.5's connectedness.
 *
 * `OPERATING-MODEL` §0.5: *"Every object shows, in place: what produced it, and
 * what it feeds. That is one line on each, clickable… **We built the graph and
 * never drew it.**"* That is platform-strength rank **#3**, and one of the three
 * things §0.5 allows a unit to be — *"draws a connection that already exists in
 * the data."*
 *
 * ── IT WAS DRAWN, JUST NOWHERE A PERSON LIVES ─────────────────────────────
 * `getLineageGraph`'s **only** consumer is `AuditLineageSheet.tsx`, which lives
 * in `src/components/supaprod/**` — a **frozen** prefix under §0.7. The sheet
 * itself is mounted app-wide in `AppFrame.tsx:2487`, which is MY file, and
 * `openLineage(ref)` opens it from anywhere. **Before this, my prefix offered
 * that gesture on exactly zero objects**: every caller was S1's `discover`/`ask`
 * or the frozen `supaprod`.
 *
 * So this adds no read, no route, no sheet and no component tree. **It is one
 * control onto machinery that was already mounted and already paid for.**
 *
 * ── THE EDGES ARE REAL, WHICH IS WHY THIS IS NOT THE THIRD DEAD SURFACE ───
 * Measured 2026-08-31, service-role, `artifact_lineage` — ~2,150 edges:
 *
 *   signal -> theme 1507 · mission -> decision 253 · learning -> decision 71
 *   mission -> changeset 27 · changeset -> deployment 14 · learning -> opportunity 11
 *
 * That last one is the loop closing on itself. **And they cover this surface's
 * own rows: 24 of 34 board missions carry lineage** (24 have what it fed, 7 have
 * what produced it). My brief's test — *"a dedupe screen that returns nothing is
 * worse than none"* — is passed by measurement rather than by hope, and the
 * remaining 10 open a sheet that renders Meridian's `NothingHere` rather than a
 * false claim.
 *
 * ── WHY THE GESTURE AND NOT THE LINE, SAID PLAINLY ────────────────────────
 * §0.5 asks for *"one line on each, clickable"* and this is the **clickable**
 * half only. The line needs counts per row, and `getLineageGraph` resolves ONE
 * entity per call — so a line on a 34-row board is 34 server calls on the first
 * paint of the only surface a signed-in person lands on. `HandoverNote` gets
 * away with a per-row line because it rides a workspace-wide read; there is no
 * workspace-wide lineage read, and building one is `src/lib/**`, which is S0's.
 * **Filed rather than faked.**
 *
 * ── TWO THINGS IT REFUSES TO DO ───────────────────────────────────────────
 * **It is never offered on a track row.** `AUDIT_KINDS` has `mission` and has no
 * entry for a spine track, so a track ref would resolve to nothing — an offer
 * that cannot be honoured, which is worse than no offer. `CrewRow.isTrack`
 * already marks them, for the same class of reason the Stop verb skips them.
 *
 * **The word is not "lineage" and it is certainly not "provenance."** §12: if a
 * person would not say it out loud to a colleague it does not go on a surface,
 * and *provenance* is on the positioning canon's outright ban list. The control
 * says what it does.
 */
import { openLineage } from "@/components/supaprod/AuditLineageSheet";
import { formatAuditId } from "@/lib/audit-id";
import { lineageLine } from "@/components/today/lineage-line";
import type { LineageCounts } from "@/lib/lineage-graph";

/**
 * The trace ref for a mission row.
 *
 * **Six characters of a uuid collide, and that is fine here.** Measured: 14
 * collisions across 397 missions. It is not a defect and must not be "fixed" by
 * a caller inventing a longer ref — `audit-lineage.functions.ts` resolves a tag
 * by prefix RANGE and accepts 6–32 characters, and where a short is ambiguous
 * **the resolver reports `ambiguous` with its candidates rather than guessing.**
 * A hashed or padded ref would break that lookup to fix a label.
 */
export function missionTraceRef(missionId: string): string {
  return formatAuditId("mission", missionId);
}

/**
 * One quiet control under a row, or nothing.
 *
 * Placed on the row's under-line rather than in the scan band beside the state,
 * because that band is a few words wide and already truncates a 250-character
 * hold sentence. R-20 §1: one accent for the one live fact — this is not it, so
 * it is drawn muted and it never competes with the row's own verb.
 */
export function CameFrom({
  missionId,
  isTrack,
  counts,
}: {
  missionId: string;
  isTrack?: boolean;
  /**
   * This row's entry from the batch read, when it answered.
   *
   * **Absent means unknown, never zero.** `getLineageCounts` returns
   * `counts: null` for a FAILED read rather than a board of zeroes, and the
   * label falls back to its question rather than claiming "came from 0".
   */
  counts?: LineageCounts | null;
}) {
  // A track has no audit kind, so it has no ref that could resolve. Silence.
  if (isTrack) return null;

  return (
    <button
      type="button"
      className="mrd-focus-inset rounded-mrd-xs px-mrd-2 pb-mrd-2 text-left text-mrd-data text-mrd-mute underline decoration-dotted underline-offset-2 hover:text-mrd-ink"
      onClick={(e) => {
        /* The whole row is a click target that opens the work. Without this,
           asking where something came from would navigate away from the row
           that asked. */
        e.stopPropagation();
        openLineage(missionTraceRef(missionId));
      }}
    >
      {lineageLine(counts)}
    </button>
  );
}
