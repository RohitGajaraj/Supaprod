/**
 * EVERY TRANSITION, ENUMERATED RATHER THAN SAMPLED.
 *
 * A state machine is not correct because the six cases somebody thought of return
 * what they expected. It is correct because the whole table is checked, and the
 * table here is small enough to check exhaustively: six states the session can be
 * in, six activity types that can arrive, thirty-six transitions. All thirty-six
 * are asserted below, with a guard that the matrix really does cover both axes so
 * it cannot pass by iterating a subset. That guard is the point. Four normalisers
 * in this repo each knew a different part of the vocabulary they were all
 * supposedly handling, and every one of them passed its own tests.
 *
 * RECOVERY FROM STALE IS NOT A SPECIAL CASE IN THAT TABLE, and that is the
 * strongest thing these tests say. It falls out of six of the thirty-six cells,
 * because the derivation reads the last activity and nothing else. A design where
 * recovery needed its own code path would be a design with a stored status.
 *
 * THE PURITY ASSERTIONS ARE NOT DECORATION EITHER. This module's whole value is
 * that a session's state can be reasoned about with no database, and the way that
 * stops being true is one convenient import a year from now. `tsc` cannot see the
 * difference. Reading the source can.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

import {
  ACKNOWLEDGE_WITHIN_MS,
  ACTIVITY_TYPES,
  EMITTABLE_ACTIVITY_TYPES,
  SESSION_STATES,
  STALE_AFTER_MS,
  deriveSessionState,
  isAgentEmittable,
  isEphemeral,
  timelineActivities,
  type ActivityType,
  type AgentActivity,
  type SessionState,
} from "./agent-activity";

/** A fixed instant, so nothing here reads a clock either. */
const T0 = 1_767_225_600_000;

function activity(type: ActivityType, at: number, ephemeral = false): AgentActivity {
  switch (type) {
    case "action":
      return { type, at, action: "Searching", parameter: "the changelog", ephemeral };
    case "thought":
      return { type, at, body: "Reading the spec first.", ephemeral };
    default:
      return { type, at, body: "one line" } as AgentActivity;
  }
}

function stateOf(activities: AgentActivity[], now: number): SessionState {
  return deriveSessionState(activities, now).state;
}

/**
 * The state each activity type means when it is the last one, transcribed from
 * Linear's model rather than imported, so a change to the module's private table
 * has to be agreed here too.
 */
const MEANS: Record<ActivityType, SessionState> = {
  prompt: "pending",
  thought: "active",
  action: "active",
  elicitation: "awaitingInput",
  response: "complete",
  error: "error",
};

/**
 * A prefix that leaves the session in each of the six states, paired with the
 * `now` that reads it. Stale is the only one that needs a clock rather than an
 * activity, which is itself the shape of the model: five states are facts somebody
 * emitted and the sixth is a silence.
 */
const PREFIX: Record<SessionState, { activities: AgentActivity[]; now: number }> = {
  pending: { activities: [activity("prompt", T0)], now: T0 + 1 },
  active: { activities: [activity("prompt", T0), activity("thought", T0 + 5)], now: T0 + 6 },
  error: { activities: [activity("prompt", T0), activity("error", T0 + 5)], now: T0 + 6 },
  awaitingInput: {
    activities: [activity("prompt", T0), activity("elicitation", T0 + 5)],
    now: T0 + 6,
  },
  complete: { activities: [activity("prompt", T0), activity("response", T0 + 5)], now: T0 + 6 },
  stale: {
    activities: [activity("prompt", T0), activity("thought", T0 + 5)],
    now: T0 + 5 + STALE_AFTER_MS,
  },
};

describe("the vocabulary is Linear's, and all of it is here", () => {
  it("holds the five an agent may emit", () => {
    expect([...EMITTABLE_ACTIVITY_TYPES]).toEqual([
      "thought",
      "action",
      "elicitation",
      "response",
      "error",
    ]);
  });

  it("holds the user-only sixth, and refuses it to an agent", () => {
    // Linear states this as a hard constraint: an agent cannot generate a prompt.
    expect(ACTIVITY_TYPES).toContain("prompt");
    expect(isAgentEmittable("prompt")).toBe(false);
    for (const type of EMITTABLE_ACTIVITY_TYPES) {
      expect(isAgentEmittable(type), type).toBe(true);
    }
  });

  it("holds the six session states, spelled as Linear spells them", () => {
    expect([...SESSION_STATES]).toEqual([
      "pending",
      "active",
      "error",
      "awaitingInput",
      "complete",
      "stale",
    ]);
  });

  it("keeps camelCase on awaitingInput rather than translating it", () => {
    /*
     * Against every status string in this repo's database, on purpose. These are
     * not database values and never will be, since no column holds them. What they
     * might be is a value read off a Linear session, and a verbatim vocabulary can
     * be compared to its source with no second mapping table in between. A second
     * mapping table is what this file exists to prevent.
     */
    expect(SESSION_STATES).toContain("awaitingInput");
    expect(SESSION_STATES).not.toContain("awaiting_input" as SessionState);
  });

  it("names no state Linear does not name, and `unresponsive` is the one to check", () => {
    /*
     * THE DISCREPANCY WORTH RECORDING. Linear's best-practices page says an agent
     * that does not answer in ten seconds is SHOWN as unresponsive, and its state
     * list has no such member. So it is a flag, not a seventh state, which is the
     * only reading that keeps the six-state claim true.
     */
    expect(SESSION_STATES).not.toContain("unresponsive" as SessionState);
    expect(SESSION_STATES.length).toBe(6);
  });
});

describe("every transition, all thirty-six of them", () => {
  it("takes every state to every other by appending one activity", () => {
    const wrong: string[] = [];
    for (const from of SESSION_STATES) {
      for (const type of ACTIVITY_TYPES) {
        const { activities, now } = PREFIX[from];
        // Appended at `now`, so no clock has had time to escalate the result.
        const next = [...activities, activity(type, now)];
        const got = stateOf(next, now);
        if (got !== MEANS[type]) wrong.push(`${from} + ${type} -> ${got}, wanted ${MEANS[type]}`);
      }
    }
    expect(
      wrong,
      "the machine is not memoryless: a transition depended on where it came from",
    ).toEqual([]);
  });

  it("started from all six states, so the sweep above was not vacuous", () => {
    const reached = new Set(
      SESSION_STATES.map((s) => stateOf(PREFIX[s].activities, PREFIX[s].now)),
    );
    expect([...reached].sort()).toEqual([...SESSION_STATES].sort());
  });

  it("covers every activity type, so the sweep above has no blind spot", () => {
    expect(Object.keys(MEANS).sort()).toEqual([...ACTIVITY_TYPES].sort());
    expect(SESSION_STATES.length * ACTIVITY_TYPES.length).toBe(36);
  });
});

describe("recovery from stale, which is the contract that matters", () => {
  const wentQuiet = [activity("prompt", T0), activity("thought", T0 + 5)];
  const quietAt = T0 + 5 + STALE_AFTER_MS;

  it("is stale after thirty minutes of silence", () => {
    expect(stateOf(wentQuiet, quietAt)).toBe("stale");
  });

  it("comes back on any one of the five an agent can emit", () => {
    /*
     * Linear says the stale state is recoverable by sending another agent
     * activity. Not a particular one, so all five are checked.
     */
    for (const type of EMITTABLE_ACTIVITY_TYPES) {
      const recovered = [...wentQuiet, activity(type, quietAt)];
      expect(stateOf(recovered, quietAt), type).toBe(MEANS[type]);
      expect(stateOf(recovered, quietAt), type).not.toBe("stale");
    }
  });

  it("comes back on a person's prompt too, as pending rather than as working", () => {
    // A trailing prompt means the ball is with the agent and the agent has not
    // moved. Reading it as active would claim work that may not have started.
    const nudged = [...wentQuiet, activity("prompt", quietAt)];
    expect(stateOf(nudged, quietAt)).toBe("pending");
  });

  it("goes stale again if the recovery is followed by another thirty minutes", () => {
    // The clock runs from the LAST activity, which is the whole mechanism. If it
    // ran from the session's first, recovery would be permanent and meaningless.
    const recovered = [...wentQuiet, activity("thought", quietAt)];
    expect(stateOf(recovered, quietAt + STALE_AFTER_MS - 1)).toBe("active");
    expect(stateOf(recovered, quietAt + STALE_AFTER_MS)).toBe("stale");
  });

  it("needs no separate call to recover, because there is nothing to clear", () => {
    /*
     * The design claim, asserted. A stored `stale` column would need something to
     * come along and unset it, and the something is always a cron job nobody
     * wrote. Here the same input read at two different instants gives two
     * different answers and no write happened in between.
     */
    const recovered = [...wentQuiet, activity("action", quietAt)];
    expect(stateOf(recovered, quietAt)).toBe("active");
    expect(stateOf(wentQuiet, quietAt)).toBe("stale");
  });

  it("holds no terminal state at all, which is the difference from run-status", () => {
    /*
     * `run-status.ts` exports five terminal statuses and a predicate a query
     * relies on. There is deliberately no equivalent here: `complete` means the
     * agent answered, and a person may answer back.
     */
    for (const from of SESSION_STATES) {
      const { activities, now } = PREFIX[from];
      const continued = [...activities, activity("prompt", now)];
      expect(stateOf(continued, now), `${from} could not be left`).toBe("pending");
    }
  });
});

describe("only the states that mean work-in-flight go stale", () => {
  const longAfter = STALE_AFTER_MS * 4;

  it("escalates active and pending", () => {
    for (const from of ["active", "pending"] as const) {
      const { activities, now } = PREFIX[from];
      expect(stateOf(activities, now + longAfter), from).toBe("stale");
    }
  });

  it("leaves a session waiting on a person exactly where it is", () => {
    /*
     * OURS, NOT LINEAR'S. Linear does not say whether awaitingInput escalates.
     * The colour law here already draws the line: `--mrd-you` means a person is
     * required and `--mrd-agent` means a machine is working. The silence in an
     * awaitingInput session belongs to the person, and painting it stale blames
     * the machine for the human's pause.
     */
    const { activities, now } = PREFIX.awaitingInput;
    expect(stateOf(activities, now + longAfter)).toBe("awaitingInput");
  });

  it("leaves a settled outcome alone, however long ago it settled", () => {
    // Silence after an answer or an error is expected, not worrying.
    for (const from of ["complete", "error"] as const) {
      const { activities, now } = PREFIX[from];
      expect(stateOf(activities, now + longAfter), from).toBe(from);
    }
  });

  it("means one thing only: something was supposed to be happening and nothing is", () => {
    const stalling = SESSION_STATES.filter((from) => {
      const { activities, now } = PREFIX[from];
      return stateOf(activities, now + longAfter) === "stale";
    });
    expect([...stalling].sort()).toEqual(["active", "pending", "stale"]);
  });
});

describe("the ten-second acknowledge clock", () => {
  const opened = [activity("prompt", T0)];

  it("is quiet for the first ten seconds", () => {
    expect(deriveSessionState(opened, T0).unresponsive).toBe(false);
    expect(deriveSessionState(opened, T0 + ACKNOWLEDGE_WITHIN_MS - 1).unresponsive).toBe(false);
  });

  it("fires exactly on the boundary", () => {
    expect(deriveSessionState(opened, T0 + ACKNOWLEDGE_WITHIN_MS).unresponsive).toBe(true);
  });

  it("keeps the session pending rather than inventing a seventh state", () => {
    const snapshot = deriveSessionState(opened, T0 + ACKNOWLEDGE_WITHIN_MS);
    expect(snapshot.state).toBe("pending");
    expect(SESSION_STATES).toContain(snapshot.state);
  });

  it("stops the moment anything is emitted, which is what a thought is for", () => {
    /*
     * Linear's advice is to answer a created event immediately with a thought
     * acknowledging the prompt. This is that advice expressed as a test: one
     * thought, however early, and the session is never unresponsive again.
     */
    const acknowledged = [...opened, activity("thought", T0 + 200)];
    expect(deriveSessionState(acknowledged, T0 + 60_000).unresponsive).toBe(false);
  });

  it("runs on a follow-up prompt too, and that part is ours", () => {
    /*
     * Linear documents this clock for the created event only. A follow-up nobody
     * acknowledged is the same fact one step later, and a person waiting on an
     * answer cannot tell the two situations apart.
     */
    const answered = [
      activity("prompt", T0),
      activity("response", T0 + 5),
      activity("prompt", T0 + 10),
    ];
    expect(deriveSessionState(answered, T0 + 10 + ACKNOWLEDGE_WITHIN_MS).unresponsive).toBe(true);
  });

  it("never fires while the agent is working, erroring or waiting on a person", () => {
    for (const from of ["active", "error", "awaitingInput", "complete"] as const) {
      const { activities, now } = PREFIX[from];
      expect(deriveSessionState(activities, now + 86_400_000).unresponsive, from).toBe(false);
    }
  });

  it("reports unresponsive and stale together rather than choosing", () => {
    /*
     * THE PAYOFF OF KEEPING IT A FLAG. A prompt nobody answered for an hour is
     * both: the agent never started AND it has gone quiet. A seventh state would
     * have forced one of those two facts to be dropped.
     */
    const snapshot = deriveSessionState(opened, T0 + STALE_AFTER_MS);
    expect(snapshot.state).toBe("stale");
    expect(snapshot.unresponsive).toBe(true);
  });

  it("is a shorter fuse than staleness, or it would never be reachable", () => {
    expect(ACKNOWLEDGE_WITHIN_MS).toBeLessThan(STALE_AFTER_MS);
  });

  it("carries the two figures Linear published, not two we picked", () => {
    expect(ACKNOWLEDGE_WITHIN_MS).toBe(10_000);
    expect(STALE_AFTER_MS).toBe(1_800_000);
  });
});

describe("it is total, including on the inputs a real query produces", () => {
  it("reads an empty session as pending and never as unresponsive", () => {
    // There is no prompt, so there is nothing to time from. Saying a session with
    // no activity failed to answer in ten seconds would be an invented fact.
    expect(deriveSessionState([], T0)).toEqual({
      state: "pending",
      unresponsive: false,
      lastActivityAt: null,
    });
  });

  it("reads a newest-first list the same as an oldest-first one", () => {
    /*
     * THE ORDERING TRAP, AND IT IS A REAL HABIT HERE RATHER THAN A HYPOTHETICAL.
     * Feed queries in this repo order newest first because that is what a feed
     * wants, and `relay.ts` sorts descending to find a latest handoff. A module
     * that read the wrong end would pass every hand-built test and be wrong on
     * the first real query.
     */
    const ascending = [
      activity("prompt", T0),
      activity("thought", T0 + 10),
      activity("response", T0 + 20),
    ];
    const descending = [...ascending].reverse();
    expect(stateOf(descending, T0 + 21)).toBe("complete");
    expect(stateOf(descending, T0 + 21)).toBe(stateOf(ascending, T0 + 21));
  });

  it("breaks a tie on identical timestamps by the order it was given", () => {
    const together = [activity("thought", T0), activity("response", T0)];
    expect(stateOf(together, T0)).toBe("complete");
    expect(stateOf([...together].reverse(), T0)).toBe("active");
  });

  it("treats a timeless activity as the most recent thing that happened", () => {
    /*
     * A NaN `at` is what an unparseable timestamp at the edge produces. Sorting it
     * last fails in the safe direction: the session reads as working rather than
     * as whatever it was doing before, and neither clock can fire because there is
     * no time to measure from.
     */
    const timeless = [activity("prompt", T0), activity("thought", Number.NaN)];
    const snapshot = deriveSessionState(timeless, T0 + STALE_AFTER_MS * 10);
    expect(snapshot.state).toBe("active");
    expect(snapshot.unresponsive).toBe(false);
    expect(snapshot.lastActivityAt).toBe(null);
  });

  it("holds its answer when `now` is not a number", () => {
    const opened = [activity("prompt", T0)];
    for (const now of [Number.NaN, Number.POSITIVE_INFINITY]) {
      const snapshot = deriveSessionState(opened, now);
      expect(snapshot.state, String(now)).toBe("pending");
      expect(snapshot.unresponsive, String(now)).toBe(false);
    }
  });

  it("reads a skewed clock as busy rather than as broken", () => {
    /*
     * `now` before the last activity means two clocks disagree. Both comparisons
     * are on `>=` a positive silence, so a negative one escalates nothing.
     * Claiming a session went stale because a server ran ahead would be a surface
     * asserting something that did not happen.
     */
    const working = [activity("prompt", T0), activity("thought", T0 + 60_000)];
    const snapshot = deriveSessionState(working, T0);
    expect(snapshot.state).toBe("active");
    expect(snapshot.unresponsive).toBe(false);
  });

  it("returns the last activity's own timestamp, so a surface can show the silence", () => {
    const working = [activity("prompt", T0), activity("action", T0 + 90_000)];
    expect(deriveSessionState(working, T0 + 120_000).lastActivityAt).toBe(T0 + 90_000);
  });

  it("does not mutate or reorder what it was handed", () => {
    const given = [activity("response", T0 + 10), activity("prompt", T0)];
    const copy = [...given];
    deriveSessionState(given, T0 + 11);
    timelineActivities(given);
    expect(given).toEqual(copy);
  });

  it("returns the same answer for the same input, every time", () => {
    const given = [activity("prompt", T0), activity("thought", T0 + 5)];
    const first = deriveSessionState(given, T0 + 900);
    for (let i = 0; i < 50; i++) expect(deriveSessionState(given, T0 + 900)).toEqual(first);
  });

  it("returns a state from the six for every input tried here", () => {
    const cases: [AgentActivity[], number][] = [
      [[], T0],
      [[activity("prompt", T0)], T0 + STALE_AFTER_MS * 9],
      [[activity("thought", Number.NaN)], Number.NaN],
      [[activity("error", T0)], T0 - 999],
    ];
    for (const [activities, now] of cases) {
      expect(SESSION_STATES).toContain(stateOf(activities, now));
    }
  });
});

describe("ephemeral rows disappear without leaving litter", () => {
  it("is only ever set on a thought or an action", () => {
    // Linear's rule, and here it is the type system rather than a server-side
    // rejection: `{ type: "response", ephemeral: true }` does not compile.
    expect(isEphemeral(activity("thought", T0, true))).toBe(true);
    expect(isEphemeral(activity("action", T0, true))).toBe(true);
    expect(isEphemeral(activity("response", T0))).toBe(false);
    expect(isEphemeral(activity("thought", T0))).toBe(false);
  });

  it("drops a thinking row once the agent says something else", () => {
    /*
     * WHAT THE FLAG IS FOR. A session that thought forty times would otherwise
     * leave forty dead rows between the prompt and the answer, which is how a
     * timeline becomes a scroll nobody reads.
     */
    const session = [
      activity("prompt", T0),
      activity("thought", T0 + 1, true),
      activity("thought", T0 + 2, true),
      activity("response", T0 + 3),
    ];
    expect(timelineActivities(session).map((a) => a.type)).toEqual(["prompt", "response"]);
  });

  it("keeps the newest one, because that is the row a person is reading", () => {
    const session = [activity("prompt", T0), activity("action", T0 + 1, true)];
    expect(timelineActivities(session).map((a) => a.type)).toEqual(["prompt", "action"]);
  });

  it("does not let a person's prompt clear it, which is Linear read literally", () => {
    /*
     * The doc says an ephemeral activity is replaced when the next activity
     * arrives FROM THE AGENT. It is also the better behaviour: the thought is
     * still the last thing the agent said, and dropping it would leave the
     * person's message sitting under silence.
     */
    const session = [
      activity("prompt", T0),
      activity("thought", T0 + 1, true),
      activity("prompt", T0 + 2),
    ];
    expect(timelineActivities(session).map((a) => a.type)).toEqual(["prompt", "thought", "prompt"]);
  });

  it("keeps every row that was never marked ephemeral", () => {
    const session = ACTIVITY_TYPES.map((type, i) => activity(type, T0 + i));
    expect(timelineActivities(session)).toHaveLength(session.length);
  });

  it("still counts an ephemeral row for the session state and the stale clock", () => {
    /*
     * It is evidence the agent is alive; it just does not stay on screen. Linear
     * derives from the last emitted activity without excluding them either. If it
     * did not count, a session thinking hard for forty minutes would read as
     * stale while it was working.
     */
    const thinking = [activity("prompt", T0), activity("thought", T0 + 5, true)];
    expect(stateOf(thinking, T0 + 6)).toBe("active");
    expect(stateOf(thinking, T0 + 5 + STALE_AFTER_MS - 1)).toBe("active");
    expect(deriveSessionState(thinking, T0 + 6).unresponsive).toBe(false);
  });

  it("orders the timeline the same way the derivation does", () => {
    const descending = [activity("response", T0 + 2), activity("prompt", T0)];
    expect(timelineActivities(descending).map((a) => a.type)).toEqual(["prompt", "response"]);
  });

  it("returns an empty timeline for an empty session rather than throwing", () => {
    expect(timelineActivities([])).toEqual([]);
  });
});

describe("it is pure, and stays pure", () => {
  const source = readFileSync(new URL("./agent-activity.ts", import.meta.url), "utf8");

  it("imports nothing at all, so it cannot reach a database or a component", () => {
    /*
     * The item's constraint, asserted rather than trusted. This is the forward
     * vocabulary; the moment it imports the backward one, or a Supabase client,
     * it stops being something a reader can hold in their head.
     */
    expect([...source.matchAll(/^import\s/gm)].length, "agent-activity.ts grew an import").toBe(0);
  });

  /**
   * The source with every comment removed, which is what the two scans below
   * read.
   *
   * NOT AN OPTIMISATION, IT IS THE DIFFERENCE BETWEEN NAMING A THING AND CALLING
   * IT. This module's header names `normalizeRunStatus` on purpose, to tell the
   * next reader which of the two status vocabularies this is and that the wiring
   * between them belongs to somebody else. A scan over raw source read that
   * explanation as the very import it was warning about, and failed. Prose about
   * a dependency is the opposite of a dependency.
   */
  const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

  it("does not reach for run-status, which is a different job", () => {
    /*
     * `run-status.ts` is the spelling layer for the vocabulary the database
     * already holds. Wiring its normaliser onto these states is real work that
     * needs a live database to check, and it belongs to the lane that has one.
     * Folding the two together is the mistake this assertion exists to catch.
     */
    expect(code).not.toContain("normalizeRunStatus");
    expect(code).not.toContain("run-status");
  });

  it("calls nothing that reads the outside world", () => {
    for (const banned of [
      "fetch(",
      "await ",
      "Date.now(",
      "new Date(",
      "Math.random(",
      "process.env",
      ".server",
      "supabase",
    ]) {
      expect(code, `it calls ${banned}`).not.toContain(banned);
    }
  });

  it("takes `now` as a parameter, which is the only reason the clocks are testable", () => {
    expect(code).toContain("now: number");
  });

  it("cites where the vocabulary came from, in the file itself", () => {
    // A lifted information model with no link is indistinguishable from an
    // invented one the next time somebody asks whether a rule is really theirs.
    expect(source).toContain("linear.app/developers/agent-interaction");
    expect(source).toContain("linear.app/developers/agent-best-practices");
  });

  it("says which of the two status vocabularies this is, so neither gets folded in", () => {
    expect(source).toContain("run-status.ts");
  });
});
