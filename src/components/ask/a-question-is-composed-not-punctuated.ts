/**
 * ── EACH GATE FAMILY'S QUESTION (P-50, from A1's live read) ───────────────
 *
 * The approvals card built its question as `${item.title}?`, and A1 read the
 * result on the served build: "...checkout completion rate from 67 ?" and
 * "Ships a merged changeset to production, where customers see it.?".
 *
 * `prds.title` is a descriptive sentence, not a question with a mark missing,
 * and a tool gate's title is `toolConsequence(tool).effect` -- a statement of
 * what the call CHANGES. That is evidence. It argues for an answer, so it
 * belongs in the card's reason, and it was standing in the ask.
 *
 * The mark itself is placed by `askQuestion` in Meridian, which is typed so no
 * caller can glue one on. This file supplies only the verb each family asks in.
 */
import { askQuestion, type AskQuestion } from "@/components/meridian/question";
import type { ApprovalKind } from "@/lib/approvals-queue.functions";

/**
 * `tool_call` deliberately takes NO subject. Folding its title in would ask
 * "Let this run: Ships a merged changeset to production?" -- the sentence A1
 * read, with the seam moved rather than closed. The consequence is already the
 * card's leading reason line, which is where a thing that argues belongs.
 *
 * `trust_graduation` carries no verb because its title is already the
 * imperative: "Let the agent run X without asking".
 */
const ASKS: Record<ApprovalKind, { verb: string; takesSubject: boolean }> = {
  tool_call: { verb: "Let this run", takesSubject: false },
  decision: { verb: "Make this call:", takesSubject: true },
  memory_candidate: { verb: "Keep this on the record:", takesSubject: true },
  house_rule: { verb: "Make this a standing rule:", takesSubject: true },
  trust_graduation: { verb: "", takesSubject: true },
  spec: { verb: "Approve the spec for", takesSubject: true },
  opportunity: { verb: "Take this on:", takesSubject: true },
  assumption_challenge: { verb: "Reopen this decision:", takesSubject: true },
  design_gate: { verb: "Approve the design for", takesSubject: true },
  playbook_proposal: { verb: "Adopt this playbook:", takesSubject: true },
};

/**
 * `asPolicy` is the standing-policy register: the card is not asking about this
 * one gate but whether the family should keep asking at all, so the verb comes
 * from the register and never from the family.
 */
export function questionForGate(kind: ApprovalKind, title: string, asPolicy = false): AskQuestion {
  if (asPolicy) return askQuestion("Should this keep asking you:", title);

  // A family reaching this card before it reaches this map is a real
  // possibility, and a general question is better than an invented one.
  const ask = ASKS[kind] ?? { verb: "Approve this:", takesSubject: true };
  return askQuestion(ask.verb || "Approve this", ask.takesSubject ? title : null);
}
