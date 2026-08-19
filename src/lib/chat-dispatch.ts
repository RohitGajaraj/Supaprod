import { agentDisplayName } from "@/lib/agent-vocabulary";

/**
 * WHETHER A CHAT MESSAGE OPENS A RUN, AND WHAT TO SAY WHEN IT CANNOT.
 *
 * WHY THIS IS A MODULE AND NOT TEN LINES INSIDE `api/chat.ts`. The defect it
 * exists to close was two conditions that disagreed. The route asked "should a
 * run open?" in one place to decide whether to run its pre-flight checks, and
 * again in a second place to decide whether to dispatch, and the second one
 * required a value only the first one could produce. So the branch built for
 * `intent: "do"` could never fire: `startingAgent` is assigned inside the
 * `isMission` block, and the line below it read `forcedDo && startingAgent`,
 * which is false for every request `isMission` had not already claimed. "Hand
 * it over" worked anyway, by accident, because the client prefixes the literal
 * string `@cos` and a resolved mention takes a different path entirely. With no
 * conductor seeded, the mention resolved to nothing, the classifier read the
 * words as chat, and the button returned prose and started nothing.
 *
 * `wantsDispatch` is the single expression both gates now call, so they cannot
 * drift apart again. It is here rather than there because a route module in
 * this repo cannot be imported by a test (it pulls the whole server graph), and
 * a predicate whose whole history is being subtly wrong is the last thing that
 * should be untestable.
 *
 * THE SENTENCES ARE OURS, WRITTEN ONCE, NEVER PARAPHRASED BY A MODEL. What
 * these replace was a system message spliced into the answer prompt: `CRITICAL:
 * The user tried to dispatch a mission but checks failed: "<raw error>".
 * Explain this problem to the user`. Three things were wrong with it. A
 * Postgres error string was handed to a language model and read back to a
 * person. What they were told varied run to run, because it was generated. And
 * the reply still arrived dressed as an answer to their question, so a request
 * to do work came back as prose about why it had not been done.
 */

/**
 * WHY A RUN DID NOT OPEN. A closed set, because each member has to earn a
 * sentence, and a set that can grow by accident grows a default instead.
 *
 * SEVEN CONDITIONS COLLAPSE INTO FIVE STATES, and the collapse is deliberate.
 * `api/chat.ts` checks for a workspace on both the mention branch and the
 * orchestrator branch, and it can fail to find a conductor two ways: the seeding
 * call errors, or the row is still absent once it returns without error. Each
 * pair is different causes and one state, because the test a state has to pass
 * is "what is missing, and what do you do" and the answer within a pair is
 * identical. The causes are not lost: the route logs the raw one server-side and
 * sends only the id, which is the same split `sanitizeError` makes everywhere
 * else.
 */
export type DispatchBlock =
  /** No default workspace, so there is nowhere for a run to live. */
  | "no-workspace"
  /** The conductor seat could not be set up, or was still not there after. */
  | "conductor-unavailable"
  /** A conductor with nobody to hand work to. The common one. */
  | "no-specialists"
  /** An unexpected throw during pre-flight. Nothing was created. */
  | "preflight-failed"
  /** The dispatch itself threw. A run row may already exist. */
  | "dispatch-failed";

/**
 * THE THREE NAMED HERE ARE ONE PER PHASE MOST WORK PASSES THROUGH, which is
 * why it is three and why it is these: something to notice the work, something
 * to rank it, something to do it. Read through `agentDisplayName` rather than
 * spelled out, because the string this feeds is consumer-facing and the slugs
 * are not: the sentence that shipped before this one told people to enable
 * "Discovery, Strategist, Build", which is two internal slugs and a station
 * name, none of which appear anywhere on the roster they were sent to.
 */
const SUGGESTED_SPECIALISTS = ["discovery-scout", "strategist", "builder"] as const;

/** "Watch, Prioritize and Engineer". Serial comma omitted; house voice. */
function suggestedSpecialists(): string {
  const names = SUGGESTED_SPECIALISTS.map((slug) => agentDisplayName(slug));
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/**
 * What the person reads. One sentence naming what is missing, one naming what
 * they can do about it, and in every case the first three words say whether
 * anything started, because that is the only fact they cannot afford to guess.
 *
 * NO LINK, AND THAT IS NOT AN OVERSIGHT. This text renders through `Answer`,
 * whose anchor component sends every link to a new tab with `noopener`, on the
 * standing rule that a link inside model prose is a link nobody verified. An
 * in-app destination opened that way is a fresh document load in a second tab,
 * so the destination is named in words instead and the person navigates the way
 * they already know how.
 */
export function dispatchBlockedMessage(block: DispatchBlock): string {
  switch (block) {
    case "no-workspace":
      return "Nothing started. You have no default workspace, so there is nowhere for a run to live. Create one or accept an invite, then hand this over again.";
    case "conductor-unavailable":
      return `Nothing started. ${agentDisplayName("orchestrator")} plans every run, and that seat could not be set up on this account just now. Your words are saved above, so hand this over again in a minute.`;
    case "no-specialists":
      return `Nothing started. A run needs at least one specialist to hand work to, and every agent on this account is switched off. Turn one on under Agents (${suggestedSpecialists()} cover most work), then hand this over again.`;
    case "preflight-failed":
      return "Nothing started. A check ahead of the run failed, and it is not one you can clear from here. Your words are saved above, so hand this over again in a minute.";
    case "dispatch-failed":
      return "The run did not start, and it may have been opened before it failed. Look for it under Runs before you hand this over again, or you could end up with two.";
  }
}

/**
 * WHAT IS LEFT WHEN THE ADDRESSING COMES OFF THE FRONT.
 *
 * The client prefixes `@cos` when someone hands work over, so the words that
 * arrive at the server are not the words they typed. While the `forcedDo`
 * branch was dead this never mattered: either the mention resolved and the
 * mention path stripped it, or nothing dispatched at all. Repairing the branch
 * makes it matter, because the title and goal fall back to the raw content
 * whenever the classifier read the request as chat, and a run called
 * "@cos fix the redirect" would be a defect this change introduced.
 *
 * LEADING ONLY. A mention further into a sentence is subject rather than
 * address ("ask @engineer why this broke"), and cutting it would edit somebody's
 * instruction. Returns "" for a bare mention with nothing after it, which is
 * the signal `wantsDispatch` uses to refuse: "@cos" alone is a greeting, and a
 * run whose entire goal is the name of the seat you handed it to is worse than
 * the chat reply it would have got.
 */
export function instructionForDispatch(content: string): string {
  return content.replace(/^\s*@[a-z][a-z-]{1,30}\b/i, "").trim();
}

/**
 * Does this request want a run opened? Called TWICE in `api/chat.ts`, once to
 * gate the pre-flight checks and once to gate the dispatch, and that is the
 * whole point of it existing: the bug was those two asking different questions.
 *
 * `isMission` is the classifier's read or a resolved mention. `forcedDo` is the
 * person pressing the fork themselves, which outranks a guess and is sufficient
 * on its own, as long as they said something to act on.
 */
export function wantsDispatch(opts: {
  isMission: boolean;
  forcedDo: boolean;
  /** `instructionForDispatch(body.content)`. */
  instruction: string;
}): boolean {
  return opts.isMission || (opts.forcedDo && opts.instruction.length > 0);
}
