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
  hold,
  walking,
  crewLive,
  onStop,
}: {
  status: "open" | "done" | "abandoned";
  tone: "you" | "hold" | null;
  /** `track.holdReason`, the raw column. `tone` is derived from it and cannot
   *  answer whether anything will drive this again; see `footer-mode.ts`. */
  hold: string | null;
  walking: boolean;
  crewLive: boolean;
  onStop: () => void;
}) {
  const mode = footerMode({ status, tone, hold, walking, crewLive });

  return (
    /*
     * A BAR, NOT A FOURTH BOX. The workbench already stacks a bordered header
     * and two bordered panes; adding a card under them made a screen that reads
     * as a dashboard of containers rather than one surface. A status bar is
     * also the truer form for what this carries: mode and one control, always
     * present, never competing with the work above it. One hairline separates
     * it, and the type is quiet, because a footer that shouts is a footer people
     * stop reading.
     */
    <footer
      data-mrd=""
      className="flex flex-wrap items-center justify-between gap-mrd-3 border-t border-mrd-line px-mrd-2 pt-mrd-4"
    >
      {/*
       * `aria-live` polite: the mode changes as the run moves, and a person who
       * is not watching the pane still needs to be told it started asking. The
       * transcript a11y work settled that a silent live surface is a defect.
       */}
      <p aria-live="polite" className="min-w-0 text-mrd-base text-mrd-mute">
        {mode.line}
        {/*
         * WHETHER THIS PAGE IS REQUIRED, in the same breath as the mode.
         *
         * SESSION-1's second unit: "I'm on it, you can leave this page." The
         * mode line says the same words for a run the loop is driving and a run
         * THIS TAB is buying legs for, and those are opposite answers to the
         * only question a person leaving actually has. See `footer-mode.ts`.
         *
         * Same paragraph rather than a second line, because it is a clause of
         * the mode and not a new fact, and because the footer already carries
         * `aria-live`: a separate element would announce on its own.
         */}
        {mode.leave ? <span className="text-mrd-faint"> {mode.leave}</span> : null}
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
