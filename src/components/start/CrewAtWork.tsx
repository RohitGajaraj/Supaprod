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
import { AGENT_STATIONS, agentDisplayName, type AgentStation } from "@/lib/agent-vocabulary";
import { runningNowKey } from "@/lib/query-keys";
import { listRunningNow } from "@/lib/spine/track.functions";
import type { RunningSeat } from "@/lib/spine/what-is-running";

export type WorkingSeat = {
  runId: string;
  trackId: string | null;
  title: string;
  seat: string;
  verb: string | null;
  since: string | null;
  station: AgentStation | null;
};

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
    verb: r.now?.verb ?? null,
    since: r.startedAt ?? null,
    station: stationOf(r.station),
  }));
}

export function CrewAtWork({
  workspaceId,
  onOpen,
}: {
  workspaceId: string | null;
  onOpen: (trackId: string) => void;
}) {
  const fRunning = useServerFn(listRunningNow);
  const q = useQuery({
    queryKey: runningNowKey(workspaceId),
    queryFn: () => fRunning({ data: { workspaceId } }),
    refetchInterval: 10_000,
  });
  const seats = React.useMemo(() => workingSeats(q.data), [q.data]);
  if (seats.length === 0) return null;
  return (
    <section
      data-mrd=""
      aria-label="Working now"
      aria-live="polite"
      className="flex flex-col gap-mrd-2"
    >
      <span className="mrd-eyebrow">Working now</span>
      <ul className="flex flex-col gap-mrd-1">
        {seats.map((s) => (
          <li key={s.runId}>
            <AgentPresence
              seat={s.seat}
              verb={
                s.verb ?? (s.station ? `working at ${AGENT_STATIONS[s.station].name}` : "working")
              }
              object={s.title ? `· ${s.title}` : null}
              since={s.since}
              onOpen={s.trackId ? () => onOpen(s.trackId!) : undefined}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

export default CrewAtWork;
