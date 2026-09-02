/**
 * THE FOOTER UNDER BOTH PANES (THE-ONE-SCREEN:21).
 *
 * What mode the work is in, the one control that changes it, and what it has
 * cost so far. It spans the two panes because it is about the RUN rather than
 * about either half of it, and it is the last thing in the column so a person's
 * eye lands on it after reading whichever side they came for.
 *
 * ── WHY IT REPLACES CONTROLS RATHER THAN ADDING ONE ───────────────────────
 * Stop used to live inside the drive control, which is also where Run it lived,
 * so the only way to stop a run was to look in the same box you started it from
 * and hope it was still on screen in a long transcript. Both now live here, and
 * they are ONE control: a run is either moving or it is not, so the button says
 * Stop or it says Run it now and never both. There is exactly one of each in
 * this surface and it is this one.
 *
 * ── THE CLOCK AND THE BILL CAME DOWN HERE TOO ─────────────────────────────
 * They were a bordered `Run it has cost` region at the bottom of the RIGHT pane
 * (`RunCost`), below the artifacts, which put the two figures a person checks
 * most often behind a scroll on the side of the screen they were not reading.
 * They are facts about the run rather than about anything the run made, so they
 * belong on the bar that is about the run. Both are refused where nothing
 * measured them: see `GotYou`'s `runTally`, which is where they are computed, so
 * the strip at the top of the pane and this bar cannot print different numbers.
 *
 * ── EVERY WORD IS DERIVED, NONE IS DECORATION ─────────────────────────────
 * `footerMode` takes five facts that all come from rows or from this tab's own
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
  because,
  walking,
  crewLive,
  onStop,
  onRun,
  stopping,
  starting,
  elapsed,
  cost,
}: {
  status: "open" | "done" | "abandoned";
  tone: "you" | "hold" | null;
  /** `track.holdReason`, the raw column. `tone` is derived from it and cannot
   *  answer whether anything will drive this again; see `footer-mode.ts`. */
  hold: string | null;
  /** `track.holdBecause`, for the person-stopped case only. See `stoppedByYou`. */
  because: string | null;
  walking: boolean;
  crewLive: boolean;
  onStop: () => void;
  onRun: () => void;
  /** A stop this tab has asked for and not yet had answered. */
  stopping?: boolean;
  /** A press this tab has made and not yet had answered. */
  starting?: boolean;
  /** Total measured work time, or null when no turn recorded one. */
  elapsed?: string | null;
  /** Total recorded spend, or null when nothing recorded a price. */
  cost?: string | null;
}) {
  const mode = footerMode({ status, tone, hold, because, walking, crewLive });

  return (
    /*
     * A BAR, NOT A FOURTH BOX. The workbench already stacks a bordered header
     * and two bordered panes; adding a card under them made a screen that reads
     * as a dashboard of containers rather than one surface. A status bar is
     * also the truer form for what this carries: mode, one control and two
     * figures, always present, never competing with the work above it. One
     * hairline separates it, and the type is quiet, because a footer that shouts
     * is a footer people stop reading.
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

      <div className="flex flex-wrap items-center gap-mrd-3">
        {/*
         * THE CLOCK AND THE BILL, LEFT OF THE CONTROL.
         *
         * `tabular-nums` because both tick: a figure that changes width shifts
         * the button beside it, and a control that moves under the cursor is the
         * one thing a footer must not do. Absent entirely where nothing measured
         * them -- `0s` and `$0.00` are what a finalizer that did not write looks
         * like, not what a free instant run looks like, and this bar is not the
         * place that confuses the two.
         */}
        {elapsed ? (
          <span className="font-mrd-mono text-mrd-data tabular-nums text-mrd-mute">{elapsed}</span>
        ) : null}
        {cost ? (
          <span className="font-mrd-mono text-mrd-data tabular-nums text-mrd-mute">{cost}</span>
        ) : null}

        {/*
         * ONE CONTROL, NEVER TWO. `canStop` and `canRun` are never both true,
         * and a settled run is neither, which is why they are two booleans
         * rather than one flag: the third case has to be able to draw nothing.
         */}
        {mode.canStop ? (
          <Action variant="quiet" busy={stopping} onClick={onStop}>
            {stopping ? "Stopping" : "Stop after this step"}
          </Action>
        ) : mode.canRun ? (
          <Action variant="primary" busy={starting} onClick={onRun}>
            {starting ? "Walking the route" : "Run it now"}
          </Action>
        ) : null}
      </div>
    </footer>
  );
}

export default RunFooter;
