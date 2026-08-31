/**
 * WHAT A PIECE OF WORK IS FOR, READ OFF THE ROW THAT ALREADY HOLDS IT.
 *
 * `SPEC-STATION-MODEL-AND-ARTIFACTS.md` §2.1 gives Discover a shape: problem,
 * proposed outcome, affected users and systems, constraints, open questions.
 * §4.3 rules how it reaches a person: **the five fields are a shape a person
 * READS, never a form a person fills** -- Discover fills them, and "a field the
 * station could not fill is shown as what it is, with the one action that
 * resolves it, inline. A missing field is a question the product asks, not a
 * blank the person is handed."
 *
 * ── THE MEASUREMENT THAT DECIDED WHAT THIS FILE IS, 2026-08-31 ─────────────
 * The previous unit measured `agent_messages` handoffs and concluded that the
 * PRODUCER was the defect before the surface was: 2 of 143 handoffs carry an
 * `open_questions` entry, 13 carry a `constraints` entry. **That is true of
 * those two fields and it is FALSE of the other three**, which is why this file
 * exists:
 *
 * | | rows |
 * | --- | --- |
 * | `opportunities`, real (not `is_sample`) | 511 |
 * | with `problem` | 510 |
 * | with `hypothesis` | 510 |
 * | with `target_user` | 503 |
 * | of the 84 reachable from a track's theme: with `problem` | **84 of 84** |
 * | same 84: with `target_user` | **77 of 84** |
 * | components anywhere under `src/components/track/**` reading any of them | **0** |
 *
 * ```sql
 * select count(*) filter (where nullif(trim(problem),'') is not null)
 *   from opportunities where coalesce(is_sample,false) = false;
 * ```
 *
 * Three of the five fields are filled on effectively every bet a track can
 * reach, and **the screen the product is judged on has never drawn one of
 * them.** That is the "wired end to end with no way in" class, and the fix is a
 * read, not a producer.
 *
 * ── WHY THREE FIELDS AND NOT FIVE ─────────────────────────────────────────
 * `constraints` and `open_questions` live in `agent_messages.payload`, and
 * **no `createServerFn` in this repo exposes that payload** -- `traces` selects
 * `mission_id` and `source_trace_id` from that table and nothing else. A field
 * whose source no read can reach is a state the data cannot prove, and §1.3's
 * law is that a state the data cannot prove is one you do not draw. So the two
 * of them wait for the reader, which is filed at
 * `coordination/requests/S1/read-the-handoff-payload-constraints-and-open-questions.md`.
 * **Claim never outruns wiring**, which is this repo's own phrase for it.
 */

/** The three fields of §2.1's shape a read can reach today, in §2.1's order. */
export type SolvingFieldName = "Problem" | "Proposed outcome" | "Affected users and systems";

/** The bet a track is working from. Column names are the table's, not ours. */
export type Bet = {
  id: string;
  title: string | null;
  problem: string | null;
  hypothesis: string | null;
  target_user: string | null;
};

export type SolvingField = {
  name: SolvingFieldName;
  /**
   * The column this field is read from. On screen it is never shown; it is
   * here because the brief's rule is that **a number, or a blank, names the
   * query that produced it**, and a blank whose source cannot be named is
   * indistinguishable from a read that failed.
   */
  column: "problem" | "hypothesis" | "target_user";
  /** What the station filled in, or null when it filled nothing. */
  value: string | null;
  /**
   * What the surface says instead of a blank. States the record rather than
   * the effort: "nothing here says" is true whether the station looked and
   * found nothing or never ran, and 81 of 106 tracks are the second case.
   */
  absent: string;
  /** The label on the control that resolves it, in the place the work is. */
  answerLabel: string;
};

/**
 * BLANKS ARE NAMED, NOT SKIPPED, and that is the one behavioural difference
 * from `OpportunityDetailSheet`'s "The bet" region, which renders
 * `{o.problem ? <Stated/> : null}` three times over. Skipping a blank is what
 * §2.1 calls passing quietly, and it is why 81 tracks sat at Discover with
 * nobody able to say what was missing from them.
 */
export function solvingFields(bet: Bet): SolvingField[] {
  const text = (v: string | null): string | null => {
    const t = (v ?? "").trim();
    return t.length > 0 ? t : null;
  };
  return [
    {
      name: "Problem",
      column: "problem",
      value: text(bet.problem),
      absent: "Nothing here says what is going wrong.",
      answerLabel: "Say what is going wrong",
    },
    {
      name: "Proposed outcome",
      column: "hypothesis",
      value: text(bet.hypothesis),
      absent: "Nothing here says what should be true instead.",
      answerLabel: "Say what should be true instead",
    },
    {
      name: "Affected users and systems",
      column: "target_user",
      value: text(bet.target_user),
      absent: "Nothing here says who this affects.",
      answerLabel: "Say who this affects",
    },
  ];
}

/** The fields the station left empty. Its length is the whole health of a bet. */
export function unfilled(fields: SolvingField[]): SolvingField[] {
  return fields.filter((f) => f.value === null);
}

/**
 * The one sentence above the shape, and it never reads as a clean bill when it
 * is not one. §2.1: "an empty list is a DEFECT, not a clean bill."
 */
export function shapeLine(fields: SolvingField[]): string {
  const gaps = unfilled(fields).length;
  if (gaps === 0) return "Everything this station is asked for has been written down.";
  if (gaps === fields.length)
    return "This came in as a title, and nothing under it is written down.";
  return gaps === 1
    ? "One thing this station is asked for has not been written down."
    : `${gaps} things this station is asked for have not been written down.`;
}

/**
 * WHAT THE SECTION IS, BEFORE ANY FIELD IS DRAWN.
 *
 * Split out because the three states below are three different sentences and
 * only one of them has fields at all, and because the difference between "no
 * bet exists" and "the read failed" is the difference §1.3 forbids collapsing.
 * The caller supplies `themeId` from `spine_tracks.theme_id` -- **not from the
 * track's `theme` members**, which are a bad proxy: 16 of 32 tracks carrying
 * theme members have no member equal to their own `theme_id`, and the member
 * route reaches a bet for **1 track out of 32** where the column reaches one
 * for 28 out of 106.
 */
export type SolvingState =
  /** Nothing has been grouped into a pattern, so there is no bet to promote. */
  | { kind: "no-pattern" }
  /** A pattern exists and nobody has turned it into a piece of work. */
  | { kind: "no-bet"; themeId: string }
  /** The bet, whether or not the station filled it in. */
  | { kind: "bet"; bet: Bet };

export function solvingState(themeId: string | null, bets: Bet[]): SolvingState {
  if (!themeId) return { kind: "no-pattern" };
  /*
   * The FIRST bet, and the read that feeds this is `eq("theme_id", themeId)`
   * with no limit, so "first" is a real first rather than the head of a page.
   * A theme promoted twice is rare and the older bet is not a second subject;
   * `promoteThemeToOpportunity` writes one edge per theme.
   */
  const bet = bets[0];
  return bet ? { kind: "bet", bet } : { kind: "no-bet", themeId };
}
