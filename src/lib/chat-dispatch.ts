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
 * it over" worked anyway, by accident, because the client prefixed the literal
 * string `@cos` and a resolved mention takes a different path entirely. With no
 * conductor seeded, the mention resolved to nothing, the classifier read the
 * words as chat, and the button returned prose and started nothing.
 *
 * THE ACCIDENT WAS REMOVED ON 2026-08-22, once this predicate had made the
 * honest path work. `contentForIntent` sends the person's words unedited and
 * `intent: "do"` is now the only thing promoting a stated instruction, so
 * `wantsDispatch` is no longer a repair with a fallback behind it — it is the
 * whole promotion path. `ask-intent.ts` records what the prefix was costing.
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
export const DISPATCH_BLOCKS = [
  /** No default workspace, so there is nowhere for a run to live. */
  "no-workspace",
  /** The conductor seat could not be set up, or was still not there after. */
  "conductor-unavailable",
  /** A conductor with nobody to hand work to. The common one. */
  "no-specialists",
  /** An unexpected throw during pre-flight. Nothing was created. */
  "preflight-failed",
  /** The dispatch itself threw. A run row may already exist. */
  "dispatch-failed",
] as const;

export type DispatchBlock = (typeof DISPATCH_BLOCKS)[number];

/**
 * A block id THAT CROSSED THE WIRE, or null.
 *
 * WHY THE LIST BECAME A RUNTIME VALUE. The union above was a type and nothing
 * else, which is enough while the only reader is the same isolate that wrote
 * it. `api/chat.ts` now puts the id on the SSE stream so the pane can render a
 * named state rather than a paragraph, and a string arriving over a network is
 * not a union member just because TypeScript would like it to be. This is the
 * same rule `ask-sse.ts` already applies to a station id: validate against the
 * closed set, and degrade to silence rather than render a guess.
 *
 * The type is DERIVED from the array so the two cannot drift. Adding a member
 * to the array without a sentence for it fails `dispatchBlockedMessage`'s
 * exhaustive switch at compile time, which is the point: a state that cannot
 * be explained to a person has no business existing.
 */
export function asDispatchBlock(value: unknown): DispatchBlock | null {
  if (typeof value !== "string") return null;
  return (DISPATCH_BLOCKS as readonly string[]).includes(value) ? (value as DispatchBlock) : null;
}

/**
 * WHERE A PERSON GOES TO CLEAR THIS, as an in-app route, or null when there is
 * nowhere to send them.
 *
 * `dispatchBlockedMessage` names the destination in words and deliberately
 * carries no link, because that text renders through `Answer`, whose anchor
 * component sends every href to a new tab. A named state is a different
 * surface: it is a component, so it can use the router and keep the person in
 * the app. The words and the route are kept side by side here so the sentence
 * and the button cannot name two different places.
 *
 * NULL FOR THREE OF THE FIVE, and each null was checked rather than assumed.
 * `preflight-failed` and `conductor-unavailable` are ours to fix and no screen
 * helps; a button there would be busywork dressed as an action. `no-workspace`
 * looks like it should point somewhere and does not: this product has no
 * create-a-workspace surface, because `ensureDefaultWorkspace` makes one during
 * onboarding and the `_authenticated` gate sends an un-onboarded account
 * straight there. Sending someone to Settings to do a thing Settings cannot do
 * is the wrong-destination failure `AskLanding` already refuses by name, and it
 * costs a navigation, a search, and their belief in every other button like it.
 *
 * The two that DO point somewhere point at the place their own sentence
 * already names, which is the check that keeps them honest.
 */
export function dispatchBlockRoute(block: DispatchBlock): { to: string; label: string } | null {
  switch (block) {
    case "no-specialists":
      return { to: "/agents", label: "Open Agents" };
    case "dispatch-failed":
      return { to: "/today", label: "Open Runs" };
    case "no-workspace":
    case "conductor-unavailable":
    case "preflight-failed":
      return null;
  }
}

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
 * The client USED TO PREFIX `@cos` when someone handed work over, so the words
 * that arrived at the server were not the words they typed. While the `forcedDo`
 * branch was dead this never mattered: either the mention resolved and the
 * mention path stripped it, or nothing dispatched at all. Repairing the branch
 * made it matter, because the title and goal fall back to the raw content
 * whenever the classifier read the request as chat, and a run called
 * "@cos fix the redirect" would have been a defect that change introduced.
 *
 * THE CLIENT NO LONGER WRITES ONE AND THIS IS STILL NEEDED, which is worth
 * being explicit about because "the prefix is gone" reads like a reason to
 * delete it. A person can type `@anything` at the front of a sentence. When it
 * names an agent on their roster the mention branch handles it; when it does
 * NOT — a slug they do not have, a typo, a colleague's name — `mentionedAgent`
 * stays null, the words fall through to here, and the addressing has to come
 * off before it becomes a run's title.
 *
 * LEADING ONLY. A mention further into a sentence is subject rather than
 * address ("ask @engineer why this broke"), and cutting it would edit somebody's
 * instruction. Returns "" for a bare mention with nothing after it, which is
 * the signal `wantsDispatch` uses to refuse: a bare "@cos" is a greeting, and a
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
 *
 * SINCE THE PREFIX WENT, THE SECOND CLAUSE IS THE ONLY WAY A HANDOVER STARTS.
 * It used to be belt and braces — a stated "do" that also arrived wearing a
 * resolved mention, so `isMission` was already true. Now nothing else is
 * carrying it, which is the point (the classifier gets to run, and the run gets
 * planned) and also the risk: break this clause and "Hand it over" goes back to
 * answering. `chat-dispatch.test.ts` asserts the bare case first for that reason.
 */
export function wantsDispatch(opts: {
  isMission: boolean;
  forcedDo: boolean;
  /** `instructionForDispatch(body.content)`. */
  instruction: string;
}): boolean {
  return opts.isMission || (opts.forcedDo && opts.instruction.length > 0);
}
