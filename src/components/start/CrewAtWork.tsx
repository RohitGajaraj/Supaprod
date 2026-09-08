/**
 * WHO IS WORKING RIGHT NOW, ON WHAT, FOR HOW LONG.
 *
 * Founder, 2026-09-08: "the work that the AI does is not visually seen." On
 * the home the only sign a machine was at work was a grey dot in the header
 * reading "Nothing running". This strip draws every seat inside a run, by
 * name and in its own colour, with the verb it is on and a clock that ticks,
 * and it draws nothing at all when nobody is working, because a presence
 * strip that invents activity is the lie the shell's own honesty rule
 * forbids.
 *
 * Read off the same `listRunsForStart` rows the list below polls, so the two
 * cannot disagree about who is working. When Lane 3's `listRunningNow`
 * carries the seat's latest tool call, this reads that key instead and the
 * verb becomes the live one.
 */
import * as React from "react";

import { AgentPresence } from "@/components/meridian/AgentPresence";
import { AGENT_STATIONS } from "@/lib/agent-vocabulary";
import type { StartRun } from "@/lib/spine/track.functions";

export type WorkingSeat = {
  trackId: string;
  title: string;
  seat: string;
  verb: string | null;
  since: string;
  station: StartRun["station"];
};

export function workingSeats(
  runs: readonly StartRun[] | undefined,
  phraseFor: (tool: string) => string | null,
): WorkingSeat[] {
  if (!runs) return [];
  return runs
    .filter((r) => r.status === "open" && r.working)
    .map((r) => ({
      trackId: r.id,
      title: r.title,
      seat: r.working!.seat,
      verb: r.working!.tool ? phraseFor(r.working!.tool) : null,
      since: r.working!.since,
      station: r.station,
    }));
}

export function CrewAtWork({
  seats,
  onOpen,
}: {
  seats: readonly WorkingSeat[];
  onOpen: (trackId: string) => void;
}) {
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
          <li key={s.trackId}>
            <AgentPresence
              seat={s.seat}
              verb={s.verb ?? `working at ${AGENT_STATIONS[s.station].name}`}
              object={`· ${s.title}`}
              since={s.since}
              onOpen={() => onOpen(s.trackId)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

export default CrewAtWork;
