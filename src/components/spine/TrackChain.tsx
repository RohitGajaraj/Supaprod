/**
 * What one piece of work has actually produced, station by station.
 *
 * THE DOOR THAT WAS MISSING. `spine_track_members` was written correctly from
 * the day the attachment pass landed and read by nothing. The single read in
 * the product, `missionForTrack`, filters to one kind and takes one row so the
 * Build station reuses its mission. Every signal, spec, task, cluster and code
 * change filed against a track had no reader at all, which is this repo's
 * dominant defect wearing better camouflage than usual: a table with SOME
 * traffic looks alive to every dead-code check there is.
 *
 * IT RENDERS THE ROUTE, NOT ONLY THE RECORD. A list built from rows that exist
 * would show an unbroken run of productive stations and quietly omit every
 * station that made nothing, which is most of them. Four of the seven have no
 * registered tool that writes their artifact, so a chain that hid them would
 * imply the work skipped them when it walked straight through. Each stop
 * therefore says where it sits, and an always-empty one says where its artifact
 * really comes from instead of reading as a stall somebody must go fix.
 *
 * ONE COLOUR ON THE WHOLE PANEL. Seven stops each carrying a status tone is a
 * traffic jam, and the restraint budget spends colour on the fact a person came
 * for: where the work is NOW. Everything else is quiet. The exception is an
 * artifact the record can no longer resolve, which is a real problem and is
 * allowed to look like one.
 */
import * as React from "react";
import { Row, Line } from "@/components/meridian/rows";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getTrackChain } from "@/lib/spine/track.functions";
import type { ChainMember, ChainStop, StopState } from "@/lib/spine/chain";
import { relativeTime } from "@/lib/memory-view";
import { Reading, ReadFailedLine, RecordSpeaks, Value } from "@/components/meridian/surface-parts";

/** Where the stop sits, in the words a person would use for it. */
const STATE_WORD: Readonly<Record<StopState, string>> = {
  passed: "done",
  here: "here now",
  "not-reached": "not reached",
  waived: "waived",
};

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * The row's headline.
 *
 * Three cases, and they are deliberately different sentences. A missing
 * artifact is stated outright rather than shown as a blank, because a blank
 * reads as a rendering bug and the fact is worth more than the tidiness. A
 * title we never resolved falls back to the kind alone and claims nothing: the
 * server only marks `missing` when a lookup actually came back without the row,
 * so an errored or unmapped lookup arrives here indistinguishable from an
 * untitled artifact, and neither deserves an assertion.
 */
function leadFor(m: ChainMember): string {
  if (m.missing) return `This ${m.word} is no longer there`;
  return m.title ?? cap(m.word);
}

function Stop({ stop, now }: { stop: ChainStop; now: number }) {
  // The waiver outranks the gap: a reason a person gave in their own words is
  // worth more than the product explaining where an artifact usually comes from.
  const sub = stop.waivedReason ?? stop.gap;

  return (
    <>
      <Line label={stop.label} sub={sub}>
        {/* `agent`, NOT `pass`, AND THE CHANGE IS THE POINT OF THE PORT.
            "here now" is where the work stands, which is present tense and not
            an outcome, and Meridian's green is only ever allowed to report an
            outcome. Painting it green said this station had SUCCEEDED at the
            moment it had not finished — the exact pair (`still deploying` /
            `deployed`) the tone vocabulary was rewritten to separate. Azure
            over-claims only where a station is parked with nothing running;
            green over-claimed on every stop it was drawn on. */}
        <Value tone={stop.state === "here" ? "agent" : "quiet"}>{STATE_WORD[stop.state]}</Value>
      </Line>
      {stop.members.map((m) => (
        <Row
          key={`${m.kind}:${m.artifactId}`}
          tight
          lead={leadFor(m)}
          time={relativeTime(m.createdAt, now)}
          action={
            m.missing ? (
              // `fail`, not `hold`. The lookup RAN and came back without the
              // row, so this is a settled negative outcome, and red is the one
              // colour allowed to report one. Meridian's amber means "stopped,
              // and not on you", which is false here: nothing is waiting, the
              // artifact is gone. This panel's header reserves its one colour
              // exception for exactly this case.
              <Value tone="fail">not found</Value>
            ) : m.title ? (
              <Value>{m.word}</Value>
            ) : null
          }
        />
      ))}
    </>
  );
}

export function TrackChain({ trackId }: { trackId: string }) {
  const fChain = useServerFn(getTrackChain);
  const q = useQuery({
    queryKey: ["spine-track-chain", trackId],
    queryFn: () => fChain({ data: { trackId } }),
  });

  // Read once per render, the same way MemoryReviewQueue does it, so every row
  // in one paint measures against one clock.
  const now = Date.now();

  if (q.isLoading) return <Reading>Reading the record.</Reading>;
  if (q.isError) {
    // The LINE half of the failed-read pair: this renders inside a region that
    // already draws its own container, and one sentence does not get a second
    // box around it.
    return (
      <ReadFailedLine>
        The record did not come back, so nothing here would be trustworthy.
      </ReadFailedLine>
    );
  }

  const chain = q.data?.chain;
  if (!q.data?.track || !chain) {
    return <ReadFailedLine>That work could not be found.</ReadFailedLine>;
  }

  return (
    <>
      <RecordSpeaks evidence={chain.total > 0 ? `${chain.total} filed` : undefined}>
        {q.data.summary}
      </RecordSpeaks>

      {chain.stops.map((stop) => (
        <Stop key={stop.station} stop={stop} now={now} />
      ))}

      {/* Almost always empty. It exists so that a member filed against a station
        this build does not recognise still appears, instead of being dropped on
        the floor by the very surface whose job is to be the complete record. */}
      {chain.orphans.length > 0 ? (
        <>
          <Line
            label="Filed somewhere we cannot place"
            sub="These belong to this work, but not to a station this version knows about."
          >
            {/* `hold`, and it is the one place amber is right on this panel.
                These members exist and are filed; they are parked outside the
                seven stations this build knows about, so nothing failed and
                nobody can act — "stopped, and not on you", which is what
                Meridian's amber says in as many words. */}
            <Value tone="hold">{chain.orphans.length}</Value>
          </Line>
          {chain.orphans.map((m) => (
            <Row
              key={`${m.kind}:${m.artifactId}`}
              tight
              lead={leadFor(m)}
              time={relativeTime(m.createdAt, now)}
              action={<Value tone="quiet">{m.word}</Value>}
            />
          ))}
        </>
      ) : null}
    </>
  );
}
