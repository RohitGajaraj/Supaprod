/**
 * ── THE ONE THING THIS PRODUCT EXISTS TO DO, AND THE HOME COULD NOT SAY IT ─
 *
 * The founder's complaint is *"I cannot feel the value and I cannot see any
 * real connectivity"*. The home already answers four questions since you last
 * looked: what is waiting, what arrived, what shipped, what was learned.
 *
 * **None of them is "your work moved."**
 *
 * MEASURED 2026-09-10. The loop had dispatched nothing for nineteen hours. At
 * 23:00 UTC a track that had been stuck since 2026-09-06 was driven, its
 * planner completed, and it moved `define -> design`. `stage_events` recorded
 * it at 23:01:39. That was the single most significant event in the product
 * that day, on the founder's own workspace — and a person returning to the
 * home would have seen a road in a different shape and no sentence anywhere
 * telling them anything had happened.
 *
 * A road shows the new STATE. It cannot show the CHANGE, because it has
 * nothing to compare against; only "since you last looked" knows that.
 *
 * ── FORWARD AND BACKWARD ARE DIFFERENT NEWS AND ARE SAID DIFFERENTLY ──────
 * A run moving on is the loop working. A run sent BACK is a correction — also
 * news, and not the same news, so it is never folded into one count. The
 * product already treats a send-back as a distinct act everywhere else (it is
 * what `corrections` are counted against), and a line that said "4 runs moved"
 * over three forward and one backward would be the flattering kind of true.
 *
 * ── AND IT NAMES THE RUN WHEN THERE IS ONE ────────────────────────────────
 * "One run moved on" is a count. *"Warn a homeowner before an installer visit
 * is cancelled reached Design"* is the product telling you what it did, and a
 * count is what you fall back to when there are too many to name. That is the
 * same rule `WhetherItWorked` follows one region down: a fact beats a tally.
 */
import { JOURNEY_ORDER } from "@/components/meridian/Journey";

/** One recorded station change, as `stage_events` holds it. */
export type Move = {
  /** The station it left. Null for a track entering its first station. */
  from: string | null;
  to: string;
  /** The run's own title, for the sentence that names one. */
  title: string;
  at: string;
};

const rank = (station: string | null): number =>
  station === null ? -1 : (JOURNEY_ORDER as readonly string[]).indexOf(station);

/** Did this move go forward along the road? */
export function movedOn(m: Move): boolean {
  const to = rank(m.to);
  if (to < 0) return false;
  /*
   * A TRACK ENTERING ITS FIRST STATION HAS MOVED ON. `from` is null when
   * nothing preceded it, and treating that as "not forward" would silence the
   * most encouraging line the home can draw: the first time a sentence somebody
   * typed became work.
   */
  return rank(m.from) < to;
}

export type WorkMoved =
  | { kind: "none" }
  /** Exactly one, and it is named. */
  | { kind: "one"; title: string; station: string }
  /** Several, so it is a count. */
  | { kind: "many"; forward: number }
  /** Nothing went forward, but something was sent back. */
  | { kind: "back"; sentBack: number };

/**
 * What moved since a person last looked.
 *
 * `since` null means the record cannot say when they last looked, and the
 * honest answer is nothing rather than "everything ever" — the same rule
 * `arrivingAnswer` follows for the same field.
 */
export function theWorkMoved(input: {
  moves: readonly Move[] | null;
  since: string | null;
}): WorkMoved {
  if (!input.moves || !input.since) return { kind: "none" };
  const after = input.moves.filter((m) => m.at > input.since!);
  const forward = after.filter(movedOn);
  const back = after.length - forward.length;
  if (forward.length === 1) {
    return { kind: "one", title: forward[0]!.title, station: forward[0]!.to };
  }
  if (forward.length > 1) return { kind: "many", forward: forward.length };
  /* A send-back with no forward move is still the loop doing something, and it
     is the state a person most needs to know about, because it is the one they
     may want to argue with. */
  if (back > 0) return { kind: "back", sentBack: back };
  return { kind: "none" };
}
