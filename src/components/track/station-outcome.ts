/**
 * WHAT CAME OF EACH STATION, for the run map and the run strip.
 *
 * ── THE FIELD WAS DESIGNED AND NEVER FILLED (2026-09-02) ───────────────────
 * `RunMapStation.outcome` has carried this docstring since it was written:
 * *"WHAT CAME OF THIS STATION, in outcome words a reader would use."* Nothing
 * ever set it, so `noteFor` in `run-strip-spec.ts` returned the waived reason
 * or an empty string and every stage on both surfaces drew a blank line.
 *
 * ── AND THE SENTENCE ALREADY EXISTED, WHICH IS THE POINT OF THIS FILE ──────
 * My first version of this counted rows in `agent_runs` and said "3 turns, 2
 * with failures". It shipped, it was true, and it was the wrong answer: it
 * described the WORK rather than the PRODUCT, on a field whose whole contract
 * is the product.
 *
 * `whatItProduced` in `what-it-produced.ts` had been in the tree the whole
 * time, doing exactly this, already used by `ArtifactPane` and by nothing else.
 * It reads `spine_track_members` -- the table that records which artifact each
 * station filed -- through `getTrackChain`, which the run screen ALREADY polls
 * under `["spine-track-chain", trackId]`. So the right implementation needed no
 * new server function, no new query and no new vocabulary, and the one I wrote
 * needed all three. This file is now the hand-off and nothing else.
 *
 * It also inherits the rules that function already holds: `wordFor` and
 * `joinPlainly` name every artifact kind, so a changeset is "a code change"
 * here exactly as it is everywhere else, and no noun is invented.
 *
 * ── ONE HAND-OFF, BECAUSE `runPosition` MAY NOT QUERY ──────────────────────
 * `run-position.ts` states its own constraint: it *"reads ONE row and takes no
 * second query ... the reason the header, the meter and the route cannot
 * disagree"*. So the caller reads the chain and hands over finished words.
 */
import { whatItProduced, type ProducedMember } from "@/components/track/what-it-produced";
import type { AgentStation } from "@/lib/agent-vocabulary";

/** One stop off the chain, narrowed to what a sentence needs. */
export type OutcomeStop = {
  station: AgentStation;
  label: string;
  members: readonly ProducedMember[];
};

/**
 * The line for every station that produced something.
 *
 * A station with nothing filed is OMITTED rather than mapped to an empty
 * string: `whatItProduced` returns null there, and an absent key means the stop
 * renders no note at all. That is the correct reading of a station that has not
 * been reached, and of one that ran and filed nothing -- `StationPanel` already
 * owns the words for the second case ("Plan ran and filed no spec"), and
 * repeating them in the strip would be the same fact in two places.
 */
export function stationOutcomes(
  stops: readonly OutcomeStop[] | undefined,
): Partial<Record<AgentStation, string>> | undefined {
  if (!stops) return undefined;
  const out: Partial<Record<AgentStation, string>> = {};
  for (const stop of stops) {
    const line = whatItProduced(stop.label, stop.members);
    if (line) out[stop.station] = line;
  }
  return out;
}
