/**
 * ── R-39: A CALL ON THE PERSON'S SENTENCE ALONE IS THE PERSON'S ──────────
 *
 * Walked live in an empty probe workspace, 2026-09-04. A person typed one
 * sentence. Sense searched, found nothing, and carried on the sentence, which
 * is R-36 working exactly as designed. Then Decide's strategist DECLINED on the
 * same absence -- "not currently a meaningful friction point" -- with a forecast
 * written against 1,000 sessions that no connected source could ever see. The
 * decline arm waived four stations, and Learn now reads "Waiting on time, Learn
 * returns Oct 3".
 *
 * So a person who typed one sentence into an empty workspace was told NO, on
 * NOTHING, with a date that returns to nothing.
 *
 * ── WHY THIS IS NOT A PROMPT FIX ─────────────────────────────────────────
 *
 * The brief can ask the strategist not to do this, and a rule written as a
 * request is the defect this repo has spent a month closing. The refusal lives
 * in the writer, so the sentence cannot be recorded whatever any model decides.
 *
 * ── AND WHY A REFUSAL RATHER THAN A REWRITE ──────────────────────────────
 *
 * Turning the decline into a `build` in code would put words in the
 * strategist's mouth and record a call nobody made. The tool refuses and says
 * why, and the crew's own next move -- build on the person's word, or ask them
 * -- is the one the brief describes. A refusal the caller can read is how every
 * other floor in this registry works.
 */

/** The one footing this rule keys on: Sense carried the person's sentence. */
export const CARRIED_FOOTING = "carried-on-your-sentence";

/**
 * Phrases that make a decline a call about ABSENCE rather than about the idea.
 *
 * Matched on the rationale, not on the verdict: a strategist may honestly
 * decline a bad idea in an empty workspace, and this must not stop it. What it
 * stops is declining because there is nothing to look at -- which on a carried
 * track is always true, and is never the person's answer.
 *
 * Deliberately about EVIDENCE and not about confidence. "I am not sure" is a
 * strategist being honest; "there is no data" on a track whose footing is the
 * person's own sentence is the machine mistaking its own emptiness for a no.
 */
const ABSENCE_PHRASES = [
  "no evidence",
  "no data",
  "no signal",
  "no signals",
  "insufficient evidence",
  "insufficient data",
  "not enough evidence",
  "not enough data",
  "lack of evidence",
  "lack of data",
  "nothing in the record",
  "no supporting",
  "unsupported by",
  "cannot be validated",
  "no source",
  "no sources",
  "not currently a meaningful friction point",
  "no indication",
  "no observed",
  "without evidence",
  "without data",
];

/** Does this rationale rest on there being nothing to look at? */
export function restsOnAbsence(rationale: string | null | undefined): boolean {
  const r = (rationale ?? "").toLowerCase();
  if (!r.trim()) {
    /*
     * A decline with NO rationale on a carried track is the same refusal with
     * the argument left out. Treated as absence rather than waved through: the
     * one thing a no on somebody's own sentence must carry is a reason.
     */
    return true;
  }
  return ABSENCE_PHRASES.some((p) => r.includes(p));
}

/**
 * May this decline be recorded?
 *
 * `carried` is whether Sense carried the person's sentence for this track. On
 * any other footing the strategist read something real and its no is its own.
 */
export function declineIsRefused(input: {
  call: string;
  carried: boolean;
  rationale: string | null | undefined;
}): boolean {
  if (input.call !== "do-not-build") return false;
  if (!input.carried) return false;
  return restsOnAbsence(input.rationale);
}

/**
 * What the crew is told, and it names both ways forward.
 *
 * The sentence is the refusal's whole value: a floor that says "not allowed"
 * teaches nothing, and this one has to leave the strategist able to act.
 */
export const R39_REFUSAL =
  "This track is carried on the person's own sentence: Sense searched and the workspace holds " +
  "nothing bearing on it. A no that rests on that absence is a call about our emptiness, not " +
  "about their idea, and it is theirs to make rather than ours. Either record `build` with their " +
  "own claim as the forecast and a how-we-will-know that names a source this workspace actually " +
  "has, or ask them: raise one choice between building it on their word and pointing a source " +
  "first, and let the track wait for their answer.";

/** The two options of that Choice, in the person's words. Exported so the run
 *  screen and the brief cannot describe the same question differently. */
export const CARRIED_CHOICE = {
  question: "Build this on your word, or point a source at it first",
  options: [
    {
      id: "build-on-your-word",
      label: "Build it on your word",
      fact: "Nothing here can grade it yet, so your claim is the forecast.",
    },
    {
      id: "point-a-source",
      label: "Point a source first",
      fact: "Connect something that can tell us whether it worked.",
    },
  ],
} as const;

/**
 * A stable marker inside `R39_REFUSAL`, so the driver can recognise its own
 * refusal in `tool_calls.error` without matching the whole paragraph.
 *
 * The driver could instead infer the situation from its own state -- carried
 * footing, Decide, nothing attached -- and that was the first design. It is
 * wrong: a strategist that simply produced nothing lands in the same state, and
 * a run that FAILED lands there too. Only the refusal means "a no was attempted
 * on the person's own sentence", which is the one thing worth asking them
 * about, so the driver keys on the refusal actually having happened.
 *
 * Matched on a phrase this repo's humanizer will not rewrite and no other
 * message contains, rather than on the whole sentence, which would break the
 * moment somebody improves a word of it.
 */
export const R39_MARKER = "carried on the person's own sentence";

/** Did this run attempt a no on the person's own sentence and get refused? */
export function refusalHappened(errors: readonly (string | null | undefined)[]): boolean {
  return errors.some((e) => (e ?? "").includes(R39_MARKER));
}

/**
 * ── THE FOOTING IS A FACT ABOUT THE TRACK, NOT ITS CURRENT HOLD (P-71c) ──
 *
 * P-71 read the footing as `last_hold === "carried-on-your-sentence"`, and A1
 * walked a fresh sentence in the probe that slipped straight through it:
 *
 *   22:22  Sense searched, found nothing, carried the sentence
 *   22:40  Decide ran out of time, so `last_hold` became `out-of-time`
 *   22:40  the critic recorded a decline citing "zero observed evidence",
 *          "no signals about holiday homes", "the absence of demand signals"
 *
 * The rationale would have matched the classifier on its own. The FOOTING read
 * false, because `last_hold` is the current hold and one continuation had
 * already overwritten it.
 *
 * That is a defect in the shape of the check rather than in its threshold: a
 * transient column was asked a durable question. Sense carrying the sentence is
 * something that HAPPENED; it does not stop having happened because the next
 * station timed out.
 *
 * ── TWO RECORDS, EITHER OF WHICH PROVES IT ───────────────────────────────
 *
 * `track_drives.entry_hold` is the hold a drive STARTED with, so the Decide
 * drive that followed the carry recorded `carried-on-your-sentence` permanently.
 * `sense.found_nothing` is the tool call the seat made, which is the event
 * itself. Both are on both probe tracks; both survived the overwrite. Either is
 * taken as proof, so one unreadable table does not lose the footing.
 *
 * ── AND IT LIFTS WHEN THE WORKSPACE STOPS BEING EMPTY ────────────────────
 *
 * The footing is not "Sense once found nothing" but "there is nothing here
 * bearing on this sentence". A signal filed on the track answers that, so the
 * footing lifts and an ordinary decline is the strategist's own again. Without
 * this the rule would outlive its reason and refuse a legitimate no forever.
 */
export type CarriedEvidence = {
  /** A drive entered on the carried hold, or the seat said it found nothing. */
  senseCarried: boolean;
  /** Signals filed on this track. Any at all lifts the footing. */
  signalsOnTrack: number;
  /** False when a read failed, so the caller can decline to refuse. */
  known: boolean;
};

/** Was this call made on the person's sentence alone? */
export function footingIsCarried(e: CarriedEvidence): boolean {
  if (!e.known) return false;
  if (!e.senseCarried) return false;
  return e.signalsOnTrack === 0;
}

/**
 * ── WHILE THE CHOICE STANDS, NO DECISION IS THE MACHINE'S (P-71d) ────────
 *
 * A1's third probe walk. The refusal fired at 00:10 and the track held
 * `the-call-is-yours` with the seat's own question on the record: "I cannot
 * decide ... Which do you choose?" The 00:20 sweep drove the track anyway,
 * Decide ran out of time, and the seat recorded "Show installer arrival window
 * on order page" as approved -- a BUILD, not a decline, so the refusal that
 * only guards `do-not-build` never looked at it.
 *
 * That is the hole: P-71 refused the machine saying NO on the person's
 * sentence, and the machine said YES instead. Both are the same act -- making
 * the call that was handed to the person -- and the question on the screen was
 * still unanswered when it happened.
 *
 * So while the Choice is outstanding, NOTHING records a decision on this track.
 * The person's own answer arrives through `buildOnYourWord`, which is not this
 * path and is unaffected.
 */
export const CHOICE_OUTSTANDING_REFUSAL =
  "This track is waiting on the person: they were asked whether to build it on their word or " +
  "point a source at it first, and they have not answered. Recording any decision now -- to " +
  "build or not to build -- makes the call that was handed to them. Wait for their answer.";

/** Is R-39's Choice still in front of the person on this track? */
export function choiceIsOutstanding(input: {
  /** A drive entered on `the-call-is-yours`, from the record. */
  choiceRaised: boolean;
  /** Has the person answered since? Their answer clears the hold. */
  answered: boolean;
  /** False when a read failed, so the caller declines to refuse. */
  known: boolean;
}): boolean {
  if (!input.known) return false;
  return input.choiceRaised && !input.answered;
}

/**
 * ── A BUILD ON NOTHING IS ALSO THE MACHINE'S CALL (P-71e) ────────────────
 *
 * A1's fourth probe sentence: Decide entered carried and the seat recorded
 * "Reschedule installer visit from order page" APPROVED on the first pass, with
 * a forecast it composed, and the track walked to Define with no person
 * involved. P-71 refused a NO on the person's sentence, so the seat said YES.
 *
 * Both are the same act. On a carried track NO decision is the machine's --
 * neither answer -- and the only decisions that may land are the person's own,
 * which arrive through `buildOnYourWord` and never through this tool.
 *
 * WHY THE VERDICT DOES NOT MATTER HERE, unlike in `declineIsRefused`: that rule
 * keys on the RATIONALE because a strategist may honestly decline a bad idea in
 * an empty workspace. There is no equivalent honest YES: approving work in a
 * workspace that holds nothing bearing on it is, definitionally, a call made on
 * the person's sentence alone.
 */
export const CARRIED_DECISION_REFUSAL =
  "This track is carried on the person's own sentence: Sense searched and the workspace holds " +
  "nothing bearing on it. Recording ANY decision here -- build or do-not-build -- makes a call " +
  "on their sentence alone, and a forecast written against evidence this workspace does not have " +
  "cannot be graded. The person answers it: they choose to build it on their word, with their " +
  "own claim as the forecast, or to point a source at it first. Do not record a decision on this " +
  "track; finish your turn and say what you found.";

/** May a seat record ANY decision on this track? */
export function seatMayDecide(input: { carried: boolean; known: boolean }): boolean {
  if (!input.known) return true;
  return !input.carried;
}

/**
 * ── A STATION THAT ALREADY DECIDED THIS DOES NOT DECIDE IT AGAIN ─────────────
 *
 * Measured on track `d2263583` (Lane 2, 2026-09-09): fourteen decisions, five
 * distinct titles, THIRTEEN of them declined. The strategist proposes, the
 * critic declines for want of A/B evidence, and the pair repeat that exchange
 * every ten minutes from 13:41 to 17:31, three hours fifty-one minutes and
 * about 2,289 credits, each repeat carrying a full rationale and three
 * alternatives so both seats are doing real work to reach the same refusal.
 * Across production: 60 decisions on 29 tracks, 20 declined, on 8 of them.
 *
 * It is the same shape as a critic re-filing the drawing it just reviewed: a
 * station with no memory that it already decided this. The record is right
 * there, so the tool reads it. What it refuses is narrow on purpose: the SAME
 * TITLE on this track, already declined. A different call, or the same call
 * with a title that says what changed, still records; and the refusal quotes
 * the decline's own reason, so the seat is told what to address rather than
 * only that it may not proceed.
 *
 * ── AND IT IS NOT LOOSENED TO CATCH PARAPHRASES. MEASURED. ─────────────────
 *
 * The obvious next step is to fold near-duplicates too, and this product has a
 * containment measure built and calibrated for exactly that shape
 * (`what-it-keeps-saying.ts`, which separates restatements of a claim from
 * unrelated claims with an empty band between 0.125 and 0.250). Run against
 * the real decision titles on 2026-09-09, it does not work here, and the
 * reason is structural rather than a matter of tuning:
 *
 *   0.889  "Decline shipping of 'Improve onboarding...' work"
 *          -> "Proceed with 'Improve onboarding...' work"        A REVERSAL
 *   0.800  "Do not build tablet layout fixes without controlled A/B evidence"
 *          -> "Tablet layout fix without A/B evidence"           a reword
 *   0.714  "Do not cut sign-up form from nine to four fields..."
 *          -> "Do not reduce sign-up form field count..."        a reword
 *
 * The reversal scores HIGHER than two of the three rewordings, because a
 * reversal is the same words with the verb flipped, and a claim-word measure
 * is verb-blind: "not" and "no" are stop words in it, deliberately and
 * correctly for its own job. On track `6817e386` the seats declined shipping a
 * piece of work and then approved proceeding with it eleven minutes later; a
 * paraphrase guard at any threshold that caught the rewordings would have
 * refused that approval, which is the most valuable decision on the track.
 *
 * So the exact title stands, and the loop shortens rather than stops. A guard
 * that blocks a reversal to save a lap has traded the product's whole purpose
 * for its running costs.
 */
export type PriorDecision = {
  title: string | null;
  status: string | null;
  rationale: string | null;
};

/** Trimmed, case-folded, inner whitespace collapsed: the same call typed twice. */
function sameTitle(a: string, b: string | null): boolean {
  if (!b) return false;
  const norm = (t: string) => t.trim().toLowerCase().replace(/\s+/g, " ");
  return norm(a) === norm(b);
}

/**
 * The refusal for a decision this track already declined under this title, or
 * null when there is none. PURE, so the sentence a seat reads is testable
 * without a database.
 */
export function alreadyDeclinedRefusal(
  title: string,
  priors: readonly PriorDecision[] | null | undefined,
): string | null {
  const declined = (priors ?? []).find(
    (d) => (d.status ?? "").trim().toLowerCase() === "declined" && sameTitle(title, d.title),
  );
  if (!declined) return null;
  const why = (declined.rationale ?? "").trim();
  return (
    `This track already decided "${declined.title}" and it was declined. ` +
    (why ? `The reason on the record: ${why} ` : "") +
    "Recording it again unchanged reaches the same refusal and spends another lap to get there. " +
    "Either address that reason and say so in the title, or make a different call."
  );
}
