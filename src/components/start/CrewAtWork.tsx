/**
 * WHO IS WORKING RIGHT NOW, ON WHAT, FOR HOW LONG.
 *
 * Founder, 2026-09-08: "the work that the AI does is not visually seen." On
 * the home the only sign a machine was at work was a grey dot in the header
 * reading "Nothing running". This strip draws every seat inside a run, by
 * name, with the verb it is on and a clock that ticks, and it draws nothing
 * at all when nobody is working, because a presence strip that invents
 * activity is the lie the shell's own honesty rule forbids.
 *
 * Read off the same `listRunsForStart` rows the list below polls, so the two
 * cannot disagree about who is working.
 */
import * as React from "react";

import { Journey, type JourneyStation } from "@/components/meridian/Journey";
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
        {seats.map((s) => {
          const one: JourneyStation[] = [{ key: s.station, state: "working", at: s.since }];
          return (
            <li key={s.trackId}>
              <button
                type="button"
                onClick={() => onOpen(s.trackId)}
                className="flex w-full items-center gap-mrd-4 rounded-mrd-ctl px-mrd-3 py-mrd-2 text-left transition-colors hover:bg-mrd-hover focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--mrd-focus)]"
                style={{ transitionDuration: "var(--mrd-d-press)" }}
              >
                {/* One station, alive, with its clock: the same drawing the
                    run rows carry, so a person learns it once. */}
                <Journey size="row" stations={one} label="Working" className="shrink-0" />
                <span className="min-w-0 flex-1 truncate text-mrd-base text-mrd-ink">
                  <span className="font-medium">{s.seat}</span>
                  <span className="text-mrd-body">
                    {" "}
                    is {s.verb ?? `working at ${AGENT_STATIONS[s.station].name}`}
                  </span>
                  <span className="text-mrd-mute"> · {s.title}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default CrewAtWork;
