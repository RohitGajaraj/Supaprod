/**
 * OPEN QUESTIONS, DRAWN ALWAYS — INCLUDING WHEN THE STATION FILED NONE. GAP #29.
 *
 * `QUEUE-S1.md` S1-Q1: *"The Discover artifact draws its `Open questions` section
 * **always**, including when the station filed none, and a person answers one **in
 * the transcript** without leaving the run."*
 *
 * ── WHAT I CHECKED FIRST, AND WHY NEITHER SERVED ──────────────────────────
 * The queue names both and says **"Do not build a second ask mechanism."** It is
 * right, and neither of the two is the one to reuse:
 *
 * | Checked | What it is | Why it does not serve |
 * | --- | --- | --- |
 * | `track/TrackConsent.tsx` (mounted, `TrackRun:863`) | The in-place ask for **pending gates** — every sentence derived from `assessTool`, `gateHeadline`, `toolConsequence`, `expiryNote` | A gate asks *"may I do this dangerous thing"*. An open question has **no tool, no reversibility and no expiry**; reusing it means inventing a gate to carry a question, and §2.4 forbids a tool name on that card anyway |
 * | `connections/AskInPlace.tsx` (mounted by me at `ArtifactPane:2024`) | The in-place ask for a **missing connector** | An unsettled question is not a missing connection. Its `needIsMet` seam is about whether a capability exists |
 *
 * **The mechanism I DID reuse is the third one, and it is already proven:**
 * `steerTrack` (`lib/spine/track.functions.ts:2214`) writes a track-scoped record
 * the loop consumes as operator guidance mid-step. Measured 2026-08-31: the one
 * track-scoped steer on record was **consumed 50 seconds after it was written**.
 * And the display half is built too — `spine/activity-rows.ts:158` derives
 * `pickedUp`, `TrackActivity.tsx:725` renders *"not picked up yet"*. **So an
 * answer becomes a transcript entry that says who said it and whether anything
 * has taken it, with no new write path and no new surface.** That is the brief's
 * *"the default move is always: wire what exists."*
 *
 * ── THE MEASUREMENT, AND IT IS THE WHOLE ARGUMENT FOR DRAWING IT ALWAYS ───
 * Measured 2026-08-31 on production:
 *
 * | | |
 * | --- | --- |
 * | `agent_messages` | **161** |
 * | carrying an `open_questions` key at all | **3** |
 * | with a **non-empty** list | **2** |
 * | with non-empty constraints | 13 |
 * | handoffs | 143 |
 *
 * The two real ones carry plain strings — *"Are there existing fraud model
 * versioning conventions to follow?"* — so the shape is `string[]` and this file
 * is written against what the record actually holds, not against the spec's
 * example.
 *
 * **141 of 143 handoffs record nothing unsettled.** A section that hides when
 * empty would render on two tracks in the product's history and hide the finding
 * on the rest.
 */

/**
 * What the surface knows.
 *
 * ── TWO LEVELS OF `null`, AND THEY MEAN DIFFERENT THINGS ──────────────────
 * S0's reader (`lib/handoff-fields.ts`) landed with a distinction this module
 * did not originally have, and it is load-bearing:
 *
 *   `handoffs === null`             THE READ FAILED.
 *   `handoff.openQuestions === null` the station **never filed the field**.
 *   `handoff.openQuestions === []`   the station **filed it and said none**.
 *
 * Measured across all 143 handoffs: **3 carry the field at all (2 filled, 1
 * empty), so 140 do not claim emptiness — they say nothing.** Collapsing those
 * 140 silences into "filed none" would turn them into 140 clean bills on the one
 * field §2.1 rules *"a defect, not a clean bill"*. So silence and a stated none
 * get different sentences here, and the stated none is the rarer, sharper case:
 * **one row in the product's history has ever answered the question.**
 */
export type OpenQuestionsInput = {
  /**
   * Every handoff this station filed, narrowed. **`null` means the READ FAILED**
   * and is never treated as "none" (F-76). `[]` means the station handed nothing
   * on at all.
   */
  handoffs: readonly { openQuestions: readonly string[] | null }[] | null;
/** What the surface knows. `null` questions means the read has not answered yet. */
export type OpenQuestionsInput = {
  /**
   * The questions the station filed. **Three distinct values, and collapsing any
   * two of them is the defect this module exists to avoid**: `null` (we have not
   * read, or the read failed), `[]` (it filed none), and a non-empty list.
   */
  questions: readonly string[] | null;
  /** Whether the station this section belongs to has run at all. */
  stationRan: boolean;
};

export type OpenQuestionsState =
  /** The station has not got here. Not a clean bill and not a defect. */
  | { kind: "not-yet" }
  /** We could not read them. Said out loud rather than drawn as none (R-16). */
  | { kind: "cannot-tell" }
  /**
   * It ran, and nothing it handed on addressed what was unsettled. **The
   * dominant case: 140 of 143 handoffs.** A silence, not a claim.
   */
  | { kind: "said-nothing" }
  /**
   * It filed the field and stated there are none. **One row in the product's
   * history.** §2.1's *"an empty list is a DEFECT, not a clean bill"* is about
   * exactly this, and it is worth its own sentence because it is the only case
   * where a station actually answered.
   */
  /** It ran and filed none. **This is the finding, not the absence of one.** */
  | { kind: "filed-none" }
  /** It filed some. */
  | { kind: "asked"; questions: readonly string[] };

export function openQuestionsState(input: OpenQuestionsInput): OpenQuestionsState {
  /*
   * ORDER MATTERS. `cannot-tell` is checked before `not-yet` because a failed
   * read on a station that has not run is still a failed read, and reporting it
   * as "not yet" would quietly convert our ignorance into a fact about the work.
   */
  if (input.handoffs === null) return { kind: "cannot-tell" };
  if (!input.stationRan) return { kind: "not-yet" };

  /*
   * EVERY question across every handoff this station filed, in order, deduped.
   * A station that handed on twice asked its questions once each, and the same
   * question restated in a second handoff is one unsettled thing, not two --
   * the same call `station-file.ts` makes and the opposite of
   * `what-it-produced.ts`'s, which counts repeats because a repeated FILING is
   * the fact that reveals a jam. A repeated QUESTION reveals nothing.
   */
  const seen = new Set<string>();
  const questions: string[] = [];
  /** True once any handoff actually filed the field, empty or not. */
  let anyClaimed = false;
  for (const h of input.handoffs) {
    if (h.openQuestions === null) continue;
    anyClaimed = true;
    for (const q of h.openQuestions) {
      const key = q.trim();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      questions.push(q);
    }
  }

  if (questions.length > 0) return { kind: "asked", questions };
  return anyClaimed ? { kind: "filed-none" } : { kind: "said-nothing" };
  if (input.questions === null) return { kind: "cannot-tell" };
  if (!input.stationRan) return { kind: "not-yet" };
  if (input.questions.length === 0) return { kind: "filed-none" };
  return { kind: "asked", questions: input.questions };
}

/**
 * The section's own line. Never null — **the section always speaks**, which is
 * the entire point of #29 and the one thing a hide-when-empty section cannot do.
 */
export function openQuestionsLine(state: OpenQuestionsState, stationLabel: string): string {
  switch (state.kind) {
    case "not-yet":
      return `${stationLabel} has not got here yet, so nothing is recorded as unsettled.`;
    case "cannot-tell":
      return "I could not read what was left unsettled, so I cannot say whether anything was.";
    case "said-nothing":
      /*
       * THE 140 CASE, AND IT IS A SILENCE RATHER THAN A CLAIM. Nothing the
       * station handed on addressed what was unsettled -- which is not the same
       * as it having looked and found none, and the wording keeps them apart
       * without accusing anyone.
       */
      return `Nothing ${stationLabel} handed on says what is still unsettled. That is not the same as nothing being unsettled, and it is worth a look before this goes further.`;
    case "filed-none":
      /*
       * ── THE SENTENCE I REWROTE, AND WHY THE FIRST ONE WAS NOT MINE TO SAY ──
       * `SPEC-STATION-MODEL-AND-ARTIFACTS.md` §2.1 states the design position
       * plainly: *"An empty list is a DEFECT, not a clean bill. Discover filing
       * zero open questions means it did not look."* I wrote that verbatim
       * first, as "it did not look".
       *
       * **That is a claim about THIS run that this surface cannot check.** The
       * spec is asserting a general truth about the field to justify making it
       * load-bearing; the screen would be accusing one station of not trying,
       * on evidence that is equally consistent with a genuinely simple problem.
       * Same over-claim as attaching "the crew ignored it" to a column that
       * defaults to `ignored`, which cost me a unit today.
       *
       * So it states the distinction and lets the reader draw the conclusion:
       * nothing RECORDED is not the same as nothing UNSETTLED.
       */
      return `${stationLabel} looked and recorded nothing unsettled. An empty list is not a clean bill, so this is worth a look before it goes further.`;
      return `${stationLabel} recorded nothing as unsettled. That is not the same as nothing being unsettled, and it is worth a look before this goes further.`;
    case "asked":
      return state.questions.length === 1
        ? `${stationLabel} left one thing unsettled.`
        : `${stationLabel} left ${state.questions.length} things unsettled.`;
  }
}

/**
 * Whether a person can add what the station missed.
 *
 * TRUE ON `filed-none`, and that is the inversion the spec asks for. §4.3: *"the
 * open questions are where the person is actually worth something… the agent
 * says what it does not know; the person answers."* When the agent said nothing,
 * the useful move is the other direction — the person names what is unsettled —
 * and that is still one tap in the place the work already is.
 *
 * ── TRUE ON `cannot-tell` TOO, AND DRIVING IT IS WHAT CHANGED MY MIND ─────
 * This returned false at first, and the reason I wrote down was *"offering to
 * add to a list we could not read would write against a state we do not know."*
 * **That reasoning is wrong, and opening the pane in a browser is what exposed
 * it.** On a real Discover stop the section rendered *"I could not read what was
 * left unsettled"* with no control beneath it — **a sentence that says "I don't
 * know" and offers nothing**, which is the dead end SESSION-1's fifth unit
 * forbids outright.
 *
 * The error was treating the record as a mutation of the list. **It is not.** An
 * answer is a track-scoped steer — an independent statement that stands on its
 * own — so a person naming something unsettled is valid whether or not we ever
 * read what the station filed. Nothing is being written "against" a state.
 *
 * FALSE remains only for `not-yet`, and that one is not a dead end: the station
 * has not run, the line says so, and the work has somewhere to go without a
 * person doing anything.
 */
export function canRaiseOne(state: OpenQuestionsState): boolean {
  return state.kind !== "not-yet";
}

/**
 * The record an answer leaves, as the text of a steer.
 *
 * ── IT CARRIES THE QUESTION, VERBATIM, AND THAT IS NOT PADDING ────────────
 * The steer is consumed mid-step and the transcript keeps it forever. An answer
 * stored alone — *"Yes, follow the existing convention"* — is unreadable a week
 * later and unusable to the seat that reads it, which has no idea what was
 * asked. Same reasoning as `verdict.md` carrying its forecast verbatim rather
 * than by reference (§2.5): a claim rendered by lookup can be read after the
 * source moved.
 */
export function answerRecord(question: string, answer: string): string {
  return `Answering "${question.trim()}": ${answer.trim()}`;
}

/**
 * PROCEED ANYWAY IS AN ANSWER, NEVER A DISMISSAL. §4.3, and the acceptance
 * states it as a hard line.
 *
 * The difference is not decoration. A dismissal removes the question and leaves
 * the record saying nothing was ever unsettled — which is the exact state
 * `filed-none` exists to flag. **This writes the same kind of row an answer
 * writes**, so the transcript shows a person met the question and chose to go on
 * with it open, and the next station reads that rather than a clean sheet.
 */
export function proceedRecord(question: string): string {
  return `Answering "${question.trim()}": go ahead without settling this. It is still open.`;
}

/**
 * What a person raises when the station filed nothing.
 *
 * Deliberately the SAME shape as an answer rather than a second message type.
 * `SPEC-AGENT-COMMS` has seven kinds and #14 is unbuilt; inventing an eighth for
 * this would be a schema change to say something the existing one already says.
 */
export function raisedRecord(question: string): string {
  return `Raising an open question: ${question.trim()}`;
}
