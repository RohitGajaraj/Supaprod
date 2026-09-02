/**
 * ── YOUR RUNS: THE ONLY WAY A PERSON MEETS AN APPROVAL, A VERDICT OR A HOLD ─
 *
 * A1-REPORT §4 is explicit that this list is not a convenience: *"Rows are the
 * only way a person meets an approval, a verdict or a hold."* Everything that
 * used to be a door on this page -- the approvals queue, the inbox, the board's
 * own lanes -- collapses into one list of the person's own runs, and each row
 * carries the one sentence that says what its run is doing.
 *
 * ── THE REFERENCE, NAMED BEFORE BUILDING ──────────────────────────────────
 * Cursor's task list (Mobbin, pulled 2026-09-02): title, a status chip, and a
 * diff-stat chip -- `7 files +17 −0` -- which is the fact that tells one of its
 * rows from another. Devin's session list puts *"PR is ready"* under the title
 * as its one exception state. What is borrowed is the SHAPE and the discipline:
 * one row, one distinguishing fact, and the exception state said in words rather
 * than left to a colour. Our middle column is what the run is doing, because
 * that is what tells ours apart. See `startRowMiddle` in `tracks-feed.ts`.
 *
 * ── THREE STATES, AND THEY ARE THREE DIFFERENT THINGS ─────────────────────
 * Still reading, could not read, and genuinely no runs. This surface has paid
 * for confusing the last two before: `listTracks` returned `[]` for a failed
 * read and for an empty workspace alike, and the shell rendered both as
 * "Nothing is in flight" beside work that was moving. The read this list uses
 * raises rather than swallows, so the middle state is reachable and is said.
 */
import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";

import { Row } from "@/components/meridian/rows";
import {
  Action,
  Chevron,
  Reading,
  ReadFailedLine,
  SectionHead,
} from "@/components/meridian/surface-parts";
import { StatusChip } from "@/components/meridian/StatusChip";
import { KIND_WORD } from "@/lib/spine/attach";
import { toolActionLabel } from "@/lib/agent-vocabulary";
import { relativeTime } from "@/lib/memory-view";
import {
  abandonedLine,
  groupStartRows,
  startRows,
  type StartRow,
  type StartRowKind,
} from "@/components/today/tracks-feed";
import { listRunsForStart, pinTrack } from "@/lib/spine/track.functions";

/**
 * The word on the chip, and only where a chip earns its place.
 *
 * `running` gets none: on a list where several rows are moving, a chip on each
 * of them is the "every pending row blinks" failure `run-strip` states the rule
 * for, and the middle column already says a seat is working with a clock on it.
 * `waiting` gets none either, because "waiting" is what a list of runs mostly
 * is and a chip that appears on the majority of rows sorts nothing.
 */
const CHIP: Partial<Record<StartRowKind, { status: "you" | "pass" | "fail"; word: string }>> = {
  "needs-you": { status: "you", word: "Needs you" },
  finished: { status: "pass", word: "Finished" },
  abandoned: { status: "fail", word: "Abandoned" },
};

/** One run. Lifted so the open list and the abandoned one cannot diverge. */
function RunRow({
  r,
  now,
  onOpen,
  onPin,
  pinning,
}: {
  r: StartRow;
  now: number;
  onOpen: (id: string) => void;
  onPin: (id: string, pinned: boolean) => void;
  pinning: boolean;
}) {
  const chip = CHIP[r.kind];
  /*
   * ── THE PIN IS OFFERED ONLY WHERE IT WOULD DO SOMETHING ─────────────────
   *
   * It changes what the SWEEP takes next, and the sweep never takes a finished
   * or abandoned run. A control on one of those would move a row up a list and
   * change nothing about the work, which is the affordance failure this surface
   * has already paid for twice.
   */
  const canPin = r.kind !== "finished" && r.kind !== "abandoned";
  return (
    <Row
      lead={r.title}
      /* THE ROW IS THE MIDDLE COLUMN. See `startRowMiddle`: every branch reaches
         for the sharpest fact the record can source, so no two rows print the
         same sentence unless the fact is identical -- and where the facts really
         are identical and the work is over, `groupStartRows` folds them into one
         row that says how many, because inventing a difference is the opposite
         defect. */
      sub={r.middle}
      time={r.at ? relativeTime(new Date(r.at).toISOString(), now) : null}
      onClick={() => onOpen(r.id)}
      action={
        /*
         * `Row`'s `action` sits OUTSIDE the clickable region by its own
         * contract, so a control here is never a button inside a button. The
         * state word comes first because it is a fact; the control is quiet
         * because pinning is a preference, not the run's own verdict.
         */
        <span className="flex items-center gap-mrd-2">
          {r.pinnedAt ? (
            <StatusChip status="you" pulse={false}>
              First
            </StatusChip>
          ) : chip ? (
            <StatusChip status={chip.status} pulse={false}>
              {chip.word}
            </StatusChip>
          ) : null}
          {canPin ? (
            <Action variant="quiet" busy={pinning} onClick={() => onPin(r.id, !r.pinnedAt)}>
              {r.pinnedAt ? "Unpin" : "Put first"}
            </Action>
          ) : null}
        </span>
      }
    />
  );
}

export function YourRuns() {
  const navigate = useNavigate();
  const fRuns = useServerFn(listRunsForStart);
  const q = useQuery({
    queryKey: ["start-runs"],
    queryFn: () => fRuns(),
    /*
     * Ten seconds, which is the beat the run screen polls on. A person who
     * starts a run and comes back here should see it moving on the same clock
     * they watched it on, and a second cadence is how two surfaces come to
     * disagree about whether something is working.
     */
    refetchInterval: 10_000,
  });

  const [showAbandoned, setShowAbandoned] = React.useState(false);
  const now = Date.now();
  const rows = React.useMemo(
    () => startRows(q.data ?? [], Date.now(), KIND_WORD, (tool) => toolActionLabel(tool)),
    // `q.data` is the only input that changes; the clock is read at render so a
    // row's own elapsed figure moves with the poll rather than with a timer.
    [q.data],
  );
  const groups = React.useMemo(() => groupStartRows(rows), [rows]);
  /*
   * PINNING RE-READS THE LIST RATHER THAN GUESSING AT IT. The order is decided
   * by `startRows`, which reads the pin off the row, so the honest way to show a
   * new pin is to ask again. An optimistic reorder would show an order the sweep
   * may not agree with, and the sweep is the thing the pin is FOR.
   */
  const qc = useQueryClient();
  const fPin = useServerFn(pinTrack);
  const pin = useMutation({
    mutationFn: (v: { trackId: string; pinned: boolean }) => fPin({ data: v }),
    onSettled: () => void qc.invalidateQueries({ queryKey: ["start-runs"] }),
  });

  const open = React.useCallback(
    (id: string) => void navigate({ to: "/track/$trackId", params: { trackId: id }, search: {} }),
    [navigate],
  );

  return (
    <section data-mrd="" className="flex flex-col gap-mrd-2 font-mrd" aria-label="Your runs">
      <SectionHead>Your runs</SectionHead>
      {/*
       * `aria-live` polite, because rows change under a reader without any act
       * of theirs: a seat finishes, a gate opens, a run is graded. The rest of
       * this page is static and this is the part that moves.
       */}
      <div aria-live="polite" className="flex flex-col">
        {q.isLoading ? <Reading>Reading your runs.</Reading> : null}

        {q.isError ? (
          /*
           * NOT "NOTHING RUNNING". A failed read and an empty workspace are
           * different facts, and this surface has already shipped the version
           * that confused them.
           */
          <ReadFailedLine error={q.error} onRetry={() => void q.refetch()}>
            Your runs did not load. Whatever is running is still running; this list just could not
            read it.
          </ReadFailedLine>
        ) : null}

        {!q.isLoading && !q.isError && rows.length === 0 ? (
          <p className="text-mrd-base text-mrd-mute">Nothing running. Start one above.</p>
        ) : null}

        {groups.shown.map((r) => (
          <RunRow
            key={r.id}
            r={r}
            now={now}
            onOpen={open}
            onPin={(trackId, pinned) => pin.mutate({ trackId, pinned })}
            pinning={pin.isPending}
          />
        ))}

        {/*
         * ── ABANDONED WORK IS BEHIND ONE LINE, CLOSED ───────────────────────
         *
         * Walked on Helio Labs: ten rows of one abandoned e2e spec plus a dozen
         * more abandoned runs filled the whole page below the fold, and the list
         * a person came to read was underneath them. It is the one kind that is
         * finished AND arrived nowhere, so it is worth being able to find and
         * worth nothing at the top of a page. The count is in the line that
         * opens it: nothing hidden, nothing in the way.
         */}
        {groups.abandonedCount > 0 ? (
          <div className="flex flex-col">
            <button
              type="button"
              aria-expanded={showAbandoned}
              onClick={() => setShowAbandoned((v) => !v)}
              className="mrd-focus-inset flex w-fit items-center gap-1.5 rounded-mrd-chip py-1 text-mrd-data text-mrd-mute transition-colors duration-100 hover:text-mrd-ink"
            >
              <Chevron open={showAbandoned} />
              <span>{abandonedLine(groups.abandonedCount)}</span>
            </button>
            {showAbandoned
              ? groups.abandoned.map((r) => (
                  <RunRow
                    key={r.id}
                    r={r}
                    now={now}
                    onOpen={open}
                    onPin={(trackId, pinned) => pin.mutate({ trackId, pinned })}
                    pinning={pin.isPending}
                  />
                ))
              : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default YourRuns;
