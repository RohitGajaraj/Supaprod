/**
 * WHAT WAS HANDED OVER, NOT JUST THAT SOMETHING WAS.
 *
 * ── THE RULING, ASKED FOR TWICE ────────────────────────────────────────────
 * "Show visually which agent is working, the handoff, the outcome." The
 * transcript already marks the moment work changes hands and names who it came
 * from. It has never said WHAT came with it, and that is the half a person
 * actually needs: "picked up from Discover" is ownership, "picked up from
 * Discover with its brief" is the event.
 *
 * ── THE STATION FILED IT, NOT THE LAST TURN ────────────────────────────────
 * The obvious derivation reads the turn immediately before the handoff and
 * lists what that turn made. It is wrong often enough to matter: a station runs
 * several turns, and the last one before a move is frequently the one that
 * checked the work rather than the one that produced it. Reading only that turn
 * would report "filed nothing" over a station that filed the spec two turns
 * earlier. So this walks every turn the previous station ran in this stretch.
 *
 * ── THE EMPTY HANDOFF IS THE POINT, NOT THE EDGE CASE ──────────────────────
 * A station that moved the work on having produced nothing is this product's
 * most common failure and its best-hidden one: the run looks like it advanced.
 * Measured on this repo's own tracks, "ran but filed nothing" is the single most
 * frequent hold. So an empty handoff gets a sentence of its own rather than a
 * blank where a list would be, and the sentence says what the next station is
 * starting from.
 */
import type { Turn } from "@/lib/spine/activity";

/** Turns are oldest first. Everything the station ran, before the handoff. */
export function turnsAtStation(
  earlierOldestFirst: readonly Turn[],
  stationName: string,
): Turn[] {
  const out: Turn[] = [];
  for (let i = earlierOldestFirst.length - 1; i >= 0; i--) {
    const t = earlierOldestFirst[i]!;
    if (!t.stationName) continue;
    // The run of turns is contiguous: the first turn belonging to any other
    // station ends this station's stretch. Scanning the whole history instead
    // would fold in an earlier visit, which a rewind makes a real possibility.
    if (t.stationName !== stationName) break;
    out.unshift(t);
  }
  return out;
}

/** The kind words for everything those turns filed, in the order they landed. */
export function whatCameWith(turns: readonly Turn[]): string[] {
  const words: string[] = [];
  for (const t of turns) for (const m of t.made) if (m.word) words.push(m.word);
  return words;
}

/**
 * The line under a handoff row.
 *
 * Lists up to two by name and counts the rest, because a station that filed six
 * things turns the meta line into a paragraph and the reader came here for the
 * shape of the run, not an inventory. The full list is in the record beside it.
 */
export function handoffLine(fromStationName: string, words: readonly string[]): string {
  const from = `picked up from ${fromStationName}`;
  if (words.length === 0) return `${from}, which filed nothing`;
  if (words.length === 1) return `${from} with its ${words[0]}`;
  if (words.length === 2) return `${from} with its ${words[0]} and ${words[1]}`;
  return `${from} with its ${words[0]}, ${words[1]} and ${words.length - 2} more`;
}
