/**
 * THE ROAD, DRAWN ONCE ON THE HOME.
 *
 * Two modes, one drawing:
 *
 *   promise   no runs yet. The seven stations with what each hands the next,
 *             so a person who has never pressed Enter can see what happens
 *             when they do. This is the product's model, said in a glance.
 *   map       runs exist. The same road with a count on every station where
 *             work stands and the strongest state lit there, so "where is
 *             everything" is answered without reading a list. Pressing a
 *             station narrows the list below to the runs standing there; it
 *             never opens a station page (R-01).
 */
import * as React from "react";

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
  const caption =
    mode === "promise"
      ? "Every run travels this road, and it stops to ask you only where the call is yours."
      : "Where your work stands. Press a station to see only the runs there.";

  return (
    <section
      data-mrd=""
      aria-label={
        mode === "promise" ? "What happens after you press Enter" : "Where your work stands"
      }
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
      <p className="mrd-meta">{caption}</p>
    </section>
  );
}

export default JourneyMap;
