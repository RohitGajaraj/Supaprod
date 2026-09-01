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
export function turnsAtStation(earlierOldestFirst: readonly Turn[], stationName: string): Turn[] {
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
 * English plural for the record's own kind words.
 *
 * Deliberately small: the words this sees are a closed set the record writes
 * (signal, decision, spec, task, prototype, change, deployment, mission, run),
 * and every one of them is regular. The sibilant rule is here so a future kind
 * ending in s, x, ch or sh does not render as "sketchs".
 */
function plural(word: string, n: number): string {
  if (n === 1) return word;
  return /(s|x|z|ch|sh)$/i.test(word) ? `${word}es` : `${word}s`;
}

/** Kind words in the order they first landed, each with how many there were. */
function counted(words: readonly string[]): Array<{ word: string; n: number }> {
  const order: string[] = [];
  const tally = new Map<string, number>();
  for (const w of words) {
    if (!tally.has(w)) order.push(w);
    tally.set(w, (tally.get(w) ?? 0) + 1);
  }
  return order.map((word) => ({ word, n: tally.get(word) ?? 0 }));
}

/**
 * The line under a handoff row.
 *
 * ── THREE OF A KIND ARE COUNTED, NOT REPEATED ──────────────────────────────
 * Caught on the running product: a Discover station that filed three signals
 * rendered "with its signal, signal and 1 more", which reads like a stutter and
 * hides the actual number. Same-kind items are tallied, so it reads "with its 3
 * signals" and the count is the fact.
 *
 * ── AND IT NAMES TWO KINDS, THEN COUNTS ────────────────────────────────────
 * A station that filed six kinds would turn the meta line into a paragraph, and
 * a reader is here for the shape of the run, not an inventory. The rest is in
 * the record beside it.
 */
export function handoffLine(fromStationName: string, words: readonly string[]): string {
  const from = `picked up from ${fromStationName}`;
  if (words.length === 0) return `${from}, which filed nothing`;

  const groups = counted(words);
  const say = (g: { word: string; n: number }) =>
    g.n === 1 ? g.word : `${g.n} ${plural(g.word, g.n)}`;

  if (groups.length === 1) return `${from} with its ${say(groups[0]!)}`;
  if (groups.length === 2) return `${from} with its ${say(groups[0]!)} and ${say(groups[1]!)}`;
  return `${from} with its ${say(groups[0]!)}, ${say(groups[1]!)} and ${groups.length - 2} more`;
}
