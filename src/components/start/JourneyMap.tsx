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
import { joinPlainly } from "@/lib/spine/attach";

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

/*
 * ── THE ONE THING THE ROAD'S COLOUR CANNOT SAY ───────────────────────────
 *
 * MEASURED ON THE SERVED HOME, 2026-09-09, workspace A1 delete probe. Two
 * stations were lit and their computed styles are byte-identical:
 *
 *   Decide   3 runs, all `the-call-is-yours`   ->  state `you`
 *   Design   2 runs, both `going-in-circles`   ->  state `stopped`
 *
 *   both:  fill oklch(0.28 0.14 315) · ink oklch(0.74 0.11 315)
 *
 * Three runs waiting for an answer and two that gave up and will never move
 * again render the same pixel. That is the founder's *"the stations do not
 * form a flow"* on the surface he named: the road answers "where is
 * everything" and cannot answer "and is any of it dead".
 *
 * `Journey`'s paint table is right and I am not touching it. Both states ARE
 * "a person required", which is why they share the you hue, and every other
 * channel is already spoken for with a written reason: the glyph is the
 * STATION's (law 4), the fill was moved to the you-chip this morning on a
 * measured greyscale argument, and the dashed ring belongs to `waived`.
 * Taking a channel from another state to settle this pair is a decision that
 * reaches all three lanes' surfaces and it is not mine to make alone at
 * midnight. It is filed in the contract with this measurement.
 *
 * SO IT IS SAID IN WORDS, which is the one channel colour cannot contend
 * for, in a slot that was spending itself on furniture. The caption read
 * *"Where your work stands. Press a station to see only the runs there."* --
 * a label this section's own `aria-label` already carries, plus an
 * instruction the first press teaches. Neither said anything about the work.
 *
 * IT DOES NOT REPEAT THE HERO. That line counts ("2 runs have stopped");
 * this names WHICH station and says nothing will move it. A count and a
 * location with a consequence are different claims, and law 14's own test
 * agrees: a short factual count re-read confirms, where this sentence tells
 * a reader something the count could not.
 */
export function captionFor({
  mode,
  stations,
  selected,
}: {
  mode: "promise" | "map";
  stations: readonly JourneyStation[];
  selected?: JourneyKey | null;
}): string | null {
  const here = selected ? stations.find((s) => s.key === selected) : null;
  const empty = stations.every((s) => !s.count);
  const stoppedHere = stations
    .filter((s) => s.state === "stopped" && (s.count ?? 0) > 0)
    .map((s) => AGENT_STATIONS[s.key].name);
  return mode === "promise"
    ? null
    : /*
       * ── A SELECTED STATION WITH NOTHING ON IT: THE LIST ALREADY SAID IT ───
       *
       * This read "Showing the 0 runs at Discover." over a list reading
       * "Nothing is standing at Discover." One press, one fact, two sentences
       * -- and "the 0 runs" is an absence dressed as a count, which
       * `_authenticated.crew.tsx` names as a defect in its own words: *"A zero
       * stated as a count is the same defect as the negation wall on the
       * board."*
       *
       * The emptiness belongs to the LIST, which is the thing that is empty.
       * What only this line can carry is the way back, and the `Show all`
       * control beside it is that -- so the sentence goes and the control
       * stays.
       *
       * An empty filter stop is no longer pressable at all (`Journey`), so
       * this is now reachable only by standing on a station while its last run
       * finishes. Rare, real, and it must not print a zero when it happens.
       */
      selected && here && (here.count ?? 0) === 0
      ? null
      : selected && here
        ? `Showing the ${here.count} ${here.count === 1 ? "run" : "runs"} at ${AGENT_STATIONS[selected].name}.`
        : empty
          ? "Nothing is standing on the road. What finished is in the runs below."
          : stoppedHere.length > 0
            ? `${joinPlainly(stoppedHere)} ${stoppedHere.length === 1 ? "has" : "have"} stopped, and will not move without you.`
            : "Press a station to see only the runs there.";
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
  const caption = captionFor({ mode, stations, selected });

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
      {/* THE WAY BACK OUTLIVES THE SENTENCE. `caption` is null when a selected
          station has emptied, because the list below already says so -- but the
          person is still standing inside a filter and needs the way out of it,
          so the row renders for either reason. Gating the row on `caption`
          alone took `Show all` away at exactly the moment it was most needed. */}
      {caption || (selected && onSelect) ? (
        <p className="mrd-meta flex items-center gap-mrd-3">
          {caption ? <span>{caption}</span> : null}
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
