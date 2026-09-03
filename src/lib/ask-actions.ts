/**
 * The fourth register: what you can SETTLE from inside Ask.
 *
 * Founder ruling, 2026-07-30, raised several times before that: *"If there is
 * any action that needs to be taken ... it needs to render a card inside itself
 * where the action needs to be taken there itself ... so that we are helping the
 * user not to get into too much navigation."*
 *
 * So Ask is not a reader. The test for the surface is whether a person can ask
 * one question and finish the thing without going anywhere. This module is the
 * pure half: which of the workspace's real, already-pending gates belong beside
 * a given answer, and whether the queue itself is proposing a policy change.
 *
 * WHY ONE FEED AND NOT TEN CARD TYPES. `getApprovalsQueue` already federates
 * ten gate families into one typed list (tool call, decision, memory candidate,
 * house rule, trust graduation, spec, opportunity, assumption challenge, design
 * gate, playbook proposal), and `decideApprovalItem` routes a verdict back to
 * that family's existing resolver. Reusing that pair is what makes every card
 * here carry a real server function rather than a button that calls nothing.
 *
 * MATCHING IS BY ID, NEVER BY TOPIC. A gate is drawn beside an answer only when
 * the answer's server-resolved blocks or retrieved sources name that exact
 * entity. A fuzzy match would put an approve button under an unrelated
 * sentence, which on this surface is worse than showing nothing.
 */

import type { AnswerBlock } from "@/lib/ask-blocks";
import type { ChatMeta } from "@/lib/chat-meta";
import type { ApprovalQueueItem } from "@/lib/approvals-queue.functions";

const UUID_IN_TEXT = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/** Every entity id this answer genuinely referenced. Blocks carry theirs
 *  directly; a retrieved source carries its own inside its deep link. */
export function entityIdsFor(msg: {
  blocks?: AnswerBlock[] | null;
  meta?: ChatMeta | null;
}): Set<string> {
  const ids = new Set<string>();
  for (const b of msg.blocks ?? []) {
    if (b.kind === "decision" || b.kind === "opportunity" || b.kind === "mission") {
      ids.add(b.id.toLowerCase());
    }
  }
  for (const s of msg.meta?.sources ?? []) {
    if (!s.href) continue;
    for (const m of s.href.match(UUID_IN_TEXT) ?? []) ids.add(m.toLowerCase());
  }
  return ids;
}

/**
 * A question that is ASKING about the queue. Narrow on purpose: a false
 * positive staples an approve button under an answer that never mentioned it.
 */
const QUEUE_RE =
  /\b(waiting on me|needs? (?:me|my|your) (?:call|approval|attention)|what(?:'s| is| do i need to)? approve|anything (?:for|waiting on) me|my approvals?|approval queue|what(?:'s| is) blocking|blocked on me|sign off|stuck on me)\b/i;

export function isQueueQuestion(q: string): boolean {
  return QUEUE_RE.test(q);
}

/** Cards beside one answered turn. Empty is the common case and it is fine. */
export function gatesForAnswer(
  queue: ApprovalQueueItem[],
  msg: { content: string; blocks?: AnswerBlock[] | null; meta?: ChatMeta | null },
  question: string,
  limit = 3,
): ApprovalQueueItem[] {
  if (queue.length === 0) return [];
  // Asked about the queue: the queue IS the answer, so its head is drawn.
  if (isQueueQuestion(question)) return queue.slice(0, limit);
  const ids = entityIdsFor(msg);
  if (ids.size === 0) return [];
  return queue.filter((i) => ids.has(i.sourceId.toLowerCase())).slice(0, limit);
}

/**
 * The gates worth drawing before a word is typed.
 *
 * The emptiest realistic state is an Ask panel opened on day one, and an empty
 * panel is exactly the complaint this rebuild is answering. What is genuinely
 * true at that moment is what the crew is holding for you, so that is what it
 * shows. When the pane is scoped to one thing, only that thing's gates count:
 * a scope chip that narrows the answer and not the cards is decoration.
 */
export function openingGates(
  queue: ApprovalQueueItem[],
  scopeSourceId: string | null,
  limit = 2,
): ApprovalQueueItem[] {
  if (queue.length === 0) return [];
  if (scopeSourceId) {
    const id = scopeSourceId.toLowerCase();
    return queue.filter((i) => i.sourceId.toLowerCase() === id).slice(0, limit);
  }
  return queue.slice(0, limit);
}

/**
 * The strongest card on the surface, and it is not the approve button.
 *
 * GOVERNANCE-PRINCIPLE.md: *"A long approvals queue is a policy failure to
 * surface, not a workload to render"*, and the move it names is to offer to
 * remove the queue rather than to render it beautifully.
 *
 * The detection is NOT ours to invent. `reflection.server.ts` already watches
 * clean streaks and writes a `trust_graduation_proposals` row when an agent has
 * earned a mode, and the queue carries that row with its own streak count in
 * `evidence`. So the product's own record supplies the number, and this
 * function only decides that it belongs at the top. Where no proposal exists,
 * nothing is drawn: counting today's pending items would be a different claim
 * ("N are waiting") wearing the sentence of this one ("you approved N without
 * changing them").
 */
export function policyProposal(queue: ApprovalQueueItem[]): ApprovalQueueItem | null {
  return queue.find((i) => i.kindKey === "trust_graduation") ?? null;
}

/** Everything else, once the policy proposal has been lifted out of the list. */
export function withoutPolicy(
  queue: ApprovalQueueItem[],
  policy: ApprovalQueueItem | null,
): ApprovalQueueItem[] {
  return policy ? queue.filter((i) => i.id !== policy.id) : queue;
}
