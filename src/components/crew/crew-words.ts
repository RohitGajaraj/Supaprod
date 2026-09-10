/**
 * THE CREW'S VOCABULARY, IN ONE FILE.
 *
 * Written 2026-08-10 out of a governance audit finding, and the finding was not
 * about words - it was about drift with a schedule. Two surfaces were editing
 * ONE stored value in TWO vocabularies: /boundary offered "Let them do it alone
 * / Come to me first / Nobody may do this" while a settings panel offered "Auto
 * / Ask first / Review", over the same `agent_tools.mode`. Nobody chose that.
 * It happened because each surface declared its own labels privately, and
 * nothing anywhere could compare them.
 *
 * The tool editor is gone from Settings now, so that particular pair cannot
 * recur. This file exists so the NEXT pair does not start: every phrase the
 * product uses for how much rope an agent has lives here, and a surface that
 * wants to say it imports it rather than writing it out again.
 *
 * WHY IT SITS IN components/crew RATHER THAN lib. It is presentation - the
 * words a person reads, not the values stored - and the route that owns the
 * concept is /team. The types it keys on come from lib/crew.functions, which is
 * where the stored vocabulary belongs and stays.
 *
 * NOTHING HERE MAY NAME A MECHANISM. `arc`, `mode` and `graduation` are the
 * correct technical whisper in the Engine Room and nowhere else.
 */

import type { CrewArc, CrewToolMode } from "@/lib/crew.functions";

/** Loosest last. This is the order the trust ramp travels, so a list drawn in
 *  this order reads as a ladder rather than as an alphabetised set. */
export const ARC_ORDER: CrewArc[] = ["observing", "proving", "trusted", "ambient"];

/** What the dial means, said once, in the words a person would use. */
export const ARC_CHOICE: Record<CrewArc, string> = {
  observing: "Everything waits for you",
  proving: "Asks before it acts",
  trusted: "Runs alone, except the risky calls",
  ambient: "Runs alone, always",
};

/** The same fact as a headline about a named worker. */
export function arcHeadline(name: string, arc: CrewArc): string {
  switch (arc) {
    case "ambient":
      return `${name} decides everything itself.`;
    case "trusted":
      return `${name} runs alone.`;
    case "proving":
      return `${name} asks before it acts.`;
    default:
      return `${name} waits for you on everything.`;
  }
}

export const MODE_CHOICE: Record<CrewToolMode, string> = {
  auto: "On its own",
  confirm: "Asks you first",
  review: "Waits for your review",
};

/** The same fact inside a sentence. */
export const MODE_PHRASE: Record<CrewToolMode, string> = {
  auto: "on its own",
  confirm: "only after asking you",
  review: "only after your review",
};

/** What a tool would touch. Second-line information, never a restatement of
 *  the mode the control beside it already shows. */
export const RISK_NOTE: Record<"low" | "medium" | "high", string> = {
  low: "Stays in this workspace, and you can undo it.",
  medium: "Reaches outside, and it can be walked back.",
  high: "Hard to walk back.",
};

/** How far an agent's tools may reach, as a control's options. The empty value
 *  is the stored NULL: no cap, which is the default. */
export const REACH_CHOICE: { value: string; label: string }[] = [
  { value: "", label: "Anything its tools allow" },
  { value: "low", label: "Only what it can undo here" },
  { value: "medium", label: "Nothing that leaves a mark outside" },
  { value: "high", label: "Everything, including the one way doors" },
];

/** The same fact as a phrase, for a surface that STATES the cap rather than
 *  setting it. A surface that can only read must still say the same words as
 *  the one that can write, or the reader learns two names for one boundary.
 *
 *  NO IMPORTER, AND ITS NATURAL SURFACE HAS NOT SHIPPED. Checked 2026-08-27:
 *  the only consumer of the reach vocabulary is crew's SELECT, which sets the
 *  cap and reads `REACH_CHOICE` directly. Nothing yet displays the cap
 *  read-only, which is the case this exists for.
 *
 *  Kept rather than deleted, deliberately. It is four lines derived from
 *  `REACH_CHOICE`, so it carries no second copy of the fact; deleting it saves
 *  nothing and invites the next read-only surface to invent its own wording,
 *  which is precisely the "two names for one boundary" this was written to
 *  prevent. If that surface never ships, delete this with it. */
export function reachWord(maxToolRisk: string | null | undefined): string {
  return REACH_CHOICE.find((r) => r.value === (maxToolRisk ?? ""))?.label ?? REACH_CHOICE[0].label;
}

/**
 * WHICH TEAMMATE NEEDS A LOOK, SAID ON THE CARD RATHER THAN INSIDE IT.
 *
 * ── THE DEFECT, AND THE LANE'S OWN TEST FOR IT ─────────────────────────────
 * The roster card draws "Last worked 44m ago" and nothing else about how those
 * runs went. `CrewRunTally.failed` has been on every roster row all along and
 * is rendered nowhere on the card, so an agent with three runs that did not
 * finish is indistinguishable from a healthy quiet one.
 *
 * The card's own header already argues this case for a different field: "if a
 * person has to open each one to find out whether any of them needs them, the
 * surface has failed." That was written when `lastAt` was buried inside the
 * member view. The exception signal is still buried.
 *
 * ── THE MARK CANNOT SAY IT, WHICH IS WHY THE WORDS MUST ────────────────────
 * `agent-fleet.ts` has a `stateFor` that returns "attention" when failures
 * exist, and the roster's own `stageFor` does NOT use it: it returns gate,
 * waiting, running, off, or idle, so a failing agent renders as **idle**. Even
 * if the mark did turn, R-19 keeps accessibility at full weight and colour must
 * never be the only signal. A sentence works in greyscale and to a screen
 * reader; a hue does not.
 *
 * ── WHAT "did not finish" MEANS, EXACTLY ───────────────────────────────────
 * `runBucket` puts `failed`, `error`, `halted`, `cancelled`, `denied`,
 * `aborted` and `timed_out` in this bucket, and deliberately does NOT put
 * `completed_with_failures` in it — that one buckets as done, with a long
 * argument in `agent-fleet.ts` that bucketing it failed "would have put 622
 * runs in front of a supervisor and drowned the signal the tally exists to
 * raise". So this counts runs that stopped without finishing, which is what the
 * words say, and not runs that finished imperfectly.
 *
 * ── SILENT AT ZERO ─────────────────────────────────────────────────────────
 * A card per teammate reading "0 runs did not finish" is seventeen lines of
 * nothing, which is R-20 section 8: a region either carries a fact the person
 * came for or is removed. This is the exception signal, so it appears only when
 * there is an exception.
 */
export function needsALookLine(failed: number | null | undefined): string | null {
  if (typeof failed !== "number" || !Number.isFinite(failed) || failed <= 0) return null;
  return failed === 1 ? "1 run did not finish." : `${failed} runs did not finish.`;
}

/**
 * WHAT A TEAMMATE IS DOING RIGHT NOW, AND WHAT IS QUEUED BEHIND IT.
 *
 * ── THE CARD WENT SILENT AT EXACTLY THE WRONG MOMENT ──────────────────────
 * `lastWorkedLine` is drawn only when `runs.running === 0`, and the comment at
 * that call site states the reason: *"Silent while it is RUNNING, because the
 * mark beside the name already says so and a card should carry one live signal,
 * not two."*
 *
 * That reasoning is sound about DUPLICATION and it produced the wrong outcome.
 * On a roster of seventeen cards, the one that is actually working is the one a
 * person is looking for -- and it was the only one with no words at all. Its
 * whole state was a hue on a 24px mark.
 *
 * THE GOAL THIS ANSWERS IS THE NON-NEGOTIABLE ONE: *"the agent's activity must
 * be visible in real time: what it is doing right now, what it just finished,
 * what it is about to do."* A colour says "something", not "what".
 *
 * ── AND IT IS NOT THE SECOND COPY THE COMMENT WAS GUARDING AGAINST ────────
 * That is the whole justification for overruling it here. The mark says THAT it
 * is running. This says HOW MUCH is in flight and how much is waiting behind --
 * `running` and `queued`, both already on every roster row (`CrewRunTally`) and
 * neither drawn anywhere in the product. New information, not a restatement, so
 * the card still carries one live signal per fact.
 *
 * SILENT WHEN NOTHING IS RUNNING, so `lastWorkedLine` keeps its slot unchanged
 * and no card gains a line it did not have. The two are mutually exclusive by
 * the same condition, which is why this is a sibling rather than a widening.
 *
 * QUEUED IS OMITTED AT ZERO rather than printed as "0 waiting", which is the
 * same rule `needsALookLine` follows above: a line that says nothing on almost
 * every card teaches a reader to stop reading the line.
 */
export function workingNowLine(
  running: number | null | undefined,
  queued: number | null | undefined,
): string | null {
  if (typeof running !== "number" || !Number.isFinite(running) || running <= 0) return null;
  const now = running === 1 ? "Working on 1 run now" : `Working on ${running} runs now`;
  const waiting =
    typeof queued === "number" && Number.isFinite(queued) && queued > 0
      ? `, ${queued} waiting behind it`
      : "";
  return `${now}${waiting}.`;
}
