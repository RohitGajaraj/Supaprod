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
 * concept is /crew. The types it keys on come from lib/crew.functions, which is
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
