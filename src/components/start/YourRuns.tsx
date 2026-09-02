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
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";

import { Row } from "@/components/meridian/rows";
import { Reading, ReadFailedLine, SectionHead } from "@/components/meridian/surface-parts";
import { StatusChip } from "@/components/meridian/StatusChip";
import { KIND_WORD } from "@/lib/spine/attach";
import { toolActionLabel } from "@/lib/agent-vocabulary";
import { relativeTime } from "@/lib/memory-view";
import { startRows, type StartRowKind } from "@/components/today/tracks-feed";
import { listRunsForStart } from "@/lib/spine/track.functions";

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

  const now = Date.now();
  const rows = React.useMemo(
    () => startRows(q.data ?? [], Date.now(), KIND_WORD, (tool) => toolActionLabel(tool)),
    // `q.data` is the only input that changes; the clock is read at render so a
    // row's own elapsed figure moves with the poll rather than with a timer.
    [q.data],
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

        {rows.map((r) => {
          const chip = CHIP[r.kind];
          return (
            <Row
              key={r.id}
              lead={r.title}
              /* THE ROW IS THE MIDDLE COLUMN. See `startRowMiddle`: every branch
                 reaches for the sharpest fact the record can source, so no two
                 rows print the same sentence unless the fact is identical. */
              sub={r.middle}
              time={r.at ? relativeTime(new Date(r.at).toISOString(), now) : null}
              onClick={() =>
                void navigate({ to: "/track/$trackId", params: { trackId: r.id }, search: {} })
              }
              action={
                chip ? (
                  <StatusChip status={chip.status} pulse={false}>
                    {chip.word}
                  </StatusChip>
                ) : undefined
              }
            />
          );
        })}
      </div>
    </section>
  );
}

export default YourRuns;
