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

  /*
   * ── TRACKS, NOT MOVES, AND THIS WAS WRONG FOR AN HOUR ────────────────────
   *
   * The first version counted forward MOVES. Then the loop started walking:
   * `a30d6b62` went `define -> design -> build` in twenty minutes, three drives
   * on ONE track, and this would have said **"3 runs moved on"** about a single
   * piece of work.
   *
   * That is the same defect the run screen was repaired for the same night --
   * "67 findings" where there were four, logged seventeen times each -- and it
   * is the reason `foldVersions` exists one folder over. A count of events
   * wearing the clothes of a count of things.
   *
   * SO IT FOLDS BY TRACK, AND THE NAMED CASE TAKES THE FURTHEST STATION. A
   * track that moved three times has not done three things; it has got to
   * Build. "Reached Build" is the true sentence and it is also the more useful
   * one, because it is where the work actually stands.
   */
  const furthest = new Map<string, Move>();
  for (const m of forward) {
    const held = furthest.get(m.title);
    /* Ordered by nothing in particular, so take the later timestamp rather than
       trusting arrival order -- the read is newest-first today and a caller
       reversing it must not silently change which station is reported. */
    if (!held || m.at > held.at) furthest.set(m.title, m);
  }

  if (furthest.size === 1) {
    const only = [...furthest.values()][0]!;
    return { kind: "one", title: only.title, station: only.to };
  }
  if (furthest.size > 1) return { kind: "many", forward: furthest.size };

  /* A send-back with no forward move is still the loop doing something, and it
     is the state a person most needs to know about, because it is the one they
     may want to argue with. Folded the same way, for the same reason. */
  const back = new Set(after.filter((m) => !movedOn(m)).map((m) => m.title));
  if (back.size > 0) return { kind: "back", sentBack: back.size };
  return { kind: "none" };
}
