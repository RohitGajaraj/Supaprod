/**
 * WHEN A RUN IS STUCK, IT USUALLY SAID SO — IN WORDS — AND NOBODY READ THEM.
 *
 * ── THE MEASUREMENT THAT PRODUCED THIS FILE ────────────────────────────────
 * Track `ce846e9b` on Helio Labs, read live on 2026-09-09. Build and QA traded
 * eighteen turns across three hours and forty minutes, filed nothing on any of
 * them, and the run screen rendered:
 *
 *   05:20  Filed nothing. Engineer, 25.0s.
 *   05:20  Filed nothing. Review, 22.7s.
 *   05:30  Filed nothing. Engineer, 19.8s.
 *   05:30  Filed nothing. Review, 20.3s.
 *   05:40  Filed nothing. Engineer, 14.8s.
 *   05:40  Filed nothing. Review, 20.6s.
 *
 * Six rows, identical but for a stopwatch. What those seats actually wrote into
 * `agent_runs.output`, every single turn, was one plain and completely
 * actionable sentence:
 *
 *   *"This repository contains only the checkout module for Relay, not the full
 *    Relay homeowner app that renders status tiles."*
 *
 * The run was not mysterious. It was pointed at the wrong repository, it said
 * so eighteen times, and the product answered with a stopwatch and a hold card
 * reading *"Build was corrected, came back, and still cannot finish."* — which
 * is the machinery describing itself while the answer sat one column away.
 *
 * ── WHY THE PROSE IS NOT SIMPLY PUT BACK ON THE ROW ────────────────────────
 * It was there once. P-105 removed it, and P-105 was right: a Design critic's
 * turn carries a four-hundred-word paragraph, and seven of those stacked is the
 * "dump of text" the founder named against the old run screen. Restoring it
 * would trade a screen that says nothing for a screen nobody can read.
 *
 * So neither. The rule this file implements is the one the transcript already
 * follows for chips and the strip follows for its stations: **say it when it
 * DISCRIMINATES, computed over the rendered set, and stay silent when it does
 * not.** Eighteen turns saying one thing is ONE fact, not eighteen, and it is
 * the most important fact on the screen. It gets said once, at the top, in the
 * run's own most recent words — and the rows underneath stay short.
 *
 * ── AND WHY THE AGENT'S SENTENCE IS QUOTED, NEVER BELIEVED ─────────────────
 * F-54 stands: a seat's narrative disagrees with its own tool calls, and
 * `headline` is right to compute "filed nothing" from the members join rather
 * than from prose. Nothing here grades a turn or overrides a verdict. The
 * refrain is *reported speech* — this is what the run keeps telling you — and
 * every consumer renders it as the run's claim beside the record's verdict, so
 * a reader can see the two disagree. The record still says nothing was filed.
 * That is the point: it said nothing was filed, six times, for the same stated
 * reason, and that reason is the thing to act on.
 *
 * ── WHAT IS DELIBERATELY NOT DONE ─────────────────────────────────────────
 * No model call, no summarisation, no rewriting. The refrain is a sentence one
 * of the seats actually wrote, chosen rather than composed, because a sentence
 * this product PUTS IN QUOTES has to be a sentence somebody said. The matching
 * is a content-word containment ratio and nothing cleverer: it runs on the
 * client, over rows already on the wire, and its threshold is pinned against
 * the real production sentences above in the test beside this file.
 *
 * Pure and dependency-free but for the prose cleaner, the same split
 * `activity.ts`, `route.ts` and `driver.ts` use.
 */
import { plainProse } from "@/lib/plain-prose";
import { humanizeText } from "@/lib/ai/humanize";

/**
 * One thing the run has said more than once, running to the newest turn.
 *
 * Anchored on the NEWEST qualifying turn rather than on the longest streak
 * anywhere in the record, because a reader opening a stopped run is asking
 * "why is it stuck NOW". A refrain that ended an hour ago and was then worked
 * past is history; this is the run's current position, stated by the run.
 */
export type Refrain = {
  /** The claim, verbatim, in the newest words a seat used for it. */
  saying: string;
  /** How many consecutive turns made it. Never below `MIN_TURNS`. */
  turns: number;
  /** The seats that made it, newest first, deduped, by display name. */
  seats: string[];
  /** When the first of those turns ran (ISO). */
  from: string;
  /** When the last of them ran (ISO). */
  to: string;
};

/** What one turn contributes. A structural subset of `activity.ts`'s `Turn`. */
export type SayingTurn = {
  runId: string;
  agentName: string;
  at: string;
  outcome: "working" | "done" | "partly" | "stopped" | "waiting";
  made: Array<unknown>;
  said: string | null;
};

/**
 * THREE, NOT TWO.
 *
 * Two consecutive seats agreeing is the ordinary healthy shape of this product
 * — Draft files and Critique confirms, Build builds and Verify checks — and
 * calling that a refrain would put a banner over every well-behaved run. Three
 * is the first count that cannot be a handoff. Measured against the stuck
 * tracks on production, every genuine loop runs to six or more.
 */
export const MIN_TURNS = 3;

/**
 * HOW MUCH OF THE SHORTER SENTENCE HAS TO BE IN THE LONGER.
 *
 * Containment on the shorter of the two, not Jaccard over the union: the seats
 * restate one claim at wildly different lengths, and a symmetric measure
 * punishes the turn that gave more detail for giving it. On the measured pair
 * below, Jaccard reads 0.21 and would call one claim two.
 *
 * ── THE NUMBER IS MEASURED, NOT CHOSEN ─────────────────────────────────────
 * Every sentence the seats wrote on `ce846e9b` was scored against the newest
 * one. The nine that restate "you are pointed at the wrong repository", and the
 * eight from turns that were each saying something genuinely different:
 *
 *   RESTATEMENTS OF THE ANCHOR          DIFFERENT CLAIMS ENTIRELY
 *   0.636  only the checkout module     0.125  Design surface created: ...
 *   0.500  does not contain any tile    0.091  Decision recorded: build the fix
 *   0.455  (AddressStep.tsx, ...)       0.000  PRD drafted with ID ebca33b5
 *   0.364  I cannot implement ...       0.000  the prototype violates the ...
 *   0.364  After examining ... I found  0.000  the strongest case against ...
 *   0.333  only checkout-related files  0.000  Reached the step limit
 *   0.300  the repository structure     0.000  the design conforms to the spec
 *   0.273  the notification tile impl   0.000  Spec drafted with ID 08546dce
 *   0.250  out of scope for the repo
 *
 * The two populations do not overlap and the band between them — 0.125 to
 * 0.250 — is empty and twice as wide as the margin either side of this
 * threshold. 0.2 sits in the middle of that gap, so the classification is not
 * balanced on a tuned decimal: every restatement clears it by 25% or more and
 * every unrelated sentence misses it by 37% or more.
 *
 * A number that had to sit at 0.45 to work would have been the wrong
 * instrument, and the first version of this file used one. The reason the
 * honest number is so low is that a claim survives restatement in only three or
 * four content words — repository, contain, checkout, tile — while everything
 * else in the sentence is the seat choosing different scaffolding each time.
 */
export const MIN_CONTAINMENT = 0.2;

/**
 * Words that carry no claim. Deliberately short: this is a stop list for a
 * containment ratio, not for search, and every word removed here is a word that
 * can no longer distinguish two sentences. Anything domain-bearing stays —
 * "repository", "spec", "nothing" and "cannot" all discriminate.
 */
const EMPTY_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "if",
  "then",
  "than",
  "that",
  "this",
  "these",
  "those",
  "it",
  "its",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "to",
  "of",
  "in",
  "on",
  "at",
  "by",
  "for",
  "with",
  "from",
  "as",
  "into",
  "onto",
  "up",
  "out",
  "so",
  "not",
  "no",
  "i",
  "we",
  "you",
  "there",
  "here",
  "which",
  "who",
  "what",
  "when",
  "where",
  "how",
  "any",
  "all",
  "some",
  "only",
  "just",
  "also",
  "still",
  "yet",
  "has",
  "have",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "can",
  "could",
  "should",
  "may",
  "might",
  "must",
]);

/**
 * A sentence reduced to the words that carry its claim.
 *
 * The trailing `s` goes because the seats write "tile" and "tiles", "component"
 * and "components" about the same thing one turn apart, and a matcher that
 * calls those different words calls the same claim two claims. `ss` is left
 * alone so "address" does not become "addres" and, worse, stop matching itself.
 * These keys are never displayed; only the verbatim sentence is.
 */
export function claimWords(sentence: string): Set<string> {
  const words = sentence
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    /* EMPTY BEFORE the trailing `s` comes off, AND after. Stripping first turns
       "this" into "thi" and "does" into "doe", neither of which is in the list,
       so two of the commonest words in English would have counted as claim
       words — and they did, in the first version of this file, which is how the
       threshold above came out nearly twice as high as the truth. */
    .filter((w) => !EMPTY_WORDS.has(w))
    .map((w) => (w.length > 3 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w))
    .filter((w) => w.length > 1 && !EMPTY_WORDS.has(w));
  return new Set(words);
}

/**
 * How much of the shorter claim is present in the longer, 0 to 1.
 *
 * Two empty sentences are not "identical" — they are two sentences with nothing
 * to compare, and returning 1 for them would let a pair of contentless rows
 * anchor a refrain. Zero is the honest answer.
 */
export function containment(a: string, b: string): number {
  const wa = claimWords(a);
  const wb = claimWords(b);
  if (wa.size === 0 || wb.size === 0) return 0;
  const [small, large] = wa.size <= wb.size ? [wa, wb] : [wb, wa];
  let shared = 0;
  for (const w of small) if (large.has(w)) shared += 1;
  return shared / small.size;
}

/**
 * The first sentence of what a seat wrote — its claim, without its workings.
 *
 * A seat's output opens with its conclusion and then argues for it; the opening
 * sentence is the part a person acts on, and the argument is what the fold
 * already holds whole. Cut at a full stop followed by a space, so decimals,
 * file names (`checkout.test.ts`) and `repo.tree` survive intact — every one of
 * those appears in the production sentences this was built against.
 *
 * Returns null for prose that has nothing to say, which is how a turn opts out
 * of the whole mechanism rather than contributing an empty claim.
 */
export function claimOf(said: string | null | undefined): string | null {
  const clean = plainProse(humanizeText(said ?? ""));
  if (!clean) return null;
  const flat = clean.replace(/\s+/g, " ").trim();
  if (!flat) return null;
  const cut = flat.search(/\.\s/);
  const first = (cut === -1 ? flat : flat.slice(0, cut + 1)).trim();
  const ended = /[.!?]$/.test(first) ? first : `${first}.`;
  // A fragment is not a claim. Six words is the shortest real one on record
  // ("This work is out of scope for the current repository." is nine).
  return claimWords(ended).size >= 3 ? ended : null;
}

/**
 * A turn that can join a refrain: it is FINISHED, it filed NOTHING, and it said
 * something.
 *
 * "Filed nothing" is the members join, not the prose — the same unfakeable
 * answer `headline` leads with. A turn that filed something is progress, and
 * progress is exactly what breaks a loop, so it ends a refrain no matter what
 * it said. A `working` or `waiting` turn is not evidence of anything yet.
 */
function joins(t: SayingTurn): boolean {
  if (t.outcome === "working" || t.outcome === "waiting") return false;
  if (t.made.length > 0) return false;
  return claimOf(t.said) !== null;
}

/**
 * What this run keeps saying, if it keeps saying anything.
 *
 * Walks BACKWARDS from the newest turn: the anchor is the run's latest word,
 * and each earlier turn joins while it is still making that same claim. The
 * first turn that filed something, said something else, or is still working
 * ends the walk — none of them can be part of "what it is saying now".
 *
 * `turns` arrives oldest-first, the order `getTrackActivity` returns.
 */
export function whatItKeepsSaying(turns: readonly SayingTurn[]): Refrain | null {
  if (turns.length < MIN_TURNS) return null;

  const newest = turns[turns.length - 1];
  if (!newest || !joins(newest)) return null;
  const anchor = claimOf(newest.said);
  if (!anchor) return null;

  const streak: SayingTurn[] = [newest];
  for (let i = turns.length - 2; i >= 0; i -= 1) {
    const t = turns[i];
    if (!t || !joins(t)) break;
    const claim = claimOf(t.said);
    if (!claim || containment(anchor, claim) < MIN_CONTAINMENT) break;
    streak.push(t);
  }

  if (streak.length < MIN_TURNS) return null;

  // Newest first, deduped: one seat holding four rows in a loop is one seat.
  const seats: string[] = [];
  for (const t of streak) if (t.agentName && !seats.includes(t.agentName)) seats.push(t.agentName);

  const oldest = streak[streak.length - 1];
  return {
    saying: anchor,
    turns: streak.length,
    seats,
    from: oldest?.at ?? newest.at,
    to: newest.at,
  };
}

/**
 * Who kept saying it, and how many times — the line that goes UNDER the quote.
 *
 * ── THE QUOTE LEADS AND THE COUNT FOLLOWS ─────────────────────────────────
 * The other order was written first and is wrong. "Review and Engineer said the
 * same thing 6 times:" makes the reader parse an attribution before reaching
 * anything they can act on, and the sentence they can act on is the whole
 * reason this block exists. A pull-quote leads with the words; the count is the
 * amplifier that turns one seat's remark into a finding about the run, and it
 * lands harder second.
 *
 * `seats` is named at one or two and collapsed to a count beyond that, because
 * "Engineer, Review, Draft, Critique and two others said" is a roster, and a
 * roster is the kind of completeness that stops a line being read.
 *
 * The SPAN is not in here. It is a fact about the same event, and the render
 * site appends it from the clock format that every other time on the transcript
 * already uses — building a second time format in this file is how a surface
 * ends up printing 05:20 in one place and 5:20 AM in another.
 */
export function refrainLead(r: Refrain): string {
  const who =
    r.seats.length === 1
      ? r.seats[0]
      : r.seats.length === 2
        ? `${r.seats[0]} and ${r.seats[1]}`
        : `${r.seats.length} seats`;
  return `${who} said this ${r.turns} times, and filed nothing on any of them.`;
}
