// Journey wiring helpers (front-end reimagining, Phase 2): the pure logic
// between a journey chip and the room. Kept out of the connected
// MissionShell so the unit tests (and any other surface) can import them
// without dragging in live hooks, server functions, or the Supabase client.

import { journeyById, spineSliceFor, type JourneyId } from "@/lib/journeys";
import { resolveLoopState, type StageId, type StageLoopState } from "@/components/mission/Spine";
import type { JourneyHandoffLine } from "./MissionShellView";

/** What activating a journey does to the room: the slice it lights and the
 *  stage the Canvas lands on (the slice's first stage). */
export function journeyActivation(id: JourneyId): { stage: StageId; slice: StageId[] } {
  const slice = spineSliceFor(id) as StageId[];
  return { stage: slice[0], slice };
}

/** A journey reads done when every stage of its slice reports done. */
export function journeyIsDone(id: JourneyId, states: StageLoopState[]): boolean {
  const slice = spineSliceFor(id) as StageId[];
  return slice.length > 0 && slice.every((s) => resolveLoopState(states, s).state === "done");
}

/** The done-journey handoff line: plain-words done state + the ONE door
 *  (NextLine grammar) to the suggested next journey. Null while moving. */
export function journeyHandoffFor(
  id: JourneyId,
  states: StageLoopState[],
  onActivate: (next: JourneyId) => void,
): JourneyHandoffLine | null {
  if (!journeyIsDone(id, states)) return null;
  const journey = journeyById(id);
  const next = journeyById(journey.handoff.suggestedNextJourneyId);
  return {
    text: journey.doneState,
    doorLabel: next.label,
    onGo: () => onActivate(next.id),
  };
}
