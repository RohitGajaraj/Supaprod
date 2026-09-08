/**
 * ── YOUR RUNS: EVERY PIECE OF WORK, AS A POSITION ON THE ROAD ──────────────
 *
 * A1-REPORT §4: *"Rows are the only way a person meets an approval, a verdict
 * or a hold."* That holds. What changed on 2026-09-08 (Lane 1) is what a row
 * IS: it was a title and a paragraph; it is now a title, a Journey mark that
 * says where the work stands and what state it is in, one short sentence, and
 * the one control that fits that state. A run that needs a person leads with
 * an Answer press; everything else opens on the row.
 *
 * ── THE REFERENCE, NAMED BEFORE BUILDING ──────────────────────────────────
 * Cursor's task list (title, status chip, one distinguishing fact) and Devin's
 * session list (the exception state said in words under the title). What is
 * added over both is the road: their work has no stations; ours does, and the
 * position is the fact a person reads first.
 *
 * ── THREE STATES, AND THEY ARE THREE DIFFERENT THINGS ─────────────────────
 * Still reading, could not read, and genuinely no runs. The read raises rather
 * than swallows, so the middle state is reachable and is said.
 */
import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";

import { Journey, type JourneyKey } from "@/components/meridian/Journey";
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
import { AGENT_STATIONS, toolActionLabel } from "@/lib/agent-vocabulary";
import { relativeTime } from "@/lib/memory-view";
import {
  abandonedLine,
  groupStartRows,
  startRows,
  type StartRow,
  type StartRowKind,
} from "@/components/today/tracks-feed";
import { journeyOfRun } from "@/components/start/journey-of-a-run";
import { listRunsForStart, pinTrack, type StartRun } from "@/lib/spine/track.functions";
import { useWorkspace } from "@/hooks/use-workspace";
import { useTimezone } from "@/hooks/use-timezone";

/**
 * The word on the chip, and only where a chip earns its place.
 *
 * `running` gets none: the Journey mark is already alive on that row and the
 * sentence says who is working with a clock. `waiting` gets none either,
 * because "waiting" is what a list of runs mostly is and a chip that appears
 * on the majority of rows sorts nothing.
 */
const CHIP: Partial<Record<StartRowKind, { status: "pass" | "fail"; word: string }>> = {
  finished: { status: "pass", word: "Finished" },
  abandoned: { status: "fail", word: "Abandoned" },
};

/** The marks column: seven dots and their links. */
const MARKS_WIDTH = 84;

function RunRow({
  r,
  run,
  now,
  onOpen,
  onPin,
  pinning,
}: {
  r: StartRow;
  run: StartRun | undefined;
  now: number;
  onOpen: (id: string) => void;
  onPin: (id: string, pinned: boolean) => void;
  pinning: boolean;
}) {
  const chip = CHIP[r.kind];
  const canPin = r.kind !== "finished" && r.kind !== "abandoned";
  const needsYou = r.kind === "needs-you";
  return (
    <Row
      marksWidth={MARKS_WIDTH}
      marks={run ? <Journey size="row" word={false} stations={journeyOfRun(run)} /> : null}
      lead={r.title}
      sub={r.middle}
      subTitle={r.detail ?? undefined}
      time={r.at ? relativeTime(new Date(r.at).toISOString(), now) : null}
      onClick={() => onOpen(r.id)}
      action={
        <span className="flex items-center gap-mrd-2">
          {r.creditsLine ? (
            <span className="font-mrd-mono text-mrd-data tabular-nums text-mrd-mute">
              {r.creditsLine}
            </span>
          ) : null}
          {needsYou ? (
            /* THE ONE THING ONLY A PERSON CAN DO, AS THE ROW'S OWN CONTROL.
               It opens the run at its ask (R-04: consent in place); the row
               does not pretend to know the question. */
            <Action variant="primary" onClick={() => onOpen(r.id)}>
              Answer
            </Action>
          ) : r.pinnedAt ? (
            <StatusChip status="you" pulse={false}>
              First
            </StatusChip>
          ) : chip ? (
            <StatusChip status={chip.status} pulse={false}>
              {chip.word}
            </StatusChip>
          ) : null}
          {canPin && !needsYou ? (
            <Action variant="quiet" busy={pinning} onClick={() => onPin(r.id, !r.pinnedAt)}>
              {r.pinnedAt ? "Unpin" : "Put first"}
            </Action>
          ) : null}
        </span>
      }
    />
  );
}

export function YourRuns({
  station = null,
  onClearStation,
}: {
  /** Show only the runs standing at this station (the map's press). */
  station?: JourneyKey | null;
  onClearStation?: () => void;
}) {
  const navigate = useNavigate();
  const { activeWorkspaceId } = useWorkspace();
  const zone = useTimezone();
  const fRuns = useServerFn(listRunsForStart);
  const q = useQuery({
    queryKey: ["start-runs", activeWorkspaceId ?? null],
    queryFn: () => fRuns({ data: { workspaceId: activeWorkspaceId ?? null } }),
    refetchInterval: 10_000,
  });

  const [showAbandoned, setShowAbandoned] = React.useState(false);
  const now = Date.now();
  const byId = React.useMemo(() => new Map((q.data ?? []).map((r) => [r.id, r])), [q.data]);
  const rows = React.useMemo(
    () => startRows(q.data ?? [], Date.now(), KIND_WORD, (tool) => toolActionLabel(tool), zone),
    [q.data, zone],
  );
  const groups = React.useMemo(() => groupStartRows(rows), [rows]);
  const shown = React.useMemo(
    () => (station ? groups.shown.filter((r) => r.station === station) : groups.shown),
    [groups.shown, station],
  );
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
      {station ? (
        <p role="status" className="flex items-center gap-mrd-3 text-mrd-small text-mrd-mute">
          <span>
            Only the runs at <span className="text-mrd-ink">{AGENT_STATIONS[station].name}</span>.
          </span>
          {onClearStation ? (
            <Action variant="quiet" onClick={onClearStation}>
              Show all
            </Action>
          ) : null}
        </p>
      ) : null}
      <div aria-live="polite" className="flex flex-col">
        {q.isLoading ? <Reading>Reading your runs.</Reading> : null}

        {q.isError ? (
          <ReadFailedLine error={q.error} onRetry={() => void q.refetch()}>
            Your runs did not load. Whatever is running is still running; this list just could not
            read it.
          </ReadFailedLine>
        ) : null}

        {!q.isLoading && !q.isError && rows.length === 0 ? (
          <p className="text-mrd-base text-mrd-mute">Nothing yet. Your first run starts above.</p>
        ) : null}

        {!q.isLoading && !q.isError && rows.length > 0 && shown.length === 0 && station ? (
          <p className="text-mrd-base text-mrd-mute">
            Nothing is standing at {AGENT_STATIONS[station].name}.
          </p>
        ) : null}

        {shown.map((r) => (
          <RunRow
            key={r.id}
            r={r}
            run={byId.get(r.id)}
            now={now}
            onOpen={open}
            onPin={(trackId, pinned) => pin.mutate({ trackId, pinned })}
            pinning={pin.isPending}
          />
        ))}

        {groups.abandonedCount > 0 && !station ? (
          <div className="flex flex-col">
            <button
              type="button"
              aria-expanded={showAbandoned}
              onClick={() => setShowAbandoned((v) => !v)}
              className="mrd-focus-inset flex w-fit items-center gap-1.5 rounded-mrd-chip py-1 text-mrd-data text-mrd-mute transition-colors hover:text-mrd-ink"
              style={{ transitionDuration: "var(--mrd-d-press)" }}
            >
              <Chevron open={showAbandoned} />
              <span>{abandonedLine(groups.abandonedCount)}</span>
            </button>
            {showAbandoned
              ? groups.abandoned.map((r) => (
                  <RunRow
                    key={r.id}
                    r={r}
                    run={byId.get(r.id)}
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
