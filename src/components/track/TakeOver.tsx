/**
 * THE TWO CONTROLS THAT ARE NOT START AND STOP.
 *
 * ── WHAT A PERSON DOES WHEN THE WORK COMES BACK WRONG ──────────────────────
 * They send the step back to be done again, or they do it themselves and hand
 * the result in. Neither was reachable from any surface in this product:
 * `rewindTrackTo` and `submitStationByHand` both shipped to `main` with zero
 * importers. A run that can only be started and stopped is a batch job, however
 * live the pane in front of it looks.
 *
 * ── WHY IT SITS BESIDE `RUN IT` AND NOT ON THE ARTIFACT ────────────────────
 * These two act on the RUN -- where it stands and what it is holding -- rather
 * than on the thing one station made, so they belong with the drive control
 * that also moves the run. The right pane keeps the rule that a control which
 * changes a thing sits on that thing; nothing here changes a thing, it changes
 * which step is standing.
 *
 * ── THE PRESS COSTS THE RUN ITS CLAIM, AND THE PERSON IS TOLD BEFORE ───────
 * Both server fns record a `press` BEFORE any other write, so a failed write
 * still leaves a trace of a person reaching in (R-18). That is the mechanism
 * F-79's false acceptance survived by lacking. A person is owed that fact where
 * they click, not in a document -- so the region says it once, plainly, above
 * both controls.
 *
 * ── EVERY REFUSAL IS THE SERVER'S OWN SENTENCE, RENDERED VERBATIM ──────────
 * `rewindTrackTo` returns `refused` and `submitStationByHand` returns `line`,
 * both written as things to say to a person. Re-wording them here would put two
 * vocabularies on one refusal and let the surface drift from what actually
 * happened, which is the drift this run screen has already been repaired for
 * twice.
 */
import * as React from "react";
import { failureLine } from "@/components/track/error-copy";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { Action, Region } from "@/components/meridian/surface-parts";
import { Row } from "@/components/meridian/rows";
import { Receipt } from "@/components/meridian/Receipt";
import { Field, Input } from "@/components/meridian/forms";
import { rewindTrackTo, submitStationByHand, type Track } from "@/lib/spine/track.functions";
import type { SpineRoute } from "@/lib/spine/route";
import type { AgentStation } from "@/lib/agent-vocabulary";
import { takeOver, undoneLine } from "@/components/track/take-over";

type Note = { verb: string; consequence: string; failed?: boolean };

export function TakeOver({ trackId, track }: { trackId: string; track: Track }) {
  const qc = useQueryClient();
  const fRewind = useServerFn(rewindTrackTo);
  const fHand = useServerFn(submitStationByHand);

  const urlId = React.useId();
  const [url, setUrl] = React.useState("");
  const [note, setNote] = React.useState<Note | null>(null);

  const can = takeOver({
    status: track.status,
    station: track.station,
    route: track.route as SpineRoute,
  });

  /*
   * Both writes move the step and set earlier work aside, so every reader on
   * this screen is stale the moment either returns -- the route header, the
   * transcript, the record beside it and the pane's own track row. Telling them
   * here is what makes the undo visible in the same tick as the press rather
   * than up to ten seconds later on the poll.
   */
  const refresh = React.useCallback(() => {
    void qc.invalidateQueries({ queryKey: ["spine-track", trackId] });
    void qc.invalidateQueries({ queryKey: ["spine-track-chain", trackId] });
    void qc.invalidateQueries({ queryKey: ["track-activity", trackId] });
    void qc.invalidateQueries({ queryKey: ["spine-tracks"] });
  }, [qc, trackId]);

  const undo = useMutation({
    mutationFn: (station: AgentStation) => fRewind({ data: { trackId, station } }),
    onSuccess: (res, station) => {
      refresh();
      if (res.refused) {
        setNote({ verb: "Nothing moved", consequence: res.refused, failed: true });
        return;
      }
      setNote({ verb: "You sent it back", consequence: undoneLine(station) });
    },
    onError: (e: Error) =>
      setNote({
        verb: "Nothing moved",
        consequence: failureLine("The work is unchanged.", e),
        failed: true,
      }),
  });

  const hand = useMutation({
    mutationFn: () => fHand({ data: { trackId, url } }),
    onSuccess: (res) => {
      refresh();
      if (!res.ok) {
        setNote({ verb: "Nothing was recorded", consequence: res.line, failed: true });
        return;
      }
      setUrl("");
      setNote({ verb: "You handed it back", consequence: res.line });
    },
    onError: (e: Error) =>
      setNote({
        verb: "Nothing was recorded",
        consequence: failureLine("The work is unchanged.", e),
        failed: true,
      }),
  });

  const sending = url.trim().length === 0 || hand.isPending;

  return (
    <Region
      title="Take it over"
      sub={
        can.nothing
          ? undefined
          : "Send a step back to be done again, or do it yourself and hand the result in. Both count as you stepping in, and this piece of work will say so from here on."
      }
    >
      {can.nothing ? <Row lead={can.nothing} /> : null}

      {can.undoTo ? (
        <Action
          variant="quiet"
          busy={undo.isPending}
          disabled={undo.isPending}
          onClick={() => undo.mutate(can.undoTo as AgentStation)}
        >
          {undo.isPending ? "Sending it back" : can.undoLabel}
        </Action>
      ) : null}

      {can.handback ? (
        <div className="flex flex-col gap-mrd-3">
          <Field
            htmlFor={urlId}
            label="Paste the link to the pull request or the deploy"
            /* The hint carries the one thing the link does NOT establish. A
               pasted URL is a claim by a person: `paste-back.ts` records it
               `claimedByPerson` and never sets `verified`, and the deploy row is
               written `claimed`, never `success`, so it can never become the
               proof the production gate reads. Saying so here is cheaper than
               a person discovering it at Ship. */
            hint="A pull request on GitHub or GitLab, or the address it went live at. Nothing here checks it. You are telling us it shipped."
          >
            <Input
              id={urlId}
              value={url}
              inputMode="url"
              placeholder="https://github.com/owner/repo/pull/123"
              onChange={(e) => setUrl(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !sending) {
                  e.preventDefault();
                  hand.mutate();
                }
              }}
            />
          </Field>
          <div>
            <Action busy={hand.isPending} disabled={sending} onClick={() => hand.mutate()}>
              {hand.isPending ? "Handing it back" : "Hand it back"}
            </Action>
          </div>
        </div>
      ) : null}

      {/* Inside the region, unlike the release note above it: this region does
          not unmount when either control succeeds -- it re-renders with a new
          step behind it -- so what just happened stays where it was read. */}
      {note ? (
        <Receipt verb={note.verb} consequence={note.consequence} failed={note.failed} />
      ) : null}
    </Region>
  );
}
