/**
 * THE OPEN QUESTIONS SECTION — DRAWN ALWAYS, ANSWERED IN PLACE. GAP #29 / S1-Q1.
 *
 * The words, the states and the record text are all in
 * `an-empty-list-is-not-a-clean-bill.ts`, which carries the measurement and the
 * component check. This file is the mount and nothing else.
 *
 * ── IT TAKES THE SHAPE, IT DOES NOT READ THE ROW ──────────────────────────
 * `QUEUE-S1.md` S1-Q1 is explicit: *"The reader is mine and queued — until it
 * lands, build against the shape, not against a client-side read of `payload`
 * (you already ruled that out yourself and you were right)."* So `questions`
 * arrives as a prop. When S0's reader lands this is one wiring line, and until
 * then the section is honest about not having read: `null` renders
 * *"I could not read what was left unsettled"* rather than an empty list.
 *
 * ── THE WRITE PATH IS `steerTrack`, WHICH ALREADY EXISTS AND IS PROVEN ────
 * The queue says **"Do not build a second ask mechanism."** An answer is written
 * as a track-scoped steer — the loop consumes it as operator guidance mid-step,
 * and `TrackActivity` already renders it as *"You said"* with *"not picked up
 * yet"* until something takes it. **So "the transcript shows who answered" is
 * already built**; this only has to write into it.
 *
 * Measured 2026-08-31: the one track-scoped steer on record was consumed **50
 * seconds** after it was written.
 */
import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { failureLine } from "@/lib/error-copy";
import { steerTrack } from "@/lib/spine/track.functions";
import { getTrackHandoffs } from "@/lib/handoffs.functions";
import { Action, RecordSpeaks } from "@/components/meridian/surface-parts";
import { Row } from "@/components/meridian/rows";
import { ReasonField } from "@/components/meridian/forms";
import {
  answerRecord,
  canRaiseOne,
  openQuestionsLine,
  openQuestionsState,
  proceedRecord,
  raisedRecord,
} from "@/components/track/an-empty-list-is-not-a-clean-bill";

export function OpenQuestions({
  trackId,
  stationLabel,
  stationRan,
}: {
  trackId: string;
  /** Whose questions these are, in the product's own word for that station. */
  stationLabel: string;
  stationRan: boolean;
}) {
  const qc = useQueryClient();
  const fSteer = useServerFn(steerTrack);
  const fHandoffs = useServerFn(getTrackHandoffs);

  /*
   * S0'S READER, AND THE ONE THING IT KNOWS THAT A JOIN COULD NOT.
   * `agent_messages.track_id` was NULL on all 143 handoffs -- the writer never
   * set it -- so the obvious direct join returns zero rows for every track and
   * reads as "no station has handed anything on". A false negative with no
   * symptom. `getTrackHandoffs` takes the direct edge and falls back to the
   * mission join, which is the only reason the existing rows are legible.
   */
  const q = useQuery({
    queryKey: ["track-handoffs", trackId],
    queryFn: () => fHandoffs({ data: { trackId } }),
  });

  /*
   * WHILE THE READ IS IN FLIGHT WE HAVE NOT READ, so `null` is the honest input
   * and the section says it cannot tell. It is the same rule `RunPresence`
   * learned the hard way: a state derived during the first read must be TRUE,
   * and "the station filed none" during a pending read is not.
   */
  const state = openQuestionsState({
    handoffs: q.data?.handoffs ?? null,
    stationRan,
  });

  /** Which question has its field open. `"raise"` is the filed-none inversion. */
  const [open, setOpen] = React.useState<string | null>(null);

  const send = useMutation({
    mutationFn: (message: string) => fSteer({ data: { trackId, message } }),
    onSuccess: (r) => {
      if (!r?.steered) return;
      setOpen(null);
      /*
       * The answer's home is the transcript, so that is what has to repaint.
       * Same key `SteerComposer` invalidates -- one writer, one refresh, rather
       * than a second cache convention for the same row.
       */
      void qc.invalidateQueries({ queryKey: ["track-said", trackId] });
    },
  });

  const commit = (message: string) => send.mutate(message);

  return (
    <>
      {/*
       * THE LINE IS UNCONDITIONAL. A section that hides when empty would have
       * rendered on 2 of 143 handoffs and hidden the finding on the other 141,
       * which is the whole of #29.
       */}
      <RecordSpeaks>{openQuestionsLine(state, stationLabel)}</RecordSpeaks>

      {state.kind === "asked"
        ? state.questions.map((q) => (
            <React.Fragment key={q}>
              <Row
                lead={q}
                action={
                  open === q ? null : (
                    <Action variant="quiet" onClick={() => setOpen(q)}>
                      Answer
                    </Action>
                  )
                }
              />
              {open === q ? (
                <>
                  <ReasonField
                    id={`answer-${hash(q)}`}
                    label={q}
                    hint="It goes to the work as an instruction and stays in the record, so the next step reads your answer rather than guessing."
                    placeholder="Follow the v2 convention. It is the one the fraud team already uses."
                    commitLabel="Send this answer"
                    cancelLabel="Not now"
                    busy={send.isPending}
                    onCommit={(text) => commit(answerRecord(q, text))}
                    onCancel={() => setOpen(null)}
                  />
                  {/*
                   * PROCEED ANYWAY IS AN ANSWER, NOT A DISMISSAL (§4.3). It
                   * writes the same kind of record, and the record says the
                   * question is still open -- so the next station reads "a
                   * person met this and chose to go on", never a clean sheet.
                   * A control that merely closed the question would recreate
                   * the exact silence `filed-none` exists to flag.
                   */}
                  <Action
                    variant="quiet"
                    busy={send.isPending}
                    onClick={() => commit(proceedRecord(q))}
                  >
                    Go ahead without settling this
                  </Action>
                </>
              ) : null}
            </React.Fragment>
          ))
        : null}

      {/*
       * THE INVERSION. When the station recorded nothing, the person's move is
       * the other direction: name what is unsettled. §4.3 -- "the open questions
       * are where the person is actually worth something."
       */}
      {canRaiseOne(state) ? (
        open === "raise" ? (
          <ReasonField
            id="raise-open-question"
            label="What is still unsettled?"
            hint="It goes to the work as an instruction and stays in the record, so this does not travel on as though nothing was in doubt."
            placeholder="Do we have to keep the old address format working for existing customers?"
            commitLabel="Add it"
            cancelLabel="Not now"
            busy={send.isPending}
            onCommit={(text) => commit(raisedRecord(text))}
            onCancel={() => setOpen(null)}
          />
        ) : (
          <Action variant="quiet" onClick={() => setOpen("raise")}>
            Say what is unsettled
          </Action>
        )
      ) : null}

      {/*
       * IT NEVER CLAIMS DELIVERY IT DID NOT GET, which is the rule
       * `SteerComposer` already states for this same server function: a refused
       * write renders its reason verbatim rather than a cheerful confirmation.
       */}
      {send.data && !send.data.steered && send.data.problems.length ? (
        <RecordSpeaks>{send.data.problems.join(" ")}</RecordSpeaks>
      ) : null}
      {send.isError ? (
        <RecordSpeaks>
          {failureLine("That did not reach the run, so nothing was recorded.", send.error)}
        </RecordSpeaks>
      ) : null}
    </>
  );
}

/** A stable id for the field's label binding. Not security, just a DOM id. */
function hash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

export default OpenQuestions;
