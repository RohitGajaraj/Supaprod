/**
 * THE ROAD, DRAWN ONCE ON THE HOME.
 *
 * Two modes, one drawing:
 *
 *   promise   no runs yet. The seven stations with what each hands the next,
 *             so a person who has never started a run can see what happens
 *             when they do. This is the product's model, said in a glance.
 *   map       runs exist. The same road with a count on every station where
 *             work stands and the strongest state lit there, so "where is
 *             everything" is answered without reading a list. Pressing a
 *             station narrows the list below to the runs standing there; it
 *             never opens a station page (R-01).
 */
import * as React from "react";

import { Action } from "@/components/meridian/surface-parts";
import { AGENT_STATIONS } from "@/lib/agent-vocabulary";

import {
  Journey,
  JOURNEY_ORDER,
  JOURNEY_PRODUCES,
  type JourneyKey,
  type JourneyStation,
} from "@/components/meridian/Journey";

export function promiseStations(): JourneyStation[] {
  return JOURNEY_ORDER.map((key) => ({ key, state: "pending", outcome: JOURNEY_PRODUCES[key] }));
}

export function JourneyMap({
  mode,
  stations,
  selected,
  onSelect,
}: {
  mode: "promise" | "map";
  stations: readonly JourneyStation[];
  selected?: JourneyKey | null;
  onSelect?: (key: JourneyKey | null) => void;
}) {
  /* THE CAPTION SAYS WHAT THE PRESS DID. A station press filters a list that
     is usually below the fold, so it looked like nothing happened (third
     review, 2026-09-08); the caption names the selection and carries the
     clear. In promise form there is no caption: the hero's sentence and the
     stops' own lines already say it, and it was printed twice. */
  const here = selected ? stations.find((s) => s.key === selected) : null;
  /* THE MORNING AFTER: a map with nothing standing on it. The road used to
     fall back to the promise whenever no run was open, as if none had ever
     run; now it stays a map and the caption says so (fourth review,
     2026-09-09). */
  const empty = stations.every((s) => !s.count);
  const caption =
    mode === "promise"
      ? null
      : selected && here
        ? `Showing the ${here.count ?? 0} ${here.count === 1 ? "run" : "runs"} at ${AGENT_STATIONS[selected].name}.`
        : empty
          ? "Nothing is standing on the road. What finished is in the runs below."
          : "Where your work stands. Press a station to see only the runs there.";

  return (
    <section
      data-mrd=""
      /* The region is named for what it shows, in the drawing's own words;
         it was "What happens after you press Enter", on a phone where Enter
         is a new line and the composer says "Press Start it" (fourth review,
         2026-09-09). Section and list share one name, as map mode already
         does. */
      aria-label={mode === "promise" ? "The road every run travels" : "Where your work stands"}
      className="flex flex-col gap-mrd-4 rounded-mrd-pane bg-mrd-sheet px-mrd-5 pt-mrd-5 pb-mrd-4"
    >
      <Journey
        size="full"
        stations={stations}
        active={selected ?? null}
        onSelect={
          mode === "map" && onSelect ? (key) => onSelect(selected === key ? null : key) : undefined
        }
        label={mode === "promise" ? "The road every run travels" : "Where your work stands"}
        selects="filter"
        promise={mode === "promise"}
      />
      {caption ? (
        <p className="mrd-meta flex items-center gap-mrd-3">
          <span>{caption}</span>
          {selected && onSelect ? (
            <Action variant="quiet" onClick={() => onSelect(null)}>
              Show all
            </Action>
          ) : null}
        </p>
      ) : null}
    </section>
  );
}

export default JourneyMap;
