/**
 * WHO IS WORKING RIGHT NOW, ON WHAT, FOR HOW LONG.
 *
 * Founder, 2026-09-08: "the work that the AI does is not visually seen." On
 * the home the only sign a machine was at work was a grey dot in the header
 * reading "Nothing running". This strip draws every seat inside a run, by
 * name and in its own colour, with the verb it is on right now and a clock
 * that ticks, and it draws nothing at all when nobody is working, because a
 * presence strip that invents activity is the lie the shell's own honesty
 * rule forbids.
 *
 * ── ONE KEY FOR LIVE WORK, EVERYWHERE ────────────────────────────────────
 * Reads `listRunningNow` under `runningNowKey(workspaceId)`, the key Lane 3
 * built for every surface that asks what is running (P-127, extended
 * 2026-09-08 with each seat's latest call as `now`). The shell's crew, the
 * run screen and this strip read the same key, and `useRunningNowPush`
 * (mounted once in `_authenticated.tsx`) invalidates it on every
 * `agent_runs` insert or update, so the strip moves the moment a seat
 * starts, ends or stamps a checkpoint. The 10 s refetch is the safety net.
 */
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { AgentPresence } from "@/components/meridian/AgentPresence";
import { Eyebrow, ReadFailedLine } from "@/components/meridian/surface-parts";
import { AGENT_STATIONS, agentDisplayName, type AgentStation } from "@/lib/agent-vocabulary";
import { STALL_MINUTES } from "@/lib/loop-health.functions";
import { runningNowKey } from "@/lib/query-keys";
import { HOME_STALE_MS, useSeedInFlight } from "@/components/start/home-read";
import { listRunningNow } from "@/lib/spine/track.functions";
import { verbWithObject, type RunningSeat } from "@/lib/spine/what-is-running";

export type WorkingSeat = {
  runId: string;
  trackId: string | null;
  title: string;
  seat: string;
  /** The catalog slug beside the name, so a reader can join a seat to a run's
   *  worker without comparing a name to a slug (fourth review, 2026-09-09). */
  slug: string | null;
  verb: string | null;
  /** What the seat's newest call is on, in the product's words or a file's
   *  own name: "the spec", "Address.tsx". Lane 3's objectLabel, 2026-09-08. */
  objectLabel: string | null;
  since: string | null;
  /** When the seat's newest call happened; null when it has made none. */
  lastCallAt: string | null;
  station: AgentStation | null;
};

/**
 * A SEAT QUIET FOR LONGER THAN THIS HAS STOPPED BREATHING. Loop-health calls
 * a run stalled after thirty minutes without a call; a presence that kept
 * pulsing past that was the machine claiming work it was not doing (motion
 * review, 2026-09-08). The dot goes still and the verb says how long.
 */
export const QUIET_AFTER_MS = STALL_MINUTES * 60_000;

/** The verb line a seat wears everywhere: its call and object, or its
 *  station, with "quiet for N min" past the stall threshold. */
export function seatLine(s: WorkingSeat, nowMs: number): { doing: string; quiet: number | null } {
  const quiet = quietFor(s, nowMs);
  const doing = s.verb
    ? /* Not `${verb} ${objectLabel}`: the verb usually names the object
         already, and this line read "revising the spec the spec" on the
         served home. See `verbWithObject`. */
      verbWithObject(s.verb, s.objectLabel)
    : s.station
      ? `working at ${AGENT_STATIONS[s.station].name}`
      : "working";
  return { doing: quiet ? `${doing} · quiet for ${Math.round(quiet / 60_000)} min` : doing, quiet };
}

export function quietFor(
  seat: Pick<WorkingSeat, "lastCallAt" | "since">,
  nowMs: number,
): number | null {
  const last = seat.lastCallAt ?? seat.since;
  if (!last) return null;
  const ms = nowMs - Date.parse(last);
  return Number.isFinite(ms) && ms > QUIET_AFTER_MS ? ms : null;
}

function stationOf(s: string | null): AgentStation | null {
  return s && s in AGENT_STATIONS ? (s as AgentStation) : null;
}

export function workingSeats(rows: readonly RunningSeat[] | undefined): WorkingSeat[] {
  if (!rows) return [];
  return rows.map((r) => ({
    runId: r.runId,
    trackId: r.trackId,
    title: r.title ?? "",
    seat: agentDisplayName(r.slug, null),
    slug: r.slug ?? null,
    verb: r.now?.verb ?? null,
    objectLabel: r.now?.objectLabel ?? null,
    since: r.startedAt ?? null,
    lastCallAt: r.now?.at ?? null,
    station: stationOf(r.station),
  }));
}

export function CrewAtWork({
  workspaceId,
  onOpen,
  className = "",
}: {
  workspaceId: string | null;
  onOpen: (trackId: string) => void;
  /** The caller's own outer spacing: a part does not decide where it sits in
   *  the page's rhythm (fifth review's craft pass, 2026-09-09). */
  className?: string;
}) {
  const fRunning = useServerFn(listRunningNow);
  /* Seeded by the home's composite read; this waits for it rather than
     racing it, and never reads a null workspace (2026-09-08). */
  const seedInFlight = useSeedInFlight(workspaceId);
  const q = useQuery({
    queryKey: runningNowKey(workspaceId),
    queryFn: () => fRunning({ data: { workspaceId } }),
    refetchInterval: 10_000,
    staleTime: HOME_STALE_MS,
    enabled: Boolean(workspaceId) && !seedInFlight,
  });
  const seats = React.useMemo(() => workingSeats(q.data), [q.data]);
  /* NEVER A CALM ROOM ON A DEAD FEED. Nothing drawn means nobody is
     working; a failed read must not look the same (entry review, 2026-09-08). */
  if (q.isError) {
    return (
      <section
        data-mrd=""
        aria-label="Working now"
        className={`flex flex-col gap-mrd-2 ${className}`}
      >
        <Eyebrow>Working now</Eyebrow>
        <ReadFailedLine error={q.error} onRetry={() => void q.refetch()}>
          Cannot see who is working.
        </ReadFailedLine>
      </section>
    );
  }
  if (seats.length === 0) return null;
  return (
    <section
      data-mrd=""
      aria-label="Working now"
      className={`flex flex-col gap-mrd-2 ${className}`}
    >
      <Eyebrow>Working now</Eyebrow>
      <ul className="flex flex-col gap-mrd-1">
        {seats.map((s) => {
          const { doing, quiet } = seatLine(s, Date.now());
          return (
            <li
              key={s.runId}
              /* A seat that was not there a moment ago arrives on Meridian's
                 fade rather than in one frame; a poll that redraws the same
                 seat keeps its key and does not replay it. */
              style={{ animation: "mrd-fade-in var(--mrd-d-move) var(--mrd-ease-soft) both" }}
            >
              <AgentPresence
                seat={s.seat}
                verb={doing}
                object={s.title ? `· ${s.title}` : null}
                since={s.since}
                alive={!quiet}
                onOpen={s.trackId ? () => onOpen(s.trackId!) : undefined}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default CrewAtWork;
