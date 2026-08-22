/**
 * Question, or instruction?
 *
 * THE BIGGEST UNNAMED DECISION IN THE OLD PANEL. One box did two very different
 * things: "what happened to run 41" wants an answer, "fix the checkout redirect"
 * wants a dispatch, and one of those spends money and starts agents. The server
 * has always classified this on its own (`api/chat.ts`, classifier v3), which
 * means the FORK WAS ALREADY THERE and the person typing could not see it.
 *
 * This module does not take the decision away from the server. It picks the
 * DEFAULT of a control the person can see and flip before they press anything,
 * so the pane can say which of the two is about to happen. Pure and cheap: no
 * model call, so it can run on every keystroke.
 *
 * ── HOW "HAND IT OVER" DISPATCHES, AND THE PREFIX THAT USED TO DO IT ────────
 *
 * This file used to prefix the literal string `@cos` onto every instruction.
 * `api/chat.ts` treats a leading `@slug` as an unambiguous command, so the
 * mention resolved to the conductor, the classifier was SKIPPED, and a mission
 * dispatched. It worked. It was also an accident, and the accident cost four
 * things that only became visible once the honest path was repaired:
 *
 *   1. THE CLASSIFIER NEVER RAN ON A HANDOVER. `api/chat.ts` gates it on
 *      `!mentionedAgent && !forcedAsk`, so a resolved `@cos` skipped it
 *      entirely. Every field that call produces — the mission title, the goal,
 *      the research mode, and the entry station and work shape that
 *      `routeIntent` needs — was null for the one kind of turn that most needs
 *      them. The classifier's output was not "discarded" on this path; it was
 *      never computed.
 *   2. IT TOOK A DIFFERENT DISPATCH PATH. A resolved mention pre-plans a
 *      SINGLE-STEP DAG addressed to the mentioned agent and hands it to
 *      `advanceMissionCore`. So handing work over produced a one-step run whose
 *      only step was assigned to the conductor — the seat whose entire job is
 *      to plan a run for other agents — instead of `runAgentLoop`, which is the
 *      branch that actually plans a multi-step DAG. Multi-step work was
 *      reachable only when the classifier independently guessed "mission",
 *      which the prefix had just stopped it from doing.
 *   3. IT PUT A FALSE STATION ON THE WIRE. The mention branch emits a `station`
 *      frame off `agentStation(slug)`, and the conductor's catalog row carries
 *      `station: "decide"` with `conductor: true` — a row the catalog itself
 *      documents as "routes work, never a station occupant". So every handover
 *      lit Decide for a moment, on the strength of a seat that occupies no
 *      station.
 *   4. THE PERSON SAW `@cos` IN THEIR OWN SENTENCE. Their words were edited on
 *      the way to the transcript so that a mention hack would fire.
 *
 * WHAT REPLACED IT, and why nothing had to be invented for it: the request
 * field. `api/chat.ts` reads `body.intent` into `forcedDo`, and since the
 * 2026-08-20 repair `wantsDispatch({ isMission, forcedDo, instruction })` gates
 * BOTH the pre-flight checks and the dispatch off one expression. A stated "do"
 * with words after it opens a run on its own. That is the branch this control
 * was built for, so the control now uses it and the words travel verbatim.
 *
 * A LEADING `@slug` THE PERSON TYPED IS STILL HONOURED, untouched. "@engineer
 * rename the caller" names a specialist deliberately, the mention branch is the
 * right path for it, and that is a sentence somebody wrote rather than one we
 * rewrote on their behalf.
 */

export type AskIntent = "question" | "instruction";

/** Leading interrogatives and the shapes a question takes without one. */
const QUESTION_RE =
  /^\s*(what|why|when|where|which|who|whose|whom|how|is|are|was|were|do|does|did|can|could|should|would|will|has|have|had|am|any|show me|tell me|explain|remind me|summari[sz]e|compare|list)\b/i;

/** Imperative verbs that name WORK. Deliberately verbs of doing, not of
 *  telling: "show", "explain" and "list" read as instructions in English but
 *  are answered, not dispatched, so they live in the question list above. */
const INSTRUCTION_RE =
  /^\s*(fix|build|make|create|add|write|draft|implement|refactor|rename|remove|delete|migrate|deploy|ship|update|upgrade|change|set up|setup|configure|investigate|research|run|start|open a|raise a|file a|generate|scaffold|test|review|audit|clean up|port|wire|hook up|send|schedule|plan out)\b/i;

/**
 * The default mode for a draft.
 *
 * A trailing question mark wins over everything: it is the clearest signal a
 * person gives, and honouring it means a question phrased as an imperative
 * ("run me through the checkout change?") never silently starts a run.
 */
export function defaultIntent(draft: string): AskIntent {
  const text = draft.trim();
  if (!text) return "question";
  if (text.startsWith("@")) return "instruction";
  if (text.endsWith("?")) return "question";
  if (QUESTION_RE.test(text)) return "question";
  if (INSTRUCTION_RE.test(text)) return "instruction";
  return "question";
}

/**
 * What actually goes on the wire: the person's words, unedited, either way.
 *
 * THIS FUNCTION USED TO BE THE DISPATCH LEVER and now it is not, which is the
 * whole repair — see the `@cos` section at the top of the file. The lever is
 * the `intent` field that travels beside this string in the request body
 * (`AskPane` maps question/instruction to the API's ask/do), and it has been
 * load-bearing on the server since the two dispatch gates were made to ask one
 * question. Kept as a function rather than inlined because the caller's shape
 * ("what goes on the wire for this intent") is the thing worth naming, and
 * because a future intent may genuinely need to alter the text.
 */
export function contentForIntent(draft: string, _intent: AskIntent): string {
  return draft.trim();
}
