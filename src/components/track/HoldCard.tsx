/**
 * THE HOLD, IN PLACE, FROM A TRACK ID ALONE.
 *
 * ── WHY IT EXISTS (Lane 1, 2026-09-08) ───────────────────────────────────
 * The founder's workspace had four runs held at Build and Ship, "ran again
 * and again without moving on", and a row's only exit was to open the run
 * and press "Let Build try again" there. R-04 is consent in place; a hold is
 * the same shape as a call, and the person should be able to settle it where
 * they meet it. So the run screen's Now card, with its one control, mounts
 * standalone from a `trackId`, reading its own track on the same cache entry
 * the run screen polls, so the two cannot disagree.
 *
 * ── WHAT IT DRAWS, AND WHEN IT DRAWS NOTHING ─────────────────────────────
 * The same `runNow` register the run screen uses, so a home row and the run
 * say one thing. It draws only for a register that has a control here:
 * `held` (Let X try again, Stop), `stopped` and `paused` (Run it now). Every
 * other register renders null, which makes it safe under any row.
 *
 * The run screen keeps its own richer card (Ship's preview retry, the Build
 * repo door, the claimed-path holder); this is the portable half.
 */
import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Action, Actions } from "@/components/meridian/surface-parts";
import { Receipt } from "@/components/meridian/Receipt";
import { AGENT_STATIONS } from "@/lib/agent-vocabulary";
import { failureLine } from "@/lib/error-copy";
import {
  driveTrackNow,
  getTrack,
  getTrackArtifacts,
  retryStation,
  stopTrack,
} from "@/lib/spine/track.functions";
import { horizonFromStops } from "@/components/track/a-calendar-wait-is-not-a-stoppage";
import { triedAgainLine } from "@/lib/spine/three-tries-and-nothing-changed";
import { sameCalendarDay } from "@/lib/time-of-day";
import { useTimezone } from "@/hooks/use-timezone";
import { runNow } from "@/components/track/run-now";
import { RunNow, HoldFact } from "@/components/track/RunNow";

type Note = { verb: string; consequence: string; failed?: boolean };

export function HoldCard({ trackId, onSettled }: { trackId: string; onSettled?: () => void }) {
  const qc = useQueryClient();
  const fTrack = useServerFn(getTrack);
  const fArtifacts = useServerFn(getTrackArtifacts);
  const fRetry = useServerFn(retryStation);
  const fStop = useServerFn(stopTrack);
  const fDrive = useServerFn(driveTrackNow);
  const zone = useTimezone();

  const trackQ = useQuery({
    queryKey: ["spine-track", trackId],
    queryFn: () => fTrack({ data: { trackId } }),
    refetchInterval: 10_000,
  });
  const track = trackQ.data ?? null;
  const artifactsQ = useQuery({
    queryKey: ["track-artifacts", trackId],
    queryFn: () => fArtifacts({ data: { trackId } }),
    staleTime: 10_000,
    enabled: !!track,
  });
  const horizon = horizonFromStops(artifactsQ.data?.stops);
  const [note, setNote] = React.useState<Note | null>(null);

  const settle = () => {
    void qc.invalidateQueries({ queryKey: ["spine-track", trackId] });
    void qc.invalidateQueries({ queryKey: ["spine-tracks"] });
    void qc.invalidateQueries({ queryKey: ["track-activity", trackId] });
    onSettled?.();
  };
  const release = useMutation({
    mutationFn: () => fRetry({ data: { trackId } }),
    onSuccess: (res) => {
      if (res.refused) {
        setNote({ verb: "Nothing was released", consequence: res.refused, failed: true });
        return;
      }
      setNote({
        verb: "You released it",
        consequence: res.note ?? "It runs again on its next turn.",
      });
      settle();
    },
    onError: (e: Error) =>
      setNote({
        verb: "Nothing was released",
        consequence: failureLine("Nothing was released, so it is still held.", e),
        failed: true,
      }),
  });
  const stop = useMutation({
    mutationFn: () => fStop({ data: { trackId } }),
    onSuccess: (res) => {
      if (res.refused) {
        setNote({ verb: "The loop was not told", consequence: res.refused, failed: true });
        return;
      }
      setNote({
        verb: "You stopped it",
        consequence: "Nothing more is dispatched until you run it again.",
      });
      settle();
    },
    onError: (e: Error) =>
      setNote({
        verb: "The loop was not told",
        consequence: failureLine("It may run again on its own.", e),
        failed: true,
      }),
  });
  const run = useMutation({
    mutationFn: () => fDrive({ data: { trackId, origin: "press" } }),
    onSuccess: () => {
      setNote({ verb: "You ran it", consequence: "It is walking its route again." });
      settle();
    },
    onError: (e: Error) =>
      setNote({
        verb: "It did not start",
        consequence: failureLine("Nothing was moved.", e),
        failed: true,
      }),
  });

  if (!track) return null;
  const now = runNow({
    track: {
      status: track.status,
      station: track.station,
      hold: track.hold,
      holdReason: track.holdReason,
      holdBecause: track.holdBecause,
      drivenAt: track.drivenAt,
      deferredUntil: track.deferredUntil,
      attempts: track.attempts,
      route: { path: track.route.path },
    },
    loading: false,
    feedDead: false,
    live: false,
    currentTool: null,
    seats: [],
    legsLeft: null,
    horizon,
    gradableBySource: null,
    shippedAt: null,
    verdict: null,
    nowMs: Date.now(),
  });
  if (now.register !== "held" && now.register !== "stopped" && now.register !== "paused") {
    return null;
  }
  const here = AGENT_STATIONS[track.station]?.name ?? track.station;
  const deferralIsForecastHorizon = Boolean(
    track.deferredUntil && horizon && sameCalendarDay(track.deferredUntil, horizon, zone),
  );
  const tried = triedAgainLine(track.deferredUntil, new Date(), {
    zone,
    isForecastHorizon: deferralIsForecastHorizon,
  });
  const busy = release.isPending || stop.isPending || run.isPending;

  return (
    <RunNow now={now}>
      {track.holdBecause ? <HoldFact>{track.holdBecause}</HoldFact> : null}
      {tried ? <HoldFact>{tried}</HoldFact> : null}
      <Actions>
        {now.register === "held" ? (
          <>
            <Action busy={release.isPending} disabled={busy} onClick={() => release.mutate()}>
              {release.isPending ? "Releasing it" : `Let ${here} try again`}
            </Action>
            <Action
              variant="quiet"
              busy={stop.isPending}
              disabled={busy}
              onClick={() => stop.mutate()}
            >
              {stop.isPending ? "Stopping" : "Stop spending on this"}
            </Action>
          </>
        ) : (
          <Action
            variant="primary"
            busy={run.isPending}
            disabled={busy}
            onClick={() => run.mutate()}
          >
            {run.isPending ? "Walking the route" : "Run it now"}
          </Action>
        )}
      </Actions>
      {note ? (
        <Receipt verb={note.verb} consequence={note.consequence} failed={note.failed} />
      ) : null}
    </RunNow>
  );
}

export default HoldCard;
