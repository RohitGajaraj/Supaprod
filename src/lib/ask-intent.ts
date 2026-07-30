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
 * HOW "hand it over" ACTUALLY DISPATCHES, with no contract change: `api/chat.ts`
 * treats a leading `@slug` as "an unambiguous command", skips its classifier
 * entirely and dispatches a single-step mission to that agent. So handing work
 * over prefixes the conductor's own alias and the person sees the prefix in
 * their own message. Where the roster has no conductor row the mention resolves
 * to nothing and the server's classifier runs exactly as it does today, so the
 * worst case is today's behaviour rather than a broken send.
 */

export type AskIntent = "question" | "instruction";

/** The alias `api/chat.ts` maps to the conductor (MENTION_ALIASES: cos ->
 *  orchestrator). Handing work over addresses the seat that runs the crew. */
export const HANDOVER_MENTION = "@cos";

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

/** What actually goes on the wire. A question travels verbatim. */
export function contentForIntent(draft: string, intent: AskIntent): string {
  const text = draft.trim();
  if (intent === "question" || text.startsWith("@")) return text;
  return `${HANDOVER_MENTION} ${text}`;
}
