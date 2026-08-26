/**
 * THE FOOTER UNDER BOTH PANES (THE-ONE-SCREEN:21).
 *
 * One sentence saying what mode the work is in, and the Stop. It spans the two
 * panes because it is about the RUN rather than about either half of it, and it
 * is the last thing in the column so a person's eye lands on it after reading
 * whichever side they came for.
 *
 * ── WHY IT REPLACES A CONTROL RATHER THAN ADDING ONE ──────────────────────
 * The Stop lived inside the drive control, which is also where Run it lives, so
 * the only way to stop a run was to look in the same box you started it from
 * and hope it was still on screen in a long transcript. Moving it here is what
 * the ruling asks for and it does NOT duplicate: there is exactly one Stop in
 * this surface and it is this one.
 *
 * ── EVERY WORD IS DERIVED, NONE IS DECORATION ─────────────────────────────
 * `footerMode` takes four facts that all come from rows or from this tab's own
 * press, and the file next door argues each branch. Nothing here counts
 * anything, because a route that waives and reopens stations has no position to
 * report.
 */
import { Action } from "@/components/meridian/surface-parts";
import { footerMode } from "@/components/track/footer-mode";

export function RunFooter({
  status,
  tone,
  walking,
  crewLive,
  onStop,
}: {
  status: "open" | "done" | "abandoned";
  tone: "you" | "hold" | null;
  walking: boolean;
  crewLive: boolean;
  onStop: () => void;
}) {
  const mode = footerMode({ status, tone, walking, crewLive });

  return (
    <footer
      data-mrd=""
      className="flex flex-wrap items-center justify-between gap-mrd-3 rounded-mrd-pane border border-mrd-line bg-mrd-sheet px-mrd-6 py-mrd-4"
    >
      {/*
       * `aria-live` polite: the mode changes as the run moves, and a person who
       * is not watching the pane still needs to be told it started asking. The
       * transcript a11y work settled that a silent live surface is a defect.
       */}
      <p aria-live="polite" className="min-w-0 text-mrd-body text-mrd-ink">
        {mode.line}
      </p>

      {mode.canStop ? (
        <Action variant="quiet" onClick={onStop}>
          Stop after this leg
        </Action>
      ) : null}
    </footer>
  );
}

export default RunFooter;
