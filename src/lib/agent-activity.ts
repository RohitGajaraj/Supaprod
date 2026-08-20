/**
 * ONE ACTIVITY VOCABULARY FOR AGENT SESSIONS, and the session state derived from it.
 *
 * ── WHY THIS EXISTS ─────────────────────────────────────────────────────
 * `agent_runs.status` carries six spellings of the same handful of facts,
 * including both `complete` and `completed`. `missions.status` carries eleven
 * words and no CHECK constraint. Five separate files map those raw strings onto
 * their own vocabulary and three of them disagree about what
 * `completed_with_failures` means, so the same run reads as opposite outcomes on
 * two surfaces.
 *
 * Every one of those spellings got in the same way: a writer needed a word, a
 * status column accepted any string, and it typed one. **The defect is the column,
 * not the writers.** So this module has no status field at all. A session's state
 * is DERIVED from the activity it has emitted, which means there is nowhere for a
 * seventh word to be invented: adding one would mean adding a branch to a typed
 * union, in a file with a test that enumerates it.
 *
 * ── THIS IS NOT `run-status.ts`, AND THE TWO MUST NOT BE FOLDED TOGETHER ─
 * They solve opposite halves and point in opposite directions in time.
 *
 *   `run-status.ts` looks BACKWARDS. It is the spelling layer for the vocabulary
 *   the database already holds: `normalizeRunStatus` takes whatever string a live
 *   row carries and returns one canonical value, so today's six spellings of
 *   "finished" stop reading as three different things. It exists because those
 *   rows are already written and cannot be un-written.
 *
 *   This file looks FORWARDS. It is the vocabulary a session should have emitted
 *   in the first place, where nothing writes a status at all. It knows nothing
 *   about `agent_runs`, deliberately, and it imports nothing.
 *
 * **Nothing here reads or replaces `run-status.ts` and nothing here changes a
 * writer or a consumer.** Mapping today's spellings onto these states is real work
 * and it needs a live database to check, so it belongs to the lane that has one.
 * Doing both in one change would make an unreviewable diff out of a mapping nobody
 * has agreed yet, which is exactly how the four normalisers happened.
 *
 * ── LIFTED FROM LINEAR, NOT INVENTED ────────────────────────────────────
 * The standing rule is to find the best proven product for a surface and lift its
 * information model and its verbs close to verbatim. For "an agent session a
 * person can watch", that product is Linear, and it publishes the schema:
 *
 *   https://linear.app/developers/agent-interaction
 *   https://linear.app/developers/agent-best-practices
 *   https://www.linear.app/developers/agent-signals
 *   https://www.linear.app/changelog/2025-07-30-agent-interaction-guidelines-and-sdk
 *
 * Verbatim from those pages: the five agent-emittable activity types, the
 * user-only sixth, the six session state names spelled as Linear spells them, the
 * rule that state is tracked from the last emitted activity rather than stored,
 * the `ephemeral` flag and its restriction to `thought` and `action`, and all
 * three timing figures.
 *
 * ── WHERE LINEAR DOES NOT ACTUALLY SAY WHAT WE NEEDED, AND WHAT WE CHOSE ─
 * Four gaps. Each one is called out again at the code it affects.
 *
 *   1. `unresponsive` IS NOT ONE OF THE SIX STATES. Linear's best-practices page
 *      says an agent that does not answer within ten seconds "will be shown as
 *      unresponsive", and its state list is `pending, active, error,
 *      awaitingInput, complete, stale` with no such member. It never says which
 *      of the six an unresponsive session reads as. Modelled here as a FLAG on
 *      the state rather than a seventh state, which is the only reading that
 *      keeps the six-state claim true. See `SessionSnapshot.unresponsive`.
 *   2. THE TEN-SECOND CLOCK IS DOCUMENTED FOR THE `created` EVENT ONLY. Running
 *      the same clock on a follow-up prompt is ours. See `ACKNOWLEDGE_WITHIN_MS`.
 *   3. WHETHER `awaitingInput`, `error` OR `complete` GO STALE IS NOT STATED.
 *      We say no. See `STALE_AFTER_MS`.
 *   4. "REPLACED WHEN THE NEXT ACTIVITY ARRIVES FROM THE AGENT" is read
 *      literally: a user prompt does not clear an ephemeral row. See
 *      `timelineActivities`.
 *
 * ── PURE, AND THE TEST ENFORCES IT ──────────────────────────────────────
 * No imports, no database, no `.server.ts`, and no clock of its own: `now` arrives
 * as a parameter. `agent-activity.test.ts` reads this file's own source and fails
 * the build on an import, an `await`, a `Date.now(` or a `Math.random(`, because
 * `tsc` cannot see the difference and one convenient import is all it takes.
 */

/**
 * THE FIVE AN AGENT MAY EMIT, plus the one only a person can.
 *
 * Verbatim from Linear's activity content payloads. `prompt` is separated in the
 * type system rather than in a comment because Linear states the constraint as a
 * hard one: an agent cannot generate a `prompt` activity. It is the user's
 * message, and it is what starts a turn rather than reporting on one.
 */
export type EmittableActivityType = "thought" | "action" | "elicitation" | "response" | "error";

/** Every activity type a session can hold, whoever wrote it. */
export type ActivityType = EmittableActivityType | "prompt";

/**
 * The five, as data, in Linear's own order.
 *
 * Exported so a guard can enumerate them rather than transcribing them, which is
 * the mistake that let four normalisers each know a different subset of the
 * spellings they were all supposedly handling.
 */
export const EMITTABLE_ACTIVITY_TYPES: readonly EmittableActivityType[] = [
  "thought",
  "action",
  "elicitation",
  "response",
  "error",
];

/** Every activity type, the user-only one last. */
export const ACTIVITY_TYPES: readonly ActivityType[] = [...EMITTABLE_ACTIVITY_TYPES, "prompt"];

/**
 * One row in a session's activity, discriminated on `type`.
 *
 * Each member carries exactly the fields Linear's payload for that type carries,
 * plus `at`. Two things are worth reading rather than skimming:
 *
 * `at` IS EPOCH MILLISECONDS, NOT AN ISO STRING. The two clocks below are
 * arithmetic, and a module that parsed dates would need a failure mode for an
 * unparseable one. Converting at the edge keeps that failure where the data
 * arrives. A non-finite `at` is tolerated rather than rejected, see `chronological`.
 *
 * `ephemeral` EXISTS ONLY ON `thought` AND `action`, which is not a convention
 * here but Linear's stated rule, validated server-side on their end. Expressing it
 * in the union means `{ type: "response", ephemeral: true }` is a compile error
 * rather than a runtime rejection.
 */
export type AgentActivity =
  | { type: "thought"; at: number; body: string; ephemeral?: boolean }
  | {
      type: "action";
      at: number;
      /** The verb, tensed by whether it finished: "Searching", then "Searched". */
      action: string;
      /** What it acted on. */
      parameter: string;
      /** Absent while the action is still running. */
      result?: string;
      ephemeral?: boolean;
    }
  | { type: "elicitation"; at: number; body: string }
  | { type: "response"; at: number; body: string }
  | { type: "error"; at: number; body: string }
  | { type: "prompt"; at: number; body: string };

/**
 * The six session states, spelled as Linear spells them.
 *
 * `awaitingInput` KEEPS ITS CAMEL CASE on purpose, against the snake_case habit of
 * every status string in this repo's database. These are not database values and
 * they never will be, since the whole design is that no column holds them. What
 * they might one day be is a value read off a Linear session, and a vocabulary
 * lifted verbatim can be compared to its source without a second mapping table in
 * between. A second mapping table is the thing this file exists to prevent.
 */
export type SessionState = "pending" | "active" | "error" | "awaitingInput" | "complete" | "stale";

/**
 * The six, as data, in Linear's own order.
 *
 * NOT ONE OF THEM IS TERMINAL, and that is the sharpest difference from
 * `run-status.ts`, which exports five terminal statuses and a `isTerminal`
 * predicate that a query relies on. There is no equivalent here and there must not
 * be: `complete` means the agent emitted a response, and a person may reply to
 * that response, at which point the session is pending again. State is derived
 * from the last activity, so any state can be left by adding one. That is the
 * mechanism the third timing contract rests on.
 */
export const SESSION_STATES: readonly SessionState[] = [
  "pending",
  "active",
  "error",
  "awaitingInput",
  "complete",
  "stale",
];

/**
 * HOW LONG A SESSION MAY SAY NOTHING BEFORE IT LOOKS BROKEN: ten seconds.
 *
 * Verbatim from Linear's best practices, which asks for an immediate `thought`
 * acknowledging the prompt and says the first activity must arrive within ten
 * seconds of the created event or the agent is shown as unresponsive. Not our
 * number, and worth keeping theirs rather than picking one: it is the figure a
 * product with real agents installed settled on, and ten seconds is roughly the
 * point at which a person stops assuming a machine heard them.
 *
 * TWO THINGS THAT ARE OURS. Linear documents this clock for the `created` event
 * only; we run it on any trailing `prompt`, because a follow-up nobody has
 * acknowledged is the same fact one step later and a person waiting on an answer
 * cannot tell the two situations apart. And Linear lets an agent stop the clock by
 * setting an external URL instead of emitting an activity, which is a link to
 * their own dashboard. There is no equivalent here, so the only way to
 * acknowledge is to emit.
 */
export const ACKNOWLEDGE_WITHIN_MS = 10_000;

/**
 * HOW LONG A SESSION MAY GO QUIET BEFORE IT IS STALE: thirty minutes.
 *
 * Verbatim from Linear's best practices: follow-up activities can be sent for up
 * to thirty minutes before the session is considered stale.
 *
 * ── THE THIRD CONTRACT LIVES HERE, AND IT IS NOT A DURATION ─────────────
 * STALE IS RECOVERABLE. Linear says so outright, and in this module it is not a
 * rule anything has to remember: the clock runs from the LAST activity, and the
 * state is read off the LAST activity, so emitting anything at all both resets the
 * clock and re-reads the state. Recovery is what the derivation does when it is
 * simply run again, which is why there is no `recover` anything to call and no
 * terminal state to escape from. `deriveSessionState` is the whole of it.
 *
 * That is the reason this is a derivation rather than a stored status. A `stale`
 * column would need something to come along and clear it, and the something is
 * always a cron job nobody has written.
 *
 * ── ONLY `active` AND `pending` GO STALE, AND THAT PART IS OURS ─────────
 * Linear does not say whether a session sitting in `awaitingInput`, `error` or
 * `complete` eventually reads as stale. We say it does not, for a reason this
 * repo's colour law already draws: `--mrd-you` means a person is required and
 * `--mrd-agent` means a machine is working. A session waiting on a person is
 * silent because the person has not answered, and painting that as stale blames
 * the machine for the human's pause. An errored or answered session is settled,
 * and silence after a settled outcome is expected rather than worrying.
 *
 * So stale means one thing only: SOMETHING WAS SUPPOSED TO BE HAPPENING AND
 * NOTHING HAS. That is the only version of it worth showing anybody.
 */
export const STALE_AFTER_MS = 30 * 60_000;

/**
 * WHAT THE LAST ACTIVITY MEANS FOR THE SESSION, before either clock is read.
 *
 * This table is the entire state machine. There is no other transition rule and
 * no stored previous state to transition FROM, which is what makes the derivation
 * total: any list of activities has a last one, and its type has a row here.
 *
 * `prompt` MAPS TO `pending`, and it is the row a reader should check. A trailing
 * user message means the ball is with the agent and the agent has not moved yet,
 * which is precisely what pending means. Reading it as `active` would claim work
 * that may not have started; reading it as `awaitingInput` would be backwards,
 * since the person has just supplied the input.
 *
 * `thought` AND `action` BOTH MAP TO `active` and are not distinguished, including
 * an `action` still missing its `result`. The difference between thinking and
 * calling a tool is what the timeline renders; it is not a different answer to
 * "is this session working".
 */
const STATE_FROM_LAST_ACTIVITY: Readonly<Record<ActivityType, SessionState>> = {
  prompt: "pending",
  thought: "active",
  action: "active",
  elicitation: "awaitingInput",
  response: "complete",
  error: "error",
};

/** Whether an agent is allowed to write this type. A person writes the other one. */
export function isAgentEmittable(type: ActivityType): type is EmittableActivityType {
  return type !== "prompt";
}

/**
 * Whether this row is one that disappears when it is superseded.
 *
 * A predicate rather than a field read, because `ephemeral` exists on two of the
 * six union members and the check for which member you are holding is the same
 * check as Linear's validation rule. Doing it in one place means a caller cannot
 * accidentally ask a `response` whether it is ephemeral.
 */
export function isEphemeral(activity: AgentActivity): boolean {
  return (activity.type === "thought" || activity.type === "action") && activity.ephemeral === true;
}

/**
 * The activities in time order, oldest first.
 *
 * SORTED RATHER THAN TRUSTED, and the reason is a habit in this codebase rather
 * than caution in the abstract. Feed queries here order newest first, because that
 * is what a feed wants; `relay.ts` sorts descending to find a latest handoff. A
 * module that read the wrong end of a descending list would be correct in every
 * test anybody wrote with a hand-built array and wrong on the first real query,
 * which is this repo's most expensive defect class.
 *
 * AN ACTIVITY WITH A NON-FINITE `at` SORTS LAST, in the order it arrived. That
 * covers a `NaN` from an unparseable timestamp at the edge, and it fails in the
 * safe direction: a timeless row is treated as the most recent thing that
 * happened, so a session still reads as working rather than silently reading as
 * whatever it was doing before. It cannot advance either clock, because there is
 * no time to measure from.
 */
function chronological(activities: readonly AgentActivity[]): AgentActivity[] {
  return activities
    .map((activity, index) => ({ activity, index }))
    .sort((a, b) => {
      const aTimed = Number.isFinite(a.activity.at);
      const bTimed = Number.isFinite(b.activity.at);
      if (aTimed && bTimed) return a.activity.at - b.activity.at || a.index - b.index;
      if (aTimed) return -1;
      if (bTimed) return 1;
      return a.index - b.index;
    })
    .map((entry) => entry.activity);
}

/**
 * What a session is doing, as of `now`.
 *
 * ── WHY A SNAPSHOT AND NOT A BARE STATE STRING ──────────────────────────
 * Because `unresponsive` is a second question about the same instant, and a
 * surface needs both. Two functions would mean two traversals against two values
 * of `now`, and a session could render as `pending` with the unresponsive
 * treatment from four seconds later. One call, one answer, no way to disagree.
 *
 * ── TOTAL, WHICH IS DELIBERATE AND MEANS MORE THAN NOT THROWING ─────────
 * Empty list, one activity, activities out of order, a `NaN` timestamp, a `now`
 * that is `NaN`, a `now` BEFORE the last activity because two clocks disagree: all
 * defined, none of them special-cased with a guess. When there is no time to read,
 * neither clock fires and the state is whatever the last activity says, which is
 * the fact the module is most sure of.
 *
 * ── THE ACKNOWLEDGE CLOCK NEEDS THE OPENING PROMPT IN THE LIST ──────────
 * A session with no activities at all reads as `pending` and never as
 * unresponsive, because there is nothing to time from. That is not a hole, it is
 * the honest answer: the ten-second clock starts at the prompt, so a caller that
 * wants it enforced passes the prompt. Linear's own advice is to reconstruct a
 * session from its activities rather than from comments, for exactly this reason.
 */
export interface SessionSnapshot {
  /** One of the six. Read off the last activity, then escalated by the clocks. */
  state: SessionState;
  /**
   * Nothing has answered the prompt that opened this turn, and ten seconds have
   * passed.
   *
   * A FLAG RATHER THAN A SEVENTH STATE, because Linear's state list does not
   * contain `unresponsive` and its own docs describe it as how such a session is
   * SHOWN. Keeping it separate also lets both facts be true at once, which they
   * are: a prompt nobody answered for an hour is `stale` AND unresponsive, and a
   * seventh state would have forced a choice between saying the agent never
   * started and saying it went quiet.
   */
  unresponsive: boolean;
  /** Epoch ms of the activity the state was read off. `null` when there is none. */
  lastActivityAt: number | null;
}

export function deriveSessionState(
  activities: readonly AgentActivity[],
  now: number,
): SessionSnapshot {
  const ordered = chronological(activities);
  const last = ordered[ordered.length - 1];

  /* No activity at all is Linear's `pending`: the session exists and nothing has
     been said in it. There is no timestamp, so neither clock can run. */
  if (!last) return { state: "pending", unresponsive: false, lastActivityAt: null };

  const base = STATE_FROM_LAST_ACTIVITY[last.type];
  const lastActivityAt = Number.isFinite(last.at) ? last.at : null;
  const silentForMs =
    lastActivityAt === null || !Number.isFinite(now) ? null : now - lastActivityAt;

  /* A `now` before the last activity gives a negative silence and both
     comparisons are false, so skewed clocks read as busy rather than as broken.
     Claiming a session is stale because a server clock ran ahead would be a
     surface asserting something that did not happen. */
  const unresponsive =
    base === "pending" && silentForMs !== null && silentForMs >= ACKNOWLEDGE_WITHIN_MS;

  const wentQuiet =
    (base === "pending" || base === "active") &&
    silentForMs !== null &&
    silentForMs >= STALE_AFTER_MS;

  return { state: wentQuiet ? "stale" : base, unresponsive, lastActivityAt };
}

/**
 * The activities a person should actually see, in order.
 *
 * This is what `ephemeral` is FOR, and the reason it ships here rather than later:
 * a captured field with no reader is litter by this repo's own rule, and a flag
 * nobody honours is worse than no flag, because a writer will set it and believe
 * something happens.
 *
 * A "thinking" row is genuinely useful while it is the newest thing in the
 * session and genuinely noise once the next step lands. Without this, a session
 * that thought forty times leaves forty dead rows between the prompt and the
 * answer, which is how a timeline becomes a scroll nobody reads.
 *
 * ── "FROM THE AGENT" IS READ LITERALLY, AND IT IS A JUDGMENT ────────────
 * Linear says an ephemeral activity is replaced when the next activity arrives
 * FROM THE AGENT. So a user `prompt` landing after an ephemeral thought does not
 * clear it, and that is also the better behaviour: the thought is still the last
 * thing the agent said, and dropping it would leave a person's message sitting
 * under silence.
 *
 * Note that an ephemeral row still counts for `deriveSessionState`. It is
 * evidence the agent is alive and it resets the stale clock; it just does not
 * stay on screen. Linear derives from the last emitted activity without excluding
 * them either.
 */
export function timelineActivities(activities: readonly AgentActivity[]): AgentActivity[] {
  const ordered = chronological(activities);
  return ordered.filter((activity, index) => {
    if (!isEphemeral(activity)) return true;
    return !ordered.slice(index + 1).some((later) => isAgentEmittable(later.type));
  });
}
