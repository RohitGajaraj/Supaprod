/**
 * The rail's half of the presence contract (SPEC-PRESENCE.md §Anatomy #2).
 *
 * The run page derives its character from `deriveCharacter`, whose input is ONE
 * track's rows. The shell stands on no track: it answers a different question
 * — "is anything moving in this workspace, and does any of it need me" — from
 * the reads the header already polls. This module is that derivation, pure so
 * the precedence can be tested rather than trusted.
 *
 * THE IRON LAW HOLDS HERE TOO. Every state maps to rows the shell actually
 * holds, in the same precedence `deriveCharacter` uses: a person being needed
 * outranks work in flight, and a dead feed is said plainly rather than painted
 * over. There is no "busy" state to fall back on, because a state the data
 * cannot prove is theatre, and theatre is the one regression this product
 * cannot afford.
 */

import type { CharacterState } from "@/lib/presence/character";

export interface RailPresenceInput {
  /** The shell's reads have not answered yet — nothing may be claimed. */
  loading: boolean;
  /** A read errored. Distinct from "no rows", and said out loud. */
  feedDead: boolean;
  /** Decisions waiting on the person (`approvalsQueue.items`). */
  waitingOnYou: number;
  /** Mission runs with a worker on them right now (`WORKING.has(status)`). */
  missionsWorking: number;
  /** Spine tracks with a run in `agent_runs.status IN (running, queued, in_progress)`. */
  tracksMoving: number;
  /** Seats from the running-now read whose last call is inside the stall
   *  threshold; null while that read has not answered. A seat that has
   *  stopped calling must not be drawn breathing (fourth review, 2026-09-09). */
  seatsAlive?: number | null;
}

/**
 * Precedence mirrors `deriveCharacter`: asking beats working beats awake, and
 * a feed we cannot read is admitted before any of them.
 */
export function deriveRailPresence(input: RailPresenceInput): CharacterState {
  // An unread feed proves nothing either: the caller draws no mark at all
  // while loading, but the derivation refuses to hand it one regardless.
  if (input.loading || input.feedDead) return "out-of-touch";
  if (input.waitingOnYou > 0) return "asking";
  if (input.missionsWorking > 0 || input.tracksMoving > 0)
    return input.seatsAlive === 0 ? "quiet" : "working";
  return "awake";
}
