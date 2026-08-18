import { Num, Value } from "@/components/meridian/surface-parts";
import type { VerdictWord } from "@/components/discover/format";

/**
 * WHAT THE RED TEAM CONCLUDED, as a word rather than a coloured chip.
 *
 * REWRITTEN 2026-08-18 rather than ported, and the reason is Law 4. The
 * version this replaces asked `components/ui/badge` for a FIVE-WAY colour ramp
 * -- green / amber / red / gray / teal -- to paint a five-way categorical
 * verdict. That is identity painted as a colour ramp, which the design
 * system's ledger records as found and removed three separate times, and two
 * of the five hues do not exist in Meridian at all: amber and teal were both
 * retired by the founder's 2026-08-14 ruling, so there was no token to port
 * them onto and inventing one was the wrong direction.
 *
 * ── THE THREE THE CRITIC ACTUALLY SAYS ARE STATUS, NOT IDENTITY ─────────
 * `governance/CriticBadge` is the shipped Meridian reader of the same column
 * and it already made this call: ship is a `pass`, kill is a `fail`, and
 * revise is `hold` -- the work is stopped on a CONDITION (a revision) rather
 * than on a person, which is exactly what Meridian's amber says and why
 * orchid would be wrong. Those three are outcomes the Critic reported, so
 * colour is carrying information rather than an identity. This file uses the
 * same three so one verdict reads identically wherever it appears; two
 * components disagreeing about the colour of one word is how the last system
 * rotted.
 *
 * WATCH AND PENDING GET NO HUE, and that is the half the ramp got wrong.
 * Neither is an outcome. `verdictFor` only ever produces WATCH by falling
 * through to the lane (`next`/`later`), and PENDING is the absence of a
 * reading. A hue on either would report a result nobody has.
 *
 * ── `reviewed` IS NOT DECORATION ────────────────────────────────────────
 * `verdictFor` (components/discover/format.ts) consults `critic_review.verdict`
 * FIRST and otherwise falls through to the lane, so SHIP can arrive here from a
 * `now` placement that the Critic has never opened. Painting that green claims
 * an outcome an agent never gave, which is the same misattribution
 * `verdictSentence` and `redTeamRing` on the Decide route already guard. Pass
 * `criticGaveTheVerdict(...)`, never `Boolean(review?.verdict)`: the two ask
 * different questions.
 *
 * ── CONFIDENCE 0 IS A READING, AND IT USED TO RENDER AS SILENCE ─────────
 * The old tail was `confidencePercent ? ` · ${...}%` : ""`, so a genuine zero
 * -- the model answered and rated its own answer worthless -- was falsy and
 * printed nothing, byte for byte identical to a bet with no confidence on the
 * record at all. Those two ask for completely different things: one is a
 * judgment, the other is an absence. The test is `== null` now, so 0 prints as
 * `0%` and only a missing reading is silent.
 */

/** The tone each verdict word takes. Three carry an outcome and get one of
 *  Meridian's status hues; two carry none and get the quiet ink. */
const VERDICT_TONE: Record<VerdictWord, "pass" | "hold" | "fail" | "quiet"> = {
  SHIP: "pass",
  REVISE: "hold",
  KILL: "fail",
  WATCH: "quiet",
  PENDING: "quiet",
};

/** Sentence case, because a verdict is a word a person says and not a shout.
 *  The uppercase literals are the comparator's vocabulary, not the reader's. */
const VERDICT_LABEL: Record<VerdictWord, string> = {
  SHIP: "Ship",
  REVISE: "Revise",
  KILL: "Kill",
  WATCH: "Watch",
  PENDING: "Pending",
};

export function VerdictBadge({
  verdict,
  confidence,
  reviewed = true,
}: {
  verdict: VerdictWord;
  /** 0 to 1. `null` means no reading exists; 0 means the model gave one and it
   *  was zero. Never coerce the first into the second. */
  confidence?: number | null;
  /**
   * Did the Critic actually speak this word, or did `verdictFor` fall through
   * to the lane? A lane-derived verdict keeps the word and loses the hue,
   * because the hue is an attribution.
   */
  reviewed?: boolean;
}) {
  const tone = reviewed ? VERDICT_TONE[verdict] : "quiet";
  const percent = confidence == null ? null : Math.round(confidence * 100);

  return (
    <Value tone={tone}>
      {VERDICT_LABEL[verdict]}
      {percent === null ? null : (
        <>
          {" · "}
          <Num>{percent}%</Num>
        </>
      )}
    </Value>
  );
}
