/**
 * NINE ROWS IS FINE. NINE PARAGRAPHS SAYING ONE THING IS THE DUMP.
 *
 * ── THE UNIT WAS WRONG, AND THE ROW FOLD ONLY CAUGHT THE TIDY HALF ─────────
 * `foldRepeats` collapses CONSECUTIVE turns that keep saying one thing, and on
 * `6cc7a010` that was the right idea aimed at the wrong unit. Build's section
 * is not six consecutive turns. In the order the record holds them:
 *
 *   08:00  turn     Engineer  "No repository is connected..."
 *   08:00  turn     Review    "No repository is connected..."
 *   08:03  handoff            "Identify current market trends..."
 *   08:03  handoff            "Conduct user interviews and surveys..."
 *   08:10  turn     Engineer  "No repository is connected..."
 *   08:30  check              Checked its own work: 1 held, 1 did not
 *   08:30  turn     Review    "No repository is connected..."
 *   08:40  turn     Engineer  "No repository is connected..."
 *   08:40  turn     Review    "No repository is connected..."
 *
 * Two handoffs and a check sit inside the run, so with a floor of three only
 * the last three fold: nine items become seven. **And the fold must not reach
 * across them** -- a handoff is a distinct event with its own words, and
 * collapsing over it would put "6 turns, 08:00 to 08:40" above two rows that
 * happened in the middle of that span. The transcript is chronological and a
 * fold cannot lie about that.
 *
 * So counting ROWS was the mistake. The founder's complaint is about the wall
 * of prose, and six paragraphs saying one thing are a wall whether the rows
 * that carry them are consecutive or not.
 *
 * ── WHAT THIS DOES INSTEAD ────────────────────────────────────────────────
 * It asks one question of a whole section: **did the turns here keep saying one
 * thing?** When they did, the section says it ONCE, at the top, in the words of
 * the first seat that said it -- and the rows below drop their prose and keep
 * everything else they have: the clock, the seat, the outcome, the tool calls
 * and the trace door.
 *
 * Chronology is untouched. Every row stays exactly where it was. The handoffs
 * and the check keep their place and their words. What goes is five paraphrases
 * of one wall, and the door to any single one of them is the trace link that
 * was always on the row.
 *
 * ── WHY MOST OF A SECTION AND NOT ALL OF IT ───────────────────────────────
 * A station where five of six turns hit one wall and the sixth said something
 * else is still a station that kept saying one thing, and requiring unanimity
 * would let one stray turn put all six paragraphs back. But the sixth turn's
 * prose must survive, or the one turn that said something different is the one
 * the screen hides -- which is this week's defect arriving by the back door.
 *
 * So the group is identified by claim, the header speaks for the group, and a
 * turn outside the group keeps its own words. The caller drops prose per row
 * by asking `saidTheSameThing`, never per section.
 */
import { claimOf, containment, MIN_CONTAINMENT } from "@/lib/spine/what-it-keeps-saying";
import { whatASeatActuallySaid } from "@/lib/spine/what-a-seat-actually-said";

export type SayingRow = {
  runId: string;
  agentName: string;
  said: string | null;
  made: readonly unknown[];
  outcome: "working" | "done" | "partly" | "stopped" | "waiting";
};

/**
 * ── NOTHING'S WORDS COME OFF THE SCREEN, AND THAT IS A MEASUREMENT RESULT ──
 *
 * The first design removed a row's prose when the header was carrying it, and
 * that needs a test for "is this the same sentence" that can be trusted, because
 * being wrong hides the one turn that said something different. Three measures
 * were tried against real output. None of them can do it.
 *
 * Scored on the real Build anchor, "No repository is connected for this
 * workspace", against the pairs that MUST group and the near-misses that must
 * not:
 *
 *                             containment   Jaccard
 *   Build's four variants        1.000       1.000    must group
 *   Design's credit halts        1.000       0.909    must group
 *   Discover's 1 vs 3            0.700       0.500    must group
 *   "...no branch matching..."   0.667       0.250    must not
 *   "...rejected the push..."    0.667       0.286    must not
 *   "...contains no source files" 1.000      0.500    must not
 *
 * `containment` divides by the SMALLER set, so it is already symmetric and a
 * longer sentence about the same subject contains a short claim completely --
 * "the repository connected to this workspace contains no source files" scores
 * 1.000 against "no repository is connected for this workspace", and they are
 * different facts. Jaccard fixes that and then collides elsewhere: Discover's
 * genuine pair and the repository near-miss both score exactly 0.500.
 *
 * **A bag of words cannot separate "the same claim" from "that subject, a
 * different predicate", and no threshold on any of these measures does it.**
 *
 * ── SO THE DESIGN CHANGED RATHER THAN THE NUMBER ──────────────────────────
 * A row in the group does not lose its words. It CLAMPS them: `Reveal` at one
 * line instead of three, with its own control to open. The header carries the
 * sentence in full, each row shows its own first line, and any row opens.
 *
 * That removes the risk instead of measuring it. Six paragraphs become six
 * single lines under one full quote, so the wall of prose is gone; a turn that
 * said something different SHOWS that in its one line rather than being hidden
 * by a threshold that guessed wrong; and the grouping can stay loose, because
 * being wrong now costs a reader a clamped line rather than a missing turn.
 *
 * It is also the better interaction, which is the tell that it was the right
 * answer and not the safe one: a reader scanning six clamped lines sees at a
 * glance whether they are the same, which is the question the header's claim
 * invites and which hiding them made unanswerable.
 */
export type StationRefrain = {
  /** The sentence, from the first turn in the section that said it. */
  said: string;
  /** How many turns in this section made that claim. */
  turns: number;
  /** The seats that made it, in first-seen order. */
  seats: string[];
  /** The run ids whose prose the header now speaks for. */
  covers: ReadonlySet<string>;
};

/**
 * THREE, AND THE SAME REASON THE REFRAIN USES.
 *
 * Two turns agreeing is the ordinary healthy shape of this product, and this
 * one is not restricted to failures the way `theBlockerItAlreadyNamed` is: a
 * section of `done` turns qualifies, and Discover's three "nothing was found"
 * turns are exactly the case. So it takes the stricter floor.
 */
export const MIN_SECTION_TURNS = 3;

/**
 * What this station kept saying, when it kept saying anything.
 *
 * `rows` is the section's turns, oldest first. Turns that FILED something are
 * not eligible: a station that produced is not one repeating itself, whatever
 * its prose says, and the record's verdict beats the agent's account of itself.
 */
export function whatThisStationKeptSaying(rows: readonly SayingRow[]): StationRefrain | null {
  /* Prose first, for the reason `what-a-seat-actually-said.ts` gives: some
     output is the loop's preamble with a raw JSON step pasted after it, and
     `claimOf` would otherwise group these turns on punctuation. */
  const eligible = rows
    .map((r) => ({ ...r, said: whatASeatActuallySaid(r.said) }))
    .filter(
      (r) =>
        r.made.length === 0 &&
        r.outcome !== "working" &&
        r.outcome !== "waiting" &&
        claimOf(r.said) !== null,
    );
  if (eligible.length < MIN_SECTION_TURNS) return null;

  /*
   * The LARGEST group of turns making one claim, anchored on each candidate in
   * turn. Anchored rather than clustered, so every member is scored against the
   * sentence the header will actually print -- a cluster built pairwise can end
   * up with members that share nothing with the words on screen.
   */
  let best: { anchor: SayingRow; members: SayingRow[] } | null = null;
  for (const anchor of eligible) {
    const claim = claimOf(anchor.said)!;
    const members = eligible.filter((r) => containment(claim, claimOf(r.said)!) >= MIN_CONTAINMENT);
    if (!best || members.length > best.members.length) best = { anchor, members };
  }
  if (!best || best.members.length < MIN_SECTION_TURNS) return null;

  const seats: string[] = [];
  for (const m of best.members) if (!seats.includes(m.agentName)) seats.push(m.agentName);

  /*
   * ── THE REPRESENTATIVE TURN IS THE LAST, AND IT WAS THE FIRST FOR A DAY ────
   * The argument for the first was: every later turn is the same seat
   * re-reporting the same wall, so the first telling is the one written before
   * any of the re-trying coloured it. That is true of a STATIC wall. It is false
   * of a wall that is changing, and S1 read the difference on the served build
   * within an hour:
   *
   *   before  09:30  "3 times, 09:10 to 09:30"  ...account credit balance (15)
   *           11:00  "9 times, 09:40 to 11:00"  ...account credit balance (1)
   *   after   11:00  "12 times, 09:10 to 11:00" ...account credit balance (15)
   *
   * **Stamped at the END of the span and quoting the START of it**, over a hold
   * card still quoting (1), so one page carried one event with two balances and
   * the card's number matched no row below it. And 15 draining to 1 is the only
   * thing those twelve turns actually recorded happening -- the run spent the
   * account while failing -- so quoting the first is the single choice that hides
   * the only news in the group.
   *
   * The last is right on three counts and loses nothing on the fourth: it matches
   * the stamp a reader is looking at, it is the current state where the text
   * varies, it agrees with every other surface quoting the same group, and where
   * the text does not vary it is the same sentence.
   *
   * Not the anchor's either, when they differ: the anchor is whichever sentence
   * the most turns agreed with, which is a fact about the GROUP and not the
   * words to print.
   */
  const newest = best.members[best.members.length - 1]!;

  return {
    said: newest.said!.trim(),
    turns: best.members.length,
    seats,
    covers: new Set(best.members.map((m) => m.runId)),
  };
}

/**
 * Is the section header already carrying this row's sentence?
 *
 * True means the row CLAMPS its prose to one line, never that it loses it. See
 * the note above: no measure available here can be trusted to decide that a
 * row's words are safe to remove, so none of them is asked to.
 */
export function saidTheSameThing(refrain: StationRefrain | null, runId: string): boolean {
  return refrain ? refrain.covers.has(runId) : false;
}

/**
 * The line above the quote, and it says the ONE thing the header cannot.
 *
 * ── THE FIRST DRAFT PUT THE STATION'S NAME IN IT THREE TIMES ──────────────
 * It read `${seats} said this ${n} times:`, and on the measured run Design's
 * seat is called Design, under a header already reading "Design" and a meta
 * already reading "Design · 12 turns · 7.3s". Three sightings of one word in
 * forty pixels, in copy written the same afternoon as the rule against it.
 *
 * The header names the station. The meta names the seats and counts the turns.
 * Neither can say what this says: that the quote below stands for all of them,
 * or for how many. So that is all it says.
 *
 * "All 6 said this" when the group is the whole section, "5 of 6" when a turn
 * said something else -- and the difference matters, because the turn outside
 * the group is the one whose own words are still on its row, and a reader who
 * is told "5 of 6" knows to look for the sixth.
 */
export function stationRefrainLead(r: StationRefrain, turnsInSection: number): string {
  return r.turns >= turnsInSection
    ? `All ${r.turns} said this:`
    : `${r.turns} of ${turnsInSection} said this:`;
}

/**
 * Are these two sentences making one claim?
 *
 * Used where two surfaces each quote a real turn and could have picked
 * different ones: on a station whose seats rephrase the same wall every
 * attempt, string equality says "different" about two sentences a reader takes
 * as one. Scored by the same containment measure everything else here uses.
 */
export function sameClaim(a: string | null | undefined, b: string | null | undefined): boolean {
  const x = claimOf(a);
  const y = claimOf(b);
  if (!x || !y) return false;
  return containment(x, y) >= MIN_CONTAINMENT;
}
